import { BRANZE, DOSWIADCZENIE, TRYBY, type Filtry } from "./handlowcy";

// 12.11 (USER_001): firma opisuje zwykłymi słowami, jakiego handlowca szuka („handlowiec OZE z Warszawy, min. 3 lata, B2B”),
// a tu zamieniamy opis na filtry wyszukiwarki. Bez modelu AI: słowa kluczowe i rdzenie słów, działa od razu i za darmo.

const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

/** Branża z formularza → rdzenie słów, po których ją rozpoznajemy (po normalizacji: bez ogonków, małe litery). */
const SLOWA_BRANZ: Record<string, string[]> = {
  Nieruchomości: ["nieruchom", "mieszkan", "deweloper", "posrednik", "posrednictw"],
  "OZE i fotowoltaika": ["oze", "fotowolt", "pv ", "pompy ciepla", "pomp ciepla", "magazyn energii", "energ"],
  "IT i oprogramowanie": [" it ", "it,", "saas", "oprogramow", "software", "informaty", "aplikac"],
  "Finanse i ubezpieczenia": ["finans", "ubezpiecz", "kredyt", "bank", "leasing", "polis", "inwestyc"],
  Motoryzacja: ["motoryz", "samochod", "aut ", "auto", "dealer", "salon samoch", "flot"],
  Budownictwo: ["budow", "material", "okn", "drzwi", "dach", "remont", "wykonczen"],
  "Medycyna i farmacja": ["medyc", "farma", "lek", "szpital", "klinik", "przedstawiciel medyczny", "stomatolog"],
  Telekomunikacja: ["telekom", "gsm", "internet", "operator", "swiatlowod"],
  "Produkty spożywcze": ["spozyw", "fmcg", "zywnos", "napoj", "handel detaliczny"],
  Przemysł: ["przemys", "produkc", "maszyn", "narzedzi", "chemi", "opakowan", "metal"],
  "Usługi dla firm": ["uslug", "outsourc", "marketing", "rekrutac", "szkolen", "doradztw", "ksiegow"],
};

/** Miasto (mianownik) → rdzeń, po którym je rozpoznajemy w każdym przypadku („z Warszawy”, „w Krakowie”). */
const MIASTA: [string, string][] = [
  ["Warszawa", "warszaw"],
  ["Kraków", "krak"],
  ["Wrocław", "wroclaw"],
  ["Poznań", "pozna"],
  ["Gdańsk", "gdansk"],
  ["Gdynia", "gdyni"],
  ["Sopot", "sopo"],
  ["Łódź", "lodz"],
  ["Łódź", "lodzi"],
  ["Katowice", "katowic"],
  ["Lublin", "lublin"],
  ["Szczecin", "szczecin"],
  ["Bydgoszcz", "bydgoszcz"],
  ["Białystok", "bialyst"],
  ["Białystok", "bialymst"],
  ["Rzeszów", "rzesz"],
  ["Toruń", "torun"],
  ["Kielce", "kielc"],
  ["Olsztyn", "olsztyn"],
  ["Opole", "opol"],
  ["Gliwice", "gliwic"],
  ["Częstochowa", "czestochow"],
  ["Radom", "radom"],
  ["Sosnowiec", "sosnowc"],
  ["Bielsko-Biała", "bielsk"],
  ["Zielona Góra", "zielon"],
  ["Gorzów Wielkopolski", "gorzow"],
];

export type Odczytany = { filtry: Filtry; /** Co zrozumieliśmy, do pokazania firmie jako pigułki. */ etykiety: string[] };

/** Opis firmy → filtry. Czego nie rozpoznamy, tego nie zawężamy (lepiej pokazać więcej handlowców niż zero). */
export function odczytajOpis(opis: string): Odczytany {
  const t = ` ${norm(opis).replace(/[.;:!?()/]/g, " ")} `;
  const etykiety: string[] = [];

  const branze = BRANZE.filter((b) => (SLOWA_BRANZ[b] ?? []).some((s) => t.includes(s)));
  etykiety.push(...branze);

  const miasto = MIASTA.find(([, rdzen]) => t.includes(rdzen))?.[0] ?? "";
  if (miasto) etykiety.push(`📍 ${miasto}`);

  // Doświadczenie: „3 lata”, „min. 5 lat”, „od roku”; „senior / doświadczony” = od 3 lat.
  let lata = "";
  const liczba = t.match(/(\d{1,2})\s*(?:\+\s*)?(?:lat|lata|rok|roku)/)?.[1];
  if (liczba) {
    const n = Number(liczba);
    lata = DOSWIADCZENIE.filter((d) => Number(d.v) <= n).pop()?.v ?? "";
  } else if (/\bod roku\b|\brok doswiadczenia\b/.test(t)) lata = "1";
  else if (/senior|doswiadczon|ekspert/.test(t)) lata = "3";
  const d = DOSWIADCZENIE.find((x) => x.v === lata);
  if (d) etykiety.push(d.l);

  // Komu sprzedaje.
  let rynek = "";
  if (/\bb2b\b|firmom|\bdla firm\b|\bdo firm\b|klient(?:ow|ami)? biznesow/.test(t)) rynek = "Firmom";
  else if (/\bb2c\b|indywidualn|konsument|osobom prywatnym/.test(t)) rynek = "Klientom indywidualnym";
  if (rynek) etykiety.push(rynek === "Firmom" ? "Sprzedaje firmom" : "Sprzedaje klientom indywidualnym");

  // Tryb pracy.
  const tryb = TRYBY.filter((x) => ({ Stacjonarnie: /stacjonar|w biurze/, Hybrydowo: /hybryd/, Zdalnie: /zdaln|remote/, "W terenie": /w terenie|terenow|w trasie/ })[x]?.test(t));
  etykiety.push(...tryb);

  return { filtry: { branze, miasto, lata, rynek, tryb }, etykiety };
}
