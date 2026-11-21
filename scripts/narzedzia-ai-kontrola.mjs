#!/usr/bin/env node
// Kontrola wpisów katalogu narzędzi AI (content/narzedzia-ai/*.md), 21.11.2026.
// Te same zasady marki co na blogu (scripts/blog-ai-kontrola.mjs): bezosobowo, tylko AI, zero myślników,
// źródła z content/blog-ai/_zrodla.json. Wpis jest krótszy niż artykuł: 250 do 600 słów.
//   node scripts/narzedzia-ai-kontrola.mjs
import fs from "node:fs";
import path from "node:path";

const KATALOG = path.join(import.meta.dirname, "..", "content", "narzedzia-ai");
const REJESTR = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "content", "blog-ai", "_zrodla.json"), "utf8"));
const POLA = ["nazwa", "producent", "strona", "kategoria", "cennik", "cena_od", "po_polsku", "dane", "sprawdzono", "tytul", "opis", "krotko", "zrodla"];
const czysc = (t) => t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "");
const zdania = (t) => czysc(t).split(/(?<=[.!?…])\s+/).filter((z) => z.split(/\s+/).length >= 2);

let razem = 0;
const pliki = fs.readdirSync(KATALOG).filter((f) => f.endsWith(".md") && !f.startsWith("_")).sort();
const slugi = new Set();
const wpisy = pliki.map((f) => {
  const raw = fs.readFileSync(path.join(KATALOG, f), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta = {};
  for (const l of (m?.[1] ?? "").split(/\r?\n/)) {
    const i = l.indexOf(":");
    if (i === -1) continue;
    let v = l.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    meta[l.slice(0, i).trim()] = v;
  }
  const slug = meta.slug || f.replace(/\.md$/, "");
  slugi.add(slug);
  return { f, slug, meta, tresc: m?.[2] ?? raw };
});

for (const { f, meta, tresc } of wpisy) {
  const b = [];
  if (/^claude\.md$/i.test(f)) b.push("plik nie może nazywać się claude.md (kolizja z CLAUDE.md), użyj innej nazwy i pola slug");
  for (const k of POLA) if (!meta[k]) b.push(`brak pola „${k}”`);
  if ((meta.tytul ?? "").length > 60) b.push(`tytuł ${meta.tytul.length} znaków (do 60)`);
  if ((meta.opis ?? "").length > 155) b.push(`opis ${meta.opis.length} znaków (do 155)`);
  const ids = (meta.zrodla ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  for (const id of ids) if (!REJESTR[id]) b.push(`źródło „${id}” nie istnieje w _zrodla.json`);
  if (ids.length < 3) b.push(`źródeł: ${ids.length} (min. 3)`);
  for (const s of (meta.podobne ?? "").split(",").map((x) => x.trim()).filter(Boolean)) if (!slugi.has(s)) b.push(`podobne: nie ma wpisu „${s}”`);
  const slowa = tresc.split(/\s+/).filter(Boolean).length;
  if (slowa < 250 || slowa > 600) b.push(`${slowa} słów (250 do 600)`);
  const calosc = Object.values(meta).join(" ") + " " + tresc;
  if (/[—–]/.test(calosc)) b.push("myślnik w tekście");
  if (/\S - \S/.test(calosc)) b.push("łącznik użyty jak myślnik");
  const ty = calosc.match(/(?<![\p{L}])(ty|ciebie|cię|tobie|twój|twoja|twoje|twojej|twoim|masz|możesz|musisz|chcesz|jesteś)(?![\p{L}])/giu);
  if (ty) b.push(`zwrot na „Ty”: ${[...new Set(ty)].join(", ")}`);
  const sp = calosc.match(/(?<![\p{L}])(sprzeda[\p{L}]*|handlow[\p{L}]*)/giu);
  if (sp) b.push(`temat sprzedaży: ${[...new Set(sp)].join(", ")}`);
  const sk = calosc.match(/(?<![\p{L}])(np\.|m\.in\.|tzw\.|itd\.|itp\.|ok\.|tys\.)(?=\s)/giu);
  if (sk) b.push(`skróty z kropką: ${[...new Set(sk)].join(", ")}`);
  for (const a of tresc.split(/\n\s*\n/)) {
    const l = a.trim();
    if (!l || /^(#|>|\||-|\d+\.|```)/.test(l)) continue;
    if (zdania(l).length > 3 || l.split(/\s+/).length > 45) b.push(`akapit za długi: „${l.slice(0, 50)}…”`);
  }
  if (!/^##\s+Najczęstsze pytania\s*$/m.test(tresc)) b.push("brak sekcji „Najczęstsze pytania”");
  razem += b.length;
  console.log(`${String(b.length).padStart(2)} błędów | ${String(slowa).padStart(3)} słów | ${f}${b.length ? "\n   - " + b.join("\n   - ") : ""}`);
}
console.log(`\nWpisów: ${wpisy.length}. Błędów razem: ${razem}.`);
process.exit(razem ? 1 : 0);
