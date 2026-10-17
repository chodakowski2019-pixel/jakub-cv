// 17.10 (USER_001): import ofert pracy dla handlowców w Polsce do portalu salesbruno.com/praca.
// Każda oferta wchodzi jako NIEAKTYWNA i NIEWIDOCZNA. Firma dostaje mail z prywatnym linkiem
// (/praca/<id>?k=<token>) i może ją aktywować za 50 zł/mc albo poprosić o usunięcie.
// Źródło: CSV z Adzuna API (SalesAI/oferty/adzuna-oferty-sales-*.csv). Oferty już zaimportowane
// zachowują id, token i status (import dopisuje tylko nowe).
// Użycie: node scripts/bruno-praca-import.mjs [plik.csv]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";
import { branza, odZaraz, poziom, tryb, umiejetnosci, umowa, wymiar } from "../lib/bruno/praca/cechy.mjs";

const CSVY = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(homedir(), "Moje-Życie/Biznes/Projekty/SalesAI/oferty/adzuna-oferty-sales-2026-10-09.csv")];
const WYJSCIE = path.join(import.meta.dirname, "..", "lib/bruno/praca/oferty.json");

// Handlowcy = sprzedaż przez rozmowę. Bez kas, sklepów, magazynów i zakupów.
const TAK = /handlow|przedstawiciel|account|business development|doradc|sprzeda|sales|telesprzeda|telemarket|key|opiekun klient|agent/i;
const NIE = /kasjer|magazyn|reklamac|zakup|kierowc|stacji paliw|w salonie|w sklepie|sklep|sprzedawca|ekspedient|kasa|merchandis|asystent|zleceniobior|sprzątan|pakow|marketing|logisty|projektant|monter|analyst|analityk|operations|operacj|fizjoterapeut|dentyst|wsparci\w* sprzeda|rozlicze|kelner|barista|recepcj|kucharz|księgow|programist|developer(?! business)|inżynier (?!sprzeda|ds\.? techniczno|techniczno)|technik\b|serwis|pielęgniar|lekarz|opiekun\w* (osób|dzieci|senior)|data|controller|hr\b|rekrut|praktyk|staż/i;
// Bez nazwy firmy nie ma do kogo napisać.
const BEZ_FIRMY = /^klient (portalu )?(praca|pracuj)\.pl$|^praca\.pl$|^pracuj\.pl$/i;

function wiersze(tekst) {
  const out = [];
  let w = [], pole = "", cudzy = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (cudzy) {
      if (c === '"' && tekst[i + 1] === '"') { pole += '"'; i++; }
      else if (c === '"') cudzy = false;
      else pole += c;
    } else if (c === '"') cudzy = true;
    else if (c === ",") { w.push(pole); pole = ""; }
    else if (c === "\n") { w.push(pole); out.push(w); w = []; pole = ""; }
    else if (c !== "\r") pole += c;
  }
  if (pole || w.length) { w.push(pole); out.push(w); }
  return out;
}

const slug = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60).replace(/-$/, "");

