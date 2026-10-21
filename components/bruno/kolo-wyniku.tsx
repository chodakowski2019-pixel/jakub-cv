// 21.10 (USER_001): wynik ankiety w kółku. Pierścień SVG, złoty gradient, wypełnienie = wartość na 100.
// Jeden komponent dla dużego wyniku (48) i małych per obszar.

export default function KoloWyniku({
  wartosc,
  rozmiar = 96,
  grubosc = 8,
  podpis,
  zmiana,
  duze = false,
}: {
  wartosc: number;
  rozmiar?: number;
  grubosc?: number;
  podpis?: string;
  zmiana?: number | null;
  duze?: boolean;
}) {
  const r = (rozmiar - grubosc) / 2;
  const obwod = 2 * Math.PI * r;
  const pelne = Math.max(0, Math.min(100, wartosc));
  const id = `zl-${rozmiar}`;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: rozmiar, height: rozmiar }}>
        <svg width={rozmiar} height={rozmiar} viewBox={`0 0 ${rozmiar} ${rozmiar}`} role="img" aria-label={`${wartosc} na 100`}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3dc9c" />
              <stop offset="45%" stopColor="#d4af5a" />
              <stop offset="100%" stopColor="#a8822f" />
            </linearGradient>
          </defs>
          <circle cx={rozmiar / 2} cy={rozmiar / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={grubosc} />
          <circle
            cx={rozmiar / 2}
            cy={rozmiar / 2}
            r={r}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={grubosc}
            strokeLinecap="round"
            strokeDasharray={obwod}
            strokeDashoffset={obwod * (1 - pelne / 100)}
            transform={`rotate(-90 ${rozmiar / 2} ${rozmiar / 2})`}
            className="bruno-kolo-pierscien"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className={duze ? "bruno-gradient-tekst font-bold" : "font-semibold"} style={{ fontSize: duze ? rozmiar * 0.32 : rozmiar * 0.3 }}>
            {wartosc}
          </span>
          {duze && <span className="opacity-60 mt-1.5" style={{ fontSize: rozmiar * 0.08 }}>na 100</span>}
        </div>
      </div>
      {podpis && <span className={duze ? "text-sm opacity-80" : "text-xs sm:text-sm opacity-80 text-center leading-tight"}>{podpis}</span>}
      {zmiana !== undefined && zmiana !== null && (
        <span className="bruno-zmiana" data-kierunek={zmiana > 0 ? "gora" : zmiana < 0 ? "dol" : "zero"}>
          {zmiana > 0 ? `▲ +${zmiana}` : zmiana < 0 ? `▼ ${zmiana}` : "= 0"}
        </span>
      )}
    </div>
  );
}
