import Anthropic from "@anthropic-ai/sdk";
import type { Konfig } from "./db";
import type { Jezyk } from "./domeny";
import { ETAPY, ETAPY_BRUNO_PL, REJESTRY, REJESTRY_BRUNO_PL, etapLubDomyslny, rejestrLubDomyslny } from "./etapy";
import { etykiety } from "./etykiety";
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

/** JEDEN głos dla wszystkich typów. 10.10 (USER_001, wybór uchem z 3 próbek EN): nr 2 „Chris, Charming, Down-to-Earth"
 *  (ElevenLabs premade, amerykański). Zapas: Brian `nPczCjzI2devNBz1zQrb` (amerykański, niski), Daniel `onwK4e9ZLuTAKqWW03F9` (brytyjski).
 *  Stary polski głos (Adam `o11yegU3CL24TZ1qcm6b`) wyłączony razem z polskim. Nadpisanie: ELEVENLABS_GLOS. */
export const GLOS_BRUNO = "iP95p4xoKVk53GoZ742B";
/** 11.10 (Bruno w dwóch językach): konta PL wracają do polskiego głosu Adam „Approachable and Raspy" (wybór USER_001 z 2.10). */
export const GLOS_BRUNO_PL = "o11yegU3CL24TZ1qcm6b";
/** 11.10 (USER_001): kobiece głosy do wyboru w Ustawieniach. PL Aleksandra (biblioteka ElevenLabs, conversational), EN Matilda (potwierdzona). */
export const GLOS_BRUNO_K_PL = "NOWYzprzTwfZQqU76pBX"; // 11.10 USER_001: Aleksandra (C), „najlepsza, ma być płynniejsza”.
export const GLOS_BRUNO_K = "XrExE9yKIg1WjnnlVkGX";
/**
 * 11.10 (USER_001: „Aleksandra, wersja C4 naturalna-płynna”): ustawienia głosu dla kobiecego PL.
 * Agent ElevenLabs pozwala nadpisać per rozmowa: stability, similarity_boost, speed. Inne głosy = ustawienia agenta.
 */
