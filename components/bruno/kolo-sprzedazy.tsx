import a from "@/app/brunoakademia/akademia.module.css";

// 16.11 (USER_001): koło 40 / 30 / 30 z /academy jako wspólny element (strona webinaru „Obraz siebie”).
// Kopia z app/brunoakademia/page.tsx; wymaga zmiennych kolorów z dolacz.module.css (.v) wyżej w drzewie.
// Koło: kolor segmentu = kolor tagu przy lekcji.
export const KOLO = [
  { klucz: "obraz", proc: 40, nazwa: "Twój obraz siebie", kolor: "var(--orange)" },
  { klucz: "mysli", proc: 30, nazwa: "To, w jaki sposób myślisz", kolor: "var(--czarny)" },
  { klucz: "techniki", proc: 30, nazwa: "Techniki sprzedaży", kolor: "#b9bcc3" },
] as const;
type Klucz = (typeof KOLO)[number]["klucz"];

// 15.11 (USER_001): opis przy każdym pasku koła. Kreska od środka paska do karty: obraz siebie w prawo,
// to, co myślisz w dół, techniki w lewo (karty w siatce .scena). Procent stoi też na samym pasku (telefon).
const KRESKA: Record<Klucz, (x: number, y: number) => [number, number]> = {
  obraz: (_, y) => [334, y],
  mysli: (x) => [x, 334],
  techniki: (_, y) => [-34, y],
};

// Koło jako pierścień: każdy segment to ten sam okrąg z przesuniętym kreskowaniem.
// 15.11 (USER_001: „polepsz wizualnie”): gradient na każdym pasku, zaokrąglone końce z przerwą,
// biały środek z cieniem, paski rysują się po kolei (CSS, pauza dopóki koło jest poza ekranem; „ogranicz ruch” = bez animacji).
const GRADIENTY: Record<Klucz, [string, string]> = {
  obraz: ["#ffb36b", "#e2541b"],
  mysli: ["#45454b", "#08080a"],
  techniki: ["#e6e8ec", "#aeb2ba"],
};

export function Kolo({ bezKresek }: { bezKresek?: boolean }) {
  const r = 108;
  const gr = 38;
  const obw = 2 * Math.PI * r;
  const przerwa = 6;
  let start = 0;
  return (
    <svg className={a.kolo} viewBox="0 0 300 300" role="img" aria-label="Sprzedaż: 40 % obraz siebie, 30 % to, w jaki sposób myślisz, 30 % techniki sprzedaży">
      <defs>
        {KOLO.map((s) => (
          <linearGradient key={s.klucz} id={`kolo-${s.klucz}`} x1="40" y1="20" x2="260" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={GRADIENTY[s.klucz][0]} />
            <stop offset="1" stopColor={GRADIENTY[s.klucz][1]} />
          </linearGradient>
        ))}
        <filter id="kolo-cien" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#08080a" floodOpacity="0.14" />
        </filter>
      </defs>
      <g filter="url(#kolo-cien)">
        {KOLO.map((s, i) => {
          const dl = (s.proc / 100) * obw;
          // Okrągłe końce wystają o pół grubości, więc kreska jest krótsza o grubość + przerwę.
          const rysowane = dl - przerwa - gr;
          const el = (
            <circle
              key={s.klucz}
              className={a.koloPasek}
              cx="150"
              cy="150"
              r={r}
              fill="none"
              stroke={`url(#kolo-${s.klucz})`}
              strokeWidth={gr}
              strokeLinecap="round"
              strokeDasharray={`${rysowane} ${obw}`}
              strokeDashoffset={-(start + przerwa / 2 + gr / 2)}
              transform="rotate(-90 150 150)"
              style={{ "--obw": obw, animationDelay: `${i * 220}ms` } as React.CSSProperties}
            />
          );
          start += dl;
          return el;
        })}
      </g>
      <circle cx="150" cy="150" r={r - gr / 2 - 10} fill="#fff" filter="url(#kolo-cien)" />
      {(() => {
        let st = 0;
        return KOLO.map((s) => {
          const dl = (s.proc / 100) * obw;
          // Środek paska: kąt liczony od góry zgodnie z ruchem wskazówek.
          const kat = ((st + dl / 2) / obw) * 2 * Math.PI;
          st += dl;
          const pkt = (rr: number) => [150 + rr * Math.sin(kat), 150 - rr * Math.cos(kat)] as const;
          const [tx, ty] = pkt(r);
          const [kx, ky] = pkt(r + gr / 2 + 6);
          const [ex, ey] = KRESKA[s.klucz](kx, ky);
          return (
            <g key={s.klucz} className={a.koloOpis}>
              {!bezKresek && <polyline className={a.kreska} points={`${kx},${ky} ${ex},${ey}`} style={{ stroke: GRADIENTY[s.klucz][1] }} />}
              {!bezKresek && <circle className={a.kreskaKropka} cx={kx} cy={ky} r="3.5" style={{ stroke: GRADIENTY[s.klucz][1] }} />}
              <text x={tx} y={ty + 5} textAnchor="middle" className={a.koloProc} style={{ fill: s.klucz === "techniki" ? "var(--ink)" : "#fff" }}>
                {s.proc}%
              </text>
            </g>
          );
        });
      })()}
      <text x="150" y="148" textAnchor="middle" className={a.koloSrodek}>
        Sprzedaż
      </text>
      <text x="150" y="170" textAnchor="middle" className={a.koloPod}>
        zaczyna się w głowie
      </text>
    </svg>
  );
}

/** Koło z 3 kartami opisów (siatka .scena): na komputerze kreski do kart, na telefonie karty pod kołem. */
export function KoloScena() {
  return (
    <div className={a.scena}>
      <div className={a.scenaKolo}>
        <Kolo />
      </div>
      {KOLO.map((s) => (
        <div key={s.klucz} className={`${a.opis} ${a[`opis_${s.klucz}`]}`}>
          <b style={{ color: s.klucz === "techniki" ? "var(--grey)" : s.kolor }}>{s.proc}%</b>
          <h3>{s.nazwa}</h3>
        </div>
      ))}
    </div>
  );
}
