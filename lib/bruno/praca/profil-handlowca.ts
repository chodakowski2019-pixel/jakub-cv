// 11.11 (USER_001): baza handlowców. Pytania formularza po założeniu konta (/praca/dolacz/profil) i sprawdzanie odpowiedzi.
// Ten plik czyta formularz w przeglądarce i API (bez importów serwera). Zapis: tabela praca_profile_handlowcow.

export const DNI_WERYFIKACJI = 7;

// Pliki w kroku „Kontakt” (oba nieobowiązkowe). Razem muszą zmieścić się w limicie 4,5 MB na jedno żądanie na Vercelu,
// dlatego zdjęcie formularz zmniejsza w przeglądarce do FOTO_BOK px i wysyła jako JPEG.
export const CV_MAKS_B = 3 * 1024 * 1024;
export const FOTO_MAKS_B = 1024 * 1024;
export const FOTO_BOK = 800;

export type Opcja = { v: string; l: string };
export type Pytanie =
  | { klucz: string; typ: "jedna"; pytanie: string; opcje: Opcja[] }
  | { klucz: string; typ: "wiele"; pytanie: string; opcje: Opcja[]; maks?: number }
  | { klucz: string; typ: "tekst" | "dlugi" | "liczba" | "tel" | "url"; pytanie: string; podpowiedz?: string; opcjonalne?: boolean; min?: number; maks: number };

const o = (lista: string[]): Opcja[] => lista.map((l) => ({ v: l, l }));

export const KROKI: { tytul: string; pytania: Pytanie[] }[] = [
  {
    tytul: "Doświadczenie",
    pytania: [
      { klucz: "lata", typ: "jedna", pytanie: "Ile lat pracujesz w sprzedaży?", opcje: o(["Mniej niż rok", "1-3 lata", "3-5 lat", "5-10 lat", "Ponad 10 lat"]) },
      { klucz: "stanowisko", typ: "tekst", pytanie: "Obecne albo ostatnie stanowisko", podpowiedz: "np. Przedstawiciel handlowy", min: 2, maks: 120 },
      { klucz: "status", typ: "jedna", pytanie: "Twoja sytuacja", opcje: o(["Szukam pracy", "Pracuję, ale chcę zmienić", "Pracuję, słucham ofert"]) },
    ],
  },
  {
    tytul: "Specjalizacja",
    pytania: [
      { klucz: "rynek", typ: "jedna", pytanie: "Komu sprzedajesz?", opcje: o(["Firmom", "Klientom indywidualnym", "Jednym i drugim"]) },
      {
        klucz: "branze",
        typ: "wiele",
        pytanie: "Branże, w których masz doświadczenie",
        opcje: o(["Nieruchomości", "OZE i fotowoltaika", "IT i oprogramowanie", "Finanse i ubezpieczenia", "Motoryzacja", "Budownictwo", "Medycyna i farmacja", "Telekomunikacja", "Produkty spożywcze", "Przemysł", "Usługi dla firm", "Inna"]),
      },
      { klucz: "kanaly", typ: "wiele", pytanie: "Jak sprzedajesz?", opcje: o(["Przez telefon", "Na spotkaniach u klienta", "Online", "W salonie albo sklepie"]) },
      {
        klucz: "mocne",
        typ: "wiele",
        pytanie: "Twoje najmocniejsze strony (najwyżej 3)",
        maks: 3,
        opcje: o(["Pozyskiwanie nowych klientów", "Umawianie spotkań", "Prezentacja oferty", "Negocjacje", "Zamykanie sprzedaży", "Opieka nad klientem", "Prowadzenie zespołu"]),
      },
    ],
  },
  {
    tytul: "Wyniki",
    pytania: [
      { klucz: "plan", typ: "jedna", pytanie: "Realizacja planu sprzedaży w ostatnim roku", opcje: o(["Poniżej 80 %", "80-100 %", "100-120 %", "Ponad 120 %", "Bez planu"]) },
      { klucz: "transakcja", typ: "jedna", pytanie: "Średnia wartość jednej sprzedaży", opcje: o(["Do 1 000 zł", "1 000-10 000 zł", "10 000-100 000 zł", "Ponad 100 000 zł"]) },
      { klucz: "sukces", typ: "dlugi", pytanie: "Twój największy wynik w sprzedaży", podpowiedz: "Podaj liczby: co, komu, za ile i w jakim czasie", min: 20, maks: 1500 },
    ],
  },
  {
    tytul: "Oczekiwania",
    pytania: [
      { klucz: "miasto", typ: "tekst", pytanie: "Miasto", podpowiedz: "np. Warszawa", min: 2, maks: 80 },
      { klucz: "tryb", typ: "wiele", pytanie: "Jak chcesz pracować?", opcje: o(["Stacjonarnie", "Hybrydowo", "Zdalnie", "W terenie"]) },
      { klucz: "umowa", typ: "wiele", pytanie: "Jaka umowa?", opcje: o(["Umowa o pracę", "B2B", "Sama prowizja"]) },
      { klucz: "pensja", typ: "liczba", pytanie: "Oczekiwana podstawa miesięcznie (zł netto)", podpowiedz: "np. 8000", min: 1, maks: 7 },
      { klucz: "start", typ: "jedna", pytanie: "Kiedy możesz zacząć?", opcje: o(["Od zaraz", "Za miesiąc", "Za 3 miesiące", "Dłużej"]) },
    ],
  },
  {
    tytul: "Kontakt",
    pytania: [
      { klucz: "imie", typ: "tekst", pytanie: "Imię i nazwisko", podpowiedz: "np. Anna Kowalska", min: 3, maks: 120 },
      { klucz: "telefon", typ: "tel", pytanie: "Telefon", podpowiedz: "500 600 700", min: 9, maks: 20 },
      { klucz: "linkedin", typ: "url", pytanie: "Profil LinkedIn", podpowiedz: "https://linkedin.com/in/...", opcjonalne: true, maks: 300 },
    ],
  },
];

