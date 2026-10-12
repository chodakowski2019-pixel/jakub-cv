import Anthropic from "@anthropic-ai/sdk";
import type { Feedback, Konfig } from "./db";
import type { Jezyk } from "./domeny";
import { SEGMENT_NAZWA, segmentZ } from "./segment";

// Fiszki w „Trening" (USER_001 2.10): obiekcja → odpowiedź handlowca (głos
// albo tekst) → krótki werdykt trenera + wzorcowa odpowiedź. Tani, szybki
// model (Haiku), bo to drill, nie pełna ocena rozmowy. Werdykt 1-4 idzie do
// FSRS jako znowu / trudno / dobrze / łatwo.
// 11.10: Bruno w dwóch językach. Prompty PL z fd7de52 (1:1), wybór parametrem `jezyk` (domyślnie "en").

export type WerdyktFiszki = {
  werdykt: 1 | 2 | 3 | 4;
  komentarz: string;
  wzor: string;
  technika: string;
};

const SYSTEM = `You are a sales coach. You score ONE answer from a sales rep to ONE flashcard: a customer objection, a situation to fix from the rep's own call, or a knowledge question (DISC customer types, techniques). Write in plain American English, address the rep as "you". Keep it simple, no lecturing. If you get a MODEL ANSWER, judge whether the rep's answer matches its meaning (not its exact words).

What's good (per Voss, Sandler, Rackham, Belfort, Mazur): a label ("it sounds like..."), a mirror (repeating 1-3 of the customer's words), a clarifying question ("compared to what?", "what exactly doesn't work for you?"), proof with a company name and a number, a reframe, calm confidence, keeping it short.
What's bad: arguing right away, getting defensive, offering a discount right away, "but...", vague claims ("lots of our customers are happy"), making excuses, apologizing, a monologue longer than 3 sentences, giving up.

Score scale: 1 = you lost it (argued, got defensive, gave a discount, gave up), 2 = weak (right direction, wrong form or too long), 3 = good (one of the good techniques, short), 4 = perfect (technique + a question that hands the ball back, confident tone).

Reply ONLY with JSON: {"werdykt":1-4,"komentarz":"1 sentence: what you did and why it works or doesn't","wzor":"a model answer to this objection, 1-3 sentences, first person, ready to say out loud","technika":"name of the technique in the model answer, 1-3 words"}`;

const SYSTEM_PL = `Jesteś trenerem sprzedaży. Oceniasz JEDNĄ odpowiedź handlowca na JEDNĄ fiszkę: obiekcję klienta, sytuację do poprawy z jego własnej rozmowy albo pytanie z wiedzy (typy klientów DISC, techniki). Po polsku, prosto, per „ty", zero moralizowania. Jeśli dostajesz WZÓR, oceniaj zgodność z nim co do sensu (nie co do słów).

Co jest dobre (wg Vossa, Sandlera, Rackhama, Belforta, Mazura): etykieta („wygląda na to, że…"), lustro (powtórzenie 1-3 słów klienta), pytanie doprecyzowujące („w porównaniu do czego?", „co konkretnie nie gra?"), dowód z nazwą firmy i liczbą, przeramowanie, spokojna pewność, krótko.
Co jest złe: argumentowanie od razu, obrona, rabat od razu, „ale…", ogólniki („wielu klientów jest zadowolonych"), tłumaczenie się, przepraszanie, monolog >3 zdania, poddanie się.

Skala werdyktu: 1 = poległeś (argument/obrona/rabat/poddanie), 2 = słabo (dobry kierunek, zła forma albo za długo), 3 = dobrze (jedna z dobrych technik, krótko), 4 = wzorowo (technika + pytanie zwracające piłkę, pewny ton).

Odpowiedz WYŁĄCZNIE JSON-em: {"werdykt":1-4,"komentarz":"1 zdanie: co zrobiłeś i dlaczego to działa albo nie","wzor":"wzorcowa odpowiedź na tę obiekcję, 1-3 zdania, w pierwszej osobie, gotowa do powiedzenia","technika":"nazwa techniki ze wzoru, 1-3 słowa"}`;

