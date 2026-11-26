import type { Metadata } from "next";
import { Mapa3D, type Ceny } from "./mapa-3d";
import { Mieszkanie3D, type Miasto } from "./mieszkanie-3d";
import { Tabela, type Wiersz } from "./tabela";
import { DOMENA } from "@/lib/blog-ai";
import { BAZA_NIERUCHOMOSCI, GUS, OSTATNI_ROK, jednostka, polska, rok, wszystkieJednostki, zmiana } from "@/lib/nieruchomosci/dane";

// 26.11.2026 (USER_001): projekt Nieruchomości. Wersja 2 tego samego dnia: „mało tekstu i liczb, wszystko zwizualizowane,
// mapa 3D Polski, mieszkanie 3D”. Na górze mapa 3D powiatów (lata 2010-2025), potem mieszkanie 3D „ile metrów za te same pieniądze”,
// tabela zwinięta na dole (dla szukających swojej liczby i dla Google).
const TYTUL = `Ceny mieszkań w Polsce ${OSTATNI_ROK}: mapa 3D każdego powiatu`;
const OPIS = `Mapa 3D Polski: cena metra mieszkania w każdym z 380 powiatów, rok po roku od 2010. Mediana cen z transakcji według GUS.`;

export const metadata: Metadata = {
  title: { absolute: `${TYTUL} | Jakub Chodakowski` },
  description: OPIS,
  alternates: { canonical: `${DOMENA}${BAZA_NIERUCHOMOSCI}` },
  openGraph: { title: TYTUL, description: OPIS, type: "website", locale: "pl_PL" },
};

const LATA = Array.from({ length: OSTATNI_ROK - 2010 + 1 }, (_, i) => 2010 + i);
const MIASTA_MIESZKANIE = ["warszawa", "krakow", "gdansk", "wroclaw", "poznan", "lodz", "katowice", "lublin", "polska"];

export default function Page() {
  const pl = polska();
  const pierwszy = pl.lata[String(LATA[0])]?.m2;
  const ostatni = rok(pl).m2;
  const razy = pierwszy && ostatni ? (ostatni / pierwszy).toLocaleString("pl-PL", { maximumFractionDigits: 1 }) : null;

  const lokalne = wszystkieJednostki().filter((j) => j.poziom === "miasto" || j.poziom === "powiat");
  const ceny: Ceny = Object.fromEntries(lokalne.map((j) => [j.slug, { nazwa: j.nazwa, m2: LATA.map((r) => j.lata[String(r)]?.m2 ?? null) }]));
  const miasta: Miasto[] = MIASTA_MIESZKANIE.map((s) => jednostka(s))
    .filter((j) => j !== undefined && rok(j).m2)
    .map((j) => ({ slug: j!.slug, nazwa: j!.nazwa, m2: rok(j!).m2! }));

  const wiersze: Wiersz[] = wszystkieJednostki()
    .filter((j) => j.poziom !== "kraj")
    .map((j) => {
      const r = rok(j);
      return {
        slug: j.slug,
        nazwa: j.nazwa,
        poziom: j.poziom as Wiersz["poziom"],
        wojewodztwo: j.wojewodztwo,
        m2: r.m2 ?? null,
        zmiana: zmiana(j),
        pierwotny: r.m2Pierwotny ?? null,
        wtorny: r.m2Wtorny ?? null,
        transakcje: r.transakcje ?? null,
      };
    });

  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: TYTUL,
    description: OPIS,
    url: `${DOMENA}${BAZA_NIERUCHOMOSCI}`,
    inLanguage: "pl-PL",
    spatialCoverage: "Polska",
    temporalCoverage: `2010/${OSTATNI_ROK}`,
    dateModified: GUS.pobrano,
    isBasedOn: "https://bdl.stat.gov.pl",
    creator: { "@type": "Person", name: "Jakub Chodakowski", url: DOMENA },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />

      <section className="nr-tablica">
        <div className="nr-tablica-glowa">
          <div className="bai-w6">
            <p className="bai-mono bai-brow">Ceny mieszkań · GUS · 2010-{OSTATNI_ROK}</p>
            <h1 className="nr-tablica-tytul">
              {razy ? (
                <>
                  Od 2010 metr mieszkania w Polsce podrożał <em>{razy} raza</em>.
                </>
              ) : (
                "Ceny mieszkań w Polsce"
              )}
            </h1>
          </div>
        </div>
        <Mapa3D ceny={ceny} lata={LATA} baza={BAZA_NIERUCHOMOSCI} />
      </section>

      <section className="nr-tablica" style={{ borderTop: "1px solid rgba(244,244,242,0.12)" }}>
        <div className="bai-w6 nrm">
          <h2 className="nr-tablica-tytul">Za te same pieniądze.</h2>
          <Mieszkanie3D miasta={miasta} rok={OSTATNI_ROK} />
        </div>
      </section>

      <div className="bai-w6 bai-dol">
        <details className="nr-wszystkie">
          <summary>Wszystkie miejsca · {wiersze.length}</summary>
          <Tabela wiersze={wiersze} baza={BAZA_NIERUCHOMOSCI} rok={OSTATNI_ROK} />
        </details>
        <p className="nr-zrodlo">
          Dane: <a href="https://bdl.stat.gov.pl" target="_blank" rel="noopener">GUS, Bank Danych Lokalnych</a> (mediana ceny za m² z transakcji
          rynkowych). Granice: PRG, GUGiK.
        </p>
      </div>
    </>
  );
}
