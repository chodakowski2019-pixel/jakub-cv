"use client";

import { useEffect, useState } from "react";

// Odliczanie do końca Black Week 2026 (poniedziałek 30.11, koniec dnia, czas polski), w czarnej tablicy pierwszego ekranu.
// Liczone w przeglądarce po zamontowaniu; do tego czasu kreski, żeby układ nie skakał. Po końcu: napis, bez zer.
const dwa = (n: number) => String(n).padStart(2, "0");

export function Odliczanie({ start, koniec }: { start: string; koniec: string }) {
  const [teraz, setTeraz] = useState<number | null>(null);
  useEffect(() => {
    setTeraz(Date.now());
    const t = setInterval(() => setTeraz(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const k = new Date(koniec).getTime();
  const s = new Date(start).getTime();
  if (teraz !== null && teraz > k)
    return (
      <div className="bai-odl">
        <p className="bai-tab-nad">Black Week 2026</p>
        <p className="bai-odl-koniec">Zakończony. Część ofert trwa dłużej, termin jest przy każdej.</p>
      </div>
    );
  const przed = teraz !== null && teraz < s;
  const roznica = teraz === null ? null : Math.max(0, (przed ? s : k) - teraz);
  const pola: [string, string][] =
    roznica === null
      ? [["--", "dni"], ["--", "godz."], ["--", "min."], ["--", "sek."]]
      : [
          [dwa(Math.floor(roznica / 86400000)), "dni"],
          [dwa(Math.floor((roznica % 86400000) / 3600000)), "godz."],
          [dwa(Math.floor((roznica % 3600000) / 60000)), "min."],
          [dwa(Math.floor((roznica % 60000) / 1000)), "sek."],
        ];
  return (
    <div className="bai-odl" role="timer" aria-label={przed ? "Czas do startu Black Week" : "Czas do końca Black Week"}>
      <p className="bai-tab-nad">{przed ? "Do startu Black Week" : "Do końca Black Week · poniedziałek 30.11"}</p>
      <div className="bai-odl-cyfry">
        {pola.map(([v, e]) => (
          <div key={e}>
            <span className="bai-odl-liczba">{v}</span>
            <span className="bai-odl-jedn">{e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
