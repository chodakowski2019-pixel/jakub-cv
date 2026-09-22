import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TYMCZASOWY endpoint diagnostyczny — usunąć po debugu. Bez PII (brak maili).
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("t") !== "diag9f2x") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const { data, error } = await supabaseAdmin
    .from("transkrypcje_jobs")
    .select("status, error_message, amount, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  return NextResponse.json({ dbError: error?.message ?? null, jobs: data ?? [] });
}
