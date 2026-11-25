// WYŁĄCZONY 25.11.2026 (USER_001: „na razie skaner wyłączamy”). Nie uruchamiany, strona go nie używa. Odpalić tylko z --wlacz.
// 25.11.2026: skaner promocji katalogu /ai. Czyta strony producentów z content/narzedzia-ai/*.md (pole `strona`
// i adresy cennika/promocji), szuka słów Black Friday / Cyber Monday / Black Week i rabatu w procentach.
// Wynik: content/narzedzia-ai/_skan.json (godzina skanu, adres, status, cytat). To SUROWY ślad dla człowieka:
// promocja trafia na stronę dopiero po ręcznym wpisie do _promocje.json z cytatem (zero zmyślonych rabatów).
// Użycie: node scripts/promocje-skaner.mjs
import fs from "node:fs";
if (!process.argv.includes("--wlacz")) {
  console.log("Skaner promocji jest wyłączony (25.11.2026). Uruchom z --wlacz, żeby go użyć.");
  process.exit(0);
}
import path from "node:path";

const KAT = path.join(process.cwd(), "content", "narzedzia-ai");
const pliki = fs.readdirSync(KAT).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
const POLE = (t, k) => (t.match(new RegExp(`^${k}:\\s*(.+)$`, "m")) || [])[1]?.trim().replace(/^"|"$/g, "") || "";

const SLOWA = /(black\s*friday|black\s*week|cyber\s*monday|cyber\s*week|BFCM|holiday\s*(sale|deal|offer)|czarny\s*piątek)/i;
const RABAT = /(\d{2,3})\s?%\s*(off|discount|rabat|taniej|zniżk)|(save|oszczędź(?:\s+do)?)\s*(up\s*to\s*)?(\d{2,3})\s?%/i;

function adresy(strona) {
  const u = new URL(strona);
  const baza = `${u.protocol}//${u.host}`;
  return [...new Set([strona, `${baza}/`, `${baza}/pricing`, `${baza}/black-friday`, `${baza}/pl/pricing`])];
}

async function pobierz(url) {
  try {
    const r = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; katalog-ai-skaner)", "accept-language": "pl,en;q=0.8" },
    });
    if (!r.ok) return { url, kod: r.status, tekst: "" };
    const html = await r.text();
    const tekst = html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/\s+/g, " ");
    return { url: r.url, kod: r.status, tekst };
  } catch (e) {
    return { url, kod: 0, tekst: "", blad: String(e.message || e).slice(0, 80) };
  }
}

const wynik = [];
for (const plik of pliki) {
  const src = fs.readFileSync(path.join(KAT, plik), "utf8");
  const slug = plik.replace(/\.md$/, "");
  const strona = POLE(src, "strona");
  const trafienia = [];
  let odczytane = 0;
  let blokada = 0;
  for (const url of adresy(strona)) {
    const s = await pobierz(url);
    if (s.kod === 200) odczytane++;
    else if (s.kod === 403 || s.kod === 429) blokada++;
    const m = s.tekst.match(SLOWA);
    if (m) {
      const i = s.tekst.search(SLOWA);
      trafienia.push({ url: s.url, typ: "slowo", cytat: s.tekst.slice(Math.max(0, i - 80), i + 200).trim() });
    }
    const r = s.tekst.match(RABAT);
    if (r && !m) {
      const i = s.tekst.search(RABAT);
      trafienia.push({ url: s.url, typ: "rabat", cytat: s.tekst.slice(Math.max(0, i - 60), i + 140).trim() });
    }
  }
  const status = trafienia.some((t) => t.typ === "slowo") ? "promocja" : trafienia.length ? "rabat" : odczytane ? "brak" : blokada ? "blokada" : "brak-strony";
  wynik.push({ slug, strona, status, odczytane, trafienia: trafienia.slice(0, 3) });
  console.log(status.padEnd(12), slug.padEnd(22), trafienia[0]?.cytat.slice(0, 110) ?? "");
}

const out = { skan: new Date().toISOString(), adresow: wynik.length, wyniki: wynik };
fs.writeFileSync(path.join(KAT, "_skan.json"), JSON.stringify(out, null, 1));
console.log("\nZapisano content/narzedzia-ai/_skan.json:", wynik.filter((w) => w.status === "promocja").length, "ze słowem Black Friday,", wynik.filter((w) => w.status === "rabat").length, "z rabatem %");
