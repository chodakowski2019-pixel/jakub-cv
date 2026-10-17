import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { wierszOferty } from "@/lib/bruno/praca/oferty-firm";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/firma/zgloszenie (17.10): pracodawca zmienia status zgłoszenia na swoją ofertę.
const STATUSY = ["nowe", "obejrzane", "zaproszone", "odrzucone"];

export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || konto.typ !== "pracodawca") return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!STATUSY.includes(b.status)) return NextResponse.json({ ok: false }, { status: 400 });
  const { data: z } = await supabaseAdmin.from("praca_zgloszenia").select("id,oferta_id").eq("id", String(b.id ?? "")).maybeSingle();
  const w = z ? await wierszOferty(z.oferta_id) : null;
  if (!z || !w || w.konto_id !== konto.id) return NextResponse.json({ ok: false }, { status: 404 });
  await supabaseAdmin.from("praca_zgloszenia").update({ status: b.status }).eq("id", z.id);
  return NextResponse.json({ ok: true });
}
