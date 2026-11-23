"use client";

import { useState } from "react";
import type { KartaHandlowca } from "@/lib/bruno/praca/handlowcy";
import { CENA_KONTAKTU, MAKS_WYBRANYCH, osob, znaczkiRynku } from "@/lib/bruno/praca/kontakty-cennik";
import g from "./gielda.module.css";

// 23.11 (USER_001): publiczna wyszukiwarka. Każdy widzi szczegóły profilu, ale bez imienia, nazwiska, telefonu, e-maila,
// zdjęcie zamazane. Przy każdej osobie checkbox, na dole pasek „Odblokuj {n} osób” = 50 zł za każdą
// (POST /api/bruno/praca/kontakty → Stripe Checkout, konto firmy zakładane po płatności).

const zl = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function WynikOsoby({
  karty,
  zdjecia,
  odblokowane,
  powrot,
  test,
}: {
  karty: KartaHandlowca[];
  /** id → zamazane zdjęcie (data URI 12 px), tylko dla osób ze zdjęciem. */
  zdjecia: Record<string, string>;
  /** Id osób, których kontakt zalogowana firma już ma. */
  odblokowane: string[];
  powrot: string;
  /** Lokalnie bez klucza Stripe: zakup testowy. */
  test: boolean;
}) {
  const mam = new Set(odblokowane);
  const [wybrane, setWybrane] = useState<string[]>([]);
  const [stan, setStan] = useState<"" | "wysylam">("");
  const [blad, setBlad] = useState("");
  const ile = wybrane.length;

  function przelacz(id: string) {
    setBlad("");
    setWybrane((w) => (w.includes(id) ? w.filter((x) => x !== id) : w.length >= MAKS_WYBRANYCH ? w : [...w, id]));
  }

  async function odblokuj() {
    setBlad("");
    setStan("wysylam");
    const odp = await fetch("/api/bruno/praca/kontakty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wybrani: wybrane, powrot }),
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
      <ul className={g.kartyH}>
        {karty.map((k) => {
          const mamGo = mam.has(k.id);
          const wl = wybrane.includes(k.id);
          const wiersze: [string, string][] = [
            ["Płeć", k.plec],
            ["W sprzedaży", k.lata],
            ["Sytuacja", k.sytuacja],
            ["Sprzedaje", znaczkiRynku(k.rynek).join(" i ")],
            ["Jak sprzedaje", k.kanaly.join(", ")],
            ["Branże", k.branze.filter((x) => x !== "Inna").join(", ") || (k.branze.length ? "Inna" : "")],
            ["Mocne strony", k.mocne.join(", ")],
            ["Plan w ostatnim roku", k.plan],
            ["Średnia sprzedaż", k.transakcja],
            ["Chce pracować", k.tryb.join(", ")],
            ["Umowa", k.umowa.join(", ")],
            ["Oczekuje", k.pensja ? `${zl(k.pensja)} zł netto / mies.` : ""],
            ["Może zacząć", k.start],
            ["Przeprowadzka", k.przeprowadzka],
            ["CV", k.maCV ? "Jest" : ""],
          ];
          return (
            <li key={k.id} className={`${g.kartaH} ${wl ? g.kartaHWl : ""}`}>
              <div className={g.kartaHGora}>
                {zdjecia[k.id] ? (
                  <span className={g.fotoZamazane} title="Zdjęcie widoczne po odblokowaniu">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={zdjecia[k.id]} alt="" />
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                ) : (
                  <span className={`${g.kartaHInicjal} ${g.kartaHZamek}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                )}
                <div>
                  <h3>{k.plec === "Kobieta" ? "Handlowczyni" : "Handlowiec"}</h3>
                  <p>{[k.stanowisko, k.miasto].filter(Boolean).join(" · ")}</p>
                </div>
                {mamGo ? (
                  <a className="p-chip" href="/praca/panel?z=handlowcy">Kontakt w panelu</a>
                ) : (
                  <label className={g.kartaHWybor} title={`Odblokuj za ${CENA_KONTAKTU} zł`}>
                    <input type="checkbox" aria-label="Zaznacz do odblokowania" checked={wl} disabled={!wl && ile >= MAKS_WYBRANYCH} onChange={() => przelacz(k.id)} />
                  </label>
                )}
              </div>
              <dl className={g.kartaHWiersze}>
                {k.dopasowanie != null && (
                  <div>
                    <dt>Dopasowanie</dt>
                    <dd>
                      <b>{k.dopasowanie} %</b>
                      <span className={g.kartaHPasek} aria-hidden="true">
                        <i style={{ width: `${k.dopasowanie}%` }} />
                      </span>
                    </dd>
                  </div>
                )}
                {wiersze
                  .filter(([, v]) => v)
                  .map(([e, v]) => (
                    <div key={e}>
                      <dt>{e}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                {!mamGo && (
                  <div className={g.kartaHUkryte}>
                    <dt>Po odblokowaniu</dt>
                    <dd>Imię i nazwisko, telefon, e-mail, zdjęcie{k.maCV ? ", CV" : ""}</dd>
                  </div>
                )}
              </dl>
            </li>
          );
        })}
      </ul>

      <div className={g.odblokujPasek}>
        <div>
          <b>{ile ? `Zaznaczono: ${osob(ile).replace("osobę", "osoba")}` : "Zaznacz osoby do odblokowania"}</b>
          <small>
            {CENA_KONTAKTU} zł brutto za osobę, płatność jednorazowa{ile >= MAKS_WYBRANYCH ? ` · najwięcej ${MAKS_WYBRANYCH} naraz` : ""}
            {test ? " · tryb lokalny: bez Stripe" : ""}
          </small>
          {blad && <span className={g.trzyBlad} role="alert">{blad}</span>}
        </div>
        <button type="button" className="p-btn" disabled={!ile || stan === "wysylam"} onClick={odblokuj}>
          {stan === "wysylam" ? "Chwileczkę…" : ile ? `Odblokuj ${osob(ile)} · ${zl(ile * CENA_KONTAKTU)} zł` : "Odblokuj"}
        </button>
      </div>
    </>
  );
}
