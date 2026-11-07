"use client";

import { useRef, useState } from "react";
import Link from "next/link";

// 7.11 (USER_001 „GO” po badaniu: Clari Flow/Waterfall, Sankey zamiast lejka, mapa zastoju, prognoza):
// 3 WIZUALIZACJE LEJKA, których Pipedrive nie ma:
// 1. PRZEPŁYW DEALI (Sankey): kolumna = etap, wysokość = ile deali doszło; wstęgi: dalej (atrament), otwarte tu (szare),
//    przegrane (czerwone, do dolnego ujścia), wygrane (zielone). Najechanie = podświetlenie + dymek.
// 2. MAPA „GDZIE UTKNĘŁY DEALE”: oś X = dni bez kontaktu, wiersz = etap, kółko = deal (wielkość = zł),
//    kolor po świeżości (≤3 zielony, ≤7 żółty, >7 czerwony), linia alarmu 7 dni, klik = karta klienta.
// 3. PROGNOZA DO CELU: wygrane w tym miesiącu + otwarte × szansa etapu = spodziewane; pasek do celu, tabela per etap.
// Teksty w kolorach tekstu, kolory statusu tylko tam, gdzie znaczą (dataviz). Telefon: Sankey ukryty (lista w lejek-wykres).

type J = "pl" | "en";
const tt = (j: J) => (en: string, pl: string) => (j === "pl" ? pl : en);

/* ====================== 1. PRZEPŁYW DEALI ====================== */
export type EtapPrzeplywu = { id: number; nazwa: string; doszlo: number; dalej: number; otwarte: number; wygrane: number; przegrane: number; wartoscTekst: string; strataTekst: string | null; naj: boolean };

const KOLOR = { dalej: "#141416", otwarte: "#a9abb5", przegrane: "#e5484d", wygrane: "#17a05e" } as const;

