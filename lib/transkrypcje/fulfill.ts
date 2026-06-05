import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { downloadAudio, transcribeAudio, transcribeViaWorker } from "./transcribe";
import { analyzeTranscript } from "./summarize";
import { buildPdf } from "./pdf";

function slugify(s: string): string {
  return s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "transkrypcja";
}

// Wysyła gotowy PDF na maila klienta.
// WAŻNE: Resend SDK NIE rzuca wyjątku przy odrzuceniu (np. domena niezweryfikowana) —
// zwraca { error }. Musimy to sprawdzić i rzucić, inaczej job byłby fałszywie "done".
async function sendResultEmail(email: string, title: string, pdf: Uint8Array): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Jakub Chodakowski <hello@jakubchodakowski.com>",
    to: email,
    subject: `Twój tekst gotowy: ${title}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1f24">
        <h2 style="color:#0aa69a">Gotowe! 🎬</h2>
        <p>Cześć,</p>
        <p>Nie musisz oglądać — wszystko, co ważne z tego filmu, masz w załączonym PDF:</p>
        <p style="padding:12px 16px;background:#f4f6f7;border-radius:8px"><b>${title}</b></p>
        <p>W środku: pełna transkrypcja, streszczenie i najważniejsze punkty.</p>
        <p style="color:#6b7280;font-size:13px;margin-top:24px">jakubchodakowski.com</p>
      </div>
    `,
    attachments: [{ filename: `${slugify(title)}.pdf`, content: Buffer.from(pdf) }],
  });
  if (error) {
    throw new Error(`Resend: ${error.name ?? ""} ${error.message ?? JSON.stringify(error)}`);
  }
}

// KROK 1 (po płatności): oznacz job, odpal workera w trybie async i NIE czekaj.
// Worker (Railway) robi pobieranie + Whisper bez limitu czasu i oddzwania na callback.
// Dzięki temu webhook Vercela kończy się w sekundę (limit 60s nie boli długich filmów).
export async function startTranscription(jobId: string, email: string, amount?: number | null): Promise<void> {
  const { data: job, error } = await supabaseAdmin
    .from("transkrypcje_jobs")
    .select("id, url, status")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error(`Job ${jobId} not found`);
  if (job.status === "done" || job.status === "processing") return; // idempotencja (webhook 2x)

  await supabaseAdmin
    .from("transkrypcje_jobs")
    .update({ status: "processing", email, ...(amount != null ? { amount } : {}) })
    .eq("id", jobId);

  const base = process.env.TRANSCRIBE_WORKER_URL;
  if (!base) throw new Error("TRANSCRIBE_WORKER_URL missing");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jakubchodakowski.com";
  const callbackUrl = `${siteUrl.replace(/\/$/, "")}/api/transkrypcje/worker-callback`;

  const res = await fetch(`${base.replace(/\/$/, "")}/transcribe-async`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TRANSCRIBE_WORKER_SECRET ?? ""}`,
    },
    body: JSON.stringify({ url: job.url, jobId, callbackUrl }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    await supabaseAdmin
      .from("transkrypcje_jobs")
      .update({ status: "error", error_message: `worker start: ${res.status} ${detail}`.slice(0, 500) })
      .eq("id", jobId);
    throw new Error(`Worker start failed: ${res.status} ${detail}`);
  }
}

// KROK 2 (callback z workera): mamy transkrypcję -> analiza Claude + PDF + mail.
// To już szybka, tekstowa robota — mieści się w 60s funkcji Vercela.
export async function finalizeJob(jobId: string, title: string, transcript: string): Promise<void> {
  const { data: job, error } = await supabaseAdmin
    .from("transkrypcje_jobs")
    .select("id, url, email, status")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error(`Job ${jobId} not found`);
  if (job.status === "done") return; // idempotencja
  if (!job.email) throw new Error(`Job ${jobId} bez emaila`);

  try {
    const analysis = await analyzeTranscript(transcript, title);
    const pdf = await buildPdf({ title, url: job.url, analysis, transcript });
    await sendResultEmail(job.email, title, pdf);
    await supabaseAdmin.from("transkrypcje_jobs").update({ status: "done", title }).eq("id", jobId);
  } catch (err) {
    await supabaseAdmin
      .from("transkrypcje_jobs")
      .update({ status: "error", error_message: String(err).slice(0, 500) })
      .eq("id", jobId);
    throw err;
  }
}

// Oznacz job jako błędny (callback z workera z błędem pobierania/Whisper).
export async function markJobError(jobId: string, message: string): Promise<void> {
  await supabaseAdmin
    .from("transkrypcje_jobs")
    .update({ status: "error", error_message: String(message).slice(0, 500) })
    .eq("id", jobId);
}

// Wywoływane PO potwierdzonej płatności (Stripe webhook).
// Tu dopiero ponosimy koszty: audio + Whisper + Claude.
export async function fulfillJob(jobId: string, email: string, amount?: number | null): Promise<void> {
  const { data: job, error } = await supabaseAdmin
    .from("transkrypcje_jobs")
    .select("id, url, status")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error(`Job ${jobId} not found`);
  if (job.status === "done") return; // idempotencja (webhook może przyjść 2x)

  await supabaseAdmin
    .from("transkrypcje_jobs")
    .update({ status: "processing", email, ...(amount != null ? { amount } : {}) })
    .eq("id", jobId);

  try {
    // Audio z YouTube: jeśli skonfigurowany worker (Railway) -> tam (omija blokadę
    // YouTube na IP Vercela). W przeciwnym razie próba lokalnie (działa tylko poza Vercelem).
    let title: string;
    let transcript: string;
    if (process.env.TRANSCRIBE_WORKER_URL) {
      ({ title, transcript } = await transcribeViaWorker(job.url));
    } else {
      const dl = await downloadAudio(job.url);
      title = dl.title;
      transcript = await transcribeAudio(dl.buffer);
    }
    const analysis = await analyzeTranscript(transcript, title);
    const pdf = await buildPdf({ title, url: job.url, analysis, transcript });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Jakub Chodakowski <hello@jakubchodakowski.com>",
      to: email,
      subject: `Twój tekst gotowy: ${title}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1f24">
          <h2 style="color:#0aa69a">Gotowe! 🎬</h2>
          <p>Cześć,</p>
          <p>Nie musisz oglądać — wszystko, co ważne z tego filmu, masz w załączonym PDF:</p>
          <p style="padding:12px 16px;background:#f4f6f7;border-radius:8px"><b>${title}</b></p>
          <p>W środku: pełna transkrypcja, streszczenie i najważniejsze punkty.</p>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">jakubchodakowski.com</p>
        </div>
      `,
      attachments: [
        {
          filename: `${slugify(title)}.pdf`,
          content: Buffer.from(pdf),
        },
      ],
    });

    await supabaseAdmin
      .from("transkrypcje_jobs")
      .update({ status: "done", title })
      .eq("id", jobId);
  } catch (err) {
    await supabaseAdmin
      .from("transkrypcje_jobs")
      .update({ status: "error", error_message: String(err).slice(0, 500) })
      .eq("id", jobId);
    throw err;
  }
}
