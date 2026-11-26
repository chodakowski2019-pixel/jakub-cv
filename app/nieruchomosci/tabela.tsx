"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { liczba, proc, zl } from "@/lib/nieruchomosci/format";

export type Wiersz = {
  slug: string;
  nazwa: string;
  poziom: "wojewodztwo" | "miasto" | "powiat";
  wojewodztwo: string | null;
  m2: number | null;
  zmiana: number | null;
  pierwotny: number | null;
  wtorny: number | null;
  transakcje: number | null;
};

type Klucz = "nazwa" | "m2" | "zmiana" | "pierwotny" | "wtorny" | "transakcje";
const ZAKLADKI = [
  { slug: "miasto", nazwa: "Miasta" },
  { slug: "powiat", nazwa: "Powiaty" },
  { slug: "wojewodztwo", nazwa: "Województwa" },
] as const;
const NA_START = 30;

const bezOgonkow = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

export function Tabela({ wiersze, baza, rok }: { wiersze: Wiersz[]; baza: string; rok: number }) {
  const [poziom, setPoziom] = useState<Wiersz["poziom"]>("miasto");
  const [szukaj, setSzukaj] = useState("");
  const [sort, setSort] = useState<{ klucz: Klucz; malejaco: boolean }>({ klucz: "m2", malejaco: true });
  const [wszystkie, setWszystkie] = useState(false);

  const widoczne = useMemo(() => {
    const q = bezOgonkow(szukaj.trim());
    const lista = wiersze.filter((w) => (q ? bezOgonkow(`${w.nazwa} ${w.wojewodztwo ?? ""}`).includes(q) : w.poziom === poziom));
    return lista.sort((a, b) => {
      const x = a[sort.klucz];
      const y = b[sort.klucz];
      if (x == null) return 1;
      if (y == null) return -1;
      const wynik = typeof x === "string" ? x.localeCompare(y as string, "pl") : x - (y as number);
      return sort.malejaco ? -wynik : wynik;
    });
  }, [wiersze, poziom, szukaj, sort]);

  const pokazane = wszystkie ? widoczne : widoczne.slice(0, NA_START);
  const naglowek = (klucz: Klucz, tekst: string, num = true) => (
    <th className={num ? "nr-num" : undefined} aria-sort={sort.klucz === klucz ? (sort.malejaco ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        className="nr-sort"
        aria-pressed={sort.klucz === klucz}
        onClick={() => setSort((s) => ({ klucz, malejaco: s.klucz === klucz ? !s.malejaco : klucz !== "nazwa" }))}
      >
        {tekst}
        {sort.klucz === klucz ? (sort.malejaco ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );

  return (
    <>
      <div className="nr-filtry">
        <input
          className="bai-pole"
          type="search"
          placeholder="Wpisz miasto albo powiat"
          aria-label="Szukaj miasta albo powiatu"
          value={szukaj}
          onChange={(e) => setSzukaj(e.target.value)}
        />
        {ZAKLADKI.map((z) => (
          <button
            key={z.slug}
            type="button"
            className="nr-zakladka"
            aria-pressed={!szukaj && poziom === z.slug}
            onClick={() => {
              setSzukaj("");
              setPoziom(z.slug);
            }}
          >
            {z.nazwa}
          </button>
        ))}
      </div>
      <p className="bai-mono" style={{ marginTop: "1rem" }} aria-live="polite">
        Wyniki: {widoczne.length}
      </p>
      <div className="bai-tabela">
        <table>
          <thead>
            <tr>
              {naglowek("nazwa", "Miejsce", false)}
              {naglowek("m2", `Cena za m² ${rok}`)}
              {naglowek("zmiana", "Zmiana w rok")}
              {naglowek("pierwotny", "Od dewelopera")}
              {naglowek("wtorny", "Z drugiej ręki")}
              {naglowek("transakcje", "Sprzedane mieszkania")}
            </tr>
          </thead>
          <tbody>
            {pokazane.map((w) => (
              <tr key={w.slug}>
                <td>
                  <Link href={`${baza}/${w.slug}`}>{w.poziom === "wojewodztwo" ? `woj. ${w.nazwa}` : w.nazwa}</Link>
                  {w.wojewodztwo && w.poziom === "powiat" ? <span className="bai-notka"> · {w.wojewodztwo}</span> : null}
                </td>
                <td className="nr-num">{zl(w.m2)}</td>
                <td className={`nr-num ${w.zmiana == null ? "" : w.zmiana >= 0 ? "nr-plus" : "nr-minus"}`}>{proc(w.zmiana)}</td>
                <td className="nr-num">{zl(w.pierwotny)}</td>
                <td className="nr-num">{zl(w.wtorny)}</td>
                <td className="nr-num">{liczba(w.transakcje)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!wszystkie && widoczne.length > NA_START ? (
        <button type="button" className="nr-zakladka nr-wiecej" onClick={() => setWszystkie(true)}>
          Pokaż wszystkie ({widoczne.length})
        </button>
      ) : null}
    </>
  );
}
