// 11.11 (USER_001): giełda handlowców, cennik kontaktów dla firm. Plik bez importów serwera (czyta go też przeglądarka).
// Kwoty = propozycja po badaniu rynku z 11.11 (kokpit /bruno, sekcja Wycena), do decyzji USER_001. Zmiana ceny = tylko tutaj.

export type Pakiet = { ile: number; cena: number };

/** Pakiety kontaktów, cena w zł. Rosnąco po liczbie kontaktów. */
export const PAKIETY: Pakiet[] = [
  { ile: 1, cena: 99 },
  { ile: 5, cena: 349 },
  { ile: 10, cena: 499 },
];

export const MAKS_WYBRANYCH = PAKIETY[PAKIETY.length - 1].ile;
/** Ile miesięcy niewykorzystane kontakty czekają na koncie firmy. */
export const WAZNOSC_MIES = 12;

/** Najmniejszy pakiet, który pokrywa `ile` kontaktów. */
export function pakietDla(ile: number): Pakiet {
  return PAKIETY.find((p) => p.ile >= ile) ?? PAKIETY[PAKIETY.length - 1];
}

export function pakietPoLiczbie(ile: unknown): Pakiet | null {
  return PAKIETY.find((p) => p.ile === Number(ile)) ?? null;
}

/** „1 kontakt”, „3 kontakty”, „5 kontaktów”. */
export function kontaktow(n: number): string {
  const j = n % 10;
  const d = n % 100;
  if (n === 1) return "1 kontakt";
  return `${n} ${j >= 2 && j <= 4 && (d < 12 || d > 14) ? "kontakty" : "kontaktów"}`;
}

/** 12.11 (USER_001): odpowiedź na „Komu sprzedajesz?” jako znaczki: Firmom = B2B, Klientom indywidualnym = B2C, Jednym i drugim = oba. */
export function znaczkiRynku(rynek: string): string[] {
  if (rynek === "Firmom") return ["B2B"];
  if (rynek === "Klientom indywidualnym") return ["B2C"];
  return rynek ? ["B2B", "B2C"] : [];
}

/** „1 handlowiec”, „3 handlowców”. */
export function handlowcow(n: number): string {
  return n === 1 ? "1 handlowiec" : `${n} handlowców`;
}
