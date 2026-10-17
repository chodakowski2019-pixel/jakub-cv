// 17.10 (USER_001: „w tych miejscach powinny być loga firm”): logo firm do portalu /praca.
// Adzuna nie daje ani logo, ani strony www. Dla N największych firm: zgadujemy domenę z nazwy (+ ręczne wpisy),
// SPRAWDZAMY, że strona pasuje do firmy (charakterystyczne słowo z nazwy w <title> / treści), bierzemy największą ikonę
// (apple-touch-icon / icon z rozmiarem / Google s2 128 px), min. 96 px, zapis lokalnie: public/bruno/praca/loga/<slug>.png.
// Wynik: lib/bruno/praca/loga.json { firma: ścieżka }. Logo podaje się z naszej domeny, nic nie ładuje się z zewnątrz.
// Użycie: node scripts/bruno-praca-loga.mjs [ile_firm=400]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const KORZEN = path.join(import.meta.dirname, "..");
const ILE = Number(process.argv[2] ?? 400);
const oferty = JSON.parse(readFileSync(path.join(KORZEN, "lib/bruno/praca/oferty.json"), "utf8"));
const PLIK_MAPY = path.join(KORZEN, "lib/bruno/praca/loga.json");
const KATALOG = path.join(KORZEN, "public/bruno/praca/loga");
mkdirSync(KATALOG, { recursive: true });
const mapa = existsSync(PLIK_MAPY) ? JSON.parse(readFileSync(PLIK_MAPY, "utf8")) : {};
const TMP = path.join(KORZEN, ".next/cache/loga-tmp");
mkdirSync(TMP, { recursive: true });

