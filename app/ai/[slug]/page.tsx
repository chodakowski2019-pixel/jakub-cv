import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Wezwanie, ileZrodel } from "../../blog/widok";
import { AUTOR, BAZA, DOMENA, PODGLAD, artykul as tekstBloga, renderujMarkdown } from "@/lib/blog-ai";
import { BAZA_NARZEDZI, CECHY, CENNIKI, kategoria, narzedzie, wszystkieNarzedzia } from "@/lib/narzedzia-ai";

// Podstrona narzędzia: fakty sprawdzone u producenta (tabliczka), opis pisany pod polską firmę, pytania, źródła,
// podobne narzędzia. Budowa wzorowana na katalogach narzędzi, treść własna i inna dla każdego wpisu.
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return wszystkieNarzedzia().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = narzedzie((await params).slug);
  if (!n) return {};
  const url = `${DOMENA}${BAZA_NARZEDZI}/${n.slug}`;
  return {
    title: { absolute: n.tytul },
    description: n.opis,
    ...(PODGLAD ? { robots: { index: false, follow: false } } : { alternates: { canonical: url } }),
    openGraph: { title: n.tytul, description: n.opis, type: "article", modifiedTime: n.sprawdzono, url, locale: "pl_PL" },
    twitter: { card: "summary_large_image", title: n.tytul, description: n.opis },
  };
}

const dataPoPolsku = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export default async function Page({ params }: Props) {
  const n = narzedzie((await params).slug);
  const k = n && kategoria(n.kategoria);
  if (!n || !k) notFound();
  const podobne = n.podobne.map((s) => narzedzie(s)).filter((x) => x !== undefined);
  const tekst = n.artykul ? tekstBloga(n.artykul) : undefined;
  const url = `${DOMENA}${BAZA_NARZEDZI}/${n.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: n.nazwa,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: n.opis,
    url: n.strona,
    creator: { "@type": "Organization", name: n.producent },
    dateModified: n.sprawdzono,
    inLanguage: "pl-PL",
    mainEntityOfPage: url,
    author: { "@type": "Person", name: AUTOR.imie, url: DOMENA },
    citation: n.zrodla.map((z) => ({ "@type": "CreativeWork", name: z.nazwa, url: z.url })),
  };
  const okruszki = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Narzędzia AI", item: `${DOMENA}${BAZA_NARZEDZI}` },
      { "@type": "ListItem", position: 2, name: k.nazwa, item: `${DOMENA}${BAZA_NARZEDZI}/kategoria/${k.slug}` },
      { "@type": "ListItem", position: 3, name: n.nazwa, item: url },
    ],
  };
  const faqLd = n.faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: n.faq.map((f) => ({ "@type": "Question", name: f.pytanie, acceptedAnswer: { "@type": "Answer", text: f.odpowiedz } })),
      }
    : null;

  const fakty: [string, string][] = [
    ["Producent", n.producent],
    ["Model cenowy", CENNIKI[n.cennik]],
    ["Cena od", n.cenaOd],
    ["Plan dla firm", n.planFirmowy],
    ["Język polski", n.poPolsku],
    ["Dane firmy", n.dane],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(okruszki) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <header className="bai-w3 bai-art-glowa">
        <nav className="bai-mono bai-okruszki">
          <Link href={BAZA_NARZEDZI}>Narzędzia AI</Link>
          <span>/</span>
          <Link href={`${BAZA_NARZEDZI}/kategoria/${k.slug}`}>{k.nazwa}</Link>
        </nav>
        <div className="bai-narzedzie-tytul">
          <span className="bai-znak bai-znak-duzy" aria-hidden>
            {n.nazwa.slice(0, 2)}
          </span>
          <h1 className="bai-art-h1">{n.tytul}</h1>
        </div>
        <p className="bai-art-opis">{n.opis}</p>
        <p className="bai-mono bai-sprawdzono">
          Sprawdzono u producenta: <time dateTime={n.sprawdzono}>{dataPoPolsku(n.sprawdzono)}</time>
          {n.zrodla.length > 0 ? ` · ${ileZrodel(n.zrodla.length)}` : ""}
        </p>

        {/* Tabliczka faktów: to, o co pyta właściciel firmy, w jednym miejscu. */}
        <dl className="bai-fakty">
          {fakty
            .filter(([, w]) => w)
            .map(([e, w]) => (
              <div key={e}>
                <dt className="bai-mono">{e}</dt>
                <dd>{w}</dd>
              </div>
            ))}
        </dl>
        {n.cechy.length > 0 && (
          <p className="bai-cechy">
            {n.cechy.map((c) => (
              <span key={c} className="bai-mono bai-cecha">
                {CECHY[c]}
              </span>
            ))}
          </p>
        )}
        <div className="bai-akcje">
          <a href={n.strona} target="_blank" rel="noopener noreferrer" className="bai-przycisk-obrys">
            Strona producenta
          </a>
          {tekst && (
            <Link href={`${BAZA}/${tekst.slug}`} className="bai-drugi-link">
              Więcej: {tekst.tytul}
            </Link>
          )}
        </div>
      </header>

      <div className="bai-w3">
        <article className="bai-tresc" dangerouslySetInnerHTML={{ __html: renderujMarkdown(n.tresc) }} />

        <Wezwanie />

        {n.zrodla.length > 0 && (
          <section className="bai-zrodla">
            <h2 className="bai-h2-maly">Źródła</h2>
            <p className="bai-zrodla-opis">Ceny i warunki pochodzą ze stron producenta. Linki prowadzą do oryginałów.</p>
            <ol>
              {n.zrodla.map((z, i) => (
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

        {podobne.length > 0 ? (
          <section className="bai-powiazane bai-powiazane-dol">
            <h2 className="bai-h2-maly">Podobne narzędzia</h2>
            <div className="bai-tematy">
              {podobne.map((p) => (
                <Link key={p.slug} href={`${BAZA_NARZEDZI}/${p.slug}`} className="bai-temat">
                  <span className="bai-temat-nazwa">{p.nazwa}</span>
                  <span className="bai-temat-opis">{p.krotko}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="bai-dol" />
        )}
      </div>
    </>
  );
}
