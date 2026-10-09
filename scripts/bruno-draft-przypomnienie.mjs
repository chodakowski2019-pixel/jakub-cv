#!/usr/bin/env node
// Draft przypomnienia „plan na dziś" dla konta Bruno (ten sam układ, co cron
// /api/bruno/przypomnienia → htmlPrzypomnienie w lib/bruno/mail.ts).
// TYLKO draft na hello@jakubchodakowski.com, etykieta bruno-dostep. Nic nie wysyła.
// Liczby (rozmowy dziś, tematy do powtórki, dni dostępu) czyta z bazy.
//
//   node --env-file=.env.local scripts/bruno-draft-przypomnienie.mjs --email a.kempinska@quadrivium.pro --sucho
//   node --env-file=.env.local scripts/bruno-draft-przypomnienie.mjs --email a.kempinska@quadrivium.pro

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createClient } from "@supabase/supabase-js";
import { akapit, kopertaBruno, przycisk, tabelaParami, LINK_PANELU } from "../lib/bruno/szablon-mail.mjs";

const ROZMOWA_SEKUND = 180;
const ROZMOW_DZIENNIE = 3;
const GMAIL_DIR = path.join(os.homedir(), ".gmail-mcp");
const CREDENTIALS = process.env.GMAIL_CREDENTIALS || "credentials-jch.json";
const NADAWCA = (process.env.NADAWCA_EMAIL || "hello@jakubchodakowski.com").trim();
const FROM = `Jakub Chodakowski <${NADAWCA}>`;
const ETYKIETA = "bruno-dostep";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i === -1 ? d : process.argv[i + 1];
};
const EMAIL = (arg("email", "") || "").trim().toLowerCase();
const SUCHO = process.argv.includes("--sucho");
if (!EMAIL) {
  console.error("Podaj --email adres konta.");
  process.exit(1);
}

// ── baza ────────────────────────────────────────────────────────────────
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: konto } = await sb.from("bruno_konta").select("*").eq("email", EMAIL).maybeSingle();
if (!konto) {
  console.error(`Brak konta ${EMAIL}`);
  process.exit(1);
}
const teraz = new Date();
const dzisOd = new Date(Date.UTC(teraz.getUTCFullYear(), teraz.getUTCMonth(), teraz.getUTCDate())).toISOString();
const { count: rozmowyDzis } = await sb
  .from("bruno_rozmowy")
  .select("id", { count: "exact", head: true })
  .eq("email", EMAIL)
  .gte("start", dzisOd);
const { count: kart } = await sb
  .from("bruno_karty")
  .select("id", { count: "exact", head: true })
  .eq("email", EMAIL)
  .lte("due", teraz.toISOString());
const dziennie = Number.isFinite(konto.rozmow_dziennie) && konto.rozmow_dziennie > 0 ? konto.rozmow_dziennie : ROZMOW_DZIENNIE;
const dniZostalo = konto.start_dostepu
  ? Math.max(0, Math.ceil((new Date(konto.start_dostepu).getTime() + konto.dni * 86_400_000 - Date.now()) / 86_400_000))
  : konto.dni;

// ── treść (= htmlPrzypomnienie) ─────────────────────────────────────────
const zostalo = Math.max(0, dziennie - (rozmowyDzis ?? 0));
const minuty = ROZMOWA_SEKUND / 60;
const minutaSlowo = (n) => (n === 1 ? "minuta" : n >= 2 && n <= 4 ? "minuty" : "minut");
const link = `${LINK_PANELU}/panel`;
const imie = konto.imie;
const TEMAT = (rozmowyDzis ?? 0) === 0 ? `Bruno czeka: ${dziennie} rozmowy po ${minuty} ${minutaSlowo(minuty)}` : `Bruno czeka: zostały ${zostalo} rozmowy`;
const wiersze = [
  ["Rozmowy", zostalo === 0 ? "zrobione" : `${zostalo} po ${minuty} ${minutaSlowo(minuty)}`],
  ["Do powtórki", kart ? `${kart} ${kart === 1 ? "temat" : "tematów"}` : "nic"],
  ["Dostęp", `${dniZostalo} ${dniZostalo === 1 ? "dzień" : "dni"}`],
];
const html = kopertaBruno({
  naglowek: zostalo === 0 ? "Plan na dziś zrobiony" : `${imie ? `${imie}, p` : "P"}lan na dziś`,
  tresc: [tabelaParami(wiersze), kart ? akapit("Bruno zacznie od najsłabszego tematu.") : "", przycisk({ tekst: "Rozmawiaj z Bruno", link })].join("\n"),
});
const text = `${imie ? `${imie}, p` : "P"}lan na dziś

${wiersze.map(([a, b]) => `${a}: ${b}`).join("\n")}
${kart ? "\nBruno zacznie od najsłabszego tematu.\n" : ""}
${link}

Jakub Chodakowski
Bruno AI`;

if (SUCHO) {
  console.log(`=== draft do ${EMAIL} | ${TEMAT} ===\n${text}`);
  process.exit(0);
}

// ── gmail ───────────────────────────────────────────────────────────────
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
const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const naglowek = (s) => `=?UTF-8?B?${b64(s)}?=`;
const b64url = (s) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const granica = "granica_bruno_" + Buffer.from(EMAIL).toString("hex").slice(0, 12);
const mime = [
  `From: ${FROM}`,
  `To: ${EMAIL}`,
  `Subject: ${naglowek(TEMAT)}`,
  "MIME-Version: 1.0",
  `Content-Type: multipart/alternative; boundary="${granica}"`,
  "",
  `--${granica}`,
  'Content-Type: text/plain; charset="UTF-8"',
  "Content-Transfer-Encoding: base64",
  "",
  b64(text),
  `--${granica}`,
  'Content-Type: text/html; charset="UTF-8"',
  "Content-Transfer-Encoding: base64",
  "",
  b64(html),
  `--${granica}--`,
  "",
].join("\r\n");

const token = await accessToken();
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const prof = await (await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: H })).json();
if ((prof.emailAddress ?? "").toLowerCase() !== NADAWCA.toLowerCase()) {
  throw new Error(`Zalogowane konto ${prof.emailAddress}, a nadawca ma być ${NADAWCA}. Zmień GMAIL_CREDENTIALS.`);
}
const etykiety = (await (await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels", { headers: H })).json()).labels ?? [];
let lid = etykiety.find((l) => l.name === ETYKIETA)?.id;
if (!lid) {
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels", {
    method: "POST",
    headers: H,
    body: JSON.stringify({ name: ETYKIETA, labelListVisibility: "labelShow", messageListVisibility: "show" }),
  });
  lid = (await r.json()).id;
}
const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
  method: "POST",
  headers: H,
  body: JSON.stringify({ message: { raw: b64url(mime) } }),
});
if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
const d = await r.json();
await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${d.message.id}/modify`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ addLabelIds: [lid] }),
});
console.log(`draft do ${EMAIL} na koncie ${prof.emailAddress}, etykieta "${ETYKIETA}", id ${d.id}, temat: ${TEMAT}`);
