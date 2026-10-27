import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, pobierzRozmowy, stanDostepu, zamknijPorzucone } from "@/lib/bruno/db";
import { kontekstFirmy } from "@/lib/bruno/firmy";
import { jezykLubDomyslny } from "@/lib/bruno/domeny";
import { etykiety } from "@/lib/bruno/etykiety";
import { postacLubDomyslna } from "@/lib/bruno/postacie";
import { danePanelu } from "@/components/podglad/panel/dane";

export const dynamic = "force-dynamic";

// 27.10 (aplikacja mobilna Bruno): wszystko na ekran główny jednym zapytaniem.
// Te same funkcje co panel w przeglądarce (danePanelu), więc liczby są identyczne.
// Logowanie: nagłówek Authorization: Bearer <token> z /api/bruno/login { aplikacja: true }.
export async function GET() {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: "Zaloguj się." }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!konto) return NextResponse.json({ ok: false, blad: "Nie ma takiego konta." }, { status: 401 });
  const jezyk = jezykLubDomyslny(konto.jezyk);
  const aktywny = stanDostepu(konto).aktywny;
  if (aktywny) await zamknijPorzucone(email);

  const [panel, { szef, firma, logo }, rozmowy] = await Promise.all([danePanelu(jezyk), kontekstFirmy(konto), pobierzRozmowy(email, 40)]);
  const E = etykiety(jezyk);

  return NextResponse.json({
    ok: true,
    konto: {
      email,
      imie: konto.imie ?? null,
      jezyk,
      firma: firma?.nazwa ?? konto.firma ?? null,
      logo: logo?.url ?? null,
      zdjecie: konto.zdjecie_url ?? null,
      szef,
      aktywny,
    },
    panel: {
      dziennie: panel.dziennie,
      dzis: panel.dzis,
      zostaloDzis: panel.zostaloDzis,
      planZrobiony: panel.planZrobiony,
      moznaRozmawiac: panel.moznaRozmawiac,
      wygasl: panel.wygasl,
      minutZostalo: panel.minutZostalo,
      powtorka: panel.powtorka,
      ostatnia: panel.ostatnia,
      srednia: panel.srednia,
      ocenionych: panel.ocenionych,
      dni7: panel.dni7.map((d) => ({ etykieta: d.etykieta, rozmow: d.wartosc, srednia: d.srednia })),
    },
    rozmowy: rozmowy.map((r) => ({
      id: r.id,
      start: r.start,
      sekundy: r.sekundy,
      ocena: r.ocena,
      status: r.status,
      postac: E.POSTACIE[postacLubDomyslna(r.postac)].nazwa,
      poprawka: r.feedback?.poprawka ?? null,
    })),
  });
}