export function PrzeplywDeali({ etapy, jezyk }: { etapy: EtapPrzeplywu[]; jezyk: J }) {
  const t = tt(jezyk);
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; tytul: string; linie: string[] } | null>(null);
  const [akt, setAkt] = useState<string | null>(null);

  const W = 960;
  const H = 400;
  const TOP = 70;
  const L = 24;
  const XS = W - 150; // kolumna ujść
  const NW = 14; // szerokość węzła
  const n = etapy.length;
  const krok = n > 1 ? (XS - 70 - L) / (n - 1) : 0;
  const x = (i: number) => L + i * krok;
  const max = Math.max(1, ...etapy.map((e) => e.doszlo));
  const k = 250 / max;
  const h = (v: number) => (v > 0 ? Math.max(3, v * k) : 0);

  // Węzły etapów: góra wyrównana. Wypływy od góry: wygrane, dalej, otwarte, przegrane.
  const wezly = etapy.map((e, i) => {
    const y0 = TOP;
    let y = y0;
    const seg = (v: number) => {
      const a = y;
      y += h(v);
      return [a, y] as const;
    };
    const wyg = seg(e.wygrane);
    const dal = seg(i < n - 1 ? e.dalej - e.wygrane : 0);
    const otw = seg(e.otwarte);
    const prz = seg(e.przegrane);
    return { e, i, x: x(i), y0, y1: y, wyg, dal, otw, prz };
  });
  // Ujścia (z prawej): wygrane, otwarte, przegrane, z odstępami.
  const sumWyg = etapy.reduce((s, e) => s + e.wygrane, 0);
  const sumOtw = etapy.reduce((s, e) => s + e.otwarte, 0);
  const sumPrz = etapy.reduce((s, e) => s + e.przegrane, 0);
  const G = 22;
  const uj = { wyg: [TOP, TOP + h(sumWyg)] as [number, number], otw: [0, 0] as [number, number], prz: [0, 0] as [number, number] };
  uj.otw = [uj.wyg[1] + (sumWyg ? G : 0), uj.wyg[1] + (sumWyg ? G : 0) + h(sumOtw)];
  uj.prz = [uj.otw[1] + (sumOtw ? G : 0), uj.otw[1] + (sumOtw ? G : 0) + h(sumPrz)];
  const kursor = { wyg: uj.wyg[0], otw: uj.otw[0], prz: uj.prz[0] };

  const wstega = (x1: number, a1: number, b1: number, x2: number, a2: number, b2: number) => {
    const c = (x1 + x2) / 2;
    return `M${x1},${a1} C${c},${a1} ${c},${a2} ${x2},${a2} L${x2},${b2} C${c},${b2} ${c},${b1} ${x1},${b1} Z`;
  };

  type Wst = { id: string; d: string; kolor: string; tytul: string; linie: string[]; v: number };
  const wstegi: Wst[] = [];
  wezly.forEach((w) => {
    const e = w.e;
    const nast = wezly[w.i + 1];
    // dalej → następny etap (wejście następnego = cała jego wysokość)
    if (nast && w.dal[1] > w.dal[0]) {
      wstegi.push({ id: `d${w.i}`, d: wstega(w.x + NW, w.dal[0], w.dal[1], nast.x, nast.y0, nast.y1), kolor: KOLOR.dalej, v: e.dalej - e.wygrane, tytul: `${e.nazwa} → ${nast.e.nazwa}`, linie: [`${e.dalej - e.wygrane} ${t("deals moved on", "deali poszło dalej")} (${e.doszlo ? Math.round((100 * (e.dalej - e.wygrane)) / e.doszlo) : 0} %)`] });
    }
    // wygrane → ujście
    if (e.wygrane) {
      const a = kursor.wyg;
      kursor.wyg += h(e.wygrane);
      wstegi.push({ id: `w${w.i}`, d: wstega(w.x + NW, w.wyg[0], w.wyg[1], XS, a, kursor.wyg), kolor: KOLOR.wygrane, v: e.wygrane, tytul: `${e.nazwa} → ${t("Won", "Wygrane")}`, linie: [`${e.wygrane} ${t("won", "wygranych")}`] });
    }
    // otwarte → ujście
    if (e.otwarte) {
      const a = kursor.otw;
      kursor.otw += h(e.otwarte);
      wstegi.push({ id: `o${w.i}`, d: wstega(w.x + NW, w.otw[0], w.otw[1], XS, a, kursor.otw), kolor: KOLOR.otwarte, v: e.otwarte, tytul: `${e.nazwa} · ${t("open now", "otwarte teraz")}`, linie: [`${e.otwarte} ${t("open", "otw.")} · ${e.wartoscTekst}`] });
    }
    // przegrane → ujście
    if (e.przegrane) {
      const a = kursor.prz;
      kursor.prz += h(e.przegrane);
      wstegi.push({ id: `p${w.i}`, d: wstega(w.x + NW, w.prz[0], w.prz[1], XS, a, kursor.prz), kolor: KOLOR.przegrane, v: e.przegrane, tytul: `${e.nazwa} → ${t("Lost", "Przegrane")}`, linie: [`${e.przegrane} ${t("lost here", "przegranych tutaj")}${e.strataTekst ? ` · ${e.strataTekst}` : ""}`, `${e.doszlo ? Math.round((100 * e.przegrane) / e.doszlo) : 0} % ${t("of deals that reached this stage", "deali, które tu doszły")}`] });
    }
  });

  const pokaz = (ev: React.PointerEvent, tytul: string, linie: string[], id: string) => {
    const o = ref.current?.getBoundingClientRect();
    if (!o) return;
    setHover({ x: ev.clientX - o.left, y: ev.clientY - o.top, tytul, linie });
    setAkt(id);
  };
  const schowaj = () => {
    setHover(null);
    setAkt(null);
  };
  const przyc = (id: string) => (akt === null ? 1 : akt === id || akt.startsWith(`n${id.slice(1)}`) ? 1 : 0.18);

  return (
    <div ref={ref} className="pl-wykres pl-tylko-pulpit" onPointerLeave={schowaj}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("Deal flow between stages", "Przepływ deali między etapami")}>
        {/* wstęgi */}
        {wstegi.map((s) => (
          <path key={s.id} d={s.d} fill={s.kolor} opacity={akt === null ? (s.kolor === KOLOR.dalej ? 0.09 : s.kolor === KOLOR.otwarte ? 0.35 : 0.5) : akt === s.id ? (s.kolor === KOLOR.dalej ? 0.35 : 0.9) : 0.05} className="pl-wst" onPointerMove={(ev) => pokaz(ev, s.tytul, s.linie, s.id)} />
        ))}
        {/* węzły etapów */}
        {wezly.map((w) => (
          <g key={w.e.id} opacity={przyc(`n${w.i}`)}>
            <rect x={w.x} y={w.y0} width={NW} height={Math.max(3, w.y1 - w.y0)} rx="4" fill={w.e.naj ? "#e2a300" : "#141416"} onPointerMove={(ev) => pokaz(ev, `${w.i + 1}. ${w.e.nazwa}`, [`${w.e.doszlo} ${t("deals reached", "deali doszło")}`, `${w.e.otwarte} ${t("open", "otw.")} · ${w.e.przegrane} ${t("lost", "przegr.")}${w.e.wygrane ? ` · ${w.e.wygrane} ${t("won", "wygr.")}` : ""}`], `n${w.i}`)} />
            <text x={w.x} y={TOP - (w.i % 2 ? 50 : 22)} textAnchor="start" className="pl-etap-nazwa" style={{ fontSize: 12.5 }}>{w.i + 1}. {w.e.nazwa.length > 24 ? `${w.e.nazwa.slice(0, 23)}…` : w.e.nazwa}</text>
            <text x={w.x} y={TOP - (w.i % 2 ? 36 : 8)} textAnchor="start" className="pl-etap-pod">{w.e.doszlo} {t("deals", "deali")} · {w.e.otwarte} {t("open", "otw.")}</text>
            {w.i % 2 === 1 && <line x1={w.x + NW / 2} x2={w.x + NW / 2} y1={TOP - 30} y2={TOP - 2} stroke="#d9dae0" />}
            {w.e.naj && <text x={w.x + NW / 2} y={w.y1 + 16} textAnchor="middle" className="pl-naj-pigulka">▲ {t("weakest", "najsłabszy")}</text>}
          </g>
        ))}
        {/* ujścia */}
        {sumWyg > 0 && (
          <g>
            <rect x={XS} y={uj.wyg[0]} width={NW} height={Math.max(3, uj.wyg[1] - uj.wyg[0])} rx="4" fill={KOLOR.wygrane} />
            <text x={XS + NW + 10} y={(uj.wyg[0] + uj.wyg[1]) / 2 + 4} className="pl-etap-nazwa" fill="#15803d">{sumWyg} {t("won", "wygranych")}</text>
          </g>
        )}
        {sumOtw > 0 && (
          <g>
            <rect x={XS} y={uj.otw[0]} width={NW} height={Math.max(3, uj.otw[1] - uj.otw[0])} rx="4" fill="#141416" />
            <text x={XS + NW + 10} y={(uj.otw[0] + uj.otw[1]) / 2 + 4} className="pl-etap-nazwa">{sumOtw} {t("open", "otwartych")}</text>
          </g>
        )}
        {sumPrz > 0 && (
          <g>
            <rect x={XS} y={uj.prz[0]} width={NW} height={Math.max(3, uj.prz[1] - uj.prz[0])} rx="4" fill={KOLOR.przegrane} />
            <text x={XS + NW + 10} y={(uj.prz[0] + uj.prz[1]) / 2 + 4} className="pl-etap-nazwa" fill="#c0262c">{sumPrz} {t("lost", "przegranych")}</text>
          </g>
        )}
      </svg>
      {hover && (
        <div className={`p-dymek ${hover.y < 80 ? "p-dymek-dol" : ""}`} style={{ left: hover.x, top: hover.y + (hover.y < 80 ? 14 : -14) }} role="tooltip">
          <b>{hover.tytul}</b>
          {hover.linie.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/* ====================== 2. MAPA UTKNIĘTYCH DEALI ====================== */
export type DealMapy = { id: number; tytul: string; osoba: string | null; organizacja: string | null; etapIdx: number; wartosc: number; wartoscTekst: string; dni: number; handlowiec: string | null; href: string };

export function MapaUtknietych({ deale, etapy, jezyk, alarm = 7 }: { deale: DealMapy[]; etapy: string[]; jezyk: J; alarm?: number }) {
  const t = tt(jezyk);
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; d: DealMapy } | null>(null);
  const W = 960;
  const L = 190;
  const R = 30;
  const RZ = 54;
  const TOP = 30;
  const H = TOP + etapy.length * RZ + 36;
  const maxDni = Math.max(14, ...deale.map((d) => d.dni)) + 2;
  const maxV = Math.max(1, ...deale.map((d) => d.wartosc));
  const x = (dni: number) => L + ((W - L - R) * dni) / maxDni;
  const y = (idx: number) => TOP + idx * RZ + RZ / 2;
  const r = (v: number) => 5 + 13 * Math.sqrt(v / maxV);
  const kolor = (dni: number) => (dni <= 3 ? "#17a05e" : dni <= alarm ? "#e2a300" : "#e5484d");
  const tyki = [0, 3, 7, 14, 21, 30, 45, 60, 90].filter((v) => v <= maxDni);
  const zagrozone = deale.filter((d) => d.dni > alarm);
  const zagrozoneZl = zagrozone.reduce((s, d) => s + d.wartosc, 0);
  // Rozsuń kółka w tym samym wierszu i podobnym x (lekki rozrzut w pionie).
  const pos = deale.map((d, i) => {
    const bliskie = deale.slice(0, i).filter((q) => q.etapIdx === d.etapIdx && Math.abs(x(q.dni) - x(d.dni)) < 18).length;
    return { d, cx: x(d.dni), cy: y(d.etapIdx) + (bliskie % 3 === 0 ? 0 : bliskie % 3 === 1 ? -12 : 12) };
  });

  return (
    <div ref={ref} className="pl-wykres pl-mapa" onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("Stuck deals map", "Mapa utkniętych deali")}>
        {etapy.map((e, i) => (
          <g key={i}>
            {i % 2 === 1 && <rect x={L - 8} y={TOP + i * RZ} width={W - L - R + 16} height={RZ} rx="10" fill="#f6f6f8" />}
            <text x={L - 18} y={y(i) + 4} textAnchor="end" className="pl-etap-nazwa" style={{ fontSize: 12.5 }}>{e.length > 24 ? `${e.slice(0, 23)}…` : e}</text>
          </g>
        ))}
        {tyki.map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={TOP} y2={TOP + etapy.length * RZ} className="p-siatka" />
            <text x={x(v)} y={H - 10} textAnchor="middle" className="p-os">{v === 0 ? t("today", "dziś") : `${v} ${t("d", "dni")}`}</text>
          </g>
        ))}
        <line x1={x(alarm)} x2={x(alarm)} y1={TOP - 8} y2={TOP + etapy.length * RZ} stroke="#e5484d" strokeDasharray="4 4" strokeWidth="1.5" />
        <text x={x(alarm) + 6} y={TOP - 12} className="p-os-b" fill="#c0262c" style={{ fontSize: 11 }}>{t(`alarm: ${alarm}+ days without contact`, `alarm: ${alarm}+ dni bez kontaktu`)}</text>
        {pos.map(({ d, cx, cy }) => (
          <Link key={d.id} href={d.href}>
            <circle cx={cx} cy={cy} r={r(d.wartosc)} fill={kolor(d.dni)} fillOpacity={hover && hover.d.id === d.id ? 1 : 0.78} stroke="#fff" strokeWidth="2" className="pl-kolko" onPointerMove={(ev) => { const o = ref.current?.getBoundingClientRect(); if (o) setHover({ x: ev.clientX - o.left, y: ev.clientY - o.top, d }); }} />
          </Link>
        ))}
      </svg>
      {hover && (
        <div className={`p-dymek ${hover.y < 80 ? "p-dymek-dol" : ""}`} style={{ left: hover.x, top: hover.y + (hover.y < 80 ? 14 : -14) }} role="tooltip">
          <b>{hover.d.tytul}</b>
          <span>{[hover.d.osoba, hover.d.organizacja, hover.d.handlowiec].filter(Boolean).join(" · ")}</span>
          <span>{hover.d.wartoscTekst} · {etapy[hover.d.etapIdx]}</span>
          <small>{hover.d.dni === 0 ? t("contact today", "kontakt dziś") : `${hover.d.dni} ${t("days without contact", "dni bez kontaktu")}`} · {t("click = client card", "klik = karta klienta")}</small>
        </div>
      )}
      <div className="p-legenda" style={{ marginTop: 10 }}>
        <span><i style={{ background: "#17a05e", borderRadius: "50%" }} /> ≤ 3 {t("days", "dni")}</span>
        <span><i style={{ background: "#e2a300", borderRadius: "50%" }} /> 4-{alarm} {t("days", "dni")}</span>
        <span><i style={{ background: "#e5484d", borderRadius: "50%" }} /> &gt; {alarm} {t("days", "dni")}: <b style={{ fontWeight: 600 }}>{zagrozone.length}</b> {t("deals", "deali")}, {new Intl.NumberFormat(jezyk === "pl" ? "pl-PL" : "en-US").format(zagrozoneZl)}</span>
        <span style={{ color: "var(--p-ink-3)" }}>{t("Circle size = deal value.", "Wielkość kółka = wartość deala.")}</span>
      </div>
    </div>
  );
}

