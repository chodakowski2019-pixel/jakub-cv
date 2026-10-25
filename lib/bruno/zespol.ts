import type { Konto, Kryterium, Rozmowa } from "./db";
import { NAZWY } from "./kryteria";

// 25.10 (USER_001): liczby dla panelu szefa. Czyste funkcje, bez bazy (czyta je też przeglądarka).
// Jedna rozmowa = jedna ocena 1-10 i 5 kryteriów; tu liczymy to, co szef widzi w tabeli zespołu:
// rozmowy w 7 dni, średnia, najsłabsze kryterium, trend (3 ostatnie vs 3 wcześniejsze), dni bez treningu.

export const KRYTERIA = Object.keys(NAZWY) as Kryterium["nazwa"][];

export type StatHandlowca = {
  email: string;
  imie: string;
  zdjecie: string | null;
  rozmow7: number;
  rozmow30: number;
  srednia: number | null;
  najlepsza: number | null;
  /** Kryterium z najniższą średnią (po ocenionych rozmowach). */
  najslabsze: Kryterium["nazwa"] | null;
  kryteria: Record<Kryterium["nazwa"], number | null>;
  /** Średnia 3 ostatnich minus średnia 3 wcześniejszych. Null przy mniej niż 4 ocenionych. */
  trend: number | null;
  ostatnia: string | null;
  dniBezTreningu: number | null;
  /** Ostatnia poprawka od trenera (jedna rzecz do poprawy). */
  poprawka: string | null;
};

const zaokr = (v: number) => Math.round(v * 10) / 10;
const srednia = (xs: number[]) => (xs.length ? zaokr(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const DZIEN = 86_400_000;

export function statystykiHandlowca(konto: Pick<Konto, "email" | "imie" | "zdjecie_url">, rozmowy: Rozmowa[]): StatHandlowca {
  const moje = rozmowy.filter((r) => r.email === konto.email && r.status === "zakonczona").sort((a, b) => b.start.localeCompare(a.start));
  const ocenione = moje.filter((r) => typeof r.ocena === "number");
  const oceny = ocenione.map((r) => r.ocena as number);
  const teraz = Date.now();
  const od7 = teraz - 7 * DZIEN;

  const kryteria = Object.fromEntries(
    KRYTERIA.map((n) => [n, srednia(ocenione.flatMap((r) => r.feedback?.kryteria?.filter((k) => k.nazwa === n).map((k) => k.ocena) ?? []))]),
  ) as Record<Kryterium["nazwa"], number | null>;
  const zOcena = KRYTERIA.filter((n) => kryteria[n] !== null);
  const najslabsze = zOcena.length ? zOcena.reduce((a, b) => ((kryteria[a] ?? 10) <= (kryteria[b] ?? 10) ? a : b)) : null;

  let trend: number | null = null;
  if (oceny.length >= 4) {
    const ost = srednia(oceny.slice(0, 3)) ?? 0;
    const wcz = srednia(oceny.slice(3, 6)) ?? 0;
    trend = zaokr(ost - wcz);
  }
  const ostatnia = moje[0]?.start ?? null;
  return {
    email: konto.email,
    imie: konto.imie?.trim() || konto.email.split("@")[0],
    zdjecie: konto.zdjecie_url ?? null,
    rozmow7: moje.filter((r) => new Date(r.start).getTime() >= od7).length,
    rozmow30: moje.length,
    srednia: srednia(oceny),
    najlepsza: oceny.length ? Math.max(...oceny) : null,
    najslabsze,
    kryteria,
    trend,
    ostatnia,
    dniBezTreningu: ostatnia ? Math.max(0, Math.floor((teraz - new Date(ostatnia).getTime()) / DZIEN)) : null,
    poprawka: ocenione[0]?.feedback?.poprawka?.trim() || null,
  };
}

// 25.10 (USER_001: „lepsza wizualizacja panelu”): serie do wykresów panelu szefa.
const kluczPL = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
export type PunktDnia = { dzien: string; srednia: number | null; rozmow: number };

/** Średnia ocen zespołu i liczba rozmów na każdy z ostatnich `dni` dni (dzień bez rozmów: srednia null). */
export function seriaZespolu(rozmowy: Rozmowa[], dni = 30): PunktDnia[] {
  const mapa = new Map<string, number[]>();
  for (const r of rozmowy) {
    if (r.status !== "zakonczona") continue;
    const k = kluczPL(new Date(r.start));
    if (!mapa.has(k)) mapa.set(k, []);
    if (typeof r.ocena === "number") mapa.get(k)!.push(r.ocena);
    else mapa.get(k)!.push(NaN);
  }
  const wynik: PunktDnia[] = [];
  for (let i = dni - 1; i >= 0; i--) {
    const k = kluczPL(new Date(Date.now() - i * DZIEN));
    const v = mapa.get(k) ?? [];
    wynik.push({ dzien: k, srednia: srednia(v.filter((x) => !Number.isNaN(x))), rozmow: v.length });
  }
  return wynik;
}

/** Rozmowy handlowca na każdy z ostatnich `dni` dni (siatka aktywności). */
export function aktywnoscHandlowca(email: string, rozmowy: Rozmowa[], dni = 14): number[] {
  const licz = new Map<string, number>();
  for (const r of rozmowy) if (r.email === email && r.status === "zakonczona") licz.set(kluczPL(new Date(r.start)), (licz.get(kluczPL(new Date(r.start))) ?? 0) + 1);
  return Array.from({ length: dni }, (_, i) => licz.get(kluczPL(new Date(Date.now() - (dni - 1 - i) * DZIEN))) ?? 0);
}

/** Oceny handlowca od najstarszej do najnowszej (mini-wykres w tabeli). */
export function ocenyHandlowca(email: string, rozmowy: Rozmowa[]): number[] {
  return rozmowy.filter((r) => r.email === email && typeof r.ocena === "number").sort((a, b) => a.start.localeCompare(b.start)).map((r) => r.ocena as number);
}

export type StatZespolu = {
  handlowcow: number;
  rozmow7: number;
  srednia: number | null;
  najslabsze: Kryterium["nazwa"] | null;
  /** Ilu nie trenowało od co najmniej 3 dni (albo nigdy). */
  nieCwicza: number;
  kryteria: Record<Kryterium["nazwa"], number | null>;
};

export const DNI_BEZ_TRENINGU_ALARM = 3;

export function statystykiZespolu(stat: StatHandlowca[]): StatZespolu {
  const kryteria = Object.fromEntries(KRYTERIA.map((n) => [n, srednia(stat.map((s) => s.kryteria[n]).filter((v): v is number => v !== null))])) as Record<Kryterium["nazwa"], number | null>;
  const zOcena = KRYTERIA.filter((n) => kryteria[n] !== null);
  return {
    handlowcow: stat.length,
    rozmow7: stat.reduce((a, s) => a + s.rozmow7, 0),
    srednia: srednia(stat.map((s) => s.srednia).filter((v): v is number => v !== null)),
    najslabsze: zOcena.length ? zOcena.reduce((a, b) => ((kryteria[a] ?? 10) <= (kryteria[b] ?? 10) ? a : b)) : null,
    nieCwicza: stat.filter((s) => s.dniBezTreningu === null || s.dniBezTreningu >= DNI_BEZ_TRENINGU_ALARM).length,
    kryteria,
  };
}
