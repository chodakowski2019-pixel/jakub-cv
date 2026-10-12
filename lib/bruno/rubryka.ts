import Anthropic from "@anthropic-ai/sdk";
import type { Feedback, Konfig, Kryterium, ObiekcjeTechniki, Wypowiedz, ZamkniecieTechniki } from "./db";
import { listaObiekcji } from "./db";
import type { Jezyk } from "./domeny";
import { etykiety } from "./etykiety";
import { plecZTranskrypcji, type Metryki } from "./metryki";
import { POSTACIE, POZIOMY, TRYBY, poziomLubDomyslny, type PostacId, type PoziomId, type TrybId } from "./postacie";
import { NAZWY, WAGI } from "./kryteria";
import { SEGMENT_TRENER, segmentZ } from "./segment";

// Bruno-TRENER. Ocenia rozmowę po jej zakończeniu wg SalesAI/BRUNO-RUBRYKA.md
// (złożonej 30.09 z 7 plików bazy wiedzy: Belfort, Rackham, Voss, Sandler,
// Challenger, Cialdini, Mazur). Model: Claude. Bruno-klient (OpenAI Realtime)
// tej rubryki nie zna.

export { WAGI, NAZWY };

const RUBRYKA = `
You grade a sales TRAINING call in English. A sales rep is practicing; an AI played the customer. You grade ONLY the rep.

CRITERIA (each 1-10):
1. OPENING (first 90 s): purpose of the call in ≤30 s; ≤6 sentences before the first question; upfront contract (goal, time, outcome); zero "sorry to bother you", "just", "I won't take much of your time"; zero "our company", "we offer", product name before the customer's first question; bonus for a thesis or a market number.
2. QUESTIONS: rep's share of words <50 % (good), >60 % (bad); ≥5 open questions ("what", "how", "how much", "when") before the pitch; SPIN: problem (P), implication (I) and need-payoff (N) questions matter more than situation (S) questions; no implication question = max 5; a question about the cost of the problem; a question about budget and the decision maker; mirroring (repeating 1-3 of the customer's words); the rep does NOT answer their own questions; a summary "you said that…".
3. OBJECTIONS (after "too expensive", "I need to think about it", "not now", "we already have"): the next line = a label ("sounds like"), a mirror or a question ("compared to what?", "what's not working?") = good; an argument, a defense, an instant discount = bad; a discount with nothing in return = bad; new information + a second ask for a decision (the loop) = good; proof with a company name and a number = good, "lots of clients are happy" = bad; giving up after the first "I'll think about it" = bad; price before the pain question = red flag.
   OBJECTION TECHNIQUES: fill in obiekcje_techniki (each technique separately; when at least one objection came up, the OBJECTIONS score is computed from them automatically and your number for "obiekcje" is only a guide). B2B = Negacz method, B2C = NEPQ / Straight Line / Gordon / Elliott / Cardone; the same fields apply to both:
   - zgoda_przed_odpowiedzia: the rep's FIRST line after an objection starts with agreement ("I get it", "you're right", "makes sense", "fair enough", "no problem"), not with "but" or a defense.
   - pytanie_po_obiekcji: the first line after an objection contains a question that digs in ("compared to what?", "what exactly do you mean?", "what needs to happen by the end of the quarter?", "who besides you decides?").
   - rabat_od_razu: a discount or a lower price offered in the first reply to an objection.
   - pytanie_poza_cena: after a price objection the rep asked for a reason other than price ("was there anything besides price?").
   - izolacja: the rep isolated the objection ("other than that, is there anything else?", "if your wife were on the call, would you be at 100 %?", "money aside, is this what you need?").
   - skala: a 1-to-10 scale plus the gap question ("what's keeping you at a 7?").
   - hipoteza: a hypothetical at the end of the search ("say you've seen them all and mine was the last: what decides it, the product or the terms?").
   - gdyby_cena_ta_sama: "if the money were the same, who would you buy from, and why?" (then selling only the difference).
   - tie_down: the rep ended a line with a yes-question ("you want serious buyers, right?", "fair enough?").
   - dowod_z_liczba: proof with a company name (or a clear description of a similar customer) AND a number, or the story of a customer who had the same doubt. "Lots of happy clients" = false.
   - ukryty_powod_odkryty: after the rep's question the customer named a real reason different from the first objection (e.g. "price" turned out to be "I didn't understand the proposal", "think about it" turned out to be "budget" or "my wife").
   - petla_drugie_podejscie: after an objection the rep added NEW information (a number, a guarantee, a date, a named reference) and asked for a decision again. Repeating the same argument = false.
   Every missing technique that fit the situation goes into MINUSES as its own bullet, in the rep's words to use next time.
4. CLOSING (last 20 %). AN ASK FOR A DECISION is ANY of these: (a) a direct question for a decision ("do we have a deal?", "are you in?"), (b) A DATED NEXT STEP proposed by the rep ("when can we get the paperwork signed?", "I can put you down for Monday", "let's meet Tuesday at 10"), (c) a choice of time ("morning or afternoon?"). In multi-step sales (b) IS a close and you must NOT write "no ask for a decision" when it happened. 1-2 asks = good, 0 or ≥3 = bad; progress = date + person + an action by the customer; continuation with no date ("I'll follow up", "I'll send the proposal", "think it over") = bad; the amount stated plainly = good; price with "only", "just", "unfortunately" = bad; the customer saying the date/step themselves = good; "what could get in the way?" = bonus; scarcity only with a real reason; silence after the price, the customer speaks first (rep adds >15 words = justifying).
   CLOSING TECHNIQUES: fill in zamkniecie_techniki (each technique separately; the CLOSING score is computed from them automatically, your number for "zamkniecie" is only a guide):
   - proba_zamkniecia: a trial close before the ask ("how does that sound?", "what do you think?", "does that make sense for you?").
   - pytanie_o_decyzje: a direct ask for a decision ("do we have a deal?", "are you in?", "shall we get started?").
   - nastepny_krok_z_data: the rep proposed a concrete next step with a date or a choice of times.
   - musze_pomyslec: how the rep handled a stall ("I need to think about it", "I'll run it by my boss", "I'll check with my partner", "let's circle back next quarter", "I'll compare"): nie_padlo (the customer didn't stall), poddal_sie ("I understand, I'll follow up"), czekal (did nothing, changed the subject), pytanie ("what exactly do you need to think about?", "what's missing for a decision?"), warunek ("if X, do we sign?").
   - drugie_zamkniecie: after an objection at the close, a SECOND ask for a decision came (bylo), didn't (brak), there was no objection at the close (nie_dotyczy).
   - sygnal_kupna: the customer gave a signal ("what would it take to get started?", "that gives me a clearer picture", "sounds interesting"): wykorzystany = within the rep's next 1-2 turns the rep turned it into a commitment: a direct ask OR a concrete next step with a date. Answering the customer's question first (e.g. briefly explaining how to start, the payment or the paperwork) and THEN proposing the step is GOOD, that is the textbook move (answer, then put it in a plan with a date); do NOT call it wasted. zmarnowany = the rep answered or kept presenting and never turned it into a step (no ask, no date) in those turns. nie_bylo.
   Every missing technique goes into MINUSES as its own bullet, in the rep's words to repeat next time (e.g. "No ask for a decision: after the numbers, ask 'so do we have a deal?'").
5. CONFIDENCE (voice, from the numbers): fillers/min 0-2 good, 3-5 average, >5 bad; weakeners per 100 words ≤1 good, >3 bad; "sorry"/"unfortunately" >2 = bad; zmiana_tempa_proc is the change of pace in the last minute vs the first (plus = sped up, minus = slowed down): ≤ -15 = sagging after a no, ≥ +15 at the price = nerves; in the comment say it plainly: "you sped up by X %" or "you slowed down by X %". If zmiana_tempa_proc = null, say NOTHING about pace or nerves from pace (too few rep words in the window, pace unknown). Interrupting the customer; sentences >25 words; energy rising at the customer's "no" = bad. This is the master criterion: the rep should state, not suggest.

HARD RULES (apply them and list the ones that fired):
- no ask for a decision (none of a/b/c) → overall score max 5
- a pitch or the price before the pain question → overall score minus 3. EXCEPTION: when kwota_na_prosbe_klienta = true (the customer asked for the number), answering with the amount is NOT penalized; only judge whether the rep asked a question after the number instead of explaining on
- overall score no higher than confidence + 2
- a "nice" call with no thesis, no number and no next step → max 5
- the customer said "I hadn't thought of it that way" → +1
- a fake technique (scarcity with no reason, "a client" with no name) → minus 2 each

FEEDBACK RULES:
- You grade actions and numbers, never the person: "you did X", not "you are Y". Zero moralizing. Zero generalities.
- For each criterion 1 VERBATIM quote from the transcript (a fragment is fine) + the timestamp from the transcript.
- One number from the audio (from the metrics), one win (what went well, concretely), one fix (what to do differently in the NEXT call, one sentence, doable).
- Comment per criterion: max 2 sentences, plain American English, addressed as "you". Reading level: a 12-year-old gets it.
- If the call was too short (under 60 s) or the rep barely spoke, grade low and say so outright.
`;

