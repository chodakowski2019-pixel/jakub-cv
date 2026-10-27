import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, handlowcyFirmy, pobierzFirme, rozmowyZespolu } from "@/lib/bruno/firmy";
import { jezykLubDomyslny } from "@/lib/bruno/domeny";
import { etykiety } from "@/lib/bruno/etykiety";
import { statystykiHandlowca, statystykiZespolu } from "@/lib/bruno/zespol";

export const dynamic = "force-dynamic";

// 27.10 (aplikacja mobilna): panel szefa. Te same liczby co /bruno/szef.
// GET            → zespół (kafelki + lista handlowców)
// GET ?kto=email → ostatnie rozmowy jednego handlowca
export async function GET(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: "Zaloguj się." }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!konto || !czySzef(konto)) return NextResponse.json({ ok: false, blad: "Panel szefa jest dla właściciela i dyrektora." }, { status: 403 });
  const E = etykiety(jezykLubDomyslny(konto.jezyk));
  const [firma, handlowcy] = await Promise.all([pobierzFirme(konto.firma_id), handlowcyFirmy(konto.firma_id!)]);
  const rozmowy = await rozmowyZespolu(handlowcy.map((h) => h.email), 30);

  const kto = new URL(req.url).searchParams.get("kto")?.toLowerCase();
  if (kto) {
    const h = handlowcy.find((x) => x.email === kto);
    if (!h) return NextResponse.json({ ok: false, blad: "Nie ma takiego handlowca." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      handlowiec: statystykiHandlowca(h, rozmowy),
      rozmowy: rozmowy
        .filter((r) => r.email === kto && r.status === "zakonczona")
        .sort((a, b) => b.start.localeCompare(a.start))
        .slice(0, 30)
        .map((r) => ({ id: r.id, start: r.start, sekundy: r.sekundy, ocena: r.ocena, poprawka: r.feedback?.poprawka ?? null })),
      nazwy: E.NAZWY,
    });
  }

  const stat = handlowcy.map((h) => statystykiHandlowca(h, rozmowy));
  return NextResponse.json({
    ok: true,
    firma: firma ? { nazwa: firma.naglowek || firma.nazwa, logo: firma.logo_url } : null,
    zespol: statystykiZespolu(stat),
    handlowcy: stat.sort((a, b) => (b.srednia ?? -1) - (a.srednia ?? -1)),
    nazwy: E.NAZWY,
  });
}