export function ustawieniaGlosu(jezyk: Jezyk, plec: PlecGlosu): { stability: number; similarityBoost: number; speed: number } | null {
  if (plec === "k" && jezyk === "pl") return { stability: 0.5, similarityBoost: 0.75, speed: 1.05 }; // 15.10: głos v3 przyjmuje stability 0 / 0,5 / 1 (było 0,55)
  return null;
}
/** Imię klientki, gdy wybrany głos kobiecy (do potwierdzenia przez USER_001). */
export const IMIE_K: Record<Jezyk, string> = { pl: "Anna", en: "Anna" };
export type PlecGlosu = "m" | "k";
export function plecGlosu(g: unknown): PlecGlosu {
  return g === "k" ? "k" : "m";
}
/** Głos Bruno w danym języku i płci. ELEVENLABS_GLOS nadpisuje tylko męski EN. */
export function glosElevenlabs(_postac: PostacId, jezyk: Jezyk = "en", plec: PlecGlosu = "m"): string {
  if (plec === "k") return jezyk === "pl" ? GLOS_BRUNO_K_PL : GLOS_BRUNO_K;
  if (jezyk === "pl") return GLOS_BRUNO_PL;
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
export async function pierwszaWypowiedz(args: { tryb: TrybId; postac: PostacId; konfig: Konfig; obiekcja: string | null; sytuacja?: string | null; jezyk?: Jezyk }): Promise<string> {
  if (args.jezyk === "pl") return pierwszaWypowiedzPL(args);
  const { tryb, postac, konfig, obiekcja } = args;
  if (tryb === "cold") {
    const warianty = plecGlosu(konfig.glos) === "k" ? ["Yeah, hello?", `This is ${IMIE_K.en}.`, "Hello? Who's this?", `${IMIE_K.en} speaking.`] : ["Yeah, hello?", "This is Bruno.", "Hello? Who's this?", "Bruno speaking."];
    return warianty[Math.floor(Math.random() * warianty.length)];
  }
  const produkt = konfig.produkt.trim() || "your offer";
  const rejestr = REJESTRY[rejestrLubDomyslny(konfig.rejestr)];
  const etap = ETAPY[etapLubDomyslny(konfig.etap)];
  const sytuacja = args.sytuacja?.trim();
  const szablon =
    tryb === "zywo"
      ? `Hi. I've read through ${produkt}, all of it. I'll be straight with you: ${obiekcja ? obiekcja.toLowerCase() : "I have my doubts"}.`
      : `Thanks for the presentation. If I got this right, you're proposing ${produkt}. One question: ${obiekcja ? obiekcja.toLowerCase() : "is this really a fit for us"}.`;
  if (!process.env.ANTHROPIC_API_KEY) return szablon;
  try {
    const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const odp = await klient.messages.create({
      model: process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 200,
      // 9.10: etap, forma zwracania się i sytuacja z życia, żeby pierwsze zdanie nie zmyślało oferty.
      system: `You write ONE opening line for the customer in a sales training call, in American English, 2-3 short spoken sentences, natural, no quotation marks, no stage directions. The customer is the ${POSTACIE[postac].krotko} type (${POSTACIE[postac].opis}). ${rejestr.bruno} Relationship stage: ${etap.nazwa}: ${etap.bruno} You talk ONLY about what's in the offer description; you don't invent other products or prices. Return only the spoken text.${plecGlosu(konfig.glos) === "k" ? " The customer is a woman." : ""}`,
      messages: [
        {
          role: "user",
          content:
            (sytuacja ? `THIS CALL'S SITUATION (overrides everything, stick to the facts): ${sytuacja}\n\n` : "") +
            (tryb === "zywo"
              ? `Situation: in-person 1:1 meeting. The customer knows the offer: ${produkt}. They open the conversation: briefly sum up in their own words what they know about the offer and RIGHT AWAY raise the objection: "${obiekcja ?? "I have doubts about the price"}".`
              : `Situation: online meeting right after the rep's presentation. The customer saw the presentation of: ${produkt}. They open: sum up what they understood ("if I got this right…") and raise an objection or a hard question: "${obiekcja ?? "is this really a fit for us"}".`),
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

/** 11.10: pierwsza wypowiedź PO POLSKU (z fd7de52, 1:1). */
async function pierwszaWypowiedzPL(args: { tryb: TrybId; postac: PostacId; konfig: Konfig; obiekcja: string | null; sytuacja?: string | null }): Promise<string> {
  const { tryb, postac, konfig, obiekcja } = args;
  if (tryb === "cold") {
    const warianty = plecGlosu(konfig.glos) === "k" ? ["Halo, słucham?", `Tak, ${IMIE_K.pl}, słucham.`, "Halo? Kto mówi?", `Słucham, ${IMIE_K.pl} przy telefonie.`] : ["Halo, słucham?", "Tak, Bruno, słucham.", "Halo? Kto mówi?", "Słucham, Bruno przy telefonie."];
    return warianty[Math.floor(Math.random() * warianty.length)];
  }
  const E = etykiety("pl");
  const produkt = konfig.produkt.trim() || "Państwa ofertę";
  const rejestr = REJESTRY_BRUNO_PL[rejestrLubDomyslny(konfig.rejestr)];
  const etapId = etapLubDomyslny(konfig.etap);
  const sytuacja = args.sytuacja?.trim();
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
      // 9.10: etap, forma zwracania się i sytuacja z życia, żeby pierwsze zdanie nie zmyślało oferty ani nie mówiło „słuchaj".
      system: `Piszesz JEDNĄ pierwszą wypowiedź klienta w treningowej rozmowie sprzedażowej, po polsku, 2-3 krótkie zdania, mówione, naturalne, bez cudzysłowów i bez didaskaliów. Klient to typ ${E.POSTACIE[postac].krotko} (${E.POSTACIE[postac].opis}). ${rejestr} Etap relacji: ${E.ETAPY[etapId].nazwa}: ${ETAPY_BRUNO_PL[etapId]} Mówisz TYLKO o tym, co jest w opisie oferty; nie wymyślasz innych produktów ani cen. Zwróć tylko tekst wypowiedzi.${plecGlosu(konfig.glos) === "k" ? " Klientka jest kobietą: mówi o sobie w rodzaju żeńskim (przeczytałam, zdecydowałam)." : ""}`,
      messages: [
        {
          role: "user",
          content:
            (sytuacja ? `SYTUACJA TEJ ROZMOWY (nadrzędna, trzymaj się faktów): ${sytuacja}\n\n` : "") +
            (tryb === "zywo"
              ? `Sytuacja: spotkanie 1:1 na żywo. Klient zna ofertę: ${produkt}. Zaczyna rozmowę: krótko podsumowuje własnymi słowami, co wie o ofercie, i OD RAZU podnosi obiekcję: „${obiekcja ?? "mam wątpliwości co do ceny"}”.`
              : `Sytuacja: spotkanie online tuż po prezentacji handlowca. Klient widział prezentację oferty: ${produkt}. Zaczyna: podsumowuje, co zrozumiał („jeśli dobrze rozumiem…”), i podnosi obiekcję albo trudne pytanie: „${obiekcja ?? "czy to na pewno dla nas"}”.`),
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
