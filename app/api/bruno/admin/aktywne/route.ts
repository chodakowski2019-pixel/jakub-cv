import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizujEmail } from "@/lib/bruno/auth";

export const dynamic = "force-dynamic";

// 17.10 (USER_001): włącz / wyłącz konto jednym kliknięciem w Adminie (nic nie kasuje).
function autoryzowany(req: Request) {
  const k = process.env.STATS_KEY;
  if (!k) return false;
  return req.headers.get("x-klucz") === k || new URL(req.url).searchParams.get("k") === k;
}

export async function POST(req: Request) {
  if (!autoryzowany(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { email?: unknown; aktywne?: unknown };
  const email = normalizujEmail(b.email);
  if (!email) return NextResponse.json({ ok: false, blad: "Zły e-mail." }, { status: 400 });
  const { error } = await supabaseAdmin.from("bruno_konta").update({ aktywne: Boolean(b.aktywne) }).eq("email", email);
  if (error) return NextResponse.json({ ok: false, blad: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
