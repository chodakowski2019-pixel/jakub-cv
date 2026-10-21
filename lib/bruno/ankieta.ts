// 21.10 (USER_001): ankieta psychologiczna handlowca. „Rafał Mazur, od niego bierzemy wszystko.”
// Handlowiec wypełnia ją przed pierwszym treningiem i potem co 30 dni (blokada w app/bruno/layout.tsx).
// Pytania i wskazówki wyłącznie z bazy Mazura:
//   Sprzedaż/baza-wiedzy/Rafał Mazur/mazur-pewnosc-siebie-i-sprzedaz.md (zasady 1-12),
//   Zdrowie/Mental/bezwstyd-mazur.md, kokpit /mazur („O poczuciu własnej wartości”).
// 21.10 USER: pytania do 8 słów (skrót, sens i odwrócenia bez zmian).
// Bez importów serwerowych: plik używany i w formularzu (przeglądarka), i w API.

export const ANKIETA_DNI = 30;

export type Obszar = "sprzedaz" | "pieniadze" | "glowa" | "cel";
export const OBSZARY: Record<Obszar, { pl: string; en: string }> = {
  sprzedaz: { pl: "Twoje podejście do sprzedaży", en: "How you see selling" },
  pieniadze: { pl: "Ty i pieniądze", en: "You and money" },
  glowa: { pl: "Twoja głowa", en: "Your mindset" },
  cel: { pl: "Cel na 30 dni", en: "Your 30-day goal" },
};
/** Obszary liczone na skali (cel = tylko odpowiedzi otwarte). */
export const OBSZARY_WYNIK = ["sprzedaz", "pieniadze", "glowa"] as const;

type Tekst = { pl: string; en: string };
export type Pytanie = {
  id: string;
  obszar: Obszar;
  typ: "skala" | "tekst" | "liczba" | "wybor";
  /** Skala: „tak” = źle (wynik liczony jako 6 - odpowiedź). */
  odwrocone?: boolean;
  tekst: Tekst;
  /** Co mówi Mazur: pokazywane, gdy to pytanie wypadło najsłabiej. */
  wskazowka?: Tekst;
  opcje?: { id: string; tekst: Tekst }[];
};

