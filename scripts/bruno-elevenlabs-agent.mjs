#!/usr/bin/env node
// Zakłada (albo aktualizuje) agenta „Bruno AI" w ElevenLabs i dodaje 4 polskie
// męskie głosy do biblioteki konta. Wymaga klucza z uprawnieniami convai_write
// i voices_write. Użycie:
//   ELEVENLABS_API_KEY=... node scripts/bruno-elevenlabs-agent.mjs [agent_id_do_aktualizacji]
// Wynik: agent_id do wpisania w ELEVENLABS_AGENT_ID (Vercel + .env.local).

const K = process.env.ELEVENLABS_API_KEY;
if (!K) {
  console.error("Brak ELEVENLABS_API_KEY");
  process.exit(1);
}
const BAZA = "https://api.elevenlabs.io";
const H = { "xi-api-key": K, "Content-Type": "application/json" };

// Głosy z biblioteki (shared): [voice_id, public_owner_id, nazwa w koncie]
// Jeden głos (USER_001 2.10): Adam „Serious, Rich, Smoky", polski, męski.
const GLOSY = [["o11yegU3CL24TZ1qcm6b", null, "Bruno B (Adam approachable)"]];

async function dodajGlosy() {
  const moje = await (await fetch(`${BAZA}/v2/voices?page_size=100`, { headers: H })).json();
  const mam = new Set((moje.voices ?? []).map((v) => v.voice_id));
  const shared = await (await fetch(`${BAZA}/v1/shared-voices?language=pl&gender=male&page_size=100&sort=cloned_by_count`, { headers: H })).json();
  const wlasciciel = new Map((shared.voices ?? []).map((v) => [v.voice_id, v.public_owner_id]));
  for (const [id, , nazwa] of GLOSY) {
    if (mam.has(id)) {
      console.log("głos już w koncie:", nazwa);
      continue;
    }
    const owner = wlasciciel.get(id);
    if (!owner) {
      console.log("nie znaleziono w bibliotece:", id);
      continue;
    }
    const r = await fetch(`${BAZA}/v1/voices/add/${owner}/${id}`, { method: "POST", headers: H, body: JSON.stringify({ new_name: nazwa }) });
    console.log("dodaję głos", nazwa, r.status, (await r.text()).slice(0, 120));
  }
}

const KONFIG = {
  name: "Bruno AI",
  conversation_config: {
    agent: {
      language: "en",
      first_message: "Halo, słucham?",
      disable_first_message_interruptions: true,
      prompt: {
        // Prompt właściwy przychodzi per rozmowa jako override z serwera Bruno (instrukcjeKlienta).
        prompt: "Jesteś Bruno, klient w treningowej rozmowie sprzedażowej. Mówisz po polsku, krótko, jak człowiek. Nigdy nie mówisz, że jesteś AI.",
        llm: "gpt-4o",
        temperature: 0.7,
        max_tokens: 220,
      },
    },
    tts: {
      // multilingual_v2 = naturalniej niż flash (+0,3 s opóźnienia); stability 0.35 / style 0.3 = więcej emocji (USER_001 2.10).
      model_id: "eleven_multilingual_v2",
      voice_id: "iP95p4xoKVk53GoZ742B",
      stability: 0.35,
      similarity_boost: 0.8,
      style: 0.3,
      speed: 1.0,
    },
    asr: { quality: "high", provider: "scribe_realtime", user_input_audio_format: "pcm_16000", keywords: [] },
    turn: { turn_timeout: 8.0, mode: "turn", turn_eagerness: "normal" },
    // 270 = 180 s rozmowy + 45 s dogrywki + zapas (6.10).
    conversation: { max_duration_seconds: 270, client_events: ["audio", "interruption", "user_transcript", "agent_response", "agent_response_correction"] },
  },
  platform_settings: {
    overrides: {
      conversation_config_override: {
        agent: { first_message: true, language: true, prompt: { prompt: true } },
        tts: { voice_id: true, stability: true, speed: true, similarity_boost: true },
      },
    },
    // 1 dzień (USER_001 9.10, było 30 od 2.10): pełny PATCH tym skryptem nie może cofnąć retencji na -1.
    privacy: { record_voice: true, retention_days: 1 },
  },
};

async function agent(idDoAktualizacji) {
  if (idDoAktualizacji) {
    const r = await fetch(`${BAZA}/v1/convai/agents/${idDoAktualizacji}`, { method: "PATCH", headers: H, body: JSON.stringify(KONFIG) });
    console.log("aktualizacja agenta", r.status, (await r.text()).slice(0, 200));
    return idDoAktualizacji;
  }
  const r = await fetch(`${BAZA}/v1/convai/agents/create`, { method: "POST", headers: H, body: JSON.stringify(KONFIG) });
  const d = await r.json();
  console.log("tworzenie agenta", r.status, JSON.stringify(d).slice(0, 300));
  return d.agent_id;
}

await dodajGlosy();
const id = await agent(process.argv[2]);
console.log("\nELEVENLABS_AGENT_ID=" + id);
