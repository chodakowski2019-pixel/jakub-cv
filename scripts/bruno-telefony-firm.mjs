// Lista firm do telefonów (Bruno CRM): małe firmy z BAZA-MAILI-FIRM.csv + telefon ze strony firmy
// + właściciel z COLD-LISTA-1-WLASCICIELE.csv (jeśli jest).
// Uruchom: node scripts/bruno-telefony-firm.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

const KAT = `${homedir()}/Moje-Życie/Biznes/Projekty/SalesAI/sprzedaz`;
const WYJSCIE = `${KAT}/LISTA-TELEFONY-2026-11-09.csv`;

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

const klucz = (nazwa) => nazwa.toLowerCase().replace(/sp(ółka)?\.? ?z ?o\.? ?o\.?|s\.a\.|sp\.? ?k\.?|["„”.,]/g, "").replace(/\s+/g, " ").trim();

const firmy = csv(readFileSync(`${KAT}/BAZA-MAILI-FIRM.csv`, "utf8")).filter((f) => f.typ === "mała" && f.domena);
const wlasciciele = new Map(
  csv(readFileSync(`${KAT}/COLD-LISTA-1-WLASCICIELE.csv`, "utf8")).filter((w) => w.osoba).map((w) => [klucz(w.firma), w]),
);

async function pobierz(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36" } });
    if (!r.ok) return "";
    return (await r.text()).slice(0, 600000);
  } catch { return ""; }
}

function normalizuj(surowy) {
  let c = surowy.replace(/\D/g, "");
  if (c.startsWith("0048")) c = c.slice(4);
  if (c.length === 11 && c.startsWith("48")) c = c.slice(2);
  if (c.length !== 9 || /^[01]/.test(c) || /^(\d)\1{8}$/.test(c)) return null;
  return c;
}

function telefony(html) {
  const wynik = new Map(); // numer → waga
  const dodaj = (s, waga) => { const n = normalizuj(s); if (n) wynik.set(n, (wynik.get(n) ?? 0) + waga); };
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) dodaj(decodeURIComponent(m[1]), 5);
  const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  for (const m of tekst.matchAll(/(?:tel\.?|telefon|kom\.?|mobile|phone|zadzwoń)[^0-9+]{0,20}((?:\+48|0048)?[\s-]?(?:\(?\d{2,3}\)?[\s-]?){3,4})/gi)) dodaj(m[1], 3);
  for (const m of tekst.matchAll(/\+48[\s-]?\d{2,3}[\s-]?\d{2,3}[\s-]?\d{2,3}(?:[\s-]?\d{2})?/g)) dodaj(m[0], 2);
  return [...wynik.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
}

const KOMORKA = /^(45|5[0137]|60|66|69|72|73|78|79|88)/;
const format = (n) => `+48 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;

async function firma(f) {
  const baza = `https://${f.domena}`;
  let html = await pobierz(baza);
  if (!html) html = await pobierz(`https://www.${f.domena}`);
  let numery = telefony(html);
  const link = html.match(/href=["']([^"']*kontakt[^"']*)["']/i)?.[1];
  const podstrony = [link ? new URL(link, baza).href : `${baza}/kontakt`];
  for (const p of podstrony) {
    const h = await pobierz(p);
    for (const n of telefony(h)) if (!numery.includes(n)) numery.push(n);
  }
  const kom = numery.filter((n) => KOMORKA.test(n));
  const stacj = numery.filter((n) => !KOMORKA.test(n));
  const w = wlasciciele.get(klucz(f.firma));
  return {
    firma: f.firma, branza: f.branza, miasto: f.miasto,
    wlasciciel: w?.osoba ?? "", rola: w?.stanowisko ?? "",
    telefon: numery[0] ? format(numery[0]) : "",
    komorka: kom[0] ? format(kom[0]) : "",
    inne_numery: [...kom.slice(1), ...stacj].filter((n) => n !== numery[0]).slice(0, 3).map(format).join(" | "),
    email: f.email, www: f.domena, szuka: f.stanowisko, ofert: f.ofert,
    strona_dziala: html ? "tak" : "nie",
    status: "", notatka: "",
  };
}

const wyniki = [];
const kolejka = [...firmy];
await Promise.all(Array.from({ length: 16 }, async () => {
  while (kolejka.length) wyniki.push(await firma(kolejka.shift()));
}));

// Kolejność dzwonienia: właściciel znany → komórka → jakikolwiek numer.
const punkty = (w) => (w.wlasciciel ? 4 : 0) + (w.komorka ? 2 : 0) + (w.telefon ? 1 : 0);
wyniki.sort((a, b) => punkty(b) - punkty(a) || a.branza.localeCompare(b.branza, "pl"));

const kol = Object.keys(wyniki[0]);
const pole = (v) => (/[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v);
writeFileSync(WYJSCIE, ["nr," + kol.join(","), ...wyniki.map((w, i) => [i + 1, ...kol.map((k) => pole(w[k]))].join(","))].join("\n") + "\n");

const zTel = wyniki.filter((w) => w.telefon);
console.log(`firm: ${wyniki.length}, z telefonem: ${zTel.length}, z komórką: ${wyniki.filter((w) => w.komorka).length}, z właścicielem: ${wyniki.filter((w) => w.wlasciciel).length}, właściciel + telefon: ${zTel.filter((w) => w.wlasciciel).length}, strona nie działa: ${wyniki.filter((w) => w.strona_dziala === "nie").length}`);
const br = {};
for (const w of zTel) br[w.branza] = (br[w.branza] ?? 0) + 1;
console.log(br);
console.log(WYJSCIE);
