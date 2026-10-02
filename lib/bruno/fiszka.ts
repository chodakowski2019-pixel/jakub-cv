import Anthropic from "@anthropic-ai/sdk";
import type { Konfig } from "./db";

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

const SYSTEM = `Jesteś trenerem sprzedaży. Oceniasz JEDNĄ odpowiedź handlowca na JEDNĄ obiekcję klienta. Po polsku, prosto, per „ty", zero moralizowania.

Co jest dobre (wg Vossa, Sandlera, Rackhama, Belforta, Mazura): etykieta („wygląda na to, że…"), lustro (powtórzenie 1-3 słów klienta), pytanie doprecyzowujące („w porównaniu do czego?", „co konkretnie nie gra?"), dowód z nazwą firmy i liczbą, przeramowanie, spokojna pewność, krótko.
Co jest złe: argumentowanie od razu, obrona, rabat od razu, „ale…", ogólniki („wielu klientów jest zadowolonych"), tłumaczenie się, przepraszanie, monolog >3 zdania, poddanie się.

Skala werdyktu: 1 = poległeś (argument/obrona/rabat/poddanie), 2 = słabo (dobry kierunek, zła forma albo za długo), 3 = dobrze (jedna z dobrych technik, krótko), 4 = wzorowo (technika + pytanie zwracające piłkę, pewny ton).

Odpowiedz WYŁĄCZNIE JSON-em: {"werdykt":1-4,"komentarz":"1 zdanie: co zrobiłeś i dlaczego to działa albo nie","wzor":"wzorcowa odpowiedź na tę obiekcję, 1-3 zdania, w pierwszej osobie, gotowa do powiedzenia","technika":"nazwa techniki ze wzoru, 1-3 słowa"}`;

export async function ocenFiszke(args: { obiekcja: string; odpowiedz: string; konfig: Konfig }): Promise<WerdyktFiszki> {
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
    messages: [{ role: "user", content: `${kontekst}\n\nOBIEKCJA KLIENTA: „${args.obiekcja}”\n\nODPOWIEDŹ HANDLOWCA: „${args.odpowiedz}”` }],
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
