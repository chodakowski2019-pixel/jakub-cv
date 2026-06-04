import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { downloadAudio, transcribeAudio } from "./transcribe";
import { analyzeTranscript } from "./summarize";
import { buildPdf } from "./pdf";

function slugify(s: string): string {
  return s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "transkrypcja";
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
    const { buffer, title } = await downloadAudio(job.url);
    const transcript = await transcribeAudio(buffer);
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
