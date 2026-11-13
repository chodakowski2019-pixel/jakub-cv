// 11.11 (USER_001): giełda handlowców, cennik kontaktów dla firm. Plik bez importów serwera (czyta go też przeglądarka).
// 12.11 (USER_001, decyzja): paczka 3 handlowców = 149 zł, subskrypcja = 290 zł / mies., gwarancja 5 handlowców w 30 dni
// albo zwrot = 990 zł. Ceny brutto. 13.11 (USER_001): subskrypcja = dosyłamy nowych dopasowanych, minimum 70 % dopasowania. Zastępuje pakiety 1 / 5 / 10 (99 / 349 / 499 zł). Zmiana ceny = tylko tutaj.

export type Pakiet = { ile: number; cena: number };

/** Paczka kontaktów: jednorazowo, 3 handlowców. */
export const PACZKA: Pakiet = { ile: 3, cena: 149 };
/** Pakiety kontaktów, cena w zł. Rosnąco po liczbie kontaktów. */
export const PAKIETY: Pakiet[] = [PACZKA];
/** Subskrypcja, zł / mies.: dosyłamy kontakty do NOWYCH handlowców (dołączyli po zakupie) z dopasowaniem od SUBSKRYPCJA_PROG %. */
export const SUBSKRYPCJA_ZL = 290;
export const SUBSKRYPCJA_PROG = 70;
/** Gwarancja: `ile` dopasowanych handlowców w `dni` dni albo zwrot całej kwoty. */
export const GWARANCJA = { cena: 990, ile: 5, dni: 30 };

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
