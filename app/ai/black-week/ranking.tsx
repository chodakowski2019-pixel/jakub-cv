"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KodPrzycisk } from "../kod";

// Tablica promocji Black Week (25.11.2026, wersja 2 po „popraw ux/ui tego”): jeden wiersz = jedna oferta.
// Od lewej: narzędzie, oferta w 2 zdaniach, rabat, termin, kod i przycisk. Warunki, cytat i źródło pod „Warunki i źródło”.
// „Ile zostało” i „zakończona” liczy przeglądarka, bo strona jest statyczna.
export type Karta = {
  slug: string;
  nazwa: string;
  logo: string;
  kategoria: string;
  kategoriaNazwa: string;
  rabatPrzed: string;
  rabatLiczba: number;
  opis: string;
  ceny: string;
  /** RRRR-MM-DD albo null. */
  do: string | null;
  doTekst: string;
  /** Do kiedy oferta liczy się jako trwająca (ISO z godziną). */
  koniec: string;
  kody: { etykieta: string; kod: string }[];
  warunki: string;
  zrodlo: string;
  cytat: string;
  link: string;
  reklama: boolean;
  cechy: string[];
};

const SORT = { rabat: "największy rabat", koniec: "kończą się najszybciej", nazwa: "nazwa A-Z" } as const;
type Sort = keyof typeof SORT;

function zostalo(ms: number) {
  const dni = Math.floor(ms / 86400000);
  if (dni <= 0) return "ostatni dzień";
  if (dni === 1) return "został 1 dzień";
  const j = dni % 10;
  const d = dni % 100;
  return j >= 2 && j <= 4 && (d < 12 || d > 14) ? `zostały ${dni} dni` : `zostało ${dni} dni`;
}

/** Do szukania: małe litery, bez polskich znaków („spotkan” znajdzie „spotkań”). */
const bez = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");

