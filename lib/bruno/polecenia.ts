// 11.11 (USER_001): /polecenia = wyszukiwarka szkoleń sprzedażowych dla handlowców. Ankieta → 3 dopasowane szkolenia.
// Baza = ten plik. Start: trenerzy z SalesAI/sprzedaz/PARTNERZY-TRENERZY-2026-10-30.md (tylko specjalizacja z researchu).
// forma i cena = null, dopóki nie sprawdzone na stronie trenera. polecenia = TYLKO prawdziwe osoby, nigdy wymyślone.
// Nowe szkolenie = nowy wpis w SZKOLENIA.

export type Temat = "telefon" | "outbound" | "negocjacje" | "zamykanie" | "zespol" | "podstawy" | "obsluga";
export type Rynek = "b2b" | "b2c" | "oba";
export type DlaKogo = "sam" | "zespol" | "oba";
export type Poziom = "start" | "srednio" | "zaawansowany";
export type Forma = "online" | "sala" | "oba";

export type Polecenie = { kto: string; rola: string; data: string; cytat: string };

export type Szkolenie = {
  slug: string;
  nazwa: string;
  trener: string;
  url: string;
  tematy: Temat[];
  rynek: Rynek;
  dlaKogo: DlaKogo;
  poziomy: Poziom[];
  /** null = nie sprawdzone */
  forma: Forma | null;
  /** null = nie sprawdzone */
  cena: string | null;
  opis: string;
  polecenia: Polecenie[];
};

export const TEMATY: Record<Temat, string> = {
  telefon: "Umawianie spotkań przez telefon",
  outbound: "Pozyskiwanie nowych klientów",
  negocjacje: "Negocjacje i rozmowa o cenie",
  zamykanie: "Obiekcje i zamykanie sprzedaży",
  zespol: "Zarządzanie zespołem sprzedaży",
  podstawy: "Podstawy rozmowy handlowej",
  obsluga: "Obsługa i utrzymanie klienta",
};

const S = (s: Szkolenie) => s;

