"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

// Lista narzędzi z wyszukiwarką i filtrami (jak w katalogach narzędzi: model cenowy i cechy).
// Dane przychodzą z serwera jako zwykłe obiekty. Filtrowanie w przeglądarce, bez przeładowania strony.

export type Kafel = {
  slug: string;
  href: string;
  nazwa: string;
  producent: string;
  kategoria: string;
  kategoriaNazwa: string;
  cennik: string;
  cennikNazwa: string;
  cenaOd: string;
  krotko: string;
  cechy: string[];
};

type Opcja = { slug: string; nazwa: string; ile: number };

export function Lista({ narzedzia, cenniki, cechy }: { narzedzia: Kafel[]; cenniki: Opcja[]; cechy: Opcja[] }) {
  const [szukaj, setSzukaj] = useState("");
  const [cennik, setCennik] = useState<string | null>(null);
  const [wybraneCechy, setWybraneCechy] = useState<string[]>([]);

  const wynik = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    return narzedzia.filter(
      (n) =>
        (!q || `${n.nazwa} ${n.producent} ${n.krotko} ${n.kategoriaNazwa}`.toLowerCase().includes(q)) &&
        (!cennik || n.cennik === cennik) &&
        wybraneCechy.every((c) => n.cechy.includes(c)),
    );
  }, [narzedzia, szukaj, cennik, wybraneCechy]);

  const przelacz = (c: string) => setWybraneCechy((w) => (w.includes(c) ? w.filter((x) => x !== c) : [...w, c]));
  const czysto = !szukaj && !cennik && wybraneCechy.length === 0;

  return (
    <div className="bai-katalog">
      <aside className="bai-filtry" aria-label="Filtry">
        <label className="bai-mono" htmlFor="bai-szukaj">
          Szukaj
        </label>
        <input
          id="bai-szukaj"
          className="bai-pole"
          type="search"
          placeholder="Nazwa albo zadanie"
          value={szukaj}
          onChange={(e) => setSzukaj(e.target.value)}
        />

        <p className="bai-mono bai-filtry-nad">Model cenowy</p>
        <div className="bai-filtry-grupa">
          {cenniki.map((c) => (
            <button key={c.slug} type="button" className="bai-filtr" aria-pressed={cennik === c.slug} onClick={() => setCennik(cennik === c.slug ? null : c.slug)}>
              <span>{c.nazwa}</span>
              <span className="bai-mono">{c.ile}</span>
            </button>
          ))}
        </div>

        <p className="bai-mono bai-filtry-nad">Dla firmy</p>
        <div className="bai-filtry-grupa">
          {cechy.map((c) => (
            <button key={c.slug} type="button" className="bai-filtr" aria-pressed={wybraneCechy.includes(c.slug)} onClick={() => przelacz(c.slug)}>
              <span>{c.nazwa}</span>
              <span className="bai-mono">{c.ile}</span>
            </button>
          ))}
        </div>

        {!czysto && (
          <button
            type="button"
            className="bai-filtr-czysc"
            onClick={() => {
              setSzukaj("");
              setCennik(null);
              setWybraneCechy([]);
            }}
          >
            Wyczyść filtry
          </button>
        )}
      </aside>

      <div>
        <p className="bai-mono bai-katalog-ile" aria-live="polite">
          Wyniki: {wynik.length} z {narzedzia.length}
        </p>
        <div className="bai-narzedzia">
          {wynik.map((n) => (
            <Link key={n.slug} href={n.href} className="bai-narzedzie">
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
                  <dd>{n.cennikNazwa}</dd>
                </div>
              </dl>
              <p className="bai-mono bai-narzedzie-stopka">
                <span>{n.kategoriaNazwa}</span>
                <span className="bai-narzedzie-wiecej">Zobacz szczegóły</span>
              </p>
            </Link>
          ))}
        </div>
        {wynik.length === 0 && <p className="bai-pytanie">Żadne narzędzie nie pasuje do filtrów.</p>}
      </div>
    </div>
  );
}