export function Ranking({
  karty,
  kategorie,
  katalog,
}: {
  karty: Karta[];
  kategorie: { slug: string; nazwa: string; ile: number }[];
  /** Narzędzia z katalogu BEZ promocji: gdy ktoś szuka np. „ChatGPT”, dostaje link do wpisu zamiast pustej listy. */
  katalog: { slug: string; nazwa: string }[];
}) {
  const [sort, setSort] = useState<Sort>("rabat");
  const [kat, setKat] = useState<string | null>(null);
  const [szukaj, setSzukaj] = useState("");
  const q = bez(szukaj.trim());
  const [teraz, setTeraz] = useState<number | null>(null);
  useEffect(() => setTeraz(Date.now()), []);

  const minela = (k: Karta) => teraz !== null && teraz > new Date(k.koniec).getTime();

  const wynik = useMemo(() => {
    const po = (k: Karta) => (teraz !== null && teraz > new Date(k.koniec).getTime() ? 1 : 0);
    return karty
      .filter((k) => !kat || k.kategoria === kat)
      .filter((k) => !q || bez(`${k.nazwa} ${k.kategoriaNazwa} ${k.opis} ${k.ceny} ${k.warunki} ${k.kody.map((x) => x.kod).join(" ")}`).includes(q))
      .sort((a, b) => {
        if (po(a) !== po(b)) return po(a) - po(b);
        if (sort === "rabat") return b.rabatLiczba - a.rabatLiczba || a.nazwa.localeCompare(b.nazwa, "pl");
        if (sort === "koniec") return (a.do ?? "9999").localeCompare(b.do ?? "9999") || b.rabatLiczba - a.rabatLiczba;
        return a.nazwa.localeCompare(b.nazwa, "pl");
      });
  }, [karty, sort, kat, teraz, q]);

  // Nic nie znaleziono w promocjach: pokaż narzędzia z katalogu o tej nazwie (najwyżej 4).
  const bezPromocji = q && wynik.length === 0 ? katalog.filter((n) => bez(n.nazwa).includes(q)).slice(0, 4) : [];
  const wyczysc = () => {
    setSzukaj("");
    setKat(null);
  };

  return (
    <section id="ranking" aria-label="Promocje">
      <div className="bai-of-pasek">
        <div className="bai-of-szukaj">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="bai-pole"
            type="search"
            placeholder="Szukaj: nazwa, kategoria albo kod"
            aria-label="Szukaj promocji"
            autoComplete="off"
            value={szukaj}
            onChange={(e) => {
              setSzukaj(e.target.value);
              // Szukanie idzie po wszystkich kategoriach.
              if (e.target.value.trim()) setKat(null);
            }}
          />
        </div>
        <div className="bai-zakladki" role="group" aria-label="Kategoria">
          <button type="button" className="bai-zakladka" aria-pressed={kat === null} onClick={() => setKat(null)}>
            Wszystkie <span>{karty.length}</span>
          </button>
          {kategorie.map((k) => (
            <button key={k.slug} type="button" className="bai-zakladka" aria-pressed={kat === k.slug} onClick={() => setKat(k.slug)}>
              {k.nazwa} <span>{k.ile}</span>
            </button>
          ))}
        </div>
        <label className="bai-sortuj">
          <span>Kolejność:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {(Object.keys(SORT) as Sort[]).map((s) => (
              <option key={s} value={s}>
                {SORT[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="bai-mono bai-of-wyniki" role="status">
        {q && wynik.length > 0 ? `Wyniki: ${wynik.length} z ${karty.length}` : ""}
      </p>

      {wynik.length === 0 && (
        <div className="bai-of-pusto">
          <p>{q ? `Nie ma teraz promocji dla „${szukaj.trim()}”.` : "W tej kategorii nie ma teraz promocji."}</p>
          {bezPromocji.length > 0 && (
            <p className="bai-of-linki">
              <span>W katalogu, bez promocji:</span>
              {bezPromocji.map((n) => (
                <Link key={n.slug} href={`/ai/${n.slug}`}>
                  {n.nazwa}
                </Link>
              ))}
            </p>
          )}
          <button type="button" className="bai-przycisk-obrys" onClick={wyczysc}>
            Pokaż wszystkie promocje
          </button>
        </div>
      )}

      <div className="bai-of-tablica" hidden={wynik.length === 0}>
        <div className="bai-of bai-of-glowa" aria-hidden>
          <span>Narzędzie</span>
          <span>Oferta</span>
          <span>Rabat i termin</span>
          <span />
        </div>

        {wynik.map((k, i) => {
          const koniec = minela(k);
          const ile = teraz !== null && k.do && !koniec ? zostalo(new Date(k.koniec).getTime() - teraz) : "";
          return (
            <article key={k.slug} className={`bai-of${koniec ? " bai-of-po" : ""}`}>
              <div className="bai-of-kto">
                <span className="bai-of-nr">{String(i + 1).padStart(2, "0")}</span>
                <span className={`bai-znak${k.logo ? " bai-znak-logo" : ""}`} aria-hidden>
                  {k.logo ? <img src={k.logo} alt="" width={44} height={44} loading="lazy" /> : k.nazwa.slice(0, 2)}
                </span>
                <div>
                  <h3 className="bai-of-nazwa">{k.nazwa}</h3>
                  <p className="bai-of-kat">{k.kategoriaNazwa}</p>
                </div>
              </div>

              <div className="bai-of-co">
                <p className="bai-of-opis">{k.opis}</p>
                <p className="bai-of-ceny">{k.ceny}</p>
              </div>

              <div className="bai-of-ile">
                <p className="bai-of-rabat">
                  <b>
                    {k.rabatPrzed && <small>{k.rabatPrzed}</small>}
                    {k.rabatLiczba}%
                  </b>
                </p>
                <p className="bai-of-termin">
                  {k.do ? (
                    koniec ? (
                      <b>zakończona</b>
                    ) : (
                      <>
                        <b>do {k.doTekst}</b>
                        {ile && <span className="bai-of-ile-dni">{ile}</span>}
                      </>
                    )
                  ) : (
                    <>
                      <b>bez daty końca</b>
                      {koniec && <span>sprawdź u producenta</span>}
                    </>
                  )}
                </p>
              </div>

              <div className="bai-of-akcja">
                {k.kody.map((x) => (
                  <KodPrzycisk key={x.kod} etykieta={x.etykieta} kod={x.kod} />
                ))}
                <a href={k.link} target="_blank" rel={k.reklama ? "sponsored noopener noreferrer" : "noopener noreferrer"} className="bai-przycisk bai-przycisk-maly">
                  Przejdź do oferty{k.reklama ? "*" : ""}
                </a>
                {k.reklama && <span className="bai-of-reklama">* Reklama: link partnerski</span>}
              </div>

              <details className="bai-of-wiecej">
                <summary>Warunki i źródło</summary>
                <div className="bai-of-wiecej-tresc">
                  <p>{k.warunki}</p>
                  <figure>
                    <figcaption>Cytat ze strony producenta</figcaption>
                    <blockquote>{k.cytat}</blockquote>
                  </figure>
                  {k.cechy.length > 0 && (
                    <p className="bai-cechy">
                      {k.cechy.map((c) => (
                        <span key={c} className="bai-mono bai-cecha">
                          {c}
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="bai-of-linki">
                    <a href={k.zrodlo} target="_blank" rel="noopener noreferrer">
                      Źródło: strona producenta
                    </a>
                    <Link href={`/ai/${k.slug}`}>{k.nazwa} w firmie: cena, język polski, dane</Link>
                  </p>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
