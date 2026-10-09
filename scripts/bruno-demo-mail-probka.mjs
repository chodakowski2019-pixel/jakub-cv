#!/usr/bin/env node
// Próbka maila po umówieniu rozmowy z demo (szablon lib/bruno/mail-demo.ts), wysyłana
// z hello@jakubchodakowski.com przez Gmail API na adres USER_001. Ikona kalendarza
// w załączniku inline (cid), bo /email/kalendarz.png jest na serwerze dopiero po deployu.
//
//   node scripts/bruno-demo-mail-probka.mjs --do chodakowski2019@gmail.com [--pl]

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { mailPotwierdzenieDemo } from "../lib/bruno/mail-demo.ts";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i === -1 ? d : process.argv[i + 1];
};
const DO = arg("do", "chodakowski2019@gmail.com");
const PL = process.argv.includes("--pl");
const GMAIL_DIR = path.join(os.homedir(), ".gmail-mcp");
const NADAWCA = "hello@jakubchodakowski.com";

// Przykładowy termin: najbliższy poniedziałek 13:00 czasu UK (12:00 UTC w październiku, BST).
const start = new Date("2026-10-19T12:00:00.000Z").toISOString();
const m = mailPotwierdzenieDemo({ imie: "James", start, jezyk: PL ? "pl" : "en", link: null, ikonaKalendarza: "cid:kalendarz" });

const ics = [
  "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bruno AI//Demo//EN", "METHOD:REQUEST", "BEGIN:VEVENT",
  "UID:probka-bruno-demo@jakubchodakowski.com",
  `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
  "DTSTART:20261019T120000Z", "DTEND:20261019T123000Z",
  `SUMMARY:${m.tytulKal}`, "ORGANIZER;CN=Jakub Chodakowski:mailto:hello@jakubchodakowski.com",
  `ATTENDEE;CN=${DO};RSVP=TRUE:mailto:${DO}`, "END:VEVENT", "END:VCALENDAR",
].join("\r\n");

const ikona = await fs.readFile(path.resolve("public/email/kalendarz.png"));
const b64 = (b) => Buffer.from(b).toString("base64").replace(/(.{76})/g, "$1\r\n");
const naglowek = (s) => `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
const G1 = "mieszane_bruno", G2 = "alternatywa_bruno", G3 = "powiazane_bruno";
const mime = [
  `From: Jakub Chodakowski <${NADAWCA}>`,
  `To: ${DO}`,
  `Reply-To: ${NADAWCA}`,
  `Subject: ${naglowek(`[PRÓBKA] ${m.temat}`)}`,
  "MIME-Version: 1.0",
  `Content-Type: multipart/mixed; boundary="${G1}"`,
  "",
  `--${G1}`,
  `Content-Type: multipart/alternative; boundary="${G2}"`,
  "",
  `--${G2}`,
  'Content-Type: text/plain; charset="UTF-8"',
  "Content-Transfer-Encoding: base64",
  "",
  b64(m.text),
  `--${G2}`,
  `Content-Type: multipart/related; boundary="${G3}"`,
  "",
  `--${G3}`,
  'Content-Type: text/html; charset="UTF-8"',
  "Content-Transfer-Encoding: base64",
  "",
  b64(m.html),
  `--${G3}`,
  "Content-Type: image/png",
  "Content-Transfer-Encoding: base64",
  "Content-ID: <kalendarz>",
  'Content-Disposition: inline; filename="kalendarz.png"',
  "",
  b64(ikona),
  `--${G3}--`,
  `--${G2}--`,
  `--${G1}`,
  'Content-Type: text/calendar; charset="UTF-8"; method=REQUEST; name="bruno-demo.ics"',
  "Content-Transfer-Encoding: base64",
  'Content-Disposition: attachment; filename="bruno-demo.ics"',
  "",
  b64(ics),
  `--${G1}--`,
  "",
].join("\r\n");

const keys = JSON.parse(await fs.readFile(path.join(GMAIL_DIR, "gcp-oauth.keys.json"), "utf8"));
const k = keys.installed ?? keys.web ?? keys;
const cred = JSON.parse(await fs.readFile(path.join(GMAIL_DIR, "credentials-jch.json"), "utf8"));
const tok = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: k.client_id, client_secret: k.client_secret, refresh_token: cred.refresh_token ?? cred.refreshToken, grant_type: "refresh_token" }),
});
if (!tok.ok) throw new Error(await tok.text());
const { access_token } = await tok.json();
const H = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };
const prof = await (await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: H })).json();
if ((prof.emailAddress ?? "").toLowerCase() !== NADAWCA) throw new Error(`Konto ${prof.emailAddress}, a nadawca ma być ${NADAWCA}.`);
const raw = Buffer.from(mime).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { method: "POST", headers: H, body: JSON.stringify({ raw }) });
console.log(r.ok ? `wysłane z ${NADAWCA} do ${DO}: ${m.temat}` : `błąd ${r.status}: ${(await r.text()).slice(0, 300)}`);
