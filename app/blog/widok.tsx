import Link from "next/link";
import { AUTOR, BAZA, DOMENA, GRUPY, grupa, renderujMarkdown, wariantGrupy, type Artykul, type Grupa } from "@/lib/blog-ai";

// 21.11.2026: klocki bloga w układzie czytelni lovemyself (zwiazki-lp/src/app/blog), tak jak blog Bruno (app/brunoblog/widok.tsx):
// okładka, kafel, wezwanie, pełny tekst (W skrócie, okładka, spis „W tym tekście”, treść, wezwanie, źródła, autor).
// Schema w jednym miejscu: Article z autorem, okruszki, FAQPage tylko gdy tekst ma sekcję pytań.

export const dataPoPolsku = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

/** 1 źródło, 2-4 źródła, 5+ źródeł (12-14 też „źródeł”). */
export function ileZrodel(n: number): string {
  const d = n % 10;
  const r = n % 100;
  return `${n} ${n === 1 ? "źródło" : d >= 2 && d <= 4 && (r < 12 || r > 14) ? "źródła" : "źródeł"}`;
}

export function ileTekstow(n: number): string {
  const d = n % 10;
  const r = n % 100;
  return `${n} ${n === 1 ? "tekst" : d >= 2 && d <= 4 && (r < 12 || r > 14) ? "teksty" : "tekstów"}`;
}

export const adresTekstu = (a: Artykul) => `${BAZA}/${a.slug}`;
export const adresGrupy = (slug: string) => `${BAZA}/temat/${slug}`;

/** Okładka bez zdjęcia: czarna tablica, cienkie linie, smuga światła i numer tekstu. Rysuje CSS. */
export function Okladka({ a, className }: { a: Artykul; className?: string }) {
  return (
    <div className={`bai-okladka bai-okladka-${wariantGrupy(a.grupa)} ${className ?? ""}`} aria-hidden>
      <span className="bai-okladka-nr">{String(a.nr).padStart(2, "0")}</span>
      <span className="bai-okladka-grupa">{grupa(a.grupa)?.nazwa}</span>
    </div>
  );
}

export function Kafel({ a }: { a: Artykul }) {
  return (
    <Link href={adresTekstu(a)} className="bai-kafel">
      <Okladka a={a} className="bai-kafel-okladka" />
      <h3 className="bai-kafel-tytul">{a.tytul}</h3>
      <p className="bai-kafel-opis">{a.opis}</p>
      <p className="bai-mono bai-kafel-meta">
        {a.czas} min{a.zrodla.length ? ` · ${ileZrodel(a.zrodla.length)}` : ""}
      </p>
    </Link>
  );
}

/** Jeden następny krok: rozmowa. Bez przycisku „kup”. */
export function Wezwanie() {
  return (
    <aside className="bai-wezwanie">
      <p className="bai-mono bai-wezwanie-nad">Szkolenie AI dla firm</p>
      <p className="bai-wezwanie-tytul">Jeden dzień warsztatu dla zespołu do 12 osób.</p>
      <p className="bai-wezwanie-tekst">
        Każdy pracuje na swoim laptopie, na zadaniach z firmy. Zespół wychodzi z asystentami AI i zasadami na 1 stronie. Jeśli szkolenie nie pasuje do
        zespołu, mówię to w pierwszej rozmowie.
      </p>
      <div className="bai-akcje">
        <Link href="/#formularz" className="bai-przycisk">
          Sprawdź wolny termin
        </Link>
        <Link href="/#rozklad" className="bai-drugi-link">
          Zobacz rozkład dnia
        </Link>
      </div>
    </aside>
  );
}

export function PozostaleTematy({ bez }: { bez: string }) {
  return (
    <section className="bai-powiazane">
      <h2 className="bai-h2-maly">Pozostałe tematy</h2>
      <div className="bai-tematy">
        {GRUPY.filter((g) => g.slug !== bez).map((g) => (
          <Link key={g.slug} href={adresGrupy(g.slug)} className="bai-temat">
            <span className="bai-temat-nazwa">{g.nazwa}</span>
            <span className="bai-temat-opis">{g.opis}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SchemaTekstu({ a, g }: { a: Artykul; g: Grupa }) {
  const url = `${DOMENA}${adresTekstu(a)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.tytul,
    description: a.opis,
    datePublished: a.data,
    dateModified: a.aktualizacja,
    inLanguage: "pl-PL",
    author: { "@type": "Person", name: AUTOR.imie, url: DOMENA, sameAs: [AUTOR.linkedin] },
    publisher: { "@type": "Person", name: AUTOR.imie, url: DOMENA },
    citation: a.zrodla.map((z) => ({ "@type": "CreativeWork", name: z.nazwa, url: z.url })),
    mainEntityOfPage: url,
  };
  const okruszki = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${DOMENA}${BAZA}` },
      { "@type": "ListItem", position: 2, name: g.nazwa, item: `${DOMENA}${adresGrupy(g.slug)}` },
      { "@type": "ListItem", position: 3, name: a.tytul, item: url },
    ],
  };
  const faqLd = a.faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.pytanie, acceptedAnswer: { "@type": "Answer", text: f.odpowiedz } })),
      }
    : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(okruszki) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
    </>
  );
}

