"use client";

import { useMemo, useRef, useState } from "react";
import type { Kryterium } from "@/lib/bruno/db";
import type { PunktDnia, TydzienRozmow } from "@/lib/bruno/zespol";

// 25.10 (USER_001: „lepsza wizualizacja panelu szefa”). Wykresy wg skilla dataviz:
// - TREND ZESPOŁU: jedna seria (średnia dnia), linia 2 px + delikatne pole, krzyżyk i dymek przy najeździe,
//   jedna oś, linia odniesienia 7/10. Dni bez rozmów = przerwa w linii, nie zero.
// - MAPA KRYTERIÓW: handlowcy × 5 kryteriów, skala sekwencyjna JEDNEGO odcienia (złoto: ciemne = słabo,
//   jasne = dobrze), liczba w każdej kratce (kolor nie jest jedynym nośnikiem), najsłabsze kryterium
//   handlowca = obwódka + ▼. Dymek przy najeździe.
// - AKTYWNOŚĆ 14 DNI: kratki dzień × handlowiec, sekwencyjne złoto po liczbie rozmów.
// - MINI-WYKRES: oceny handlowca w kolejności rozmów, ostatni punkt zaznaczony.
// Tekst zawsze w kolorach tekstu, nie w kolorze serii.

type Jezyk = "pl" | "en";
const t = (j: Jezyk, en: string, pl: string) => (j === "pl" ? pl : en);
const liczba = (v: number, j: Jezyk) => v.toLocaleString(j === "pl" ? "pl-PL" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 5 stopni złota na ciemnym tle (ocena 1-10). Tekst: jasny na ciemnych, ciemny na jasnych. */
const STOPNIE = [
  { od: 0, tlo: "var(--bwz-s0, #2b2416)", tekst: "var(--bwz-t0, #f5f2ea)" },
  { od: 5, tlo: "var(--bwz-s1, #4a3b1d)", tekst: "var(--bwz-t1, #f5f2ea)" },
  { od: 6, tlo: "var(--bwz-s2, #7a5f28)", tekst: "var(--bwz-t2, #f5f2ea)" },
  { od: 7, tlo: "var(--bwz-s3, #b8913f)", tekst: "var(--bwz-t3, #0b0b0b)" },
  { od: 8, tlo: "var(--bwz-s4, #ecd08a)", tekst: "var(--bwz-t4, #0b0b0b)" },
];
export const stopien = (v: number) => [...STOPNIE].reverse().find((s) => v >= s.od) ?? STOPNIE[0];
/** Aktywność: 0, 1, 2, 3+ rozmów dziennie. 25.10: zmienne CSS, motyw Asset podmienia na fiolet. */
const AKTYWNOSC = ["var(--bwz-a0, rgba(255,255,255,0.05))", "var(--bwz-a1, #5c4823)", "var(--bwz-a2, #a8822f)", "var(--bwz-a3, #ecd08a)"];

/* ---------- Dymek ---------- */
function Dymek({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div className="bwz-dymek" style={{ left: x, top: y }} role="tooltip">
      {children}
    </div>
  );
}

/* ---------- Trend zespołu ---------- */
export function TrendZespolu({ seria, jezyk, cel = 7 }: { seria: PunktDnia[]; jezyk: Jezyk; cel?: number }) {
  const W = 640;
  const H = 220;
  const L = 34;
  const R = 12;
  const G = 16;
  const D = 28;
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const min = 3;
  const max = 10;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, seria.length - 1);
  const y = (v: number) => G + ((max - v) * (H - G - D)) / (max - min);

  // Linia ciągła przez dni bez rozmów (punkt = dzień z rozmowami), żeby trend był czytelny.
  const odcinki = useMemo(() => {
    const pts = seria.flatMap((p, i) => (p.srednia === null ? [] : [[x(i), y(Math.max(min, p.srednia))] as [number, number]]));
    return pts.length ? [pts] : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seria]);
  const sciezka = (pts: [number, number][]) => pts.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
  const pole = (pts: [number, number][]) => `${sciezka(pts)} L${pts[pts.length - 1][0].toFixed(1)},${H - D} L${pts[0][0].toFixed(1)},${H - D} Z`;

  // 25.10: seria tygodniowa z 3 miesięcy. Liczba = średnia ostatnich 4 tygodni, zmiana vs pierwsze 4 tygodnie.
  const zOcena = seria.filter((p) => p.srednia !== null);
  const pierwsza = zOcena.slice(0, 4);
  const ostatnia = zOcena.slice(-4);
  const sr = (a: PunktDnia[]) => (a.length ? a.reduce((s, p) => s + (p.srednia ?? 0), 0) / a.length : null);
  const teraz = sr(ostatnia);
  const zmiana = teraz !== null && sr(pierwsza) !== null ? teraz - (sr(pierwsza) as number) : null;

  // Miesiące z punktów serii: kolejne indeksy z tym samym miesiącem = jeden pas od połowy odstępu do połowy odstępu.
  const krok = seria.length > 1 ? (W - L - R) / (seria.length - 1) : W - L - R;
  const miesiace = seria.reduce<{ klucz: string; nazwa: string; pierwszy: number; ostatni: number }[]>((acc, p, i) => {
    const klucz = p.dzien.slice(0, 7);
    const ost = acc[acc.length - 1];
    if (ost && ost.klucz === klucz) ost.ostatni = i;
    else acc.push({ klucz, nazwa: new Date(`${p.dzien}T12:00:00`).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { month: "long" }), pierwszy: i, ostatni: i });
    return acc;
  }, []).map((m) => ({ ...m, od: Math.max(L, x(m.pierwszy) - krok / 2), do: Math.min(W - R, x(m.ostatni) + krok / 2) }));

  const ruch = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(seria.length - 1, Math.round(((px - L) / (W - L - R)) * (seria.length - 1)))));
  };
  const p = hover !== null ? seria[hover] : null;
  const data = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short" });

  return (
    <section className="bruno-szklo rounded-2xl p-4 sm:p-5 bwz-karta">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          {/* 28.10 (USER_001): tytuł „Średnia zespołu”, bez podtytułu. */}
          <h2 className="bruno-h2 text-base">{t(jezyk, "Team average", "Średnia zespołu")}</h2>
        </div>
        <div className="text-right shrink-0">
          <div className="bruno-h2 text-[2rem] leading-none tabular-nums">{teraz === null ? "–" : liczba(teraz, jezyk)}</div>
          {zmiana !== null && (
            <div className="text-[12px] mt-1">
              <span className="bruno-zmiana tabular-nums" data-kierunek={zmiana > 0.1 ? "gora" : zmiana < -0.1 ? "dol" : "zero"}>
                {zmiana > 0 ? "▲ +" : zmiana < 0 ? "▼ " : ""}
                {liczba(zmiana, jezyk)}
              </span>{" "}
              <span className="text-slate-500">{t(jezyk, "vs 3 months ago", "vs 3 miesiące temu")}</span>
            </div>
          )}
        </div>
      </div>
      <div ref={ref} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={t(jezyk, "Team average per day", "Średnia zespołu dziennie")} onPointerMove={ruch} onPointerLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="bwz-pole" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d4af5a" stopOpacity="0.28" />
              <stop offset="1" stopColor="#d4af5a" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* 25.10 (USER_001: „każdy miesiąc lepiej widoczny”): pas na każdy miesiąc (co drugi podświetlony), linia na granicy, nazwa miesiąca pod osią. */}
          {miesiace.map((m, i) => (
            <g key={m.klucz}>
              {i % 2 === 1 && <rect x={m.od} y={G - 6} width={m.do - m.od} height={H - D - G + 6} fill="rgba(245,242,234,0.04)" />}
              {i > 0 && <line x1={m.od} x2={m.od} y1={G - 6} y2={H - D + 10} stroke="rgba(245,242,234,0.16)" className="bwz-granica" />}
              <text x={(m.od + m.do) / 2} y={H - 8} textAnchor="middle" className="bwz-os bwz-miesiac">{m.nazwa}</text>
            </g>
          ))}
          {/* 28.10 (USER_001: „oddzielić każdy miesiąc i dni w nim lekką kreską”): oś dolna + kreska na każdy tydzień (kolory w motyw-rinesk.css). */}
          <line x1={L} x2={W - R} y1={H - D} y2={H - D} stroke="rgba(245,242,234,0.16)" className="bwz-granica" />
          {seria.map((p, i) => <line key={p.dzien} x1={x(i)} x2={x(i)} y1={H - D} y2={H - D + 5} stroke="rgba(245,242,234,0.16)" className="bwz-tyk" />)}
          {[4, 6, 8, 10].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" className="bwz-os">{v}</text>
            </g>
          ))}
          <line x1={L} x2={W - R} y1={y(cel)} y2={y(cel)} stroke="rgba(245,242,234,0.35)" strokeDasharray="4 5" />
          <text x={W - R} y={y(cel) - 6} textAnchor="end" className="bwz-os">{t(jezyk, `goal ${cel}`, `cel ${cel}`)}</text>
          {odcinki.map((o, i) => (
            <g key={i}>
              {o.length > 1 && <path d={pole(o)} fill="url(#bwz-pole)" className="bwz-wjazd" />}
              {o.length > 1 && <path d={sciezka(o)} fill="none" stroke="#e6c77a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="bwz-linia" />}
              {o.map(([a, b], k) => <circle key={k} cx={a} cy={b} r="3.5" fill="#e6c77a" stroke="#12110f" strokeWidth="1.5" className="bwz-wjazd" />)}
            </g>
          ))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={G} y2={H - D} stroke="rgba(245,242,234,0.3)" strokeDasharray="2 4" />
              {p?.srednia !== null && p && <circle cx={x(hover)} cy={y(Math.max(min, p.srednia as number))} r="5" fill="#ecd08a" stroke="#12110f" strokeWidth="2" />}
            </g>
          )}
        </svg>
        {p && hover !== null && (
          <Dymek x={(x(hover) / W) * (ref.current?.clientWidth ?? W)} y={((p.srednia === null ? G : y(Math.max(min, p.srednia))) / H) * ((ref.current?.clientWidth ?? W) * (H / W)) - 6}>
            <b>{t(jezyk, "Week of", "Tydzień od")} {data(p.dzien)}</b>
            <span>{p.srednia === null ? t(jezyk, "no calls", "bez rozmów") : `${t(jezyk, "average", "średnia")} ${liczba(p.srednia, jezyk)} / 10`}</span>
            <span className="text-slate-400">{p.rozmow} {t(jezyk, "calls", "rozmów")}</span>
          </Dymek>
        )}
      </div>
    </section>
  );
}

