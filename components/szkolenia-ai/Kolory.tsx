"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { KLASY_WSZYSTKIE, NAZWY_ZMIENNYCH, PALETY, STARE, klasyGen, poprawnyKolor, zmienne, type Material } from "./motywy";

// Kolory strony, TYLKO w podglądzie. USER_001 21.11.2026 odrzucił kolejne wersje kolorów, więc wybiera sam:
// gotowe palety (kółka), własne tło i akcent (dwa pola koloru) oraz materiał (metal albo szkło).
// Zmiana działa od razu, bez przeładowania, w jednej karcie. Wybór zapamiętuje przeglądarka.
// Adres z ?kolor=kobalt otwiera daną paletę. Po decyzji paleta idzie na stałe przez parametr `motyw`, a ten plik znika.

type Stan = { id: string; b: string; a: string; m: Material };
const KLUCZ = "sza-kolory-2";

function zastosuj(s: Stan) {
  const root = document.querySelector<HTMLElement>(".sza");
  if (!root) return;
  root.classList.remove(...KLASY_WSZYSTKIE);
  NAZWY_ZMIENNYCH.forEach((z) => root.style.removeProperty(z));
  const stara = STARE.find((x) => x.id === s.id);
  if (stara) {
    root.classList.add(...stara.klasy);
    return;
  }
  root.classList.add(...klasyGen(s.b, s.m));
  Object.entries(zmienne(s.b, s.a)).forEach(([k, v]) => root.style.setProperty(k, v));
}

const zPalety = (id: string): Stan | null => {
  const p = PALETY.find((x) => x.id === id);
  if (p) return { id: p.id, b: p.b, a: p.a, m: p.m };
  const st = STARE.find((x) => x.id === id);
  return st ? { id: st.id, b: st.b, a: st.a, m: "metal" } : null;
};

export default function Kolory({ start }: { start: string }) {
  const [s, setS] = useState<Stan>(() => zPalety(start) ?? { id: "ciemny", b: "#030405", a: "#d9e000", m: "metal" });
  const [otwarte, setOtwarte] = useState(true);

  useEffect(() => {
    let nowy: Stan | null = null;
    const zAdresu = new URLSearchParams(window.location.search).get("kolor");
    if (zAdresu) nowy = zPalety(zAdresu);
    if (!nowy) {
      try {
        const z = JSON.parse(window.localStorage.getItem(KLUCZ) ?? "null");
        if (z && poprawnyKolor(z.b) && poprawnyKolor(z.a) && (z.m === "metal" || z.m === "szklo") && typeof z.id === "string") nowy = z;
      } catch {}
    }
    if (window.matchMedia("(max-width: 40rem)").matches) setOtwarte(false);
    if (nowy && nowy.id !== start) {
      zastosuj(nowy);
      setS(nowy);
    }
  }, [start]);

  function ustaw(nowy: Stan) {
    zastosuj(nowy);
    setS(nowy);
    try {
      window.localStorage.setItem(KLUCZ, JSON.stringify(nowy));
    } catch {}
  }

  const nazwa = PALETY.find((x) => x.id === s.id)?.nazwa ?? STARE.find((x) => x.id === s.id)?.nazwa ?? "Własna";
  const stara = STARE.some((x) => x.id === s.id);
  const probka = (b: string, a: string) => ({ "--pb": b, "--pa": a }) as CSSProperties;

  return (
    <div className={`kolory${otwarte ? " otwarte" : ""}`} role="group" aria-label="Kolory strony (tylko podgląd)">
      <button type="button" className="kolory-uchwyt" aria-expanded={otwarte} onClick={() => setOtwarte((x) => !x)}>
        Kolory <span aria-hidden="true">{otwarte ? "−" : "+"}</span>
      </button>
      {otwarte && (
        <div className="kolory-panel">
          <div className="kolory-probki">
            {PALETY.map((p) => (
              <button key={p.id} type="button" title={p.nazwa} aria-label={p.nazwa} aria-pressed={p.id === s.id} style={probka(p.b, p.a)} onClick={() => ustaw({ id: p.id, b: p.b, a: p.a, m: p.m })} />
            ))}
          </div>
          <div className="kolory-probki stare">
            {STARE.map((p) => (
              <button key={p.id} type="button" title={p.nazwa} aria-label={p.nazwa} aria-pressed={p.id === s.id} style={probka(p.b, p.a)} onClick={() => ustaw({ id: p.id, b: p.b, a: p.a, m: "metal" })} />
            ))}
            <span>wcześniejsze</span>
          </div>
          <div className="kolory-rzad">
            <label>
              Tło
              <input type="color" value={s.b} onChange={(e) => ustaw({ ...s, id: "wlasna", b: e.target.value })} />
            </label>
            <label>
              Akcent
              <input type="color" value={s.a} onChange={(e) => ustaw({ ...s, id: "wlasna", a: e.target.value })} />
            </label>
            <div className="kolory-mat">
              {(["metal", "szklo"] as Material[]).map((m) => (
                <button key={m} type="button" aria-pressed={!stara && s.m === m} onClick={() => ustaw({ ...s, id: stara ? "wlasna" : s.id, m })}>
                  {m === "metal" ? "Metal" : "Szkło"}
                </button>
              ))}
            </div>
          </div>
          <p className="kolory-opis">
            <b>{nazwa}</b>
            {!stara && ` · tło ${s.b} · akcent ${s.a} · ${s.m === "metal" ? "metal" : "szkło"}`}
          </p>
        </div>
      )}
    </div>
  );
}
