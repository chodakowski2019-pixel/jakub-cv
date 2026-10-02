import Anthropic from "@anthropic-ai/sdk";
import type { Konfig } from "./db";
import { POSTACIE, type PostacId, type TrybId } from "./postacie";

// Bruno-klient na ElevenLabs Agents (decyzja USER_001 2.10: natywne polskie
// głosy, OpenAI mówił po polsku z akcentem i rwał się). Jeden agent „Bruno AI"
// w koncie ElevenLabs, a per rozmowa nadpisujemy: prompt, pierwszą wypowiedź
// i głos (4 polskie męskie głosy, po jednym na kolor DISC).
//
// Włączenie: BRUNO_DOSTAWCA=elevenlabs + ELEVENLABS_API_KEY + ELEVENLABS_AGENT_ID
// na Vercelu. Bez tego start rozmowy idzie starą ścieżką (OpenAI Realtime).

export const BAZA_EL = "https://api.elevenlabs.io";

export function elevenlabsWlaczone(): boolean {
  return process.env.BRUNO_DOSTAWCA === "elevenlabs" && Boolean(process.env.ELEVENLABS_API_KEY) && Boolean(process.env.ELEVENLABS_AGENT_ID);
}

/** JEDEN polski męski głos dla wszystkich typów (USER_001 2.10): Adam „Serious, Rich, Smoky" z biblioteki ElevenLabs.
 *  Różnica między kolorami DISC siedzi w prompcie (sposób mówienia), nie w barwie głosu. Nadpisanie: ELEVENLABS_GLOS. */
export const GLOS_BRUNO = "hIssydxXZ1WuDorjx6Ic";
export function glosElevenlabs(_postac: PostacId): string {
  return process.env.ELEVENLABS_GLOS || GLOS_BRUNO;
}

/** Token WebRTC dla prywatnego agenta (ważny krótko, tylko do nawiązania sesji z przeglądarki). */
export async function tokenRozmowyEl(): Promise<string> {
  const agent = process.env.ELEVENLABS_AGENT_ID!;
  const odp = await fetch(`${BAZA_EL}/v1/convai/conversation/token?agent_id=${encodeURIComponent(agent)}`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
  });
  if (!odp.ok) throw new Error(`ElevenLabs token ${odp.status}: ${(await odp.text()).slice(0, 300)}`);
  const d = (await odp.json()) as { token?: string };
  if (!d.token) throw new Error("ElevenLabs: pusty token");
  return d.token;
}

/** Podpisany URL WebSocket (TCP) dla prywatnego agenta: zapas, gdy UDP/WebRTC rwie dźwięk (2.10). */
export async function podpisanyUrlEl(): Promise<string> {
  const agent = process.env.ELEVENLABS_AGENT_ID!;
  const odp = await fetch(`${BAZA_EL}/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agent)}`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
  });
  if (!odp.ok) throw new Error(`ElevenLabs signed-url ${odp.status}: ${(await odp.text()).slice(0, 300)}`);
  const d = (await odp.json()) as { signed_url?: string };
  if (!d.signed_url) throw new Error("ElevenLabs: pusty signed_url");
  return d.signed_url;
}

/** Rodzaj połączenia z ElevenLabs: BRUNO_EL_POLACZENIE = websocket (domyślnie od 2.10, TCP, odporne na słabe UDP) albo webrtc. */
export function polaczenieEl(): "websocket" | "webrtc" {
  return process.env.BRUNO_EL_POLACZENIE === "webrtc" ? "webrtc" : "websocket";
}

/**
 * Pierwsza wypowiedź Bruno. Cold call = odbiera telefon. Na żywo / online =
 * sam zaczyna: podsumowanie oferty + pierwsza obiekcja. Generowane Haiku
 * w 1-2 s, z awaryjnym szablonem, gdy model nie odpowie.
 */
export async function pierwszaWypowiedz(args: { tryb: TrybId; postac: PostacId; konfig: Konfig; obiekcja: string | null }): Promise<string> {
  const { tryb, postac, konfig, obiekcja } = args;
  if (tryb === "cold") {
    const warianty = ["Halo, słucham?", "Tak, Bruno, słucham.", "Halo? Kto mówi?", "Słucham, Bruno przy telefonie."];
    return warianty[Math.floor(Math.random() * warianty.length)];
  }
  const produkt = konfig.produkt.trim() || "Państwa ofertę";
  const szablon =
    tryb === "zywo"
      ? `Dzień dobry. Znam już ${produkt}, przeczytałem wszystko. Powiem wprost: ${obiekcja ? obiekcja.toLowerCase() : "mam wątpliwości"}.`
      : `Dziękuję za prezentację. Jeśli dobrze rozumiem, proponują Państwo ${produkt}. Mam jedno pytanie: ${obiekcja ? obiekcja.toLowerCase() : "czy to na pewno dla nas"}.`;
  if (!process.env.ANTHROPIC_API_KEY) return szablon;
  try {
    const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const odp = await klient.messages.create({
      model: process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `Piszesz JEDNĄ pierwszą wypowiedź klienta w treningowej rozmowie sprzedażowej, po polsku, 2-3 krótkie zdania, mówione, naturalne, bez cudzysłowów i bez didaskaliów. Klient to typ ${POSTACIE[postac].krotko} (${POSTACIE[postac].opis}). Zwróć tylko tekst wypowiedzi.`,
      messages: [
        {
          role: "user",
          content:
            tryb === "zywo"
              ? `Sytuacja: spotkanie 1:1 na żywo. Klient zna ofertę: ${produkt}. Zaczyna rozmowę: krótko podsumowuje własnymi słowami, co wie o ofercie, i OD RAZU podnosi obiekcję: „${obiekcja ?? "mam wątpliwości co do ceny"}”.`
              : `Sytuacja: spotkanie online tuż po prezentacji handlowca. Klient widział prezentację oferty: ${produkt}. Zaczyna: podsumowuje, co zrozumiał („jeśli dobrze rozumiem…”), i podnosi obiekcję albo trudne pytanie: „${obiekcja ?? "czy to na pewno dla nas"}”.`,
        },
      ],
    });
    const tekst = odp.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();
    return tekst.length > 10 ? tekst.slice(0, 400) : szablon;
  } catch {
    return szablon;
  }
}
