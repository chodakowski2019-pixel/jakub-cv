import Link from "next/link";
import s from "./blog.module.css";
import { DOMENA_BLOGA, GRUPY, grupa, kolorGrupy, renderujMarkdown, type Artykul, type Grupa } from "@/lib/bruno/blog";

// 31.10: klocki bloga 1:1 z czytelni lovemyself (zwiazki-lp/src/app/blog): okładka, kafel, wezwanie, pełny tekst
// artykułu (W skrócie, okładka, spis „W tym tekście”, treść, wezwanie, źródła, autor). Schema w jednym miejscu:
// Article (autor = Jakub Chodakowski, E-E-A-T), okruszki, FAQPage tylko gdy jest sekcja pytań.

const data = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
const OKLADKI = { 1: s.og1, 2: s.og2, 3: s.og3 } as const;

/** 1 źródło, 2-4 źródła, 5+ źródeł (12-14 też „źródeł”). */
export function ileZrodel(n: number): string {
  const d = n % 10;
  const r = n % 100;
  return `${n} ${n === 1 ? "źródło" : d >= 2 && d <= 4 && (r < 12 || r > 14) ? "źródła" : "źródeł"}`;
}

/** Okładka bez zdjęcia: gradient grupy + nazwa grupy. */
export function Okladka({ grupaSlug, className }: { grupaSlug: string; className: string }) {
  return (
    <div className={`${s.okladka} ${OKLADKI[kolorGrupy(grupaSlug)]} ${className}`} aria-hidden>
      <span>{grupa(grupaSlug)?.nazwa}</span>
    </div>
  );
}

/** Adres tekstu: strona główna grupy ma /blog/temat/<grupa>, artykuł /blog/<slug>. */
export const adresTekstu = (a: Artykul, pillar?: boolean) => (pillar ? `/blog/temat/${a.grupa}` : `/blog/${a.slug}`);

export function Kafel({ a, pillar }: { a: Artykul; pillar?: boolean }) {
  return (
    <Link href={adresTekstu(a, pillar)} className={s.grupaLink}>
      <Okladka grupaSlug={a.grupa} className={s.kafelOkladka} />
      <h3 className={`${s.display} ${s.kafelTytul}`}>{a.tytul}</h3>
      <p className={s.kafelOpis}>{a.opis}</p>
      <p className={s.kafelMeta}>
        {a.czas} min{a.zrodla.length ? ` · ${ileZrodel(a.zrodla.length)}` : ""}
      </p>
    </Link>
  );
}

export function Wezwanie({ g }: { g: Grupa }) {
  return (
    <aside className={s.wezwanie}>
      <p className={`${s.display} ${s.wezwanieTytul}`}>{g.wezwanie.tytul}</p>
      <p className={s.wezwanieTekst}>{g.wezwanie.tekst}</p>
      <div className={s.akcje} style={{ marginTop: 24 }}>
        <Link href={g.wezwanie.href} className={s.przycisk}>
          {g.wezwanie.przycisk}
        </Link>
        {g.wezwanie.href !== "/kursy" && (
          <Link href="/kursy" className={s.drugiLink}>
            Zobacz kursy sprzedaży
          </Link>
        )}
      </div>
    </aside>
  );
}