// Ręczne domeny dużych firm (zweryfikowane i tak tym samym sprawdzeniem).
const RECZNE = {
  "rtv euro agd": "euro.com.pl",
  "dpd polska": "dpd.com.pl",
  "credit agricole bank polska": "credit-agricole.pl",
  "provident polska": "provident.pl",
  "leroy merlin polska": "leroymerlin.pl",
  "bank pekao": "pekao.com.pl",
  "bank pocztowy": "pocztowy.pl",
  "berlin-chemie/menarini polska": "berlin-chemie.pl",
  "pko bank polski": "pkobp.pl",
  "pko leasing": "pkoleasing.pl",
  "agata": "agatameble.pl",
  "hurtownia tadmar": "tadmar.pl",
  "orange polska": "orange.pl",
  "santander bank polska": "santander.pl",
  "mbank": "mbank.pl",
  "allianz": "allianz.pl",
  "tunż warta": "warta.pl",
  "pru / prudential": "pru.pl",
  "uniqa": "uniqa.pl",
  "generali": "generali.pl",
};
const RECZNE_DOMENY = new Set(Object.values(RECZNE));
const FORMY = /\b(sp\.?\s*z\.?\s*o\.?\s*o\.?|spółka\s+z\s+ograniczoną\s+odpowiedzialnością|spółka\s+(akcyjna|jawna|komandytowa|cywilna)|s\.?\s*a\.?|sp\.?\s*k\.?|sp\.?\s*j\.?|spółka|z\s+o\.?\s*o\.?)(?=\s|$|[,.)])/gi;
const STOP = new Set(["polska", "poland", "group", "grupa", "bank", "spółka", "przedsiębiorstwo", "hurtownia", "firma", "usługi", "centrum", "the", "and", "polski", "international", "services"]);
const bezPl = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L");
const czysta = (f) => f.replace(/["„”]/g, "").replace(FORMY, " ").replace(/\s+/g, " ").trim();

function kandydaci(f) {
  const c = czysta(f).toLowerCase();
  const r = RECZNE[c] ?? RECZNE[f.toLowerCase()];
  const dom = f.match(/\b([a-z0-9-]+\.(pl|com|eu|net|com\.pl))\b/i)?.[1]?.toLowerCase();
  const slowa = bezPl(c).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const bez = slowa.filter((w) => !STOP.has(w));
  const rdzenie = [...new Set([bez.join(""), bez.join("-"), slowa.join(""), bez[0]].filter((x) => x && x.length >= 3))];
  const out = [];
  if (r) out.push(r);
  if (dom) out.push(dom.replace(/^www\./, ""));
  for (const x of rdzenie) for (const tld of ["pl", "com.pl", "com", "eu"]) out.push(`${x}.${tld}`);
  return [...new Set(out)].slice(0, 10);
}
function slowoKlucz(f) {
  const slowa = bezPl(czysta(f)).toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length >= 3 && !STOP.has(w));
  return slowa.sort((a, b) => b.length - a.length)[0] ?? null;
}

async function pobierz(url, ms = 7000, binarne = false) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (Macintosh) SalesBrunoPraca/1.0", Accept: binarne ? "image/*" : "text/html" } });
    if (!r.ok) return null;
    return { url: r.url, dane: binarne ? Buffer.from(await r.arrayBuffer()) : (await r.text()).slice(0, 200_000), typ: r.headers.get("content-type") ?? "" };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function ikonyZHtml(html, baza) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    if (!/icon/.test(rel)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const roz = Number(tag.match(/sizes=["'](\d+)x\d+["']/i)?.[1] ?? (/apple-touch/.test(rel) ? 180 : 0));
    try {
      out.push({ url: new URL(href, baza).href, roz, svg: /\.svg(\?|$)/i.test(href) });
    } catch {}
  }
  return out.filter((x) => !x.svg).sort((a, b) => b.roz - a.roz);
}

/** Rozmiar obrazka przez sips (macOS). Zwraca szerokość albo 0. */
function szerokosc(plik) {
  try {
    const o = execFileSync("sips", ["-g", "pixelWidth", plik], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return Number(o.match(/pixelWidth:\s*(\d+)/)?.[1] ?? 0);
  } catch {
    return 0;
  }
}

// 17.10 v3: Clearbit podsuwał obce firmy (manufaktura.sk, itworld.co.kr, apple.com dla „APP”).
// Domena OK, gdy: wpisana ręcznie ALBO (polska / .eu / globalna końcówka) I nazwa domeny zawiera słowo z nazwy firmy (min. 4 litery).
export function domenaOk(host, firma, reczna = false) {
  if (reczna) return true;
  const h = host.replace(/^www\./, "");
  if (!/\.(pl|com\.pl|eu|com|net|org|io|co)$/.test(h)) return false;
  const etykieta = bezPl(h.split(".")[0]).toLowerCase().replace(/-/g, "");
  const slowa = bezPl(czysta(firma)).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w));
  return slowa.some((w) => etykieta.includes(w));
}

