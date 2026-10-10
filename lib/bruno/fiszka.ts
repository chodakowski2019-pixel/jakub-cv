import Anthropic from "@anthropic-ai/sdk";
import type { Feedback, Konfig } from "./db";

// Fiszki w „Trening" (USER_001 2.10): obiekcja → odpowiedź handlowca (głos
// albo tekst) → krótki werdykt trenera + wzorcowa odpowiedź. Tani, szybki
// model (Haiku), bo to drill, nie pełna ocena rozmowy. Werdykt 1-4 idzie do
// FSRS jako znowu / trudno / dobrze / łatwo.

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

export async function ocenFiszke(args: { obiekcja: string; odpowiedz: string; konfig: Konfig; typ?: "obiekcja" | "poprawka" | "wiedza"; pytanie?: string | null; wzor?: string | null }): Promise<WerdyktFiszki> {
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001";
  const kontekst = [
    args.konfig.produkt.trim() && `PRODUCT: ${args.konfig.produkt.trim()}`,
    args.konfig.klient.trim() && `CUSTOMER: ${args.konfig.klient.trim()}`,
    args.konfig.udana_rozmowa.trim() && `REP'S GOAL: ${args.konfig.udana_rozmowa.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
  const odp = await klient.messages.create({
    model,
    max_tokens: 500,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content:
          args.typ && args.typ !== "obiekcja"
            ? `${kontekst}\n\nFLASHCARD TYPE: ${args.typ === "poprawka" ? "a situation to fix from the rep's own call" : "knowledge (customer types / techniques)"}\nTOPIC: ${args.obiekcja}\nQUESTION: ${args.pytanie ?? ""}\n${args.wzor ? `MODEL ANSWER (judge whether the meaning matches): ${args.wzor}\n` : ""}\nREP'S ANSWER: "${args.odpowiedz}"`
            : `${kontekst}\n\nCUSTOMER OBJECTION: "${args.obiekcja}"\n\nREP'S ANSWER: "${args.odpowiedz}"`,
      },
    ],
  });
  const tekst = odp.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
  const s = tekst.indexOf("{");
  const e = tekst.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("Trener fiszek nie zwrócił JSON");
  const raw = JSON.parse(tekst.slice(s, e + 1)) as Partial<WerdyktFiszki>;
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
export async function kartyZFeedbacku(args: { feedback: Feedback; produkt: string }): Promise<{ tresc: string; pytanie: string; wzor: string }[]> {
  const { feedback, produkt } = args;
  const minusy = feedback.minusy?.length ? feedback.minusy : feedback.kryteria.filter((k) => k.ocena <= 5).map((k) => k.komentarz);
  if (!minusy.length) return [];
  try {
    const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const odp = await klient.messages.create({
      model: process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: 'You make sales practice flashcards from the feedback after a call. Write in plain American English, address the rep as "you". Keep it simple. Each flashcard has: a title (max 6 words, no period), a question rooted in this specific call (what the customer said / what the rep did, with a quote if there is one) that ends with "What will you do next time?", and a model answer (1-3 sentences, ready to say or do). Max 3 flashcards, only from real weak spots.',
      messages: [
        {
          role: "user",
          content: `PRODUCT: ${produkt || "(none)"}\nWEAK SPOTS: ${JSON.stringify(minusy)}\nCRITERIA: ${JSON.stringify(feedback.kryteria.map((k) => ({ nazwa: k.nazwa, ocena: k.ocena, cytat: k.cytat, komentarz: k.komentarz })))}\nCOACH'S FIX: ${feedback.poprawka}${feedback.zamkniecie_techniki ? `\nCLOSING TECHNIQUES (false / brak / poddal_sie / czekal / zmarnowany = needs work): ${JSON.stringify(feedback.zamkniecie_techniki)}` : ""}`,
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