const SCHEMAT = `Reply ONLY with JSON (no markdown) shaped like this:
{
  "kryteria": [
    {"nazwa":"otwarcie","ocena":1-10,"cytat":"...","czas":"m:ss","komentarz":"..."},
    {"nazwa":"pytania", ...},
    {"nazwa":"obiekcje", ...},
    {"nazwa":"zamkniecie", ...},
    {"nazwa":"pewnosc", ...}
  ],
  "liczba_z_audio": "e.g. 7 fillers per minute",
  "wygrana": "...",
  "poprawka": "...",
  "plusy": ["2-4 short bullets (max 12 words each): what concretely worked, with a quote or a number"],
  "minusy": ["2-4 short bullets (max 12 words each): what concretely didn't"],
  "reguly": ["names of the hard rules that fired, or an empty list"],
  "bonus": 0 or 1,
  "kary": integer ≥ 0 (points to subtract from the rules: 3 for price before pain, 2 per fake technique),
  "brak_prosby_o_decyzje": true/false,
  "mila_bez_tresci": true/false,
  "obiekcje_ocena": [{"obiekcja":"the objection from the company's list that came up","ocena":1-4}],
  "zamkniecie_techniki": {"proba_zamkniecia":true/false,"pytanie_o_decyzje":true/false,"nastepny_krok_z_data":true/false,"musze_pomyslec":"nie_padlo|poddal_sie|czekal|pytanie|warunek","drugie_zamkniecie":"nie_dotyczy|brak|bylo","sygnal_kupna":"nie_bylo|wykorzystany|zmarnowany"},
  "obiekcje_techniki": {"zgoda_przed_odpowiedzia":true/false,"pytanie_po_obiekcji":true/false,"rabat_od_razu":true/false,"pytanie_poza_cena":true/false,"izolacja":true/false,"skala":true/false,"hipoteza":true/false,"gdyby_cena_ta_sama":true/false,"tie_down":true/false,"dowod_z_liczba":true/false,"ukryty_powod_odkryty":true/false,"petla_drugie_podejscie":true/false}
}
obiekcje_ocena scale: 1 = the rep lost it, 2 = weak, 3 = good, 4 = textbook. Include only objections from the company's list that actually came up. If no objection came up at all, set every field of obiekcje_techniki to false.
FORMAT: it must be valid JSON. Inside strings do NOT use the plain double quote " or newlines; write quotes with ' or “ ”. No text before or after the JSON.`;

