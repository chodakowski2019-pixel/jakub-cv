// Strona sprzedażowa „Szkolenie AI dla firm” (20.11.2026).
// Cała treść i wszystkie liczby w jednym pliku: zmiana ceny albo zdania = zmiana tutaj.
//
// Zasady treści:
// - TEMAT TO TYLKO AI. Nic o sprzedaży (USER_001 21.11.2026): ani w życiorysie, ani w przykładach, ani w hasłach,
// - do czytelnika bezosobowo (bez „Ty”), prowadzący mówi w 1. osobie („odpowiadam”, „pokazuję”),
// - proste, krótkie zdania, zero myślników,
// - żadnych liczb bez źródła: dane rynkowe i badania mają pole `zrodlo`.
// Zasady czytelności (21.11.2026, wg kursu Popiela, Corey Haines i 15 zasad z bazy SEO):
// - zdanie średnio do 12 słów, żadne powyżej 20; gdzie był przecinek, często stoi kropka,
// - strona czynna i czasowniki zamiast rzeczowników („buduję”, nie „budowa”),
// - cecha → korzyść: przy każdej rzeczy drugie zdanie mówi, co z niej wynika,
// - nagłówek sekcji to pełne zdanie; same nagłówki mają opowiedzieć całą stronę,
// - punkt listy = pogrubiony początek + najwyżej 2 zdania.
// Układ i chwyty wg analizy 27 stron sprzedających szkolenia firmowe (USA, UK, PL) z 20.11.2026.

export const KONTAKT = {
  email: "hello@jakubchodakowski.com",
  linkedin: "https://www.linkedin.com/in/jakub-chodakowski",
  nip: "6711845485",
};

// DO POTWIERDZENIA: ceny wyjściowe z analizy rynku z 20.11.2026
// (próg wejścia: MKM Labs 5 999 zł, SmartCodeIT 5 900 zł za dzień, online 3 999 do 4 900 zł).
export const CENY = {
  wFirmie: 5900,
  online: 3900,
  dwaDni: 9900,
  grupa: 12,
};

