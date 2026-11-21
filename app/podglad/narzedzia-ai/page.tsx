import type { Metadata } from "next";
import Link from "next/link";
import { Lista, type Kafel } from "./lista";
import { DOMENA, PODGLAD, STRONA_SZKOLEN } from "@/lib/blog-ai";
import { BAZA_NARZEDZI, CECHY, CENNIKI, kategoria, kategorieZNarzedziami, wszystkieNarzedzia } from "@/lib/narzedzia-ai";

// 21.11.2026 (USER_001): lista narzędzi AI po polsku, budowa jak w katalogach narzędzi: licznik, kategorie,
// filtry (model cenowy i cechy), wyszukiwarka, kafle. Każdy wpis sprawdzony u producenta (lib/narzedzia-ai.ts).
const TYTUL = "Narzędzia AI dla firm: ceny, język polski, dane";
const OPIS = "Katalog narzędzi AI dla firm, po polsku. Przy każdym: cena wersji firmowej, obsługa języka polskiego i zasady dotyczące danych. Sprawdzone u producentów.";

export const metadata: Metadata = {
  title: { absolute: `${TYTUL} | Jakub Chodakowski` },
  description: OPIS,
  ...(PODGLAD ? { robots: { index: false, follow: false } } : { alternates: { canonical: `${DOMENA}${BAZA_NARZEDZI}` } }),
  openGraph: { title: TYTUL, description: OPIS, type: "website", locale: "pl_PL" },
};

const dataPoPolsku = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export default function Page() {
  const wszystkie = wszystkieNarzedzia();
  const kategorie = kategorieZNarzedziami();
  const kafle: Kafel[] = wszystkie.map((n) => ({
    slug: n.slug,
    href: `${BAZA_NARZEDZI}/${n.slug}`,
    nazwa: n.nazwa,
    producent: n.producent,
    kategoria: n.kategoria,
    kategoriaNazwa: kategoria(n.kategoria)?.nazwa ?? "",
    cennik: n.cennik,
    cennikNazwa: CENNIKI[n.cennik],
    cenaOd: n.cenaOd,
    krotko: n.krotko,
    cechy: n.cechy,
  }));
  const cenniki = (Object.keys(CENNIKI) as (keyof typeof CENNIKI)[])
    .map((slug) => ({ slug, nazwa: CENNIKI[slug], ile: wszystkie.filter((n) => n.cennik === slug).length }))
    .filter((c) => c.ile > 0);
  const cechy = (Object.keys(CECHY) as (keyof typeof CECHY)[])
    .map((slug) => ({ slug, nazwa: CECHY[slug], ile: wszystkie.filter((n) => n.cechy.includes(slug)).length }))
    .filter((c) => c.ile > 0);
  const ostatnie = wszystkie.map((n) => n.sprawdzono).sort().at(-1);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TYTUL,
    itemListElement: wszystkie.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n.nazwa, url: `${DOMENA}${BAZA_NARZEDZI}/${n.slug}` })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      {/* ── NAGŁÓWEK ── */}
      <section className="bai-hero">
        <div className="bai-smuga" aria-hidden />
        <div className="bai-w6 bai-hero-wnetrze">
          <p className="bai-mono bai-brow">Narzędzia AI</p>
          <h1 className="bai-h1">
            <span>Narzędzia AI dla firm.</span> <span>Sprawdzone.</span>
          </h1>
          <p className="bai-lead">
            Przy każdym narzędziu trzy rzeczy, o które pyta właściciel firmy: ile kosztuje wersja firmowa, czy działa po polsku i co dzieje się z danymi.
            Każda informacja ma źródło u producenta.
          </p>
          <p className="bai-mono bai-licznik">
            Narzędzia: {wszystkie.length} · Kategorie: {kategorie.length}
            {ostatnie ? ` · Sprawdzono: ${dataPoPolsku(ostatnie)}` : ""}
          </p>
          <div className="bai-akcje">
            <Link href={`${STRONA_SZKOLEN}#formularz`} className="bai-przycisk">
              Sprawdź wolny termin
            </Link>
            <span className="bai-notka">Na szkoleniu pracuję na narzędziach, których firma już używa</span>
          </div>
        </div>
      </section>

      {/* ── KATEGORIE ── */}
      <nav className="bai-pasek">
        <div className="bai-w6 bai-pasek-wnetrze">
          {kategorie.map((k) => (
            <Link key={k.slug} href={`${BAZA_NARZEDZI}/kategoria/${k.slug}`} className="bai-mono bai-pasek-link">
              {k.nazwa} · {k.ile}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── FILTRY I KAFLE ── */}
      <div className="bai-w6 bai-dol">
        <Lista narzedzia={kafle} cenniki={cenniki} cechy={cechy} />
        <p className="bai-katalog-zasada">
          Do katalogu trafiają tylko narzędzia sprawdzone na stronach producentów. Ceny i warunki zmieniają się często, dlatego przy każdym wpisie jest data
          sprawdzenia.
        </p>
      </div>
    </>
  );
}
