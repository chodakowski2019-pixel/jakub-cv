// 4.11 (USER_001): oferta + umowy dla Ewatex na jednej stronie (salesbruno.pl/oferta/ewatex), link idzie SMS-em.
// Kwoty i warunki = SalesAI/sprzedaz/EWATEX-PAKIET-2026-11-04.md + UMOWA-BRUNO-EWATEX + UMOWA-CRM-EWATEX (3.11).
// Dane spółki z KRS 0000134195 (odpis aktualny, api-krs.ms.gov.pl, 4.11): siedziba Łazy, nie Raszyn.

export const WERSJA = "ewatex-2026-11-05"; // 5.11: 1 umowa (Bruno + CRM) w PDF, CRM 14 500 zł

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
  zGory: 3150, // 3 mies. jedną fakturą, bez dodatkowego rabatu
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

// 4.11 (USER_001): Ewa bierze oba. Dziś = zaliczka 50 % za CRM. Druga rata po odbiorze CRM = 50 % CRM + Bruno z góry za 3 mies.
// Nagrania = standard (zostają), bez wyboru. Parametry zostają w sygnaturze (API, typy), ale wynik jest jeden.
export function policz(_w: Wariant = "oba", _p: Platnosc = "zgory") {
  const crm = CRM.budowaZBruno;
  return { start: crm / 2, drugaRata: crm / 2 + BRUNO.zGory, crm, bruno: BRUNO.zGory, utrzymanie: CRM.utrzymanie, kolejne: 0 };
}
