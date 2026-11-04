import type { Kryterium, Rozmowa } from "./db";
import { etykiety } from "./etykiety";
import type { AnalizaHandlowca, Deal, Etap } from "./lejek";

// 4.11 (USER_001, pkt 5): AUTOMATYCZNY DOBÓR TRENINGU. Bruno sam proponuje jedną rozmowę z trzech źródeł:
// (a) etap lejka, na którym handlowiec traci deale (CRM), (b) najsłabsze kryterium rubryki z ocenionych rozmów,
// (c) obiekcja z notatek CRM (proste dopasowanie słów). Wynik = gotowa „sytuacja” do /bruno/rozmowa?sytuacja=.
// Jeden przycisk „Trenuj to, co dziś najważniejsze”; ręczny wybór zostaje jako „Inny scenariusz”.

export type Propozycja = {
  etap: Etap | null;
  deal: Deal | null;
  kryterium: Kryterium["nazwa"] | null;
  kryteriumNazwa: string | null;
  obiekcja: string | null;
  /** 1 zdanie dla handlowca: dlaczego ten trening. */
  dlaczego: string;
  sytuacja: string;
  link: string;
};

const OBIEKCJE: { klucz: RegExp; pl: string; en: string }[] = [
  { klucz: /za drog|drogo|cena|budżet|budzet|taniej|rabat/i, pl: "za drogo / brak budżetu", en: "too expensive / no budget" },
  { klucz: /konkurenc|inna ofert|porówn/i, pl: "porównują z konkurencją", en: "comparing with competitors" },
  { klucz: /później|pozniej|przesun|za miesiąc|na razie nie|odłóż|odloz/i, pl: "„wróćmy do tego później”", en: "“let’s come back to this later”" },
  { klucz: /zastanow|przemyśl|przemysl|skonsultow|szef|zarząd|zarzad|decyd/i, pl: "„muszę to skonsultować”", en: "“I need to check with my boss”" },
  { klucz: /nie widz|po co|nie potrzeb|mamy już|mamy juz/i, pl: "nie widzą wartości", en: "they don’t see the value" },
];

export function dobierzTrening(w: { jezyk: "pl" | "en"; analiza: AnalizaHandlowca | null; deale: Deal[]; rozmowy: Rozmowa[]; notatki: string[] }): Propozycja {
  const pl = w.jezyk === "pl";
  const { NAZWY } = etykiety(w.jezyk);

  // (b) najsłabsze kryterium: średnia z ocenionych rozmów (ostatnie 20).
  const oceny = new Map<Kryterium["nazwa"], number[]>();
  for (const r of w.rozmowy.filter((x) => x.feedback?.kryteria?.length).slice(0, 20)) {
    for (const k of r.feedback!.kryteria) oceny.set(k.nazwa, [...(oceny.get(k.nazwa) ?? []), k.ocena]);
  }
  const kryterium = [...oceny.entries()].map(([n, xs]) => ({ n, s: xs.reduce((a, b) => a + b, 0) / xs.length })).sort((a, b) => a.s - b.s)[0]?.n ?? null;

  // (c) obiekcja z notatek CRM.
  const tekst = w.notatki.join(" \n ");
  const ob = OBIEKCJE.find((o) => o.klucz.test(tekst)) ?? null;
  const obiekcja = ob ? (pl ? ob.pl : ob.en) : null;

  // (a) etap z CRM + jeden otwarty deal na tym etapie (najwyższa wartość).
  const etap = w.analiza?.najslabszy ?? null;
  const deal = etap ? w.deale.filter((d) => d.status === "open" && d.etap_id === etap.id).sort((a, b) => b.wartosc - a.wartosc)[0] ?? null : null;

  const czesci: string[] = [];
  const dlaczego: string[] = [];
  if (etap) {
    czesci.push(pl ? `Etap lejka: ${etap.nazwa}. Na tym etapie tracę najwięcej deali (${w.analiza?.przegrane ?? 0} przegranych).` : `Pipeline stage: ${etap.nazwa}. This is where I lose the most deals (${w.analiza?.przegrane ?? 0} lost).`);
    dlaczego.push(pl ? `tracisz najwięcej na etapie „${etap.nazwa}”` : `you lose the most at “${etap.nazwa}”`);
  }
  if (deal) {
    const kto = `${deal.tytul}${deal.osoba ? `, ${deal.osoba}` : ""}${deal.organizacja ? ` (${deal.organizacja})` : ""}, ${Math.round(deal.wartosc)} ${deal.waluta}`;
    czesci.push(pl ? `Prawdziwy deal z mojego CRM: ${kto}.` : `A real deal from my CRM: ${kto}.`);
  }
  if (kryterium) {
    czesci.push(pl ? `Moje najsłabsze kryterium w ocenach trenera: ${NAZWY[kryterium].toLowerCase()}. Naciskaj tam.` : `My weakest coaching criterion: ${NAZWY[kryterium].toLowerCase()}. Push there.`);
    dlaczego.push(pl ? `trener ocenia najniżej „${NAZWY[kryterium].toLowerCase()}”` : `your lowest coaching score is “${NAZWY[kryterium].toLowerCase()}”`);
  }
  if (obiekcja) {
    czesci.push(pl ? `Obiekcja, która wraca w notatkach z CRM: ${obiekcja}. Użyj jej.` : `An objection that keeps coming back in CRM notes: ${obiekcja}. Use it.`);
    dlaczego.push(pl ? `w notatkach wraca obiekcja ${obiekcja}` : `the objection ${obiekcja} keeps coming back in notes`);
  }
  if (!czesci.length) {
    czesci.push(pl ? "Pierwsza rozmowa: zagraj klienta na pierwszym kontakcie, bez taryfy ulgowej." : "First call: play a first-contact customer, no easy mode.");
    dlaczego.push(pl ? "brak danych, zaczynamy od początku lejka" : "no data yet, so we start at the top of the funnel");
  }
  czesci.push(pl ? "Zagraj klienta dokładnie w tym momencie procesu." : "Play the customer at exactly this point of the process.");

  const sytuacja = czesci.join(" ");
  return {
    etap,
    deal,
    kryterium,
    kryteriumNazwa: kryterium ? NAZWY[kryterium] : null,
    obiekcja,
    dlaczego: (pl ? "Bo " : "Because ") + dlaczego.join(pl ? ", a " : ", and ") + ".",
    sytuacja,
    link: `/bruno/rozmowa?sytuacja=${encodeURIComponent(sytuacja.slice(0, 2900))}`,
  };
}
