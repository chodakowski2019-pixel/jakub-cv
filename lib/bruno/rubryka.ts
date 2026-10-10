import Anthropic from "@anthropic-ai/sdk";
import type { Feedback, Konfig, Kryterium, Wypowiedz, ZamkniecieTechniki } from "./db";
import { listaObiekcji } from "./db";
import type { Metryki } from "./metryki";
import { POSTACIE, POZIOMY, TRYBY, poziomLubDomyslny, type PostacId, type PoziomId, type TrybId } from "./postacie";
import { NAZWY, WAGI } from "./kryteria";

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
4. CLOSING (last 20 %). AN ASK FOR A DECISION is ANY of these: (a) a direct question for a decision ("do we have a deal?", "are you in?"), (b) A DATED NEXT STEP proposed by the rep ("when can we get the paperwork signed?", "I can put you down for Monday", "let's meet Tuesday at 10"), (c) a choice of time ("morning or afternoon?"). In multi-step sales (b) IS a close and you must NOT write "no ask for a decision" when it happened. 1-2 asks = good, 0 or ≥3 = bad; progress = date + person + an action by the customer; continuation with no date ("I'll follow up", "I'll send the proposal", "think it over") = bad; the amount stated plainly = good; price with "only", "just", "unfortunately" = bad; the customer saying the date/step themselves = good; "what could get in the way?" = bonus; scarcity only with a real reason; silence after the price, the customer speaks first (rep adds >15 words = justifying).
   CLOSING TECHNIQUES: fill in zamkniecie_techniki (each technique separately; the CLOSING score is computed from them automatically, your number for "zamkniecie" is only a guide):
   - proba_zamkniecia: a trial close before the ask ("how does that sound?", "what do you think?", "does that make sense for you?").
   - pytanie_o_decyzje: a direct ask for a decision ("do we have a deal?", "are you in?", "shall we get started?").
   - nastepny_krok_z_data: the rep proposed a concrete next step with a date or a choice of times.
   - musze_pomyslec: how the rep handled a stall ("I need to think about it", "I'll run it by my boss", "I'll check with my partner", "let's circle back next quarter", "I'll compare"): nie_padlo (the customer didn't stall), poddal_sie ("I understand, I'll follow up"), czekal (did nothing, changed the subject), pytanie ("what exactly do you need to think about?", "what's missing for a decision?"), warunek ("if X, do we sign?").
   - drugie_zamkniecie: after an objection at the close, a SECOND ask for a decision came (bylo), didn't (brak), there was no objection at the close (nie_dotyczy).
   - sygnal_kupna: the customer gave a signal ("what would it take to get started?", "that gives me a clearer picture", "sounds interesting"): wykorzystany (the rep asked for a decision or a step right away), zmarnowany (kept talking), nie_bylo.
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
  "zamkniecie_techniki": {"proba_zamkniecia":true/false,"pytanie_o_decyzje":true/false,"nastepny_krok_z_data":true/false,"musze_pomyslec":"nie_padlo|poddal_sie|czekal|pytanie|warunek","drugie_zamkniecie":"nie_dotyczy|brak|bylo","sygnal_kupna":"nie_bylo|wykorzystany|zmarnowany"}
}
obiekcje_ocena scale: 1 = the rep lost it, 2 = weak, 3 = good, 4 = textbook. Include only objections from the company's list that actually came up.
FORMAT: it must be valid JSON. Inside strings do NOT use the plain double quote " or newlines; write quotes with ' or “ ”. No text before or after the JSON.`;

