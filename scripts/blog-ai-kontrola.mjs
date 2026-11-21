#!/usr/bin/env node
// Kontrola artykułów bloga o AI w firmie (content/blog-ai/*.md), 21.11.2026.
// Progi czytelności = Moje-Życie/Biznes/Pracownicy/SEO/baza-wiedzy/29-czytelnosc-artykulu-zasady.md
// (wzór: zwiazki-lp/scripts/czytelnosc.py), dopasowane do zasad marki Jakub Chodakowski:
// bezosobowo (bez „Ty”), tylko AI (nic o sprzedaży), zero myślników, każda liczba ze źródłem z _zrodla.json.
//
//   node scripts/blog-ai-kontrola.mjs                    tabela dla całego bloga
//   node scripts/blog-ai-kontrola.mjs <slug albo plik>   jeden tekst, lista uwag
//
// BŁĄD = trzeba poprawić. UWAGA = do obejrzenia (np. liczba, której skrypt nie znalazł w źródłach).

import fs from "node:fs";
import path from "node:path";

const KATALOG = path.join(import.meta.dirname, "..", "content", "blog-ai");
const REJESTR = JSON.parse(fs.readFileSync(path.join(KATALOG, "_zrodla.json"), "utf8"));
const GRUPY = ["zasady-ai-w-firmie", "szkolenie-ai-w-firmie", "ai-w-pracy-biura", "narzedzia-ai-dla-firm"];

const PROGI = {
  tytul: 60, opis: 150, tldr: 45,
  zdanieSrednio: 12, zdaniaPonad20: 8,
  akapitSlowa: 45, akapitZdania: 3, sekcjaSlowa: 150, punktZdania: 2,
  dlugieSlowa: 6, slowaMin: 800, slowaMax: 1100,
  listyMin: 2, ramkiMin: 1, zrodlaMin: 2, faqMin: 3, faqMax: 4, linkiMin: 3, linkiMax: 5,
};

// Liczby z oferty (components/szkolenia-ai/dane.ts): wolno je podać bez źródła, bo to własne dane.
const OFERTA = ["5 900", "3 900", "9 900", "12 osób", "7 godzin", "6 godzin", "14 dni", "45 minut", "15 minut", "24 godziny", "30 dni", "2 tygodnie", "1 stronie", "1 stronę", "1 dzień", "2 dni", "9:00", "11:15", "13:30", "14:45", "16:00"];

const czysc = (t) => t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "");
const zdania = (t) => czysc(t).split(/(?<=[.!?…])\s+/).filter((z) => z.split(/\s+/).length >= 2);
const slowa = (t) => t.split(/\s+/).filter(Boolean);
const norm = (s) => s.replace(/[  ]/g, " ").replace(/\s+/g, " ").toLowerCase();

function wczytaj(plik) {
  const raw = fs.readFileSync(plik, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, tresc: raw };
  const meta = {};
  for (const l of m[1].split(/\r?\n/)) {
    const i = l.indexOf(":");
    if (i === -1) continue;
    let v = l.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[l.slice(0, i).trim()] = v;
  }
  return { meta, tresc: m[2] };
}

