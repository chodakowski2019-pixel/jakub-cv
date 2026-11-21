import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kafel, PozostaleTematy, Wezwanie, adresGrupy, ileTekstow } from "../../widok";
import { BAZA, DOMENA, GRUPY, PODGLAD, artykulyGrupy, grupa } from "@/lib/blog-ai";

// 21.11.2026: strona tematu w układzie lovemyself (/blog/temat/[obszar]): nagłówek, kafle tekstów, wezwanie, pozostałe tematy.
type Props = { params: Promise<{ grupa: string }> };

export function generateStaticParams() {
  return GRUPY.map((g) => ({ grupa: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = grupa((await params).grupa);
  if (!g) return {};
  return {
    title: { absolute: `${g.nazwa} | Blog o AI w firmie` },
    description: g.opis,
    // Sama lista kafli to cienka strona: poza indeksem do czasu napisania przewodnika po temacie.
    robots: PODGLAD ? { index: false, follow: false } : { index: false, follow: true },
    alternates: PODGLAD ? undefined : { canonical: `${DOMENA}${adresGrupy(g.slug)}` },
    openGraph: { title: g.nazwa, description: g.opis, type: "website", locale: "pl_PL" },
  };
}

export default async function Page({ params }: Props) {
  const slug = (await params).grupa;
  const g = grupa(slug);
  if (!g) notFound();
  const lista = artykulyGrupy(slug);
  return (
    <>
      <section className="bai-hero">
        <div className="bai-smuga" aria-hidden />
        <div className="bai-w6 bai-hero-wnetrze">
          <Link href={BAZA} className="bai-mono bai-brow">
            Blog · {g.nazwa}
          </Link>
          <h1 className="bai-h1 bai-h1-temat">{g.pytanie}</h1>
          <p className="bai-lead">{g.opis}</p>
          <p className="bai-mono bai-licznik">{ileTekstow(lista.length)} w temacie</p>
        </div>
      </section>

      {lista.length > 0 && (
        <div className="bai-w6">
          <div className="bai-siatka bai-siatka-temat">
            {lista.map((a) => (
              <Kafel key={a.slug} a={a} />
            ))}
          </div>
        </div>
      )}

      <div className="bai-w3">
        <Wezwanie />
      </div>

      <div className="bai-w6 bai-dol">
        <PozostaleTematy bez={slug} />
      </div>
    </>
  );
}
