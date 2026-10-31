"use client";

import { useState } from "react";
import Link from "next/link";
import s from "../kursy.module.css";
import { PYTANIA, STYLE, policzWynik, type Wynik } from "@/lib/bruno/test-predyspozycji";

// 31.10 (USER_001): test pokazuje się też po potwierdzeniu miejsca na webinar (/webinar/dzieki-bardzo?t=<token>).
// Z tokenem nie pytamy drugi raz o imię i e-mail (API bierze je z zapisu na webinar), a wynik odsyła na webinar.
export default function Test({ token }: { token?: string } = {}) {
  const [odp, setOdp] = useState<number[]>([]);
  const [imie, setImie] = useState("");
  const [email, setEmail] = useState("");
  const [czeka, setCzeka] = useState(false);
  const [blad, setBlad] = useState("");
  const [wynik, setWynik] = useState<Wynik | null>(null);

  const nr = odp.length;
  const pytanie = PYTANIA[nr];

  async function pokazWynik(e?: React.FormEvent, odpowiedzi = odp) {
    e?.preventDefault();
    setBlad("");
    setCzeka(true);
    try {
      const r = await fetch("/api/bruno/kursy/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imie, email, token, odpowiedzi, zrodlo: new URLSearchParams(window.location.search).get("src") }),
      });
      const d = await r.json();
      if (d.ok) setWynik(policzWynik(odpowiedzi));
      else setBlad(d.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
    } catch {
      setBlad("Brak połączenia. Spróbuj ponownie.");
    } finally {
      setCzeka(false);
    }
  }

  if (wynik) {
    const st = STYLE[wynik.styl];
    return (
      <section style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 14 }}>
        <div className={`${s.karta} ${s.wyroznienie}`}>
          <div className={s.miesiac}>Twój styl</div>
          <h3 style={{ fontSize: "1.6rem" }}>{st.nazwa}</h3>
          <p style={{ margin: 0, color: "#c9cfd7" }}>{st.opis}</p>
        </div>
        <div className={s.karta}>
          <div className={s.miesiac}>{token ? "Twoja ścieżka" : "Kurs dla Ciebie"}</div>
          <h3>{wynik.kurs.tytul}</h3>
          <p style={{ margin: token ? 0 : "0 0 16px", color: "#b5bcc6" }}>{wynik.kurs.obietnica}</p>
          {!token && (
            <Link href={`/kursy/${wynik.kurs.slug}?src=test`} className={s.przycisk}>
              Zobacz kurs
            </Link>
          )}
        </div>
        {token ? (
          <p className={s.pod} style={{ textAlign: "center" }}>
            Wynik mam też u siebie. Na webinarze powiem, co z niego wynika dla Ciebie.
          </p>
        ) : (
          <p className={s.pod} style={{ textAlign: "center" }}>
            <Link href="/kursy" style={{ color: "inherit" }}>
              Zobacz wszystkie kursy
            </Link>
          </p>
        )}
      </section>
    );
  }

  if (!pytanie && token) {
    return (
      <section className={s.formularz} style={{ textAlign: "center" }}>
        <p className={s.podtytul} style={{ margin: 0 }}>{czeka ? "Liczę Twój wynik…" : "Nie udało się zapisać wyniku."}</p>
        {blad && <p className={s.blad}>{blad}</p>}
        {!czeka && (
          <button type="button" className={s.przycisk} onClick={() => pokazWynik()}>
            Spróbuj jeszcze raz
          </button>
        )}
      </section>
    );
  }

  if (!pytanie) {
    return (
      <section>
        <form className={s.formularz} onSubmit={pokazWynik}>
          <p className={s.podtytul} style={{ textAlign: "center", margin: "0 0 6px" }}>
            Gotowe. Gdzie wysłać wynik?
          </p>
          <input className={s.pole} value={imie} onChange={(e) => setImie(e.target.value)} placeholder="Imię" autoComplete="given-name" required />
          <input className={s.pole} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" autoComplete="email" required />
          <button className={s.przycisk} type="submit" disabled={czeka}>
            {czeka ? "Liczę…" : "Pokaż mój wynik"}
          </button>
          {blad && <p className={s.blad}>{blad}</p>}
          <button type="button" className={s.pigulka} style={{ justifySelf: "center" }} onClick={() => setOdp(odp.slice(0, -1))}>
            ← Wróć
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className={s.formularz}>
      <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(nr / PYTANIA.length) * 100}%`, background: "#5cc8ff", transition: "width 200ms ease-out" }} />
      </div>
      <div className={s.miesiac} style={{ textAlign: "center" }}>
        Pytanie {nr + 1} z {PYTANIA.length}
      </div>
      <h2 className={s.h2} style={{ marginBottom: 8 }}>
        {pytanie.tekst}
      </h2>
      <div style={{ display: "grid", gap: 10 }}>
        {pytanie.opcje.map((o, i) => (
          <button
            key={o.tekst}
            type="button"
            className={s.pigulka}
            style={{ minHeight: 54, textAlign: "left", borderRadius: 16 }}
            onClick={() => {
              const nowe = [...odp, i];
              setOdp(nowe);
              // Z tokenem (webinar) wynik od razu po ostatnim pytaniu, bez formularza.
              if (token && nowe.length === PYTANIA.length) pokazWynik(undefined, nowe);
            }}
          >
            {o.tekst}
          </button>
        ))}
      </div>
      {nr > 0 && (
        <button type="button" className={s.pigulka} style={{ justifySelf: "center", border: 0 }} onClick={() => setOdp(odp.slice(0, -1))}>
          ← Wróć
        </button>
      )}
    </section>
  );
}