export function PozostaleTematy({ bez }: { bez: string }) {
  return (
    <section className={s.powiazane} style={{ marginBottom: 0 }}>
      <h2 className={`${s.display} ${s.h2Maly}`}>Pozostałe tematy</h2>
      <div className={s.pigulki}>
        {GRUPY.filter((g) => g.slug !== bez).map((g) => (
          <Link key={g.slug} href={`/blog/temat/${g.slug}`} className={s.pigulka}>
            {g.nazwa}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SchemaTekstu({ a, g, pillar }: { a: Artykul; g: Grupa; pillar?: boolean }) {
  const url = `${DOMENA_BLOGA}${adresTekstu(a, pillar)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.tytul,
    description: a.opis,
    datePublished: a.data,
    dateModified: a.aktualizacja,
    inLanguage: "pl-PL",
    author: { "@type": "Person", name: "Jakub Chodakowski", url: "https://jakubchodakowski.com" },
    publisher: { "@type": "Organization", name: "Bruno AI", url: DOMENA_BLOGA, logo: `${DOMENA_BLOGA}/bruno/ikona-96.png` },
    citation: a.zrodla.map((z) => ({ "@type": "CreativeWork", name: z.nazwa, url: z.url })),
    mainEntityOfPage: url,
  };
  const okruszki = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blog", item: `${DOMENA_BLOGA}/blog` },
      { "@type": "ListItem", position: 2, name: g.nazwa, item: `${DOMENA_BLOGA}/blog/temat/${g.slug}` },
      ...(pillar ? [] : [{ "@type": "ListItem", position: 3, name: a.tytul, item: url }]),
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

/** Nagłówek tekstu: okruszki, H1, opis, meta, W skrócie. */
export function GlowaTekstu({ a, g, pillar }: { a: Artykul; g: Grupa; pillar?: boolean }) {
  return (
    <header className={`${s.w3} ${s.artGlowa}`}>
      <nav className={s.okruszki}>
        <Link href="/blog">Blog</Link>
        {!pillar && (
          <>
            <span>/</span>
            <Link href={`/blog/temat/${g.slug}`}>{g.nazwa}</Link>
          </>
        )}
      </nav>
      <h1 className={`${s.display} ${s.artH1}`}>{a.tytul}</h1>
      <p className={s.artOpis}>{a.opis}</p>
      <div className={s.meta}>
        <span>Jakub Chodakowski</span>
        <span className={s.kropka}>·</span>
        <span>{a.czas} min czytania</span>
        {a.zrodla.length > 0 && (
          <>
            <span className={s.kropka}>·</span>
            <span>{ileZrodel(a.zrodla.length)}</span>
          </>
        )}
        <span className={s.kropka}>·</span>
        <time dateTime={a.data}>{data(a.data)}</time>
        {a.aktualizacja !== a.data && (
          <>
            <span className={s.kropka}>·</span>
            <span>
              zaktualizowano <time dateTime={a.aktualizacja}>{data(a.aktualizacja)}</time>
            </span>
          </>
        )}
      </div>
      {a.tldr && (
        <div className={s.skrot}>
          <p className={s.skrotEtykieta}>W skrócie</p>
          <p className={s.skrotTekst}>{a.tldr}</p>
        </div>
      )}
    </header>
  );
}

/** Ciało tekstu: okładka, spis, treść, wezwanie, źródła, autor. */
export function CialoTekstu({ a, g, bezOkladki }: { a: Artykul; g: Grupa; bezOkladki?: boolean }) {
  return (
    <>
      {!bezOkladki && (
        <div className={s.w5}>
          <Okladka grupaSlug={g.slug} className={s.artOkladka} />
        </div>
      )}
      <div className={s.w3}>
        {a.spis.length > 2 && (
          <nav className={`${s.karta} ${s.spis}`}>
            <p className={s.spisEtykieta}>W tym tekście</p>
            <ol>
              {a.spis.map((h, i) => (
                <li key={h.id}>
                  <span className={s.spisNr}>{String(i + 1).padStart(2, "0")}</span>
                  <a href={`#${h.id}`}>{h.tytul}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <article className={s.tresc} dangerouslySetInnerHTML={{ __html: renderujMarkdown(a.tresc) }} />

        <Wezwanie g={g} />

        {a.zrodla.length > 0 && (
          <section className={`${s.karta} ${s.zrodla}`}>
            <h2 className={s.display}>Źródła</h2>
            <p className={s.zrodlaOpis}>Liczby w tym tekście pochodzą z poniższych źródeł. Linki prowadzą do oryginałów.</p>
            <ol>
              {a.zrodla.map((z, i) => (
                <li key={z.url}>
                  <span className={s.zrodlaNr}>{i + 1}</span>
                  <div>
                    {z.liczba && <p className={`${s.display}`} style={{ margin: 0, fontSize: "1.5rem", color: "var(--marka)" }}>{z.liczba}</p>}
                    <p className={s.zrodlaTeza}>{z.teza}</p>
                    <a href={z.url} target="_blank" rel="noopener noreferrer">
                      {z.nazwa}
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className={s.autor}>
          <img src="/jakub-224.jpg" alt="Jakub Chodakowski" width={56} height={56} />
          <div>
            <strong>Jakub Chodakowski</strong>
            <br />
            Twórca Bruno AI, trenera sprzedaży, z którym handlowcy ćwiczą rozmowy z klientem głosem.
          </div>
        </div>
      </div>
    </>
  );
}