/* ====================== 3. PROGNOZA DO CELU ====================== */
export type EtapPrognozy = { nazwa: string; otwarte: number; wartosc: number; wartoscTekst: string; szansa: number; wazone: number; wazoneTekst: string };

// Teksty kwot przychodzą z serwera (funkcji nie da się przekazać do komponentu klienta).
export function Prognoza({ etapy, wygraneMc, cel, miesiac, teksty, jezyk }: { etapy: EtapPrognozy[]; wygraneMc: number; cel: number; miesiac: string; teksty: { wygrane: string; wazone: string; spodziewane: string; cel: string; brak: string; nad: string }; jezyk: J }) {
  const t = tt(jezyk);
  const wazone = etapy.reduce((s, e) => s + e.wazone, 0);
  const spodziewane = wygraneMc + wazone;
  const brak = Math.max(0, cel - spodziewane);
  const skala = Math.max(cel, spodziewane) || 1;
  const pct = (v: number) => `${(100 * v) / skala}%`;
  const szary = ["#141416", "#3a3b42", "#5f616b", "#85878f", "#a9abb5", "#c9cad1"];
  return (
    <div className="pl-prog">
      <div className="pl-prog-gora">
        <div>
          <div className="pl-alarm-et">{t("Expected this month", "Spodziewane w tym miesiącu")} · {miesiac}</div>
          <div className="pl-prog-liczba">{teksty.spodziewane}</div>
          <div className="pl-prog-pod">
            {t("won", "wygrane")} <b>{teksty.wygrane}</b> + {t("open × stage chance", "otwarte × szansa etapu")} <b>{teksty.wazone}</b>
          </div>
        </div>
        <div className="pl-prog-cel">
          <div className="pl-alarm-et">{t("Goal", "Cel")}</div>
          <div className="pl-prog-liczba" style={{ fontSize: 22 }}>{teksty.cel}</div>
          {brak > 0 ? <span className="p-chip p-chip-zle"><i />{t("missing", "brakuje")} {teksty.brak}</span> : <span className="p-chip p-chip-ok"><i />{t("goal reached", "cel osiągnięty")} +{teksty.nad}</span>}
        </div>
      </div>
      <div className="pl-prog-pasek" role="img" aria-label={`${Math.round((100 * spodziewane) / (cel || 1))} %`}>
        {wygraneMc > 0 && <i style={{ width: pct(wygraneMc), background: "#17a05e" }} title={`${t("won", "wygrane")}: ${teksty.wygrane}`} />}
        {etapy.map((e, i) => e.wazone > 0 && <i key={e.nazwa} style={{ width: pct(e.wazone), background: szary[i % szary.length] }} title={`${e.nazwa}: ${e.wazoneTekst} (${e.szansa} % × ${e.wartoscTekst})`} />)}
        <b className="pl-prog-cel-kreska" style={{ left: pct(cel) }}><span>{t("goal", "cel")}</span></b>
      </div>
      <div className="p-tabela-wrap">
        <table className="p-tabela p-tabela-gesta pl-prog-tabela">
          <thead>
            <tr>
              <th>{t("Stage", "Etap")}</th>
              <th className="p-num">{t("Open", "Otwarte")}</th>
              <th className="p-num">{t("Value", "Wartość")}</th>
              <th className="p-num">{t("Chance", "Szansa")}</th>
              <th className="p-num">{t("Expected", "Spodziewane")}</th>
            </tr>
          </thead>
          <tbody>
            {etapy.map((e, i) => (
              <tr key={e.nazwa}>
                <td><span className="p-osoba"><i style={{ width: 10, height: 10, borderRadius: 3, background: szary[i % szary.length], display: "inline-block" }} /> {e.nazwa}</span></td>
                <td className="p-num">{e.otwarte}</td>
                <td className="p-num">{e.wartoscTekst}</td>
                <td className="p-num">{e.szansa} %</td>
                <td className="p-num"><b>{e.wazoneTekst}</b></td>
              </tr>
            ))}
            <tr>
              <td><b>{t("Won this month", "Wygrane w tym miesiącu")}</b></td>
              <td className="p-num" colSpan={3} />
              <td className="p-num"><b className="p-ok-t">{teksty.wygrane}</b></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
