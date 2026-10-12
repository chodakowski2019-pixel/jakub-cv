import type { Wypowiedz } from "./db";
import type { Jezyk } from "./domeny";

// Liczby z transkrypcji, liczone deterministycznie, zanim trener (Claude)
// zobaczy rozmowę. Progi z SalesAI/BRUNO-RUBRYKA.md. Trener dostaje gotowe
// liczby, żeby nie zgadywał ich z tekstu.
//
// 10.10 (USER_001, wariant A): rozmowy są PO ANGIELSKU (amerykańskim). Wszystkie
// wzorce słów poniżej są angielskie; polskie poszły do archiwum razem z PL.
// 11.10 (USER_001): Bruno w dwóch językach. Wzorce EN zostają bez zmian, obok wracają
// polskie (z fd7de52, 1:1). Wybór zestawu: parametr `jezyk` (domyślnie "en").

const WYPELNIACZE = /\b(u+m+|u+h+|e+r+|a+h+|hmm+|you know|i mean|kind of|sort of|basically|literally|okay so|so yeah|right\?)/giu;
const OSLABIACZE = /\b(maybe|perhaps|i think|i guess|i feel like|i believe|a little|a bit|hopefully|probably|possibly|i'?m not sure if|just (wanted|calling|checking|reaching|following)|if that makes sense)\b/giu;
const PRZEPROSINY = /\b(sorry|apolog(y|ies|ize)|unfortunately|bother(ing)? you|won'?t take (much|long|a lot)|take (up )?(too )?much of your time|quick (call|question))\b/giu;
// 9.10: słowo pytajne gdziekolwiek w zdaniu, nie tylko na początku. Zdanie zaczynające się
// od „do / is / can…" to pytanie zamknięte, nawet gdy dalej jest „how".
const SLOWO_PYTAJNE = /(^|[\s,„"(])(what|how|why|when|where|who|which|how much|how many|how long|how often|what if|tell me|walk me through)(?=[\s?,.!']|$)/iu;
const ZAMKNIETE_START =
  /^\s*(and\s+|so\s+|but\s+|okay,?\s+|ok,?\s+)?(do|does|did|is|are|was|were|can|could|would|will|should|have|has|had|may|might|shall|isn'?t|aren'?t|don'?t|doesn'?t|won'?t|wouldn'?t|couldn'?t|right|correct|okay|ok|yes|sure)\b/iu;
/** Czy fragment zdania (z „?") jest pytaniem otwartym. Eksport dla fazy.ts. */
export function czyPytanieOtwarte(zdanie: string, jezyk: Jezyk = "en"): boolean {
  const w = WZORCE[jezyk] ?? WZORCE.en;
  const z = zdanie.trim();
  if (!z) return false;
  if (w.ZAMKNIETE_START.test(z)) return false;
  // „what?" albo „how so?" bywa retoryczne: wymagamy ≥3 słów.
  if (z.split(/\s+/).length < 3) return false;
  return w.SLOWO_PYTAJNE.test(z);
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

/**
 * Płeć handlowca z jego własnych słów: „-łam/-łabym" = kobieta, „-łem/-łbym" = mężczyzna. Pewniejsze niż imię.
 * Po angielsku czasowniki nie mają rodzaju: trener pisze „you", dla EN zawsze null.
 */
export function plecZTranskrypcji(tr: Wypowiedz[], jezyk: Jezyk = "en"): boolean | null {
  if (jezyk !== "pl") return null;
  const t = tr.filter((w) => w.rola === "handlowiec").map((w) => w.tekst).join(" ").toLowerCase();
  const k = (t.match(/\p{L}+(łam|łabym)(?!\p{L})/gu) ?? []).length;
  const m = (t.match(/\p{L}+(łem|łbym)(?!\p{L})/gu) ?? []).length;
  if (k === m) return null;
  return k > m;
}
const DATA =
  /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|day after tomorrow|next week|this week|end of (the )?week|next month|at \d{1,2}(:\d{2})?( ?[ap]\.?m\.?)?|\d{1,2}(:\d{2})? ?[ap]\.?m\.?|o'?clock|noon|midday|(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}|\d{1,2}(st|nd|rd|th)\b)/iu;

// ——— 12.10 (W3, /brunowiedza): techniki obiekcji z 20 kart `SalesAI/wiedza/techniki/`, sekcja „Jak trener rozpoznaje" ———
// Pierwsza odpowiedź handlowca po obiekcji: ZGODA („rozumiem", „ma pan rację") albo KONTRA („ale", „but").
// Negacz NSM 099 / NSM 049: „ale kasuje wszystko, co było przed nim". Belfort: krótkie odbicie „słyszę, co pan mówi".
const ZGODA_START =
  /^\s*(?:(?:okay|ok|yeah|yes|right|alright|well|oh|look|hey|and|so)[,.!]?\s+)*(i (totally |completely |really |do )?(get it|get that|hear you|hear what you('re| are) saying|understand|get where you('re| are) coming from)|that's (fair|true|a fair (point|reaction)|totally fair|understandable)|fair (enough|point)|makes sense|that makes sense|you're (absolutely |totally )?right|of course|no problem|that's fine|not a problem|i figured|i (totally |completely )?agree|got it|absolutely|totally|understood|i appreciate (that|you saying that)|thanks for (being (straight|honest)|telling me)|i'm not trying to|let me (update|note|mark)|(okay|sure|alright),? let me (update|note|mark))/iu;
const KONTRA_START =
  /^\s*(?:(?:okay|ok|yeah|yes|right|alright|well|oh|look|hmm|hm)[,.!]?\s+)*(but\b|no,? but|yes,? but|well,? actually|actually,? (no|that's)|that's not (true|right|really|quite)|not really|not necessarily|have you considered|with all due respect|i (have to |must )?disagree|i don't think (so|that's)|hold on)/iu;
/** „ale/but" jako spójnik w odpowiedzi po obiekcji (liczone w całej pierwszej odpowiedzi). */
const ALE = /\b(but|however|although|though)\b/giu;
// Karta 27 (Negacz `mit-wysokiej-ceny.md`): „czy jest coś oprócz ceny, co wpłynęło na decyzję?"
const PYTANIE_POZA_CENA =
  /((is|was) there )?(anything|something) (else )?(besides|other than|apart from|aside from|beyond) (the |just )?(price|cost|money|the number)|besides (the )?(price|cost)|(only|just|purely) (about )?(the )?(price|cost|money)\?|what else (played|mattered|drove|went into|was behind|factored)|other than (the )?(price|cost|money),? (what|was|is|anything)/iu;
// Karta 38 (Cole Gordon): skala 1-10 + pytanie o lukę.
const SKALA_1_10 =
  /on a scale (of|from) (1|one) (to|through) (10|ten)|scale of (1|one)[- ]?(to|-)[- ]?(10|ten)|(1|one) to (10|ten),? (where|how)|what('s| is) keeping you (at|from) (a |an )?(\d|five|six|seven|eight|nine|ten)|what would (make|get) (it|you|that) (a |to )?(9|10|nine|ten)/iu;
// Karty 38, 39 (Cole Gordon): izolacja „poza tym, czy jest coś jeszcze?", „gdyby żona była na linii".
const IZOLACJA =
  /(other than|besides|aside from|apart from|outside of) (that|this|time|money|the (price|cost|money)|(talking to|telling|letting) your (wife|husband|partner|spouse)( know)?|your (wife|husband|partner|spouse)|[a-z]+),? (is there |was there )?anything else|is (that|this) the only (thing|reason|concern)|if it weren'?t for (that|the|this|[a-z]+)|if (she|he|your (wife|husband|partner|spouse)) (were|was) (on the (call|line|phone)|(right )?here|sitting here)|(money|price|the cost) aside|set (the )?money aside|if money (weren'?t|wasn'?t|was not|were not) (a factor|an issue|a thing|the issue)/iu;
// Karta 41 (Elliott): hipoteza „obejrzał pan wszystkie, moje było ostatnie, co zdecyduje?"
const HIPOTEZA_KONIEC =
  /hypothetically|let'?s (just )?say you('ve| have)? ?(already )?(seen|checked|compared|looked at|been to) (them all|all of them|both|everything|the other|every)|(mine|this|ours|this one) (was|is|were) the last (one|place|stop)|what (decides|would decide|ends up deciding) (it |this )?(in the end|at the end|ultimately)|in the end,? what (decides|would decide|matters)|at the end of the day,? what (decides|matters|would decide)/iu;
// Karta 42 (Cardone): „gdyby pieniądze były te same, u kogo wolałby pan kupić?"
const GDYBY_CENA_TA_SAMA =
  /if (the )?(money|price|cost|numbers?|dollars) (were|was) (the same|equal|identical)|(at |for )?the same (price|money|cost),? who (would|do) you|same (price|money),? who|if (it|they) (cost|were) the same,? who|if we were (the same|at the same) price/iu;
// Karta 43 (Tom Ferry / Toole): dopięcie pytaniem na „tak" („…, right?", „fair enough?"). Koniec wypowiedzi handlowca.
const TIE_DOWN =
  /(,?\s*(right|correct|fair|fair enough|is that fair|does that make sense|make sense|makes sense|wouldn'?t you agree|agreed|yeah|sound (good|fair|right)|okay|deal)\?)\s*$/iu;

// ——— Wzorce PL (z fd7de52, 1:1) ———
const PL_WYPELNIACZE = /\b(y{2,}|e{2,}|hmm+|mmm+|no więc|jakby|w sensie|znaczy się|znaczy|tak jakby|no i)\b/giu;
const PL_OSLABIACZE = /\b(chyba|może|wydaje mi się|spróbuję|spróbujemy|trochę|myślę,? że|nie wiem czy|w sumie|jakoś|właściwie)\b/giu;
const PL_PRZEPROSINY = /\b(przepraszam|niestety|przeszkadzam|nie zajmę)\b/giu;
// 9.10: słowo pytajne gdziekolwiek w zdaniu, nie tylko na początku. Aleksandra pytała
// „Czego pan się boi?", „A co miałoby się nie udać?", „Konkretnie jaki model?" i miała 0 otwartych.
// Zdanie zaczynające się od „czy" to pytanie zamknięte, nawet gdy dalej jest „jak".
const PL_SLOWO_PYTAJNE = /(^|[\s,„"(])(jak|co|czego|czemu|ile|kiedy|dlaczego|gdzie|skąd|dokąd|kto|kogo|komu|czym|który|która|które|którego|jaki|jaka|jakie|jakiego|jakich|jakim|w jaki sposób|od jak dawna|po co|na czym|z czego|o co|w czym)(?=[\s?,.!]|$)/iu;
const PL_ZAMKNIETE_START = /^\s*(a\s+)?(czy|może|mogę|mógłbym|mogłabym|możemy|chce|chciałby|chciałaby|ma|mają|macie|jest|są|zgadza|pasuje|ok|okej|dobrze|tak|prawda)\b/iu;
// 6.10: dopisane obiekcje o zaufaniu, dowodzie i koszcie (rozmowy Aleksandry: „stoją od zawsze",
// „nikt nic nie zrobił", „ile to kosztuje" liczyły się jako 0 obiekcji).
const PL_OBIEKCJA =
  /(za drog|drogo|pomyśl|zastanow|przemyśl|nie teraz|mamy już|budżet|nie mam czasu|prześlij|proszę wysłać|wyślij|nie jestem zainteresowan|nie jestem przekonan|nie potrzeb|zapytam|skonsultuj|wspólnik|szef|od zawsze|nikt (z tym )?(nigdy )?nic|ile (to )?(wszystko )?(kosztuj|będzie kosztow|muszę wło)|kosztować|ryzyk|nie wierzę|nie ufam|obietnic|gwarancj|wygran|nie przejdzie|dlaczego (teraz|miałbym|miałabym)|co (z tego )?będę miał|poważna decyzja|nie stać|nie mam pieniędzy)/iu;
const PL_RABAT = /(rabat|taniej|zejść|zejdę|obniż|zniżk|promocj|upust)/iu;
// Aleksandra 8.10: „kiedy możemy pełnomocnictwo podpisać u notariusza?", „mogę panią umówić na poniedziałek" = 0 próśb.
const PL_PROSBA_O_DECYZJE =
  /(zaczynamy|umówmy|umówimy|umawiamy|od kiedy|podpis|startujemy|możemy zacząć|kiedy możemy|kiedy może (pan|pani)|wchodzimy|zróbmy tak|proponuję termin|pasuje (panu|pani|państwu)|spotkajmy się|mogę (pana|panią|państwa) umówić|ustalmy|ustalamy|decydujemy|decyduje się (pan|pani)|jaka godzina|która godzina|przed południem czy|rano czy|wtorek czy|poniedziałek czy|czy (możemy|może pan|może pani) (dziś|dzisiaj|jutro|w tym tygodniu)|w (poniedziałek|wtorek|środę|czwartek|piątek) o)/iu;
/** Klient sam prosi o liczbę (9.10, rozmowa 4 Aleksandry: „ile zostanie mi w kieszeni?"). */
const PL_PROSBA_O_LICZBE = /(ile|koszt|cen[aęy]|kwot|zarobi|zostan|opłat|procent|stawk|prowizj|zwrot)/iu;
// Transkrypcja ElevenLabs pisze liczby słowami („sześć tysięcy pięćdziesiąt złotych"), więc
// sama cyfra nie wystarcza (6.10: `kwota_padla: false` mimo 6 050 zł w rozmowie).
const PL_LICZEBNIK =
  "(?:jeden|jedna|jednego|dwa|dwie|dwóch|trzy|trzech|cztery|czterech|pięć|pięciu|sześć|sześciu|siedem|siedmiu|osiem|ośmiu|dziewięć|dziewięciu|\\p{L}*dzie[sś]\\p{L}*|\\p{L}+na[sś][tć]\\p{L}*|sto|stu|dwieście|dwustu|trzysta|trzystu|czterysta|czterystu|\\p{L}+set|\\p{L}+uset|półtora)";
const PL_TYSIAC = "(?:tysiąc\\p{L}*|tysięcy|milion\\p{L}*)";
const PL_KWOTA = new RegExp(
  [
    `\\d[\\d\\s.,]*\\s*(zł|złotych|tys|tysięcy|procent|%|euro|eur|dolar)`,
    // „sześć tysięcy złotych", „pięćdziesięciu tysięcy", „dwa miliony"
    `(?<!\\p{L})${PL_LICZEBNIK}(\\s+${PL_TYSIAC})?\\s+(zł|złotych|złote|złoty|procent|euro|dolar\\p{L}*)`,
    `(?<!\\p{L})${PL_LICZEBNIK}\\s+${PL_TYSIAC}(?!\\p{L})`,
    // „tysiąc złotych" bez liczebnika z przodu; samo „tysiące klientów" to nie kwota
    `(?<!\\p{L})${PL_TYSIAC}\\s+(zł|złotych|euro|dolar\\p{L}*)`,
  ].join("|"),
  "iu",
);
const PL_DATA = /(poniedziałek|wtorek|środ|czwartek|piątek|sobot|niedziel|jutro|pojutrze|o \d{1,2}(:\d{2})?|godzin|w przyszłym tygodniu|za tydzień)/iu;

// ——— 12.10 (W3): techniki obiekcji PL (te same karty, wzorce z sekcji „Jak trener rozpoznaje") ———
const PL_ZGODA_START =
  /^\s*(?:(?:no|a|ok|okej|dobrze|tak|mhm|aha|jasne|hm)[,.!]?\s+)*(rozumiem|zgadzam się|ma (pan|pani) (absolutnie |całkowitą |pełną )?racj[eę]|słusznie|jasne|zdaję sobie sprawę|faktycznie|to prawda|to fakt|oczywiście|żaden problem|nie ma problemu|tego się spodziewał[ea]m|słyszę,? co (pan|pani) mówi|słyszę|w porządku|uczciwe pytanie|dobre pytanie|dziękuję za szczerość|dziękuję,? że (pan|pani) mówi wprost|nie próbuję|w pełni (to )?rozumiem|doceniam|(dobrze|ok|okej),? (zaznaczam|aktualizuję|zapisuję|notuję)|(zaznaczam|aktualizuję|zapisuję|notuję) (w karcie|w systemie|sobie))/iu;
const PL_KONTRA_START =
  /^\s*(?:(?:no|a|ok|okej|dobrze|tak|hm|hmm)[,.!]?\s+)*(ale\b|no ale|tak,? ale|nie,? (to|ale)|przecież|wcale nie|to nieprawda|to nie (tak|jest tak)|niekoniecznie|a czy (wie|zastanawiał|rozważał)|a może|chwileczkę|z całym szacunkiem|nie zgadzam się|nie powiedziałbym)/iu;
const PL_ALE = /\b(ale|jednak|natomiast|aczkolwiek|chociaż|choć)\b/giu;
const PL_PYTANIE_POZA_CENA =
  /(coś|cos|czegoś) (oprócz|poza|prócz) cen|poza (samą )?ceną|oprócz (samej )?ceny|co jeszcze (wpłynęło|zdecydowało|zaważyło|miało znaczenie|grało rolę)|(tylko|wyłącznie|jedynie) (o )?cen[aęy]\?|czy chodzi tylko o cenę|czy cena (to|była) jedyn|oprócz ceny,? (co|czy)/iu;
const PL_SKALA_1_10 =
  /w skali (od )?(1|jeden|jednego) do (10|dziesięciu|dziesiątki)|na skali (od )?(1|jeden)[- ]?(do|-)[- ]?(10|dziesięciu)|skali 1-10|od 1 do 10,? gdzie|co trzyma (pana|panią|pana|cię) (na|przy) (siódemce|ósemce|szóstce|piątce|\d)|co brakuje (panu|pani|ci)? ?do (dziesiątki|10|dziewiątki)|co (sprawia|powoduje),? że (to )?nie (10|dziesięć|dziesiątka)/iu;
const PL_IZOLACJA =
  /(poza|oprócz|prócz) (tym|tego|czasem|ceną|kwotą|pieniędzmi|żoną|mężem|partnerem|partnerką|powiedzeniem|rozmową|tą jedną rzeczą|\p{L}+)( (z )?(żonie|mężowi|żoną|mężem|partnerem|partnerką))?,? (czy )?(jest|ma (pan|pani)|było|byłoby) (jeszcze )?coś (jeszcze|innego)|czy to jedyn[aey] (rzecz|powód|wątpliwość|obawa)|czy coś (jeszcze|poza tym) (pana|panią) (trzyma|powstrzymuje)|gdyby nie (to|ta|ten|cena|czas|kwota|pieniądze)|gdyby (żona|mąż|partner|partnerka) (była|był) (teraz )?(tutaj|tu|na linii|przy telefonie|obok)|(odłóżmy|odkładając|odłożmy) (na chwilę )?(pieniądze|cenę|kwotę) na bok|pieniądze na bok|gdyby (pieniądze|cena|kasa|kwota) nie (grał[ay]|był[ay]|miał[ay])|pomijając (cenę|koszt|pieniądze)/iu;
const PL_HIPOTEZA_KONIEC =
  /hipotetycznie|załóżmy,? że (obejrzał|sprawdził|porównał|zobaczył|odwiedził) (pan|pani) (już )?(wszystkie|oba|obie|wszystko|resztę|pozostałe)|(to|moje|nasze|ta) (było|była|jest) ostatni[ea]|co (na końcu|na koniec|ostatecznie|finalnie) (zdecyduje|zadecyduje|przeważy)|co zdecyduje (na końcu|na koniec|ostatecznie)|na koniec dnia,? co (zdecyduje|się liczy)/iu;
const PL_GDYBY_CENA_TA_SAMA =
  /gdyby (cena|pieniądze|kwota|koszt|ceny) (była|były|był) (ta sama|te same|taka sama|takie same|równ\p{L}*|identyczn\p{L}*)|przy (tej samej|takiej samej|równej) cenie,? u kogo|ta sama cena,? u kogo|gdyby (kosztowało|wychodziło) (tyle samo|to samo),? u kogo|gdybyśmy (byli|mieli) (w tej samej|tę samą) cen/iu;
const PL_TIE_DOWN =
  /(,?\s*(prawda|zgadza się|tak|racja|w porządku|pasuje|uczciwie|dobrze|nie|zgoda|ma to sens|to ma sens|logiczne|czy nie)\?)\s*$/iu;

type Wzorce = {
  WYPELNIACZE: RegExp;
  OSLABIACZE: RegExp;
  PRZEPROSINY: RegExp;
  SLOWO_PYTAJNE: RegExp;
  ZAMKNIETE_START: RegExp;
  OBIEKCJA: RegExp;
  RABAT: RegExp;
  PROSBA_O_DECYZJE: RegExp;
  PROSBA_O_LICZBE: RegExp;
  KWOTA: RegExp;
  DATA: RegExp;
  // 12.10 (W3): techniki obiekcji
  ZGODA_START: RegExp;
  KONTRA_START: RegExp;
  ALE: RegExp;
  PYTANIE_POZA_CENA: RegExp;
  SKALA_1_10: RegExp;
  IZOLACJA: RegExp;
  HIPOTEZA_KONIEC: RegExp;
  GDYBY_CENA_TA_SAMA: RegExp;
  TIE_DOWN: RegExp;
};
const WZORCE: Record<Jezyk, Wzorce> = {
  en: {
    WYPELNIACZE,
    OSLABIACZE,
    PRZEPROSINY,
    SLOWO_PYTAJNE,
    ZAMKNIETE_START,
    OBIEKCJA,
    RABAT,
    PROSBA_O_DECYZJE,
    PROSBA_O_LICZBE,
    KWOTA,
    DATA,
    ZGODA_START,
    KONTRA_START,
    ALE,
    PYTANIE_POZA_CENA,
    SKALA_1_10,
    IZOLACJA,
    HIPOTEZA_KONIEC,
    GDYBY_CENA_TA_SAMA,
    TIE_DOWN,
  },
  pl: {
    WYPELNIACZE: PL_WYPELNIACZE,
    OSLABIACZE: PL_OSLABIACZE,
    PRZEPROSINY: PL_PRZEPROSINY,
    SLOWO_PYTAJNE: PL_SLOWO_PYTAJNE,
    ZAMKNIETE_START: PL_ZAMKNIETE_START,
    OBIEKCJA: PL_OBIEKCJA,
    RABAT: PL_RABAT,
    PROSBA_O_DECYZJE: PL_PROSBA_O_DECYZJE,
    PROSBA_O_LICZBE: PL_PROSBA_O_LICZBE,
    KWOTA: PL_KWOTA,
    DATA: PL_DATA,
    ZGODA_START: PL_ZGODA_START,
    KONTRA_START: PL_KONTRA_START,
    ALE: PL_ALE,
    PYTANIE_POZA_CENA: PL_PYTANIE_POZA_CENA,
    SKALA_1_10: PL_SKALA_1_10,
    IZOLACJA: PL_IZOLACJA,
    HIPOTEZA_KONIEC: PL_HIPOTEZA_KONIEC,
    GDYBY_CENA_TA_SAMA: PL_GDYBY_CENA_TA_SAMA,
    TIE_DOWN: PL_TIE_DOWN,
  },
};

/**
 * 12.10 (W3): jak handlowiec zaczął pierwszą odpowiedź po obiekcji.
 * zgoda = „rozumiem" / „ma pan rację" / "makes sense"; kontra = „ale" / "but" na początku;
 * rabat = rabat w odpowiedzi; pytanie = jest „?"; argument = nic z powyższych (tłumaczenie, obrona).
 * Jedna odpowiedź może być zgodą I pytaniem naraz (to wzór Negacza). Eksport dla testów i trenera.
 */
export type OdpowiedzPoObiekcji = { zgoda: boolean; kontra: boolean; pytanie: boolean; rabat: boolean; argument: boolean; ale: number };
export function klasyfikujOdpowiedz(tekst: string, jezyk: Jezyk = "en"): OdpowiedzPoObiekcji {
  const w = WZORCE[jezyk] ?? WZORCE.en;
  const t = tekst.trim();
  const zgoda = w.ZGODA_START.test(t);
  const kontra = !zgoda && w.KONTRA_START.test(t);
  const pytanie = t.includes("?");
  const rabat = w.RABAT.test(t);
  return { zgoda, kontra, pytanie, rabat, argument: !zgoda && !kontra && !pytanie && !rabat, ale: ile(w.ALE, t) };
}

/** 12.10 (W3): które techniki obiekcji padły w tekście handlowca (do testów zdań i metryk). */
export function technikiObiekcjiW(tekst: string, jezyk: Jezyk = "en"): { pytanie_poza_cena: boolean; skala_1_10: boolean; izolacja: boolean; hipoteza_koniec: boolean; gdyby_cena_ta_sama: boolean; tie_down: boolean } {
  const w = WZORCE[jezyk] ?? WZORCE.en;
  return {
    pytanie_poza_cena: w.PYTANIE_POZA_CENA.test(tekst),
    skala_1_10: w.SKALA_1_10.test(tekst),
    izolacja: w.IZOLACJA.test(tekst),
    hipoteza_koniec: w.HIPOTEZA_KONIEC.test(tekst),
    gdyby_cena_ta_sama: w.GDYBY_CENA_TA_SAMA.test(tekst),
    tie_down: w.TIE_DOWN.test(tekst.trim()),
  };
}

/** Wzorzec prośby o decyzję / następnego kroku z datą w danym języku (fazy.ts, UI). */
export function prosbaODecyzje(jezyk: Jezyk = "en"): RegExp {
  return (WZORCE[jezyk] ?? WZORCE.en).PROSBA_O_DECYZJE;
}

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
  // ——— 12.10 (W3, /brunowiedza): techniki obiekcji z kart `SalesAI/wiedza/techniki/` ———
  /** Pierwsze odpowiedzi po obiekcji zaczynające się od zgody („rozumiem", „ma pan rację", "makes sense"). Karta 25 Negacz. */
  obiekcje_odp_zgoda: number;
  /** Pierwsze odpowiedzi po obiekcji zaczynające się od kontry („ale", „przecież", "but"). */
  obiekcje_odp_kontra: number;
  /** Pierwsze odpowiedzi po obiekcji bez zgody, pytania, kontry i rabatu = argument / tłumaczenie. */
  obiekcje_odp_argument: number;
  /** Suma „ale/but" w pierwszych odpowiedziach po obiekcjach (Negacz: „ale kasuje wszystko przed nim"). */
  kontra_ale_po_obiekcji: number;
  /** Po pierwszej obiekcji padła jeszcze prośba o decyzję (pętla Belforta, karta 35; drugie podejście). */
  prosba_po_obiekcji: boolean;
  /** „Czy jest coś oprócz ceny?" (karta 27, Negacz). */
  pytanie_poza_cena: boolean;
  /** Skala 1-10 albo pytanie o lukę „co trzyma pana na 7?" (karta 38, Cole Gordon). */
  skala_1_10: boolean;
  /** Izolacja „poza tym, czy coś jeszcze?", „gdyby żona była na linii", „pieniądze na bok" (karty 38, 39). */
  izolacja: boolean;
  /** Hipoteza „obejrzał pan wszystkie, moje było ostatnie, co zdecyduje?" (karta 41, Elliott). */
  hipoteza_koniec: boolean;
  /** „Gdyby cena była ta sama, u kogo?" (karta 42, Cardone). */
  gdyby_cena_ta_sama: boolean;
  /** Wypowiedzi handlowca zakończone dopięciem „…, prawda?", "…, right?" (karta 43, Tom Ferry). */
  tie_down: number;
};

export function policzMetryki(tr: Wypowiedz[], sekundy: number, obiekcjeFirmy: string[] = [], jezyk: Jezyk = "en"): Metryki {
  const { WYPELNIACZE, OSLABIACZE, PRZEPROSINY, OBIEKCJA, RABAT, PROSBA_O_DECYZJE, PROSBA_O_LICZBE, KWOTA, DATA, TIE_DOWN } = WZORCE[jezyk] ?? WZORCE.en;
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
  const pytaniaOtwarte = wypowiedziZPytaniem.filter((w) => pytaniaZ(w.tekst).some((z) => czyPytanieOtwarte(z, jezyk))).length;

  // Sam odpowiada: po wypowiedzi handlowca z „?" znów mówi handlowiec.
  let samOdpowiada = 0;
  let obiekcje = 0;
  let obiekcjeZPytaniem = 0;
  let obiekcjeZRabatem = 0;
  // 12.10 (W3): zgoda / kontra / argument w pierwszej odpowiedzi, „ale" po obiekcji, prośba o decyzję po obiekcji.
  let odpZgoda = 0;
  let odpKontra = 0;
  let odpArgument = 0;
  let alePoObiekcji = 0;
  let pierwszaObiekcjaIdx = -1;
  // Do końca transkrypcji: obiekcja w ostatniej wypowiedzi też się liczy (bez odpowiedzi handlowca).
  for (let i = 0; i < tr.length; i++) {
    const a = tr[i];
    const b = tr[i + 1];
    if (b && a.rola === "handlowiec" && a.tekst.includes("?") && b.rola === "handlowiec") samOdpowiada++;
    if (a.rola === "klient" && toObiekcja(a.tekst)) {
      obiekcje++;
      if (pierwszaObiekcjaIdx < 0) pierwszaObiekcjaIdx = i;
      const odp = tr.slice(i + 1).find((w) => w.rola === "handlowiec");
      if (odp) {
        if (odp.tekst.includes("?")) obiekcjeZPytaniem++;
        if (RABAT.test(odp.tekst)) obiekcjeZRabatem++;
        const k = klasyfikujOdpowiedz(odp.tekst, jezyk);
        if (k.zgoda) odpZgoda++;
        if (k.kontra) odpKontra++;
        if (k.argument) odpArgument++;
        alePoObiekcji += k.ale;
      }
    }
  }
  const prosbaPoObiekcji = pierwszaObiekcjaIdx >= 0 && tr.slice(pierwszaObiekcjaIdx + 1).some((w) => w.rola === "handlowiec" && PROSBA_O_DECYZJE.test(w.tekst));
  // Techniki obiekcji w całym tekście handlowca (frazy są na tyle swoiste, że nie trzeba ich wiązać z konkretną obiekcją).
  const techniki = technikiObiekcjiW(tekstH, jezyk);
  const tieDown = h.filter((w) => TIE_DOWN.test(w.tekst.trim())).length;

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
    obiekcje_odp_zgoda: odpZgoda,
    obiekcje_odp_kontra: odpKontra,
    obiekcje_odp_argument: odpArgument,
    kontra_ale_po_obiekcji: alePoObiekcji,
    prosba_po_obiekcji: prosbaPoObiekcji,
    pytanie_poza_cena: techniki.pytanie_poza_cena,
    skala_1_10: techniki.skala_1_10,
    izolacja: techniki.izolacja,
    hipoteza_koniec: techniki.hipoteza_koniec,
    gdyby_cena_ta_sama: techniki.gdyby_cena_ta_sama,
    tie_down: tieDown,
  };
}
