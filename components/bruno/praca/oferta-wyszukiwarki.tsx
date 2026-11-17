"use client";

import { useState } from "react";
import { PAKIETY_FIRM, PAKIET_PROG, handlowcow, type PakietFirmy } from "@/lib/bruno/praca/kontakty-cennik";
import g from "./gielda.module.css";

// 12.11 (USER_001): 3 sposoby zakupu pod wynikiem publicznej wyszukiwarki: paczka 3 handlowców (149 zł, jednorazowo),
// subskrypcja (290 zł / mies., dosyłamy nowych dopasowanych od 70 %, bez dodawania oferty drugi raz) i gwarancja (990 zł, 5 handlowców w 30 dni albo zwrot).
// Paczka idzie przez /api/bruno/praca/kontakty (jak dotąd), dwie pozostałe przez /api/bruno/praca/zlecenie.
// 17.11 (USER_001): zamiast paczki, subskrypcji i gwarancji = 3 pakiety handlowców z nagraniami sprzedażowymi, płatność jednorazowa
// (500 zł = 3 do 7 dni, 1 000 zł = 10 pod klienta firmy do 14 dni, 1 500 zł = 20 pod klienta firmy do 60 dni). Wszystkie przez /api/bruno/praca/zlecenie.
/** 1000 → „1 000” (pl-PL nie grupuje liczb czterocyfrowych). */
const zl = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** 17.11 (USER_001): dopisek w nawiasie przy nazwie wiersza bez pogrubienia. */
function nazwaWiersza(w: string) {
  const i = w.indexOf(" (");
  if (i < 0) return w;
  return (
    <>
      {w.slice(0, i)} <span style={{ fontWeight: 400 }}>{w.slice(i + 1)}</span>
    </>
  );
}

