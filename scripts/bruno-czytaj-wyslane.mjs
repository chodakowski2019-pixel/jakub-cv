#!/usr/bin/env node
// Czyta wysłane maile z hello@jakubchodakowski.com i zapisuje ich HTML do plików.
// Po to, żeby zobaczyć wersję po ręcznych poprawkach USER_001 w oknie Gmaila.
//
//   node scripts/bruno-czytaj-wyslane.mjs --szukaj "Bruno AI" --kat /tmp/x

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const GMAIL_DIR = path.join(os.homedir(), ".gmail-mcp");
const CREDENTIALS = process.env.GMAIL_CREDENTIALS || "credentials-jch.json";
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i === -1 ? d : process.argv[i + 1];
};
const SZUKAJ = arg("szukaj", "in:sent Bruno");
const KAT = arg("kat", "/tmp");

async function accessToken() {
  const keys = JSON.parse(await fs.readFile(path.join(GMAIL_DIR, "gcp-oauth.keys.json"), "utf8"));
  const k = keys.installed ?? keys.web ?? keys;
  const cred = JSON.parse(await fs.readFile(path.resolve(GMAIL_DIR, CREDENTIALS), "utf8"));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: k.client_id,
      client_secret: k.client_secret,
      refresh_token: cred.refresh_token ?? cred.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).access_token;
}

const token = await accessToken();
const H = { Authorization: `Bearer ${token}` };

const lista = await (
  await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(SZUKAJ)}&maxResults=20`,
    { headers: H },
  )
).json();
const msgs = lista.messages ?? [];
console.log(`znalezione: ${msgs.length}`);

function zbierzHtml(czesc, wynik = { html: "", text: "" }) {
  if (!czesc) return wynik;
  const dane = czesc.body?.data;
  if (dane) {
    const t = Buffer.from(dane.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    if (czesc.mimeType === "text/html") wynik.html += t;
    if (czesc.mimeType === "text/plain") wynik.text += t;
  }
  for (const p of czesc.parts ?? []) zbierzHtml(p, wynik);
  return wynik;
}

await fs.mkdir(KAT, { recursive: true });
for (const m of msgs) {
  const pelny = await (await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, { headers: H })).json();
  const nag = Object.fromEntries((pelny.payload?.headers ?? []).map((h) => [h.name.toLowerCase(), h.value]));
  const { html, text } = zbierzHtml(pelny.payload);
  const nazwa = (nag.to ?? m.id).replace(/[^a-z0-9]+/gi, "-").slice(0, 40);
  if (html) await fs.writeFile(path.join(KAT, `${nazwa}.html`), html, "utf8");
  if (text) await fs.writeFile(path.join(KAT, `${nazwa}.txt`), text, "utf8");
  console.log(`${nag.date} | do: ${nag.to} | ${nag.subject} | html ${html.length} zn.`);
}
