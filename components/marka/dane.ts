// 22.11.2026 (USER_001): strona marki osobistej Jakub Chodakowski. PODGLĄD /podglad/marka, noindex.
// Cel: najpierw wypromować markę osobistą w AI, potem projekty AI dla ludzi (B2C), firm (B2B) i urzędów (B2G).
// Na starcie wybór: „Prowadzę firmę” albo „Chcę zrozumieć AI” (jak wybór na głównej lovemyself).
// Niżej paski jak w FAQ: klik w pasek rozwija jego część. Wygląd: styl salesbruno.pl (jasne tło, limonka, Outfit + Inter).
// Zasady treści: tylko AI, nic o sprzedaży; do czytelnika bezosobowo, Jakub w 1. osobie; bez myślników;
// zero zmyślonych liczb. Wszystko, czego jeszcze nie ma (podcast, rolki, webinar, sklep), ma status „wkrótce”.

export const MARKA = {
  imie: "Jakub Chodakowski",
  email: "hello@jakubchodakowski.com",
  linkedin: "https://www.linkedin.com/in/jakub-chodakowski",
  // 22.11 (USER_001): przycisk w pasku u góry zamiast „Newsletter”.
  przyciskGora: "Chcę być na bieżąco",
};

// 22.11 (USER_001): usunięte etykieta „AI. Prosto i po polsku.”, linki w pasku, fakty 2024 i 2025.
// Nagłówek i wstęp zmienione (USER_001: „to trzeba zmienić”). Poprzednio: „Uczę AI. Ludzi i firmy.”
export const START = {
  // 22.11 (USER_001): nagłówek i wstęp jego słowami. Wcześniej: „AI zmienia pracę. Pokazuję, jak za tym nadążyć.”
  // 22.11 (USER_001): „Zmień” + druga linia zmienia się na zmianę: „swoje życie z AI” / „swoją firmę z AI”.
  h1a: "Zmień",
  h1b: ["swoje życie z AI", "swoją firmę z AI"],
  // 22.11 (USER_001): na górze zdjęcie z wystąpienia na CRASH Mondays zamiast portretu.
  zdjecie: { src: "/talk-crash-mondays.png", alt: "Jakub Chodakowski prowadzi wystąpienie o AI na CRASH Mondays", podpis: "CRASH Mondays, sierpień 2024", w: 1614, h: 1058 },
  fakty: [{ n: "Od 2022", o: "uczę, jak to robić" }],
};

export const WYBOR = {
  pytanie: "Od czego zacząć?",
  opcje: [
    {
      id: "firmy",
      etykieta: "AI dla firm",
      tytul: "Prowadzę firmę",
      opis: "Jednodniowy warsztat AI dla zespołu. Każdy pracuje na zadaniach z firmy.",
      cta: "Zobacz szkolenie",
      href: "/szkolenie-ai-dla-firm",
      ciemna: true,
    },
    {
      id: "kazdy",
      etykieta: "AI dla każdego",
      tytul: "Chcę zrozumieć AI",
      opis: "Bezpłatny webinar we wtorki, podcast i newsletter. Bez wiedzy technicznej.",
      cta: "Zacznij tutaj",
      href: "#kazdy",
      ciemna: false,
    },
  ],
};

export type Pasek = {
  id: string;
  nr: string;
  tytul: string;
  zajawka: string;
  stan?: string;
};

// 22.11 (USER_001): sekcja „Od czego zacząć?” usunięta. Zostają paski w tej kolejności:
// O mnie, AI dla każdego, AI dla firm, Projekty, Sklep. Podcast i Rolki zdjęte (treść zostaje w dane.ts na później).
export const PASKI: Pasek[] = [
  { id: "o-mnie", nr: "01", tytul: "O mnie", zajawka: "Moje podejście do AI." },
  { id: "kazdy", nr: "02", tytul: "AI dla każdego", zajawka: "" },
  { id: "firmy", nr: "03", tytul: "AI dla firm", zajawka: "Warsztat dla zespołu do 12 osób." },
  // 22.11 (USER_001): Projekty i Sklep schowane, wrócą później (treść zostaje niżej: PROJEKTY, MATERIALY).
  // { id: "projekty", nr: "04", tytul: "Projekty", zajawka: "Narzędzia AI, które zbudowałem." },
  // { id: "sklep", nr: "05", tytul: "Sklep", zajawka: "Materiały i kursy o AI.", stan: "Wkrótce" },
];

// 22.11 (USER_001): w „O mnie” tylko moje zdjęcie, krótki tekst o podejściu do AI (wg BIO z kursu Popiela, lekcja M9 L04:
// kim jestem, od kiedy, w co wierzę, czemu się sprzeciwiam, misja, supermoc) i zdjęcie certyfikatu. Życiorys z latami usunięty.
// Treść podejścia złożona z tez samego USER_001: „dane ważniejsze niż samo AI” (temat podcastu), „dzień pracy z AI, nie wykład”
// (strona szkoleń), „bez straszenia” (strach przed utratą pracy jako temat webinaru). Bez liczb klientów: brak potwierdzenia.
export const O_MNIE = {
  zdjecie: { src: "/bruno/jakub-webinar-okno.jpg", alt: "Jakub Chodakowski", podpis: "", w: 1200, h: 1200 },
  // 22.11 (USER_001): tezy połączone w jeden tekst, pogrubione „Wierzę”, „Nie zgadzam się”, „Pokazuję”, „Chcę”.
  // 22.11 (USER_001): 3 akapity, zmienione ostatnie zdanie.
  tekst: [
    [
      { t: "Nazywam się Jakub Chodakowski. Od 2022 roku uczę, jak korzystać z AI. " },
      { b: "Wierzę" },
      { t: ", że dane są ważniejsze niż samo AI. Bez dobrych danych najlepsze narzędzie niewiele da." },
    ],
    [
      { b: "Nie zgadzam się" },
      { t: " na straszenie AI, bo strach niczego nie uczy, a praktyka tak. Zawsze " },
      { b: "pokazuję" },
      { t: " AI w działaniu, nie opieram się tylko na teorii. Prosto i bez żargonu." },
    ],
    [
      { b: "Chcę" },
      { t: ", żeby każdy wiedział, jak sztuczna inteligencja może zmienić jego życie, zanim świat zmieni się bez niego." },
    ],
  ] as { t?: string; b?: string }[][],
  cert: { src: "/cert-ai-managers.png", alt: "Certyfikat AI for Managers, Elephant AI, Jakub Chodakowski", podpis: "Certyfikat AI for Managers, Elephant AI, 20.06.2024", w: 1798, h: 1274 },
};

