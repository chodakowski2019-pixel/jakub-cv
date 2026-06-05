import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { finalizeJob, markJobError } from "@/lib/transkrypcje/fulfill";

export const runtime = "nodejs";
export const maxDuration = 60;

// Worker (Railway) oddzwania tu po pobraniu + transkrypcji.
// Body: { jobId, title, transcript } albo { jobId, error }.
// Zabezpieczone tym samym sekretem co worker (TRANSCRIBE_WORKER_SECRET).
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.TRANSCRIBE_WORKER_SECRET || auth !== `Bearer ${process.env.TRANSCRIBE_WORKER_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { jobId?: string; title?: string; transcript?: string; analysisText?: string; error?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const jobId = (body.jobId ?? "").trim();
  if (!jobId) return NextResponse.json({ error: "missing jobId" }, { status: 400 });

  if (body.error) {
    await markJobError(jobId, body.error);
    return NextResponse.json({ received: true });
  }

  // PDF + mail leci po odpowiedzi. Analizę Claude zrobił już worker (analysisText),
  // więc tu zostaje tylko parsowanie + PDF + mail — mieści się w 60s.
  const title = body.title || "Film z YouTube";
  const transcript = body.transcript || "";
  const analysisText = body.analysisText;
  after(async () => {
    try {
      await finalizeJob(jobId, title, transcript, analysisText);
    } catch (err) {
      console.error("finalizeJob failed", jobId, err);
    }
  });

  return NextResponse.json({ received: true });
}
