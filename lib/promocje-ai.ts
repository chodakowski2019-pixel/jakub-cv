import fs from "node:fs";
import path from "node:path";
import { narzedzie, type Narzedzie } from "@/lib/narzedzia-ai";

// 25.11.2026 (USER_001: „lec i rob”, wzorzec: blackweek.ai): promocje Black Week w katalogu /ai.
// Dane: content/narzedzia-ai/_promocje.json (wpis TYLKO po sprawdzeniu na stronie producenta, z cytatem).
// Skaner (scripts/promocje-skaner.mjs) WYŁĄCZONY 25.11.2026 (USER_001: „na razie skaner wyłączamy”): strona go nie czyta, promocje wpisuje się ręcznie po sprawdzeniu u producenta.
// Link afiliacyjny: pole `link_afiliacyjny`. Puste = zwykły link do oferty producenta, bez oznaczenia reklamy.
//
// Strony są statyczne (budowane przy wdrożeniu), więc „czy promocja jeszcze trwa” liczy PRZEGLĄDARKA
// (app/ai/black-week/ranking.tsx, app/ai/promo-baner.tsx, app/ai/lista.tsx). Tutaj tylko daty.

export const BAZA_BLACK_WEEK = "/ai/black-week";
/** Koniec Black Week 2026: poniedziałek 30.11 (Cyber Monday), do końca dnia czasu polskiego. */
export const KONIEC_BLACK_WEEK = "2026-11-30T23:59:59+01:00";
export const START_BLACK_WEEK = "2026-11-23T00:00:00+01:00";
/** Oferta bez daty końca u producenta: po tym dniu nie pokazujemy jej poza stroną Black Week, a tam dostaje dopisek „sprawdź u producenta”. */
export const KONIEC_BEZ_DATY = "2026-12-01";

/** Koniec dnia czasu polskiego (zima = UTC+1) dla daty RRRR-MM-DD. */
export const koniecDnia = (d: string) => `${d}T23:59:59+01:00`;

export type Kod = { etykieta: string; kod: string };

export type Promocja = {
  slug: string;
  /** Opcjonalne słowo + liczba z procentem, np. „do 55%”, „dodatkowe 30%”. */
  rabat: string;
  opis: string;
  ceny: string;
  /** RRRR-MM-DD albo null, gdy strona producenta nie podaje końca. */
  do: string | null;
  kody: Kod[];
  warunki: string;
  zrodlo: string;
  cytat: string;
  linkAfiliacyjny: string;
};

export type PromocjaZNarzedziem = Promocja & {
  n: Narzedzie;
  /** Słowo przed liczbą („do”, „dodatkowe”) albo pusty tekst. */
  rabatPrzed: string;
  rabatLiczba: number;
  /** Do kiedy pokazywać ofertę jako trwającą (ISO z godziną). */
  koniec: string;
  link: string;
  reklama: boolean;
};

type Plik = { sprawdzono: string; promocje: (Omit<Promocja, "linkAfiliacyjny" | "kody"> & { link_afiliacyjny?: string; kody?: Kod[] })[] };
const KAT = path.join(process.cwd(), "content", "narzedzia-ai");

function czytaj<T>(nazwa: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(KAT, nazwa), "utf8")) as T;
  } catch {
    return null;
  }
}

function zUtm(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "jakubchodakowski.com");
    u.searchParams.set("utm_medium", "katalog-ai");
    u.searchParams.set("utm_campaign", "black-week-2026");
    return u.toString();
  } catch {
    return url;
  }
}

export function sprawdzonoPromocje(): string {
  return czytaj<Plik>("_promocje.json")?.sprawdzono ?? "";
}

export function wszystkiePromocje(): PromocjaZNarzedziem[] {
  const p = czytaj<Plik>("_promocje.json");
  if (!p) return [];
  return p.promocje
    .map((x) => {
      const n = narzedzie(x.slug);
      if (!n) return null;
      const aff = x.link_afiliacyjny ?? "";
      const m = x.rabat.match(/^(.*?)\s*(\d+(?:[.,]\d+)?)\s*%/);
      return {
        ...x,
        kody: (x.kody ?? []).filter((k) => k.kod),
        linkAfiliacyjny: aff,
        n,
        rabatPrzed: m ? m[1].trim() : "",
        rabatLiczba: m ? Number(m[2].replace(",", ".")) : 0,
        koniec: koniecDnia(x.do ?? KONIEC_BEZ_DATY),
        link: aff || zUtm(x.zrodlo),
        reklama: Boolean(aff),
      } satisfies PromocjaZNarzedziem;
    })
    .filter((x): x is PromocjaZNarzedziem => x !== null);
}

/** Promocja narzędzia, o ile w chwili budowania strony jeszcze trwa. Po tej dacie baner chowa przeglądarka. */
export function promocjaNarzedzia(slug: string): PromocjaZNarzedziem | undefined {
  return wszystkiePromocje().find((p) => p.slug === slug && Date.now() < new Date(p.koniec).getTime());
}