export const FIRMY = {
  lead: "Zespół nie potrzebuje wykładu o AI. Potrzebuje dnia pracy z AI.",
  punkty: [
    { co: "1 dzień", o: "7 godzin w firmie albo 6 godzin online" },
    { co: "do 12 osób", o: "każdy pracuje na swoim laptopie" },
    { co: "od 3 900 zł", o: "netto" },
  ],
  cta: { tekst: "Zobacz szkolenie", href: "/szkolenie-ai-dla-firm" },
  // 22.11 (USER_001): nad formularzem „Uzupełnij formularz” (bez zdania o 24 godzinach), telefon obowiązkowy,
  // pole opisu „Czego potrzebujecie?”.
  formularz: {
    tytul: "Uzupełnij formularz",
    wariant: {
      telefonWymagany: true,
      etykietaWiadomosc: "Czego potrzebujecie?",
      przykladWiadomosc: "np. szybsze raporty, mniej czasu na maile, porządek w dokumentach",
    },
  },
};

export const KAZDY = {
  lead: "Godzina, po której AI przestaje być czarną magią. Dla osób, które dopiero zaczynają.",
  punkty: [
    // 22.11 (USER_001): webinar raz w miesiącu (nie co wtorek), online, bezpłatnie.
    { co: "1 raz", o: "w miesiącu" },
    { co: "60 minut", o: "online" },
    { co: "0 zł", o: "bezpłatnie" },
  ],
  zapis: "Poinformuj mnie o najbliższym spotkaniu",
};

// Pierwsze tematy: lista USER_001 z 22.11.2026. Pełna lista tematów w Projekty/szkolenia-ai-firmy/MARKA-OSOBISTA.md.
export const PODCAST = {
  lead: "Opowiadam o AI tak, jak przy kawie. Każdy odcinek trafia też na blog jako artykuł.",
  kanaly: ["YouTube", "Spotify"],
  tematy: [
    "Dlaczego tak mało firm wprowadziło AI?",
    "Dlaczego dane są ważniejsze niż samo AI",
    "AI w wojsku",
    "Filozofia a AI",
    "Dlaczego naukowcy będą dziś zarabiać najwięcej",
  ],
};

export const ROLKI = {
  lead: "To, o czym mówi dziś świat, pokazane z pomocą AI. Krótko i z przymrużeniem oka.",
  kanaly: ["YouTube", "Instagram", "TikTok"],
};

export const PROJEKTY = [
  { nazwa: "AI Gabi", opis: "Czat AI, któremu można się wygadać bez oceniania.", href: "https://lovemyself.pl/aigabi", adres: "lovemyself.pl" },
  { nazwa: "Bruno AI", opis: "Trener rozmów. AI gra rozmówcę głosem i ocenia rozmowę.", href: "https://salesbruno.pl", adres: "salesbruno.pl" },
  { nazwa: "Blog o AI", opis: "20 artykułów o AI w pracy. Każda liczba ma źródło.", href: "/blog", adres: "jakubchodakowski.com/blog" },
  { nazwa: "Katalog narzędzi AI", opis: "11 narzędzi sprawdzonych na stronie producenta.", href: "/ai", adres: "jakubchodakowski.com/ai" },
];

export const MATERIALY = {
  lead: "Sklep z materiałami i kursami o AI ruszy wkrótce. Za darmo już teraz:",
  darmowe: [
    { co: "Katalog narzędzi AI", o: "11 narzędzi, ceny i dane", href: "/ai" },
    { co: "Blog o AI", o: "20 artykułów do czytania", href: "/blog" },
  ],
};

export const NEWSLETTER = {
  h2: "Bądź na bieżąco z AI",
  opis: "Newsletter, materiały do pobrania i zaproszenia na webinary. Wypisanie jednym kliknięciem.",
  przycisk: "Zapisz się",
  // 22.11: zapis podłączony (/api/newsletter, tabela jc_newsletter, double opt-in).
  ok: { tytul: "Sprawdź skrzynkę.", tekst: "Wysłałem mail z przyciskiem „Potwierdzam zapis”. Bez kliknięcia zapis się nie liczy." },
  juz: { tytul: "Ten adres już jest na liście.", tekst: "Kolejne maile przyjdą na ten adres." },
  komunikaty: {
    potwierdzony: "Zapis potwierdzony. Mail powitalny jest już w skrzynce.",
    wypisano: "Adres wypisany z newslettera. Więcej maili nie będzie.",
    "zly-link": "Ten link już nie działa. Wystarczy zapisać się jeszcze raz.",
  },
};