// 11.10 (USER_001): Bruno w dwóch językach. Dla kont PL rubryka i schemat po polsku (z fd7de52, 1:1),
// techniki zamykania przetłumaczone z EN. Klucze JSON i schemat narzędzia te same.
const RUBRYKA_PL = `
Oceniasz treningową rozmowę sprzedażową po polsku. Handlowiec ćwiczy, AI grało klienta. Oceniasz WYŁĄCZNIE handlowca.

KRYTERIA (każde 1-10):
1. OTWARCIE (pierwsze 90 s): cel rozmowy w ≤30 s; ≤6 zdań przed pierwszym pytaniem; kontrakt wstępny (cel, czas, wynik); zero „przepraszam, że przeszkadzam”, „tylko”, „nie zajmę dużo”; zero „nasza firma”, „oferujemy”, nazwy produktu przed pierwszym pytaniem klienta; plus za tezę lub liczbę z rynku.
2. PYTANIA: udział słów handlowca <50 % (dobrze), >60 % (źle); ≥5 pytań otwartych („jak”, „co”, „ile”, „kiedy”) przed prezentacją; SPIN: pytania o problem (P), jego skutki (I) i o to, czego klient chce (N) ważniejsze niż pytania o sytuację (S); brak pytania implikacyjnego = max 5; pytanie o koszt problemu; pytanie o budżet i decydenta; lustro (powtórzenie 1-3 słów klienta); handlowiec NIE odpowiada sam na swoje pytania; podsumowanie „powiedział Pan, że…”.
3. OBIEKCJE (po „za drogo”, „muszę pomyśleć”, „nie teraz”, „mamy już”): następna wypowiedź = etykieta („wygląda na to”), lustro albo pytanie („w porównaniu do czego?”, „co nie gra?”) = dobrze; argument, obrona, rabat od razu = źle; rabat bez niczego w zamian = źle; nowa informacja + ponowna prośba o decyzję (pętla) = dobrze; dowód z nazwą firmy i liczbą = dobrze, „wielu klientów jest zadowolonych” = źle; poddanie się po pierwszym „przemyślę” = źle; cena przed pytaniem o ból = czerwona flaga.
   TECHNIKI OBIEKCJI: wypełnij obiekcje_techniki (każda technika osobno; gdy padła choć jedna obiekcja, ocena OBIEKCJI liczy się z nich automatycznie, a Twoja liczba dla „obiekcje” jest tylko orientacyjna). B2B = metoda Negacza, B2C = NEPQ / Straight Line / Gordon / Elliott / Cardone; pola są te same dla obu:
   - zgoda_przed_odpowiedzia: PIERWSZA wypowiedź handlowca po obiekcji zaczyna się od zgody („rozumiem”, „ma pan rację”, „jasne”, „słusznie”, „żaden problem”), nie od „ale” ani od obrony.
   - pytanie_po_obiekcji: pierwsza wypowiedź po obiekcji zawiera pytanie pogłębiające („w porównaniu do czego?”, „co dokładnie ma pan na myśli?”, „co ma się wydarzyć do końca kwartału?”, „kto oprócz pana decyduje?”).
   - rabat_od_razu: rabat albo niższa cena w pierwszej odpowiedzi na obiekcję.
   - pytanie_poza_cena: po obiekcji cenowej handlowiec zapytał o powód inny niż cena („czy było coś oprócz ceny?”).
   - izolacja: handlowiec odizolował obiekcję („poza tym, czy jest coś jeszcze?”, „gdyby żona była teraz na linii, byłby pan na 100 %?”, „odłóżmy pieniądze na bok: czy to jest to, czego pan potrzebuje?”).
   - skala: skala 1-10 plus pytanie o lukę („co trzyma pana na siódemce?”).
   - hipoteza: hipoteza końca poszukiwań („załóżmy, że obejrzał pan wszystkie i moje było ostatnie: co zdecyduje, produkt czy warunki?”).
   - gdyby_cena_ta_sama: „gdyby cena była ta sama, u kogo wolałby pan kupić i dlaczego?” (potem sprzedaż samej różnicy).
   - tie_down: handlowiec zakończył wypowiedź pytaniem na „tak” („chce pan poważnych kupujących, prawda?”, „w porządku?”).
   - dowod_z_liczba: dowód z nazwą firmy (albo jasnym opisem podobnego klienta) I liczbą, albo historia klienta, który miał tę samą wątpliwość. „Wielu zadowolonych klientów” = false.
   - ukryty_powod_odkryty: po pytaniu handlowca klient nazwał prawdziwy powód inny niż pierwsza obiekcja (np. „cena” okazała się „nie zrozumiałem oferty”, „przemyślę” okazało się „budżet” albo „żona”).
   - petla_drugie_podejscie: po obiekcji handlowiec dodał NOWĄ informację (liczbę, gwarancję, termin, referencję z nazwą) i poprosił o decyzję jeszcze raz. Powtórzenie tego samego argumentu = false.
   Każda brakująca technika, która pasowała do sytuacji, idzie do MINUSÓW jako osobny punkt, słowami handlowca do użycia następnym razem.
4. ZAMKNIĘCIE (ostatnie 20 %). PROŚBA O DECYZJĘ to KAŻDA z tych form: (a) pytanie o decyzję wprost („podpisujemy?”, „wchodzimy w to?”), (b) NASTĘPNY KROK Z DATĄ zaproponowany przez handlowca („kiedy możemy podpisać pełnomocnictwo u notariusza?”, „mogę panią umówić na poniedziałek”, „spotkajmy się we wtorek o 10”), (c) pytanie o termin do wyboru („przed południem czy po?”). W sprzedaży wieloetapowej (b) JEST zamknięciem i NIE wolno pisać „brak prośby o decyzję”, gdy padło. 1-2 prośby = dobrze, 0 albo ≥3 = źle; postęp = data + osoba + działanie klienta; kontynuacja bez daty („odezwę się”, „prześlę ofertę”, „proszę pomyśleć”) = źle; kwota wprost = dobrze; cena z „tylko”, „jedynie”, „niestety” = źle; klient sam wypowiada datę/krok = dobrze; pytanie „co może stanąć na drodze” = plus; limit tylko z prawdziwym powodem; po kwocie cisza, klient odzywa się pierwszy (handlowiec dopowiada >15 słów = usprawiedliwianie).
   TECHNIKI ZAMYKANIA: wypełnij zamkniecie_techniki (każda technika osobno; ocena ZAMKNIĘCIA liczy się z nich automatycznie, Twoja liczba dla „zamkniecie” jest tylko orientacyjna):
   - proba_zamkniecia: próbne zamknięcie przed prośbą („jak to brzmi?”, „co pan o tym myśli?”, „czy to ma dla pana sens?”).
   - pytanie_o_decyzje: pytanie o decyzję wprost („podpisujemy?”, „wchodzimy w to?”, „zaczynamy?”).
   - nastepny_krok_z_data: handlowiec zaproponował konkretny następny krok z datą albo terminy do wyboru.
   - musze_pomyslec: jak handlowiec obsłużył unik („muszę pomyśleć”, „prześlę szefowi”, „zapytam wspólnika”, „wróćmy do tego w przyszłym kwartale”, „porównam”): nie_padlo (klient nie robił uniku), poddal_sie („rozumiem, to się odezwę”), czekal (nic nie zrobił, zmienił temat), pytanie („co konkretnie chce pan przemyśleć?”, „czego brakuje do decyzji?”), warunek („jeśli X, to podpisujemy?”).
   - drugie_zamkniecie: po obiekcji przy zamknięciu padła DRUGA prośba o decyzję (bylo), nie padła (brak), przy zamknięciu nie było obiekcji (nie_dotyczy).
   - sygnal_kupna: klient dał sygnał („co mam zrobić, żeby ruszyć?”, „to daje mi lepszy obraz”, „brzmi ciekawie”): wykorzystany = w 1-2 kolejnych wypowiedziach handlowiec zamienił go w zobowiązanie: pytanie o decyzję ALBO konkretny następny krok z datą. Najpierw krótka odpowiedź na pytanie klienta (np. jak wygląda start, płatność, dokumenty), a POTEM propozycja kroku z datą to DOBRZE, wzorcowy ruch (odpowiedz i osadź w planie z datą); NIE nazywaj tego zmarnowaniem. zmarnowany = handlowiec odpowiedział albo dalej prezentował i w tych wypowiedziach nie zamienił sygnału w krok (bez prośby, bez daty). nie_bylo.
   Każda brakująca technika idzie do MINUSÓW jako osobny punkt, słowami handlowca do powtórzenia następnym razem (np. „Brak prośby o decyzję: po liczbach zapytaj «to co, wchodzimy w to?»”).
5. PEWNOŚĆ SIEBIE (głos, z liczb): wypełniacze/min 0-2 dobrze, 3-5 średnio, >5 źle; osłabiacze na 100 słów ≤1 dobrze, >3 źle; „przepraszam”/„niestety” >2 = źle; zmiana_tempa_proc to zmiana tempa ostatniej minuty względem pierwszej (plus = przyspieszył, minus = zwolnił): ≤ -15 = siadanie po odmowie, ≥ +15 przy cenie = nerwy; w komentarzu pisz po ludzku „przyspieszyłeś o X %” albo „zwolniłeś o X %”. Jeśli zmiana_tempa_proc = null, NIE pisz nic o tempie ani o nerwach z tempa (za mało słów handlowca w oknie, tempo nieznane). Przerywanie klienta; zdania >25 słów; energia rosnąca przy „nie” klienta = źle. To jest kryterium główne wg Mazura: handlowiec ma twierdzić, nie sugerować.

REGUŁY TWARDE (zastosuj i wypisz, które zadziałały):
- brak prośby o decyzję (żadna z form a/b/c) → ocena ogólna max 5
- prezentacja lub cena przed pytaniem o ból → ocena ogólna minus 3. WYJĄTEK: gdy kwota_na_prosbe_klienta = true (klient sam zapytał o liczbę), odpowiedź kwotą NIE jest karana; oceń tylko, czy po liczbie handlowiec zadał pytanie, zamiast dalej tłumaczyć
- ocena ogólna nie wyższa niż pewność siebie + 2
- rozmowa „miła”, bez tezy, liczby i następnego kroku → max 5
- klient powiedział „nie myślałem o tym w ten sposób” → +1
- fałszywa technika (limit bez powodu, „klient” bez nazwy) → minus 2 za każdą

ZASADY FEEDBACKU:
- Oceniasz czyny i liczby, nigdy osobę: „zrobiłeś X”, nie „jesteś Y”. Zero moralizowania. Zero ogólników.
- Do każdego kryterium 1 cytat DOSŁOWNY z transkrypcji (może być fragment) + znacznik czasu z transkrypcji.
- Jedna liczba z audio (z metryk), jedna wygrana (co poszło dobrze, konkretnie), jedna poprawka (co zrobić inaczej w NASTĘPNEJ rozmowie, jedno zdanie, wykonalne).
- Komentarz do kryterium: max 2 zdania, po polsku, prosto, per „ty”.
- Jeśli rozmowa była za krótka (poniżej 60 s) albo handlowiec prawie nic nie powiedział, oceń nisko i powiedz to wprost.
`;

