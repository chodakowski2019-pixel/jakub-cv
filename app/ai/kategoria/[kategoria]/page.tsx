import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Wezwanie } from "../../../blog/widok";
import { DOMENA, PODGLAD } from "@/lib/blog-ai";
import { BAZA_NARZEDZI, CENNIKI, KATEGORIE, kategoria, kategorieZNarzedziami, narzedziaKategorii } from "@/lib/narzedzia-ai";

// Strona kategorii: nagłówek, narzędzia z tej kategorii, pozostałe kategorie.
type Props = { params: Promise<{ kategoria: string }> };

export function generateStaticParams() {
  return KATEGORIE.map((k) => ({ kategoria: k.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const k = kategoria((await params).kategoria);
  if (!k) return {};
  return {
    title: { absolute: `${k.nazwa}: narzędzia AI dla firm` },
    description: k.opis,
    // Krótka lista to cienka strona: poza indeksem, dopóki kategoria nie ma własnego opisu i więcej wpisów.
    robots: PODGLAD ? { index: false, follow: false } : { index: false, follow: true },
    alternates: PODGLAD ? undefined : { canonical: `${DOMENA}${BAZA_NARZEDZI}/kategoria/${k.slug}` },
  };
}

export default async function Page({ params }: Props) {
  const slug = (await params).kategoria;
  const k = kategoria(slug);
  if (!k) notFound();
  const lista = narzedziaKategorii(slug);
  const inne = kategorieZNarzedziami().filter((x) => x.slug !== slug);
  return (
    <>
      <section className="bai-hero">
        <div className="bai-smuga" aria-hidden />
        <div className="bai-w6 bai-hero-wnetrze">
          <Link href={BAZA_NARZEDZI} className="bai-mono bai-brow">
            Narzędzia AI · {k.nazwa}
          </Link>
          <h1 className="bai-h1 bai-h1-temat">{k.nazwa}</h1>
          <p className="bai-lead">{k.opis}</p>
          <p className="bai-mono bai-licznik">Narzędzia w kategorii: {lista.length}</p>
        </div>
      </section>

      <div className="bai-w6">
        <div className="bai-narzedzia bai-narzedzia-kategoria">
          {lista.map((n) => (
            <Link key={n.slug} href={`${BAZA_NARZEDZI}/${n.slug}`} className="bai-narzedzie">
              <div className="bai-narzedzie-glowa">
                <span className="bai-znak" aria-hidden>
                  {n.nazwa.slice(0, 2)}
                </span>
                <div>
                  <h3 className="bai-narzedzie-nazwa">{n.nazwa}</h3>
                  <p className="bai-narzedzie-producent">{n.producent}</p>
                </div>
              </div>
              <p className="bai-narzedzie-opis">{n.krotko}</p>
              <dl className="bai-narzedzie-fakty">
                <div>
                  <dt className="bai-mono">Cena od</dt>
                  <dd>{n.cenaOd}</dd>
                </div>
                <div>
                  <dt className="bai-mono">Model</dt>
                  <dd>{CENNIKI[n.cennik]}</dd>
                </div>
              </dl>
              <p className="bai-mono bai-narzedzie-stopka">
                <span>{k.nazwa}</span>
                <span className="bai-narzedzie-wiecej">Zobacz szczegóły</span>
              </p>
            </Link>
          ))}
        </div>
        {lista.length === 0 && <p className="bai-pytanie">W tej kategorii nie ma jeszcze sprawdzonych narzędzi.</p>}
      </div>

      <div className="bai-w3">
        <Wezwanie />
      </div>

      <div className="bai-w6 bai-dol">
        {inne.length > 0 && (
          <section className="bai-powiazane">
            <h2 className="bai-h2-maly">Pozostałe kategorie</h2>
            <div className="bai-tematy">
              {inne.map((x) => (
                <Link key={x.slug} href={`${BAZA_NARZEDZI}/kategoria/${x.slug}`} className="bai-temat">
                  <span className="bai-temat-nazwa">{x.nazwa}</span>
                  <span className="bai-temat-opis">{x.opis}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
