// Dociąga nagrania rozmów z konta ElevenLabs do naszego kubełka (bruno-nagrania).
// To samo robi serwer po rozmowie i cron; ten skrypt jest do nadrobienia zaległości.
//
// Użycie (z katalogu repo):
//   node --env-file=.env.local scripts/bruno-dociagnij-nagrania.mjs
//
// Wymaga: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ELEVENLABS_API_KEY
// (klucz ElevenLabs można też podać z ~/.config/elevenlabs/api_key).

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const KUBELEK = "bruno-nagrania";

function kluczEl() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  try {
    return readFileSync(join(homedir(), ".config/elevenlabs/api_key"), "utf8").trim();
  } catch {
    return null;
  }
}

const url = process.env.SUPABASE_URL;
const serwis = process.env.SUPABASE_SERVICE_ROLE_KEY;
const el = kluczEl();
if (!url || !serwis) {
  console.error("Brak SUPABASE_URL albo SUPABASE_SERVICE_ROLE_KEY (uruchom z --env-file=.env.local).");
  process.exit(1);
}
if (!el) {
  console.error("Brak klucza ElevenLabs (ELEVENLABS_API_KEY albo ~/.config/elevenlabs/api_key).");
  process.exit(1);
}

const sb = createClient(url, serwis, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: rozmowy, error } = await sb
  .from("bruno_rozmowy")
  .select("id, email, start, sekundy, el_conversation_id")
  .is("nagranie_sciezka", null)
  .not("el_conversation_id", "is", null)
  .order("start", { ascending: false })
  .limit(100);
if (error) {
  console.error("Baza:", error.message);
  process.exit(1);
}
console.log(`Do dociągnięcia: ${rozmowy.length}`);

let ok = 0;
for (const r of rozmowy) {
  const odp = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(r.el_conversation_id)}/audio`, {
    headers: { "xi-api-key": el },
  });
  if (!odp.ok) {
    console.log(`✗ ${r.id} (${r.sekundy ?? "?"} s): ElevenLabs ${odp.status}`);
    continue;
  }
  const bajty = Buffer.from(await odp.arrayBuffer());
  const sciezka = `${String(r.email).replace(/[^\w.@-]+/g, "_")}/${r.id}.mp3`;
  const { error: bladWgrania } = await sb.storage.from(KUBELEK).upload(sciezka, bajty, { contentType: "audio/mpeg", upsert: true });
  if (bladWgrania) {
    console.log(`✗ ${r.id}: wgranie ${bladWgrania.message}`);
    continue;
  }
  const { error: bladZapisu } = await sb.from("bruno_rozmowy").update({ nagranie_sciezka: sciezka }).eq("id", r.id);
  if (bladZapisu) {
    console.log(`✗ ${r.id}: zapis ścieżki ${bladZapisu.message}`);
    continue;
  }
  ok += 1;
  console.log(`✓ ${r.id} (${r.sekundy ?? "?"} s) → ${sciezka}, ${(bajty.length / 1024).toFixed(0)} kB`);
}
console.log(`Gotowe: ${ok}/${rozmowy.length}`);
