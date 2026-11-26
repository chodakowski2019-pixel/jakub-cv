import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOMENA } from "@/lib/blog-ai";
import {
  BAZA_NIERUCHOMOSCI,
  GUS,
  NAZWA_POZIOMU,
  OSTATNI_ROK,
  type Jednostka,
  jednostka,
  liczba,
  polska,
  proc,
  rok,
  tytulJednostki,
  wPowiatachWojewodztwa,
  wojewodztwoJednostki,
  wszystkieJednostki,
  zl,
  zmiana,
} from "@/lib/nieruchomosci/dane";

// 26.11.2026 (USER_001): podstrona miejsca (miasto, powiat, województwo, Polska). Ceny z GUS od 2010, wykres,
// porównanie z województwem i Polską, inne miejsca w województwie.
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return wszystkieJednostki().map((j) => ({ slug: j.slug }));
}

const tytul = (j: Jednostka) => {
  const m2 = rok(j).m2;
  const nazwa = tytulJednostki(j);
  return `Ceny mieszkań ${OSTATNI_ROK}: ${nazwa.charAt(0).toUpperCase()}${nazwa.slice(1)}${m2 ? `, ${zl(m2)} za m²` : ""}`;
};
const opis = (j: Jednostka) => {
  const r = rok(j);
  return `${tytulJednostki(j)}: mediana ceny za m² z transakcji w ${OSTATNI_ROK} roku ${zl(r.m2)} (${proc(zmiana(j))} w rok). Od dewelopera ${zl(r.m2Pierwotny)}, z drugiej ręki ${zl(r.m2Wtorny)}. Dane GUS od 2010.`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const j = jednostka((await params).slug);
  if (!j) return {};
  const url = `${DOMENA}${BAZA_NIERUCHOMOSCI}/${j.slug}`;
  return {
    title: { absolute: tytul(j) },
    description: opis(j),
    alternates: { canonical: url },
    openGraph: { title: tytul(j), description: opis(j), type: "website", url, locale: "pl_PL" },
  };
}

const lataZCena = (j: Jednostka) =>
  Object.keys(j.lata)
    .map(Number)
    .filter((r) => j.lata[r]?.m2)
    .sort((a, b) => a - b);

// Tytuł wykresu = wniosek, nie temat (baza /wizualizacjadanych, zasada 1 i checklista 20).
function wniosekWykresu(j: Jednostka) {
  const lata = lataZCena(j);
  if (lata.length < 2) return `Cena za m² w ${OSTATNI_ROK} roku`;
  const a = j.lata[lata[0]].m2!;
  const b = j.lata[lata.at(-1)!].m2!;
  const z = ((b - a) / a) * 100;
  return `Od ${lata[0]} metr ${z >= 0 ? "podrożał" : "potaniał"} o ${proc(Math.abs(z)).replace("+", "")}: z ${zl(a)} do ${zl(b)}`;
}

