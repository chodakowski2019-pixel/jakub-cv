import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import s from "../blog.module.css";
import { CialoTekstu, GlowaTekstu, Okladka, SchemaTekstu } from "../widok";
import { DOMENA_BLOGA, artykul, artykulyGrupy, grupa, wszystkieArtykuly } from "@/lib/bruno/blog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return wszystkieArtykuly().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = artykul((await params).slug);
  if (!a) return {};
  const url = `${DOMENA_BLOGA}/blog/${a.slug}`;
  return {
    // Bez dopisku marki: tytuły są długie, Google ucina po ok. 60 znakach (lekcja z lovemyself).
    title: { absolute: a.tytul },
    description: a.opis,
    alternates: { canonical: url },
    openGraph: { title: a.tytul, description: a.opis, type: "article", publishedTime: a.data, url, locale: "pl_PL" },
  };
}

export default async function Page({ params }: Props) {
  const a = artykul((await params).slug);
  const g = a && grupa(a.grupa);
  if (!a || !g) notFound();
  // Linki tylko w obrębie grupy (Negacz NSM 121).
  const podobne = artykulyGrupy(g.slug).filter((x) => x.slug !== a.slug).slice(0, 3);
  return (
    <>
      <SchemaTekstu a={a} g={g} />
      <GlowaTekstu a={a} g={g} />
      <CialoTekstu a={a} g={g} />
      <div className={s.w3}>
        {podobne.length > 0 ? (
          <section className={s.powiazane}>
            <h2 className={`${s.display} ${s.h2Maly}`}>Przeczytaj też</h2>
            <div className={s.powiazaneSiatka}>
              {podobne.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className={s.grupaLink}>
                  <Okladka grupaSlug={p.grupa} className={s.powiazaneOkladka} />
                  <p className={`${s.display} ${s.powiazaneTytul}`}>{p.tytul}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className={s.dol} />
        )}
      </div>
    </>
  );
}
