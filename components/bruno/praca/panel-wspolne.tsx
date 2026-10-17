"use client";

import s from "./praca.module.css";

// 17.10: wspólne kawałki paneli kandydata i pracodawcy.
const MIES = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
export function formatDaty(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MIES[d.getMonth()]} ${d.getFullYear()}`;
}

export function PanelGlowa({ etykieta, tytul, opis }: { etykieta: string; tytul: string; opis?: string }) {
  return (
    <header className={s.panelGlowa2}>
      <p className={s.aplikujEtykieta}>{etykieta}</p>
      <h1 className={s.ofertaH}>{tytul}</h1>
      {opis && <p className={s.firma}>{opis}</p>}
    </header>
  );
}

export function Wyloguj() {
  return (
    <button
      type="button"
      className={s.wyczysc}
      onClick={async () => {
        await fetch("/api/bruno/praca/konto/wyloguj", { method: "POST" });
        location.href = "/praca";
      }}
    >
      Wyloguj się
    </button>
  );
}
