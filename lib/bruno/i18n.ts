// 11.10 (USER_001): Bruno w dwóch językach. EN = salesbruno.com, PL = salesbruno.pl.
// Jeden wzorzec w całym kodzie: tekst w miejscu użycia, oba języki obok siebie: t("Save", "Zapisz").
// Bez słowników w osobnych plikach: przy zmianie tekstu widać od razu obie wersje.
// Plik bez zależności serwerowych (czyta go przeglądarka i serwer).

import type { Jezyk } from "./domeny";

export type { Jezyk };
export type T = (en: string, pl: string) => string;

/** Funkcja tłumacząca dla danego języka. */
export function tDla(jezyk: Jezyk | string | null | undefined): T {
  return jezyk === "pl" ? (_en, pl) => pl : (en) => en;
}

/** Liczba mnoga. EN: 1 call / 2 calls. PL: 1 rozmowa / 2-4 rozmowy / 5+ rozmów (12-14 = rozmów). */
export function mnoga(jezyk: Jezyk | string | null | undefined, n: number, en: [string, string], pl: [string, string, string]): string {
  if (jezyk !== "pl") return n === 1 ? en[0] : en[1];
  if (n === 1) return pl[0];
  const d = n % 10;
  const s = n % 100;
  return d >= 2 && d <= 4 && (s < 12 || s > 14) ? pl[1] : pl[2];
}

/** Locale do dat i liczb. */
export function locale(jezyk: Jezyk | string | null | undefined): string {
  return jezyk === "pl" ? "pl-PL" : "en-US";
}
