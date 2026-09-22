import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { startTranscription } from "@/lib/transkrypcje/fulfill";

export const runtime = "nodejs";
export const maxDuration = 60;

// TYMCZASOWY endpoint testowy (async, bez płatności). USUNĄĆ po teście.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== process.env.TRANSCRIBE_WORKER_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = searchParams.get("email");
  const url = searchParams.get("url") ?? "https://www.youtube.com/watch?v=jNQXAC9IVRw";
  if (!email) {
    return NextResponse.json({ error: "missing email" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("transkrypcje_jobs")
    .insert({ url, status: "pending" })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: `insert failed: ${error?.message}` }, { status: 500 });
  }

  try {
    await startTranscription(data.id, email, 0);
    return NextResponse.json({ ok: true, jobId: data.id, email, url });
  } catch (err) {
    return NextResponse.json({ ok: false, jobId: data.id, error: String(err) }, { status: 500 });
  }
}
