import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizujEmail, nowyKod, poprawnyKod, zaszyfrujKod } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";
import { htmlDostep, mailDziala, wyslij } from "@/lib/bruno/mail";
import { postacLubDomyslna } from "@/lib/bruno/postacie";

export const dynamic = "force-dynamic";

// Panel USER_001: zakłada konto testera, nadaje kod logowania i wstępną
// konfigurację z ankiety. Klucz = STATS_KEY (już w env Vercela), w nagłówku
// x-klucz albo ?k=.
function autoryzowany(req: Request) {
  const k = process.env.STATS_KEY;
  if (!k) return false;
  return req.headers.get("x-klucz") === k || new URL(req.url).searchParams.get("k") === k;
}

export async function GET(req: Request) {
  if (!autoryzowany(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: konta } = await supabaseAdmin
    .from("bruno_konta")
    .select("email, imie, firma, start_dostepu, dni, limit_sekund, aktywne, utworzono")
    .order("utworzono", { ascending: false });
  const { data: rozmowy } = await supabaseAdmin.from("bruno_rozmowy").select("email, status, sekundy, ocena, start");
  const { data: zaint } = await supabaseAdmin.from("bruno_zainteresowani").select("*").order("utworzono", { ascending: false });
  return NextResponse.json({ ok: true, konta, rozmowy, zainteresowani: zaint });
}

export async function POST(req: Request) {
  if (!autoryzowany(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const email = normalizujEmail(b.email);
  if (!email) return NextResponse.json({ ok: false, blad: "Zły e-mail." }, { status: 400 });

  const istnieje = await pobierzKonto(email);
  // Kod: podany ręcznie, wylosowany dla nowego konta, albo zostaje stary.
  const podany = poprawnyKod(b.kod);
  const kod = podany ?? (istnieje?.kod_hash ? null : nowyKod());

  const konto = {
    email,
    imie: String(b.imie ?? "").slice(0, 80) || null,
    firma: String(b.firma ?? "").slice(0, 120) || null,
    dni: Math.min(90, Math.max(1, Number(b.dni) || 7)),
    limit_sekund: Math.min(36_000, Math.max(180, Number(b.limit_sekund) || 3780)),
    rozmow_dziennie: Math.min(100, Math.max(1, Number(b.rozmow_dziennie) || 3)),
    fiszek_dziennie: Math.min(200, Math.max(1, Number(b.fiszek_dziennie) || 5)),
    aktywne: b.aktywne === undefined ? true : Boolean(b.aktywne),
    ...(kod ? { kod_hash: zaszyfrujKod(kod), nieudane: 0, blokada_do: null } : {}),
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

  // Mail z dostępem idzie tylko wtedy, gdy kod jest nowy: inaczej nie mamy go
  // czym wpisać (w bazie leży sam skrót).
  let mail: "wyslany" | "pominiety" | "blad" = "pominiety";
  if (kod && b.wyslij_mail !== false && mailDziala()) {
    try {
      await wyslij({
        do: email,
        temat: "Twój dostęp do Bruno AI",
        html: htmlDostep({
          imie: konto.imie,
          email,
          kod,
          dni: konto.dni,
          rozmowDziennie: konto.rozmow_dziennie,
          fiszekDziennie: konto.fiszek_dziennie,
        }),
      });
      mail = "wyslany";
    } catch (e) {
      console.error("[bruno admin] mail", e);
      mail = "blad";
    }
  }

  return NextResponse.json({ ok: true, email, kod, mail });
}