export async function ocenFiszke(args: {
  obiekcja: string;
  odpowiedz: string;
  konfig: Konfig;
  typ?: "obiekcja" | "poprawka" | "wiedza";
  pytanie?: string | null;
  wzor?: string | null;
  /** 11.10: język werdyktu. Brak = "en". */
  jezyk?: Jezyk;
}): Promise<WerdyktFiszki> {
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001";
  const pl = args.jezyk === "pl";
  const kontekst = pl
    ? [
        args.konfig.produkt.trim() && `PRODUKT: ${args.konfig.produkt.trim()}`,
        args.konfig.klient.trim() && `KLIENT: ${args.konfig.klient.trim()}`,
        args.konfig.udana_rozmowa.trim() && `CEL HANDLOWCA: ${args.konfig.udana_rozmowa.trim()}`,
      ]
        .filter(Boolean)
        .join("\n")
    : [
    args.konfig.produkt.trim() && `PRODUCT: ${args.konfig.produkt.trim()}`,
    args.konfig.klient.trim() && `CUSTOMER: ${args.konfig.klient.trim()}`,
    args.konfig.udana_rozmowa.trim() && `REP'S GOAL: ${args.konfig.udana_rozmowa.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
  const odp = await klient.messages.create({
    model,
    max_tokens: 900,
    system: pl ? SYSTEM_PL : SYSTEM,
    messages: [
      {
        role: "user",
        content: pl
          ? args.typ && args.typ !== "obiekcja"
            ? `${kontekst}\n\nRODZAJ FISZKI: ${args.typ === "poprawka" ? "sytuacja do poprawy z własnej rozmowy handlowca" : "wiedza (typy klientów / techniki)"}\nTEMAT: ${args.obiekcja}\nPYTANIE: ${args.pytanie ?? ""}\n${args.wzor ? `WZÓR (odpowiedź wzorcowa, oceniaj zgodność co do sensu): ${args.wzor}\n` : ""}\nODPOWIEDŹ HANDLOWCA: „${args.odpowiedz}”`
            : `${kontekst}\n\nOBIEKCJA KLIENTA: „${args.obiekcja}”\n\nODPOWIEDŹ HANDLOWCA: „${args.odpowiedz}”`
          : args.typ && args.typ !== "obiekcja"
            ? `${kontekst}\n\nFLASHCARD TYPE: ${args.typ === "poprawka" ? "a situation to fix from the rep's own call" : "knowledge (customer types / techniques)"}\nTOPIC: ${args.obiekcja}\nQUESTION: ${args.pytanie ?? ""}\n${args.wzor ? `MODEL ANSWER (judge whether the meaning matches): ${args.wzor}\n` : ""}\nREP'S ANSWER: "${args.odpowiedz}"`
            : `${kontekst}\n\nCUSTOMER OBJECTION: "${args.obiekcja}"\n\nREP'S ANSWER: "${args.odpowiedz}"`,
      },
    ],
    // 11.10: wymuszony format (narzędzie ze schematem) zamiast JSON-a w tekście. Model wstawiał
    // cudzysłowy w środek odpowiedzi i JSON.parse padał („Trener nie odpowiedział” w Treningu).
    tools: [
      {
        name: "ocena_fiszki",
        description: "Saves the score of the rep's flashcard answer.",
        input_schema: {
          type: "object",
          properties: {
            werdykt: { type: "integer", minimum: 1, maximum: 4 },
            komentarz: { type: "string" },
            wzor: { type: "string" },
            technika: { type: "string" },
          },
          required: ["werdykt", "komentarz", "wzor", "technika"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "ocena_fiszki" },
  });
  const blok = odp.content.find((c) => c.type === "tool_use");
  let raw: Partial<WerdyktFiszki>;
  if (blok && blok.type === "tool_use") {
    raw = blok.input as Partial<WerdyktFiszki>;
  } else {
    // Zapasowo: stara ścieżka z JSON-em w tekście.
    const tekst = odp.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
    const s = tekst.indexOf("{");
    const e = tekst.lastIndexOf("}");
    if (s < 0 || e < 0) throw new Error("Trener fiszek nie zwrócił JSON");
    raw = JSON.parse(tekst.slice(s, e + 1)) as Partial<WerdyktFiszki>;
  }
  const w = Math.min(4, Math.max(1, Math.round(Number(raw.werdykt ?? 2)))) as 1 | 2 | 3 | 4;
  return {
    werdykt: w,
    komentarz: String(raw.komentarz ?? "").slice(0, 400),
    wzor: String(raw.wzor ?? "").slice(0, 600),
    technika: String(raw.technika ?? "").slice(0, 60),
  };
}

/**
 * Z feedbacku po rozmowie robi 1-3 fiszki „do poprawy" (USER_001 2.10): każda = krótki
 * tytuł, pytanie osadzone w TEJ rozmowie (z cytatem) i wzór. Haiku, tanio. Pusta lista przy błędzie.
 */
