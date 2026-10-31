"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./kursy.module.css";

type Wynik = { slug: string; tytul: string; dlaczego: string };

const POZIOMY = [
  { v: "start", l: "Zaczynam w sprzedaży" },
  { v: "pro", l: "Już sprzedaję" },
] as const;

export default function Wyszukiwarka() {
  const [zapytanie, setZapytanie] = useState("");
  const [poziom, setPoziom] = useState<"start" | "pro" | null>(null);
  const [czeka, setCzeka] = useState(false);
  const [blad, setBlad] = useState("");
  const [wyniki, setWyniki] = useState<Wynik[] | null>(null);

  async function szukaj(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setCzeka(true);
    try {
      const r = await fetch("/api/bruno/kursy/szukaj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zapytanie, poziom }),
      });
      const d = await r.json();
      if (!d.ok) setBlad(d.blad ?? "Coś poszło nie tak. Spróbuj jeszcze raz.");
      else setWyniki(d.wyniki);
    } catch {
      setBlad("Brak połączenia. Spróbuj jeszcze raz.");
    } finally {
      setCzeka(false);
    }
  }

  return (
    <section>
      <form className={s.formularz} onSubmit={szukaj}>
        <textarea
          className={s.pole}
          value={zapytanie}
          onChange={(e) => setZapytanie(e.target.value)}
          placeholder="Np. chcę sprzedawać fotowoltaikę, nigdy nie pracowałem w sprzedaży"
          maxLength={1000}
          required
        />
        <div className={s.wybor}>
          {POZIOMY.map((p) => (
            <button
              key={p.v}
              type="button"
              className={`${s.pigulka} ${poziom === p.v ? s.pigulkaWl : ""}`}
              onClick={() => setPoziom(poziom === p.v ? null : p.v)}
            >
              {p.l}
            </button>
          ))}
        </div>
        <button className={s.przycisk} type="submit" disabled={czeka || zapytanie.trim().length < 3}>
          {czeka ? "Szukam…" : "Znajdź mój kurs"}
        </button>
        {blad && <p className={s.blad}>{blad}</p>}
        <Link href="/kursy/test" className={`${s.przycisk} ${s.drugi}`}>
          Nie wiem, czego szukam: zrób test
        </Link>
      </form>

      {wyniki && (
        <div className={s.wyniki} style={{ maxWidth: 720, margin: "26px auto 0" }}>
          {wyniki.map((w, i) => (
            <Link key={w.slug} href={`/kursy/${w.slug}?src=szukaj`} className={`${s.karta} ${s.wynik} ${i === 0 ? s.wyroznienie : ""}`}>
              <div>
                {i === 0 && <div className={s.miesiac}>Najlepiej pasuje</div>}
                <h3 style={{ margin: 0 }}>{w.tytul}</h3>
                <p>{w.dlaczego}</p>
              </div>
              <span className={`${s.przycisk} ${s.przyciskMaly} ${i === 0 ? "" : s.drugi}`}>Zobacz kurs</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
