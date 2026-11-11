"use client";

import { useState } from "react";
import s from "../brunokursy/kursy.module.css";
import { TEMATY, dopasuj, type Odpowiedzi, type Szkolenie } from "@/lib/bruno/polecenia";

type Klucz = keyof Odpowiedzi;

const PYTANIA: { klucz: Klucz; pytanie: string; opcje: { v: string; l: string }[] }[] = [
  {
    klucz: "dlaKogo",
    pytanie: "Kogo chcesz przeszkolić?",
    opcje: [
      { v: "sam", l: "Siebie" },
      { v: "zespol", l: "Mój zespół handlowców" },
    ],
  },
  {
    klucz: "poziom",
    pytanie: "Ile lat sprzedajesz?",
    opcje: [
      { v: "start", l: "Zaczynam albo mniej niż rok" },
      { v: "srednio", l: "1-3 lata" },
      { v: "zaawansowany", l: "Ponad 3 lata" },
    ],
  },
  {
    klucz: "rynek",
    pytanie: "Komu sprzedajesz?",
    opcje: [
      { v: "b2b", l: "Firmom" },
      { v: "b2c", l: "Klientom indywidualnym" },
    ],
  },
  {
    klucz: "temat",
    pytanie: "Co chcesz poprawić najbardziej?",
    opcje: Object.entries(TEMATY).map(([v, l]) => ({ v, l })),
  },
  {
    klucz: "forma",
    pytanie: "Jak chcesz się uczyć?",
    opcje: [
      { v: "online", l: "Online" },
      { v: "sala", l: "Na sali" },
      { v: "oba", l: "Obojętnie" },
    ],
  },
];

function osoby(n: number) {
  const r = n % 10;
  const s = n % 100;
  if (n === 1) return "1 osoba";
  return `${n} ${r >= 2 && r <= 4 && (s < 12 || s > 14) ? "osoby" : "osób"}`;
}

export default function Ankieta() {
  const [krok, setKrok] = useState(0);
  const [odp, setOdp] = useState<Partial<Odpowiedzi>>({});
  const [wyniki, setWyniki] = useState<Szkolenie[] | null>(null);

  function wybierz(klucz: Klucz, v: string) {
    const nowe = { ...odp, [klucz]: v } as Partial<Odpowiedzi>;
    setOdp(nowe);
    if (krok + 1 < PYTANIA.length) setKrok(krok + 1);
    else setWyniki(dopasuj(nowe as Odpowiedzi));
  }

  function odNowa() {
    setOdp({});
    setKrok(0);
    setWyniki(null);
  }

  if (wyniki) {
    return (
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className={s.wyniki}>
          {wyniki.map((w, i) => (
            <a key={w.slug} href={w.url} target="_blank" rel="noopener noreferrer" className={`${s.karta} ${s.wynik} ${i === 0 ? s.wyroznienie : ""}`}>
              <div>
                <div className={s.miesiac}>{i === 0 ? "Najlepiej pasuje" : `Miejsce ${i + 1}`}</div>
                <h3 style={{ margin: 0 }}>{w.nazwa}</h3>
                <p>{w.trener}</p>
                <p>{w.opis}</p>
                <p>
                  {w.polecenia.length > 0 ? `Poleca: ${osoby(w.polecenia.length)}` : "Brak poleceń"}
                  {" · "}
                  {w.cena ?? "Cena do sprawdzenia"}
                </p>
                {w.polecenia[0] && <p>„{w.polecenia[0].cytat}” ({w.polecenia[0].kto}, {w.polecenia[0].rola})</p>}
              </div>
              <span className={`${s.przycisk} ${s.przyciskMaly} ${i === 0 ? "" : s.drugi}`}>Strona trenera</span>
            </a>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button type="button" className={`${s.przycisk} ${s.drugi}`} onClick={odNowa}>
            Wypełnij jeszcze raz
          </button>
        </div>
      </section>
    );
  }

  const p = PYTANIA[krok];
  return (
    <section className={s.formularz}>
      <div className={s.pod} style={{ textAlign: "center", marginTop: 0 }}>
        Pytanie {krok + 1} z {PYTANIA.length}
      </div>
      <h2 className={s.h2} style={{ marginBottom: 8 }}>
        {p.pytanie}
      </h2>
      <div style={{ display: "grid", gap: 10 }}>
        {p.opcje.map((o) => (
          <button key={o.v} type="button" className={`${s.pigulka} ${odp[p.klucz] === o.v ? s.pigulkaWl : ""}`} onClick={() => wybierz(p.klucz, o.v)}>
            {o.l}
          </button>
        ))}
      </div>
      {krok > 0 && (
        <button type="button" className={`${s.przycisk} ${s.drugi} ${s.przyciskMaly}`} onClick={() => setKrok(krok - 1)}>
          Wstecz
        </button>
      )}
    </section>
  );
}
