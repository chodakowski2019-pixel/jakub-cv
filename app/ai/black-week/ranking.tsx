"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

// Lista promocji Black Week: sortowanie i filtry w przeglądarce. Dane z serwera (lib/promocje-ai.ts), każda z cytatem ze strony producenta.
export type Karta = {
  slug: string;
  nazwa: string;
  producent: string;
  logo: string;
  kategoria: string;
  kategoriaNazwa: string;
  rabat: string;
  rabatLiczba: number;
  opis: string;
  ceny: string;
  do: string | null;
  doTekst: string;
  kod: string;
  warunki: string;
  zrodlo: string;
  cytat: string;
  link: string;
  reklama: boolean;
  sprawdzono: string;
  cechy: string[];
  wygasla: boolean;
};

const SORT = { rabat: "Największy rabat", koniec: "Kończą się najszybciej", nazwa: "Nazwa A-Z" } as const;
type Sort = keyof typeof SORT;

export function Ranking({ karty, kategorie, cechy }: { karty: Karta[]; kategorie: { slug: string; nazwa: string; ile: number }[]; cechy: { slug: string; nazwa: string }[] }) {
  const [sort, setSort] = useState<Sort>("rabat");
  const [kat, setKat] = useState<string | null>(null);
  const [tylkoDlaFirm, setTylkoDlaFirm] = useState<string[]>([]);
  const [tylkoZData, setTylkoZData] = useState(false);
  const [skopiowano, setSkopiowano] = useState("");

  const wynik = useMemo(() => {
    const l = karty.filter((k) => (!kat || k.kategoria === kat) && tylkoDlaFirm.every((c) => k.cechy.includes(c)) && (!tylkoZData || k.do));
    return [...l].sort((a, b) => {
      if (sort === "rabat") return b.rabatLiczba - a.rabatLiczba || a.nazwa.localeCompare(b.nazwa, "pl");
      if (sort === "koniec") return (a.do ?? "9999").localeCompare(b.do ?? "9999") || a.nazwa.localeCompare(b.nazwa, "pl");
      return a.nazwa.localeCompare(b.nazwa, "pl");
    });
  }, [karty, sort, kat, tylkoDlaFirm, tylkoZData]);

  async function kopiuj(kod: string) {
    try {
      await navigator.clipboard.writeText(kod);
      setSkopiowano(kod);
      setTimeout(() => setSkopiowano(""), 2000);
    } catch {
      /* brak schowka: kod jest widoczny, można skopiować ręcznie */
    }
  }
  const przelacz = (c: string) => setTylkoDlaFirm((w) => (w.includes(c) ? w.filter((x) => x !== c) : [...w, c]));

  return (
    <div id="ranking">
      <div className="bai-bw-filtry">
        <div className="bai-bw-grupa" role="group" aria-label="Sortowanie">
          {(Object.keys(SORT) as Sort[]).map((s) => (
            <button key={s} type="button" className="bai-chip" aria-pressed={sort === s} onClick={() => setSort(s)}>
              {SORT[s]}
            </button>
          ))}
        </div>
        <div className="bai-bw-grupa" role="group" aria-label="Kategoria">
          <button type="button" className="bai-chip" aria-pressed={kat === null} onClick={() => setKat(null)}>
            Wszystkie · {karty.length}
          </button>
          {kategorie.map((k) => (
            <button key={k.slug} type="button" className="bai-chip" aria-pressed={kat === k.slug} onClick={() => setKat(kat === k.slug ? null : k.slug)}>
              {k.nazwa} · {k.ile}
            </button>
          ))}
        </div>
        <div className="bai-bw-grupa" role="group" aria-label="Dla firmy">
          {cechy.map((c) => (
            <button key={c.slug} type="button" className="bai-chip" aria-pressed={tylkoDlaFirm.includes(c.slug)} onClick={() => przelacz(c.slug)}>
              {c.nazwa}
            </button>
          ))}
          <button type="button" className="bai-chip" aria-pressed={tylkoZData} onClick={() => setTylkoZData((v) => !v)}>
            Z podaną datą końca
          </button>
        </div>
      </div>

      <p className="bai-mono bai-katalog-ile" aria-live="polite">
        Promocje: {wynik.length} z {karty.length}
      </p>

      <div className="bai-bw-lista">
        {wynik.map((k, i) => (
          <article key={k.slug} className={`bai-bw-karta${k.wygasla ? " bai-bw-wygasla" : ""}`}>
            <div className="bai-bw-lewa">
              <span className="bai-mono bai-bw-nr">{String(i + 1).padStart(2, "0")}</span>
              <span className={`bai-znak${k.logo ? " bai-znak-logo" : ""}`} aria-hidden>
                {k.logo ? <img src={k.logo} alt="" width={44} height={44} loading="lazy" /> : k.nazwa.slice(0, 2)}
              </span>
              <div>
                <h3 className="bai-narzedzie-nazwa">{k.nazwa}</h3>
                <p className="bai-narzedzie-producent">
                  {k.producent} · {k.kategoriaNazwa}
                </p>
              </div>
            </div>

            <div className="bai-bw-srodek">
              <p className="bai-bw-opis">{k.opis}</p>
              <p className="bai-bw-ceny">{k.ceny}</p>
              <p className="bai-bw-warunki">{k.warunki}</p>
              <p className="bai-mono bai-bw-meta">
                {k.do ? `Do: ${k.doTekst}` : "Data końca: nie podana przez producenta"} · Sprawdzono: {k.sprawdzono}
              </p>
              {k.cechy.length > 0 && (
                <p className="bai-cechy">
                  {k.cechy.map((c) => (
                    <span key={c} className="bai-mono bai-cecha">
                      {cechy.find((x) => x.slug === c)?.nazwa ?? c}
                    </span>
                  ))}
                </p>
              )}
              <details className="bai-bw-zrodlo">
                <summary>Skąd to wiem</summary>
                <blockquote>{k.cytat}</blockquote>
                <a href={k.zrodlo} target="_blank" rel="noopener noreferrer">
                  Strona producenta
                </a>
                {" · "}
                <Link href={`/ai/${k.slug}`}>Nasz wpis o narzędziu</Link>
              </details>
            </div>

            <div className="bai-bw-prawa">
              <p className="bai-bw-rabat">{k.rabat}</p>
              {k.kod && (
                <button type="button" className="bai-bw-kod" onClick={() => kopiuj(k.kod)} title="Kopiuj kod">
                  <span>{k.kod}</span>
                  <span className="bai-mono">{skopiowano === k.kod ? "Skopiowano" : "Kopiuj"}</span>
                </button>
              )}
              <a href={k.link} target="_blank" rel={k.reklama ? "sponsored noopener noreferrer" : "noopener noreferrer"} className="bai-przycisk bai-przycisk-maly">
                Przejdź do oferty{k.reklama ? "*" : ""}
              </a>
              {k.reklama && <span className="bai-bw-reklama">* Reklama: link partnerski</span>}
            </div>
          </article>
        ))}
      </div>
      {wynik.length === 0 && <p className="bai-pytanie">Żadna promocja nie pasuje do filtrów.</p>}
    </div>
  );
}