export const PYTANIA: Pytanie[] = [
  // Sprzedaż
  {
    id: "s1", obszar: "sprzedaz", typ: "skala",
    tekst: { pl: "Sprzedaż to pomaganie klientowi w dobrej decyzji.", en: "Selling helps the customer make a good decision." },
    wskazowka: { pl: "Bądź po stronie zysków. Klient płaci Ci mniej, niż zyskuje. Jesteś inwestycją, nie kosztem.", en: "Be on the profit side. The customer pays you less than they gain. You are an investment, not a cost." },
  },
  {
    id: "s2", obszar: "sprzedaz", typ: "skala", odwrocone: true,
    tekst: { pl: "Po odmowie następna rozmowa idzie mi gorzej.", en: "After a no, my next call goes worse." },
    wskazowka: { pl: "Porażka to jedno zdarzenie. Nie łącz odmów w łańcuch. Po „nie” zapytaj siebie: jakich korzyści jeszcze nie zauważyłem?", en: "A loss is one event. Don't chain the no's together. After a no, ask yourself: what good did I miss here?" },
  },
  {
    id: "s3", obszar: "sprzedaz", typ: "skala",
    tekst: { pl: "Dzwonię nawet wtedy, gdy nie mam ochoty.", en: "I call even when I don't feel like it." },
    wskazowka: { pl: "Nie musisz być w nastroju, żeby dzwonić. Czuj, co czujesz, ale rób, co masz robić.", en: "You don't need to be in the mood to call. Feel what you feel, but do what you have to do." },
  },
  {
    id: "s4", obszar: "sprzedaz", typ: "skala",
    tekst: { pl: "Na koniec rozmowy pytam wprost o decyzję.", en: "I end the call by asking for a decision." },
    wskazowka: { pl: "Proś o to, czego chcesz. Jedno zdanie, pełna kwota, pytanie o decyzję: „Zaczynamy od poniedziałku?”", en: "Ask for what you want. One sentence, the full price, a question: \"Shall we start Monday?\"" },
  },
  {
    id: "s5", obszar: "sprzedaz", typ: "skala", odwrocone: true,
    tekst: { pl: "Obiekcja mnie stresuje, wolę odpuścić.", en: "Objections stress me, I'd rather back off." },
    wskazowka: { pl: "Konflikt to naturalna część zarabiania. Obiekcja to moment, w którym zaczyna się sprzedaż. Zapytaj spokojnie: „W porównaniu do czego?”", en: "Conflict is a normal part of making money. An objection is where the sale starts. Ask calmly: \"Compared to what?\"" },
  },
  {
    id: "s6", obszar: "sprzedaz", typ: "tekst",
    tekst: { pl: "Co czujesz tuż przed telefonem do klienta?", en: "What do you feel right before a call?" },
  },
  // Pieniądze
  {
    id: "p1", obszar: "pieniadze", typ: "skala",
    tekst: { pl: "Zasługuję na to, żeby dobrze zarabiać.", en: "I deserve to earn good money." },
    wskazowka: { pl: "Sukces ma ten, kto z pełnym przekonaniem mówi: zasługuję na to. Masz to, co tolerujesz.", en: "Success goes to the one who says with full belief: I deserve this. You get what you put up with." },
  },
  {
    id: "p2", obszar: "pieniadze", typ: "skala", odwrocone: true,
    tekst: { pl: "Podając cenę, chcę dodać „wiem, że dużo”.", en: "Saying the price, I want to add \"it's a lot\"." },
    wskazowka: { pl: "Podaj kwotę i zamilknij. Klient mówi pierwszy. Bez „ale” i bez rabatu, o który nikt nie prosił.", en: "Say the price and stop talking. The customer speaks first. No \"but\", no discount nobody asked for." },
  },
  {
    id: "p3", obszar: "pieniadze", typ: "skala",
    tekst: { pl: "Biorę pieniądze bez wstydu, klient dostaje więcej.", en: "I take the money with no shame, they get more." },
    wskazowka: { pl: "Dwa pytania: czy życie klienta będzie lepsze dzięki Twojej ofercie? Czy lepiej, żeby wydał pieniądze u Ciebie niż na nic? Dwa razy „tak” = wstyd nie ma podstaw.", en: "Two questions: will the customer's life be better with your offer? Is it better they spend the money with you than on nothing? Two yeses = no reason for shame." },
  },
  {
    id: "p4", obszar: "pieniadze", typ: "wybor",
    tekst: { pl: "Co bardziej napędza Cię do zarabiania?", en: "What drives you more to earn?" },
    opcje: [
      { id: "cel", tekst: { pl: "Gonię konkretny cel", en: "I'm chasing a clear goal" } },
      { id: "ucieczka", tekst: { pl: "Uciekam przed problemem (długi, rachunki)", en: "I'm running from a problem (debt, bills)" } },
    ],
  },
  {
    id: "p5", obszar: "pieniadze", typ: "tekst",
    tekst: { pl: "Na co chcesz zarobić w tym roku?", en: "What do you want to earn for this year?" },
  },
  // Głowa
  {
    id: "g1", obszar: "glowa", typ: "skala", odwrocone: true,
    tekst: { pl: "Po błędzie myślę „jestem słaby”, nie „zrobiłem źle”.", en: "After a mistake: \"I'm bad\", not \"I did wrong\"." },
    wskazowka: { pl: "Wstyd atakuje to, kim jesteś. Oceniaj czyn, nie siebie: „zrobiłem źle”, nie „jestem zły”.", en: "Shame attacks who you are. Judge the action, not yourself: \"I did it wrong\", not \"I am bad\"." },
  },
  {
    id: "g2", obszar: "glowa", typ: "skala",
    tekst: { pl: "Dotrzymuję słowa danego samemu sobie.", en: "I keep the promises I make to myself." },
    wskazowka: { pl: "Ludzie z wysoką wartością dotrzymują słowa danego sobie. Codziennie 5 zadań. Skreślasz wszystkie = wygrany dzień.", en: "People with high self-worth keep their word to themselves. Five tasks a day. Cross off all five = a won day." },
  },
  {
    id: "g3", obszar: "glowa", typ: "skala",
    tekst: { pl: "Mówię wprost, kim jestem i co sprzedaję.", en: "I say straight who I am and what I sell." },
    wskazowka: { pl: "Koniec z „przepraszam, że przeszkadzam”. Imię, firma, powód telefonu w trzech zdaniach.", en: "No more \"sorry to bother you\". Name, company, reason for the call in three sentences." },
  },
  {
    id: "g4", obszar: "glowa", typ: "skala", odwrocone: true,
    tekst: { pl: "Głos w głowie częściej mnie krytykuje niż wspiera.", en: "My inner voice criticizes more than it supports." },
    wskazowka: { pl: "Bądź sobie przyjacielem, mentorem i trenerem. Zamiast oceniać siebie, bądź ciekawy.", en: "Be your own friend, mentor and coach. Swap judging yourself for curiosity." },
  },
  // Cel na 30 dni
  {
    id: "c1", obszar: "cel", typ: "liczba",
    tekst: { pl: "Ile rozmów sprzedażowych zrobisz w tym tygodniu?", en: "How many sales calls will you make this week?" },
  },
  {
    id: "c2", obszar: "cel", typ: "tekst",
    tekst: { pl: "Jaki jeden wynik chcesz mieć za 30 dni?", en: "What one result do you want in 30 days?" },
  },
];

