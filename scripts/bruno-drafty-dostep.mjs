#!/usr/bin/env node
// Drafty z dostępem do Bruno AI dla testerów. TYLKO drafty, nic nie wysyła.
// Nadawca: hello@jakubchodakowski.com (credentials-jch.json w ~/.gmail-mcp).
// Wygląd = wspólny szablon lib/bruno/szablon-mail.mjs (ten sam, co maile
// wychodzące z panelu), więc draft i mail z aplikacji wyglądają identycznie.
// Kod logowania podajesz w wywołaniu, żeby nie leżał w repo.
//
//   node scripts/bruno-drafty-dostep.mjs --kto aleksandra --kod 673437 --sucho
//   node scripts/bruno-drafty-dostep.mjs --kto aleksandra --kod 673437
//   node scripts/bruno-drafty-dostep.mjs --kto jakub --kod 123456 --email dj_...@...

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  akapit,
  kopertaBruno,
  kroki,
  przycisk,
  stopkaJakub,
  tabelaDostepu,
  tabelaParami,
  LINK_PANELU,
} from "../lib/bruno/szablon-mail.mjs";

const GMAIL_DIR = path.join(os.homedir(), ".gmail-mcp");
const CREDENTIALS = process.env.GMAIL_CREDENTIALS || "credentials-jch.json";
const NADAWCA = (process.env.NADAWCA_EMAIL || "hello@jakubchodakowski.com").trim();
const FROM = `Jakub Chodakowski <${NADAWCA}>`;
const ETYKIETA = "bruno-dostep";
const LINK = LINK_PANELU;

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i === -1 ? d : process.argv[i + 1];
};
const KTO = (arg("kto", "") || "").toLowerCase();
const KOD = (arg("kod", "") || "").replace(/\D/g, "");
const SUCHO = process.argv.includes("--sucho");
const KASUJ = arg("kasuj", ""); // id starego draftu do skasowania (podmiana treści)
const PODGLAD = arg("podglad", ""); // ścieżka pliku .html do zapisania zamiast wysyłki

// ── testerzy ────────────────────────────────────────────────────────────
// Układ treści = wersja USER_001 wysłana 2.10 (najlepsza: mail do Kariny):
// jedno zdanie powitania ze strzałką, tabelka dostępu, warunki, przycisk,
// ponumerowane kroki, „Pozdrawiam", stopka. Bez akapitów o logowaniu.
const FILM = "Po zalogowaniu włączy się krótki film, który oprowadza po panelu.";
const OSOBY = {
  aleksandra: {
    email: arg("email", "a.kempinska@quadrivium.pro"),
    powitanie: "Dzień dobry Pani Aleksandro, poniżej znajdują się dane dostępu ⤵️",
    kroki: [
      "Proszę otworzyć stronę w Chrome i założyć słuchawki.",
      'Przed pierwszą rozmową proszę wejść w „Dostosuj Bruno" i wpisać, kim jest Wasz klient i jakie obiekcje najczęściej słyszą Pani handlowcy. Na tym Bruno buduje rozmowę.',
      FILM,
    ],
  },
  karina: {
    email: arg("email", "karina.chowaniak@gmail.com"),
    powitanie: "Cześć Karina, poniżej znajdziesz dane dostępu ⤵️",
    kroki: [
      "Otwórz stronę w Chrome i załóż słuchawki.",
      'Przed pierwszą rozmową wejdź w „Dostosuj Bruno" i wpisz, co sprzedajesz, kim jest klient i jakie obiekcje najczęściej słyszysz. Bez tego Bruno nie wie, kogo udawać.',
      FILM,
    ],
  },
  jakub: {
    email: arg("email", "dj_qb@wp.pl"),
    powitanie: "Cześć Jakub, poniżej znajdziesz dane dostępu ⤵️",
    kroki: [
      "Otwórz stronę w Chrome i załóż słuchawki.",
      'W „Dostosuj Bruno" wpisałem już to, co podałeś w ankiecie: kontrakty na energię, obiekcje i Twój przebieg rozmowy. Zajrzyj tam i popraw, jeśli czegoś brakuje.',
      FILM,
    ],
  },
};

const o = OSOBY[KTO];
if (!o) {
  console.error(`Podaj --kto: ${Object.keys(OSOBY).join(", ")}`);
  process.exit(1);
}
if (!o.email) {
  console.error(`Brak adresu e-mail dla "${KTO}". Dopisz --email adres@domena.pl`);
  process.exit(1);
}
if (KOD.length !== 6) {
  console.error("Podaj --kod jako 6 cyfr (ten z bruno-zaloz-konta.mjs).");
  process.exit(1);
}

// ── treść ───────────────────────────────────────────────────────────────
const TEMAT = arg("temat", "Twój dostęp do Bruno AI, trener sprzedaży");
const WARUNKI = [
  ["Dostęp", "7 dni od pierwszego logowania"],
  ["Rozmowy", "3 dziennie po 3 minuty"],
  ["Fiszki", "5 dziennie"],
];

const html = kopertaBruno({
  naglowek: "Twój dostęp jest gotowy",
  tresc: [
    akapit(o.powitanie),
    tabelaDostepu({ link: LINK, login: o.email, kod: KOD }),
    tabelaParami(WARUNKI),
    przycisk({ tekst: "Zaloguj się", link: LINK }),
    kroki(o.kroki),
    akapit("Pozdrawiam"),
  ].join("\n"),
  stopka: stopkaJakub(),
});

const text = `${o.powitanie}

Strona: ${LINK}
Login: ${o.email}
Kod logowania: ${KOD}

${WARUNKI.map(([a, b]) => `${a}: ${b}`).join("\n")}

${o.kroki.map((t, i) => `${i + 1}. ${t}`).join("\n\n")}

Pozdrawiam

Jakub Chodakowski
Bruno AI`;

if (PODGLAD) {
  await fs.writeFile(PODGLAD, html, "utf8");
  console.log(`podgląd HTML: ${PODGLAD}`);
  process.exit(0);
}
if (SUCHO) {
  console.log(`=== draft do ${o.email} | ${TEMAT} ===\n${text}`);
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
const b64url = (s) =>
  Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const granica = "granica_bruno_" + Buffer.from(o.email).toString("hex").slice(0, 12);
const mime = [
  `From: ${FROM}`,
  `To: ${o.email}`,
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

if (KASUJ) {
  const rk = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${KASUJ}`, { method: "DELETE", headers: H });
  console.log(rk.ok ? `skasowany stary draft ${KASUJ}` : `nie udało się skasować ${KASUJ}: ${rk.status}`);
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
console.log(`draft do ${o.email} na koncie ${prof.emailAddress}, etykieta "${ETYKIETA}", id ${d.id}`);
