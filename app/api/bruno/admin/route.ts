import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizujEmail } from "@/lib/bruno/auth";
import { zapewnijKarty } from "@/lib/bruno/fsrs";
import { postacLubDomyslna } from "@/lib/bruno/postacie";

export const dynamic = "force-dynamic";

// Panel USER_001: zakłada konto testera i wstępną konfigurację z ankiety.
// Klucz = STATS_KEY (już w env Vercela), w nagłówku x-klucz albo ?k=.
function autoryzowany(req: Request) {
  const k = process.env.STATS_KEY;
  if (!k) return false;
  return req.headers.get("x-klucz") === k || new URL(req.url).searchParams.get("k") === k;
}

export async function GET(req: Request) {
  if (!autoryzowany(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: konta } = await supabaseAdmin.from("bruno_konta").select("*").order("utworzono", { ascending: false });
  const { data: rozmowy } = await supabaseAdmin.from("bruno_rozmowy").select("email, status, sekundy, ocena, start");
  const { data: zaint } = await supabaseAdmin.from("bruno_zainteresowani").select("*").order("utworzono", { ascending: false });
  return NextResponse.json({ ok: true, konta, rozmowy, zainteresowani: zaint });
}

export async function POST(req: Request) {
  if (!autoryzowany(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const email = normalizujEmail(b.email);
  if (!email) return NextResponse.json({ ok: false, blad: "Zły e-mail." }, { status: 400 });

  const konto = {
    email,
    imie: String(b.imie ?? "").slice(0, 80) || null,
    firma: String(b.firma ?? "").slice(0, 120) || null,
    dni: Math.min(90, Math.max(1, Number(b.dni) || 7)),
    limit_sekund: Math.min(36_000, Math.max(300, Number(b.limit_sekund) || 6300)),
    aktywne: b.aktywne === undefined ? true : Boolean(b.aktywne),
  };
  const { error } = await supabaseAdmin.from("bruno_konta").upsert(konto, { onConflict: "email" });
  if (error) return NextResponse.json({ ok: false, blad: error.message }, { status: 500 });

  if (b.konfig && typeof b.konfig === "object") {
    const k = b.konfig;
    const wiersz = {
      email,
      produkt: String(k.produkt ?? "").slice(0, 1500),
      klient: String(k.klient ?? "").slice(0, 2000),
      obiekcje: String(k.obiekcje ?? "").slice(0, 3000),
      udana_rozmowa: String(k.udana_rozmowa ?? "").slice(0, 1000),
      skrypt: String(k.skrypt ?? "").slice(0, 8000),
      postac: postacLubDomyslna(k.postac),
      godzina_przypomnienia: Math.min(22, Math.max(5, Number(k.godzina_przypomnienia) || 8)),
      zaktualizowano: new Date().toISOString(),
    };
    const { error: e2 } = await supabaseAdmin.from("bruno_konfig").upsert(wiersz, { onConflict: "email" });
    if (e2) return NextResponse.json({ ok: false, blad: e2.message }, { status: 500 });
    await zapewnijKarty(email, wiersz);
  }
  return NextResponse.json({ ok: true, email });
}
