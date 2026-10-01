// Statystyki panelu jako wykresy (USER_001 1.10): pierścienie postępu dla
// „ile zostało z ilu" i kafelki z paskiem /10 dla ocen. Jeden kolor marki
// (sekwencyjny), tekst w kolorach tekstu, nie serii.

export function Pierscien({ wartosc, max, liczba, opis, uwaga }: { wartosc: number; max: number; liczba: string; opis: string; uwaga?: string }) {
  const r = 30;
  const obwod = 2 * Math.PI * r;
  const udzial = max > 0 ? Math.min(1, Math.max(0, wartosc / max)) : 0;
  return (
    <div className="bruno-szklo rounded-2xl p-4 flex items-center gap-4">
      <svg viewBox="0 0 72 72" width="72" height="72" className="shrink-0" role="img" aria-label={`${opis}: ${liczba}`}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(14,116,144,0.12)" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="url(#bruno-pierscien)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${obwod * udzial} ${obwod}`}
          transform="rotate(-90 36 36)"
          className="bruno-pierscien-wypelnienie"
        />
        <defs>
          <linearGradient id="bruno-pierscien" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0e7490" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <text x="36" y="40" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-poppins)" }}>
          {liczba}
        </text>
      </svg>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 leading-tight">{opis}</div>
        {uwaga && <div className="text-[11px] text-slate-400 mt-1 leading-snug">{uwaga}</div>}
      </div>
    </div>
  );
}

export function Ocena({ wartosc, opis, uwaga }: { wartosc: number | null; opis: string; uwaga?: string }) {
  const udzial = wartosc === null ? 0 : Math.min(1, Math.max(0, wartosc / 10));
  return (
    <div className="bruno-szklo rounded-2xl p-4 flex flex-col justify-between gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="bruno-h2 text-[1.6rem] leading-none bruno-gradient-tekst">{wartosc === null ? "–" : wartosc}</span>
        <span className="text-[11px] text-slate-400">/ 10</span>
      </div>
      <div className="h-1.5 rounded-full bg-cyan-900/10 overflow-hidden" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-teal-700 transition-[width] duration-500" style={{ width: `${udzial * 100}%` }} />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-800 leading-tight">{opis}</div>
        {uwaga && <div className="text-[11px] text-slate-400 mt-0.5">{uwaga}</div>}
      </div>
    </div>
  );
}

export function Licznik({ liczba, opis, uwaga }: { liczba: string; opis: string; uwaga?: string }) {
  return (
    <div className="bruno-szklo rounded-2xl p-4 flex flex-col justify-between gap-2">
      <span className="bruno-h2 text-[1.6rem] leading-none bruno-gradient-tekst">{liczba}</span>
      <div>
        <div className="text-sm font-semibold text-slate-800 leading-tight">{opis}</div>
        {uwaga && <div className="text-[11px] text-slate-400 mt-0.5">{uwaga}</div>}
      </div>
    </div>
  );
}