/* ---------- Mapa kryteriów ---------- */
export type WierszMapy = { email: string; imie: string; zdjecie: string | null; kryteria: Record<Kryterium["nazwa"], number | null>; najslabsze: Kryterium["nazwa"] | null; href: string };

export function MapaKryteriow({ wiersze, zespol, nazwy, kolejnosc, jezyk }: { wiersze: WierszMapy[]; zespol: Record<Kryterium["nazwa"], number | null>; nazwy: Record<Kryterium["nazwa"], string>; kolejnosc: Kryterium["nazwa"][]; jezyk: Jezyk }) {
  const [hover, setHover] = useState<{ x: number; y: number; tekst: [string, string] } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pokaz = (e: React.PointerEvent | React.FocusEvent, imie: string, k: Kryterium["nazwa"], v: number | null, zespolowa = false) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const o = ref.current?.getBoundingClientRect();
    if (!o) return;
    let linia: string;
    if (v === null) linia = "–";
    else if (zespolowa) {
      // 25.10 (USER_001): kratka zespołu nie porównuje się sama ze sobą („+0,0 vs zespół”). Pokazuje rozrzut: najlepszy i najsłabszy.
      const oceny = wiersze.filter((w) => w.kryteria[k] !== null).sort((a, b) => (b.kryteria[k] as number) - (a.kryteria[k] as number));
      const naj = oceny[0];
      const slab = oceny[oceny.length - 1];
      linia = `${liczba(v, jezyk)} / 10${naj && slab && naj !== slab ? ` · ${t(jezyk, "best", "najlepiej")} ${naj.imie} ${liczba(naj.kryteria[k] as number, jezyk)}, ${t(jezyk, "weakest", "najsłabiej")} ${slab.imie} ${liczba(slab.kryteria[k] as number, jezyk)}` : ""}`;
    } else {
      const zesp = zespol[k];
      const roznica = zesp !== null ? v - zesp : null;
      linia = `${liczba(v, jezyk)} / 10${roznica !== null ? ` (${roznica >= 0 ? "+" : ""}${liczba(roznica, jezyk)} ${t(jezyk, "vs team", "vs zespół")})` : ""}`;
    }
    // 25.10 (USER_001: „przy najeździe źle się wyświetla”): dymek nad kratką wychodził poza kartę w 1. wierszu. Blisko góry = pod kratką.
    const gora = r.top - o.top;
    setHover({ x: r.left - o.left + r.width / 2, y: gora < 70 && (ref.current?.scrollWidth ?? 0) > (ref.current?.clientWidth ?? 0) ? r.bottom - o.top + 70 : gora, tekst: [zespolowa ? `${t(jezyk, "Team average", "Średnia zespołu")} · ${nazwy[k]}` : `${imie} · ${nazwy[k]}`, linia] });
  };
  // 25.10 (USER_001: „wiersz Zespół musi być lepiej widoczny”): kratki zespołu bez koloru skali, ramka + duża liczba.
  const kratka = (v: number | null, slaba: boolean, klucz: string, imie: string, k: Kryterium["nazwa"], zespolowa = false) => {
    const s = v === null || zespolowa ? null : stopien(v);
    return (
      <div
        key={klucz}
        className={`bwz-kratka ${slaba ? "bwz-slaba" : ""} ${zespolowa ? "bwz-kratka-zespol" : ""}`}
        style={s ? { background: s.tlo, color: s.tekst } : undefined}
        tabIndex={0}
        onPointerEnter={(e) => pokaz(e, imie, k, v, zespolowa)}
        onFocus={(e) => pokaz(e, imie, k, v, zespolowa)}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        aria-label={`${imie}, ${nazwy[k]}: ${v ?? "–"}`}
      >
        {slaba && <span className="bwz-znak" aria-hidden>▼</span>}
        {v === null ? "–" : liczba(v, jezyk)}
      </div>
    );
  };
  return (
    <section className="bruno-szklo rounded-2xl p-4 sm:p-5 bwz-karta">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="bruno-h2 text-base">{t(jezyk, "Who needs coaching, and in what", "Kto w czym potrzebuje treningu")}</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">{t(jezyk, "Average per area, last 30 days.", "Średnia na kryterium, ostatnie 30 dni.")}</p>
        </div>
        <div className="bwz-legenda" aria-hidden>
          <span>1</span>
          {STOPNIE.map((s) => <i key={s.od} style={{ background: s.tlo }} />)}
          <span>10</span>
        </div>
      </div>
      <div ref={ref} className="relative max-[860px]:overflow-x-auto">
        <div className="bwz-mapa" style={{ gridTemplateColumns: `minmax(120px, 1.3fr) repeat(${kolejnosc.length}, minmax(64px, 1fr))` }}>
          <span className="bwz-kol bwz-kol-osoba">{t(jezyk, "Rep", "Handlowiec")}</span>
          {kolejnosc.map((k) => <span key={k} className="bwz-kol">{nazwy[k]}</span>)}
          {wiersze.map((w) => (
            <div key={w.email} style={{ display: "contents" }}>
              <a href={w.href} className="bwz-osoba">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {w.zdjecie ? <img src={w.zdjecie} alt="" /> : <span>{w.imie[0]}</span>}
                {w.imie}
              </a>
              {kolejnosc.map((k) => kratka(w.kryteria[k], w.najslabsze === k, `${w.email}-${k}`, w.imie, k))}
            </div>
          ))}
          <span className="bwz-odstep" aria-hidden style={{ gridColumn: `1 / span ${kolejnosc.length + 1}` }} />
          <span className="bwz-osoba bwz-zespol">{t(jezyk, "Team average", "Średnia zespołu")}</span>
          {kolejnosc.map((k) => kratka(zespol[k], false, `zespol-${k}`, t(jezyk, "Team", "Zespół"), k, true))}
        </div>
        {hover && (
          <Dymek x={hover.x} y={hover.y}>
            <b>{hover.tekst[0]}</b>
            <span>{hover.tekst[1]}</span>
          </Dymek>
        )}
      </div>
    </section>
  );
}

