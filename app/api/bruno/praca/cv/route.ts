import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { linkCV, zalogowanePraca } from "@/lib/bruno/praca/konta";
import { wierszOferty } from "@/lib/bruno/praca/oferty-firm";

export const dynamic = "force-dynamic";

// GET /api/bruno/praca/cv?z=<id zgłoszenia> (pracodawca, tylko swoje oferty) albo ?moje=1 (kandydat, swoje CV z profilu).
// Przekierowanie na podpisany link ważny 5 minut. Zgłoszenie oznacza się jako „obejrzane”.
export async function GET(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto) return NextResponse.json({ ok: false }, { status: 401 });
  const u = new URL(req.url);
  if (u.searchParams.get("moje") && konto.cv_sciezka) {
    const l = await linkCV(konto.cv_sciezka);
    return l ? NextResponse.redirect(l) : NextResponse.json({ ok: false }, { status: 404 });
  }
  const { data: z } = await supabaseAdmin.from("praca_zgloszenia").select("id,oferta_id,cv_sciezka,status,kandydat_id").eq("id", u.searchParams.get("z") ?? "").maybeSingle();
  if (!z?.cv_sciezka) return NextResponse.json({ ok: false }, { status: 404 });
  const w = await wierszOferty(z.oferta_id);
  const wolno = (konto.typ === "pracodawca" && w?.konto_id === konto.id) || (konto.typ === "kandydat" && z.kandydat_id === konto.id);
  if (!wolno) return NextResponse.json({ ok: false }, { status: 403 });
  if (konto.typ === "pracodawca" && z.status === "nowe") await supabaseAdmin.from("praca_zgloszenia").update({ status: "obejrzane" }).eq("id", z.id);
  const l = await linkCV(z.cv_sciezka);
  return l ? NextResponse.redirect(l) : NextResponse.json({ ok: false }, { status: 404 });
}