export const SZKOLENIA: Szkolenie[] = [
  S({
    slug: "dworaczynski",
    nazwa: "Zarządzanie sprzedażą B2B",
    trener: "Lech Dworaczyński (Dworaczyński Consulting)",
    url: "https://dworaczynski.pl",
    tematy: ["zespol"],
    rynek: "b2b",
    dlaKogo: "zespol",
    poziomy: ["zaawansowany"],
    forma: null,
    cena: null,
    opis: "Dla właścicieli i szefów sprzedaży: jak ustawić i prowadzić dział handlowy.",
    polecenia: [],
  }),
  S({
    slug: "karol-fron",
    nazwa: "Sprzedaż przez telefon i cold calling",
    trener: "Karol Froń",
    url: "https://karolfron.pl",
    tematy: ["telefon", "outbound"],
    rynek: "oba",
    dlaKogo: "oba",
    poziomy: ["start", "srednio"],
    forma: null,
    cena: null,
    opis: "Rozmowy telefoniczne z obcymi ludźmi, także dla zespołów call center.",
    polecenia: [],
  }),
  S({
    slug: "ikp-szkolenia",
    nazwa: "Telefon B2B: umawianie spotkań",
    trener: "Iza Krejca-Pawski (IKP Szkolenia)",
    url: "https://izakrejcapawski.pl",
    tematy: ["telefon"],
    rynek: "b2b",
    dlaKogo: "oba",
    poziomy: ["start", "srednio"],
    forma: null,
    cena: null,
    opis: "Jak przez telefon dojść do decydenta i umówić spotkanie z firmą.",
    polecenia: [],
  }),
  S({
    slug: "adam-grzesik",
    nazwa: "Sprzedaż B2B i negocjacje",
    trener: "Adam Grzesik",
    url: "https://adamgrzesik.pl",
    tematy: ["negocjacje", "zamykanie"],
    rynek: "b2b",
    dlaKogo: "oba",
    poziomy: ["srednio", "zaawansowany"],
    forma: null,
    cena: null,
    opis: "Negocjacje z firmami i rozmowa o cenie bez dawania rabatów.",
    polecenia: [],
  }),
  S({
    slug: "getsales",
    nazwa: "Outbound B2B",
    trener: "Paweł Kobusiński (GetSales Group)",
    url: "https://getsales.pl",
    tematy: ["outbound"],
    rynek: "b2b",
    dlaKogo: "zespol",
    poziomy: ["srednio", "zaawansowany"],
    forma: null,
    cena: null,
    opis: "Systematyczne pozyskiwanie nowych firm: listy, pierwsze wiadomości, telefony.",
    polecenia: [],
  }),
  S({
    slug: "gamma",
    nazwa: "Cold calling B2B",
    trener: "Dawid Didiuk (Gamma)",
    url: "https://projektgamma.pl",
    tematy: ["telefon", "outbound"],
    rynek: "b2b",
    dlaKogo: "oba",
    poziomy: ["start", "srednio"],
    forma: null,
    cena: null,
    opis: "Telefony do firm, które nas nie znają. Warszawa.",
    polecenia: [],
  }),
  S({
    slug: "oditk",
    nazwa: "Szkolenia sprzedażowe",
    trener: "Grupa ODiTK (Monika Zwierzyńska)",
    url: "https://oditk.pl",
    tematy: ["podstawy", "zamykanie"],
    rynek: "oba",
    dlaKogo: "oba",
    poziomy: ["start", "srednio"],
    forma: null,
    cena: null,
    opis: "Ogólne szkolenia sprzedażowe dla handlowców.",
    polecenia: [],
  }),
  S({
    slug: "effect-group",
    nazwa: "Negocjacje i obsługa klienta",
    trener: "Marcin Wrzosek (Effect Group)",
    url: "https://effectgroup.pl",
    tematy: ["negocjacje", "obsluga"],
    rynek: "oba",
    dlaKogo: "oba",
    poziomy: ["srednio", "zaawansowany"],
    forma: null,
    cena: null,
    opis: "Negocjacje i praca z klientem po sprzedaży.",
    polecenia: [],
  }),
  S({
    slug: "brian-tracy",
    nazwa: "Szkolenia sprzedaży Brian Tracy",
    trener: "Brian Tracy International Polska",
    url: "https://briantracy.pl",
    tematy: ["podstawy", "zamykanie", "outbound"],
    rynek: "oba",
    dlaKogo: "oba",
    poziomy: ["start", "srednio"],
    forma: null,
    cena: null,
    opis: "Metoda Briana Tracy: cały proces sprzedaży od pierwszego kontaktu do zamknięcia.",
    polecenia: [],
  }),
  S({
    slug: "sellap",
    nazwa: "Warsztaty sprzedaży B2B",
    trener: "Dagmara Kanoniak (Sellap)",
    url: "https://sellap.eu",
    tematy: ["zamykanie", "negocjacje"],
    rynek: "b2b",
    dlaKogo: "zespol",
    poziomy: ["srednio", "zaawansowany"],
    forma: "sala",
    cena: null,
    opis: "Warsztaty na sali: Kraków, Warszawa, Katowice.",
    polecenia: [],
  }),
  S({
    slug: "krzysztof-pytel",
    nazwa: "Szkolenia dla działów sprzedaży i KAM",
    trener: "Krzysztof Pytel",
    url: "https://prospeo.io",
    tematy: ["obsluga", "zespol"],
    rynek: "b2b",
    dlaKogo: "zespol",
    poziomy: ["zaawansowany"],
    forma: null,
    cena: null,
    opis: "Opieka nad dużymi klientami (KAM) i praca działu sprzedaży.",
    polecenia: [],
  }),
  S({
    slug: "euro-konsulting",
    nazwa: "Szkolenia sprzedażowe",
    trener: "Euro-Konsulting",
    url: "https://euro-konsulting.pl",
    tematy: ["podstawy"],
    rynek: "oba",
    dlaKogo: "oba",
    poziomy: ["start", "srednio"],
    forma: null,
    cena: null,
    opis: "Szkolenia sprzedażowe, Warszawa.",
    polecenia: [],
  }),
];

export type Odpowiedzi = {
  dlaKogo: "sam" | "zespol";
  poziom: Poziom;
  rynek: "b2b" | "b2c";
  temat: Temat;
  forma: Forma;
};

/** Punkty dopasowania. Remis = więcej poleceń wyżej. */
export function punkty(s: Szkolenie, o: Odpowiedzi): number {
  let p = 0;
  if (s.tematy.includes(o.temat)) p += 5;
  if (s.rynek === o.rynek) p += 2;
  else if (s.rynek === "oba") p += 1;
  else p -= 3;
  if (s.dlaKogo === o.dlaKogo) p += 2;
  else if (s.dlaKogo === "oba") p += 1;
  if (s.poziomy.includes(o.poziom)) p += 1;
  if (s.forma && o.forma !== "oba") p += s.forma === o.forma || s.forma === "oba" ? 1 : -2;
  return p;
}

export function dopasuj(o: Odpowiedzi, ile = 3): Szkolenie[] {
  return [...SZKOLENIA]
    .map((s) => ({ s, p: punkty(s, o) }))
    .sort((a, b) => b.p - a.p || b.s.polecenia.length - a.s.polecenia.length)
    .slice(0, ile)
    .map((x) => x.s);
}