// „Przedstawiciel handlowy / Przedstawicielka handlowa” → pierwsza forma, krócej na liście.
const krotkiTytul = (t) => t.split(/\s*\/\s*|\s+[–|-]\s+|\s*\(/)[0].trim() || t;

const stare = existsSync(WYJSCIE) ? JSON.parse(readFileSync(WYJSCIE, "utf8")) : [];
const poKluczu = new Map(stare.map((o) => [o.klucz, o]));
const wynik = [...stare];
let nowe = 0;

for (const CSV of CSVY) {
const [naglowek, ...dane] = wiersze(readFileSync(CSV, "utf8")).filter((w) => w.length > 1);
const kol = Object.fromEntries(naglowek.map((n, i) => [n, i]));
for (const w of dane) {
  const g = (k) => (w[kol[k]] ?? "").trim();
  if (g("kraj") !== "Polska") continue;
  const stanowisko = g("stanowisko"), firma = g("firma");
  if (!firma || BEZ_FIRMY.test(firma) || !TAK.test(stanowisko) || NIE.test(stanowisko)) continue;
  const czesci = g("region").split("/").map((x) => x.trim()).filter(Boolean);
  const miasto = czesci.length >= 3 ? czesci.at(-1) : "";
  const wojewodztwo = czesci.length >= 2 ? czesci[1] : "";
  const klucz = createHash("sha1").update(`${stanowisko}|${firma}|${miasto}`.toLowerCase()).digest("hex").slice(0, 10);
  if (poKluczu.has(klucz)) continue;
  const o = {
    id: `${slug(krotkiTytul(stanowisko))}-${slug(firma).slice(0, 24).replace(/-$/, "")}-${klucz.slice(0, 5)}`,
    klucz,
    status: "nieaktywna", // nieaktywna → aktywna (50 zł/mc) | usunieta
    stanowisko,
    firma,
    miasto,
    wojewodztwo,
    b2b: /b2b/i.test(stanowisko + g("opis_skrot")),
    pensjaMin: Number(g("pensja_min")) || null,
    pensjaMax: Number(g("pensja_max")) || null,
    adzunaCzas: g("umowa") || null, // kolumna „umowa” w CSV = contract_time z Adzuna (full_time / part_time)
    adzunaTyp: g("umowa_typ") || null, // contract_type z Adzuna (permanent / contract), od 17.10
    opis: g("opis_skrot"),
    dodano: g("data"),
    zrodlo: "Adzuna",
    zrodloUrl: g("url"),
    email: null, // kontakt do firmy, uzupełnia się przy kampanii
    // Sekcje jak na Pracuj.pl. Adzuna daje tylko skrót opisu, więc puste: wypełnia firma przy aktywacji.
    obowiazki: [],
    wymagania: [],
    mileWidziane: [],
    oferujemy: [],
    oFirmie: "",
    aplikuj: null, // e-mail albo link od firmy po aktywacji
  };
  poKluczu.set(klucz, o);
  wynik.push(o);
  nowe++;
}
}

// Cechy (filtry i pigułki) liczone na nowo dla wszystkich ofert, także już zaimportowanych.
const DZIEN = 86_400_000;
for (const o of wynik) {
  if ("umowa" in o && !("adzunaCzas" in o)) { o.adzunaCzas = o.umowa; }
  // 17.10: tytuły WIELKIMI LITERAMI → zwykły zapis („DORADCA KLIENTA” → „Doradca klienta”), skróty (B2B, KAM, OZE) zostają.
  if (o.stanowisko === o.stanowisko.toUpperCase() && /[A-ZĄĆĘŁŃÓŚŹŻ]{4,}/.test(o.stanowisko)) {
    const m = o.stanowisko.toLowerCase().replace(/\b(b2b|b2c|kam|oze|it|hr|ceo|sdr|bdr|rtv|agd)\b/g, (w) => w.toUpperCase());
    o.stanowisko = m[0].toUpperCase() + m.slice(1);
  }
  o.poziom = poziom(o.stanowisko);
  o.umowa = umowa(o.stanowisko, o.opis, o.adzunaTyp ?? null);
  o.wymiar = wymiar(o.stanowisko, o.opis, o.adzunaCzas);
  o.tryb = tryb(o.stanowisko, o.opis);
  o.branza = branza(o.stanowisko, o.firma, o.opis);
  o.odZaraz = odZaraz(o.opis);
  o.umiejetnosci = umiejetnosci(o.stanowisko, o.opis);
  // 17.10: id = „pierwsza forma tytułu + firma + 5 znaków klucza” (adres strony oferty). Przed wysyłką maili, więc można zmieniać.
  o.id = `${slug(krotkiTytul(o.stanowisko))}-${slug(o.firma).slice(0, 24).replace(/-$/, "")}-${o.klucz.slice(0, 5)}`;
  o.wazneDo ??= new Date(Date.parse(o.dodano) + 30 * DZIEN).toISOString();
  for (const k of ["obowiazki", "wymagania", "mileWidziane", "oferujemy"]) o[k] ??= [];
  o.oFirmie ??= "";
  delete o.token; // 17.10: token liczony z sekretu (lib/bruno/praca/oferty.ts), repo publiczne
  o.aplikuj ??= null;
}

wynik.sort((a, b) => b.dodano.localeCompare(a.dodano));
mkdirSync(path.dirname(WYJSCIE), { recursive: true });
writeFileSync(WYJSCIE, JSON.stringify(wynik, null, 1) + "\n");
console.log(`Ofert: ${wynik.length} (nowe: ${nowe}). Firm: ${new Set(wynik.map((o) => o.firma)).size}. Zapis: ${WYJSCIE}`);
