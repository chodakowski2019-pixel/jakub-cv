"use client";

import { useEffect, useState } from "react";

// Odliczanie do końca Black Week 2026 (poniedziałek 30.11, koniec dnia, czas polski).
// Liczone w przeglądarce po zamontowaniu (bez różnic między serwerem a przeglądarką). Po końcu: napis „zakończony”, bez zer.
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
  if (teraz === null) return <div className="bai-odl" aria-hidden />;
  if (teraz > k)
    return (
      <div className="bai-odl bai-odl-koniec">
        <p className="bai-mono">Black Week 2026 zakończony. Promocje poniżej mogą jeszcze trwać u producentów, sprawdzaj daty przy ofertach.</p>
      </div>
    );
  const roznica = Math.max(0, (teraz < s ? s : k) - teraz);
  const d = Math.floor(roznica / 86400000);
  const g = Math.floor((roznica % 86400000) / 3600000);
  const m = Math.floor((roznica % 3600000) / 60000);
  const sek = Math.floor((roznica % 60000) / 1000);
  return (
    <div className="bai-odl" role="timer" aria-label={teraz < s ? "Czas do startu Black Week" : "Czas do końca Black Week"}>
      <p className="bai-mono bai-odl-nad">{teraz < s ? "Do startu Black Week" : "Do końca Black Week (30.11, Cyber Monday)"}</p>
      <div className="bai-odl-cyfry">
        {[
          [d, "dni"],
          [g, "godz."],
          [m, "min."],
          [sek, "sek."],
        ].map(([v, e]) => (
          <div key={e as string}>
            <span className="bai-odl-liczba">{dwa(v as number)}</span>
            <span className="bai-mono">{e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
