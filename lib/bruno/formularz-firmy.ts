// 28.10 (USER_001): formularz CRM dla firmy po demo (Ewatex). Dwie role: szef i handlowiec.
// Strony: /formularz/<firma> (szef) i /formularz/<firma>/handlowiec. Odpowiedzi: tabela `bruno_formularze` + mail do USER_001.
// Pytanie z `glosowka: true` ma nagrywanie głosówki w przeglądarce (do 20 min) → kubełek bruno-nagrania, ścieżka w odpowiedziach.
// Lista pytań ustalona przez USER_001 28.10 (po 3 rundach cięć).

export type Rola = "szef" | "handlowiec";

export type Pytanie = {
  id: string;
  tekst: string;
  /** krótka podpowiedź pod pytaniem */
  pod?: string;
  /** wielokrotny = kilka pigułek naraz, odpowiedź zapisana jako „A, B, C” */
  typ: "krotki" | "dlugi" | "wybor" | "wielokrotny";
  opcje?: string[];
  /** nagrywanie głosówki zamiast / obok tekstu */
  glosowka?: boolean;
};

export type Firma = {
  klucz: string;
  nazwa: string;
  szef: string;
};

export const FIRMY: Record<string, Firma> = {
  ewatex: { klucz: "ewatex", nazwa: "Ewatex", szef: "Ewa" },
};

/** Limit głosówki: 20 minut (USER_001 28.10). */
export const GLOSOWKA_MAX_SEKUND = 20 * 60;

const WYMARZONY: Pytanie = {
  id: "wymarzony_crm",
  tekst: "Opisz lub powiedz, jak ma wyglądać Twój wymarzony CRM.",
  pod: "Z jak najbardziej szczegółowymi detalami: co ma się w nim znaleźć, jak ma funkcjonować, jakie ma mieć automatyzacje, do ilu klientów. Możesz napisać albo nagrać głosówkę (do 20 minut).",
  typ: "dlugi",
  glosowka: true,
};

export const PYTANIA_SZEF: Pytanie[] = [
  { id: "baza", tekst: "Ile firm macie zapisanych w bazie?", pod: "mniej więcej", typ: "krotki" },
  { id: "osoby", tekst: "Ile osób będzie korzystać z CRM?", pod: "handlowczynie, Ty, inne osoby", typ: "krotki" },
  { id: "dane", tekst: "Gdzie dziś są dane klientów i kto ma do nich dostęp?", pod: "Excel, kalendarz Google, e-mail, kartki", typ: "dlugi" },
  { id: "etapy", tekst: "Etapy, przez które przechodzi klient od pierwszego kontaktu do podpisania umowy.", pod: "wypisz po kolei", typ: "dlugi" },
  { id: "brakuje", tekst: "Czego Ci najbardziej brakuje w dzisiejszym CRM?", typ: "dlugi" },
  { id: "integracje", tekst: "Z czym CRM ma się łączyć?", pod: "zaznacz wszystko, co pasuje", typ: "wielokrotny", opcje: ["Poczta e-mail", "Kalendarz Google", "Faktury", "Telefon", "SMS", "Nic z tego"] },
  { id: "automaty", tekst: "Jakie przypomnienia i automaty mają chodzić same?", pod: "np. koniec umowy, brak kontaktu 30 dni, raport tygodniowy", typ: "dlugi" },
  { id: "telefon", tekst: "Czy CRM ma działać na telefonie w terenie?", typ: "wybor", opcje: ["Tak", "Nie", "Nie wiem"] },
  { id: "przeniesienie", tekst: "Czy chcecie sami przenieść dane do CRM, czy my mamy to zrobić?", typ: "wybor", opcje: ["Sami", "Wy", "Razem"] },
  { id: "osoba_dane", tekst: "Czy jest osoba do kontaktu, która może przekazać te dane, żeby dodać je do CRM?", pod: "imię, telefon, e-mail", typ: "krotki" },
  { id: "termin", tekst: "Do kiedy CRM ma działać w pełni?", typ: "krotki" },
  WYMARZONY,
  { id: "uwagi", tekst: "Coś jeszcze?", typ: "dlugi" },
];

export const PYTANIA_HANDLOWIEC: Pytanie[] = [
  { id: "gdzie_zapisujesz", tekst: "Gdzie dziś zapisujesz informacje o klientach i rozmowach?", typ: "dlugi" },
  { id: "wkurza", tekst: "Co Cię najbardziej denerwuje w obecnym sposobie pracy z danymi klientów?", typ: "dlugi" },
  { id: "ekran_rano", tekst: "Co chciałabyś widzieć na swoim ekranie rano?", pod: "np. lista na dziś, umowy do przedłużenia, klienci bez kontaktu od 30 dni", typ: "dlugi" },
  WYMARZONY,
  { id: "uwagi", tekst: "Coś jeszcze?", typ: "dlugi" },
];

export function pytaniaDla(rola: Rola) {
  return rola === "szef" ? PYTANIA_SZEF : PYTANIA_HANDLOWIEC;
}
