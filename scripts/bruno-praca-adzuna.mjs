// 17.10 (USER_001: „potrzeba więcej ofert”): świeże oferty sprzedażowe z Adzuna API (Polska) do CSV,
// który potem czyta scripts/bruno-praca-import.mjs. Legalne źródło (API, nie scraping), link oferty = redirect Adzuna.
// Klucz: ADZUNA_APP_ID + ADZUNA_APP_KEY w env albo plik ~/.adzuna-key („app_id:app_key”). Skrypt go nie wypisuje.
// Limit Adzuna: 250 zapytań / dzień. Domyślnie: kategoria sales-jobs + frazy, do 30 dni wstecz.
// Użycie: node scripts/bruno-praca-adzuna.mjs [maks_stron_na_zapytanie=20]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const MAKS_STRON = Number(process.argv[2] ?? 20);
let appId = process.env.ADZUNA_APP_ID;
let appKey = process.env.ADZUNA_APP_KEY;
if (!appId || !appKey) {
  const plik = path.join(homedir(), ".adzuna-key");
  if (!existsSync(plik)) throw new Error("Brak klucza Adzuna (env albo ~/.adzuna-key)");
  [appId, appKey] = readFileSync(plik, "utf8").trim().split(/[:\s]+/);
}
if (!appId || !appKey) throw new Error("Zły format ~/.adzuna-key (oczekiwane app_id:app_key)");

const ZAPYTANIA = [
  { category: "sales-jobs" },
  { what: "przedstawiciel handlowy" },
  { what: "handlowiec" },
  { what: "key account manager" },
  { what: "account manager" },
  { what: "doradca klienta" },
  { what: "specjalista ds. sprzedaży" },
  { what: "business development" },
  { what: "telesprzedaż" },
  { what: "kierownik sprzedaży" },
  { what: "sales manager" },
  { what: "przedstawiciel medyczny" },
];

let zapytan = 0;
async function strona(param, nr) {
  const u = new URL(`https://api.adzuna.com/v1/api/jobs/pl/search/${nr}`);
  u.searchParams.set("app_id", appId);
  u.searchParams.set("app_key", appKey);
  u.searchParams.set("results_per_page", "50");
  u.searchParams.set("max_days_old", "30");
  u.searchParams.set("sort_by", "date");
  u.searchParams.set("content-type", "application/json");
  for (const [k, v] of Object.entries(param)) u.searchParams.set(k, v);
  zapytan++;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`Adzuna ${r.status} dla ${JSON.stringify(param)} str. ${nr}`);
  return r.json();
}

const wszystkie = new Map();
for (const param of ZAPYTANIA) {
  let lacznie = 0;
  for (let nr = 1; nr <= MAKS_STRON; nr++) {
    const j = await strona(param, nr);
    const wyniki = j.results ?? [];
    if (nr === 1) lacznie = j.count ?? 0;
    for (const o of wyniki) wszystkie.set(String(o.id), o);
    if (wyniki.length < 50 || nr * 50 >= lacznie) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`${JSON.stringify(param)}: ${lacznie} w Adzuna, zebrane łącznie ${wszystkie.size}`);
}

const esc = (v) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const KOLUMNY = ["kraj", "stanowisko", "firma", "region", "pensja_min", "pensja_max", "pensja_szacowana", "umowa", "umowa_typ", "data", "url", "opis_skrot"];
const wiersze = [...wszystkie.values()].map((o) =>
  [
    "Polska",
    o.title,
    o.company?.display_name,
    (o.location?.area ?? []).join(" / "),
    o.salary_is_predicted === "1" ? "" : o.salary_min,
    o.salary_is_predicted === "1" ? "" : o.salary_max,
    o.salary_is_predicted === "1" ? 1 : 0,
    o.contract_time,
    o.contract_type,
    o.created,
    o.redirect_url,
    o.description,
  ].map(esc).join(","),
);
const dzis = new Date().toISOString().slice(0, 10);
const wyjscie = path.join(homedir(), `Moje-Życie/Biznes/Projekty/SalesAI/oferty/adzuna-pl-sales-${dzis}.csv`);
writeFileSync(wyjscie, [KOLUMNY.join(","), ...wiersze].join("\n") + "\n");
console.log(`Ofert: ${wszystkie.size}, zapytań: ${zapytan}. Zapis: ${wyjscie}`);
