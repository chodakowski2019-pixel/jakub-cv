"use client";

import { useRef, useState } from "react";

// 6.11 (USER_001: „wizualizacja danych to podstawa, lejki mega fajnie”): LEJEK jako SVG.
// Każdy etap = poziomy pas wyśrodkowany (prawdziwy kształt lejka: szerokość = ile deali DOSZŁO do etapu).
// Segmenty: otwarte tutaj (atrament) · wygrane (zielony) · przegrane tutaj (czerwony) · poszły dalej (kreskowane).
// Między etapami: „% przechodzi dalej” (czerwone < 50 %). Z prawej: strata na etapie. Najsłabszy etap = żółte tło.
// Dymek przy najeździe z wszystkimi liczbami. Teksty w kolorach tekstu, nie serii (dataviz).

export type EtapWykresu = {
  id: number;
  nr: number;
  nazwa: string;
  otwarte: number;
  wygrane: number;
  przegrane: number;
  /** ile deali doszło do etapu (otwarte tu + przegrane tu + wszystko dalej) */
  doszlo: number;
  /** ile poszło dalej (następne etapy + wygrane) */
  dalej: number;
  /** % przechodzi dalej (null dla ostatniego etapu) */
  proc: number | null;
  wartoscTekst: string;
  strataTekst: string | null;
  naj: boolean;
};

