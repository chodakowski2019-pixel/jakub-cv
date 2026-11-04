// 4.11.2026 (USER_001): oferta Bruno AI Polska = 3 pakiety. Jedno źródło dla strony salesbruno.pl/oferta
// (app/brunooferta) i przyszłego regulaminu / zamówienia. Treść = SalesAI/OFERTA-PAKIETY-PL-2026-11-04.md.
// Ceny netto. Abonament za 1 konto / miesiąc, konta zarządzających płatne jak handlowca. Minimum 3 konta.
// Pakiety 1 i 2 = regulamin do akceptacji (jak lovemyself), pakiet 3 = umowa indywidualna.

export type Pakiet = {
  nr: 1 | 2 | 3;
  nazwa: string;
  start: number; // zł netto, jednorazowo
  abonament: number; // zł netto / konto / mies.
  wdrozenie: string;
  dlaKogo: string;
  zawarcie: string; // regulamin / umowa
  rekomendowany?: boolean;
};

export const MINIMUM_KONT = 3;

export const PAKIETY: Pakiet[] = [
  {
    nr: 1,
    nazwa: "Bruno",
    start: 0,
    abonament: 390,
    wdrozenie: "1 dzień (instrukcja + 30 min online)",
    dlaKogo: "Firma z CRM, która chce poprawić wyniki sprzedażowe",
    zawarcie: "akceptacja regulaminu",
  },
  {
    nr: 2,
    nazwa: "Bruno + Audyt",
    start: 5000,
    abonament: 350,
    wdrozenie: "5 dni roboczych",
    dlaKogo: "Firma z CRM, która chce poprawić wyniki sprzedażowe",
    zawarcie: "akceptacja regulaminu",
    rekomendowany: true,
  },
  {
    nr: 3,
    nazwa: "Bruno System",
    start: 20000,
    abonament: 300,
    wdrozenie: "10 dni roboczych",
    dlaKogo: "Firma bez CRM albo z CRM, z którego nikt nie korzysta",
    zawarcie: "umowa",
  },
];

/** Wiersz tabeli „co jest w środku”: `w` = w których pakietach (1, 2, 3). */
export type Wiersz = { t: string; w: (1 | 2 | 3)[] };
export type Sekcja = { tytul: string; wiersze: Wiersz[] };

const WSZYSTKIE: (1 | 2 | 3)[] = [1, 2, 3];
const OD_2: (1 | 2 | 3)[] = [2, 3];
const TYLKO_3: (1 | 2 | 3)[] = [3];

export const ZAWARTOSC: Sekcja[] = [
  {
    tytul: "Handlowiec: kokpit Bruno",
    wiersze: [
      { t: "Czat z Bruno: asystent jak ChatGPT, zna klientów i lejek handlowca", w: WSZYSTKIE },
      { t: "Rozmowy treningowe głosem: Bruno zamienia się w klienta i sam dobiera ścieżkę rozmowy do handlowca, jego problemu i etapu lejka", w: WSZYSTKIE },
      { t: "Trener: ocena każdej rozmowy 1-10, plusy, minusy, 1 poprawka", w: WSZYSTKIE },
      { t: "Fiszki technik sprzedaży z powtórkami", w: WSZYSTKIE },
      { t: "Zakładka Klienci (odczyt z CRM firmy)", w: WSZYSTKIE },
      { t: "Zakładka Lejek (odczyt z CRM firmy)", w: WSZYSTKIE },
      { t: "Zakładka Statystyki handlowca: rozmowy, oceny, postęp", w: WSZYSTKIE },
      { t: "Trening dobrany do etapu, na którym handlowiec traci deale", w: WSZYSTKIE },
      { t: "Wynik treningu zapisany w CRM firmy jako aktywność", w: WSZYSTKIE },
      { t: "Sprawdzian mentalny handlowca na start i co 30 dni", w: WSZYSTKIE },
    ],
  },
  {
    tytul: "Szef: kokpit właściciela / dyrektora",
    wiersze: [
      { t: "Czat z Bruno o zespole („kto odpuszcza po ofercie?”)", w: WSZYSTKIE },
      { t: "Wszyscy klienci i cały lejek zespołu w jednym miejscu", w: WSZYSTKIE },
      { t: "Statystyki każdego handlowca: aktywność, oceny, słabe etapy", w: WSZYSTKIE },
      { t: "Raport miesięczny AI: co się poprawiło, kto, gdzie, 3 zalecenia", w: WSZYSTKIE },
    ],
  },
  {
    tytul: "Audyt sprzedaży (jednorazowo)",
    wiersze: [
      { t: "Analiza lejka z danych CRM: konwersje etap → etap, gdzie uciekają deale, ile to kosztuje", w: OD_2 },
      { t: "Przebudowany lejek z twardym kryterium wyjścia z każdego etapu", w: OD_2 },
      { t: "Grupa docelowa: segment, osoby, problemy, wartość (1 strona)", w: OD_2 },
      { t: "Karta obiekcji klientów firmy + skrypt pierwszej rozmowy", w: OD_2 },
      { t: "Raport startowy dla szefa z testu handlowców", w: OD_2 },
      { t: "Szkolenie startowe zespołu online, 60 min", w: OD_2 },
      { t: "Raport po 30 dniach z rekomendacją o handlowcach", w: OD_2 },
    ],
  },
  {
    tytul: "System (jednorazowo + narzędzie)",
    wiersze: [
      { t: "Bruno CRM: klienci, lejek, zadania, notatki, historia, pola i etapy pod firmę", w: TYLKO_3 },
      { t: "Migracja danych z arkuszy albo starego CRM", w: TYLKO_3 },
      { t: "Podłączenie zewnętrznych narzędzi: Gmail, kalendarz Google, SMS itd. (maile i spotkania w karcie klienta, wysyłka z Bruno)", w: TYLKO_3 },
      { t: "Bruno pisze maile i SMS-y pod etap lejka (handlowiec zatwierdza)", w: TYLKO_3 },
      { t: "Wdrożenie: konfiguracja, 2 szkolenia online, 30 dni opieki", w: TYLKO_3 },
    ],
  },
  {
    tytul: "W każdym pakiecie",
    wiersze: [
      // 4.11 (USER_001 „na pewno na naszych serwerach?”): nie. Nagrania leżą w prywatnym magazynie Supabase na naszym koncie
      // (region us-east-1, USA), kopia u ElevenLabs kasowana po 1 dniu, Anthropic / OpenAI do 30 dni. Szczegóły: /bezpieczenstwo.
      { t: "Nagrania rozmów w prywatnym magazynie na naszym koncie, dostawcy AI nie uczą się na danych, kopie u dostawców kasowane do 30 dni", w: WSZYSTKIE },
      { t: "Umowa powierzenia danych (art. 28 RODO)", w: WSZYSTKIE },
      { t: "Wsparcie mailowe, odpowiedź do 24 h w dni robocze", w: WSZYSTKIE },
      // 4.11 (USER_001): „zmiany poza zakresem 70 zł / h” usunięte ze strony, do regulaminu.
    ],
  },
];

/** Przykład: 5 handlowców + szef = 6 kont. 4.11 (USER_001): abonament za 1 miesiąc, nie za rok. */
export const PRZYKLAD_KONT = 6;

export function koszt(p: Pakiet, konta = PRZYKLAD_KONT) {
  const miesiac = p.abonament * konta;
  return { start: p.start, miesiac, pierwszy: p.start + miesiac, kolejne: miesiac };
}

/** 5000 → „5 000 zł” (pl-PL nie grupuje liczb 4-cyfrowych, więc grupowanie ręczne). */
export function zl(n: number) {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} zł`;
}
