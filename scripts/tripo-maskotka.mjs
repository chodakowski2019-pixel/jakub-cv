#!/usr/bin/env node
// Maskotki Bruno AI z Tripo (text-to-3D). Klucz API w pliku ~/.tripo-key
// (Tripo Console → API Keys), nigdy w repo. Wynik: .glb + render .webp/.png
// w Moje-Życie/Biznes/Projekty/SalesAI/grafiki/maskotki/.
//
//   node scripts/tripo-maskotka.mjs                 # 3 koncepty z listy niżej
//   node scripts/tripo-maskotka.mjs --tylko kula     # jeden koncept
//   node scripts/tripo-maskotka.mjs --prompt "..."   # własny opis, nazwa „wlasny"
//
// Koszt (cennik Tripo v3.1): text-to-3D 10 kredytów bez tekstury, 20 ze
// standardową, 30 z dokładną. Darmowy plan: 300 kredytów/mc.

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const BAZA = "https://openapi.tripo3d.ai/v3";
const MODEL = "v3.1-20260211";
const CEL = path.join(os.homedir(), "Moje-Życie/Biznes/Projekty/SalesAI/grafiki/maskotki");

// Wspólny trzon: okrągła, włochata postać ze słuchawkami call center (Bruno dzwoni).
const TRZON =
  "stylized 3D mascot character, round fluffy furry creature, big expressive eyes with confident eyebrows, small smirk, wearing a call-center headset with microphone, full body, symmetrical, clean silhouette, Pixar-style soft fur, studio lighting, no text, no background";

export const KONCEPTY = {
  kula: {
    opis: "Włochata kula, pomarańczowo-koralowa, krótkie nóżki, pewna siebie. Najbardziej uniwersalna.",
    prompt: `${TRZON}, warm orange coral fur, tiny feet, no arms, slightly tilted head, friendly but sharp`,
  },
  trener: {
    opis: "Włochata kula z małymi rękami, zegarek i krawat: trener/sparing-partner, B2B.",
    prompt: `${TRZON}, charcoal grey fur with orange accent, short arms, slim orange tie, small wristwatch, posture of a coach holding a clipboard`,
  },
  monster: {
    opis: "Ugly-cute: włochata kula z małymi ząbkami i uszkami (styl Labubu/Gritty), więcej charakteru.",
    prompt: `${TRZON}, teal fur, two small rounded ears, tiny visible teeth in a cheeky grin, mischievous energy, ugly-cute toy style`,
  },
};

const arg = (n) => {
  const i = process.argv.indexOf(`--${n}`);
  return i === -1 ? null : process.argv[i + 1];
};

async function klucz() {
  try {
    return (await fs.readFile(path.join(os.homedir(), ".tripo-key"), "utf8")).trim();
  } catch {
    console.error("Brak ~/.tripo-key. Wklej klucz z Tripo Console (API Keys) do tego pliku i odpal ponownie.");
    process.exit(1);
  }
}

async function zadanie(H, prompt) {
  const r = await fetch(`${BAZA}/generation/text-to-model`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model: MODEL, texture: true, pbr: true }),
  });
  const d = await r.json();
  if (!r.ok || d.code !== 0) throw new Error(`Tripo ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return d.data.task_id;
}

async function czekaj(H, id) {
  for (;;) {
    const d = await (await fetch(`${BAZA}/tasks/${id}`, { headers: H })).json();
    const t = d.data ?? {};
    process.stdout.write(`\r  ${id}: ${t.status} ${t.progress ?? 0}%   `);
    if (t.status === "success") {
      process.stdout.write("\n");
      return t.output;
    }
    if (["failed", "cancelled", "banned", "expired"].includes(t.status)) throw new Error(`zadanie ${id}: ${t.status}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

async function pobierz(url, plik) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`pobieranie ${r.status}`);
  await fs.writeFile(plik, Buffer.from(await r.arrayBuffer()));
}

const K = await klucz();
const H = { Authorization: `Bearer ${K}` };
await fs.mkdir(CEL, { recursive: true });

const wlasny = arg("prompt");
const tylko = arg("tylko");
const lista = wlasny ? [["wlasny", { opis: "własny opis", prompt: wlasny }]] : Object.entries(KONCEPTY).filter(([n]) => !tylko || n === tylko);
if (!lista.length) {
  console.error(`Nie ma konceptu „${tylko}". Dostępne: ${Object.keys(KONCEPTY).join(", ")}`);
  process.exit(1);
}

const znacznik = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const wyniki = [];
for (const [nazwa, k] of lista) {
  console.log(`\n${nazwa}: ${k.opis}`);
  const id = await zadanie(H, k.prompt);
  const out = await czekaj(H, id);
  const baza = path.join(CEL, `${nazwa}-${znacznik}`);
  const pliki = [];
  if (out?.model_url) {
    await pobierz(out.model_url, `${baza}.glb`);
    pliki.push(`${baza}.glb`);
  }
  if (out?.rendered_image_url) {
    const ext = out.rendered_image_url.split("?")[0].match(/\.(webp|png|jpg)$/i)?.[1] ?? "webp";
    await pobierz(out.rendered_image_url, `${baza}.${ext}`);
    pliki.push(`${baza}.${ext}`);
  }
  wyniki.push({ nazwa, id, pliki });
  console.log(`  zapisane: ${pliki.map((p) => path.basename(p)).join(", ")}`);
}
await fs.writeFile(path.join(CEL, `log-${znacznik}.json`), JSON.stringify({ model: MODEL, wyniki, prompty: Object.fromEntries(lista) }, null, 2));
console.log(`\nGotowe: ${CEL}`);