const SCHEMAT_PL = `Odpowiedz WYŁĄCZNIE JSON-em (bez markdownu) o kształcie:
{
  "kryteria": [
    {"nazwa":"otwarcie","ocena":1-10,"cytat":"...","czas":"m:ss","komentarz":"..."},
    {"nazwa":"pytania", ...},
    {"nazwa":"obiekcje", ...},
    {"nazwa":"zamkniecie", ...},
    {"nazwa":"pewnosc", ...}
  ],
  "liczba_z_audio": "np. 7 wypełniaczy na minutę",
  "wygrana": "...",
  "poprawka": "...",
  "plusy": ["2-4 krótkie punkty (max 12 słów każdy): co konkretnie zagrało, z cytatem albo liczbą"],
  "minusy": ["2-4 krótkie punkty (max 12 słów każdy): co konkretnie nie zagrało"],
  "reguly": ["nazwy reguł twardych, które zadziałały, albo pusta lista"],
  "bonus": 0 lub 1,
  "kary": liczba całkowita ≥ 0 (suma punktów do odjęcia z reguł: 3 za cenę przed bólem, 2 za każdą fałszywą technikę),
  "brak_prosby_o_decyzje": true/false,
  "mila_bez_tresci": true/false,
  "obiekcje_ocena": [{"obiekcja":"tekst obiekcji z listy firmy, która padła","ocena":1-4}],
  "zamkniecie_techniki": {"proba_zamkniecia":true/false,"pytanie_o_decyzje":true/false,"nastepny_krok_z_data":true/false,"musze_pomyslec":"nie_padlo|poddal_sie|czekal|pytanie|warunek","drugie_zamkniecie":"nie_dotyczy|brak|bylo","sygnal_kupna":"nie_bylo|wykorzystany|zmarnowany"},
  "obiekcje_techniki": {"zgoda_przed_odpowiedzia":true/false,"pytanie_po_obiekcji":true/false,"rabat_od_razu":true/false,"pytanie_poza_cena":true/false,"izolacja":true/false,"skala":true/false,"hipoteza":true/false,"gdyby_cena_ta_sama":true/false,"tie_down":true/false,"dowod_z_liczba":true/false,"ukryty_powod_odkryty":true/false,"petla_drugie_podejscie":true/false}
}
Skala obiekcje_ocena: 1 = handlowiec poległ, 2 = słabo, 3 = dobrze, 4 = wzorowo. Uwzględnij tylko obiekcje z listy firmy, które realnie padły. Jeśli nie padła żadna obiekcja, wszystkie pola obiekcje_techniki = false.
FORMAT: to musi być poprawny JSON. Wewnątrz tekstów NIE używaj prostego cudzysłowu " ani znaków nowej linii; cytaty zapisuj w „ ” albo w apostrofach. Żadnego tekstu przed ani po JSON-ie.`;

