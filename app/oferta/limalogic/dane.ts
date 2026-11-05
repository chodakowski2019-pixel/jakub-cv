// 5.11 (USER_001): oferta + umowa dla Limalogic (Łukasz Salawa) na jednej stronie: salesbruno.pl/oferta/limalogic.
// Produkt = ANALIZA SPRZEDAŻY bez Bruno (demo 4.11, analiza w SalesAI/sprzedaz/rozmowy/2026-11-04-limalogic-lukasz-analiza.md,
// warunki z draftu maila scripts/bruno-mail-limalogic.mjs). Dane spółki z KRS 0000864111 + biała lista MF (5.11): zarząd
// jednoosobowy, prezes = Łukasz Salawa, VAT czynny. Wzór strony = app/oferta/ewatex.

export const WERSJA = "limalogic-2026-11-05";

export const KLIENT = {
  nazwa: "LIMALOGIC Spółka z ograniczoną odpowiedzialnością",
  adres: "ul. Giełdowa 4C/93, 01-211 Warszawa",
  nip: "1133021800",
  krs: "0000864111",
  reprezentant: "Łukasz Salawa",
  funkcja: "Prezes Zarządu",
  email: "ls@limalogic.com",
  telefon: "793 763 008",
};

export const USLUGODAWCA = {
  nazwa: "Jakub Chodakowski",
  opis: "prowadzący działalność gospodarczą",
  adres: "ul. Koniecpolskiego 12, 78-100 Kołobrzeg",
  nip: "6711845485",
  email: "hello@jakubchodakowski.com",
};

// Zgłoszenia i kontakt w umowie: skrzynka Bruno.
export const KONTAKT_ZGLOSZENIA = "jakub@salesbruno.com";

export const ANALIZA = {
  cena: 5000, // jednorazowo, całość z góry; Usługodawca zwolniony z VAT, więc brutto = netto
  dniNaAnalize: 14, // od kompletu wsadu (formularz + spotkanie + sprawdzian)
  spotkanieMin: 60,
  omowienieMin: 30,
  formularzMin: 30,
  sprawdzianOsob: 2, // Łukasz + 1 osoba
  dniNaUwagi: 7,
  dniRoboczychNaPoprawki: 5,
};

// 5.11 (USER_001): link Stripe do płatności 5 000 zł. Przycisk „Zapłać” po podpisie; w mailu do Jakuba jako przypomnienie.
export const LINK_PLATNOSC = "https://buy.stripe.com/00w6oH2SWcJO71iaKp3F60z";

export const TELEFON_KIEDY = "poniedziałek 24.11, 10:00";

// pl-PL nie grupuje 4 cyfr (5000), a ma być „5 000 zł”: grupowanie ręczne.
export const zl = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} zł`;