export type Odpowiedzi = Record<string, string | string[]>;
export type StatusProfilu = "weryfikacja" | "zatwierdzony" | "odrzucony";

/** Błąd jednego pola albo null. */
export function bladPola(p: Pytanie, wartosc: unknown): string | null {
  if (p.typ === "jedna") return typeof wartosc === "string" && p.opcje.some((x) => x.v === wartosc) ? null : "Wybierz jedną odpowiedź.";
  if (p.typ === "wiele") {
    const w = Array.isArray(wartosc) ? wartosc.filter((x) => p.opcje.some((y) => y.v === x)) : [];
    if (w.length === 0) return "Wybierz co najmniej jedną odpowiedź.";
    return p.maks && w.length > p.maks ? `Wybierz najwyżej ${p.maks}.` : null;
  }
  const t = typeof wartosc === "string" ? wartosc.trim() : "";
  if (!t) return p.opcjonalne ? null : "Wypełnij to pole.";
  if (t.length > p.maks) return `Najwyżej ${p.maks} znaków.`;
  if (p.typ === "liczba") return /^\d+$/.test(t) && Number(t) > 0 ? null : "Wpisz kwotę samymi cyframi.";
  if (p.typ === "tel") return t.replace(/\D/g, "").length >= 9 ? null : "Wpisz numer telefonu, co najmniej 9 cyfr.";
  if (p.typ === "url") return /^https?:\/\/\S+\.\S+/.test(t) ? null : "Wklej pełny adres, zaczynający się od https://";
  return t.length >= (p.min ?? 1) ? null : `Co najmniej ${p.min} znaków.`;
}

/** Sprawdza wszystkie odpowiedzi. Zwraca czyste dane albo pierwszy błąd z numerem kroku. */
export function sprawdz(surowe: unknown): { ok: true; odpowiedzi: Odpowiedzi } | { ok: false; krok: number; klucz: string; blad: string } {
  const s = (surowe ?? {}) as Record<string, unknown>;
  const odpowiedzi: Odpowiedzi = {};
  for (const [krok, k] of KROKI.entries()) {
    for (const p of k.pytania) {
      const blad = bladPola(p, s[p.klucz]);
      if (blad) return { ok: false, krok, klucz: p.klucz, blad };
      const w = s[p.klucz];
      if (p.typ === "wiele") odpowiedzi[p.klucz] = (w as string[]).filter((x) => p.opcje.some((y) => y.v === x));
      else if (typeof w === "string" && w.trim()) odpowiedzi[p.klucz] = w.trim();
    }
  }
  return { ok: true, odpowiedzi };
}
