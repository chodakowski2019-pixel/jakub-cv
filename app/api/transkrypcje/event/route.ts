import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED = ["page_view", "generate_click", "pay_click"];

// Loguje kliknięcie/wejście do lejka. Best-effort, nie blokuje UI.
export async function POST(req: NextRequest) {
  let body: { type?: string; jobId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const type = String(body.type ?? "");
  if (!ALLOWED.includes(type)) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await supabaseAdmin
      .from("transkrypcje_events")
      .insert({ type, job_id: body.jobId ?? null });
  } catch (err) {
    console.error("event insert failed", err);
  }
  return NextResponse.json({ ok: true });
}