/** Nagłówek tekstu: okruszki, H1, opis, podpis autora, W skrócie. */
export function GlowaTekstu({ a, g }: { a: Artykul; g: Grupa }) {
  return (
    <header className="bai-w3 bai-art-glowa">
      <nav className="bai-mono bai-okruszki">
        <Link href={BAZA}>Blog</Link>
        <span>/</span>
        <Link href={adresGrupy(g.slug)}>{g.nazwa}</Link>
      </nav>
      <h1 className="bai-art-h1">{a.tytul}</h1>
      <p className="bai-art-opis">{a.opis}</p>
      <div className="bai-podpis">
        <img src={AUTOR.miniatura} alt={AUTOR.imie} width={44} height={44} />
        <div>
          <p className="bai-podpis-kto">
            {AUTOR.imie}
            <span>, {AUTOR.tytul}</span>
          </p>
          <p className="bai-podpis-meta">
            <span>{a.czas} min czytania</span>
            {a.zrodla.length > 0 && (
              <>
                <span className="bai-kropka">·</span>
                <span>{ileZrodel(a.zrodla.length)}</span>
              </>
            )}
            <span className="bai-kropka">·</span>
            <time dateTime={a.data}>{dataPoPolsku(a.data)}</time>
            {a.aktualizacja !== a.data && (
              <>
                <span className="bai-kropka">·</span>
                <span>
                  zaktualizowano <time dateTime={a.aktualizacja}>{dataPoPolsku(a.aktualizacja)}</time>
                </span>
              </>
            )}
          </p>
        </div>
      </div>
      {a.tldr && (
        <div className="bai-skrot">
          <p className="bai-mono bai-skrot-etykieta">W skrócie</p>
          <p className="bai-skrot-tekst">{a.tldr}</p>
        </div>
      )}
    </header>
  );
}

/** Ciało tekstu: okładka, spis, treść, wezwanie, źródła, autor. */
export function CialoTekstu({ a }: { a: Artykul }) {
  return (
    <>
      <div className="bai-w5">
        <Okladka a={a} className="bai-art-okladka" />
      </div>
      <div className="bai-w3">
        {a.spis.length > 2 && (
          <details className="bai-spis">
            <summary>
              <span>W tym tekście</span>
              <span className="bai-mono">{a.spis.length} części</span>
            </summary>
            <ol>
              {a.spis.map((h, i) => (
                <li key={h.id}>
                  <span className="bai-mono bai-spis-nr">{String(i + 1).padStart(2, "0")}</span>
                  <a href={`#${h.id}`}>{h.tytul}</a>
                </li>
              ))}
            </ol>
          </details>
        )}

        <article className="bai-tresc" dangerouslySetInnerHTML={{ __html: renderujMarkdown(a.tresc) }} />

        <Wezwanie />

        {a.zrodla.length > 0 && (
          <section className="bai-zrodla">
            <h2 className="bai-h2-maly">Źródła</h2>
            <p className="bai-zrodla-opis">Liczby w tym tekście pochodzą z poniższych źródeł. Linki prowadzą do oryginałów.</p>
            <ol>
              {a.zrodla.map((z, i) => (
                <li key={z.id}>
                  <span className="bai-mono bai-zrodla-nr">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    {z.liczba && <p className="bai-zrodla-liczba">{z.liczba}</p>}
                    <p className="bai-zrodla-teza">{z.teza}</p>
                    <a href={z.url} target="_blank" rel="noopener noreferrer">
                      {z.nazwa}
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="bai-autor">
          <img src={AUTOR.miniatura} alt={AUTOR.imie} width={56} height={56} />
          <div>
            <strong>{AUTOR.imie}</strong>
            <p>{AUTOR.opis}</p>
          </div>
        </div>
      </div>
    </>
  );
}