export default function LejekWykres({ etapy, jezyk, max }: { etapy: EtapWykresu[]; jezyk: "pl" | "en"; max: number }) {
  const t = (en: string, pl: string) => (jezyk === "pl" ? pl : en);
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  const W = 960;
  const RZ = 76; // wysokość wiersza
  const L = 212; // kolumna nazw
  const P = 190; // kolumna strat
  const BAR = W - L - P; // obszar pasków
  const H = etapy.length * RZ;
  const hp = 30; // wysokość paska
  const n = (v: number) => Math.round(v);

  const pokaz = (e: React.PointerEvent<SVGGElement>, i: number) => {
    const o = ref.current?.getBoundingClientRect();
    if (!o) return;
    setHover({ i, x: e.clientX - o.left, y: e.clientY - o.top });
  };

  return (
    <div ref={ref} className="pl-wykres" onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("Sales funnel by stage", "Lejek sprzedaży po etapach")}>
        <defs>
          <pattern id="pl-kreski" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#f1f1f4" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#d9dae0" strokeWidth="1.5" />
          </pattern>
        </defs>
        {etapy.map((s, i) => {
          const y0 = i * RZ;
          const yc = y0 + RZ / 2 - 8;
          const szer = Math.max(36, (BAR * s.doszlo) / Math.max(1, max));
          const x0 = L + (BAR - szer) / 2;
          const ostatni = i === etapy.length - 1;
          const dalejBezWygranych = Math.max(0, s.dalej - s.wygrane);
          const segs = [
            { k: "otwarte", v: s.otwarte, fill: "#141416", tekst: "#fff" },
            { k: "wygrane", v: s.wygrane, fill: "#17a05e", tekst: "#fff" },
            { k: "przegrane", v: s.przegrane, fill: "#e5484d", tekst: "#fff" },
            { k: "dalej", v: ostatni ? 0 : dalejBezWygranych, fill: "url(#pl-kreski)", tekst: "#141416" },
          ].filter((g) => g.v > 0);
          const suma = segs.reduce((a, g) => a + g.v, 0) || 1;
          let x = x0;
          return (
            <g key={s.id} className={`pl-rzad ${s.naj ? "pl-rzad-naj" : ""}`} onPointerMove={(e) => pokaz(e, i)} onPointerEnter={(e) => pokaz(e, i)}>
              <rect className="pl-tlo-rzad" x="0" y={y0 + 4} width={W} height={RZ - 8} rx="14" />
              {/* numer + nazwa */}
              <circle cx="22" cy={yc} r="12" fill={s.naj ? "#e2a300" : "#141416"} />
              <text x="22" y={yc + 4} textAnchor="middle" className="pl-etap-nr">{s.nr}</text>
              <text x="44" y={yc - 3} className="pl-etap-nazwa">{s.nazwa.length > 24 ? `${s.nazwa.slice(0, 23)}…` : s.nazwa}</text>
              <text x="44" y={yc + 14} className="pl-etap-pod">{s.otwarte} {t("open", "otw.")} · {s.wartoscTekst}</text>
              {/* segmenty (kształt lejka daje kreskowanie „poszły dalej”) */}
              {segs.map((g, k) => {
                const w = (szer * g.v) / suma;
                const gx = x;
                x += w;
                const pierwszy = k === 0;
                const ostatniSeg = k === segs.length - 1;
                const rx = hp / 2;
                // zaokrąglenie tylko na końcach całego paska; 2 px przerwy między segmentami (biała linia)
                const d = `M${gx + (pierwszy ? rx : 0)},${yc - hp / 2} H${gx + w - (ostatniSeg ? rx : 0)} ${ostatniSeg ? `a${rx},${rx} 0 0 1 0,${hp}` : `v${hp}`} H${gx + (pierwszy ? rx : 0)} ${pierwszy ? `a${rx},${rx} 0 0 1 0,-${hp}` : "z"} z`;
                return (
                  <g key={g.k} className="pl-seg">
                    <path d={d} fill={g.fill} stroke="#fff" strokeWidth="2" />
                    {w >= 30 && g.k !== "dalej" && <text x={gx + w / 2} y={yc + 4} textAnchor="middle" className="pl-seg-liczba" fill={g.tekst}>{g.v}</text>}
                  </g>
                );
              })}
              {/* przejście */}
              {!ostatni && s.proc !== null && (
                <g>
                  <line x1={L + BAR / 2} x2={L + BAR / 2} y1={yc + hp / 2 + 5} y2={y0 + RZ + 2} stroke="#e0e1e6" strokeWidth="1" />
                  <rect x={L + BAR / 2 - 60} y={y0 + RZ - 14} width="120" height="18" rx="9" fill="#fff" />
                  <text x={L + BAR / 2} y={y0 + RZ - 1} textAnchor="middle" className={`pl-przejscie ${s.proc < 50 ? "pl-przejscie-slabe" : ""}`}>
                    <tspan fontWeight="600">{s.proc} %</tspan> {t("move on", "przechodzi dalej")}
                  </text>
                </g>
              )}
              {/* strata z prawej */}
              {s.przegrane > 0 ? (
                <>
                  <text x={W - 12} y={yc + (s.naj ? -3 : 4)} textAnchor="end" className="pl-strata">−{s.przegrane} {t("lost", "przegr.")} · {s.strataTekst}</text>
                  {s.naj && (
                    <g>
                      <rect x={W - 118} y={yc + 6} width="106" height="18" rx="9" fill="#fff" stroke="#f0dfa0" />
                      <text x={W - 65} y={yc + 18.5} textAnchor="middle" className="pl-naj-pigulka">{t("Weakest stage", "Najsłabszy etap")}</text>
                    </g>
                  )}
                </>
              ) : (
                <text x={W - 12} y={yc + 4} textAnchor="end" className="pl-strata-pod">{t("no losses", "bez strat")}</text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Telefon: SVG 960 px byłby nieczytelny, więc lista HTML z tymi samymi liczbami (CSS: .pl-mobil). */}
      <ol className="pl-mobil">
        {etapy.map((s) => {
          const dalejBez = Math.max(0, s.dalej - s.wygrane);
          const suma = Math.max(1, s.doszlo);
          const szer = Math.max(18, Math.round((100 * s.doszlo) / Math.max(1, max)));
          return (
            <li key={s.id} className={s.naj ? "naj" : ""}>
              <div className="pl-mobil-hd">
                <span className="pl-mobil-nr" style={s.naj ? { background: "#e2a300" } : undefined}>{s.nr}</span>
                <b>{s.nazwa}</b>
                <small>{s.otwarte} {t("open", "otw.")} · {s.wartoscTekst}</small>
              </div>
              <div className="pl-mobil-pasek" style={{ width: `${szer}%` }}>
                {s.otwarte > 0 && <i style={{ width: `${(100 * s.otwarte) / suma}%`, background: "#141416" }}>{s.otwarte}</i>}
                {s.wygrane > 0 && <i style={{ width: `${(100 * s.wygrane) / suma}%`, background: "#17a05e" }}>{s.wygrane}</i>}
                {s.przegrane > 0 && <i style={{ width: `${(100 * s.przegrane) / suma}%`, background: "#e5484d" }}>{s.przegrane}</i>}
                {dalejBez > 0 && s.proc !== null && <i style={{ width: `${(100 * dalejBez) / suma}%`, background: "repeating-linear-gradient(45deg,#f1f1f4 0 3px,#d9dae0 3px 4px)" }} />}
              </div>
              <div className="pl-mobil-dol">
                {s.przegrane > 0 ? <span className="p-zle-t">−{s.przegrane} {t("lost", "przegr.")}{s.strataTekst ? ` · ${s.strataTekst}` : ""}</span> : <span className="p-cichy">{t("no losses", "bez strat")}</span>}
                {s.proc !== null && <span className={s.proc < 50 ? "p-zle-t" : ""}>{s.proc} % {t("move on", "dalej")} ↓</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {hover && (() => {
        const s = etapy[hover.i];
        const dol = hover.y < 90;
        return (
          <div className={`p-dymek ${dol ? "p-dymek-dol" : ""}`} style={{ left: hover.x, top: hover.y + (dol ? 14 : -14) }} role="tooltip">
            <b>{s.nr}. {s.nazwa}</b>
            <span>{t("reached", "doszło")}: {n(s.doszlo)} · {t("open here", "otwarte tu")}: {s.otwarte} ({s.wartoscTekst})</span>
            <span>{t("won", "wygrane")}: {s.wygrane} · {t("lost here", "przegrane tu")}: {s.przegrane}{s.strataTekst ? ` (${s.strataTekst})` : ""}</span>
            {s.proc !== null && <small>{s.proc} % {t("move on to the next stage", "przechodzi do następnego etapu")}</small>}
          </div>
        );
      })()}
    </div>
  );
}
