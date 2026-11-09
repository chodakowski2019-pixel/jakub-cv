#!/usr/bin/env node
// Lista firm do telefonów (sprzedaz/LISTA-TELEFONY-2026-11-09.csv) → CRM Bruno, firma jakub-chodakowski.
// Ponowne uruchomienie nie dubluje (firma_id + zrodlo + zewn_id = domena).
//   node --env-file=.env.local scripts/bruno-telefony-do-crm.mjs
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createClient } from "@supabase/supabase-js";

const FIRMA_ID = "jakub-chodakowski";
const HANDLOWIEC = "jakub@salesbruno.com";
const ZRODLO = "telefony-2026-11-09";
const PLIK = `${homedir()}/Moje-Życie/Biznes/Projekty/SalesAI/sprzedaz/LISTA-TELEFONY-2026-11-09.csv`;

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function csv(tekst) {
  const wiersze = [];
  let pole = "", wiersz = [], wCudz = false;
  for (let i = 0; i < tekst.length; i++) {
    const z = tekst[i];
    if (wCudz) {
      if (z === '"' && tekst[i + 1] === '"') { pole += '"'; i++; }
      else if (z === '"') wCudz = false;
      else pole += z;
    } else if (z === '"') wCudz = true;
    else if (z === ",") { wiersz.push(pole); pole = ""; }
    else if (z === "\n") { wiersz.push(pole); wiersze.push(wiersz); wiersz = []; pole = ""; }
    else if (z !== "\r") pole += z;
  }
  if (pole || wiersz.length) { wiersz.push(pole); wiersze.push(wiersz); }
  const [nagl, ...reszta] = wiersze;
  return reszta.filter((w) => w.length > 1).map((w) => Object.fromEntries(nagl.map((n, i) => [n, w[i] ?? ""])));
}

const lista = csv(readFileSync(PLIK, "utf8")).filter((f) => f.telefon);

const { data: etapy, error: e0 } = await sb.from("bruno_crm_etapy").select("id, nazwa, kolejnosc").eq("firma_id", FIRMA_ID).order("kolejnosc");
if (e0) throw e0;
if (!etapy?.length) throw new Error("Firma nie ma etapów w bruno_crm_etapy");
const etap = etapy[0];

const { data: sa, error: e1 } = await sb.from("bruno_klienci").select("zewn_id").eq("firma_id", FIRMA_ID).eq("zrodlo", ZRODLO);
if (e1) throw e1;
const juz = new Set((sa ?? []).map((k) => k.zewn_id));
// ta sama domena 2× na liście (2 spółki jednej firmy) = 1 klient
const nowe = lista.filter((f) => !juz.has(f.www) && !juz.add(f.www).has(null));

const wiersze = nowe.map((f) => ({
  firma_id: FIRMA_ID,
  handlowiec: HANDLOWIEC,
  imie_nazwisko: (f.wlasciciel || f.firma).slice(0, 160),
  firma: f.firma.slice(0, 160),
  telefon: f.komorka || f.telefon,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? f.email : null,
  etap_id: etap.id,
  wartosc: 0,
  zrodlo: ZRODLO,
  zewn_id: f.www,
}));

let dodano = 0;
if (wiersze.length) {
  const { data: wst, error: e2 } = await sb.from("bruno_klienci").insert(wiersze).select("id, zewn_id");
  if (e2) throw e2;
  dodano = wst.length;
  const poDomenie = new Map(nowe.map((f) => [f.www, f]));
  const notatki = wst.map((k) => {
    const f = poDomenie.get(k.zewn_id);
    const czesci = [
      `Branża: ${f.branza}`,
      f.miasto && `Miasto: ${f.miasto}`,
      `Strona: ${f.www}`,
      f.szuka && `Szukają: ${f.szuka} (ogłoszeń: ${f.ofert})`,
      f.komorka && f.telefon !== f.komorka && `Numer firmy: ${f.telefon}`,
      f.inne_numery && `Inne numery: ${f.inne_numery}`,
      "Lista telefonów 9.11. Właściciel i liczba handlowców do ustalenia w rozmowie.",
    ].filter(Boolean);
    return { firma_id: FIRMA_ID, klient_id: k.id, typ: "notatka", tekst: czesci.join("\n"), autor: HANDLOWIEC, bruno: false, zrodlo: ZRODLO, zewn_id: `n-${k.zewn_id}` };
  });
  const { error: e3 } = await sb.from("bruno_crm_zdarzenia").insert(notatki);
  if (e3) throw e3;
}

const { count } = await sb.from("bruno_klienci").select("id", { count: "exact", head: true }).eq("firma_id", FIRMA_ID);
console.log(`etap: ${etap.nazwa} · na liście: ${lista.length} · już było: ${lista.length - nowe.length} · dodano: ${dodano} · klientów w CRM razem: ${count}`);