function formatCzas(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function transkrypcjaDoTekstu(tr: Wypowiedz[], jezyk: Jezyk = "en"): string {
  const [h, k] = jezyk === "pl" ? ["HANDLOWIEC", "KLIENT"] : ["REP", "CUSTOMER"];
  return tr.map((w) => `[${formatCzas(w.t)}] ${w.rola === "handlowiec" ? h : k}: ${w.tekst}`).join("\n");
}

/** Poniżej tej oceny kara z reguł już nie spycha: słaba rozmowa ma niskie kryteria i bez kary. */
const PODLOGA_KARY = 3;

/**
 * Średnia ważona + reguły twarde. Liczone tu, nie przez model, żeby wynik był powtarzalny.
 * 6.10: działa JEDNA, najcięższa reguła, a nie wszystkie po kolei. Wcześniej kary się
 * sumowały i każda słabsza rozmowa lądowała na 1/10 (Aleksandra: kryteria 5/1/2/2/4,
 * po karze -3 wynik 1). Kara z reguł nie spycha też poniżej 3.
 */
export function policzOcene(
  kryteria: Kryterium[],
  reguly: { bonus?: number; kary?: number; brak_prosby_o_decyzje?: boolean; mila_bez_tresci?: boolean },
  jezyk: Jezyk = "en",
): { ocena: number; reguly: string[] } {
  const pl = jezyk === "pl";
  const z = (n: Kryterium["nazwa"]) => Math.min(10, Math.max(1, Number(kryteria.find((k) => k.nazwa === n)?.ocena ?? 1)));
  let baza = 0;
  for (const n of Object.keys(WAGI) as Kryterium["nazwa"][]) baza += z(n) * WAGI[n];
  const uzyte: string[] = [];
  if (reguly.bonus) {
    baza += 1;
    uzyte.push(pl ? "przeramowanie: +1" : "reframe: +1");
  }

  // Kandydaci: każda reguła osobno liczy, ile zostaje z bazy. Wygrywa najniższy wynik.
  const kandydaci: { wynik: number; opis: string }[] = [];
  const kary = Math.max(0, Math.min(6, Number(reguly.kary ?? 0)));
  if (kary && baza > PODLOGA_KARY) kandydaci.push({ wynik: Math.max(PODLOGA_KARY, baza - kary), opis: pl ? `kara z reguł: -${kary} (nie poniżej ${PODLOGA_KARY})` : `rule penalty: -${kary} (not below ${PODLOGA_KARY})` });
  if (reguly.brak_prosby_o_decyzje && baza > 5) kandydaci.push({ wynik: 5, opis: pl ? "brak prośby o decyzję: max 5" : "no ask for a decision: max 5" });
  if (reguly.mila_bez_tresci && baza > 5) kandydaci.push({ wynik: 5, opis: pl ? "miło bez treści: max 5" : "nice but empty: max 5" });
  const sufit = z("pewnosc") + 2;
  if (baza > sufit) kandydaci.push({ wynik: sufit, opis: pl ? "nie wyżej niż pewność siebie + 2" : "no higher than confidence + 2" });

  let ocena = baza;
  if (kandydaci.length) {
    const najciezsza = kandydaci.reduce((a, b) => (b.wynik < a.wynik ? b : a));
    ocena = najciezsza.wynik;
    uzyte.push(najciezsza.opis);
  }
  return { ocena: Math.min(10, Math.max(1, Math.round(ocena))), reguly: uzyte };
}

/**
 * 10.10 (E12): ocena ZAMKNIĘCIA liczona z technik, nie z wyczucia modelu. Punkty:
 * start 0; próba zamknięcia +2; prośba o decyzję (pytanie wprost ALBO krok z datą) +3, obie formy +1;
 * „muszę pomyśleć": pytanie / warunek +2, nie padło +1, czekał 0, poddał się -1;
 * drugie zamknięcie po obiekcji: było +2, nie dotyczy +1, brak 0;
 * sygnał kupna zmarnowany -1; ≥3 prośby (nacisk) -1. Bez żadnej prośby o decyzję: max 4.
 * Metryki mają głos rozstrzygający przy prośbie i kroku z datą (jak w 9.10).
 */
export function policzZamkniecie(t: ZamkniecieTechniki, metryki: Pick<Metryki, "prosby_o_decyzje" | "nastepny_krok_z_data">): number {
  const pytanie = t.pytanie_o_decyzje || metryki.prosby_o_decyzje > 0;
  const krok = t.nastepny_krok_z_data || metryki.nastepny_krok_z_data;
  let p = 0;
  if (t.proba_zamkniecia) p += 2;
  if (pytanie || krok) p += 3;
  if (pytanie && krok) p += 1;
  p += { pytanie: 2, warunek: 2, nie_padlo: 1, czekal: 0, poddal_sie: -1 }[t.musze_pomyslec] ?? 0;
  p += { bylo: 2, nie_dotyczy: 1, brak: 0 }[t.drugie_zamkniecie] ?? 0;
  if (t.sygnal_kupna === "zmarnowany") p -= 1;
  if (metryki.prosby_o_decyzje >= 3) p -= 1;
  if (!pytanie && !krok) p = Math.min(p, 4);
  return Math.min(10, Math.max(1, Math.round(p)));
}

/** Pola `ObiekcjeTechniki`, które wypełnia model (reszta liczona z metryk). */
const OBIEKCJE_POLA_MODELU = ["zgoda_przed_odpowiedzia", "pytanie_po_obiekcji", "rabat_od_razu", "pytanie_poza_cena", "izolacja", "skala", "hipoteza", "gdyby_cena_ta_sama", "tie_down", "dowod_z_liczba", "ukryty_powod_odkryty", "petla_drugie_podejscie"] as const;

type MetrykiObiekcji = Pick<
  Metryki,
  "obiekcje_klienta" | "obiekcje_z_pytaniem" | "obiekcje_z_rabatem" | "obiekcje_odp_zgoda" | "obiekcje_odp_kontra" | "kontra_ale_po_obiekcji" | "prosba_po_obiekcji" | "pytanie_poza_cena" | "skala_1_10" | "izolacja" | "hipoteza_koniec" | "gdyby_cena_ta_sama" | "tie_down"
>;

/**
 * 12.10 (W3, /brunowiedza): techniki obiekcji z odpowiedzi modelu, uzupełnione metrykami.
 * Metryki rozstrzygają tam, gdzie regex liczy (zgoda, pytanie, „ale", rabat, frazy technik); model dopowiada
 * to, czego regex nie złapie (parafraza zgody, dowód z liczbą, ukryty powód). Stare metryki (bez pól W3) = undefined → 0 / false.
 */
export function technikiObiekcjiZOdpowiedzi(raw: unknown, metryki: Partial<MetrykiObiekcji>): ObiekcjeTechniki {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const m = (k: keyof typeof r) => r[k] === true;
  const obiekcji = Number(metryki.obiekcje_klienta ?? 0);
  const kontra = Number(metryki.obiekcje_odp_kontra ?? 0);
  // Zgoda: regex ALBO model, ale gdy regex widzi kontrę („ale…") i zero zgód, model nie przegłosuje.
  const zgoda = Number(metryki.obiekcje_odp_zgoda ?? 0) > 0 || (m("zgoda_przed_odpowiedzia") && kontra === 0);
  return {
    obiekcji,
    zgoda_przed_odpowiedzia: obiekcji > 0 && zgoda,
    pytanie_po_obiekcji: obiekcji > 0 && (Number(metryki.obiekcje_z_pytaniem ?? 0) > 0 || m("pytanie_po_obiekcji")),
    kontra_ale: Number(metryki.kontra_ale_po_obiekcji ?? 0),
    rabat_od_razu: Number(metryki.obiekcje_z_rabatem ?? 0) > 0 || m("rabat_od_razu"),
    pytanie_poza_cena: Boolean(metryki.pytanie_poza_cena) || m("pytanie_poza_cena"),
    izolacja: Boolean(metryki.izolacja) || m("izolacja"),
    skala: Boolean(metryki.skala_1_10) || m("skala"),
    hipoteza: Boolean(metryki.hipoteza_koniec) || m("hipoteza"),
    gdyby_cena_ta_sama: Boolean(metryki.gdyby_cena_ta_sama) || m("gdyby_cena_ta_sama"),
    tie_down: Number(metryki.tie_down ?? 0) > 0 || m("tie_down"),
    dowod_z_liczba: m("dowod_z_liczba"),
    ukryty_powod_odkryty: m("ukryty_powod_odkryty"),
    petla_drugie_podejscie: obiekcji > 0 && (Boolean(metryki.prosba_po_obiekcji) || m("petla_drugie_podejscie")),
  };
}

/**
 * 12.10 (W3): ocena OBIEKCJI liczona z technik, jak zamknięcie (E12a). Bez obiekcji w rozmowie = ocena modelu
 * (nie ma czego liczyć). Punkty, start 0: zgoda przed odpowiedzią +2; pytanie po obiekcji +3; zero „ale" +1,
 * 1-2 „ale" -1, ≥3 -2; rabat od razu -2; technika pogłębiająca (poza ceną / izolacja / skala / hipoteza /
 * gdyby cena ta sama): pierwsza +2, druga +1 (max +3); dopięcie +1; dowód z liczbą +1; ukryty powód +1;
 * pętla z drugą prośbą +1. Bez zgody i bez pytania (argument / obrona / rabat): max 4. Wynik 1-10.
 */
export function policzObiekcje(t: ObiekcjeTechniki, ocenaModelu: number): number {
  const klamra = (n: number) => Math.min(10, Math.max(1, Math.round(n)));
  if (t.obiekcji <= 0) return klamra(Number(ocenaModelu) || 1);
  let p = 0;
  if (t.zgoda_przed_odpowiedzia) p += 2;
  if (t.pytanie_po_obiekcji) p += 3;
  p += t.kontra_ale === 0 ? 1 : t.kontra_ale >= 3 ? -2 : -1;
  if (t.rabat_od_razu) p -= 2;
  const poglebienie = [t.pytanie_poza_cena, t.izolacja, t.skala, t.hipoteza, t.gdyby_cena_ta_sama].filter(Boolean).length;
  p += Math.min(3, poglebienie >= 1 ? 2 + (poglebienie - 1) : 0);
  if (t.tie_down) p += 1;
  if (t.dowod_z_liczba) p += 1;
  if (t.ukryty_powod_odkryty) p += 1;
  if (t.petla_drugie_podejscie) p += 1;
  if (!t.zgoda_przed_odpowiedzia && !t.pytanie_po_obiekcji) p = Math.min(p, 4);
  return klamra(p);
}

/** Techniki z odpowiedzi modelu, uzupełnione metrykami. Brak pola = technika nie padła. */
export function technikiZOdpowiedzi(raw: unknown, metryki: Pick<Metryki, "prosby_o_decyzje" | "nastepny_krok_z_data">): ZamkniecieTechniki {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const wybor = <T extends string>(v: unknown, dozwolone: readonly T[], domyslne: T): T => (dozwolone.includes(v as T) ? (v as T) : domyslne);
  return {
    proba_zamkniecia: r.proba_zamkniecia === true,
    pytanie_o_decyzje: r.pytanie_o_decyzje === true || metryki.prosby_o_decyzje > 0,
    nastepny_krok_z_data: r.nastepny_krok_z_data === true || metryki.nastepny_krok_z_data,
    musze_pomyslec: wybor(r.musze_pomyslec, ["nie_padlo", "poddal_sie", "czekal", "pytanie", "warunek"] as const, "nie_padlo"),
    drugie_zamkniecie: wybor(r.drugie_zamkniecie, ["nie_dotyczy", "brak", "bylo"] as const, "nie_dotyczy"),
    sygnal_kupna: wybor(r.sygnal_kupna, ["nie_bylo", "wykorzystany", "zmarnowany"] as const, "nie_bylo"),
  };
}

/** Rodzaj gramatyczny z imienia konta. Polskie imiona żeńskie kończą się na „a" (wyjątki męskie poniżej). */
export function czyKobieta(imie: string | null | undefined): boolean | null {
  const i = (imie ?? "").trim().split(/\s+/)[0]?.toLowerCase();
  if (!i) return null;
  if (["kuba", "barnaba", "bonawentura", "kosma", "jarema", "dyzma", "boryna", "zawisza"].includes(i)) return false;
  return i.endsWith("a");
}

function wyciagnijJson(t: string): unknown {
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("Trener nie zwrócił JSON");
  const surowy = t.slice(s, e + 1);
  try {
    return JSON.parse(surowy);
  } catch {
    // Najczęstszy błąd (1-2.10): prosty cudzysłów " wewnątrz cytatu albo surowa nowa linia.
    // Naprawa: w obrębie wartości tekstowych zamieniamy niezabezpieczone " na „ i \n na spację.
    return JSON.parse(naprawJson(surowy));
  }
}

/** Prosty automat: przechodzi po znakach, śledzi czy jesteśmy w stringu, i neutralizuje cudzysłowy, po których nie następuje separator JSON. */
export function naprawJson(t: string): string {
  let out = "";
  let wStringu = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (!wStringu) {
      if (c === '"') wStringu = true;
      out += c;
      continue;
    }
    if (c === "\\") {
      out += c + (t[i + 1] ?? "");
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      out += " ";
      continue;
    }
    if (c === '"') {
      // koniec stringa tylko, jeśli dalej (po spacjach) jest : , } ]
      const dalej = t.slice(i + 1).match(/^\s*([:,}\]])/);
      if (dalej) {
        wStringu = false;
        out += c;
      } else {
        out += "„";
      }
      continue;
    }
    out += c;
  }
  return out;
}

