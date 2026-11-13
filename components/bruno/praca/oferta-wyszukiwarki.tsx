"use client";

import { useState } from "react";
import { GWARANCJA, PACZKA, SUBSKRYPCJA_PROG, SUBSKRYPCJA_ZL, WAZNOSC_MIES, handlowcow } from "@/lib/bruno/praca/kontakty-cennik";
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

  return (
    <section className={g.oferta} aria-label="Dostęp do handlowców">
      {blad && <p className={g.trzyBlad} role="alert">{blad}</p>}
      <div className={g.ofertaSiatka}>
        {ile > 0 && (
          <div className={`p-karta ${g.plan}`}>
            <h3>Paczka</h3>
            <p className={g.planCena}>{PACZKA.cena} zł <small>jednorazowo</small></p>
            <ul>
              <li>Pełne profile: {handlowcow(ile)} z wyniku</li>
              <li>Nazwisko, telefon, e-mail, zdjęcie i CV</li>
              {ile < PACZKA.ile && <li>Pozostałe kontakty z paczki ({PACZKA.ile - ile}) czekają na koncie {WAZNOSC_MIES} miesięcy</li>}
            </ul>
            <button type="button" className="p-btn" disabled={!!stan} onClick={() => kup("paczka")}>
              {stan === "paczka" ? "Chwileczkę…" : `Odblokuj · ${PACZKA.cena} zł`}
            </button>
          </div>
        )}
        {maKryteria && (
          <>
            <div className={`p-karta ${g.plan}`}>
              <h3>Subskrypcja</h3>
              <p className={g.planCena}>{SUBSKRYPCJA_ZL} zł <small>/ mies.</small></p>
              <ul>
                <li>Dosyłamy kontakt do każdego nowego dopasowanego handlowca, gdy tylko dołączy do bazy</li>
                <li>Dopasowanie co najmniej {SUBSKRYPCJA_PROG} %</li>
                <li>Bez dodawania oferty drugi raz: wystarczy ten opis</li>
                <li>Rezygnacja w panelu w każdej chwili</li>
              </ul>
              <button type="button" className="p-btn p-btn-2" disabled={!!stan} onClick={() => kup("subskrypcja")}>
                {stan === "subskrypcja" ? "Chwileczkę…" : `Włącz · ${SUBSKRYPCJA_ZL} zł / mies.`}
              </button>
            </div>
            <div className={`p-karta ${g.plan}`}>
              <h3>Gwarancja</h3>
              <p className={g.planCena}>{GWARANCJA.cena} zł <small>jednorazowo</small></p>
              <ul>
                <li>{GWARANCJA.ile} dopasowanych handlowców ponad {GWARANCJA.prog} % w {GWARANCJA.dni} dni</li>
                <li>Albo zwrot całej kwoty</li>
                <li>Bez dodawania oferty drugi raz: wystarczy ten opis</li>
              </ul>
              <button type="button" className="p-btn p-btn-2" disabled={!!stan} onClick={() => kup("gwarancja")}>
                {stan === "gwarancja" ? "Chwileczkę…" : `Zamów · ${GWARANCJA.cena} zł`}
              </button>
            </div>
          </>
        )}
      </div>
      <p className={g.ofertaStopka}>
        <a href="/praca/regulamin">Regulamin</a>
        {test ? " · Tryb testowy: bez płatności." : ""}
      </p>
    </section>
  );
}
