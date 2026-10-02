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

/** JEDEN polski męski głos dla wszystkich typów (USER_001 2.10, wybór uchem z 4 próbek: „B najlepszy, potem D"):
 *  Adam „Approachable and Raspy" (rozmowny), zapas D = Kamil `mr1ubFaLs5xVrh1EqWtc`. Odrzucone: Adam Serious (lektorski), Maciej.
 *  Różnica między kolorami DISC siedzi w prompcie, nie w barwie głosu. Nadpisanie: ELEVENLABS_GLOS. */
export const GLOS_BRUNO = "o11yegU3CL24TZ1qcm6b";
export function glosElevenlabs(_postac: PostacId): string {
  return process.env.ELEVENLABS_GLOS || GLOS_BRUNO;
}

/** Minimalny zapas kredytów na jedną rozmowę 3 min (pomiar 2.10: 289 kredytów za 37 s ≈ 1 400 za 3 min). */
export const MIN_KREDYTOW_EL = Number(process.env.ELEVENLABS_MIN_KREDYTOW) || 1500;

/**
 * Czy ElevenLabs ma jeszcze kredyty na rozmowę (2.10, pytanie USER_001 o automatyczne
 * przełączenie na OpenAI). Zwraca liczbę wolnych kredytów albo null, gdy nie da się sprawdzić.
 */
export async function wolneKredytyEl(): Promise<number | null> {
  try {
    const odp = await fetch(`${BAZA_EL}/v1/user/subscription`, { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! }, cache: "no-store" });
    if (!odp.ok) return null;
    const d = (await odp.json()) as { character_count?: number; character_limit?: number };
    if (typeof d.character_count !== "number" || typeof d.character_limit !== "number") return null;
    return Math.max(0, d.character_limit - d.character_count);
  } catch {
    return null;
  }
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

/**
 * Nagranie rozmowy z konta ElevenLabs (mp3, 16 kHz mono). Ścieżka ElevenLabs nie
 * nagrywa w przeglądarce, więc bez tego audio zostawałoby tylko u nich (2.10).
 * Zwraca null, gdy pliku jeszcze nie ma (przetwarzanie po rozmowie), klucz nie ma
 * uprawnienia History albo rozmowa jest za krótka, żeby plik miał sens.
 */
export async function audioRozmowyEl(conversationId: string): Promise<{ bajty: ArrayBuffer; typ: string } | null> {
  const klucz = process.env.ELEVENLABS_API_KEY;
  if (!klucz || !conversationId) return null;
  const odp = await fetch(`${BAZA_EL}/v1/convai/conversations/${encodeURIComponent(conversationId)}/audio`, {
    headers: { "xi-api-key": klucz },
    cache: "no-store",
  });
  if (!odp.ok) {
    console.warn(`[bruno] audio ElevenLabs ${conversationId}: ${odp.status} ${(await odp.text()).slice(0, 200)}`);
    return null;
  }
  const bajty = await odp.arrayBuffer();
  if (bajty.byteLength < 2000) return null;
  return { bajty, typ: odp.headers.get("content-type") || "audio/mpeg" };
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
