// 26.11.2026 (USER_001: „mapa 3D Polski”): granice powiatów i województw → lib/nieruchomosci/mapa.json.
// Źródło granic: PRG (GUGiK) w wersji uproszczonej z github.com/ppatrzyk/polska-geojson (powiaty-min, wojewodztwa-min).
// Uruchom: node scripts/nieruchomosci-mapa.mjs <powiaty-min.geojson> <wojewodztwa-min.geojson>
// Współrzędne: km od środka Polski (19,4°E, 52°N), prosta projekcja z cos(52°). Wystarczy do bryły 3D.
import { readFileSync, writeFileSync } from "node:fs";

const [plikPowiaty, plikWoj] = process.argv.slice(2);
if (!plikPowiaty || !plikWoj) throw new Error("podaj pliki powiatów i województw");
const powiaty = JSON.parse(readFileSync(plikPowiaty, "utf8")).features;
const woj = JSON.parse(readFileSync(plikWoj, "utf8")).features;
const gus = JSON.parse(readFileSync("lib/nieruchomosci/gus.json", "utf8")).jednostki;

const LON0 = 19.4, LAT0 = 52, KX = 111.32 * Math.cos((LAT0 * Math.PI) / 180), KY = 110.57;
const rzut = ([lon, lat]) => [Math.round((lon - LON0) * KX * 10) / 10, Math.round((lat - LAT0) * KY * 10) / 10];
const wielokaty = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);

function wSrodku([x, y], pierscien) {
  let w = false;
  for (let i = 0, j = pierscien.length - 1; i < pierscien.length; j = i++) {
    const [xi, yi] = pierscien[i], [xj, yj] = pierscien[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) w = !w;
  }
  return w;
}
const srodek = (pierscien) => {
  const n = pierscien.length;
  return [pierscien.reduce((s, p) => s + p[0], 0) / n, pierscien.reduce((s, p) => s + p[1], 0) / n];
};
const wojDla = (punkt) => woj.find((w) => wielokaty(w.geometry).some((p) => wSrodku(punkt, p[0])))?.properties.nazwa ?? null;

const bezNazwy = [];
const wynik = [];
for (const f of powiaty) {
  const nazwaGeo = f.properties.nazwa;
  const miasto = /^powiat [A-ZŁŚŻŹĆ]/.test(nazwaGeo);
  // GUS: powiat jeleniogórski = od 2021 powiat karkonoski.
  const nazwa = miasto ? nazwaGeo.slice(7) : nazwaGeo === "powiat jeleniogórski" ? "powiat karkonoski" : nazwaGeo;
  const najwiekszy = wielokaty(f.geometry).sort((a, b) => b[0].length - a[0].length)[0][0];
  const w = wojDla(srodek(najwiekszy));
  const kandydaci = gus.filter((j) => (miasto ? j.poziom === "miasto" : j.poziom === "powiat") && j.nazwa === nazwa);
  const j = kandydaci.length === 1 ? kandydaci[0] : kandydaci.find((k) => k.wojewodztwo === w);
  if (!j) { bezNazwy.push(`${nazwaGeo} (${w})`); continue; }
  wynik.push({ slug: j.slug, p: wielokaty(f.geometry).map((p) => p.map((r) => r.map(rzut).flat())) });
}
const kontury = woj.map((w) => ({ nazwa: w.properties.nazwa, p: wielokaty(w.geometry).map((p) => p[0].map(rzut).flat()) }));

writeFileSync("lib/nieruchomosci/mapa.json", JSON.stringify({ zrodlo: "PRG GUGiK, uproszczone (ppatrzyk/polska-geojson)", powiaty: wynik, wojewodztwa: kontury }));
console.log(`powiaty: ${wynik.length}/${powiaty.length}, bez dopasowania: ${bezNazwy.join(", ") || "0"}`);
const slugi = new Set(wynik.map((x) => x.slug));
console.log("powtórzone slugi:", wynik.length - slugi.size);
