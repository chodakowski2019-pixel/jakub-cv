// 5.11 (USER_001): LP B2C „Naucz się sprzedaży z Bruno w 30 dni” = salesbruno.pl/start (docelowo strona główna salesbruno.pl).
// 2 pakiety: 200 zł i 1 000 zł, jednorazowo, 30 dni. Płatność = link Stripe (Payment Link, linki od USER_001 5.11). Po płatności Stripe
// przekierowuje na salesbruno.com/formularzbruno?pakiet=<id> (proxy → /brunostart/formularz; ustawić w Stripe: „Po płatności”
// → „Nie pokazuj strony potwierdzenia” → adres). Lokalnie: localhost:3077/formularzbruno?pakiet=pro.
// Po formularzu komunikat: „Zespół Bruno tworzy dla Ciebie konto. Zajmie to do 24 h. Dostęp dostaniesz na e-mail.”

export type PakietId = "start" | "pro";

export type Pakiet = {
  id: PakietId;
  nazwa: string;
  cena: number; // zł brutto, jednorazowo
  dni: number;
  rozmowDziennie: number;
  podpis: string;
  punkty: string[];
  polecany: boolean;
  stripe: string; // link Stripe; pusty = przycisk prowadzi od razu do formularza (tylko do testów lokalnych)
};

export const DNI = 30;

export const PAKIETY: Pakiet[] = [
  {
    id: "start",
    nazwa: "Bruno Start",
    cena: 200,
    dni: DNI,
    rozmowDziennie: 1,
    podpis: "Jedna rozmowa dziennie. Jak lekcja języka.",
    punkty: ["1 rozmowa głosowa dziennie (30 rozmów)", "Lekcja dnia: jeden sposób na rozmowę", "Ocena po każdej rozmowie", "Bruno udaje klienta z Twojej branży"],
    polecany: false,
    stripe: "https://buy.stripe.com/5kQdR9bps7pu99qbOt3F60B",
  },
  {
    id: "pro",
    nazwa: "Bruno Pro",
    cena: 1000,
    dni: DNI,
    rozmowDziennie: 5,
    podpis: "Pięć rozmów dziennie. Plus Jakub na żywo.",
    punkty: [
      "Do 5 rozmów głosowych dziennie (150 rozmów)",
      "Lekcja dnia + powtórki",
      "Bruno zna Twój produkt i Twoich klientów",
      "2 × 30 min z Jakubem na żywo",
      "Egzamin i dyplom z wynikiem",
    ],
    polecany: true,
    stripe: "https://buy.stripe.com/8x23cv3X04digBS19P3F60A",
  },
];

export const GWARANCJA = {
  dni: DNI,
  dniTreninguMin: 20, // tyle dni z 30 trzeba przećwiczyć, żeby prosić o zwrot (gwarancja dla tych, którzy trenują)
};

// Liczby ze źródeł (5.11.2026). Każda ma link w `zrodlo`.
export const LICZBY = {
  medianaPL: { kwota: 7695, zrodlo: "GUS, mediana wynagrodzeń, kwiecień 2026", link: "https://www.gncrypto.news/pl/wiadomosci/mediana-plac-w-polsce-7695-zl-dane-gus-kwiecien-2026/" },
  medianaHandlowiec: { kwota: 8428, zrodlo: "zarobky.pl, 1 054 zgłoszeń, 30.10.2026", link: "https://zarobky.pl/stanowisko/Handlowiec" },
  top10Handlowiec: { kwota: 22260, zrodlo: "zarobky.pl, najlepiej opłacane 10 % handlowców", link: "https://zarobky.pl/stanowisko/Handlowiec" },
  wygrane: { top: 74, reszta: 47, zrodlo: "RAIN Group, Top-Performing Seller Benchmark Report", link: "https://www.rainsalestraining.com/hubfs/PDFs/The_Top-Performing_Seller_Benchmark_Report.pdf" },
  ai: { procent: 34, zrodlo: "Brynjolfsson, Li, Raymond, Quarterly Journal of Economics 2025, 5 179 osób", link: "https://academic.oup.com/qje/article/140/2/889/7990658" },
  szczyt: { procent: 288, zrodlo: "Towers Watson (UK): szczyt zawodu vs. początek, pensja + premie", link: "https://www.raconteur.net/sales-performance-2012/doing-well-but-could-do-better" },
};

export const KONTAKT = "jakub@salesbruno.com";

export function pakiet(id: string | null | undefined): Pakiet | null {
  return PAKIETY.find((p) => p.id === id) ?? null;
}

export function linkKup(p: Pakiet): string {
  return p.stripe || `/formularzbruno?pakiet=${p.id}`;
}

export const zl = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} zł`;
