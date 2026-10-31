// 30.10 (USER_001): test predyspozycji dla osób, które nie wiedzą, jaki kurs wybrać. pytania → e-mail → profil + 1 kurs.
// Bez rozmowy z Bruno (USER_001 30.10). Strona salesbruno.pl/kursy/test, wynik liczy się tutaj (serwer i przeglądarka).
import { KURSY, kursPoSlugu, type Kurs } from "./kursy";

type Punkty = Partial<Record<string, number>>;
type Opcja = { tekst: string; kursy?: Punkty; styl?: Partial<Record<Styl, number>>; poziom?: "start" | "pro" };
export type Pytanie = { id: string; tekst: string; opcje: Opcja[] };
export type Styl = "lowca" | "doradca" | "negocjator";

const TEREN = { "oze-start": 2, "przedstawiciel-handlowy-start": 2, "nieruchomosci-start": 1, "ubezpieczenia-start": 1 };
const SALON = { "samochody-start": 2, "telekomunikacja-start": 2, "nieruchomosci-start": 1, "finanse-kredyty-start": 1 };
const ZDALNIE = { "telesprzedaz-start": 2, "b2b-sdr-start": 2 };

// 31.10 (USER_001): z 10 pytań zostały 4 (usunięte 3, 5, 7, 8, 9, 10). Styl liczy się z pytania o motywację.
export const PYTANIA: Pytanie[] = [
  {
    id: "doswiadczenie",
    tekst: "Sprzedawałeś już kiedyś?",
    opcje: [
      { tekst: "Nigdy", poziom: "start", kursy: { "podstawy-sprzedazy": 1 } },
      { tekst: "Tak, krócej niż rok", poziom: "start" },
      { tekst: "Tak, ponad rok", poziom: "pro", kursy: { "zamykanie-pro": 1 } },
    ],
  },
  {
    id: "miejsce",
    tekst: "Gdzie wolisz pracować?",
    opcje: [
      { tekst: "W terenie, u klienta", kursy: TEREN },
      { tekst: "W biurze albo w salonie", kursy: SALON },
      { tekst: "Zdalnie, przez telefon i komputer", kursy: ZDALNIE },
    ],
  },
  {
    id: "temat",
    tekst: "Co Cię najbardziej ciekawi?",
    opcje: [
      { tekst: "Domy i mieszkania", kursy: { "nieruchomosci-start": 4, "nieruchomosci-pro": 4 } },
      { tekst: "Energia i ekologia", kursy: { "oze-start": 4, "oze-pro": 4 } },
      { tekst: "Samochody", kursy: { "samochody-start": 4 } },
      { tekst: "Pieniądze i ubezpieczenia", kursy: { "finanse-kredyty-start": 4, "ubezpieczenia-start": 4 } },
      { tekst: "Technologia", kursy: { "b2b-sdr-start": 4, "telekomunikacja-start": 2 } },
      { tekst: "Zdrowie i medycyna", kursy: { "przedstawiciel-medyczny-start": 4 } },
      { tekst: "Sklepy i produkty", kursy: { "przedstawiciel-handlowy-start": 4 } },
      { tekst: "Nie wiem", kursy: { "podstawy-sprzedazy": 3, "zamykanie-pro": 2 } },
    ],
  },
  {
    id: "motywacja",
    tekst: "Co Cię bardziej motywuje?",
    opcje: [
      { tekst: "Stała pensja", styl: { doradca: 1 }, kursy: { "telekomunikacja-start": 1, "przedstawiciel-medyczny-start": 1, "przedstawiciel-handlowy-start": 1 } },
      { tekst: "Prowizja bez limitu", styl: { lowca: 2 }, kursy: { "nieruchomosci-start": 1, "oze-start": 1, "zamykanie-pro": 1 } },
      { tekst: "Pensja plus prowizja", styl: { negocjator: 1 } },
    ],
  },
];

export const STYLE: Record<Styl, { nazwa: string; opis: string }> = {
  lowca: {
    nazwa: "Łowca",
    opis: "Odmowa Cię nakręca, lubisz szybkie tempo i płacę za wynik. Dobrze odnajdziesz się tam, gdzie liczy się liczba rozmów i prowizja.",
  },
  doradca: {
    nazwa: "Doradca",
    opis: "Słuchasz, dopytujesz i budujesz zaufanie. Dobrze odnajdziesz się tam, gdzie klient podejmuje ważną decyzję i potrzebuje kogoś, komu ufa.",
  },
  negocjator: {
    nazwa: "Negocjator",
    opis: "Myślisz liczbami i masz cierpliwość do dłuższych rozmów. Dobrze odnajdziesz się w sprzedaży firmom i większych kontraktach.",
  },
};

export type Wynik = { styl: Styl; kurs: Kurs; poziom: "start" | "pro" };

/** odpowiedzi = indeks opcji dla każdego pytania (w kolejności PYTANIA) */
export function policzWynik(odpowiedzi: number[]): Wynik {
  const pkt: Record<string, number> = Object.fromEntries(KURSY.map((k) => [k.slug, 0]));
  const styl: Record<Styl, number> = { lowca: 0, doradca: 0, negocjator: 0 };
  let poziom: "start" | "pro" = "start";
  PYTANIA.forEach((p, i) => {
    const o = p.opcje[odpowiedzi[i]];
    if (!o) return;
    for (const [slug, v] of Object.entries(o.kursy ?? {})) pkt[slug] = (pkt[slug] ?? 0) + (v ?? 0);
    for (const [s, v] of Object.entries(o.styl ?? {})) styl[s as Styl] += v ?? 0;
    if (o.poziom) poziom = o.poziom;
  });
  // Kurs musi pasować poziomem: Start dla zaczynających, Pro dla doświadczonych.
  const pasujace = KURSY.filter((k) => k.poziom === poziom).sort((a, b) => pkt[b.slug] - pkt[a.slug]);
  const kurs = pasujace[0] ?? kursPoSlugu("podstawy-sprzedazy")!;
  const najStyl = (Object.keys(styl) as Styl[]).sort((a, b) => styl[b] - styl[a])[0];
  return { styl: najStyl, kurs, poziom };
}
