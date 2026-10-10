"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DanePanelu } from "./dane";
import Licz from "./licz";
import { Ikona, linkiDla, rozmowy, useWyloguj } from "./wspolne";
import "./panel-a.css";
import dynamic from "next/dynamic";

// 10.10 (USER_001): wariant „lp” = kolory i styl strony /brunoai; zamiast kuli fala głosu z nagłówka strony.
const FalaGlosu = dynamic(() => import("@/components/podglad/bruno-lp/voice-canvas"), { ssr: false });

// Wersja A panelu Bruno (6.10): wzór fitness-dashboard.html (jasny, zieleń Bruno,
// pasek ikon z lewej, karta z kulą głosu). Dane = prawdziwy panel.

/* ---------- Kula głosu (canvas 2D, port z wzoru) ---------- */
function Kula({ glosniej }: { glosniej: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ampCel = useRef(0.45);
  useEffect(() => {
    ampCel.current = glosniej ? 1.25 : 0.45;
  }, [glosniej]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cx = cv.getContext("2d");
    if (!cx) return;
    const ruch = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, amp = 0.45, raf = 0;
    const rozmiar = () => {
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * DPR; cv.height = H * DPR;
      cx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (!ruch) rysuj(4000);
    };
    const plamy = [
      { c: "167,243,208", s: 1.0, p: 0, f: 3 },
      { c: "94,234,212", s: 1.3, p: 2.1, f: 4 },
      { c: "255,255,255", s: 0.8, p: 4.2, f: 5 },
      { c: "61,220,151", s: 1.6, p: 1.2, f: 2 },
    ];
    function rysuj(ms: number) {
      if (!cx) return;
      const t = ms / 1000;
      amp += (ampCel.current - amp) * 0.06;
      cx.clearRect(0, 0, W, H);
      const male = W < 560;
      const ox = male ? W * 0.5 : W * 0.74, oy = male ? H * 0.45 : H * 0.47, R = Math.min(W, H) * (male ? 0.23 : 0.33);
      let g = cx.createRadialGradient(ox, oy, R * 0.2, ox, oy, R * 2.1);
      g.addColorStop(0, "rgba(234,255,245,.55)"); g.addColorStop(0.45, "rgba(167,243,208,.18)"); g.addColorStop(1, "rgba(167,243,208,0)");
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      cx.save(); cx.globalAlpha = 0.25; cx.strokeStyle = "#eafff5";
      for (let i = 0; i < 3; i++) { const rr = R * (1.25 + i * 0.32) + Math.sin(t * 1.2 + i) * 4 * amp * 2; cx.lineWidth = 1; cx.beginPath(); cx.arc(ox, oy, rr, 0, Math.PI * 2); cx.stroke(); }
      cx.restore();
      g = cx.createRadialGradient(ox - R * 0.3, oy - R * 0.35, R * 0.05, ox, oy, R);
      g.addColorStop(0, "#f2fffa"); g.addColorStop(0.35, "#a7f3d0"); g.addColorStop(0.75, "#2fcf8a"); g.addColorStop(1, "#0f7a52");
      cx.fillStyle = g; cx.beginPath(); cx.arc(ox, oy, R, 0, Math.PI * 2); cx.fill();
      cx.save(); cx.beginPath(); cx.arc(ox, oy, R, 0, Math.PI * 2); cx.clip(); cx.globalCompositeOperation = "screen";
      for (const b of plamy) {
        cx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 60) {
          const r = R * 0.78 + Math.sin(a * b.f + t * b.s + b.p) * R * 0.12 * (0.6 + amp) + Math.cos(a * 2 - t * 0.7 * b.s) * R * 0.07;
          const x = ox + Math.cos(a) * r * 0.95, y = oy + Math.sin(a) * r * 0.7 + Math.sin(t * b.s + b.p) * R * 0.12;
          if (a) cx.lineTo(x, y); else cx.moveTo(x, y);
        }
        const bg = cx.createLinearGradient(ox - R, oy - R, ox + R, oy + R);
        bg.addColorStop(0, `rgba(${b.c},0)`); bg.addColorStop(0.5, `rgba(${b.c},.35)`); bg.addColorStop(1, `rgba(${b.c},0)`);
        cx.fillStyle = bg; cx.fill();
      }
      cx.restore();
      cx.strokeStyle = "rgba(255,255,255,.55)"; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(ox, oy, R, Math.PI * 1.1, Math.PI * 1.65); cx.stroke();
      const linie = [{ a: 1, w: 2.2, c: "rgba(255,255,255,.95)", ph: 0 }, { a: 0.7, w: 1.4, c: "rgba(10,31,25,.55)", ph: 1.7 }, { a: 0.5, w: 1.2, c: "rgba(234,255,245,.7)", ph: 3.1 }];
      for (const L of linie) {
        cx.beginPath(); cx.lineWidth = L.w; cx.strokeStyle = L.c;
        const x0 = ox - R * 1.05, x1 = ox + R * 1.05;
        for (let x = x0; x <= x1; x += 2) {
          const u = (x - x0) / (x1 - x0), env = Math.pow(Math.sin(u * Math.PI), 2.2);
          const y = oy + R * 0.62 + env * R * 0.42 * amp * L.a * Math.sin(u * 14 + t * 4 + L.ph) * Math.sin(u * 5 - t * 1.3 + L.ph);
          if (x === x0) cx.moveTo(x, y); else cx.lineTo(x, y);
        }
        cx.stroke();
      }
    }
    const petla = (ms: number) => { rysuj(ms); raf = requestAnimationFrame(petla); };
    rozmiar();
    window.addEventListener("resize", rozmiar);
    if (ruch) raf = requestAnimationFrame(petla);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", rozmiar);
    };
  }, []);
  return <canvas ref={ref} aria-hidden />;
}

