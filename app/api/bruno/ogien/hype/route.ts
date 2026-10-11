import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pelnyDostep, pobierzKonto } from "@/lib/bruno/db";
import { BAZA_EL, glosElevenlabs } from "@/lib/bruno/elevenlabs";
import { jezykLubDomyslny } from "@/lib/bruno/domeny";
import { tDla } from "@/lib/bruno/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

// „Nakręć mnie" (9.10, USER_001: „ktoś nas motywował, była energia, byliśmy na pełnej").
// Haiku pisze 3 zdania hype pod imię, cel i najsłabszy punkt, ElevenLabs czyta
// głosem Bruno. Wraca mp3. Koszt: ok. 300 znaków = ok. 300 kredytów ElevenLabs.
// Limit 5 dziennie na konto liczony po stronie klienta (localStorage) + 350 znaków tu.

const MAX_ZNAKOW = 350;

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const konto = await pobierzKonto(email);
  // 11.10: konto PL = prompt PL (z fd7de52) i polski głos Bruno.
  const jezyk = jezykLubDomyslny(konto?.jezyk);
  const pl = jezyk === "pl";
  const t = tDla(jezyk);
  if (!pelnyDostep(konto)) return NextResponse.json({ ok: false, blad: t("Fire Up is part of full access.", "Ogień jest w pełnym dostępie.") }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY || !process.env.ELEVENLABS_API_KEY) return NextResponse.json({ ok: false, blad: t("Keys are missing on the server.", "Brak kluczy na serwerze.") }, { status: 500 });
  const b = await req.json().catch(() => ({}));
  const imie = konto?.imie?.trim() || (pl ? "mistrzu" : "champ");
  const cel = String(b.cel ?? "").slice(0, 200);
  const slabe = String(b.najslabsze ?? "").slice(0, 60);
  const cytat = String(b.cytat ?? "").slice(0, 200);

  let tekst = "";
  try {
    const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const odp = await klient.messages.create({
      model: process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: pl
        ? "Jesteś Bruno, trener sprzedaży, który nakręca handlowca na 60 sekund przed prawdziwym telefonem. Mówisz po polsku, per „ty”, jak kumpel z zespołu, który wierzy w tego człowieka: energia, krótkie zdania, żadnego moralizowania, żadnego „pamiętaj, że”. Zero angielskich słów. Zero wulgaryzmów. Maksymalnie 3 zdania, razem do 300 znaków. Zwracasz TYLKO tekst do przeczytania na głos, bez cudzysłowów i didaskaliów."
        : "You are Bruno, a sales coach who fires up a rep 60 seconds before a real call. Write in plain American English, address the rep as \"you\", like a teammate who believes in this person: energy, short sentences, no lecturing, no \"remember that\". No profanity. Max 3 sentences, 300 characters total. Return ONLY the text to be read out loud, with no quotes and no stage directions.",
      messages: [
        {
          role: "user",
          content: pl
            ? `Handlowiec: ${imie}. Cel tej rozmowy: ${cel || "umówić następny krok z datą"}. Najsłabszy punkt z ostatnich rozmów: ${slabe || "zamknięcie"}. ${cytat ? `Możesz nawiązać do zdania: „${cytat}”.` : ""} Napisz hype: 1 zdanie o tym, że jest gotowy, 1 zdanie z konkretem na tę rozmowę (najsłabszy punkt), 1 zdanie na odpalenie.`
            : `Rep: ${imie}. Goal of this call: ${cel || "book the next step with a date"}. Weakest spot from recent calls: ${slabe || "closing"}. ${cytat ? `You can refer to this line: \"${cytat}\".` : ""} Write the hype: 1 sentence that they are ready, 1 sentence with one specific tip for this call (the weakest spot), 1 sentence to get them going.`,
        },
      ],
    });
    tekst = odp.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim()
      .slice(0, MAX_ZNAKOW);
  } catch (e) {
    console.error("[bruno hype] model", e);
  }
  if (tekst.length < 20 && pl) tekst = `${imie}, jesteś gotowy. Jedno pytanie otwarte na start, potem słuchasz. Na końcu prosisz o decyzję. Dzwoń.`;
  if (tekst.length < 20) tekst = `${imie}, you're ready. Start with one open question, then listen. At the end, ask for the decision. Make the call.`;

  try {
    const odp = await fetch(`${BAZA_EL}/v1/text-to-speech/${encodeURIComponent(glosElevenlabs("czerwony", jezyk))}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: tekst,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true },
      }),
    });
    if (!odp.ok) throw new Error(`ElevenLabs TTS ${odp.status}: ${(await odp.text()).slice(0, 200)}`);
    const audio = await odp.arrayBuffer();
    return new NextResponse(audio, { headers: { "Content-Type": "audio/mpeg", "X-Bruno-Tekst": encodeURIComponent(tekst), "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[bruno hype] tts", e);
    // Bez głosu: tekst do przeczytania na ekranie.
    return NextResponse.json({ ok: true, tekst, audio: false });
  }
}
