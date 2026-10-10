import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Inter, Outfit } from "next/font/google";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { zapiszWejscie, zrodloZParametru } from "@/lib/bruno/wejscia";
import { pelnyDostep, pobierzKonto, stanDostepu, zamknijPorzucone } from "@/lib/bruno/db";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelA from "@/components/podglad/panel/panel-a";
import TourPopup from "@/components/bruno/tour-popup";
import { FILM_OKLADKA, FILM_OPROWADZAJACY } from "@/lib/bruno/film";

export const dynamic = "force-dynamic";

// 10.10 (USER_001): panel w wyglądzie CZARNY ZE ZŁOTYM (podgląd /podglad/bruno-panel-zloty).
// Dane: components/podglad/panel/dane.ts (te same funkcje z lib/bruno co poprzedni panel).
// Układ /bruno nie dokłada tu starego paska, tła ani stopki (nagłówek x-sciezka z proxy.ts).

const inter = Inter({ variable: "--font-bpa", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });
const outfit = Outfit({ variable: "--font-bpa-head", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });

export default async function BrunoPanelPage({ searchParams }: { searchParams: Promise<{ tour?: string; src?: string }> }) {
  const { tour, src } = await searchParams;
  const email = await zalogowanyEmail();
  // Niezalogowany z linku w mailu: źródło jedzie na stronę logowania, formularz odda je do logu (E18).
  if (!email) redirect(src ? `/bruno?src=${encodeURIComponent(src)}` : "/bruno");
  // Zalogowany wszedł z linku w mailu: zapis wejścia (E18).
  const zrodlo = zrodloZParametru(src);
  if (zrodlo) await zapiszWejscie({ email, rodzaj: "wejscie", zrodlo, agent: (await headers()).get("user-agent") });

  const konto = await pobierzKonto(email);
  if (konto && stanDostepu(konto).aktywny) await zamknijPorzucone(email);
  const d = await danePanelu();
  // Popup z filmem: przy pierwszym wejściu albo na życzenie (?tour=1 z Ustawień).
  const pokazTour = !d.wygasl && (tour === "1" || !konto?.tour_obejrzany_at);

  return (
    <div className={`${inter.variable} ${outfit.variable}`} style={{ display: "contents" }}>
      {pokazTour && <TourPopup src={FILM_OPROWADZAJACY} okladka={FILM_OKLADKA} />}
      <PanelA d={d} lp szklo zloty pelny={pelnyDostep(konto)} />
    </div>
  );
}
