import type { Metadata } from "next";
import { Tabela, type Wiersz } from "./tabela";
import { DOMENA } from "@/lib/blog-ai";
import { BAZA_NIERUCHOMOSCI, GUS, OSTATNI_ROK, ZRODLA, polska, proc, rok, wszystkieJednostki, zl, zmiana } from "@/lib/nieruchomosci/dane";

// 26.11.2026 (USER_001): start projektu Nieruchomości. Ceny mieszkań z prawdziwych transakcji (GUS) dla każdego miasta,
// powiatu i województwa, każde miejsce ma własną podstronę. Kolejne źródła danych: lista ZRODLA w lib/nieruchomosci/dane.ts.
const TYTUL = `Ceny mieszkań w Polsce ${OSTATNI_ROK}: każde miasto i powiat`;
const OPIS = `Ile kosztuje metr mieszkania w Twoim mieście. Mediana cen z transakcji rynkowych według GUS, rynek pierwotny i wtórny, 380 powiatów, lata 2010-${OSTATNI_ROK}.`;

export const metadata: Metadata = {
  title: { absolute: `${TYTUL} | Jakub Chodakowski` },
  description: OPIS,
  alternates: { canonical: `${DOMENA}${BAZA_NIERUCHOMOSCI}` },
  openGraph: { title: TYTUL, description: OPIS, type: "website", locale: "pl_PL" },
};

export default function Page() {
  const pl = polska();
  const teraz = rok(pl);
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
  const miasta = wiersze.filter((w) => w.poziom === "miasto" && w.m2 != null).sort((a, b) => b.m2! - a.m2!);

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

      <section className="bai-hero">
        <div className="bai-smuga" aria-hidden />
        <div className="bai-w6 bai-hero-wnetrze">
          <p className="bai-mono bai-brow">Nieruchomości · dane publiczne</p>
          <h1 className="bai-h1">
            <span>Ceny mieszkań w Polsce.</span> <span>Z prawdziwych transakcji.</span>
          </h1>
          <p className="bai-lead">
            Ile naprawdę płacą ludzie za metr mieszkania w każdym mieście i powiecie. Ceny z umów sprzedaży, nie z ogłoszeń. Źródło: GUS.
          </p>
          <div className="nr-liczby">
            <div className="nr-liczba">
              <p className="bai-mono">Polska, cena za m² {OSTATNI_ROK}</p>
              <p className="nr-liczba-wartosc">{zl(teraz.m2)}</p>
              <p className="nr-liczba-pod">{proc(zmiana(pl))} w rok</p>
            </div>
            <div className="nr-liczba">
              <p className="bai-mono">Od dewelopera</p>
              <p className="nr-liczba-wartosc">{zl(teraz.m2Pierwotny)}</p>
              <p className="nr-liczba-pod">rynek pierwotny</p>
            </div>
            <div className="nr-liczba">
              <p className="bai-mono">Z drugiej ręki</p>
              <p className="nr-liczba-wartosc">{zl(teraz.m2Wtorny)}</p>
              <p className="nr-liczba-pod">rynek wtórny</p>
            </div>
            <div className="nr-liczba">
              <p className="bai-mono">Najdrożej</p>
              <p className="nr-liczba-wartosc">{miasta[0]?.nazwa}</p>
              <p className="nr-liczba-pod">{zl(miasta[0]?.m2 ?? undefined)} za m²</p>
            </div>
          </div>
        </div>
      </section>

      <div className="bai-w6 bai-dol">
        <section className="bai-sekcja">
          <h2 className="bai-h2">Cena za metr w każdym miejscu</h2>
          <p className="bai-pytanie">Mediana, czyli połowa mieszkań sprzedała się taniej, połowa drożej. Kliknij nazwę, żeby zobaczyć ceny od 2010 roku.</p>
          <Tabela wiersze={wiersze} baza={BAZA_NIERUCHOMOSCI} rok={OSTATNI_ROK} />
          <p className="nr-zrodlo">
            Źródło: <a href="https://bdl.stat.gov.pl" target="_blank" rel="noopener">GUS, Bank Danych Lokalnych</a>, transakcje rynkowe lokali mieszkalnych. Pobrano{" "}
            {new Date(GUS.pobrano).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
        </section>

        <section className="bai-sekcja">
          <h2 className="bai-h2">Skąd są dane</h2>
          <p className="bai-pytanie">Tylko publiczne rejestry państwowe. Kolejne źródła dochodzą na tę stronę.</p>
          <div className="bai-tabela">
            <table>
              <thead>
                <tr>
                  <th>Źródło</th>
                  <th>Co zawiera</th>
                  <th>Stan</th>
                </tr>
              </thead>
              <tbody>
                {ZRODLA.map((z) => (
                  <tr key={z.nazwa}>
                    <td>
                      <a href={z.url} target="_blank" rel="noopener">
                        {z.nazwa}
                      </a>
                    </td>
                    <td>{z.co}</td>
                    <td className={z.stan === "na stronie" ? "nr-stan-na" : undefined}>{z.stan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
