import type { Metadata } from "next";
import Link from "next/link";
import { Kafel, Okladka, adresGrupy, adresTekstu, ileTekstow, ileZrodel } from "./widok";
import { BAZA, DOMENA, GRUPY, PODGLAD, artykulyGrupy, grupa, wszystkieArtykuly } from "@/lib/blog-ai";

// 21.11.2026 (USER_001): lista bloga w układzie czytelni lovemyself: nagłówek, pasek tematów, wyróżniony tekst, sekcje per temat.
const TYTUL = "Blog o AI w firmie | Jakub Chodakowski";
const OPIS = "Zasady korzystania z AI, ceny szkoleń i narzędzi, zastosowania w pracy biura. Konkretnie, z liczbami i źródłami pod każdym tekstem.";

export const metadata: Metadata = {
  title: { absolute: TYTUL },
  description: OPIS,
  ...(PODGLAD ? { robots: { index: false, follow: false } } : { alternates: { canonical: `${DOMENA}${BAZA}` } }),
  openGraph: { title: "Blog o AI w firmie", description: OPIS, type: "website", locale: "pl_PL" },
};

export default function Page() {
  const wszystkie = wszystkieArtykuly();
  const glowny = wszystkie[0];
  const sekcje = GRUPY.map((g) => ({ g, lista: artykulyGrupy(g.slug).filter((a) => a.slug !== glowny?.slug) })).filter((x) => x.lista.length > 0);

  return (
    <>
      {/* ── NAGŁÓWEK ── */}
      <section className="bai-hero">
        <div className="bai-smuga" aria-hidden />
        <div className="bai-w6 bai-hero-wnetrze">
          <p className="bai-mono bai-brow">Blog</p>
          <h1 className="bai-h1">
            <span>AI w firmie.</span> <span>Konkretnie.</span>
          </h1>
          <p className="bai-lead">
            Jakie zasady spisać, ile kosztuje szkolenie, które narzędzie wybrać. Piszę prosto. Każda liczba ma źródło pod tekstem.
          </p>
          <p className="bai-mono bai-licznik">
            {ileTekstow(wszystkie.length)} · {GRUPY.length} tematy
          </p>
          <div className="bai-akcje">
            <Link href="/szkolenie-ai-dla-firm#formularz" className="bai-przycisk">
              Sprawdź wolny termin
            </Link>
            <span className="bai-notka">Szkolenie AI dla zespołu do 12 osób</span>
          </div>
        </div>
      </section>

      {/* ── PASEK TEMATÓW ── */}
      <nav className="bai-pasek">
        <div className="bai-w6 bai-pasek-wnetrze">
          {GRUPY.map((g) => (
            <Link key={g.slug} href={adresGrupy(g.slug)} className="bai-mono bai-pasek-link">
              {g.nazwa}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── WYRÓŻNIONY ── */}
      {glowny && (
        <section className="bai-w6 bai-wyrozniony">
          <Link href={adresTekstu(glowny)} className="bai-wyrozniony-siatka">
            <Okladka a={glowny} className="bai-wyrozniony-okladka" />
            <div>
              <span className="bai-mono bai-etykieta">{grupa(glowny.grupa)?.nazwa}</span>
              <h2 className="bai-wyrozniony-tytul">{glowny.tytul}</h2>
              <p className="bai-lead">{glowny.opis}</p>
              <p className="bai-mono bai-licznik">
                {glowny.czas} min czytania{glowny.zrodla.length ? ` · ${ileZrodel(glowny.zrodla.length)}` : ""}
              </p>
              <span className="bai-czytaj">Czytaj</span>
            </div>
          </Link>
        </section>
      )}

      {/* ── SEKCJE PO TEMATACH ── */}
      <div className="bai-w6 bai-dol">
        {sekcje.map(({ g, lista }) => (
          <section key={g.slug} id={g.slug} className="bai-sekcja">
            <div className="bai-sekcja-glowa">
              <h2 className="bai-h2">
                <Link href={adresGrupy(g.slug)}>{g.nazwa}</Link>
              </h2>
              <span className="bai-mono">{String(lista.length).padStart(2, "0")}</span>
            </div>
            <p className="bai-pytanie">{g.pytanie}</p>
            <div className="bai-siatka">
              {lista.map((a) => (
                <Kafel key={a.slug} a={a} />
              ))}
            </div>
            <Link href={adresGrupy(g.slug)} className="bai-wszystko">
              Wszystko o: {g.nazwa}
            </Link>
          </section>
        ))}
        {wszystkie.length === 0 && <p className="bai-pytanie">Teksty pojawią się tu wkrótce.</p>}
      </div>
    </>
  );
}
