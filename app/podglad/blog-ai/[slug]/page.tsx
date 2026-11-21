import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CialoTekstu, GlowaTekstu, Okladka, SchemaTekstu, adresTekstu } from "../widok";
import { AUTOR, DOMENA, PODGLAD, artykul, artykulyGrupy, grupa, wszystkieArtykuly } from "@/lib/blog-ai";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return wszystkieArtykuly().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = artykul((await params).slug);
  if (!a) return {};
  const url = `${DOMENA}${adresTekstu(a)}`;
  return {
    // Bez dopisku marki: Google ucina tytuł po ok. 60 znakach (lekcja z lovemyself).
    title: { absolute: a.tytul },
    description: a.opis,
    authors: [{ name: AUTOR.imie }],
    ...(PODGLAD ? { robots: { index: false, follow: false } } : { alternates: { canonical: url } }),
    // Obraz do udostępniania rysuje opengraph-image.tsx obok tego pliku (osobny dla każdego tekstu).
    openGraph: {
      title: a.tytul,
      description: a.opis,
      type: "article",
      publishedTime: a.data,
      modifiedTime: a.aktualizacja,
      authors: [AUTOR.imie],
      url,
      locale: "pl_PL",
    },
    twitter: { card: "summary_large_image", title: a.tytul, description: a.opis },
  };
}

export default async function Page({ params }: Props) {
  const a = artykul((await params).slug);
  const g = a && grupa(a.grupa);
  if (!a || !g) notFound();
  // Linki „Przeczytaj też” tylko w obrębie tematu: wzmacniają klaster.
  const podobne = artykulyGrupy(g.slug)
    .filter((x) => x.slug !== a.slug)
    .slice(0, 3);
  return (
    <>
      <SchemaTekstu a={a} g={g} />
      <GlowaTekstu a={a} g={g} />
      <CialoTekstu a={a} />
      <div className="bai-w3">
        {podobne.length > 0 ? (
          <section className="bai-powiazane bai-powiazane-dol">
            <h2 className="bai-h2-maly">Przeczytaj też</h2>
            <div className="bai-powiazane-siatka">
              {podobne.map((p) => (
                <Link key={p.slug} href={adresTekstu(p)} className="bai-kafel">
                  <Okladka a={p} className="bai-powiazane-okladka" />
                  <p className="bai-powiazane-tytul">{p.tytul}</p>
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