// Twarda spacja (znak 160): liczby i jednostki nie łamią się między wierszami.
const TS = String.fromCharCode(160);
// 5900 → „5 900 zł” (toLocaleString po polsku nie rozdziela liczb czterocyfrowych).
export const zl = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, TS)}${TS}zł`;

export const HERO = {
  nad: "Szkolenie AI dla firm",
  h1: ["Zespół nie potrzebuje wykładu o AI.", "Potrzebuje dnia pracy z AI."],
  // Wstęp pod nagłówkiem usunięty (USER_001 21.11.2026: „usuń”).
  cta: "Sprawdź wolny termin",
  cta2: "Zobacz rozkład dnia",
  pod: "Formularz zajmuje 1 minutę. Odpowiadam osobiście w 24 godziny.",
};

// Tabliczka w hero: najważniejsze fakty jak na bilecie.
export const BILET: { k: string; w: string }[] = [
  { k: "Czas", w: "1 dzień, 7 godzin" },
  { k: "Grupa", w: `do ${CENY.grupa} osób` },
  { k: "Miejsce", w: "w firmie albo online" },
  { k: "Termin", w: "od 2 tygodni" },
  { k: "Cena", w: `od ${zl(CENY.online)} netto` },
];

export const FOTO = {
  src: "/talk-crash-mondays.png",
  alt: "Jakub Chodakowski prowadzi wystąpienie o AI przed pełną salą",
  // „Wystąpienie o AI i danych” usunięte z podpisu; temat stoi dużym napisem na zdjęciu: „O AI i danych” (USER_001 21.11.2026).
  podpis: "CRASH Mondays, sierpień 2024.",
};

export const SYTUACJA = {
  tytul: "AI już jest w firmie. Zwykle bez zasad.",
  opis: "Która z tych sytuacji brzmi znajomo?",
  wiersze: [
    { co: "Pracownicy korzystają z ChatGPT na własną rękę.", skutek: "Każdy robi to inaczej. Nikt nie wie, co działa." },
    { co: "Do AI trafiają dane klientów, umowy i wyceny.", skutek: "Nikt nie spisał, czego nie wolno wklejać." },
    { co: "Część zespołu nie korzysta z AI wcale.", skutek: "Te same zadania jedni robią z AI, a drudzy ręcznie." },
    {
      co: "Art. 4 AI Act obowiązuje od 2 lutego 2025 r.",
      skutek: "Firma ma podejmować działania, które rozwijają kompetencje AI pracowników.",
    },
  ],
  // Liczby GUS (39,8% Polaków, 17,8% firm) usunięte ze strony (USER_001 21.11.2026: „usuń”). Źródła zostają w RESEARCH-2026-11-20.md.
};

// Dowód pożyczony z badania, skoro własnych wyników klientów jeszcze nie ma.
// Teza i jej dowód stoją razem: najpierw zdanie, pod nim 2 liczby ze źródłem.
const BADANIE_ZRODLO = "Harvard Business School i BCG, badanie 758 konsultantów, 2023";
export const BADANIE = {
  nad: "Dlaczego szkolenie",
  wniosek: "AI przyspiesza pracę tylko tam, gdzie się nadaje. Na szkoleniu zespół uczy się to rozpoznawać.",
  liczby: [
    {
      n: "25%",
      opis: "O tyle szybciej kończyli zadania konsultanci pracujący z AI. Tam, gdzie AI się nadawało.",
      zrodlo: BADANIE_ZRODLO,
    },
    {
      n: "19 pkt proc.",
      opis: "O tyle rzadziej dawali poprawny wynik. Tam, gdzie AI się nie nadawało.",
      zrodlo: BADANIE_ZRODLO,
    },
  ],
};

export const EFEKT = {
  tytul: "Co zostaje w firmie po szkoleniu",
  grupy: [
    {
      kto: "Każdy uczestnik",
      co: [
        "Działający asystent AI, ustawiony pod stanowisko.",
        "Zestaw poleceń do zadań, które wykonuje co tydzień.",
        "Imienne zaświadczenie o udziale.",
      ],
    },
    {
      kto: "Firma",
      co: [
        "Zasady korzystania z AI na 1 stronie: co wolno wklejać, a czego nie.",
        "Lista 3 procesów do usprawnienia, z osobą odpowiedzialną i terminem.",
        "Program i lista obecności do dokumentacji działań z art. 4 AI Act.",
      ],
    },
    {
      kto: "Po 14 dniach",
      co: ["Spotkanie online, 45 minut. Pytania z praktyki i poprawki. Po szkoleniu nie znikam."],
    },
  ],
};

// 4 bloki pracy, każdy kończy się gotową rzeczą. Wiersz bez `opis` = przerwa.
export const ROZKLAD = {
  nad: "Rozkład dnia",
  tytul: "Jeden dzień, cztery bloki pracy",
  wiersze: [
    {
      g: "9:00",
      blok: "Pierwsze polecenia",
      opis: "Co AI potrafi, a czego nie. Każdy uczy się pisać polecenia, które dają dobry wynik.",
      zostaje: "Zestaw poleceń do własnych zadań.",
    },
    { g: "11:00", blok: "Przerwa" },
    {
      g: "11:15",
      blok: "Zadania z firmy",
      opis: "Maile, raporty, notatki ze spotkań, prezentacje. Praca na zadaniach zespołu, bez danych klientów.",
      zostaje: "Gotowe wzory do codziennej pracy.",
    },
    { g: "12:45", blok: "Obiad" },
    {
      g: "13:30",
      blok: "Własny asystent",
      opis: "Każdy ustawia asystenta AI pod swoje stanowisko. Potem sprawdza go na 3 zadaniach.",
      zostaje: "Działający asystent AI.",
    },
    {
      g: "14:45",
      blok: "Zasady i plan",
      opis: "Czego nie wklejać do AI. Potem 3 procesy do usprawnienia: kto odpowiada i do kiedy.",
      zostaje: "Zasady na 1 stronie i plan na 30 dni.",
    },
    { g: "16:00", blok: "Koniec" },
  ] as { g: string; blok: string; opis?: string; zostaje?: string }[],
  uwaga: "To przykładowy rozkład. Ostateczny program układam po rozmowie, pod zadania zespołu.",
};

// 3 kroki: przed, w dniu, po (wzór: Josh Braun). Każdy z liczbą.
export const PRZEBIEG = {
  tytul: "Trzy kroki od rozmowy do szkolenia",
  opis: "Najszybciej 2 tygodnie od pierwszej rozmowy.",
  kroki: [
    {
      tytul: "Rozmowa",
      meta: "15 minut, bezpłatnie",
      co: "Pytam o zadania zespołu, poziom grupy i narzędzia w firmie. Jeśli szkolenie nie pasuje, mówię to od razu. Po rozmowie wysyłam program i cenę.",
    },
    {
      tytul: "Dzień szkolenia",
      meta: "7 godzin w firmie albo 6 godzin online",
      co: "Każdy pracuje na swoim laptopie, na zadaniach z firmy. Najszybciej 2 tygodnie od rozmowy.",
    },
    {
      tytul: "Spotkanie po 14 dniach",
      meta: "45 minut online",
      co: "Zespół wraca z pytaniami z praktyki. Poprawiamy to, co nie działa. Po szkoleniu nie znikam.",
    },
  ],
};

export const DLA_KOGO = {
  tytul: "Dla kogo jest to szkolenie, a dla kogo nie",
  takTytul: "To szkolenie jest dla:",
  nieTytul: "To szkolenie nie jest dla:",
  tak: [
    "Firmy od 5 do 100 osób.",
    "Zespoły biurowe: marketing, obsługa klienta, administracja, HR.",
    "Zespoły, które zaczynają od zera albo korzystają z AI na własną rękę.",
  ],
  nie: [
    "Programiści, którzy szukają szkolenia z pisania kodu z AI.",
    "Firmy, które chcą wykładu bez pracy przy komputerze.",
    "Jedna grupa powyżej 12 osób. Większy zespół dzielę na grupy.",
  ],
};

export const PROWADZACY = {
  tytul: "Kto prowadzi",
  imie: "Jakub Chodakowski",
  lead: "Od 2022 roku buduję narzędzia z AI. Na szkoleniu pokazuję to, czego sam używam w pracy każdego dnia.",
  // Życiorys skrócony 21.11.2026 (USER_001): usunięte 2023 strona z artykułami, 2024 CRASH Mondays, 2026 Itera City i Bruno AI.
  os: [
    { rok: "2022", co: "Premiera ChatGPT, 30.11.2022. Od tego dnia buduję i wdrażam narzędzia z AI." },
    { rok: "2024", co: "Certyfikat AI for Managers, Elephant AI. 7 tygodni, ponad 35 godzin, egzamin. Prowadząca: Maria Parysz." },
    { rok: "2025", co: "Szkolę nauczycieli z praktycznego użycia AI." },
  ],
  cert: { src: "/cert-ai-managers.png", alt: "Certyfikat AI for Managers, Elephant AI, Jakub Chodakowski", podpis: "Certyfikat AI for Managers, 20.06.2024" },
  // USER_001 21.11.2026: zdjęcie w kolorze; najpierw oryginał z prawdziwym tłem, potem: „jednak weź to moje zdjęcie z pomarańczowym tłem”.
  portret: { src: "/profilowe_jakub-hero.png", alt: "Jakub Chodakowski" },
};

export const CENA = {
  tytul: "Jedna cena za całą grupę",
  formy: [
    { forma: "Warsztat w firmie", czas: "1 dzień, 7 godzin", grupa: `do ${CENY.grupa} osób`, cena: CENY.wFirmie, glowna: true },
    { forma: "Warsztat online na żywo", czas: "1 dzień, 6 godzin", grupa: `do ${CENY.grupa} osób`, cena: CENY.online },
    { forma: "Szkolenie i wdrożenie", czas: "2 dni", grupa: `do ${CENY.grupa} osób`, cena: CENY.dwaDni },
  ] as { forma: string; czas: string; grupa: string; cena: number; glowna?: boolean }[],
  wCenie: [
    "Rozmowa przed szkoleniem i program ułożony pod firmę.",
    "Materiały i zestawy poleceń dla każdego uczestnika.",
    "Imienne zaświadczenia o udziale.",
    "Spotkanie online po 14 dniach.",
    "Dojazd na terenie Warszawy. Poza Warszawą dojazd wyceniam osobno.",
  ],
  // Rachunek na osobę liczony z CENY.wFirmie.
  osoby: [6, 8, 12],
  rynek: "Dla porównania: szkolenie otwarte kosztuje zwykle od 1 000 do 1 700 zł netto za osobę.",
  // Trzy rzeczy, które zdejmują ryzyko z kupującego. Stoją tuż nad przyciskiem.
  pewniki: [
    { t: "Bez zaliczki", o: "Faktura po szkoleniu, termin 14 dni." },
    { t: "Rozmowa bezpłatna", o: "15 minut. Jeśli szkolenie nie pasuje do zespołu, mówię to od razu." },
    { t: "Po szkoleniu nie znikam", o: "Spotkanie online po 14 dniach jest w cenie." },
  ],
  platnosc: "Faktura po szkoleniu, termin 14 dni. Bez zaliczki.",
  netto: "Ceny netto za całą grupę, nie za osobę.",
  druk: { przycisk: "Oferta do druku (PDF)", opis: "Do przekazania osobie, która decyduje o szkoleniu." },
};

// Kolejność = waga obiekcji: najpierw „czy to zadziała”, na końcu sprawy organizacyjne.
export const PYTANIA = {
  tytul: "Najczęstsze pytania",
  inne: "Inne pytanie? Odpowiadam osobiście, w 24 godziny.",
  lista: [
    {
      p: "Czy po tygodniu zespół nie wróci do starych nawyków?",
      o: "To najczęstszy problem szkoleń. Dlatego każdy wychodzi z asystentem i poleceniami do swoich cotygodniowych zadań. Firma dostaje plan na 30 dni, z osobą i terminem. Po 14 dniach prowadzę spotkanie online.",
    },
    {
      p: "Czy zespół musi znać AI?",
      o: "Nie. Szkolenie zaczyna się od podstaw. Poziom grupy ustalam w rozmowie przed szkoleniem. Do niego dopasowuję program.",
    },
    {
      p: "Ile czasu zaoszczędzi zespół?",
      o: "Tego nie da się uczciwie obiecać przed szkoleniem. To zależy od zadań zespołu. Punkt odniesienia: w badaniu Harvard Business School i BCG konsultanci z AI kończyli zadania o 25% szybciej.",
    },
    {
      p: "Czym to się różni od kursu online?",
      o: "Kurs online każdy ogląda osobno. Tu cały zespół pracuje razem, na zadaniach z firmy. Wychodzi z asystentami, wspólnymi zasadami i planem na 30 dni.",
    },
    {
      p: "Na jakich narzędziach pracuje zespół?",
      o: "Na tych, których firma używa albo chce używać: ChatGPT, Copilot, Gemini, Claude. Przed szkoleniem ustalam, jakie konta są potrzebne. Koszt licencji nie jest wliczony w cenę.",
    },
    {
      p: "Czy dane firmy są bezpieczne podczas szkolenia?",
      o: "Ćwiczenia odbywają się bez danych klientów. Osobny blok uczy, czego nie wklejać do AI. Kończy się zasadami firmy na 1 stronie.",
    },
    {
      p: "Ile osób może wziąć udział?",
      o: "Do 12 osób w jednej grupie. Większy zespół dzielę na kilka grup, w osobnych terminach.",
    },
    {
      p: "W firmie czy online?",
      o: "Obie formy są dostępne. Szkolenie w firmie trwa 7 godzin i odbywa się w całej Polsce. Szkolenie online prowadzę na żywo, trwa 6 godzin.",
    },
    {
      p: "Jak szybko można zorganizować szkolenie?",
      o: "Najszybciej w 2 tygodnie od potwierdzenia terminu.",
    },
    {
      p: "Czy szkolenie można sfinansować z KFS albo BUR?",
      o: "Nie. Szkolenie nie jest wpisane do Bazy Usług Rozwojowych. W zamian nie ma wniosków ani czekania na nabór. Termin ustalamy od razu.",
    },
    {
      p: "Jak wygląda płatność?",
      o: "Fakturę wystawiam po szkoleniu, z terminem 14 dni. Zaliczka nie jest wymagana.",
    },
  ],
};

export const FORMULARZ = {
  tytul: "Wolny termin dla zespołu",
  lead: "Formularz zajmuje 1 minutę.",
  // Co dzieje się po wysłaniu: jasny następny krok zdejmuje obawę przed kliknięciem.
  dalej: {
    tytul: "Co dzieje się po wysłaniu",
    kroki: [
      "Odpowiadam osobiście w 24 godziny, w dni robocze.",
      "Rozmowa: 15 minut, bezpłatnie.",
      "Wysyłam program pod firmę i cenę.",
    ],
  },
  obietnica: "Bez namawiania. Jeśli szkolenie nie pasuje do zespołu, mówię to w pierwszej rozmowie.",
  kto: "Odpowiada Jakub Chodakowski",
  osoby: ["do 5", "6 do 12", "13 do 25", "ponad 25"],
  przyklady: {
    firma: "np. biuro rachunkowe",
    wiadomosc: "np. obsługa klienta i administracja, dużo maili i raportów",
  },
  przycisk: "Wyślij zapytanie o termin",
  zgoda: "Zgadzam się na kontakt w sprawie szkolenia.",
  ok: {
    tytul: "Zapytanie wysłane.",
    tekst: "Odpowiedź z propozycją terminu rozmowy przyjdzie w 24 godziny, w dni robocze.",
  },
};

// ---------- Dodatki do wersji 3 wyglądu (ciemny styl wzorowany na szablonie „Dominion”, 21.11.2026) ----------

// Tabliczka pod nagłówkiem: 3 fakty w jednym wierszu.
export const HERO_TAG = `1 dzień. Do ${CENY.grupa} osób. Od ${zl(CENY.online)} netto.`;

// „Schody”: 4 rzeczy, które zostają po szkoleniu. Pierwsze zdanie = co to jest, drugie = co z tego wynika.
export const SCHODY_OPIS = "Cztery gotowe rzeczy, do użycia od następnego dnia.";
export const SCHODY = [
  { t: "Asystent AI", o: "Ustawiony pod stanowisko. Gotowy do pracy następnego dnia." },
  { t: "Zestaw poleceń", o: "Do zadań, które wracają co tydzień. Nikt nie zaczyna od pustego okna." },
  { t: "Zasady na 1 stronie", o: "Co wolno wklejać do AI, a czego nie. Każdy zna granicę." },
  { t: "Plan na 30 dni", o: "3 procesy do usprawnienia. Każdy ma osobę i termin." },
];
export const SCHODY_TAKZE = [
  { t: "Imienne zaświadczenia.", o: "Dla każdego uczestnika." },
  { t: "Program i lista obecności.", o: "Do dokumentów firmy, na potrzeby art. 4 AI Act." },
  { t: "Spotkanie po 14 dniach.", o: "45 minut online. Pytania z praktyki i poprawki." },
];

// Liczby przy prowadzącym: tylko fakty z życiorysu. „35+ godzin” i „2024 występuję i szkolę” usunięte (USER_001 21.11.2026).
export const PROWADZACY_LICZBY = [
  { n: "2022", o: "od tego roku buduję z AI" },
];

// Przewijana taśma z działami i nazwami narzędzi usunięta (USER_001 21.11.2026). Zostały loga ChatGPT, Claude, Gemini: Loga.tsx.
