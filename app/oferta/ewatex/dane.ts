// 4.11 (USER_001): oferta + umowy dla Ewatex na jednej stronie (salesbruno.pl/oferta/ewatex), link idzie SMS-em.
// Kwoty i warunki = SalesAI/sprzedaz/EWATEX-PAKIET-2026-11-04.md + UMOWA-BRUNO-EWATEX + UMOWA-CRM-EWATEX (3.11).
// Dane spółki z KRS 0000134195 (odpis aktualny, api-krs.ms.gov.pl, 4.11): siedziba Łazy, nie Raszyn.

export const WERSJA = "ewatex-2026-11-07"; // 5.11: 1 umowa (Bruno + CRM) w PDF, CRM 14 500 zł; 7.11: zakładki CRM, spotkania 50 min w dniach 1-14, CRM gotowy dzień 21

export const KLIENT = {
  nazwa: "„EWATEX” Spółka z ograniczoną odpowiedzialnością",
  adres: "Aleja Krakowska 227, 05-552 Łazy",
  nip: "1230971156",
  krs: "0000134195",
  reprezentant: "Ewa Adamska",
  funkcja: "Prezes Zarządu",
  email: "e.adamska@ewatex.pl",
  telefon: "601 331 818",
};

export const USLUGODAWCA = {
  nazwa: "Jakub Chodakowski",
  opis: "prowadzący działalność gospodarczą",
  adres: "ul. Koniecpolskiego 12, 78-100 Kołobrzeg",
  nip: "6711845485",
  email: "hello@jakubchodakowski.com",
};

export const BRUNO = {
  konta: 3,
  // 4.11 (USER_001): z CRM 350 zł od konta, 3 mies., potem Ewa decyduje, czy zostaje.
  cenaKonto: 350,
  miesiac: 1050,
  trzyMiesiace: 3150,
  zGory: 3150, // 3 mies. razem (nieużywane od 7.11: Bruno płatne co miesiąc)
  okresMiesiecy: 3,
};

export const CRM = {
  budowa: 15000,
  budowaZBruno: 14500, // 5.11 (USER_001): było 13 500
  utrzymanie: 50, // 4.11 (USER_001): było 199
  godzina: 70,
};

export const RAZEM = {
  obaStart: BRUNO.zGory + CRM.budowaZBruno, // 17 650
  obaMiesiac: BRUNO.miesiac + CRM.utrzymanie, // 1 100
};

// 5.11 (USER_001): zgłoszenia w umowie (§ 8) idą na skrzynkę Bruno, nie hello@.
export const KONTAKT_ZGLOSZENIA = "jakub@salesbruno.com";

// 5.11 (USER_001): link Stripe do pierwszej płatności (zaliczka 50 % za CRM = 7 250 zł). Pokazywany po podpisie i w mailu.
export const LINK_PLATNOSC_1 = "https://buy.stripe.com/bJe9ATgJM39eetK19P3F60y";

export const WAZNA_DO = "wtorku 11.11.2026";
export const TELEFON_KIEDY = "piątek 7.11, 9:00";

export const HANDLOWCZYNIE = [
  { imie: "Joanna Żarnowska", email: "j.zarnowska@kbwb.pl" },
  { imie: "Paulina Erbel", email: "p.erbel@kbwb.pl" },
];

// pl-PL nie grupuje 4 cyfr (6750), a ma być „6 750 zł”: grupowanie ręczne.
export const zl = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} zł`;

export type Wariant = "bruno" | "oba";
export type Platnosc = "miesiecznie" | "zgory";
export type Nagrania = "standard" | "poufny";

// 7.11 (USER_001): Bruno płatne CO MIESIĄC (1 050 zł), nie 3 mies. z góry. Druga rata = 50 % CRM + 1. miesiąc Bruno.
// 4.11 (USER_001): Ewa bierze oba. Dziś = zaliczka 50 % za CRM. Druga rata po odbiorze CRM = 50 % CRM + Bruno z góry za 3 mies.
// Nagrania = standard (zostają), bez wyboru. Parametry zostają w sygnaturze (API, typy), ale wynik jest jeden.
export function policz(_w: Wariant = "oba", _p: Platnosc = "zgory") {
  const crm = CRM.budowaZBruno;
  return { start: crm / 2, drugaRata: crm / 2 + BRUNO.miesiac, crm, bruno: BRUNO.miesiac, utrzymanie: CRM.utrzymanie, kolejne: BRUNO.miesiac };
}

// 7.11 (USER_001): CRM gotowy 21 dni od pierwszej płatności (było 14). Oferta i umowa biorą tę liczbę.
export const CRM_GOTOWY_DNI = 21;

// 7.11 (USER_001): zakładki CRM Ewatex (ustalone w rozmowie 7.11), każda rzecz osobnym punktem.
export const ZAKLADKI_CRM: [string, string[]][] = [
  ["Dziś", ["lista na dziś: telefony i spotkania z datą", "klienci bez kontaktu od 30 dni", "umowy do przedłużenia w tym miesiącu", "ile rozmów w tym tygodniu"]],
  ["Klienci", ["lista z szukajką i filtrami: spółka, etap, handlowczyni, koniec umowy", "karta klienta: firma, NIP, osoba, telefon, e-mail", "obecny sprzedawca energii", "data końca umowy", "cena, taryfa", "faktura (plik)", "która spółka ofertuje", "kto prowadzi", "historia wszystkich rozmów"]],
  ["Lejek", ["etapy: nowy → telefon → faktura zebrana → oferta wysłana → decyzja → podpisana / stracona", "na każdym etapie ilu klientów i za ile", "przeciąganie klienta między etapami"]],
  ["Rozmowy", ["po każdym telefonie 30 sekund: co ustalone (2 zdania)", "następny krok z datą", "czy jest faktura", "wpis trafia do historii klienta i na listę „Dziś”"]],
  ["Przedłużenia", ["wszystkie umowy klientów z datą końca", "automat: 12, 6 i 3 miesiące przed końcem mail do zarządzającej i handlowczyni", "widok na kwartał"]],
  ["Oferty", ["wybór spółki: Ewatex, Reenergia, Respect", "właściwy nadawca maila i dane spółki na dokumencie", "lista ofert: wysłana, podpisana, odrzucona"]],
  ["Panel zarządzającej", ["umowy do przedłużenia w kwartale", "rozmowy w tygodniu per handlowczyni", "oferty wysłane", "oferty podpisane", "faktury zebrane", "porównanie handlowczyń"]],
  ["Ustawienia", ["4 konta: zarządzająca + 3 handlowczynie", "spółki i nadawcy maili", "etapy lejka", "pola karty klienta"]],
];
