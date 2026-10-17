// 17.10 (USER_001: filtry i pigułki jak Pracuj.pl): cechy oferty wyliczane z tytułu, firmy i opisu.
// Adzuna podaje tylko tytuł i skrót opisu, więc to reguły słów. Brak sygnału = null (oferta nie łapie się w filtr).
// Czysty JS: używa go skrypt importu (node) i nic więcej.

const ma = (re, t) => re.test(t);

/** Poziom stanowiska (nazwy jak Pracuj.pl). */
export function poziom(tytul) {
  const t = tytul.toLowerCase();
  if (ma(/praktyk|stażyst|\bstaż/, t)) return "Praktykant / stażysta";
  if (ma(/asystent/, t)) return "Asystent";
  if (ma(/dyrektor|director|head of|\bprezes/, t)) return "Dyrektor";
  if (ma(/kierownik|koordynator|team lead|lider|zastępca kierownika/, t)) return "Kierownik / koordynator";
  if (ma(/(regional|area|sales|country|salon\w*)\s+manager|menedżer|menadżer|manager\s+(regionu|sprzeda)/, t) && !ma(/account manager|key account|menedżer klienta/, t))
    return "Menedżer";
  if (ma(/ekspert/, t)) return "Ekspert";
  if (ma(/starsz|senior/, t)) return "Starszy specjalista (senior)";
  if (ma(/młodsz|junior/, t)) return "Młodszy specjalista (junior)";
  return "Specjalista (mid / regular)";
}

/** Rodzaj umowy. Uwaga: „sprzedaż B2B” to nie „kontrakt B2B”. */
export function umowa(tytul, opis, adzuna) {
  const t = `${tytul} ${opis}`.toLowerCase();
  if (ma(/kontrakt b2b|umow\w* b2b|współprac\w* (w oparciu o |na zasadach |w formie )?b2b|faktur/, t)) return "Kontrakt B2B";
  if (ma(/umow\w* o prac/, t) || adzuna === "permanent") return "Umowa o pracę";
  if (ma(/umow\w* zleceni|zleceniobior/, t)) return "Umowa zlecenie";
  if (ma(/umow\w* agencyjn|agent ubezpiecz|przedstawiciel\w* ubezpiecz|doradc\w* ubezpiecz/, t)) return "Umowa agencyjna";
  if (adzuna === "contract") return "Umowa zlecenie";
  return null;
}

/** Wymiar pracy. Handlowcy prawie zawsze na pełny etat, więc to domyślne. */
export function wymiar(tytul, opis, adzunaCzas) {
  const t = `${tytul} ${opis}`.toLowerCase();
  if (ma(/część etatu|pół etatu|1\/2 etatu|part.?time/, t) || adzunaCzas === "part_time") return "Część etatu";
  if (ma(/dodatkow|tymczasow|sezonow/, t)) return "Dodatkowa / tymczasowa";
  return "Pełny etat";
}

/** Tryb pracy. Przedstawiciel / teren = mobilna. */
export function tryb(tytul, opis) {
  const t = `${tytul} ${opis}`.toLowerCase();
  if (ma(/zdaln|remote|home office/, t)) return "Praca zdalna";
  if (ma(/hybryd/, t)) return "Praca hybrydowa";
  if (ma(/teren|mobiln|przedstawiciel|samoch[oó]d służbowy|w podróży|delegac/, t)) return "Praca mobilna";
  return "Praca stacjonarna";
}

const BRANZE = [
  ["Ubezpieczenia", /ubezpiecz|warta|allianz|prudential|\bpru\b|generali|pzu|\bcuk\b|unilink|liberty|uniqa|ergo hestia|compensa/],
  ["Banki i finanse", /bank|kredyt|leasing|finans|pożycz|alior|credit agricole|santander|pekao|\bamex\b|rudder/],
  ["Energetyka i OZE", /energ|fotowolt|\boze\b|pomp\w* ciepła|biogaz|magazyn\w* energii|supreme energy|eco run|metan/],
  ["Telekomunikacja", /netia|orange|\bplay\b|t-mobile|telekom|światłow|internet/],
  ["Farmacja i medycyna", /medycz|farmac|pharma|krka|klinicz|weteryn|lek[óo]w|synektik|regenova|fortis/],
  ["Motoryzacja", /samoch|motoryz|\bauto|e100|paliw|opon|flot/],
  ["Budownictwo i wnętrza", /budow|stolark|okien|okna|drzwi|mapei|kronospan|dźwig|grzejnik|onninen|instalac|termomodern|leroy|focus garden|ogrod|płyt|wnętrz/],
  ["FMCG i spożywcze", /unilever|fmcg|spożyw|żywien|distillers|napoj|alkohol|cursor|bydła|pasz/],
  ["IT i technologie", /\bit\b|oprogramow|software|saas|technolog|tech\b|druk|printing|security/],
  ["Nieruchomości", /nieruchom|wawahome|mieszka/],
  ["Przemysł i produkcja", /przemysł|automatyk|uszczelni|tektur|opakow|ds smith|maszyn|produkc|emal|stal|chemi|techem/],
  ["Edukacja i szkolenia", /szkoł|eduk|szkoleni|kurs/],
];

/** Branża z firmy, tytułu i opisu. */
export function branza(tytul, firma, opis) {
  const t = `${tytul} ${firma} ${opis}`.toLowerCase();
  for (const [nazwa, re] of BRANZE) if (re.test(t)) return nazwa;
  return "Inne";
}

/** „praca od zaraz” jak na Pracuj.pl. */
export function odZaraz(opis) {
  return /od zaraz|od teraz|natychmiast/i.test(opis);
}

// 17.10 v3 (wzór RocketJobs): umiejętności jako tagi na karcie oferty. Z tytułu i skrótu opisu.
const UMIEJETNOSCI = [
  ["sprzedaż B2B", /b2b|klient\w* biznes|firm/],
  ["pozyskiwanie klientów", /pozyskiw|nowych klient|prospect|akwizyc/],
  ["obsługa klienta", /obsług\w* klient|opiek\w* (nad )?klient|doradztw|doradc/],
  ["negocjacje", /negocj/],
  ["sprzedaż telefoniczna", /telefon|telesprzeda|telemarket|call/],
  ["sprzedaż w terenie", /teren|przedstawiciel|wizyt|samoch[oó]d/],
  ["zarządzanie zespołem", /kierownik|menedżer|manager|dyrektor|zespoł|lider/],
  ["prawo jazdy kat. B", /prawo jazdy|kat\.? ?b\b/],
  ["język angielski", /angiels|english/],
  ["key account", /key account|kluczow/],
  ["produkty finansowe", /ubezpiecz|kredyt|bank|finans|inwest/],
  ["wiedza techniczna", /techn|inżynier|instalac|automatyk/],
];
export function umiejetnosci(tytul, opis) {
  const t = `${tytul} ${opis}`.toLowerCase();
  return UMIEJETNOSCI.filter(([, re]) => re.test(t)).map(([n]) => n).slice(0, 4);
}