/* ---------- Aktywność 14 dni ---------- */
export function Aktywnosc({ wiersze, dni, jezyk }: { wiersze: { email: string; imie: string; zdjecie: string | null; dni: number[] }[]; dni: number; jezyk: Jezyk }) {
  const daty = Array.from({ length: dni }, (_, i) => new Date(Date.now() - (dni - 1 - i) * 86_400_000));
  const dzien = (d: Date) => d.toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { weekday: "short" }).slice(0, 2);
  return (
    <section className="bruno-szklo rounded-2xl p-4 sm:p-5 bwz-karta">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="bruno-h2 text-base">{t(jezyk, "Practice in the last 14 days", "Trening w ostatnich 14 dniach")}</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">{t(jezyk, "One square = one day. Brighter = more calls.", "Jedna kratka = jeden dzień. Jaśniej = więcej rozmów.")}</p>
        </div>
        <div className="bwz-legenda" aria-hidden>
          <span>0</span>
          {AKTYWNOSC.map((c) => <i key={c} style={{ background: c }} />)}
          <span>3+</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="bwz-aktywnosc" style={{ gridTemplateColumns: `minmax(110px, 160px) repeat(${dni}, minmax(18px, 1fr))` }}>
          <span />
          {daty.map((d, i) => <span key={i} className="bwz-kol bwz-dzien">{dzien(d)}</span>)}
          {wiersze.map((w) => (
            <div key={w.email} style={{ display: "contents" }}>
              <span className="bwz-osoba">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {w.zdjecie ? <img src={w.zdjecie} alt="" /> : <span>{w.imie[0]}</span>}
                {w.imie}
              </span>
              {w.dni.map((n, i) => (
                <i key={i} className="bwz-dzienka" style={{ background: AKTYWNOSC[Math.min(3, n)] }} title={`${w.imie}, ${daty[i].toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short" })}: ${n} ${t(jezyk, "calls", "rozmów")}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Mini-wykres w tabeli ---------- */
export function MiniWykres({ oceny }: { oceny: number[] }) {
  if (oceny.length < 2) return <span className="text-slate-400 text-xs">–</span>;
  const W = 84;
  const H = 26;
  const x = (i: number) => 3 + (i * (W - 6)) / (oceny.length - 1);
  const y = (v: number) => 3 + ((10 - v) * (H - 6)) / 9;
  const d = oceny.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ost = oceny[oceny.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden className="block">
      <path d={d} fill="none" stroke="var(--bwz-mini, rgba(245,242,234,0.35))" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(oceny.length - 1)} cy={y(ost)} r="3.2" fill="#ecd08a" />
    </svg>
  );
}

/* ---------- Radar handlowca (28.10) ---------- */
// 28.10 (USER_001: „diagram z 5 punktami” na profilu handlowca zamiast listy „Średnia na kryterium”, wzór Rabbet):
// limonka = handlowiec (30 dni), czarna przerywana = średnia zespołu. Przy każdej osi liczba handlowca,
// najsłabsze kryterium na czerwono. Kolory w motyw-rinesk.css (.bwz-radar-*), domyślnie złoto.
export function RadarHandlowca({ kryteria, zespol, nazwy, kolejnosc, jezyk, najslabsze }: { kryteria: Record<Kryterium["nazwa"], number | null>; zespol: Record<Kryterium["nazwa"], number | null> | null; nazwy: Record<Kryterium["nazwa"], string>; kolejnosc: Kryterium["nazwa"][]; jezyk: Jezyk; najslabsze: Kryterium["nazwa"] | null }) {
  const W = 420;
  const H = 300;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const Rr = 104;
  const n = kolejnosc.length;
  const kat = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pkt = (i: number, v: number) => [cx + Math.cos(kat(i)) * Rr * (v / 10), cy + Math.sin(kat(i)) * Rr * (v / 10)] as const;
  const wielokat = (d: Record<Kryterium["nazwa"], number | null>) => kolejnosc.map((k, i) => pkt(i, Math.max(0, Math.min(10, d[k] ?? 0))).map((v) => v.toFixed(1)).join(",")).join(" ");
  const brak = kolejnosc.every((k) => kryteria[k] === null);
  return (
    <section className="bruno-szklo rounded-2xl p-4 sm:p-5 bwz-karta">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="bruno-h2 text-base">{t(jezyk, "Skills", "Umiejętności")}</h2>
        <span className="text-[11px] text-slate-400">{t(jezyk, "last 30 days, scale 1-10", "ostatnie 30 dni, skala 1-10")}</span>
      </div>
      {brak ? (
        <p className="text-sm text-slate-500 py-8 text-center">{t(jezyk, "No scored calls yet.", "Brak ocenionych rozmów.")}</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={t(jezyk, "Skills radar", "Radar umiejętności")}>
          {[2, 4, 6, 8, 10].map((v) => (
            <polygon key={v} points={kolejnosc.map((_, i) => pkt(i, v).map((q) => q.toFixed(1)).join(",")).join(" ")} fill="none" stroke="rgba(245,242,234,0.12)" className="bwz-radar-siatka" />
          ))}
          {kolejnosc.map((_, i) => {
            const [a, b] = pkt(i, 10);
            return <line key={i} x1={cx} y1={cy} x2={a} y2={b} stroke="rgba(245,242,234,0.12)" className="bwz-radar-siatka" />;
          })}
          {zespol && <polygon points={wielokat(zespol)} fill="none" stroke="rgba(245,242,234,0.6)" strokeWidth="1.5" strokeDasharray="4 4" strokeLinejoin="round" className="bwz-radar-zespol" />}
          <polygon points={wielokat(kryteria)} fill="rgba(230,199,122,0.25)" stroke="#e6c77a" strokeWidth="2" strokeLinejoin="round" className="bwz-radar-ja bwz-wjazd" />
          {kolejnosc.map((k, i) => {
            const v = kryteria[k];
            const [a, b] = pkt(i, Math.max(0, Math.min(10, v ?? 0)));
            const [lx, ly] = pkt(i, 13.2);
            const kotwica = Math.abs(lx - cx) < 8 ? "middle" : lx < cx ? "end" : "start";
            return (
              <g key={k}>
                {v !== null && <circle cx={a} cy={b} r="4" fill="#e6c77a" stroke="#12110f" strokeWidth="1.5" className="bwz-radar-kropka bwz-wjazd" />}
                <text x={lx} y={ly - 3} textAnchor={kotwica} className="bwz-os bwz-radar-nazwa">{nazwy[k]}</text>
                <text x={lx} y={ly + 13} textAnchor={kotwica} className={`bwz-os bwz-radar-wartosc ${najslabsze === k ? "bwz-radar-slabe" : ""}`}>{v === null ? "–" : liczba(v, jezyk)}</text>
              </g>
            );
          })}
        </svg>
      )}
      {/* 28.10 (USER_001): legenda tylko „średnia zespołu”; bez „handlowiec” i „▼ najsłabsze”. */}
      {zespol && (
        <div className="flex gap-4 text-[11px] text-slate-500 mt-1">
          <span className="flex items-center gap-1.5"><i className="inline-block w-3.5 border-t border-dashed bwz-leg-zespol" style={{ borderColor: "rgba(245,242,234,0.6)" }} /> {t(jezyk, "team average", "średnia zespołu")}</span>
        </div>
      )}
    </section>
  );
}

/* ---------- Rozmowy tygodniowo (28.10) ---------- */
// 28.10 (USER_001: „z 14 dni zrobić wykres tygodniowy, ładniej”): ostatnie 8 tygodni (pn-nd, Europe/Warsaw),
// słupek = liczba rozmów, liczba nad słupkiem, bieżący tydzień podświetlony, podpis = data poniedziałku.
export function RozmowyTygodniowo({ tygodnie, jezyk, tytul }: { tygodnie: TydzienRozmow[]; jezyk: Jezyk; tytul: string }) {
  const W = 420;
  const H = 210;
  const G = 26;
  const D = 30;
  const L = 8;
  const max = Math.max(1, ...tygodnie.map((w) => w.rozmow));
  const szer = (W - 2 * L) / tygodnie.length;
  const sl = Math.min(34, szer * 0.56);
  const y = (v: number) => G + (H - G - D) * (1 - v / max);
  const data = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short" });
  const razem = tygodnie.reduce((a, w) => a + w.rozmow, 0);
  return (
    <section className="bruno-szklo rounded-2xl p-4 sm:p-5 bwz-karta">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="bruno-h2 text-base">{tytul}</h2>
        <span className="text-[11px] text-slate-400">{razem} {t(jezyk, "in 8 weeks", "w 8 tygodni")}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`${tytul}: ${tygodnie.map((w) => `${data(w.od)} ${w.rozmow}`).join(", ")}`}>
        <line x1={L} x2={W - L} y1={y(0)} y2={y(0)} stroke="rgba(245,242,234,0.16)" className="bwz-granica" />
        {tygodnie.map((w, i) => {
          const x = L + i * szer + (szer - sl) / 2;
          const h = Math.max(0, y(0) - y(w.rozmow));
          return (
            <g key={w.od}>
              <title>{`${t(jezyk, "week of", "tydzień od")} ${data(w.od)}: ${w.rozmow}`}</title>
              <rect x={x} y={y(0) - 3} width={sl} height="3" rx="1.5" className="bwz-tyg-cien" fill="rgba(245,242,234,0.08)" />
              {h > 0 && <rect x={x} y={y(w.rozmow)} width={sl} height={h} rx="7" className={`bwz-tyg-slupek ${w.biezacy ? "bwz-tyg-teraz" : ""} bwz-wjazd`} fill={w.biezacy ? "#e6c77a" : "rgba(230,199,122,0.4)"} />}
              <text x={x + sl / 2} y={(w.rozmow ? y(w.rozmow) : y(0)) - 8} textAnchor="middle" className={`bwz-tyg-liczba ${w.biezacy ? "bwz-tyg-liczba-teraz" : ""}`} style={{ fontSize: 12, fontWeight: 600 }}>{w.rozmow}</text>
              <text x={x + sl / 2} y={H - 9} textAnchor="middle" className={`bwz-os ${w.biezacy ? "bwz-tyg-os-teraz" : ""}`} style={{ fontSize: 10.5 }}>{w.biezacy ? t(jezyk, "now", "teraz") : data(w.od)}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
