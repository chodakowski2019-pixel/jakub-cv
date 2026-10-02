import type { Rozmowa } from "@/lib/bruno/db";

// Statystyki jako wykresy (USER_001 1.10): pierścienie postępu dla „ile
// zostało z ilu", słupki na 7 dni, kafelki z paskiem /10 dla ocen. Jeden
// kolor marki (sekwencyjny), tekst w kolorach tekstu, nie serii.

export function Pierscien({ wartosc, max, liczba, opis, uwaga, goly }: { wartosc: number; max: number; liczba: string; opis: string; uwaga?: string; goly?: boolean }) {
  const r = 30;
  const obwod = 2 * Math.PI * r;
  const udzial = max > 0 ? Math.min(1, Math.max(0, wartosc / max)) : 0;
  return (
    <div className={`${goly ? "rounded-2xl bg-white/50 border border-white/80" : "bruno-szklo rounded-2xl"} p-4 flex items-center gap-4`}>
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

export type Slupek = { etykieta: string; wartosc: number; podpis: string; dzis?: boolean };

const DNI_TYG = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];

/** Rozmowy (bez przerwanych) na każdy z ostatnich N dni, liczone po polskim czasie. */
export function rozmowyNaDni(rozmowy: Pick<Rozmowa, "start" | "status">[], n: number): Slupek[] {
  const kluczPL = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const licznik = new Map<string, number>();
  for (const r of rozmowy) {
    if (r.status === "przerwana") continue;
    const k = kluczPL(new Date(r.start));
    licznik.set(k, (licznik.get(k) ?? 0) + 1);
  }
  const dzis = kluczPL(new Date());
  const wynik: Slupek[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = kluczPL(new Date(Date.now() - i * 86_400_000));
    const [, m, dd] = k.split("-");
    wynik.push({ etykieta: DNI_TYG[new Date(`${k}T12:00:00`).getDay()], podpis: `${dd}.${m}`, wartosc: licznik.get(k) ?? 0, dzis: k === dzis });
  }
  return wynik;
}

/**
 * Słupki na 7 dni (USER_001 1.10): jedna seria (rozmowy dziennie), cienkie
 * słupki z zaokrągloną górą od linii bazowej, cienka linia celu, etykieta
 * tylko nad słupkiem z wartością. Tooltip = <title> na każdym słupku.
 */
export function Slupki({ dni, cel, tytul, goly, wysoki }: { dni: Slupek[]; cel: number; tytul: string; goly?: boolean; wysoki?: boolean }) {
  const W = 320;
  const H = wysoki ? 210 : 150;
  const gora = 18;
  const dol = 28;
  const max = Math.max(cel, ...dni.map((d) => d.wartosc), 1);
  const szer = W / dni.length;
  const slupekSzer = Math.min(26, szer * 0.5);
  const y = (v: number) => gora + (H - gora - dol) * (1 - v / max);
  return (
    <div className={goly ? "flex-1 flex flex-col" : "bruno-szklo rounded-2xl p-4 sm:p-5"}>
      <h2 className="bruno-h2 text-base text-center mb-2">{tytul}</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${tytul}: ${dni.map((d) => `${d.etykieta} ${d.wartosc}`).join(", ")}`}>
        <line x1="0" x2={W} y1={y(cel)} y2={y(cel)} stroke="rgba(14,116,144,0.35)" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="rgba(15,23,42,0.12)" strokeWidth="1" />
        {dni.map((d, i) => {
          const x = i * szer + (szer - slupekSzer) / 2;
          const h = Math.max(0, y(0) - y(d.wartosc));
          return (
            <g key={d.etykieta}>
              <title>{`${d.podpis}: ${d.wartosc} ${d.wartosc === 1 ? "rozmowa" : d.wartosc >= 2 && d.wartosc <= 4 ? "rozmowy" : "rozmów"}`}</title>
              <rect x={x} y={y(0) - 2} width={slupekSzer} height="2" fill="rgba(14,116,144,0.15)" />
              {h > 0 && (
                <path
                  d={`M${x},${y(0)} v${-(h - 4)} a4,4 0 0 1 4,-4 h${slupekSzer - 8} a4,4 0 0 1 4,4 v${h - 4} z`}
                  fill={d.wartosc >= cel ? "url(#bruno-slupek)" : "rgba(14,116,144,0.55)"}
                  className="bruno-slupek"
                />
              )}
              {d.wartosc > 0 && (
                <text x={x + slupekSzer / 2} y={y(d.wartosc) - 6} textAnchor="middle" className="fill-slate-700" style={{ fontSize: 11, fontWeight: 600 }}>
                  {d.wartosc}
                </text>
              )}
              <text x={x + slupekSzer / 2} y={H - 8} textAnchor="middle" className={d.dzis ? "fill-cyan-800" : "fill-slate-400"} style={{ fontSize: 11, fontWeight: d.dzis ? 700 : 500 }}>
                {d.etykieta}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="bruno-slupek" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#0e7490" />
            <stop offset="1" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
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
