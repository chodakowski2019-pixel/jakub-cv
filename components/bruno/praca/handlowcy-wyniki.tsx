"use client";

import { useState } from "react";
import type { KartaHandlowca } from "@/lib/bruno/praca/handlowcy";
import { MAKS_WYBRANYCH, PAKIETY, WAZNOSC_MIES, handlowcow, kontaktow, pakietDla, znaczkiRynku } from "@/lib/bruno/praca/kontakty-cennik";
import d from "./dolacz.module.css";
import h from "./handlowcy.module.css";

// 11.11 (USER_001): wynik wyszukiwania handlowców dla firmy. Karty bez danych kontaktowych, wybór osób,
// na dole pasek z pakietem i przyciskiem do płatności (POST /api/bruno/praca/kontakty → Stripe Checkout).
export default function HandlowcyWyniki({
  karty,
  odblokowane,
  naKoncie,
  powrot,
  test,
}: {
  karty: KartaHandlowca[];
  /** Id osób, których kontakt zalogowana firma już ma. */
  odblokowane: string[];
  /** Kontakty opłacone wcześniej, do wykorzystania bez płatności (0 = brak albo firma niezalogowana). */
  naKoncie: number;
  powrot: string;
  /** Lokalnie bez klucza Stripe: zakup testowy. */
  test: boolean;
}) {
  const mam = new Set(odblokowane);
  const doWyboru = karty.filter((k) => !mam.has(k.id));
  const [wybrane, setWybrane] = useState<string[]>(() => doWyboru.slice(0, MAKS_WYBRANYCH).map((k) => k.id));
  const [pakietIle, setPakietIle] = useState<number | null>(null);
  const [stan, setStan] = useState<"" | "wysylam">("");
  const [blad, setBlad] = useState("");

  const ile = wybrane.length;
  const minimalny = pakietDla(Math.max(1, ile));
  const pakiet = PAKIETY.find((p) => p.ile === pakietIle && p.ile >= ile) ?? minimalny;
  const zKonta = naKoncie >= ile && ile > 0;

  function przelacz(id: string) {
    setBlad("");
    setWybrane((w) => (w.includes(id) ? w.filter((x) => x !== id) : w.length >= MAKS_WYBRANYCH ? w : [...w, id]));
  }

  async function odblokuj(platnosc: boolean) {
    setBlad("");
    setStan("wysylam");
    const odp = await fetch("/api/bruno/praca/kontakty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wybrani: wybrane, pakiet: pakiet.ile, powrot, zKonta: !platnosc }),
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
    <>
      <ul className={h.siatka}>
        {karty.map((k) => {
          const mamGo = mam.has(k.id);
          const wl = wybrane.includes(k.id);
          return (
            <li key={k.id} className={`${h.karta} ${wl ? h.kartaWl : ""}`}>
              <div className={h.kartaGora}>
                <span className={h.inicjal} aria-hidden="true">{k.imie[0]}</span>
                <div>
                  <h3 className={h.imie}>{k.imie}</h3>
                  <p className={h.rola}>{[k.stanowisko, k.miasto].filter(Boolean).join(" · ")}</p>
                  {k.sprawdzony ? (
                    <p className={h.ok}>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M10 1.5l2.3 1.6 2.8-.2 1 2.6 2.3 1.6-.8 2.7.8 2.7-2.3 1.6-1 2.6-2.8-.2L10 18.5l-2.3-1.6-2.8.2-1-2.6-2.3-1.6.8-2.7-.8-2.7 2.3-1.6 1-2.6 2.8.2z" fill="#2f7a4b" />
                        <path d="M6.6 10.2l2.3 2.3 4.5-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Sprawdzony profil
                    </p>
                  ) : (
                    <p className={`${h.ok} ${h.czeka}`}>W weryfikacji</p>
                  )}
                </div>
              </div>
              <div className={h.kartaTresc}>
                {/* 12.11 (USER_001): zamiast „Plan w ostatnim roku” = % dopasowania do wyszukiwania. */}
                <div className={h.fakty}>
                  <div>
                    <span className={h.etykieta}>W sprzedaży</span>
                    <p>{k.lata}</p>
                  </div>
                  {k.dopasowanie != null && (
                    <div>
                      <span className={h.etykieta}>Dopasowanie</span>
                      <p className={h.dopasowanie}>{k.dopasowanie} %</p>
                      <div className={h.pasekDop} aria-hidden="true">
                        <i style={{ width: `${k.dopasowanie}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <span className={h.etykieta}>Branże</span>
                <ul className={h.tagi}>
                  {k.branze.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <span className={h.etykieta}>Mocne strony</span>
                <ul className={h.tagi}>
                  {k.mocne.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <div className={h.fakty}>
                  <div>
                    <span className={h.etykieta}>Sprzedaje</span>
                    <ul className={h.tagi}>
                      {znaczkiRynku(k.rynek).map((x) => (
                        <li key={x} className={h.tagMocny}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className={h.etykieta}>Może zacząć</span>
                    <p>{k.start}</p>
                  </div>
                </div>
                {!mamGo && (
                  <ul className={h.zamek} aria-label="Dane kontaktowe ukryte">
                    <li>
                      <span>Telefon</span>
                      <span aria-hidden="true">••• ••• •••</span>
                    </li>
                    <li>
                      <span>E-mail{k.maCV ? " i CV" : ""}</span>
                      <span aria-hidden="true">•••••@•••••</span>
                    </li>
                  </ul>
                )}
              </div>
              {mamGo ? (
                <a className={h.wybierz} href="/praca/panel?z=handlowcy">
                  Kontakt w panelu →
                </a>
              ) : (
                <button type="button" className={`${h.wybierz} ${wl ? h.wybierzWl : ""}`} aria-pressed={wl} disabled={!wl && ile >= MAKS_WYBRANYCH} onClick={() => przelacz(k.id)}>
                  {wl ? "✓ Wybrany" : "Wybierz"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {doWyboru.length > 0 && (
        <div className={h.kup}>
          <div className={h.kupKarta}>
            <div className={h.kupIle}>
              Wybrano: <b>{handlowcow(ile)}</b>
              {zKonta ? (
                <small>Na koncie: {kontaktow(naKoncie)}</small>
              ) : pakiet.ile > ile && ile > 0 ? (
                <small>
                  Zostaje {kontaktow(pakiet.ile - ile)} na {WAZNOSC_MIES} mies.
                </small>
              ) : (
                <small>Płatność jednorazowa</small>
              )}
              {blad && <span className={h.kupBlad}>{blad}</span>}
              {test && !blad && <span className={h.kupTest}>Tryb lokalny: bez Stripe</span>}
            </div>
            {zKonta ? (
              <button type="button" className={d.cta} disabled={stan === "wysylam"} onClick={() => odblokuj(false)}>
                {stan === "wysylam" ? "Chwileczkę…" : `Odblokuj ${kontaktow(ile)} z konta`}
              </button>
            ) : (
              <>
                <div className={h.pakiety} role="radiogroup" aria-label="Pakiet kontaktów">
                  {PAKIETY.map((p) => (
                    <button type="button" role="radio" aria-checked={pakiet.ile === p.ile} key={p.ile} className={`${h.pakiet} ${pakiet.ile === p.ile ? h.pakietWl : ""}`} disabled={p.ile < ile} onClick={() => setPakietIle(p.ile)}>
                      {kontaktow(p.ile)}
                      <b>{p.cena} zł</b>
                    </button>
                  ))}
                </div>
                <button type="button" className={d.cta} disabled={stan === "wysylam" || ile === 0} onClick={() => odblokuj(true)}>
                  {stan === "wysylam" ? "Chwileczkę…" : `Odblokuj kontakty · ${pakiet.cena} zł`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