// 17.10 v2 (USER_001: „znajdź wszystkie”): domeny też z podpowiedzi Clearbit (darmowe, bez klucza), polskie najpierw.
async function zClearbit(firma) {
  const r = await pobierz(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(czysta(firma))}`, 6000);
  try {
    const l = JSON.parse(r?.dane ?? "[]");
    return l.map((x) => x.domain).filter(Boolean).sort((a, b) => Number(b.endsWith(".pl")) - Number(a.endsWith(".pl"))).slice(0, 4);
  } catch {
    return [];
  }
}

async function logoFirmy(firma) {
  const klucz = slowoKlucz(firma);
  if (!klucz) return null;
  const lista = kandydaci(firma);
  const cb = await zClearbit(firma);
  // Kolejność: ręczne, potem Clearbit, potem zgadywane z nazwy.
  const domeny = [...new Set([...lista.filter((d) => RECZNE_DOMENY.has(d)), ...cb, ...lista])];
  for (const dom of domeny) {
    const s = await pobierz(`https://${dom}`);
    if (!s) continue;
    const tytul = s.dane.match(/<title[^>]*>([^<]*)/i)?.[1] ?? "";
    const meta = (s.dane.match(/<meta[^>]+(og:site_name|og:title|description)[^>]*>/gi) ?? []).join(" ");
    const tekst = bezPl(`${tytul} ${meta} ${new URL(s.url).hostname}`).toLowerCase();
    if (!tekst.includes(klucz)) continue; // strona nie pasuje do firmy
    const host = new URL(s.url).hostname.replace(/^www\./, "");
    // Domeny na sprzedaż / parkingi (aftermarket.pl itd.) mają nazwę firmy w tytule, ale to nie jej strona.
    if (/aftermarket|sedo|parking|bodis|hugedomains|dan\.com|domena|domain|afternic|godaddy/.test(host)) continue;
    // Przekierowanie na inną domenę: nowa domena musi zawierać słowo z nazwy firmy.
    if (host !== dom.replace(/^www\./, "") && !bezPl(host).includes(klucz)) continue;
    if (!domenaOk(host, firma, RECZNE_DOMENY.has(dom))) continue;
    const ikony = [...ikonyZHtml(s.dane, s.url), { url: `https://www.google.com/s2/favicons?domain=${new URL(s.url).hostname}&sz=128`, roz: 128 }];
    for (const ik of ikony) {
      const img = await pobierz(ik.url, 7000, true);
      if (!img || img.dane.length < 300) continue;
      const tmp = path.join(TMP, `${klucz}-${Math.random().toString(36).slice(2)}`);
      writeFileSync(tmp, img.dane);
      if (szerokosc(tmp) < 64) continue;
      const slug = bezPl(czysta(firma)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
      const cel = path.join(KATALOG, `${slug}.png`);
      try {
        execFileSync("sips", ["-s", "format", "png", "-Z", "160", tmp, "--out", cel], { stdio: "ignore" });
      } catch {
        continue;
      }
      if (szerokosc(cel) < 64) continue;
      return { logo: `/bruno/praca/loga/${slug}.png`, domena: new URL(s.url).hostname };
    }
    return null; // strona pasuje, ale nie ma ikony w dobrej jakości
  }
  return null;
}

if (process.argv.includes("--weryfikuj")) {
  const { createHash } = await import("node:crypto");
  const hash = {};
  for (const [f, v] of Object.entries(mapa)) {
    if (!v) continue;
    const plik = path.join(KORZEN, "public", v.logo);
    if (!existsSync(plik)) { delete mapa[f]; continue; }
    const h = createHash("md5").update(readFileSync(plik)).digest("hex");
    (hash[h] ??= []).push([f, v.domena.replace(/^www\./, "")]);
  }
  let usuniete = 0;
  for (const lista of Object.values(hash)) {
    const domeny = new Set(lista.map(([, d]) => d));
    for (const [f, d] of lista) {
      const reczna = RECZNE_DOMENY.has(d);
      if ((domeny.size > 1 && lista.length > 1) || !domenaOk(d, f, reczna)) { mapa[f] = null; usuniete++; }
    }
  }
  writeFileSync(PLIK_MAPY, JSON.stringify(mapa, null, 1) + "\n");
  console.log(`Weryfikacja: odrzucone ${usuniete}, zostaje ${Object.values(mapa).filter(Boolean).length} firm z logo.`);
  process.exit(0);
}

const liczba = {};
for (const o of oferty) liczba[o.firma] = (liczba[o.firma] ?? 0) + 1;
const firmy = Object.entries(liczba).sort((a, b) => b[1] - a[1]).slice(0, ILE).map(([f]) => f).filter((f) => !mapa[f]); // brak albo null = sprawdź (ponownie)
console.log(`Firm do sprawdzenia: ${firmy.length} (już w mapie: ${Object.keys(mapa).length})`);
let i = 0, ok = 0;
async function pracownik() {
  while (i < firmy.length) {
    const f = firmy[i++];
    const w = await logoFirmy(f);
    mapa[f] = w; // null = sprawdzone, brak logo (nie sprawdzaj ponownie)
    if (w) ok++;
  }
}
await Promise.all(Array.from({ length: 8 }, pracownik));
writeFileSync(PLIK_MAPY, JSON.stringify(mapa, null, 1) + "\n");
const z = Object.values(mapa).filter(Boolean).length;
const pokryte = oferty.filter((o) => mapa[o.firma]).length;
console.log(`Nowe logo: ${ok}. Firm z logo: ${z}. Ofert z logo: ${pokryte} / ${oferty.length}.`);
