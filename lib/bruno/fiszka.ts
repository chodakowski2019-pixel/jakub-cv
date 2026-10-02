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

const SYSTEM = `Jesteś trenerem sprzedaży. Oceniasz JEDNĄ odpowiedź handlowca na JEDNĄ fiszkę: obiekcję klienta, sytuację do poprawy z jego własnej rozmowy albo pytanie z wiedzy (typy klientów DISC, techniki). Po polsku, prosto, per „ty", zero moralizowania. Jeśli dostajesz WZÓR, oceniaj zgodność z nim co do sensu (nie co do słów).

Co jest dobre (wg Vossa, Sandlera, Rackhama, Belforta, Mazura): etykieta („wygląda na to, że…"), lustro (powtórzenie 1-3 słów klienta), pytanie doprecyzowujące („w porównaniu do czego?", „co konkretnie nie gra?"), dowód z nazwą firmy i liczbą, przeramowanie, spokojna pewność, krótko.
Co jest złe: argumentowanie od razu, obrona, rabat od razu, „ale…", ogólniki („wielu klientów jest zadowolonych"), tłumaczenie się, przepraszanie, monolog >3 zdania, poddanie się.

Skala werdyktu: 1 = poległeś (argument/obrona/rabat/poddanie), 2 = słabo (dobry kierunek, zła forma albo za długo), 3 = dobrze (jedna z dobrych technik, krótko), 4 = wzorowo (technika + pytanie zwracające piłkę, pewny ton).

Odpowiedz WYŁĄCZNIE JSON-em: {"werdykt":1-4,"komentarz":"1 zdanie: co zrobiłeś i dlaczego to działa albo nie","wzor":"wzorcowa odpowiedź na tę obiekcję, 1-3 zdania, w pierwszej osobie, gotowa do powiedzenia","technika":"nazwa techniki ze wzoru, 1-3 słowa"}`;

export async function ocenFiszke(args: { obiekcja: string; odpowiedz: string; konfig: Konfig; typ?: "obiekcja" | "poprawka" | "wiedza"; pytanie?: string | null; wzor?: string | null }): Promise<WerdyktFiszki> {
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001";
  const kontekst = [
    args.konfig.produkt.trim() && `PRODUKT: ${args.konfig.produkt.trim()}`,
    args.konfig.klient.trim() && `KLIENT: ${args.konfig.klient.trim()}`,
    args.konfig.udana_rozmowa.trim() && `CEL HANDLOWCA: ${args.konfig.udana_rozmowa.trim()}`,
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
            ? `${kontekst}\n\nRODZAJ FISZKI: ${args.typ === "poprawka" ? "sytuacja do poprawy z własnej rozmowy handlowca" : "wiedza (typy klientów / techniki)"}\nTEMAT: ${args.obiekcja}\nPYTANIE: ${args.pytanie ?? ""}\n${args.wzor ? `WZÓR (odpowiedź wzorcowa, oceniaj zgodność co do sensu): ${args.wzor}\n` : ""}\nODPOWIEDŹ HANDLOWCA: „${args.odpowiedz}”`
            : `${kontekst}\n\nOBIEKCJA KLIENTA: „${args.obiekcja}”\n\nODPOWIEDŹ HANDLOWCA: „${args.odpowiedz}”`,
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
      system: "Robisz fiszki do nauki sprzedaży z feedbacku po rozmowie. Po polsku, prosto, per „ty”. Każda fiszka: tytuł (max 6 słów, bez kropki), pytanie osadzone w tej konkretnej rozmowie (co klient powiedział / co handlowiec zrobił, z cytatem jeśli jest) kończące się „Co zrobisz następnym razem?”, i wzór (1-3 zdania, gotowe do powiedzenia albo zrobienia). Max 3 fiszki, tylko z realnych minusów.",
      messages: [
        {
          role: "user",
          content: `PRODUKT: ${produkt || "(brak)"}\nMINUSY: ${JSON.stringify(minusy)}\nKRYTERIA: ${JSON.stringify(feedback.kryteria.map((k) => ({ nazwa: k.nazwa, ocena: k.ocena, cytat: k.cytat, komentarz: k.komentarz })))}\nPOPRAWKA TRENERA: ${feedback.poprawka}`,
        },
      ],
      tools: [
        {
          name: "fiszki",
          description: "Zapisuje fiszki do poprawy.",
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
