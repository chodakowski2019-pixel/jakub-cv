// 17.10 (USER_001): 100 MAŁYCH firm z portalu /praca + publiczny mail kontaktowy z ich strony www, pod test zimnych maili
// (50 z jakubchodakowski.com, 50 z jakub@salesbruno.com). NIC NIE WYSYŁA, tylko CSV.
// Mała firma = 1-3 oferty u nas, nie agencja rekrutacyjna, nie znana duża marka, ma znalezioną stronę (lib/bruno/praca/loga.json).
// Mail: strona główna + /kontakt itp., adres w domenie firmy, bez noreply / rodo / iod / hr.
// Użycie: node --env-file=.env.local scripts/bruno-praca-firmy-maile.mjs [ile=100]
import { readFileSync, writeFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";

const ILE = Number(process.argv[2] ?? 100);
const KORZEN = path.join(import.meta.dirname, "..");
const oferty = JSON.parse(readFileSync(path.join(KORZEN, "lib/bruno/praca/oferty.json"), "utf8"));
const loga = JSON.parse(readFileSync(path.join(KORZEN, "lib/bruno/praca/loga.json"), "utf8"));
const sekret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!sekret) throw new Error("Uruchom z --env-file=.env.local (token linku)");
const token = (klucz) => createHmac("sha256", `praca:${sekret}`).update(klucz).digest("hex").slice(0, 24);

const AGENCJE = /agencj|recruit|rekrut|\bhr\b|randstad|manpower|hays|michael page|adecco|grafton|work service|personnel|staffing|talent|hrk|experts|level work|teamquest|sales hr|antal|devire|people|job|praca|outsourc|centralna baza|urząd pracy|powiatowy/i;
const DUZE = /polpharma|credit agricole|liberty|dpd|rtv euro|obi|leroy|pekao|pko|mbank|santander|allianz|warta|generali|uniqa|prudential|netia|orange|play|t-mobile|plus|polsat|empik|lpp|dino|żabka|zabka|stokrotka|biedronka|lidl|carrefour|auchan|castorama|ikea|provident|alior|millennium|velobank|bank|philips|abb|toyota|huawei|apple|dhl|inpost|olx|pwc|deloitte|kpmg|ey\b|unilever|mondelez|sandoz|krka|berlin-chemie|deichmann|hugo boss|wittchen|columbus|onninen|tadmar|electrolux|ing\b|wolt|glovo|caterpillar|zentiva|bayer|pfizer|novartis|roche|skechers|pernod|pandora|ringier|reynaers|de heus|egis|infor pl|bionorica|polfarmex|action s\.a|bmw|foodcom|lsi software|herkules|bispol|ceneo|wedel|makro/i;
const ZLE_MAILE = /sygnalis|platnosci|kadry|druty|ksiegowosc|faktur|media|press|publisher|support|customer|eshop|sklep|serwis|reklamac|marketing|noreply|no-reply|rodo|iod|gdpr|privacy|dane\.osobowe|abuse|webmaster|hostmaster|postmaster|rekrutacj|kariera|career|praca@|jobs@|hr@|cv@|example|sentry|wixpress|domain\.com|@2x|\.(png|jpg|jpeg|gif|webp|svg)$/i;
const PREF = ["biuro", "kontakt", "info", "office", "sprzedaz", "handel", "sekretariat", "zarzad", "firma", "hello"];

const liczba = {};
for (const o of oferty) (liczba[o.firma] ??= []).push(o);
const kandydaci = Object.entries(liczba)
  .filter(([f, l]) => l.length <= 3 && !/cukiern|optometr|optyk|administracyjno|call center/i.test(l[0].stanowisko) && loga[f]?.domena && !AGENCJE.test(f) && !DUZE.test(f) && !DUZE.test(loga[f].domena))
  .sort((a, b) => b[1][0].dodano.localeCompare(a[1][0].dodano));
console.log(`Kandydatów (małe firmy ze stroną): ${kandydaci.length}`);

