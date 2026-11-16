#!/usr/bin/env node
// 16.11 (USER_001): mail do handlowców z bazy giełdy: nowa zakładka „Rozmowa z AI”, 2 rozmowy po 3 min,
// obowiązkowa, 7 dni, nagrania widzą pracodawcy. Zwykły list jak mail weryfikacji (lib/bruno/praca/admin.ts).
// Wysyłka przez Gmail API ze skrzynki jakub@salesbruno.com (token ~/.gmail-mcp/credentials-salesbruno.json; lokalnie brak klucza Resend).
//   node --env-file=.env.local scripts/bruno-praca-rozmowa-ai-mail.mjs --test           → 1 mail na chodakowski2019@gmail.com
//   node --env-file=.env.local scripts/bruno-praca-rozmowa-ai-mail.mjs --lista          → kto dostanie (bez wysyłki)
//   node --env-file=.env.local scripts/bruno-praca-rozmowa-ai-mail.mjs --wyslij-wszystkim → handlowcy z profilem (tylko po „wyślij” USER_001)
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createClient } from "@supabase/supabase-js";

const TRYB = process.argv[2];
const TEST = "chodakowski2019@gmail.com";
const DNI = 7;
const termin = new Date(Date.now() + DNI * 86_400_000).toLocaleDateString("pl-PL", { day: "numeric", month: "long", timeZone: "Europe/Warsaw" });
export const TEMAT = "Rozmowa sprzedażowa z AI: masz 7 dni";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const html = (imie) => `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#141416">
<p>Dzień dobry${imie ? ` ${esc(imie)}` : ""},</p>
<p>w Twoim panelu na SalesBruno.pl jest nowa zakładka „Rozmowa z AI”. Przeprowadzisz w niej rozmowę sprzedażową z Bruno, który gra klienta z Twojej branży. Masz 2 podejścia, każde po 3 minuty.</p>
<p>Rozmowa jest obowiązkowa dla każdego handlowca w bazie. Masz na nią ${DNI} dni, do ${termin}.</p>
<p>Nagranie i ocenę rozmowy zobaczą pracodawcy, którzy szukają handlowca i odblokują Twój kontakt.</p>
<p>Zaloguj się: <a href="https://www.salesbruno.pl/login">www.salesbruno.pl/login</a></p>
<p>Pozdrawiam,<br/>Jakub Chodakowski</p>
</div>`;
const tekst = (imie) => `Dzień dobry${imie ? ` ${imie}` : ""},

w Twoim panelu na SalesBruno.pl jest nowa zakładka „Rozmowa z AI”. Przeprowadzisz w niej rozmowę sprzedażową z Bruno, który gra klienta z Twojej branży. Masz 2 podejścia, każde po 3 minuty.

Rozmowa jest obowiązkowa dla każdego handlowca w bazie. Masz na nią ${DNI} dni, do ${termin}.

Nagranie i ocenę rozmowy zobaczą pracodawcy, którzy szukają handlowca i odblokują Twój kontakt.

Zaloguj się: https://www.salesbruno.pl/login

Pozdrawiam,
Jakub Chodakowski`;

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function handlowcy() {
  const { data, error } = await sb.from("praca_profile_handlowcow").select("odpowiedzi,status,konto:praca_konta(email,imie,typ)");
  if (error) throw error;
  return data
    .filter((x) => x.konto?.typ === "kandydat" && x.status !== "odrzucony")
    .map((x) => ({ email: x.konto.email, imie: String(x.odpowiedzi?.imie || x.konto.imie || "").trim().split(/\s+/)[0] }));
}

const GMAIL_DIR = path.join(os.homedir(), ".gmail-mcp");
let token = null;
async function accessToken() {
  if (token) return token;
  const keys = JSON.parse(await fs.readFile(path.join(GMAIL_DIR, "gcp-oauth.keys.json"), "utf8"));
  const k = keys.installed ?? keys.web ?? keys;
  const cred = JSON.parse(await fs.readFile(path.join(GMAIL_DIR, "credentials-salesbruno.json"), "utf8"));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: k.client_id, client_secret: k.client_secret, refresh_token: cred.refresh_token ?? cred.refreshToken, grant_type: "refresh_token" }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (token = (await r.json()).access_token);
}
const b64 = (t) => Buffer.from(t, "utf8").toString("base64");
const naglowek = (t) => `=?UTF-8?B?${b64(t)}?=`;
async function wyslij(email, imie) {
  const granica = `b${Date.now().toString(36)}`;
  const surowy = [
    `From: ${naglowek("Jakub Chodakowski")} <jakub@salesbruno.com>`,
    `To: ${email}`,
    `Subject: ${naglowek(TEMAT)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${granica}"`,
    "",
    `--${granica}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(tekst(imie)),
    `--${granica}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(html(imie)),
    `--${granica}--`,
  ].join("\r\n");
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(surowy, "utf8").toString("base64url") }),
  });
  if (!r.ok) throw new Error(`${email}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).id;
}

if (TRYB === "--test") {
  console.log("test →", TEST, await wyslij(TEST, "Jakub"));
} else if (TRYB === "--lista") {
  const l = await handlowcy();
  console.log(`${l.length} handlowców:`);
  for (const h of l) console.log(`  ${h.imie || "(bez imienia)"} <${h.email}>`);
} else if (TRYB === "--wyslij-wszystkim") {
  for (const h of await handlowcy()) {
    console.log(h.email, await wyslij(h.email, h.imie));
    await new Promise((r) => setTimeout(r, 600));
  }
} else {
  console.error("użycie: --test | --lista | --wyslij-wszystkim");
  process.exit(1);
}