export const SKALA: { pl: string; en: string }[] = [
  { pl: "Zdecydowanie nie", en: "Strongly disagree" },
  { pl: "Raczej nie", en: "Disagree" },
  { pl: "Trudno powiedzieć", en: "Not sure" },
  { pl: "Raczej tak", en: "Agree" },
  { pl: "Zdecydowanie tak", en: "Strongly agree" },
];

export type Odpowiedzi = Record<string, string | number>;

/** Brakujące odpowiedzi (id pytań). Tekst min. 2 znaki, liczba >= 0, skala 1-5, wybór z listy. */
export function braki(o: Odpowiedzi): string[] {
  return PYTANIA.filter((p) => {
    const v = o[p.id];
    if (p.typ === "skala") return !(typeof v === "number" && v >= 1 && v <= 5);
    if (p.typ === "liczba") return !(v !== "" && v !== undefined && Number.isFinite(Number(v)) && Number(v) >= 0);
    if (p.typ === "wybor") return !p.opcje?.some((x) => x.id === v);
    return String(v ?? "").trim().length < 2;
  }).map((p) => p.id);
}

const naProcent = (srednia: number) => Math.round(((srednia - 1) / 4) * 100);
const punkty = (p: Pytanie, v: number) => (p.odwrocone ? 6 - v : v);

/** Wynik 0-100: ogólny i per obszar. Najsłabsze pytanie = to z najniższymi punktami (pierwsze przy remisie). */
export function policz(o: Odpowiedzi): { wynik: number; obszary: Record<(typeof OBSZARY_WYNIK)[number], number>; najslabsze: Pytanie | null } {
  const skala = PYTANIA.filter((p) => p.typ === "skala" && typeof o[p.id] === "number");
  const pk = skala.map((p) => ({ p, v: punkty(p, o[p.id] as number) }));
  const sr = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 1);
  const obszary = Object.fromEntries(OBSZARY_WYNIK.map((ob) => [ob, naProcent(sr(pk.filter((x) => x.p.obszar === ob).map((x) => x.v)))])) as Record<(typeof OBSZARY_WYNIK)[number], number>;
  const min = pk.reduce<{ p: Pytanie; v: number } | null>((m, x) => (!m || x.v < m.v ? x : m), null);
  return { wynik: naProcent(sr(pk.map((x) => x.v))), obszary, najslabsze: min && min.v < 4 ? min.p : null };
}
