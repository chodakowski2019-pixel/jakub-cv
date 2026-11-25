import fs from "node:fs";
import path from "node:path";
import { narzedzie, type Narzedzie } from "@/lib/narzedzia-ai";

// 25.11.2026 (USER_001: „lec i rob”, wzorzec: blackweek.ai): promocje Black Week w katalogu /ai.
// Dane: content/narzedzia-ai/_promocje.json (wpis TYLKO po sprawdzeniu na stronie producenta, z cytatem).
// Skan pomocniczy: scripts/promocje-skaner.mjs → _skan.json (surowy ślad dla człowieka, na stronie tylko liczby i godzina).
// Link afiliacyjny: pole `link_afiliacyjny`. Puste = zwykły link do oferty producenta, bez oznaczenia reklamy.

export const BAZA_BLACK_WEEK = "/ai/black-week";
/** Koniec Black Week 2026: poniedziałek 30.11 (Cyber Monday), do końca dnia czasu polskiego. */
export const KONIEC_BLACK_WEEK = "2026-11-30T23:59:59+01:00";
export const START_BLACK_WEEK = "2026-11-23T00:00:00+01:00";

export type Promocja = {
  slug: string;
  rabat: string;
  opis: string;
  ceny: string;
  /** ISO (YYYY-MM-DD) albo null, gdy strona producenta nie podaje końca. */
  do: string | null;
  kod: string;
  warunki: string;
  zrodlo: string;
  cytat: string;
  linkAfiliacyjny: string;
};

export type PromocjaZNarzedziem = Promocja & { n: Narzedzie; wygasla: boolean; link: string; reklama: boolean };

type Plik = { sprawdzono: string; promocje: (Omit<Promocja, "linkAfiliacyjny"> & { link_afiliacyjny?: string })[] };
const KAT = path.join(process.cwd(), "content", "narzedzia-ai");

function czytaj<T>(nazwa: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(KAT, nazwa), "utf8")) as T;
  } catch {
    return null;
  }
}

/** Czy promocja z datą końca już minęła (koniec dnia czasu polskiego). Bez daty = nie wiadomo, pokazujemy jako aktywną. */
export function czyWygasla(doDnia: string | null, teraz = Date.now()) {
  return doDnia ? teraz > new Date(`${doDnia}T23:59:59+01:00`).getTime() : false;
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
      return {
        ...x,
        linkAfiliacyjny: aff,
        n,
        wygasla: czyWygasla(x.do),
        link: aff || zUtm(x.zrodlo),
        reklama: Boolean(aff),
      } satisfies PromocjaZNarzedziem;
    })
    .filter((x): x is PromocjaZNarzedziem => x !== null);
}

export function promocjaNarzedzia(slug: string): PromocjaZNarzedziem | undefined {
  return wszystkiePromocje().find((p) => p.slug === slug && !p.wygasla);
}

export function statystykaSkanu() {
  const s = czytaj<{ skan: string; adresow: number; wyniki: { status: string; odczytane: number }[] }>("_skan.json");
  if (!s) return null;
  return {
    skan: s.skan,
    narzedzi: s.adresow,
    odczytane: s.wyniki.filter((w) => w.odczytane > 0).length,
    blokada: s.wyniki.filter((w) => w.status === "blokada").length,
  };
}
