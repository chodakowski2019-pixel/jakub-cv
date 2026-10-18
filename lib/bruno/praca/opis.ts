// 18.10 (USER_001: „opisy stanowisk ładnie, szablon na wszystkie”): opis oferty z Adzuna przychodzi jako jeden ciąg
// (np. „Doradca Klienta Miejsce pracy: Nowy Sącz Twój zakres obowiązków A; B. Nasze wymagania C; D…”).
// Szablon: wycina powtórzony tytuł i „Miejsce pracy”, dzieli na sekcje po znanych nagłówkach, sekcje na punkty
// po „;” albo końcu zdania. Bez nagłówków zostaje jeden akapit.

const NAGLOWKI: [RegExp, string][] = [
  [/Twój zakres obowiązków:?/, "Twój zakres obowiązków"],
  [/Zakres obowiązków:?/i, "Twój zakres obowiązków"],
  [/Czym będziesz się zajmować\??:?/, "Twój zakres obowiązków"],
  [/Jakie będą Twoje zadania\??:?/, "Twój zakres obowiązków"],
  [/Obowiązki:?/, "Twój zakres obowiązków"],
  [/Nasze wymagania:?/, "Nasze wymagania"],
  [/Kogo szukamy\??:?/, "Nasze wymagania"],
  [/WYMAGANIA:?|Wymagania:?/, "Nasze wymagania"],
  [/Mile widziane:?/, "Mile widziane"],
  [/To oferujemy:?/, "To oferujemy"],
  [/Co oferujemy\??:?/, "To oferujemy"],
  [/Oferujemy:?/, "To oferujemy"],
  [/Benefity:?/, "Benefity"],
  [/O nas:?/, "O firmie"],
  [/Your responsibilities:?|Responsibilities:?|What you will do:?/, "Twój zakres obowiązków"],
  [/Requirements:?|Your profile:?|What we expect:?/, "Nasze wymagania"],
  [/What we offer:?|We offer:?/, "To oferujemy"],
  [/Nice to have:?/, "Mile widziane"],
];

// Słowa, od których zwykle zaczyna się nowy punkt, gdy w tekście nie ma ani „;”, ani kropek (np. oferty Plus / Polsat).
const POCZATKI =
  "Aktywn\\p{L}*|Realizacja|Realizowanie|Dbałość|Dbanie|Bieżąc\\p{L}*|Obsługa|Pozyskiwanie|Prowadzenie|Budowanie|Utrzymywanie|Przygotowywanie|Przygotowanie|Doradztwo|Doradzanie|Udział|Współpraca|Raportowanie|Negocjowanie|Negocjacje|Organizacja|Organizowanie|Profesjonaln\\p{L}*|Kontakt|Monitorowanie|Analiza|Analizowanie|Reprezentowanie|Tworzenie|Rozwijanie|Rozwój|Planowanie|Wsparcie|Odpowiedzialność|Umiejętnoś\\p{L}*|Doświadczenie|Znajomość|Prawo jazdy|Wykształcenie|Komunikatywność|Samodzielność|Gotowość|Dyspozycyjność|Posiadasz|Masz|Jesteś|Umowa|Wynagrodzenie|Samochód|Pakiet|Szkolenia|Możliwość|Stabiln\\p{L}*|Atrakcyjn\\p{L}*|Premi\\p{L}*|Prowizj\\p{L}*|Telefon|Laptop|Prezentowanie|Promowanie|Sprzedaż|Zapewnienie|Koordynowanie|Wdrażanie|Zarządzanie|Opieka|Utrzymanie|Aktualizowanie|Weryfikacja|Spotkania|Prywatna|Dofinansowanie|Karta|Ubezpieczenie";
// (?!\\p{L}) zamiast \\b: \\b w JS nie zna polskich liter („Sprzedaż|y”, „Dbałość” na końcu).
const DZIEL_SLOWA = new RegExp(`\\s+(?=(?:${POCZATKI})(?!\\p{L}))`, "u");

export type OpisSekcja = { tytul: string; punkty: string[] };
export type OpisStruktura = { lead: string; sekcje: OpisSekcja[]; uciety: boolean };

function punkty(t: string, uciety: boolean): string[] {
  let p = t
    .split(/;\s*|\.\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])|\s+[•·▪●]\s*/)
    .map((x) => x.replace(/^[\s,.:–-]+|[\s,;]+$/g, "").trim())
    .filter((x) => x.length > 1);
  // Długi kawałek bez interpunkcji = punkty sklejone spacją: dziel przed typowym początkiem punktu.
  p = p.flatMap((x) => (x.length > 120 ? x.split(DZIEL_SLOWA).map((y) => y.trim()).filter(Boolean) : [x]));
  // Ostatni punkt uciętego opisu to urwane słowa („Możesz się p”): pomijamy.
  if (uciety && p.length > 1) p = p.slice(0, -1);
  return p.map((x) => x.replace(/[,.:]+$/, "")).map((x) => x[0].toUpperCase() + x.slice(1));
}

export function strukturaOpisu(opis: string, stanowisko: string): OpisStruktura {
  let t = opis.replace(/\s+/g, " ").trim();
  const uciety = /…$|\.\.\.$/.test(t);
  t = t.replace(/\s*(…|\.\.\.)$/, "");
  // Powtórzony tytuł na początku.
  if (t.toLowerCase().startsWith(stanowisko.toLowerCase())) t = t.slice(stanowisko.length).trim();
  // Pozycje nagłówków.
  const traf: { i: number; dl: number; tytul: string }[] = [];
  for (const [re, tytul] of NAGLOWKI) {
    const g = new RegExp(re.source, re.flags.includes("i") ? "gi" : "g");
    for (const m of t.matchAll(g)) {
      if (traf.some((x) => m.index! < x.i + x.dl && m.index! + m[0].length > x.i)) continue;
      traf.push({ i: m.index!, dl: m[0].length, tytul });
    }
  }
  traf.sort((a, b) => a.i - b.i);
  // „Miejsce pracy: X” przed pierwszym nagłówkiem = wycinamy (miasto jest w pigułkach).
  let lead = (traf.length ? t.slice(0, traf[0].i) : t).replace(/Miejsce pracy:[^]*$/, "").replace(/Nr ref\.?:?\s*\S+/g, "").trim();
  if (!traf.length) return { lead: t.replace(/^Miejsce pracy:\s*\S+(\s\S+)?\s*/, ""), sekcje: [], uciety };
  const sekcje: OpisSekcja[] = [];
  traf.forEach((n, k) => {
    const tresc = t.slice(n.i + n.dl, k + 1 < traf.length ? traf[k + 1].i : undefined).trim();
    const pk = punkty(tresc, uciety && k === traf.length - 1);
    if (!pk.length) return;
    const juz = sekcje.find((x) => x.tytul === n.tytul);
    if (juz) juz.punkty.push(...pk);
    else sekcje.push({ tytul: n.tytul, punkty: pk });
  });
  if (lead.length < 3) lead = "";
  return { lead, sekcje, uciety };
}