export async function ocenRozmowe(args: {
  transkrypcja: Wypowiedz[];
  metryki: Metryki;
  konfig: Konfig;
  postac: PostacId;
  tryb?: TrybId;
  cel?: string;
  obiekcja?: string | null;
  poziom?: PoziomId | string | null;
  imie?: string | null;
  ucieta_limitem?: boolean;
  /** 9.10: „Rozmowa, którą masz jutro" (moduł płatny). */
  sytuacja?: string | null;
  /** 11.10: język rozmowy i feedbacku. Brak = "en". */
  jezyk?: Jezyk;
}): Promise<Feedback> {
  const { transkrypcja, metryki, konfig, postac, tryb, cel, obiekcja } = args;
  const pl = args.jezyk === "pl";
  // 10.10: po angielsku trener pisze „you", płeć nie jest potrzebna. 11.10: dla PL wraca logika z fd7de52.
  const poziom = poziomLubDomyslny(typeof args.poziom === "string" ? args.poziom : null);
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.BRUNO_TRENER_MODEL ?? "claude-sonnet-5";

  const kontekst = pl ? kontekstPL(args, poziom) : [
    // 6.10: limit 3 min ucinał rozmowę tuż po sygnale kupna klienta, a trener karał za „urwanie" rozmowy.
    args.ucieta_limitem &&
      "THE APP'S TIME LIMIT ENDED THIS CALL (3 min + 45 s overtime to close). Don't penalize the rep for not answering the customer's LAST line or for the call 'cutting off': the app did that. No ask for a decision in the whole call is still the rep's fault, because during overtime they saw 'Overtime: close' on screen. If the customer gave a buying signal and the rep didn't use it, write that in MINUSES and in the FIX suggest how to close earlier.",
    `CUSTOMER TYPE (DISC): ${POSTACIE[postac].nazwa}, ${POSTACIE[postac].krotko}: ${POSTACIE[postac].opis}`,
    // 12.10 (USER_001, W5): B2B oceniany metodą Negacza, B2C przez zaufanie i decyzję w rozmowie.
    SEGMENT_TRENER[segmentZ(konfig.segment)].en,
    tryb && `CALL MODE: ${TRYBY[tryb].nazwa}. ${tryb === "cold" ? "The customer didn't know the offer; grade the opening in full." : "The customer knew the offer and opened with an objection, so grade the OPENING leniently (what counts is the reaction to the first objection) and OBJECTIONS and CLOSING more strictly."}`,
    cel && `THE REP'S GOAL: ${cel}. In CLOSING say outright whether this goal was reached or whether the rep asked for it.`,
    // Poziom to kontekst, nie taryfa: rubryka jest ta sama, inaczej oceny z dwóch poziomów nie dałyby się porównać.
    `CUSTOMER DIFFICULTY: ${POZIOMY[poziom].nazwa} (${POZIOMY[poziom].krotko}). ${
      poziom === "trudny"
        ? "The customer was set to raise objections twice and push on price. If the rep held up, write it in PLUSES."
        : poziom === "latwy"
          ? "The customer was friendly and let go quickly, so the result doesn't prove the rep can handle a hard customer yet. If the call went smoothly, in NEXT TIME suggest the same scenario on a higher difficulty."
          : "The customer's behavior was typical."
    } DO NOT CHANGE THE SCORE BECAUSE OF DIFFICULTY: the rubric and the 1-10 scale are the same on every level.`,
    obiekcja &&
      (obiekcja.includes(" · ")
        ? `OBJECTIONS TO PRACTICE (the customer was set to raise each): ${obiekcja
            .split(" · ")
            .map((o) => `"${o.trim()}"`)
            .join(", ")}. Grade the handling of each first and put them in obiekcje_ocena.`
        : `OBJECTION TO PRACTICE: "${obiekcja}". Grade its handling first and put it in obiekcje_ocena.`),
    args.sytuacja?.trim() && `THIS CALL'S SITUATION (pasted by the rep, real): ${args.sytuacja.trim()}. Judge whether the rep handled THIS situation.`,
    metryki.nastepny_krok_z_data && "THE METRICS DETECTED A DATED NEXT STEP at the end: that is an ask for a decision, form (b). Do not write 'no ask for a decision'.",
    metryki.kwota_na_prosbe_klienta && "THE AMOUNT CAME AT THE CUSTOMER'S REQUEST (they asked for the number): don't penalize 'price before pain'.",
    konfig.produkt && `WHAT THE REP SELLS: ${konfig.produkt}`,
    konfig.klient && `CUSTOMER PER THE COMPANY: ${konfig.klient}`,
    konfig.udana_rozmowa && `A WIN PER THE COMPANY: ${konfig.udana_rozmowa}`,
    listaObiekcji(konfig.obiekcje).length && `THE COMPANY'S OBJECTION LIST:\n- ${listaObiekcji(konfig.obiekcje).join("\n- ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const tresc = pl
    ? `${kontekst}\n\nMETRYKI (policzone z transkrypcji, ufaj im):\n${JSON.stringify(metryki, null, 0)}\n\nTRANSKRYPCJA:\n${transkrypcjaDoTekstu(transkrypcja, "pl")}\n\n${SCHEMAT_PL}`
    : `${kontekst}\n\nMETRICS (computed from the transcript, trust them):\n${JSON.stringify(metryki, null, 0)}\n\nTRANSCRIPT:\n${transkrypcjaDoTekstu(transkrypcja)}\n\n${SCHEMAT}`;

  // Wymuszony format (2.10): odpowiedź jako wywołanie narzędzia ze schematem.
  // API oddaje gotowy obiekt, więc znika cała klasa błędów „niepoprawny JSON"
  // (cudzysłowy w cytatach, ucięty tekst), która wywalała trenera 1-2.10.
  const SCHEMAT_NARZEDZIA = {
          type: "object",
          properties: {
            kryteria: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nazwa: { type: "string", enum: ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"] },
                  ocena: { type: "integer", minimum: 1, maximum: 10 },
                  cytat: { type: "string" },
                  czas: { type: "string" },
                  komentarz: { type: "string" },
                },
                required: ["nazwa", "ocena", "cytat", "czas", "komentarz"],
              },
            },
            liczba_z_audio: { type: "string" },
            wygrana: { type: "string" },
            poprawka: { type: "string" },
            plusy: { type: "array", items: { type: "string" } },
            minusy: { type: "array", items: { type: "string" } },
            reguly: { type: "array", items: { type: "string" } },
            bonus: { type: "integer", minimum: 0, maximum: 1 },
            kary: { type: "integer", minimum: 0 },
            brak_prosby_o_decyzje: { type: "boolean" },
            mila_bez_tresci: { type: "boolean" },
            obiekcje_ocena: {
              type: "array",
              items: {
                type: "object",
                properties: { obiekcja: { type: "string" }, ocena: { type: "integer", minimum: 1, maximum: 4 } },
                required: ["obiekcja", "ocena"],
              },
            },
            zamkniecie_techniki: {
              type: "object",
              properties: {
                proba_zamkniecia: { type: "boolean" },
                pytanie_o_decyzje: { type: "boolean" },
                nastepny_krok_z_data: { type: "boolean" },
                musze_pomyslec: { type: "string", enum: ["nie_padlo", "poddal_sie", "czekal", "pytanie", "warunek"] },
                drugie_zamkniecie: { type: "string", enum: ["nie_dotyczy", "brak", "bylo"] },
                sygnal_kupna: { type: "string", enum: ["nie_bylo", "wykorzystany", "zmarnowany"] },
              },
              required: ["proba_zamkniecia", "pytanie_o_decyzje", "nastepny_krok_z_data", "musze_pomyslec", "drugie_zamkniecie", "sygnal_kupna"],
            },
            // 12.10 (W3): techniki obiekcji, same wartości tak / nie (liczby i „ale" dolicza kod z metryk).
            obiekcje_techniki: {
              type: "object",
              properties: Object.fromEntries(OBIEKCJE_POLA_MODELU.map((p) => [p, { type: "boolean" }])),
              required: [...OBIEKCJE_POLA_MODELU],
            },
          },
          required: ["kryteria", "liczba_z_audio", "wygrana", "poprawka", "plusy", "minusy", "brak_prosby_o_decyzje", "mila_bez_tresci", "zamkniecie_techniki", "obiekcje_techniki"],
        };
  const system = pl ? RUBRYKA_PL : RUBRYKA;

  // 11.10 (USER_001: „chcę tę ocenę przez ChatGPT”): dostawca trenera z env BRUNO_TRENER_DOSTAWCA
  // = "openai" | "anthropic" (domyślnie anthropic). Ta sama rubryka i ten sam schemat narzędzia.
  const dostawca = process.env.BRUNO_TRENER_DOSTAWCA === "openai" ? "openai" : "anthropic";
  let blokInput: unknown = null;
  let tekst = "";
  if (dostawca === "openai") {
    const modelOpenai = process.env.BRUNO_TRENER_MODEL_OPENAI ?? "gpt-5.5";
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelOpenai,
        messages: [
          { role: "system", content: system },
          { role: "user", content: tresc },
        ],
        tools: [{ type: "function", function: { name: "ocena_rozmowy", description: "Saves the grade of a sales call per the rubric.", parameters: SCHEMAT_NARZEDZIA } }],
        tool_choice: { type: "function", function: { name: "ocena_rozmowy" } },
      }),
    });
    const d = (await r.json()) as { choices?: { message?: { content?: string | null; tool_calls?: { function?: { arguments?: string } }[] } }[]; error?: { message?: string } };
    if (!r.ok) throw new Error(`OpenAI trener ${r.status}: ${d.error?.message ?? ""}`.slice(0, 300));
    const wiad = d.choices?.[0]?.message;
    const arg = wiad?.tool_calls?.[0]?.function?.arguments;
    blokInput = arg ? JSON.parse(arg) : null;
    tekst = String(wiad?.content ?? "");
  } else {
    const odp = await klient.messages.create({
      model,
      max_tokens: 3000,
      system,
      messages: [{ role: "user", content: tresc }],
      tools: [{ name: "ocena_rozmowy", description: "Saves the grade of a sales call per the rubric.", input_schema: SCHEMAT_NARZEDZIA as Anthropic.Tool["input_schema"] }],
      tool_choice: { type: "tool", name: "ocena_rozmowy" },
    });
    const blok = odp.content.find((c) => c.type === "tool_use");
    blokInput = blok && blok.type === "tool_use" ? blok.input : null;
    tekst = odp.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();
  }
  // Zapasowo (gdyby model mimo wymuszenia odpowiedział tekstem): stara ścieżka z naprawą JSON.
  const raw = (blokInput ?? wyciagnijJson(tekst)) as {
    kryteria?: Kryterium[];
    liczba_z_audio?: string;
    wygrana?: string;
    poprawka?: string;
    plusy?: string[];
    minusy?: string[];
    reguly?: string[];
    bonus?: number;
    kary?: number;
    brak_prosby_o_decyzje?: boolean;
    mila_bez_tresci?: boolean;
    obiekcje_ocena?: { obiekcja: string; ocena: number }[];
    zamkniecie_techniki?: unknown;
    obiekcje_techniki?: unknown;
  };

  // 10.10: zamknięcie liczone z technik, liczba modelu zastąpiona.
  const techniki = technikiZOdpowiedzi(raw.zamkniecie_techniki, metryki);
  const ocenaZamkniecia = policzZamkniecie(techniki, metryki);
  // 12.10 (W3): obiekcje liczone z technik, gdy padła choć jedna obiekcja; bez obiekcji zostaje liczba modelu.
  const technikiObiekcji = technikiObiekcjiZOdpowiedzi(raw.obiekcje_techniki, metryki);
  const ocenaObiekcjiModelu = Number(raw.kryteria?.find((x) => x.nazwa === "obiekcje")?.ocena ?? 1);
  const ocenaObiekcji = policzObiekcje(technikiObiekcji, ocenaObiekcjiModelu);
  const kolejnosc: Kryterium["nazwa"][] = ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"];
  const kryteria: Kryterium[] = kolejnosc.map((n) => {
    const k = raw.kryteria?.find((x) => x.nazwa === n);
    return {
      nazwa: n,
      ocena: n === "zamkniecie" ? ocenaZamkniecia : n === "obiekcje" ? ocenaObiekcji : Math.min(10, Math.max(1, Math.round(Number(k?.ocena ?? 1)))),
      cytat: String(k?.cytat ?? "").slice(0, 300),
      czas: String(k?.czas ?? ""),
      komentarz: String(k?.komentarz ?? "").slice(0, 400),
    };
  });
  // 9.10: metryki mają głos rozstrzygający. Gdy wykryły prośbę o decyzję albo następny krok z datą,
  // model nie może orzec „brak prośby" (8.10: „kiedy podpiszemy pełnomocnictwo?" + poniedziałek = max 5).
  const prosbaWgMetryk = metryki.prosby_o_decyzje > 0 || metryki.nastepny_krok_z_data;
  const brakProsby = prosbaWgMetryk ? false : (raw.brak_prosby_o_decyzje ?? metryki.prosby_o_decyzje === 0);
  // Kwota na prośbę klienta: kara „cena przed bólem" (3 pkt) nie obowiązuje.
  const kary = metryki.kwota_na_prosbe_klienta ? Math.max(0, Number(raw.kary ?? 0) - 3) : raw.kary;
  const { ocena, reguly } = policzOcene(
    kryteria,
    {
      bonus: raw.bonus,
      kary,
      brak_prosby_o_decyzje: brakProsby,
      mila_bez_tresci: raw.mila_bez_tresci,
    },
    pl ? "pl" : "en",
  );
  // Lista reguł = to, co naprawdę zadziałało w policzOcene. Z listy modelu zostają tylko powody kary
  // (cena przed bólem, fałszywa technika), i tylko wtedy, gdy kara faktycznie obniżyła ocenę.
  const karaZadzialala = reguly.some((r) => r.startsWith(pl ? "kara z reguł" : "rule penalty"));
  const powodyKary = !karaZadzialala
    ? []
    : pl
      ? (raw.reguly ?? []).map(String).filter((r) => /minus|cen[aęy]|prezentac|fałszyw|technik|limit bez/i.test(r) && !/max 5|pewno/i.test(r))
      : (raw.reguly ?? []).map(String).filter((r) => /minus|price|pitch|fake|technique|scarcity/i.test(r) && !/max 5|confidence/i.test(r));
  const najslabsze = [...kryteria].sort((a, b) => a.ocena - b.ocena)[0].nazwa;

  return {
    ocena,
    kryteria,
    zamkniecie_techniki: techniki,
    obiekcje_techniki: technikiObiekcji,
    liczba_z_audio: String(raw.liczba_z_audio ?? (pl ? `${metryki.wypelniacze_na_min} wypełniaczy na minutę` : `${metryki.wypelniacze_na_min} fillers per minute`)).slice(0, 200),
    wygrana: String(raw.wygrana ?? "").slice(0, 400),
    poprawka: String(raw.poprawka ?? "").slice(0, 400),
    najslabsze,
    obiekcje_ocena: (raw.obiekcje_ocena ?? [])
      .filter((o) => o && typeof o.obiekcja === "string")
      .map((o) => ({ obiekcja: o.obiekcja.slice(0, 200), ocena: Math.min(4, Math.max(1, Math.round(Number(o.ocena) || 2))) })),
    reguly: [...reguly, ...powodyKary].slice(0, 6),
    plusy: (raw.plusy ?? []).filter((p) => typeof p === "string" && p.trim()).map((p) => p.trim().slice(0, 160)).slice(0, 5),
    minusy: (raw.minusy ?? []).filter((m) => typeof m === "string" && m.trim()).map((m) => m.trim().slice(0, 160)).slice(0, 5),
  };
}

/** 11.10: kontekst oceny PO POLSKU (z fd7de52, 1:1; płeć handlowca z transkrypcji albo imienia). */
function kontekstPL(args: Parameters<typeof ocenRozmowe>[0], poziom: PoziomId): string {
  const { transkrypcja, metryki, konfig, postac, tryb, cel, obiekcja } = args;
  const E = etykiety("pl");
  // Płeć: najpierw z własnych słów handlowca w transkrypcji, potem z imienia.
  const kobieta = plecZTranskrypcji(transkrypcja, "pl") ?? czyKobieta(args.imie);
  return [
    // 6.10: ta sama osoba dostawała raz „podałaś", raz „podałeś".
    kobieta === true && `HANDLOWIEC TO KOBIETA${args.imie ? ` (${args.imie})` : ""}. Wszystkie teksty pisz w rodzaju żeńskim: „zrobiłaś”, „podałaś”, „zapytałaś”.`,
    kobieta === false && `HANDLOWIEC TO MĘŻCZYZNA${args.imie ? ` (${args.imie})` : ""}. Wszystkie teksty pisz w rodzaju męskim: „zrobiłeś”, „podałeś”, „zapytałeś”.`,
    kobieta === null && "PŁEĆ HANDLOWCA NIEZNANA. Unikaj form z końcówką rodzajową: zamiast „zrobiłeś” pisz „tu zabrakło…”, „następnym razem zapytaj…”, „dobrze, że padła liczba”.",
    // 6.10: limit 3 min ucinał rozmowę tuż po sygnale kupna klienta, a trener karał za „urwanie" rozmowy.
    args.ucieta_limitem &&
      "ROZMOWĘ ZAKOŃCZYŁ LIMIT CZASU APLIKACJI (3 min + 45 s dogrywki na domknięcie). Nie karz za to, że handlowiec nie odpowiedział na OSTATNIĄ wypowiedź klienta, ani za to, że rozmowa „urywa się”: to zrobiła aplikacja. Brak prośby o decyzję w całej rozmowie nadal jest błędem handlowca, bo w dogrywce widział na ekranie „Dogrywka: domknij”. Jeśli klient dał sygnał kupna, a handlowiec go nie wykorzystał, napisz to w MINUSACH i w POPRAWCE podpowiedz, jak domknąć wcześniej.",
    `TYP KLIENTA (DISC): ${E.POSTACIE[postac].nazwa}, ${E.POSTACIE[postac].krotko}: ${E.POSTACIE[postac].opis}`,
    // 12.10 (USER_001, W5): B2B oceniany metodą Negacza, B2C przez zaufanie i decyzję w rozmowie.
    SEGMENT_TRENER[segmentZ(konfig.segment)].pl,
    tryb && `TRYB ROZMOWY: ${E.TRYBY[tryb].nazwa}. ${tryb === "cold" ? "Klient nie znał oferty, otwarcie oceniaj w pełni." : "Klient znał ofertę i sam zaczął od obiekcji, więc OTWARCIE oceniaj łagodniej (liczy się reakcja na pierwszą obiekcję), a OBIEKCJE i ZAMKNIĘCIE surowiej."}`,
    cel && `CEL HANDLOWCA: ${cel}. W ZAMKNIĘCIU oceń wprost, czy ten cel został osiągnięty albo czy handlowiec o niego poprosił.`,
    // Poziom to kontekst, nie taryfa: rubryka jest ta sama, inaczej oceny z dwóch poziomów nie dałyby się porównać.
    `POZIOM TRUDNOŚCI KLIENTA: ${E.POZIOMY[poziom].nazwa} (${E.POZIOMY[poziom].krotko}). ${
      poziom === "trudny"
        ? "Klient miał wracać do obiekcji dwa razy i dociskać cenę. Jeśli handlowiec to wytrzymał, napisz to w PLUSACH."
        : poziom === "latwy"
          ? "Klient był życzliwy i odpuszczał szybko, więc wynik nie dowodzi jeszcze, że handlowiec zbije obiekcję u trudnego klienta. Jeśli rozmowa poszła gładko, w NASTĘPNYM RAZEM zaproponuj powtórkę tego samego scenariusza na wyższym poziomie."
          : "Zachowanie klienta było typowe."
    } OCENY NIE ZMIENIAJ ZE WZGLĘDU NA POZIOM: rubryka i skala 1-10 są te same na każdym poziomie.`,
    obiekcja &&
      (obiekcja.includes(" · ")
        ? `OBIEKCJE DO PRZETRENOWANIA (klient miał podnieść każdą): ${obiekcja
            .split(" · ")
            .map((o) => `„${o.trim()}”`)
            .join(", ")}. Oceń zbicie każdej z nich w pierwszej kolejności i wpisz je do obiekcje_ocena.`
        : `OBIEKCJA DO PRZETRENOWANIA: „${obiekcja}”. Oceń jej zbicie w pierwszej kolejności i wpisz ją do obiekcje_ocena.`),
    args.sytuacja?.trim() && `SYTUACJA TEJ ROZMOWY (wklejona przez handlowca, prawdziwa): ${args.sytuacja.trim()}. Oceń, czy handlowiec poradził sobie z TĄ sytuacją.`,
    metryki.nastepny_krok_z_data && "METRYKI WYKRYŁY NASTĘPNY KROK Z DATĄ w końcówce: to jest prośba o decyzję w formie (b). Nie pisz „brak prośby o decyzję”.",
    metryki.kwota_na_prosbe_klienta && "KWOTA PADŁA NA PROŚBĘ KLIENTA (sam zapytał o liczbę): nie karz za „cenę przed bólem”.",
    konfig.produkt && `PRODUKT HANDLOWCA: ${konfig.produkt}`,
    konfig.klient && `KLIENT WG FIRMY: ${konfig.klient}`,
    konfig.udana_rozmowa && `UDANA ROZMOWA WG FIRMY: ${konfig.udana_rozmowa}`,
    listaObiekcji(konfig.obiekcje).length && `LISTA OBIEKCJI FIRMY:\n- ${listaObiekcji(konfig.obiekcje).join("\n- ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