function formatCzas(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function transkrypcjaDoTekstu(tr: Wypowiedz[]): string {
  return tr.map((w) => `[${formatCzas(w.t)}] ${w.rola === "handlowiec" ? "REP" : "CUSTOMER"}: ${w.tekst}`).join("\n");
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
): { ocena: number; reguly: string[] } {
  const z = (n: Kryterium["nazwa"]) => Math.min(10, Math.max(1, Number(kryteria.find((k) => k.nazwa === n)?.ocena ?? 1)));
  let baza = 0;
  for (const n of Object.keys(WAGI) as Kryterium["nazwa"][]) baza += z(n) * WAGI[n];
  const uzyte: string[] = [];
  if (reguly.bonus) {
    baza += 1;
    uzyte.push("reframe: +1");
  }

  // Kandydaci: każda reguła osobno liczy, ile zostaje z bazy. Wygrywa najniższy wynik.
  const kandydaci: { wynik: number; opis: string }[] = [];
  const kary = Math.max(0, Math.min(6, Number(reguly.kary ?? 0)));
  if (kary && baza > PODLOGA_KARY) kandydaci.push({ wynik: Math.max(PODLOGA_KARY, baza - kary), opis: `rule penalty: -${kary} (not below ${PODLOGA_KARY})` });
  if (reguly.brak_prosby_o_decyzje && baza > 5) kandydaci.push({ wynik: 5, opis: "no ask for a decision: max 5" });
  if (reguly.mila_bez_tresci && baza > 5) kandydaci.push({ wynik: 5, opis: "nice but empty: max 5" });
  const sufit = z("pewnosc") + 2;
  if (baza > sufit) kandydaci.push({ wynik: sufit, opis: "no higher than confidence + 2" });

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
}): Promise<Feedback> {
  const { transkrypcja, metryki, konfig, postac, tryb, cel, obiekcja } = args;
  // 10.10: po angielsku trener pisze „you", płeć nie jest potrzebna (plecZTranskrypcji / czyKobieta zostają nieużywane).
  const poziom = poziomLubDomyslny(typeof args.poziom === "string" ? args.poziom : null);
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.BRUNO_TRENER_MODEL ?? "claude-sonnet-5";

  const kontekst = [
    // 6.10: limit 3 min ucinał rozmowę tuż po sygnale kupna klienta, a trener karał za „urwanie" rozmowy.
    args.ucieta_limitem &&
      "THE APP'S TIME LIMIT ENDED THIS CALL (3 min + 45 s overtime to close). Don't penalize the rep for not answering the customer's LAST line or for the call 'cutting off': the app did that. No ask for a decision in the whole call is still the rep's fault, because during overtime they saw 'Overtime: close' on screen. If the customer gave a buying signal and the rep didn't use it, write that in MINUSES and in the FIX suggest how to close earlier.",
    `CUSTOMER TYPE (DISC): ${POSTACIE[postac].nazwa}, ${POSTACIE[postac].krotko}: ${POSTACIE[postac].opis}`,
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

  const tresc = `${kontekst}\n\nMETRICS (computed from the transcript, trust them):\n${JSON.stringify(metryki, null, 0)}\n\nTRANSCRIPT:\n${transkrypcjaDoTekstu(transkrypcja)}\n\n${SCHEMAT}`;

  // Wymuszony format (2.10): odpowiedź jako wywołanie narzędzia ze schematem.
  // API oddaje gotowy obiekt, więc znika cała klasa błędów „niepoprawny JSON"
  // (cudzysłowy w cytatach, ucięty tekst), która wywalała trenera 1-2.10.
  const odp = await klient.messages.create({
    model,
    max_tokens: 3000,
    system: RUBRYKA,
    messages: [{ role: "user", content: tresc }],
    tools: [
      {
        name: "ocena_rozmowy",
        description: "Saves the grade of a sales call per the rubric.",
        input_schema: {
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
          },
          required: ["kryteria", "liczba_z_audio", "wygrana", "poprawka", "plusy", "minusy", "brak_prosby_o_decyzje", "mila_bez_tresci", "zamkniecie_techniki"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "ocena_rozmowy" },
  });
  const blok = odp.content.find((c) => c.type === "tool_use");
  const tekst = odp.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
  // Zapasowo (gdyby model mimo wymuszenia odpowiedział tekstem): stara ścieżka z naprawą JSON.
  const raw = (blok && blok.type === "tool_use" ? (blok.input as unknown) : wyciagnijJson(tekst)) as {
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
  };

  // 10.10: zamknięcie liczone z technik, liczba modelu zastąpiona.
  const techniki = technikiZOdpowiedzi(raw.zamkniecie_techniki, metryki);
  const ocenaZamkniecia = policzZamkniecie(techniki, metryki);
  const kolejnosc: Kryterium["nazwa"][] = ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"];
  const kryteria: Kryterium[] = kolejnosc.map((n) => {
    const k = raw.kryteria?.find((x) => x.nazwa === n);
    return {
      nazwa: n,
      ocena: n === "zamkniecie" ? ocenaZamkniecia : Math.min(10, Math.max(1, Math.round(Number(k?.ocena ?? 1)))),
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
  const { ocena, reguly } = policzOcene(kryteria, {
    bonus: raw.bonus,
    kary,
    brak_prosby_o_decyzje: brakProsby,
    mila_bez_tresci: raw.mila_bez_tresci,
  });
  // Lista reguł = to, co naprawdę zadziałało w policzOcene. Z listy modelu zostają tylko powody kary
  // (cena przed bólem, fałszywa technika), i tylko wtedy, gdy kara faktycznie obniżyła ocenę.
  const karaZadzialala = reguly.some((r) => r.startsWith("rule penalty"));
  const powodyKary = karaZadzialala
    ? (raw.reguly ?? []).map(String).filter((r) => /minus|price|pitch|fake|technique|scarcity/i.test(r) && !/max 5|confidence/i.test(r))
    : [];
  const najslabsze = [...kryteria].sort((a, b) => a.ocena - b.ocena)[0].nazwa;

  return {
    ocena,
    kryteria,
    zamkniecie_techniki: techniki,
    liczba_z_audio: String(raw.liczba_z_audio ?? `${metryki.wypelniacze_na_min} fillers per minute`).slice(0, 200),
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
