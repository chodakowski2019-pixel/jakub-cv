"use client";

import { useState } from "react";
import { GWARANCJA, PACZKA, SUBSKRYPCJA_PROG, SUBSKRYPCJA_ZL } from "@/lib/bruno/praca/kontakty-cennik";
import g from "./gielda.module.css";

// 12.11 (USER_001): 3 sposoby zakupu pod wynikiem publicznej wyszukiwarki: paczka 3 handlowców (149 zł, jednorazowo),
// subskrypcja (290 zł / mies., dosyłamy nowych dopasowanych od 70 %, bez dodawania oferty drugi raz) i gwarancja (990 zł, 5 handlowców w 30 dni albo zwrot).
// Paczka idzie przez /api/bruno/praca/kontakty (jak dotąd), dwie pozostałe przez /api/bruno/praca/zlecenie.
export default function OfertaWyszukiwarki({
  opis,
  doOdblokowania,
  maKryteria,
  test,
}: {
  opis: string;
  /** Id pokazanych handlowców, których kontaktu firma jeszcze nie ma (najwyżej tylu, ilu mieści paczka). */
  doOdblokowania: string[];
  /** false = z opisu nie wyszło żadne kryterium: subskrypcji i gwarancji nie sprzedajemy. */
  maKryteria: boolean;
  /** Lokalnie bez klucza Stripe: zakup testowy. */
  test: boolean;
}) {
  const [stan, setStan] = useState<"" | "paczka" | "subskrypcja" | "gwarancja">("");
  const [blad, setBlad] = useState("");
  const ile = doOdblokowania.length;

  async function kup(co: "paczka" | "subskrypcja" | "gwarancja") {
    setBlad("");
    setStan(co);
    const odp = await fetch(co === "paczka" ? "/api/bruno/praca/kontakty" : "/api/bruno/praca/zlecenie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(co === "paczka" ? { wybrani: doOdblokowania, pakiet: PACZKA.ile, powrot: `/wyszukiwarka?q=${encodeURIComponent(opis)}` } : { rodzaj: co, opis }),
    }).catch(() => null);
    const j = await odp?.json().catch(() => null);
    if (!odp?.ok || !j?.ok || !j.url) {
      setBlad(j?.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("");
      return;
    }
    window.location.href = j.url;
  }

  // 13.11 (USER_001: „zrób to w ładniejszej tabeli, żeby było przejrzyściej”): porównanie w tabeli, wiersz = jedna cecha.
  // Na telefonie ta sama treść jako karty (tabela z 4 kolumnami się nie mieści).
  type Plan = { klucz: "paczka" | "subskrypcja" | "gwarancja"; nazwa: string; cena: string; okres: string; przycisk: string; glowny?: boolean; pola: (string | boolean)[] };
  const WIERSZE = ["Co otrzymasz", "Dopasowanie", "Kiedy", "Pełny profil: nazwisko, telefon, e-mail, zdjęcie, CV", "Bez dodawania oferty drugi raz", "Zwrot pieniędzy", "Rezygnacja"];
  const plany: Plan[] = [
    ...(ile > 0
      ? [
          {
            klucz: "paczka" as const,
            nazwa: "Paczka",
            cena: `${PACZKA.cena} zł`,
            okres: "jednorazowo",
            przycisk: `Odblokuj · ${PACZKA.cena} zł`,
            glowny: true,
            pola: [
              "Kontakty: handlowcy, którzy pokazali się powyżej",
              "Jak w wyniku",
              "Od razu",
              true,
              false,
              false,
              "Opłata jednorazowa",
            ],
          },
        ]
      : []),
    ...(maKryteria
      ? [
          {
            klucz: "subskrypcja" as const,
            nazwa: "Subskrypcja",
            cena: `${SUBSKRYPCJA_ZL} zł`,
            okres: "/ mies.",
            przycisk: `Włącz · ${SUBSKRYPCJA_ZL} zł / mies.`,
            pola: ["Kontakt do każdego nowego dopasowanego handlowca, który dołączy do naszej bazy", `Od ${SUBSKRYPCJA_PROG} % do Twojej oferty`, "Gdy tylko dołączy do bazy", true, true, false, "W panelu, w każdej chwili"],
          },
          {
            klucz: "gwarancja" as const,
            nazwa: "Gwarancja",
            cena: `${GWARANCJA.cena} zł`,
            okres: "jednorazowo",
            przycisk: `Zamów · ${GWARANCJA.cena} zł`,
            pola: [`Kontakty: ${GWARANCJA.ile} dopasowanych handlowców`, `Ponad ${GWARANCJA.prog} % do Twojej oferty`, `W ${GWARANCJA.dni} dni`, true, true, `Cała kwota, gdy będzie mniej niż ${GWARANCJA.ile} kontaktów z powyżej ${GWARANCJA.prog} % dopasowania`, "Opłata jednorazowa"],
          },
        ]
      : []),
  ];
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
    <button type="button" className={`p-btn ${p.glowny ? "" : "p-btn-2"}`} disabled={!!stan} onClick={() => kup(p.klucz)}>
      {stan === p.klucz ? "Chwileczkę…" : p.przycisk}
    </button>
  );
  if (!plany.length) return null;

  return (
    <section className={g.oferta} aria-label="Dostęp do handlowców">
      {blad && <p className={g.trzyBlad} role="alert">{blad}</p>}
      <div className={`p-karta ${g.tabOkno}`}>
        <table className={g.tab} style={{ ["--kolumn" as string]: plany.length }}>
          <thead>
            <tr>
              <th className={g.tabBrutto}>Ceny brutto</th>
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
                <th scope="row">{w}</th>
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
          <div className={`p-karta ${g.plan}`} key={p.klucz}>
            <h3>{p.nazwa}</h3>
            <p className={g.planCena}>{p.cena} <small>{p.okres}</small></p>
            <dl className={g.planLista}>
              {WIERSZE.map((w, i) =>
                p.pola[i] === false ? null : (
                  <div key={w}>
                    <dt>{w}</dt>
                    <dd>{pole(p.pola[i])}</dd>
                  </div>
                ),
              )}
            </dl>
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