function Wykres({ j }: { j: Jednostka }) {
  const lata = lataZCena(j);
  if (lata.length < 2) return null;
  const max = Math.max(...lata.map((r) => j.lata[r].m2!));
  const W = 720;
  const H = 240;
  const dol = 22;
  const gora = 22;
  const krok = W / lata.length;
  const szer = krok * 0.62;
  return (
    <div className="nr-wykres">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${wniosekWykresu(j)}. Mediana ceny za m² w latach ${lata[0]}-${lata.at(-1)}, GUS.`}>
        {lata.map((r, i) => {
          const v = j.lata[r].m2!;
          const h = ((H - dol - gora) * v) / max;
          const x = i * krok + (krok - szer) / 2;
          const y = H - dol - h;
          const ostatni = i === lata.length - 1;
          return (
            <g key={r}>
              <rect x={x} y={y} width={szer} height={h} rx={2} className={ostatni ? "nr-slupek nr-slupek-ostatni" : "nr-slupek"}>
                <title>{`${r}: ${zl(v)}`}</title>
              </rect>
              <text x={x + szer / 2} y={H - 6} textAnchor="middle">
                {`'${String(r).slice(2)}`}
              </text>
              {i === 0 || ostatni ? (
                <text x={ostatni ? x + szer : x} y={y - 6} textAnchor={ostatni ? "end" : "start"} className="nr-wartosc">
                  {(v / 1000).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} tys. zł
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default async function Page({ params }: Props) {
  const j = jednostka((await params).slug);
  if (!j) notFound();
  const r = rok(j);
  const pl = polska();
  const woj = j.poziom === "miasto" || j.poziom === "powiat" ? wojewodztwoJednostki(j) : undefined;
  const lata = Object.keys(j.lata).map(Number).sort((a, b) => b - a);
  const rok10 = OSTATNI_ROK - 10;
  const zmiana10 = r.m2 && j.lata[rok10]?.m2 ? ((r.m2 - j.lata[rok10].m2!) / j.lata[rok10].m2!) * 100 : null;
  const sasiedzi = (j.poziom === "wojewodztwo" ? wPowiatachWojewodztwa(j.nazwa) : j.wojewodztwo ? wPowiatachWojewodztwa(j.wojewodztwo) : wszystkieJednostki().filter((x) => x.poziom === "wojewodztwo"))
    .filter((x) => x.slug !== j.slug && rok(x).m2)
    .sort((a, b) => rok(b).m2! - rok(a).m2!);
  const porownanie = [j, ...(woj ? [woj] : []), ...(j.slug === "polska" ? [] : [pl])];
  const url = `${DOMENA}${BAZA_NIERUCHOMOSCI}/${j.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: tytul(j),
    description: opis(j),
    url,
    inLanguage: "pl-PL",
    spatialCoverage: { "@type": "Place", name: tytulJednostki(j) },
    temporalCoverage: `${lata.at(-1)}/${lata[0]}`,
    dateModified: GUS.pobrano,
    isBasedOn: "https://bdl.stat.gov.pl",
    creator: { "@type": "Person", name: "Jakub Chodakowski", url: DOMENA },
  };
  const okruszki = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ceny mieszkań", item: `${DOMENA}${BAZA_NIERUCHOMOSCI}` },
      { "@type": "ListItem", position: 2, name: tytulJednostki(j), item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(okruszki) }} />

      <section className="bai-hero">
        <div className="bai-smuga" aria-hidden />
        <div className="bai-w6 bai-hero-wnetrze">
          <p className="bai-mono bai-brow">
            <Link href={BAZA_NIERUCHOMOSCI}>Ceny mieszkań</Link> · {NAZWA_POZIOMU[j.poziom]}
            {j.wojewodztwo ? ` · woj. ${j.wojewodztwo}` : ""}
          </p>
          <h1 className="bai-h1 bai-h1-temat">
            <span>{j.poziom === "wojewodztwo" ? `Województwo ${j.nazwa}` : j.nazwa}.</span> <span>Ceny mieszkań {OSTATNI_ROK}.</span>
          </h1>
          <p className="bai-lead">
            {r.m2
              ? `Połowa mieszkań sprzedała się drożej niż ${zl(r.m2)} za metr, połowa taniej. To ${proc(zmiana(j))} w rok${zmiana10 != null ? ` i ${proc(zmiana10)} w 10 lat` : ""}. Mieszkanie 50 m² po takiej cenie kosztuje ${zl(Math.round((r.m2 * 50) / 1000) * 1000)}.`
              : `GUS nie podał mediany ceny za ${OSTATNI_ROK} rok dla tego miejsca.`}
          </p>
          <div className="nr-liczby">
            <div className="nr-liczba">
              <p className="bai-mono">Cena za m² {OSTATNI_ROK}</p>
              <p className="nr-liczba-wartosc">{zl(r.m2)}</p>
              <p className="nr-liczba-pod">{proc(zmiana(j))} w rok</p>
            </div>
            <div className="nr-liczba">
              <p className="bai-mono">Od dewelopera</p>
              <p className="nr-liczba-wartosc">{zl(r.m2Pierwotny)}</p>
              <p className="nr-liczba-pod">rynek pierwotny</p>
            </div>
            <div className="nr-liczba">
              <p className="bai-mono">Z drugiej ręki</p>
              <p className="nr-liczba-wartosc">{zl(r.m2Wtorny)}</p>
              <p className="nr-liczba-pod">rynek wtórny</p>
            </div>
            <div className="nr-liczba">
              <p className="bai-mono">Sprzedane mieszkania</p>
              <p className="nr-liczba-wartosc">{liczba(r.transakcje)}</p>
              <p className="nr-liczba-pod">w {OSTATNI_ROK} roku</p>
            </div>
          </div>
        </div>
      </section>

      <div className="bai-w6 bai-dol">
        <section className="bai-sekcja">
          <h2 className="bai-h2">{wniosekWykresu(j)}</h2>
          <p className="bai-pytanie">Mediana ceny za m² z transakcji, rok po roku. Na limonkowo {OSTATNI_ROK}.</p>
          <Wykres j={j} />
        </section>

        {porownanie.length > 1 ? (
          <section className="bai-sekcja">
            <h2 className="bai-h2">Na tle {woj ? "województwa i Polski" : "Polski"}</h2>
            <div className="bai-tabela">
              <table>
                <thead>
                  <tr>
                    <th>Miejsce</th>
                    <th className="nr-num">Cena za m²</th>
                    <th className="nr-num">Zmiana w rok</th>
                    <th className="nr-num">Od dewelopera</th>
                    <th className="nr-num">Z drugiej ręki</th>
                  </tr>
                </thead>
                <tbody>
                  {porownanie.map((x) => (
                    <tr key={x.slug}>
                      <td>{x.slug === j.slug ? tytulJednostki(x) : <Link href={`${BAZA_NIERUCHOMOSCI}/${x.slug}`}>{tytulJednostki(x)}</Link>}</td>
                      <td className="nr-num">{zl(rok(x).m2)}</td>
                      <td className="nr-num">{proc(zmiana(x))}</td>
                      <td className="nr-num">{zl(rok(x).m2Pierwotny)}</td>
                      <td className="nr-num">{zl(rok(x).m2Wtorny)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="bai-sekcja">
          <h2 className="bai-h2">Rok po roku</h2>
          <div className="bai-tabela">
            <table>
              <thead>
                <tr>
                  <th>Rok</th>
                  <th className="nr-num">Cena za m²</th>
                  <th className="nr-num">Zmiana</th>
                  <th className="nr-num">Od dewelopera</th>
                  <th className="nr-num">Z drugiej ręki</th>
                  <th className="nr-num">Sprzedane</th>
                </tr>
              </thead>
              <tbody>
                {lata.map((rr) => {
                  const z = zmiana(j, rr);
                  return (
                    <tr key={rr}>
                      <td>{rr}</td>
                      <td className="nr-num">{zl(j.lata[rr].m2)}</td>
                      <td className={`nr-num ${z == null ? "" : z >= 0 ? "nr-plus" : "nr-minus"}`}>{proc(z)}</td>
                      <td className="nr-num">{zl(j.lata[rr].m2Pierwotny)}</td>
                      <td className="nr-num">{zl(j.lata[rr].m2Wtorny)}</td>
                      <td className="nr-num">{liczba(j.lata[rr].transakcje)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="nr-zrodlo">
            Źródło: <a href="https://bdl.stat.gov.pl" target="_blank" rel="noopener">GUS, Bank Danych Lokalnych</a>, mediana ceny za 1 m² lokali mieszkalnych sprzedanych w ramach transakcji rynkowych.
          </p>
        </section>

        {sasiedzi.length ? (
          <section className="bai-sekcja">
            <h2 className="bai-h2">{j.poziom === "kraj" ? "Województwa" : `Inne miejsca, woj. ${j.wojewodztwo ?? j.nazwa}`}</h2>
            <div className="bai-tabela">
              <table>
                <thead>
                  <tr>
                    <th>Miejsce</th>
                    <th className="nr-num">Cena za m² {OSTATNI_ROK}</th>
                    <th className="nr-num">Zmiana w rok</th>
                  </tr>
                </thead>
                <tbody>
                  {sasiedzi.map((x) => (
                    <tr key={x.slug}>
                      <td>
                        <Link href={`${BAZA_NIERUCHOMOSCI}/${x.slug}`}>{tytulJednostki(x)}</Link>
                      </td>
                      <td className="nr-num">{zl(rok(x).m2)}</td>
                      <td className="nr-num">{proc(zmiana(x))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
