import type { Metadata } from "next";
import Link from "next/link";
import s from "./blog.module.css";
import { Kafel, Okladka, adresTekstu, ileZrodel } from "./widok";
import { DOMENA_BLOGA, GRUPY, artykulyGrupy, grupa, stronaGrupy, type Artykul } from "@/lib/bruno/blog";

// 31.10 (USER_001): lista bloga w układzie czytelni lovemyself: nagłówek, pasek tematów, wyróżniony tekst, sekcje per temat.
export const metadata: Metadata = {
  title: { absolute: "Blog o sprzedaży i pracy handlowca | Bruno AI" },
  description: "Jak zostać handlowcem, jak wybrać kurs sprzedaży i co odpowiadać klientowi. Konkretnie, z liczbami i źródłami.",
  alternates: { canonical: `${DOMENA_BLOGA}/blog` },
};

type Wpis = { a: Artykul; pillar: boolean };

export default function Page() {
  // Strony główne grup idą na listę jak artykuły (pierwsze w swojej sekcji).
  const sekcje = GRUPY.map((g) => {
    const p = stronaGrupy(g.slug);
    const wpisy: Wpis[] = [...(p ? [{ a: p, pillar: true }] : []), ...artykulyGrupy(g.slug).map((a) => ({ a, pillar: false }))];
    return { g, wpisy };
  });
  const wszystkie = sekcje.flatMap((x) => x.wpisy);
  const glowny = wszystkie.find((w) => w.pillar) ?? wszystkie[0];
  const ileTekstow = wszystkie.length;
  const aktywne = sekcje.filter((x) => x.wpisy.some((w) => w !== glowny));

  return (
    <>
      {/* ── NAGŁÓWEK ── */}
      <section className={s.hero}>
        <div className={`${s.w6} ${s.heroWnetrze}`}>
          <p className={s.brow} style={{ margin: 0 }}>
            Blog
          </p>
          <h1 className={`${s.display} ${s.h1}`}>Sprzedaż</h1>
          <p className={s.lead}>
            Jak zostać handlowcem, czego się uczyć i co odpowiadać klientowi. Konkretnie, z liczbami i źródłami pod każdym tekstem.
          </p>
          <p className={s.licznik}>
            {ileTekstow} {ileTekstow === 1 ? "tekst" : "tekstów"} · {GRUPY.length} tematy
          </p>
          <div className={s.akcje}>
            <Link href="/kursy/test" className={s.przycisk}>
              Zrób darmowy test
            </Link>
            <span className={s.notka}>Sprawdź, czy nadajesz się do sprzedaży, w 2 minuty</span>
          </div>
        </div>
      </section>

      {/* ── PASEK TEMATÓW ── */}
      <nav className={s.pasek}>
        <div className={`${s.w6} ${s.pasekWnetrze}`}>
          {GRUPY.map((g) => (
            <Link key={g.slug} href={`/blog/temat/${g.slug}`} className={s.pigulka}>
              {g.nazwa}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── WYRÓŻNIONY ── */}
      {glowny && (
        <section className={`${s.w6} ${s.wyrozniony}`}>
          <Link href={adresTekstu(glowny.a, glowny.pillar)} className={s.grupaLink}>
            <div className={s.wyroznionySiatka}>
              <Okladka grupaSlug={glowny.a.grupa} className={s.wyroznionyOkladka} />
              <div>
                <span className={s.etykieta}>{grupa(glowny.a.grupa)?.nazwa}</span>
                <h2 className={`${s.display} ${s.wyroznionyTytul}`}>{glowny.a.tytul}</h2>
                <p className={s.lead} style={{ marginTop: 16 }}>
                  {glowny.a.opis}
                </p>
                <p className={s.licznik}>
                  {glowny.a.czas} min czytania{glowny.a.zrodla.length ? ` · ${ileZrodel(glowny.a.zrodla.length)}` : ""}
                </p>
                <span className={s.czytaj}>Czytaj</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── SEKCJE PO TEMATACH ── */}
      <div className={`${s.w6} ${s.dol}`}>
        {aktywne.map(({ g, wpisy }) => {
          const reszta = wpisy.filter((w) => w !== glowny);
          return (
            <section key={g.slug} id={g.slug} className={s.sekcja}>
              <div className={s.sekcjaGlowa}>
                <h2 className={`${s.display} ${s.h2}`}>
                  <Link href={`/blog/temat/${g.slug}`}>{g.nazwa}</Link>
                </h2>
                <span className={s.notka}>{reszta.length}</span>
              </div>
              <p className={s.podpis}>„{g.cytat}”</p>
              <div className={s.siatka}>
                {reszta.map((w) => (
                  <Kafel key={adresTekstu(w.a, w.pillar)} a={w.a} pillar={w.pillar} />
                ))}
              </div>
              <Link href={`/blog/temat/${g.slug}`} className={s.wszystko}>
                Wszystko o: {g.nazwa}
              </Link>
            </section>
          );
        })}
        {ileTekstow === 0 && <p className={s.podpis}>Teksty pojawią się tu wkrótce.</p>}
      </div>
    </>
  );
}