export default function OfertaWyszukiwarki({
  opis,
  maKryteria,
  test,
}: {
  opis: string;
  /** Id pokazanych handlowców (zostaje dla zgodności z wynikiem, pakiety go nie używają). */
  doOdblokowania?: string[];
  /** false = z opisu nie wyszło żadne kryterium: pakietów nie sprzedajemy (nie wiadomo, kogo szukać). */
  maKryteria: boolean;
  /** Lokalnie bez klucza Stripe: zakup testowy. */
  test: boolean;
}) {
  const [stan, setStan] = useState<"" | PakietFirmy["klucz"]>("");
  const [blad, setBlad] = useState("");

  async function kup(p: PakietFirmy) {
    setBlad("");
    setStan(p.klucz);
    const odp = await fetch("/api/bruno/praca/zlecenie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rodzaj: "pakiet", pakiet: p.klucz, opis }),
    }).catch(() => null);
    const j = await odp?.json().catch(() => null);
    if (!odp?.ok || !j?.ok || !j.url) {
      setBlad(j?.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("");
      return;
    }
    window.location.href = j.url;
  }

  type Plan = { klucz: PakietFirmy["klucz"]; pakiet: PakietFirmy; nazwa: string; cena: string; okres: string; przycisk: string; glowny?: boolean; pola: (string | boolean)[] };
  // 17.11 (USER_001): nagrania i „pod Twojego klienta” = jeden wiersz, we wszystkich pakietach; przy liczbie handlowców próg dopasowania.
  const WIERSZE = [`Handlowcy (min. ${PAKIET_PROG}% dopasowania handlowca do firmy)`, "Nagrania sprzedażowe (otrzymasz nagranie, jak handlowiec sprzedaje Twojemu klientowi; to rozmowa sprzedażowa z AI)", "Pełny profil: nazwisko, telefon, e-mail, zdjęcie, CV", "Czas dostarczenia", "Płatność"];
  const plany: Plan[] = maKryteria
    ? PAKIETY_FIRM.map((p) => ({
        klucz: p.klucz,
        pakiet: p,
        nazwa: p.nazwa,
        cena: `${zl(p.cena)} zł`,
        okres: "brutto",
        // 17.11 (USER_001): teksty przycisków per pakiet
        przycisk: { s: "Chcę ten pakiet", m: "To coś dla mnie", l: "Wybieram ten pakiet" }[p.klucz],
        glowny: p.klucz === "m",
        pola: [handlowcow(p.ile), true, true, `Do ${p.dni} dni`, "Jednorazowa"],
      }))
    : [];
  const pole = (v: string | boolean) =>
    v === true ? (
      <svg className={g.tabTak} viewBox="0 0 24 24" role="img" aria-label="Tak">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    ) : v === false ? (
      <span className={g.tabNie} role="img" aria-label="Nie" />
    ) : (
      v
    );
  const guzik = (p: Plan) => (
    <button type="button" className={`p-btn ${p.glowny ? "" : "p-btn-2"}`} disabled={!!stan} onClick={() => kup(p.pakiet)}>
      {stan === p.klucz ? "Chwileczkę…" : p.przycisk}
    </button>
  );
  if (!plany.length) return null;

  return (
    <section className={g.oferta} aria-label="Dostęp do handlowców">
      {/* 17.11 (USER_001): nagłówek nad pakietami. Liczba podana przez USER_001 (baza giełdy 17.11 = 13 profili), sprawdzić przed push. */}
      <h2 className={g.ofertaNaglowek}>+1000 handlowców w bazie</h2>
      {blad && <p className={g.trzyBlad} role="alert">{blad}</p>}
      <div className={`p-karta ${g.tabOkno}`}>
        <table className={g.tab} style={{ ["--kolumn" as string]: plany.length }}>
          <thead>
            <tr>
              <th className={g.tabBrutto} />
              {plany.map((p) => (
                <th key={p.klucz} scope="col" className={p.glowny ? g.tabGlowna : ""}>
                  <span className={g.tabNazwa}>{p.nazwa}</span>
                  <span className={g.planCena}>{p.cena} <small>{p.okres}</small></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WIERSZE.map((w, i) => (
              <tr key={w}>
                <th scope="row">{nazwaWiersza(w)}</th>
                {plany.map((p) => (
                  <td key={p.klucz} className={p.glowny ? g.tabGlowna : ""}>{pole(p.pola[i])}</td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              {plany.map((p) => (
                <td key={p.klucz} className={p.glowny ? g.tabGlowna : ""}>{guzik(p)}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className={g.ofertaSiatka}>
        {plany.map((p) => (
          // 17.11 (USER_001: „na telefonach poprawić widoczność pakietów”): karta = nazwa i cena w jednym wierszu
          // + krótka lista z ptaszkami (bez długich etykiet tabeli, które na 390 px dawały 1,5 ekranu na pakiet).
          <div className={`p-karta ${g.plan} ${p.glowny ? g.planGlowny : ""}`} key={p.klucz}>
            <div className={g.planGora}>
              <h3>{p.nazwa}</h3>
              <p className={g.planCena}>{p.cena} <small>{p.okres}</small></p>
            </div>
            <ul className={g.planPunkty}>
              {/* 17.11 (USER_001): każdy punkt oddzielony poziomą kreską, za ptaszkiem pionowa kreska */}
              {[
                <><b>{handlowcow(p.pakiet.ile)}</b> (min. {PAKIET_PROG}% dopasowania do firmy)</>,
                <><b>Nagrania sprzedażowe</b> pod Twojego klienta (rozmowa z AI)</>,
                <>Pełny profil: nazwisko, telefon, e-mail, zdjęcie, CV</>,
                <>Dostarczenie <b>do {p.pakiet.dni} dni</b></>,
                <>Płatność jednorazowa</>,
              ].map((t, i) => (
                <li key={i}>
                  <span className={g.planPtaszek} aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            {guzik(p)}
          </div>
        ))}
      </div>
      <p className={g.ofertaStopka}>
        <a href="/praca/regulamin">Regulamin</a>
        {test ? " · Tryb testowy: bez płatności." : ""}
      </p>
    </section>
  );
}
