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
/** Gwarancja: `ile` handlowców z dopasowaniem PONAD `prog` % w `dni` dni albo zwrot całej kwoty (próg: USER_001 13.11). */
export const GWARANCJA = { cena: 990, ile: 5, dni: 30, prog: 90 };

/** 17.11 (USER_001): pakiety handlowców dla firm, płatność JEDNORAZOWA. Zastępują w wyszukiwarce paczkę 149 zł, subskrypcję i gwarancję.
 * W bazie zapisane jako zlecenie rodzaju "gwarancja" (stary check w praca_zlecenia), pakiet rozpoznajemy po kwocie (`pakietFirmyPoKwocie`).
 * `podKlienta` = nagrania sprzedażowe pod klienta firmy. Kontakty do handlowców z dopasowaniem od PAKIET_PROG % odblokowują się same,
 * nagrania pod klienta robimy ręcznie do `dni` dni od zakupu. */
export type PakietFirmy = { klucz: "s" | "m" | "l"; /** 17.11 (USER_001): Basic / Pro / VIP */ nazwa: string; ile: number; cena: number; dni: number; podKlienta: boolean };
export const PAKIETY_FIRM: PakietFirmy[] = [
  { klucz: "s", nazwa: "Basic", ile: 3, cena: 500, dni: 7, podKlienta: true },
  { klucz: "m", nazwa: "Pro", ile: 10, cena: 1000, dni: 14, podKlienta: true },
  { klucz: "l", nazwa: "VIP", ile: 20, cena: 1500, dni: 60, podKlienta: true },
];
/** Minimalne dopasowanie handlowca do firmy w pakiecie (USER_001 17.11: min. 80 %). Też próg automatycznego odblokowania. */
export const PAKIET_PROG = 80;
export function pakietFirmyPoKluczu(k: unknown): PakietFirmy | null {
  return PAKIETY_FIRM.find((p) => p.klucz === k) ?? null;
}
export function pakietFirmyPoKwocie(kwotaGr: number): PakietFirmy | null {
  return PAKIETY_FIRM.find((p) => p.cena * 100 === kwotaGr) ?? null;
}

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