/* ---------- Szklany kafelek z liczbą (dni dostępu, rozmowy dziś), styl z wersji B ---------- */
function Pierscien({ liczba, opis, uwaga }: { liczba: string; opis: string; uwaga: string }) {
  return (
    <div className="chip glass" title={`${opis}: ${liczba}, ${uwaga}`}>
      <b>{liczba}</b>
      <span>{opis}<small>{uwaga}</small></span>
    </div>
  );
}

/** true po pierwszej klatce: wypełnienia startują puste i dobiegają (jak we wzorze). */
function useGotowe() {
  const [g, setG] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setG(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return g;
}

/* ---------- Karta minut / planu ---------- */
type Tryb = "d" | "t" | "m";
function Minuty({ d }: { d: DanePanelu }) {
  const [k, setK] = useState<Tryb>("d");
  const gotowe = useGotowe();
  const r7 = d.dni7.reduce((a, x) => a + x.wartosc, 0);
  const dane = {
    d: { n: d.minDzis, sufiks: " min", u: "/dziś", udzial: d.dziennie ? d.dzis / d.dziennie : 0, txt: `Dziś ${d.dzis} z ${d.dziennie} ${rozmowy(d.dziennie)}. Każda trwa ${d.rozmowaMin} min.`, badge: d.planZrobiony ? "Plan dnia zrobiony" : `Zostało ${d.zostaloDzis}` },
    t: { n: d.min7, sufiks: " min", u: "/7 dni", udzial: d.dziennie ? r7 / (d.dziennie * 7) : 0, txt: `Ostatnie 7 dni: ${r7} ${rozmowy(r7)} i ${d.min7} min treningu.`, badge: `${r7} ${rozmowy(r7)}` },
    m: { n: d.minutZostalo, sufiks: ` / ${d.limitMinut}`, u: "min zostało", udzial: d.limitMinut ? d.minutZostalo / d.limitMinut : 0, txt: d.minutZostalo >= 1 ? "Limit minut na cały test." : "Limit minut testu wyczerpany.", badge: d.koniec ? `do ${d.koniec}` : `${d.dniZostalo} dni dostępu` },
  }[k];
  const pelne = Math.round(Math.min(1, dane.udzial) * 25);
  const opisy: Record<Tryb, string> = { d: "Dziś", t: "Ostatnie 7 dni", m: "Minuty testu" };
  return (
    <article className="card glass mins">
      <h3>Plan dnia</h3>
      <p>{dane.txt}</p>
      <span className="badge glass"><i />{dane.badge}</span>
      <div className="blocks" aria-hidden>
        {Array.from({ length: 25 }, (_, i) => {
          const idx = 24 - i;
          return <div key={i} className={`blk ${gotowe && idx < pelne ? "f" : ""}`} style={{ transitionDelay: `${i * 22}ms` }} />;
        })}
      </div>
      <div className="toggle" role="tablist">
        {(["d", "t", "m"] as Tryb[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={k === t} title={opisy[t]} aria-label={opisy[t]} className={k === t ? "on" : ""} onClick={() => setK(t)}>
            {{ d: "D", t: "7", m: "M" }[t]}
          </button>
        ))}
      </div>
      <div className="big">
        <div className="n"><Licz key={k} do={dane.n} po={dane.sufiks} /></div>
        <div className="u">{dane.u}</div>
      </div>
    </article>
  );
}

/* ---------- Typ klienta (karuzela 4 kolorów) ---------- */
function TypKlienta({ d }: { d: DanePanelu }) {
  const [i, setI] = useState(0);
  const [znika, setZnika] = useState(false);
  const p = d.postacie[i];
  const zmien = (o: number) => {
    setZnika(true);
    window.setTimeout(() => {
      setI((x) => (x + o + d.postacie.length) % d.postacie.length);
      setZnika(false);
    }, 220);
  };
  return (
    <article className="card glass bc persona">
      <h3 className={`fade ${znika ? "out" : ""}`}>
        {i === 0 ? "Twój typ klienta" : "Inny typ klienta"}
        <span style={{ color: p.kolor }}>Klient {p.nazwa.toLowerCase()}</span>
      </h3>
      <div className="tip glass">
        <span className="lab"><span className="kropka" style={{ background: p.kolor }} />{p.krotko}</span>
        <p className={`fade ${znika ? "out" : ""}`}>{p.opis}</p>
      </div>
      <div className="pager">
        <div className="c">{i + 1}<small>/{d.postacie.length}</small></div>
        <div className="arr">
          <button type="button" aria-label="Poprzedni" onClick={() => zmien(-1)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg></button>
          <button type="button" aria-label="Następny" onClick={() => zmien(1)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></button>
        </div>
      </div>
    </article>
  );
}

/* ---------- Ocena rozmowy ---------- */
function Ocena({ d }: { d: DanePanelu }) {
  const [k, setK] = useState<"ost" | "sr">("ost");
  const gotowe = useGotowe();
  const o = k === "ost" ? d.ostatnia : d.srednia;
  return (
    <article className="card glass bc">
      <div className="hd">
        <span className="ico glass"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg></span>
        <h3>Ocena rozmowy</h3>
        <div className="seg glass" style={{ marginLeft: "auto" }}>
          <button type="button" className={k === "ost" ? "on" : ""} onClick={() => setK("ost")}>Ostatnia</button>
          <button type="button" className={k === "sr" ? "on" : ""} onClick={() => setK("sr")}>Średnia</button>
        </div>
      </div>
      <div className="sub"><span>{o ? "" : "Brak ocenionych rozmów"}</span><span>Na 10</span></div>
      <div className="score">{o ? <Licz key={k} do={o.ocena} dec={1} /> : "–"}<small>/10</small></div>
      <div className="crit">
        {(o?.kryteria ?? ["Otwarcie", "Pytania", "Obiekcje", "Zamknięcie", "Pewność siebie"].map((nazwa) => ({ nazwa, ocena: 0 }))).map((c, ri) => (
          <div className="row" key={c.nazwa}>
            <span>{c.nazwa}</span>
            <div className="ticks">
              {Array.from({ length: 10 }, (_, ti) => (
                <i key={ti} className={gotowe && ti < Math.round(c.ocena) ? "f" : ""} style={{ transitionDelay: `${ri * 70 + ti * 35}ms` }} />
              ))}
            </div>
            <b>{o ? String(c.ocena).replace(".", ",") : "–"}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

/* ---------- Rozmowy w ostatnich 7 dniach (wykres falowy) ---------- */
function wygladz(pts: [number, number][]) {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2;
    s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return s;
}
function Fala({ d }: { d: DanePanelu }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const teraz = d.dni7.map((x) => x.wartosc);
  const max = Math.max(d.dziennie, ...teraz, ...d.dniPoprzednie, 1);
  const X = (i: number) => 10 + i * (280 / 6);
  const Y = (v: number) => 110 - (v / max) * 96;
  const pTeraz = useMemo(() => teraz.map((v, i) => [X(i), Y(v)] as [number, number]), [teraz.join(), max]); // eslint-disable-line react-hooks/exhaustive-deps
  const pPrzed = useMemo(() => d.dniPoprzednie.map((v, i) => [X(i), Y(v)] as [number, number]), [d.dniPoprzednie.join(), max]); // eslint-disable-line react-hooks/exhaustive-deps
  const r7 = teraz.reduce((a, b) => a + b, 0);
  const celTyg = d.dziennie * 7;
  const proc = celTyg ? Math.round((r7 / celTyg) * 100) : 0;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anim: Animation[] = [];
    svg.querySelectorAll<SVGPathElement>(".ln").forEach((p, i) => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L}`;
      anim.push(p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1600, delay: 400 + i * 250, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }));
    });
    const area = svg.querySelector(".area");
    if (area) anim.push(area.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 1400, fill: "forwards" }));
    return () => anim.forEach((a) => a.cancel());
  }, []);

  const ruch = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 300;
    setHover(Math.max(0, Math.min(6, Math.round((x - 10) / (280 / 6)))));
  };
  const h = hover ?? 6;
  const dzien = d.dni7[h];

  return (
    <article className="card glass bc prog">
      <div className="hd">
        <span className="ico glass"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></svg></span>
        <h3>Rozmowy</h3>
        <div className="r"><Licz do={r7} czas={1200} /><small>{rozmowy(r7)}</small></div>
      </div>
      <div className="sub"><span>W ostatnich 7 dniach</span></div>
      <div style={{ position: "relative" }}>
        <svg
          ref={svgRef}
          className="wave"
          viewBox="0 0 300 120"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Rozmowy w ostatnich 7 dniach: ${d.dni7.map((x) => `${x.etykieta} ${x.wartosc}`).join(", ")}`}
          onPointerMove={ruch}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="bpa-gl" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".15" /><stop offset=".12" stopColor="#fff" stopOpacity=".95" /><stop offset=".88" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity=".6" /></linearGradient>
            <filter id="bpa-glow" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="4" /></filter>
            <linearGradient id="bpa-ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eafff5" stopOpacity=".32" /><stop offset=".5" stopColor="#a7f3d0" stopOpacity=".07" /><stop offset="1" stopColor="#a7f3d0" stopOpacity="0" /></linearGradient>
          </defs>
          <path d={`${wygladz(pTeraz)} L290,120 L10,120 Z`} fill="url(#bpa-ga)" className="area" />
          <line x1="0" x2="300" y1={Y(d.dziennie)} y2={Y(d.dziennie)} stroke="#a7f3d0" strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
          <path d={wygladz(pPrzed)} fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={wygladz(pTeraz)} fill="none" stroke="#a7f3d0" strokeWidth="8" opacity=".55" filter="url(#bpa-glow)" />
          <path d={wygladz(pTeraz)} fill="none" stroke="url(#bpa-gl)" strokeWidth="3" strokeLinecap="round" className="ln" vectorEffect="non-scaling-stroke" />
          <line x1={pTeraz[h][0]} x2={pTeraz[h][0]} y1="0" y2="120" stroke="#fff" strokeOpacity=".35" strokeDasharray="2 5" opacity={hover === null ? 0 : 1} />
          <circle r="6" fill="#fff" stroke="#3ddc97" strokeWidth="3" cx={pTeraz[h][0]} cy={pTeraz[h][1]} />
        </svg>
        <span className="goal" style={{ top: `${(Y(d.dziennie) / 120) * 100}%` }}>cel {d.dziennie}</span>
        <div className={`tt ${hover !== null ? "on" : ""}`} style={{ left: `${(pTeraz[h][0] / 300) * 100}%`, top: `calc(${(pTeraz[h][1] / 120) * 100}% + 10px)` }}>
          {dzien.podpis}: {dzien.wartosc} {rozmowy(dzien.wartosc)} (tydzień wcześniej {d.dniPoprzednie[h]})
        </div>
      </div>
      <div className="dni">
        {d.dni7.map((x) => <span key={x.podpis} className={x.dzis ? "on" : ""}>{x.etykieta}</span>)}
      </div>
      <div className="foot">
        <div className="pct"><Licz do={proc} po="%" czas={1600} /></div>
        <div className="note">celu na 7 dni<b>{r7} z {celTyg} {rozmowy(celTyg)}</b></div>
      </div>
    </article>
  );
}

/* ---------- Strona ---------- */
export default function PanelA({ d, jasne = false, bialeTlo = false, lp = false, zielony = false, szklo = false, zloty = false, bialoZloty = false, pelny = false }: { d: DanePanelu; jasne?: boolean; bialeTlo?: boolean; lp?: boolean; zielony?: boolean; szklo?: boolean; zloty?: boolean; bialoZloty?: boolean; pelny?: boolean }) {
  const linki = linkiDla(pelny);
  const wyloguj = useWyloguj();
  const [glosniej, setGlosniej] = useState(false);
  const p = d.postacie.find((x) => x.id === d.postac) ?? d.postacie[0];
  const powitanie = d.imie ? `Cześć, ${d.imie}!` : "Cześć!";
  const plan = d.planZrobiony ? "Plan na dziś zrobiony" : `Dziś: ${d.zostaloDzis} ${rozmowy(d.zostaloDzis)}`;

  return (
    <div className={`bpa ${jasne ? "jasne" : ""} ${bialeTlo ? "bialetlo" : ""} ${lp ? "lp" : ""} ${zielony ? "zielony" : ""} ${szklo ? "szklo" : ""} ${zloty ? "czarny" : ""} ${bialoZloty ? "zlotyj" : ""}`}>
      <div className="app">
        <aside className="side">
          {/* 10.10 (USER_001): w czarno-złotym kółko z inicjałem na górze zamiast kropki logo, na dole go nie ma. */}
          {zloty ? (
            <Link href="/bruno/panel" className="me gora" title="Panel" aria-label="Panel">{d.inicjal}</Link>
          ) : (
            <Link href="/bruno/panel" className="logo" title="Bruno AI" aria-label="Bruno AI"><i /></Link>
          )}
          {linki.map((l) => (
            <span key={l.href} style={{ display: "contents" }}>
              {l.ikona === "dostosuj" && <div className="sep" />}
              <Link href={l.href} className={`nav ${l.ikona === "panel" ? "on" : ""}`} aria-label={l.nazwa} title={l.nazwa} aria-current={l.ikona === "panel" ? "page" : undefined}>
                <Ikona nazwa={l.ikona} />
              </Link>
            </span>
          ))}
          <div className="grow" />
          <button type="button" className="nav" aria-label="Wyloguj" title="Wyloguj" onClick={wyloguj}><Ikona nazwa="wyjscie" /></button>
          {!zloty && <div className="me" aria-hidden>{d.inicjal}</div>}
        </aside>

        <main>
          <header className="top">
            <div className="hello">
              <h1>{powitanie}</h1>
            </div>
            <div className="sp" />
            {!d.wygasl && (
              <div className="rings">
                <Pierscien liczba={`${d.dniZostalo}`} opis={d.dniZostalo === 1 ? "dzień dostępu" : "dni dostępu"} uwaga={d.koniec ? `do ${d.koniec}` : `z ${d.dni}, od pierwszego logowania`} />
                <Pierscien liczba={`${d.dzis}/${d.dziennie}`} opis="rozmów dziś" uwaga={d.planZrobiony ? "plan dnia zrobiony" : `zostało ${d.zostaloDzis}`} />
              </div>
            )}
            <Link className="btn sec glass upgrade" href="/bruno/odblokuj">
              <Ikona nazwa="klodka" rozmiar={15} grubosc={2} />
              <span className="dlugi">Odblokuj pełen dostęp</span>
              <span className="krotki">Odblokuj</span>
            </Link>
            <button type="button" className="wyl glass" onClick={wyloguj} aria-label="Wyloguj"><Ikona nazwa="wyjscie" rozmiar={18} /></button>
          </header>

          <nav className="mnav" aria-label="Panel">
            {linki.map((l) => (
              <Link key={l.href} href={l.href} className={`glass ${l.ikona === "panel" ? "on" : ""}`} aria-current={l.ikona === "panel" ? "page" : undefined}>{l.nazwa}</Link>
            ))}
          </nav>


          {!d.skonfigurowany && !d.wygasl && (
            <div className="uwaga glass">
              Bruno nie wie jeszcze, co sprzedajesz. <Link href="/bruno/dostosuj">Dostosuj Bruno</Link> (2 minuty), inaczej gra klienta ogólnego.
            </div>
          )}

          {d.wygasl ? (
            <section className="card glass wygasl">
              <h2>Dostęp testowy wygasł</h2>
              <p>{d.dni} dni minęło. Jeśli chcesz dalej trenować z Bruno, napisz do nas.</p>
              <Link href="/bruno/odblokuj" className="cta btn pri">Odblokuj pełen dostęp <i><Ikona nazwa="strzalka" rozmiar={16} grubosc={2.2} /></i></Link>
            </section>
          ) : (
            <>
              <section className="grid-top">
                <article className="card glass hi hero">
                  {lp ? <div className="fala-lp"><FalaGlosu akcentRgb={zloty || bialoZloty ? "201, 160, 74" : zielony ? "31, 174, 115" : undefined} bazaRgb={zloty ? "255, 255, 255" : undefined} bazaMnoznik={zloty ? 1.6 : 1} /></div> : <Kula glosniej={glosniej} />}
                  <h2>{plan}</h2>
                  <div className={`listen ${glosniej ? "live" : ""}`}>
                    {d.moznaRozmawiac ? (
                      <Link href={d.linkRozmowy} className="mic" aria-label={`Rozmawiaj z Bruno: klient ${p.nazwa.toLowerCase()}`} onPointerEnter={() => setGlosniej(true)} onPointerLeave={() => setGlosniej(false)} onFocus={() => setGlosniej(true)} onBlur={() => setGlosniej(false)}>
                        <Ikona nazwa="mikrofon" grubosc={2} />
                      </Link>
                    ) : (
                      <span className="mic off" aria-hidden><Ikona nazwa="mikrofon" grubosc={2} /></span>
                    )}
                    <span className="lab">{d.moznaRozmawiac ? "Rozmawiaj" : d.planZrobiony ? "Wróć jutro" : "Limit minut wyczerpany"}</span>
                  </div>
                  {!d.moznaRozmawiac && (
                    <span className="cta stat glass">{d.planZrobiony ? "Wróć jutro. Przypomnimy mailem rano." : "Limit minut testu wyczerpany."}</span>
                  )}
                </article>
                <Minuty d={d} />
              </section>

              <section className="grid-bot">
                <TypKlienta d={d} />
                <Ocena d={d} />
                <Fala d={d} />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