function analiza(plik, wszystkieSlugi) {
  const { meta, tresc } = wczytaj(plik);
  const bledy = [];
  const uwagi = [];
  const akapity = [];
  const punkty = [];
  const sekcje = [];
  let ramki = 0, listy = 0, polecenia = 0, bufor = [], sekcja = 0, wLiscie = false, wPoleceniu = false, wFaq = false, faq = 0;
  const zamknij = () => { if (bufor.length) akapity.push(bufor.join(" ")); bufor = []; };

  for (const linia of tresc.split("\n")) {
    const l = linia.trim();
    if (l.startsWith("```")) { zamknij(); if (!wPoleceniu) polecenia++; wPoleceniu = !wPoleceniu; wLiscie = false; continue; }
    if (wPoleceniu) { sekcja += slowa(l).length; continue; }
    if (l.startsWith("## ")) { zamknij(); sekcje.push(sekcja); sekcja = 0; wLiscie = false; wFaq = /^##\s+(FAQ|Najczęstsze pytania|Pytania i odpowiedzi)\s*$/.test(l); continue; }
    if (l.startsWith("### ")) { zamknij(); wLiscie = false; if (wFaq) faq++; continue; }
    if (!l || l.startsWith("#") || l.startsWith("|") || l === "---") { zamknij(); wLiscie = false; continue; }
    if (l.startsWith(">")) { zamknij(); ramki++; wLiscie = false; continue; }
    const m = l.match(/^(\d+\.|[-*])\s+(.*)/);
    if (m) { zamknij(); punkty.push(m[2]); if (!wLiscie) listy++; wLiscie = true; sekcja += slowa(m[2]).length; continue; }
    wLiscie = false; bufor.push(l); sekcja += slowa(l).length;
  }
  zamknij(); sekcje.push(sekcja);

  const tekst = [...akapity, ...punkty].join(" ");
  const zd = zdania(tekst).map((z) => slowa(z).length);
  const wyrazy = czysc(tekst).match(/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+/g) ?? [];
  const w = {
    slowa: slowa(tresc).length,
    zdanie: zd.length ? +(zd.reduce((a, b) => a + b, 0) / zd.length).toFixed(1) : 0,
    ponad20: +((100 * zd.filter((d) => d > 20).length) / Math.max(zd.length, 1)).toFixed(1),
    akapitMax: Math.max(0, ...akapity.map((a) => slowa(a).length)),
    dlugie: +((100 * wyrazy.filter((s) => s.length >= 11).length) / Math.max(wyrazy.length, 1)).toFixed(1),
    listy, ramki, polecenia, faq,
  };

  // --- pola nagłówka ---
  for (const k of ["tytul", "opis", "tldr", "grupa", "nr", "fraza", "data", "zrodla"]) if (!meta[k]) bledy.push(`brak pola „${k}”`);
  if ((meta.tytul ?? "").length > PROGI.tytul) bledy.push(`tytuł ${meta.tytul.length} znaków (do ${PROGI.tytul})`);
  if ((meta.opis ?? "").length > PROGI.opis) bledy.push(`opis ${meta.opis.length} znaków (do ${PROGI.opis})`);
  if (slowa(meta.tldr ?? "").length > PROGI.tldr) bledy.push(`„W skrócie” ${slowa(meta.tldr).length} słów (do ${PROGI.tldr})`);
  if (meta.grupa && !GRUPY.includes(meta.grupa)) bledy.push(`nieznana grupa „${meta.grupa}”`);
  const ids = (meta.zrodla ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  for (const id of ids) if (!REJESTR[id]) bledy.push(`źródło „${id}” nie istnieje w _zrodla.json`);
  if (ids.length < PROGI.zrodlaMin) bledy.push(`źródeł: ${ids.length} (min. ${PROGI.zrodlaMin})`);

  // --- czytelność ---
  const limit = Number(meta.limit_slow || PROGI.slowaMax);
  if (w.zdanie > PROGI.zdanieSrednio) bledy.push(`zdanie średnio ${w.zdanie} słowa (do ${PROGI.zdanieSrednio})`);
  if (w.ponad20 > PROGI.zdaniaPonad20) bledy.push(`${w.ponad20}% zdań ponad 20 słów (do ${PROGI.zdaniaPonad20}%)`);
  for (const a of akapity) {
    const n = slowa(a).length, z = zdania(a).length;
    if (n > PROGI.akapitSlowa || z > PROGI.akapitZdania) bledy.push(`akapit ${n} słów / ${z} zdań: „${a.slice(0, 60)}…”`);
  }
  for (const p of punkty) if (zdania(p).length > PROGI.punktZdania) bledy.push(`punkt listy ma ${zdania(p).length} zdania: „${czysc(p).slice(0, 60)}…”`);
  sekcje.slice(1).forEach((s, i) => { if (s > PROGI.sekcjaSlowa) uwagi.push(`sekcja ${i + 1} ma ${s} słów (do ${PROGI.sekcjaSlowa})`); });
  if (w.dlugie > PROGI.dlugieSlowa) uwagi.push(`${w.dlugie}% słów ma 11+ liter (do ${PROGI.dlugieSlowa}%)`);
  if (w.slowa < PROGI.slowaMin || w.slowa > limit) bledy.push(`${w.slowa} słów (${PROGI.slowaMin} do ${limit})`);
  if (w.listy < PROGI.listyMin) bledy.push(`list: ${w.listy} (min. ${PROGI.listyMin})`);
  if (w.ramki < PROGI.ramkiMin) bledy.push("brak ramki z jedną myślą (wiersz zaczynający się od >)");
  if (w.faq < PROGI.faqMin || w.faq > PROGI.faqMax) bledy.push(`pytań w „Najczęstsze pytania”: ${w.faq} (${PROGI.faqMin} do ${PROGI.faqMax})`);

  // --- zasady marki ---
  const calosc = `${meta.tytul ?? ""} ${meta.opis ?? ""} ${meta.tldr ?? ""} ${tresc}`;
  const dopasuj = (re) => [...new Set((calosc.match(re) ?? []).map((x) => x.trim()))];
  const mysl = dopasuj(/[—–]/g);
  if (mysl.length) bledy.push(`myślniki w tekście: ${(calosc.match(/[—–]/g) ?? []).length} (ma być 0)`);
  // „słowo - słowo” w środku wiersza. Znacznik listy („- ” na początku wiersza) to nie myślnik.
  const lacznik = calosc.match(/\S - \S/g) ?? [];
  if (lacznik.length) bledy.push(`łącznik użyty jak myślnik („ - ”): ${lacznik.length}`);
  // Skróty z kropką w środku zdania psują rytm i liczenie zdań: pisz „na przykład”, „roku”, „około”.
  const skroty = dopasuj(/(?<![\p{L}])(np\.|m\.in\.|tzw\.|itd\.|itp\.|ok\.|tys\.|ust\.)(?=\s)/giu);
  if (skroty.length) bledy.push(`skróty z kropką: ${skroty.join(", ")}`);
  const ty = dopasuj(/(?<![\p{L}])(ty|ciebie|cię|tobie|tobą|twój|twoja|twoje|twojej|twojego|twoim|twoich|twoją|masz|możesz|musisz|chcesz|jesteś|powinieneś|powinnaś|zobaczysz|dostaniesz|zrobisz|wiesz)(?![\p{L}])/giu);
  if (ty.length) bledy.push(`zwrot na „Ty”: ${ty.join(", ")}`);
  const sprzedaz = dopasuj(/(?<![\p{L}])(sprzeda[\p{L}]*|handlow[\p{L}]*)/giu);
  if (sprzedaz.length) bledy.push(`temat sprzedaży w tekście: ${sprzedaz.join(", ")}`);
  const obietnice = dopasuj(/(?<![\p{L}])(gwarantuj[\p{L}]*|gwarancj[\p{L}]*|na pewno|zawsze działa)/giu);
  if (obietnice.length) uwagi.push(`słowa obietnicy: ${obietnice.join(", ")}`);

  // --- linki wewnętrzne ---
  const linki = [...tresc.matchAll(/\]\((\/blog\/[^)#\s]+)/g)].map((m) => m[1].replace("/blog/", ""));
  for (const s of new Set(linki)) if (!wszystkieSlugi.has(s)) bledy.push(`link do nieistniejącego tekstu: /blog/${s}`);
  if (linki.length < PROGI.linkiMin || linki.length > PROGI.linkiMax) uwagi.push(`linków do innych tekstów: ${linki.length} (${PROGI.linkiMin} do ${PROGI.linkiMax})`);
  for (const a of akapity) if ((a.match(/\]\(\//g) ?? []).length > 1) uwagi.push(`2+ linki w jednym akapicie: „${a.slice(0, 50)}…”`);

  // --- liczby: każda ma być w źródłach tekstu albo w ofercie ---
  const baza = norm(ids.map((id) => (REJESTR[id] ? `${REJESTR[id].liczba} ${REJESTR[id].teza} ${REJESTR[id].nazwa}` : "")).join(" ") + " " + OFERTA.join(" "));
  const cialo = norm(czysc(`${meta.tldr ?? ""} ${tresc.replace(/^#+\s.*$/gm, " ").replace(/^\d+\.\s/gm, " ")}`));
  const liczby = cialo.match(/\d+(?:[ .,]\d+)*(?:\s?(?:%|proc\.|pkt proc\.|zł|usd|eur|euro|mln|mld|tys\.))?/g) ?? [];
  const brak = [...new Set(liczby.map((x) => x.trim()))].filter((x) => {
    const sama = x.replace(/\s?(%|proc\.|pkt proc\.|zł|usd|eur|euro|mln|mld|tys\.)$/, "");
    if (/^\d$/.test(sama) && sama === x) return false; // pojedyncza cyfra bez jednostki: liczenie punktów, kroków
    return !baza.includes(sama);
  });
  if (brak.length) uwagi.push(`liczby, których nie ma w źródłach tekstu: ${brak.join(" | ")}`);

  return { meta, w, bledy, uwagi };
}

const pliki = fs.readdirSync(KATALOG).filter((f) => f.endsWith(".md") && !f.startsWith("_")).sort();
const slugi = new Set(pliki.map((f) => f.replace(/\.md$/, "")));
const arg = process.argv[2];

if (arg) {
  const plik = fs.existsSync(arg) ? arg : path.join(KATALOG, `${arg.replace(/\.md$/, "")}.md`);
  const { w, bledy, uwagi } = analiza(plik, slugi);
  console.log(JSON.stringify(w));
  console.log(bledy.length ? bledy.map((b) => `BŁĄD: ${b}`).join("\n") : "Błędów: 0.");
  if (uwagi.length) console.log(uwagi.map((u) => `UWAGA: ${u}`).join("\n"));
  process.exit(bledy.length ? 1 : 0);
} else {
  console.log("błędy | uwagi | słów | zdanie | >20 słów | najdł. akapit | plik");
  let razem = 0;
  for (const f of pliki) {
    const { w, bledy, uwagi } = analiza(path.join(KATALOG, f), slugi);
    razem += bledy.length;
    console.log(`${String(bledy.length).padStart(5)} | ${String(uwagi.length).padStart(5)} | ${String(w.slowa).padStart(4)} | ${String(w.zdanie).padStart(6)} | ${String(w.ponad20).padStart(7)}% | ${String(w.akapitMax).padStart(13)} | ${f}`);
  }
  console.log(`\nTekstów: ${pliki.length}. Błędów razem: ${razem}.`);
  process.exit(razem ? 1 : 0);
}