async function pobierz(url) {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0 (Macintosh) SalesBrunoPraca/1.0" } });
    if (!r.ok) return "";
    return (await r.text()).slice(0, 400_000);
  } catch {
    return "";
  }
}
function maileZ(html, domena) {
  const d = domena.replace(/^www\./, "");
  const z = new Set();
  const tekst = html.replace(/&#64;|&#x40;|\[at\]|\(at\)| at /gi, "@").replace(/%40/g, "@");
  for (const m of tekst.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) {
    const e = m[0].toLowerCase().replace(/^mailto:/, "").replace(/\.$/, "");
    if (ZLE_MAILE.test(e)) continue;
    const dom = e.split("@")[1];
    // Domena firmy (także poddomena / wariant .pl ↔ .com.pl).
    const rdzen = d.split(".")[0];
    if (dom === d || dom.endsWith(`.${d}`) || dom.split(".")[0] === rdzen) z.add(e);
  }
  return [...z].sort((a, b) => {
    const pa = PREF.findIndex((p) => a.startsWith(`${p}@`));
    const pb = PREF.findIndex((p) => b.startsWith(`${p}@`));
    return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
  });
}

// Czarna lista i klienci (wspólne z kampaniami Gabi: zwiazki-lp/out/*.csv).
const wykluczone = new Set();
const wykluczoneDomeny = new Set();
for (const plik of ["KLIENCI-WYKLUCZENI.csv", "wypisani.csv"]) {
  try {
    const txt = readFileSync(path.join(homedir(), "Moje-Życie/Biznes/Projekty/zwiazki-lp/out", plik), "utf8").toLowerCase();
    for (const e of txt.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) ?? []) wykluczone.add(e);
    for (const d of txt.match(/(?<![@\w.])[a-z0-9-]+\.(pl|com|eu)(?![\w.])/g) ?? []) wykluczoneDomeny.add(d);
  } catch {}
}
console.log(`Czarna lista: ${wykluczone.size} maili, ${wykluczoneDomeny.size} domen`);
const uzyte = new Set();
const wynik = [];
let i = 0;
async function pracownik() {
  while (i < kandydaci.length && wynik.length < ILE) {
    const [firma, lista] = kandydaci[i++];
    const domena = loga[firma].domena.replace(/^www\./, "");
    let maile = [];
    for (const sciezka of ["", "/kontakt", "/kontakt/", "/contact", "/o-nas", "/kontakt.html"]) {
      maile = maileZ(await pobierz(`https://${domena}${sciezka}`), domena);
      if (maile.length) break;
    }
    // 17.10 v2: tylko polskie / unijne skrzynki (obce trafienia: bartleby.com, humangroup.com.co), jeden mail = jedna firma.
    maile = maile.filter((e) => /\.(pl|eu)$/.test(e) && !uzyte.has(e) && !wykluczone.has(e) && !wykluczoneDomeny.has(e.split("@")[1]));
    if (!maile.length || wynik.length >= ILE) continue;
    uzyte.add(maile[0]);
    const o = lista[0];
    wynik.push({
      firma,
      domena,
      email: maile[0],
      inne_maile: maile.slice(1, 3).join(" "),
      ofert: lista.length,
      stanowisko: o.stanowisko,
      miasto: o.miasto || o.wojewodztwo,
      branza: o.branza,
      dodano: o.dodano.slice(0, 10),
      link: `https://salesbruno.com/praca/${o.id}?k=${token(o.klucz)}`,
    });
    process.stdout.write(`\r${wynik.length}/${ILE} (sprawdzone ${i})`);
  }
}
await Promise.all(Array.from({ length: 8 }, pracownik));
wynik.splice(ILE);
// Połowa na jakubchodakowski.com, połowa na jakub@salesbruno.com (naprzemiennie, żeby branże rozłożyły się równo).
wynik.forEach((w, n) => (w.nadawca = n % 2 === 0 ? "hello@jakubchodakowski.com" : "jakub@salesbruno.com"));
const kol = ["nadawca", "firma", "email", "inne_maile", "domena", "stanowisko", "miasto", "branza", "ofert", "dodano", "link"];
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const plik = path.join(homedir(), `Moje-Życie/Biznes/Projekty/SalesAI/sprzedaz/PRACA-FIRMY-${new Date().toISOString().slice(0, 10)}.csv`);
writeFileSync(plik, [kol.join(","), ...wynik.map((w) => kol.map((k) => esc(w[k] ?? "")).join(","))].join("\n") + "\n");
console.log(`\nFirm z mailem: ${wynik.length}. Zapis: ${plik}`);
