// 26.11.2026 (USER_001): projekt /nieruchomosci. Pobiera z GUS (Bank Danych Lokalnych, API bez klucza)
// ceny mieszkań z transakcji rynkowych dla Polski, 16 województw i 380 powiatów, lata 2010 i dalej.
// Wynik: lib/nieruchomosci/gus.json. Uruchom: node scripts/nieruchomosci-gus.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const API = "https://bdl.stat.gov.pl/api/v1";
const ZMIENNE = {
  m2: 633677, // mediana ceny za 1 m2, ogółem
  m2Pierwotny: 633682, // mediana, rynek pierwotny
  m2Wtorny: 633687, // mediana, rynek wtórny
  transakcje: 633617, // liczba sprzedanych lokali, ogółem
};
const LATA = Array.from({ length: 16 }, (_, i) => 2010 + i);
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));

async function pobierz(url) {
  for (let proba = 0; proba < 5; proba++) {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (r.ok) return r.json();
    if (r.status === 429) { await czekaj(3000 * (proba + 1)); continue; }
    throw new Error(`${r.status} ${url}`);
  }
  throw new Error(`limit zapytań: ${url}`);
}

async function wszystkieStrony(sciezka) {
  const wyniki = [];
  let url = `${API}${sciezka}${sciezka.includes("?") ? "&" : "?"}format=json&lang=pl&page-size=100`;
  while (url) {
    const d = await pobierz(url);
    wyniki.push(...d.results);
    url = d.links?.next ?? null;
    await czekaj(250);
  }
  return wyniki;
}

const slug = (s) =>
  s.toLowerCase()
    .replace(/^powiat\s+/, "")
    .replace(/\s+od\s+\d{4}$/, "")
    .replace(/^m\.\s*st\.\s*/, "")
    .replace(/^m\.\s*/, "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const lata = LATA.map((r) => `year=${r}`).join("&");
const jednostki = new Map();

const wojewodztwa = await wszystkieStrony("/units?level=2");
const nazwaWoj = new Map(wojewodztwa.map((w) => [w.id, w.name.toLowerCase()]));

for (const poziom of [0, 2, 5]) {
  for (const [klucz, id] of Object.entries(ZMIENNE)) {
    const wiersze = await wszystkieStrony(`/data/by-variable/${id}?unit-level=${poziom}&${lata}`);
    for (const w of wiersze) {
      if (!jednostki.has(w.id)) {
        const miasto = /^Powiat m\./.test(w.name);
        const nazwa = poziom === 0 ? "Polska" : poziom === 2 ? w.name.toLowerCase() : w.name.replace(/^Powiat m\.\s*(st\.\s*)?/, "").replace(/^Powiat /, "powiat ").replace(/\s+od\s+\d{4}$/, "");
        jednostki.set(w.id, {
          id: w.id,
          poziom: poziom === 0 ? "kraj" : poziom === 2 ? "wojewodztwo" : miasto ? "miasto" : "powiat",
          nazwa,
          slug: poziom === 0 ? "polska" : poziom === 2 ? `wojewodztwo-${slug(w.name)}` : miasto ? slug(w.name) : `powiat-${slug(w.name)}`,
          wojewodztwo: poziom === 5 ? nazwaWoj.get(w.id.slice(0, 4) + "00000000") ?? null : null,
          lata: {},
        });
      }
      const j = jednostki.get(w.id);
      for (const v of w.values ?? []) {
        if (v.val == null || v.attrId !== 1) continue;
        (j.lata[v.year] ??= {})[klucz] = v.val;
      }
    }
    console.log(`poziom ${poziom}, ${klucz}: ${wiersze.length} jednostek`);
  }
}

// Ten sam slug dwa razy (np. powiat i miasto o tej samej nazwie w różnych województwach): dopisz województwo.
const licz = new Map();
for (const j of jednostki.values()) licz.set(j.slug, (licz.get(j.slug) ?? 0) + 1);
for (const j of jednostki.values()) if (licz.get(j.slug) > 1 && j.wojewodztwo) j.slug = `${j.slug}-${slug(j.wojewodztwo)}`;

const lista = [...jednostki.values()].filter((j) => Object.keys(j.lata).length > 0);
const ostatniRok = Math.max(...lista.flatMap((j) => Object.keys(j.lata).map(Number)));
mkdirSync("lib/nieruchomosci", { recursive: true });
writeFileSync(
  "lib/nieruchomosci/gus.json",
  JSON.stringify({ zrodlo: "GUS, Bank Danych Lokalnych", pobrano: new Date().toISOString().slice(0, 10), ostatniRok, jednostki: lista }),
);
console.log(`zapisano ${lista.length} jednostek, ostatni rok ${ostatniRok}`);
