import type { Wypowiedz } from "./db";

// Liczby z transkrypcji, liczone deterministycznie, zanim trener (Claude)
// zobaczy rozmowę. Progi z SalesAI/BRUNO-RUBRYKA.md. Trener dostaje gotowe
// liczby, żeby nie zgadywał ich z tekstu.
//
// 10.10 (USER_001, wariant A): rozmowy są PO ANGIELSKU (amerykańskim). Wszystkie
// wzorce słów poniżej są angielskie; polskie poszły do archiwum razem z PL.

const WYPELNIACZE = /\b(u+m+|u+h+|e+r+|a+h+|hmm+|you know|i mean|kind of|sort of|basically|literally|okay so|so yeah|right\?)/giu;
const OSLABIACZE = /\b(maybe|perhaps|i think|i guess|i feel like|i believe|a little|a bit|hopefully|probably|possibly|i'?m not sure if|just (wanted|calling|checking|reaching|following)|if that makes sense)\b/giu;
const PRZEPROSINY = /\b(sorry|apolog(y|ies|ize)|unfortunately|bother(ing)? you|won'?t take (much|long|a lot)|take (up )?(too )?much of your time|quick (call|question))\b/giu;
// 9.10: słowo pytajne gdziekolwiek w zdaniu, nie tylko na początku. Zdanie zaczynające się
// od „do / is / can…" to pytanie zamknięte, nawet gdy dalej jest „how".
const SLOWO_PYTAJNE = /(^|[\s,„"(])(what|how|why|when|where|who|which|how much|how many|how long|how often|what if|tell me|walk me through)(?=[\s?,.!']|$)/iu;
const ZAMKNIETE_START =
  /^\s*(and\s+|so\s+|but\s+|okay,?\s+|ok,?\s+)?(do|does|did|is|are|was|were|can|could|would|will|should|have|has|had|may|might|shall|isn'?t|aren'?t|don'?t|doesn'?t|won'?t|wouldn'?t|couldn'?t|right|correct|okay|ok|yes|sure)\b/iu;
/** Czy fragment zdania (z „?") jest pytaniem otwartym. Eksport dla fazy.ts. */
export function czyPytanieOtwarte(zdanie: string): boolean {
  const z = zdanie.trim();
  if (!z) return false;
  if (ZAMKNIETE_START.test(z)) return false;
  // „what?" albo „how so?" bywa retoryczne: wymagamy ≥3 słów.
  if (z.split(/\s+/).length < 3) return false;
  return SLOWO_PYTAJNE.test(z);
}
/** Zdania-pytania z wypowiedzi (po „?"). */
export function pytaniaZ(tekst: string): string[] {
  return tekst
    .split(/(?<=\?)/)
    .map((s) => s.split(/[.!]/).pop() ?? "")
    .filter((s) => s.includes("?"));
}
/** Zachowane dla zgodności (fazy.ts): to samo co czyPytanieOtwarte na początku zdania. */
export const OTWARTE = /^\s*(what|how|why|when|where|who|which|how much|how many|how long|tell me)\b/iu;
// Obiekcje klienta: cena, czas, „już mamy", unik („think about it", „send me an email"), zaufanie, dowód, koszt.
const OBIEKCJA =
  /(too expensive|expensive|pricey|cost(s)? too much|can'?t afford|no budget|budget|think (about it|it over)|let me think|sleep on it|not (right )?now|not the (right|best) time|bad timing|already (have|use|work with|got)|we have a (supplier|vendor|provider|guy|partner)|send (me|us|it) (an |some |the )?(email|info|information|something|details|over)|email (me|us|it)|put it in writing|not interested|not sure|not convinced|don'?t (really )?need|no need|talk to my (boss|partner|team|wife|husband|cfo|board)|run it by|check with|compare|other (offers|quotes|options|vendors)|competitor|risk|risky|don'?t trust|don'?t believe|guarantee|promises|won'?t work (for us|here)|why (now|would i|should i|should we)|what'?s in it for (me|us)|big decision|no time|too busy|call me (back )?(next|in|after)|get back to (you|me)|circle back|next quarter|after the (summer|holidays|quarter|new year)|how much (is it|does it cost|would it cost|are we talking)|what does (it|this) cost|never (worked|needed)|been fine (so far|without))/iu;
const RABAT = /(discount|cheaper|lower the price|knock (something |a bit |\d+% )?off|bring the price down|price break|special (price|offer|deal|rate)|promo|markdown|\d+ ?% off|percent off|throw in|waive)/iu;
// 9.10: dopisane „następny krok z datą" (Negacz: w sprzedaży wieloetapowej zamknięcie = umówiony konkret).
export const PROSBA_O_DECYZJE =
  /(let'?s (get started|get going|start|do it|do this|move forward|go ahead|book|schedule|set (it|that|this) up|lock (it|that) in|put (it|that) on the calendar|get you (set up|started|signed up))|shall we|can we (start|get started|get going|book|schedule|set (it|that|this) up|lock (it|that) in|go ahead|move forward|sign|get you)|when (can|could|would|do|should) (we|you) (start|sign|begin|meet|talk|kick (this|it) off|get started)|are you (ready|in|on board|good to go)|sign (the |this |that )?(agreement|contract|paperwork|proposal|order)|(does|would|is|will) (monday|tuesday|wednesday|thursday|friday|tomorrow|next week|this week|(this |tomorrow )?(morning|afternoon)|\d{1,2}(:\d{2})? ?([ap]\.?m\.?)?) work|morning or afternoon|(monday|tuesday|wednesday|thursday|friday) or (monday|tuesday|wednesday|thursday|friday)|what time works|(i'?ll|i will|let me) (put|pencil) you (in|down)|send you (a |the )?(calendar )?invite|put you down for|how about (monday|tuesday|wednesday|thursday|friday|tomorrow|next week|\d{1,2})|(are we|is that|is this) a (go|yes|deal)|do we have a deal|ready to (move|get started|sign|go|roll)|move forward with|(the )?next step (is|would be|here is)|get (this|you|everything) (set up|started|signed|rolling)|(so |then )?(we|you) (start|begin|kick off) (on |next |this )?(monday|tuesday|wednesday|thursday|friday|week|month)|which (day|time|date) works|does that work for you|(monday|tuesday|wednesday|thursday|friday|tomorrow|next week|this week)[^.?!]{0,30}\b(work|suit)s?\b|\b(work|suit)s? (for )?you (on|at) (monday|tuesday|wednesday|thursday|friday|tomorrow|\d))/iu;
/** Klient sam prosi o liczbę: odpowiedź kwotą nie jest wtedy „ceną przed bólem" (9.10). */
const PROSBA_O_LICZBE = /(how much|cost|price|pricing|fee|rate|percent|commission|refund|return|roi|payback|what (do|would|will) (i|we) (get|save|make|pay|earn)|save|number|ballpark|figure)/iu;
/** Minimum słów handlowca w oknie, żeby tempo coś znaczyło (9.10: za mało słów dawało „+107 %, nerwy"). */
const MIN_SLOW_TEMPO = 30;
// Transkrypcja ElevenLabs bywa słowna („six thousand dollars"), więc sama cyfra nie wystarcza.
const LICZEBNIK =
  "(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|a couple|a few|half a|several)";
const TYSIAC = "(?:thousand|million|grand|k|hundred)";
const KWOTA = new RegExp(
  [
    `[$£€]\\s?\\d[\\d,.]*(\\s?(k|m|thousand|million|grand))?`,
    `\\d[\\d,.]*\\s?(k|grand|dollars?|bucks|pounds|quid|euros?|percent|%|per (month|year|seat|user|head|rep)|a (month|year|seat|user|head|rep))\\b`,
    // „six thousand dollars", „twenty grand", „fifty k"
    `(?<![a-z])${LICZEBNIK}(\\s+${TYSIAC})?\\s+(dollars?|bucks|pounds|quid|euros?|percent|grand|k)\\b`,
    `(?<![a-z])${LICZEBNIK}\\s+${TYSIAC}(?![a-z])`,
    `(?<![a-z])(a|one) (thousand|million|grand)\\b`,
  ].join("|"),
  "iu",
);

/** Słowa-klucze obiekcji wpisanej przez firmę: rdzenie (5 pierwszych liter) słów od 4 liter. */
function rdzenie(t: string): string[] {
  return [...new Set((t.toLowerCase().match(/\p{L}{4,}/gu) ?? []).map((s) => s.slice(0, 5)))];
}
/** Wypowiedź klienta trafia w obiekcję firmy, gdy zawiera ≥60 % jej rdzeni. */
function trafiaWObiekcjeFirmy(tekst: string, firmy: string[][]): boolean {
  const moje = new Set(rdzenie(tekst));
  return firmy.some((r) => r.length > 0 && r.filter((x) => moje.has(x)).length >= Math.ceil(r.length * 0.6));
}

/** Po angielsku czasowniki nie mają rodzaju: trener pisze „you", płeć nie jest potrzebna. Zostaje dla zgodności, zawsze null. */
export function plecZTranskrypcji(_tr: Wypowiedz[]): boolean | null {
  return null;
}
const DATA =
  /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|day after tomorrow|next week|this week|end of (the )?week|next month|at \d{1,2}(:\d{2})?( ?[ap]\.?m\.?)?|\d{1,2}(:\d{2})? ?[ap]\.?m\.?|o'?clock|noon|midday|(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}|\d{1,2}(st|nd|rd|th)\b)/iu;

function slowa(t: string) {
  return t.trim().split(/\s+/).filter(Boolean);
}
function ile(re: RegExp, t: string) {
  return (t.match(re) ?? []).length;
}

export type Metryki = {
  sekundy: number;
  slowa_handlowca: number;
  slowa_klienta: number;
  udzial_handlowca_proc: number;
  wypelniacze: number;
  wypelniacze_na_min: number;
  oslabiacze: number;
  oslabiacze_na_100: number;
  przeprosiny: number;
  pytania_handlowca: number;
  pytania_otwarte: number;
  zdania_przed_pierwszym_pytaniem: number;
  sekundy_do_pierwszego_pytania: number | null;
  sam_odpowiada_na_pytanie: number;
  obiekcje_klienta: number;
  obiekcje_z_pytaniem: number;
  obiekcje_z_rabatem: number;
  prosby_o_decyzje: number;
  /** 9.10: prośba o decyzję albo następny krok Z DATĄ w końcówce: to liczy się jako zamknięcie. */
  nastepny_krok_z_data: boolean;
  kwota_padla: boolean;
  slowa_po_kwocie: number | null;
  cena_przed_pytaniem: boolean;
  /** 9.10: kwota padła w odpowiedzi na pytanie klienta o liczbę. Wtedy nie karzemy za „cenę przed bólem". */
  kwota_na_prosbe_klienta: boolean;
  data_w_koncowce: boolean;
  tempo_pierwsza_min: number | null;
  tempo_ostatnia_min: number | null;
  /** Zmiana tempa ostatnia vs pierwsza minuta w %: plus = przyspieszył, minus = zwolnił (6.10: było odwrotnie i myliło trenera). */
  zmiana_tempa_proc: number | null;
  zdania_ponad_25_slow: number;
};

export function policzMetryki(tr: Wypowiedz[], sekundy: number, obiekcjeFirmy: string[] = []): Metryki {
  const firmy = obiekcjeFirmy.map(rdzenie);
  const toObiekcja = (t: string) => OBIEKCJA.test(t) || trafiaWObiekcjeFirmy(t, firmy);
  const h = tr.filter((w) => w.rola === "handlowiec");
  const k = tr.filter((w) => w.rola === "klient");
  const tekstH = h.map((w) => w.tekst).join(" ");
  const slowaH = slowa(tekstH).length;
  const slowaK = slowa(k.map((w) => w.tekst).join(" ")).length;
  const minuty = Math.max(1, sekundy / 60);

  // Otwarcie
  let zdaniaPrzedPytaniem = 0;
  let sekundyDoPytania: number | null = null;
  for (const w of h) {
    if (w.tekst.includes("?")) {
      sekundyDoPytania = w.t;
      break;
    }
    zdaniaPrzedPytaniem += Math.max(1, (w.tekst.match(/[.!]+/g) ?? []).length);
  }

  // Pytania
  const wypowiedziZPytaniem = h.filter((w) => w.tekst.includes("?"));
  const pytaniaHandlowca = h.reduce((s, w) => s + ile(/\?/g, w.tekst), 0);
  const pytaniaOtwarte = wypowiedziZPytaniem.filter((w) => pytaniaZ(w.tekst).some(czyPytanieOtwarte)).length;

  // Sam odpowiada: po wypowiedzi handlowca z „?" znów mówi handlowiec.
  let samOdpowiada = 0;
  let obiekcje = 0;
  let obiekcjeZPytaniem = 0;
  let obiekcjeZRabatem = 0;
  // Do końca transkrypcji: obiekcja w ostatniej wypowiedzi też się liczy (bez odpowiedzi handlowca).
  for (let i = 0; i < tr.length; i++) {
    const a = tr[i];
    const b = tr[i + 1];
    if (b && a.rola === "handlowiec" && a.tekst.includes("?") && b.rola === "handlowiec") samOdpowiada++;
    if (a.rola === "klient" && toObiekcja(a.tekst)) {
      obiekcje++;
      const odp = tr.slice(i + 1).find((w) => w.rola === "handlowiec");
      if (odp) {
        if (odp.tekst.includes("?")) obiekcjeZPytaniem++;
        if (RABAT.test(odp.tekst)) obiekcjeZRabatem++;
      }
    }
  }

  // Kwota i usprawiedliwianie ceny
  let kwotaPadla = false;
  let slowaPoKwocie: number | null = null;
  let cenaPrzedPytaniem = false;
  let kwotaNaProsbe = false;
  for (let i = 0; i < tr.length; i++) {
    const w = tr[i];
    if (w.rola !== "handlowiec") continue;
    const m = w.tekst.match(KWOTA);
    if (!m || m.index === undefined) continue;
    kwotaPadla = true;
    const poprzedniaKlienta = [...tr.slice(0, i)].reverse().find((x) => x.rola === "klient");
    kwotaNaProsbe = Boolean(poprzedniaKlienta && poprzedniaKlienta.tekst.includes("?") && PROSBA_O_LICZBE.test(poprzedniaKlienta.tekst));
    cenaPrzedPytaniem = !kwotaNaProsbe && (sekundyDoPytania === null || w.t < sekundyDoPytania);
    let licznik = slowa(w.tekst.slice(m.index + m[0].length)).length;
    for (let j = i + 1; j < tr.length && tr[j].rola === "handlowiec"; j++) licznik += slowa(tr[j].tekst).length;
    slowaPoKwocie = licznik;
    break;
  }

  // Zamknięcie
  const prosbyODecyzje = h.filter((w) => PROSBA_O_DECYZJE.test(w.tekst)).length;
  const odKiedy = sekundy * 0.8;
  const dataWKoncowce = tr.some((w) => w.t >= odKiedy && DATA.test(w.tekst));
  // Następny krok z datą: handlowiec w końcówce (ostatnie 40 %) prosi o decyzję ALBO proponuje termin, a w rozmowie pada data.
  const nastepnyKrokZData = h.some((w) => w.t >= sekundy * 0.6 && PROSBA_O_DECYZJE.test(w.tekst)) && tr.some((w) => w.t >= sekundy * 0.6 && DATA.test(w.tekst));

  // Tempo: słowa handlowca w pierwszej i ostatniej pełnej minucie. Okno z mniej niż MIN_SLOW_TEMPO
  // słów handlowca nie mówi nic o tempie (mówił głównie klient), więc zwracamy null.
  const tempoW = (od: number, doS: number) => {
    const s = h.filter((w) => w.t >= od && w.t < doS).reduce((a, w) => a + slowa(w.tekst).length, 0);
    return s >= MIN_SLOW_TEMPO ? s : null;
  };
  const tempoPierwsza = sekundy >= 60 ? tempoW(0, 60) : null;
  const tempoOstatnia = sekundy >= 120 ? tempoW(Math.max(60, sekundy - 60), sekundy + 1) : null;
  const zmiana =
    tempoPierwsza && tempoOstatnia ? Math.round(((tempoOstatnia - tempoPierwsza) / tempoPierwsza) * 100) : null;

  const zdaniaDlugie = h.reduce(
    (s, w) => s + w.tekst.split(/[.!?]+/).filter((z) => slowa(z).length > 25).length,
    0,
  );

  const wypelniacze = ile(WYPELNIACZE, tekstH);
  const oslabiacze = ile(OSLABIACZE, tekstH);

  return {
    sekundy,
    slowa_handlowca: slowaH,
    slowa_klienta: slowaK,
    udzial_handlowca_proc: slowaH + slowaK ? Math.round((slowaH / (slowaH + slowaK)) * 100) : 0,
    wypelniacze,
    wypelniacze_na_min: Math.round((wypelniacze / minuty) * 10) / 10,
    oslabiacze,
    oslabiacze_na_100: slowaH ? Math.round((oslabiacze / slowaH) * 1000) / 10 : 0,
    przeprosiny: ile(PRZEPROSINY, tekstH),
    pytania_handlowca: pytaniaHandlowca,
    pytania_otwarte: pytaniaOtwarte,
    zdania_przed_pierwszym_pytaniem: zdaniaPrzedPytaniem,
    sekundy_do_pierwszego_pytania: sekundyDoPytania,
    sam_odpowiada_na_pytanie: samOdpowiada,
    obiekcje_klienta: obiekcje,
    obiekcje_z_pytaniem: obiekcjeZPytaniem,
    obiekcje_z_rabatem: obiekcjeZRabatem,
    prosby_o_decyzje: prosbyODecyzje,
    nastepny_krok_z_data: nastepnyKrokZData,
    kwota_padla: kwotaPadla,
    slowa_po_kwocie: slowaPoKwocie,
    cena_przed_pytaniem: cenaPrzedPytaniem,
    kwota_na_prosbe_klienta: kwotaNaProsbe,
    data_w_koncowce: dataWKoncowce,
    tempo_pierwsza_min: tempoPierwsza,
    tempo_ostatnia_min: tempoOstatnia,
    zmiana_tempa_proc: zmiana,
    zdania_ponad_25_slow: zdaniaDlugie,
  };
}