export async function kartyZFeedbacku(args: { feedback: Feedback; produkt: string; jezyk?: Jezyk; segment?: string | null }): Promise<{ tresc: string; pytanie: string; wzor: string }[]> {
  const { feedback, produkt } = args;
  const pl = args.jezyk === "pl";
  // 12.10 (W5): fiszki wiedzą, czy klient to firma czy osoba (inne wzory odpowiedzi).
  const segment = SEGMENT_NAZWA[segmentZ(args.segment)][pl ? "pl" : "en"];
  const minusy = feedback.minusy?.length ? feedback.minusy : feedback.kryteria.filter((k) => k.ocena <= 5).map((k) => k.komentarz);
  if (!minusy.length) return [];
  try {
    const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const odp = await klient.messages.create({
      model: process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: pl
        ? "Robisz fiszki do nauki sprzedaży z feedbacku po rozmowie. Po polsku, prosto, per „ty”, jak do kumpla. Każda fiszka to SCENKA do przećwiczenia: (1) tresc = temat w 2-5 słowach, bez kropki, BEZ podpowiedzi rozwiązania (np. „Klient: muszę przemyśleć”); (2) pytanie = 1-2 krótkie zdania: co DOKŁADNIE powiedział klient w tej rozmowie (cytat w „ ”) i na końcu „Co odpowiesz?”. Nie oceniaj handlowca w pytaniu, nie pisz, co zrobił źle, nie zdradzaj odpowiedzi; (3) wzor = gotowa odpowiedź 1-2 zdania, do powiedzenia klientowi słowo w słowo. Nie zmyślaj liczb, nazw ani wyników: jeśli ich nie znasz z rozmowy, wstaw miejsce do uzupełnienia w nawiasie, np. „[liczba] klientów”. Jeśli wzór kończy się pytaniem, ma ono dotyczyć obawy albo celu klienta z tej rozmowy i być jasne (klient od razu wie, co odpowiedzieć). Max 3 fiszki, tylko z realnych minusów."
        : 'You make sales practice flashcards from the feedback after a call. Plain American English, address the rep as "you", simple. Each flashcard is a SCENE to practice: (1) tresc = topic in 2-5 words, no period, NO hint of the answer (e.g. "Customer: I need to think"); (2) pytanie = 1-2 short sentences: exactly what the customer said in this call (quoted) and then "What do you say?". Don\'t judge the rep in the question, don\'t say what they did wrong, don\'t give away the answer; (3) wzor = a ready answer, 1-2 sentences, to say to the customer word for word. Don\'t invent numbers, names or results: if you don\'t know them from the call, put a placeholder in brackets, e.g. "[number] clients". If the answer ends with a question, it must be about the customer\'s concern or goal from this call and be clear (the customer knows right away what to answer). Max 3 flashcards, only from real weak spots.',
      messages: [
        {
          role: "user",
          content: pl
            ? `PRODUKT: ${produkt || "(brak)"}\nKLIENT: ${segment}\nMINUSY: ${JSON.stringify(minusy)}\nKRYTERIA: ${JSON.stringify(feedback.kryteria.map((k) => ({ nazwa: k.nazwa, ocena: k.ocena, cytat: k.cytat, komentarz: k.komentarz })))}\nPOPRAWKA TRENERA: ${feedback.poprawka}${feedback.zamkniecie_techniki ? `\nTECHNIKI ZAMYKANIA (false / brak / poddal_sie / czekal / zmarnowany = do poprawy): ${JSON.stringify(feedback.zamkniecie_techniki)}` : ""}${feedback.obiekcje_techniki && feedback.obiekcje_techniki.obiekcji > 0 ? `\nTECHNIKI OBIEKCJI (false = do poprawy, kontra_ale > 0 = za dużo „ale”): ${JSON.stringify(feedback.obiekcje_techniki)}` : ""}`
            : `PRODUCT: ${produkt || "(none)"}\nCUSTOMER: ${segment}\nWEAK SPOTS: ${JSON.stringify(minusy)}\nCRITERIA: ${JSON.stringify(feedback.kryteria.map((k) => ({ nazwa: k.nazwa, ocena: k.ocena, cytat: k.cytat, komentarz: k.komentarz })))}\nCOACH'S FIX: ${feedback.poprawka}${feedback.zamkniecie_techniki ? `\nCLOSING TECHNIQUES (false / brak / poddal_sie / czekal / zmarnowany = needs work): ${JSON.stringify(feedback.zamkniecie_techniki)}` : ""}${feedback.obiekcje_techniki && feedback.obiekcje_techniki.obiekcji > 0 ? `\nOBJECTION TECHNIQUES (false = needs work, kontra_ale > 0 = too many "but"): ${JSON.stringify(feedback.obiekcje_techniki)}` : ""}`,
        },
      ],
      tools: [
        {
          name: "fiszki",
          description: "Saves the flashcards to work on.",
          input_schema: {
            type: "object",
            properties: {
              karty: {
                type: "array",
                items: { type: "object", properties: { tresc: { type: "string" }, pytanie: { type: "string" }, wzor: { type: "string" } }, required: ["tresc", "pytanie", "wzor"] },
              },
            },
            required: ["karty"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "fiszki" },
    });
    const blok = odp.content.find((c) => c.type === "tool_use");
    const karty = blok && blok.type === "tool_use" ? ((blok.input as { karty?: { tresc: string; pytanie: string; wzor: string }[] }).karty ?? []) : [];
    return karty.slice(0, 3);
  } catch (e) {
    console.error("[bruno kartyZFeedbacku]", e);
    return [];
  }
}
