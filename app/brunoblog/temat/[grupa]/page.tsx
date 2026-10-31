import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import s from "../../blog.module.css";
import { CialoTekstu, Kafel, PozostaleTematy, SchemaTekstu, Wezwanie } from "../../widok";
import { DOMENA_BLOGA, GRUPY, artykulyGrupy, grupa, stronaGrupy } from "@/lib/bruno/blog";

// 31.10: strona grupy w układzie lovemyself (/blog/temat/[obszar]): nagłówek, kafle artykułów, przewodnik, pozostałe tematy.
// Przewodnik = strona główna grupy (pillar page) z content/bruno-blog/temat/<grupa>.md, jej tytuł idzie w H1 (fraza główna).
type Props = { params: Promise<{ grupa: string }> };

export function generateStaticParams() {
  return GRUPY.map((g) => ({ grupa: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).grupa;
  const g = grupa(slug);
  if (!g) return {};
  const p = stronaGrupy(slug);
  const url = `${DOMENA_BLOGA}/blog/temat/${slug}`;
  return {
    title: { absolute: p?.tytul ?? `${g.nazwa} | Blog Bruno AI` },
    description: p?.opis ?? g.opis,
    alternates: { canonical: url },
    openGraph: { title: p?.tytul ?? g.nazwa, description: p?.opis ?? g.opis, type: "article", url, locale: "pl_PL" },
    // Grupa bez tekstu strony głównej = cienka strona, poza indeksem do czasu napisania.
    ...(p ? {} : { robots: { index: false, follow: true } }),
  };
}

const data = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export default async function Page({ params }: Props) {
  const slug = (await params).grupa;
  const g = grupa(slug);
  if (!g) notFound();
  const p = stronaGrupy(slug);
  const lista = artykulyGrupy(slug);
  return (
    <>
      {p && <SchemaTekstu a={p} g={g} pillar />}
      <section className={s.hero}>
        <div className={`${s.w6} ${s.heroWnetrze}`}>
          <Link href="/blog" className={s.brow}>
            Blog · {g.nazwa}
          </Link>
          <h1 className={`${s.display} ${s.h1Temat}`}>{p?.tytul ?? g.nazwa}</h1>
          <p className={`${s.display} ${s.cytatHero}`}>„{g.cytat}”</p>
          <p className={s.licznik}>
            {p ? `Jakub Chodakowski · ${p.czas} min czytania · ${data(p.aktualizacja)}` : `${lista.length} tekstów`}
            {p && lista.length > 0 ? ` · ${lista.length} tekstów w temacie` : ""}
          </p>
        </div>
      </section>

      {lista.length > 0 && (
        <div className={s.w6}>
          <section style={{ marginTop: 56 }}>
            <div className={s.siatka} style={{ marginTop: 0 }}>
              {lista.map((a) => (
                <Kafel key={a.slug} a={a} />
              ))}
            </div>
          </section>
        </div>
      )}

      {p ? (
        <>
          <div className={s.w3} style={{ paddingTop: 48 }}>
            <p className={s.artOpis} style={{ marginTop: 0 }}>
              {p.opis}
            </p>
            {p.tldr && (
              <div className={s.skrot}>
                <p className={s.skrotEtykieta}>W skrócie</p>
                <p className={s.skrotTekst}>{p.tldr}</p>
              </div>
            )}
          </div>
          <CialoTekstu a={p} g={g} bezOkladki />
        </>
      ) : (
        <div className={s.w3}>
          <Wezwanie g={g} />
        </div>
      )}

      <div className={`${s.w6} ${s.dol}`}>
        <PozostaleTematy bez={slug} />
      </div>
    </>
  );
}
