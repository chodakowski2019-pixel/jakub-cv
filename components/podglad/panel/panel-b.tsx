"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DanePanelu, PostacPodglad } from "./dane";
import Burza, { type BurzaApi } from "./burza";
import Licz from "./licz";
import { Ikona, LINKI, rozmowy, useWyloguj } from "./wspolne";
import "./panel-b.css";

// Wersja B panelu Bruno (6.10): wzór forecast-center.html (niebo burzowe w WebGL,
// szklane karty z prawej, rząd dni ze świecącą krzywą). Dane = prawdziwy panel.

const IKONY_POGODY = {
  storm: <path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 15zM12 15l-2 3h3l-2 3" />,
  cloud: <path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 18z" />,
  part: <path d="M9 6.5V4M4.5 9H2.5M5.6 5.6 4.2 4.2M8 19h9a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.4A2.8 2.8 0 0 0 8 19zM6.4 12.5A3.5 3.5 0 0 1 12 8.3" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
};
type Pogoda = keyof typeof IKONY_POGODY;
function Pog({ p }: { p: Pogoda }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{IKONY_POGODY[p]}</svg>;
}

/* ---------- Rząd 7 dni + świecąca krzywa ---------- */
function Krzywa({ wartosci, cel, wybrany }: { wartosci: number[]; cel: number; wybrany: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [wym, setWym] = useState({ w: 0, h: 0 });
  const kropka = useRef<SVGCircleElement>(null);
  const halo = useRef<SVGCircleElement>(null);
  const pion = useRef<SVGLineElement>(null);
  const blask = useRef<SVGPathElement>(null);
  const linia = useRef<SVGPathElement>(null);
  const narysowana = useRef(false);
  const cel_ = useRef<[number, number]>([0, 0]);

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const mierz = () => setWym({ w: el.clientWidth, h: el.clientHeight });
    mierz();
    const ro = new ResizeObserver(mierz);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = wym;
  const n = wartosci.length;
  const colW = w / n;
  const max = Math.max(cel, ...wartosci, 1);
  const Y = (v: number) => 14 + (1 - v / max) * (h * 0.62);
  const pts = wartosci.map((v, i) => [colW * i + Math.min(60, colW * 0.35), Y(v)] as [number, number]);
  let sciezka = "";
  if (w && pts.length) {
    const ext = [[-colW * 0.1, pts[0][1] + 18], ...pts, [w * 0.99, pts[n - 1][1] + 22]];
    sciezka = `M${ext[0][0]},${ext[0][1]}`;
    for (let i = 0; i < ext.length - 1; i++) {
      const [x0, y0] = ext[i], [x1, y1] = ext[i + 1], mx = (x0 + x1) / 2;
      sciezka += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
  }
  if (pts[wybrany]) cel_.current = pts[wybrany];

  // Rysowanie linii przy pierwszym pomiarze.
  useEffect(() => {
    const lp = linia.current;
    if (!lp || !sciezka || narysowana.current) return;
    narysowana.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const L = lp.getTotalLength();
    lp.style.strokeDasharray = `${L}`;
    const a = lp.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1800, delay: 500, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
    return () => { a.finish(); };
  }, [sciezka]);

  // Kropka dojeżdża do wybranego dnia i oddycha (jak breathe() we wzorze).
  useEffect(() => {
    const ruch = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = cel_.current[0], y = cel_.current[1], raf = 0;
    const krok = (now: number) => {
      const [tx, ty] = cel_.current;
      x += (tx - x) * (ruch ? 0.12 : 1); y += (ty - y) * (ruch ? 0.12 : 1);
      kropka.current?.setAttribute("cx", `${x}`); kropka.current?.setAttribute("cy", `${y}`);
      halo.current?.setAttribute("cx", `${x}`); halo.current?.setAttribute("cy", `${y}`);
      halo.current?.setAttribute("r", `${13 + (ruch ? Math.sin(now * 0.004) * 4 : 0)}`);
      pion.current?.setAttribute("x1", `${x}`); pion.current?.setAttribute("x2", `${x}`);
      blask.current?.setAttribute("opacity", `${0.45 + (ruch ? Math.sin(now * 0.002) * 0.15 : 0)}`);
      if (ruch) raf = requestAnimationFrame(krok);
    };
    raf = requestAnimationFrame(krok);
    return () => cancelAnimationFrame(raf);
  }, [w, h, wybrany]);

  return (
    <svg ref={svgRef} className="curve" viewBox={`0 0 ${w || 1} ${h || 1}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="bpb-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eafff5" stopOpacity=".42" /><stop offset=".45" stopColor="#a7f3d0" stopOpacity=".08" /><stop offset="1" stopColor="#a7f3d0" stopOpacity="0" /></linearGradient>
        <linearGradient id="bpb-stroke" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".1" /><stop offset=".12" stopColor="#fff" stopOpacity=".9" /><stop offset=".88" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity=".05" /></linearGradient>
        <filter id="bpb-glow" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      {sciezka && (
        <>
          <path d={`${sciezka} L${w},${h + 140} L${-colW * 0.1},${h + 140} Z`} fill="url(#bpb-fill)" />
          <line x1="0" x2={w} y1={Y(cel)} y2={Y(cel)} stroke="#a7f3d0" strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="4 6" />
          <text x={w * 0.12} y={Y(cel) - 6} textAnchor="start" fill="#a7f3d0" style={{ fontSize: 11, fontWeight: 600 }}>goal {cel}</text>
          <path ref={blask} d={sciezka} fill="none" stroke="#a7f3d0" strokeWidth="8" opacity=".55" filter="url(#bpb-glow)" />
          <path ref={linia} d={sciezka} fill="none" stroke="url(#bpb-stroke)" strokeWidth="3" strokeLinecap="round" />
          <line ref={pion} x1="0" x2="0" y1="0" y2={h + 40} stroke="#fff" strokeOpacity=".35" strokeDasharray="2 5" />
          <circle ref={halo} r="16" fill="#a7f3d0" opacity=".25" />
          <circle ref={kropka} r="6" fill="#fff" stroke="#3ddc97" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

/* ---------- Kula „Rozmawiaj" w dużej karcie ---------- */
function KulaLink({ d, nazwa }: { d: DanePanelu; nazwa: string }) {
  if (!d.moznaRozmawiac) {
    return (
      <div className="kula czeka" aria-hidden>
        <span>{d.planZrobiony ? "Come back tomorrow" : "Out of minutes"}</span>
      </div>
    );
  }
  return (
    <Link href={d.linkRozmowy} className="kula" aria-label={`Talk to Bruno: ${nazwa} customer`}>
      <span>Talk</span>
    </Link>
  );
}

/* ---------- Strona ---------- */
export default function PanelB({ d }: { d: DanePanelu }) {
  const wyloguj = useWyloguj();
  const burza = useRef<BurzaApi>(null);
  const dzisIdx = d.dni7.length - 1;
  const [wybrany, setWybrany] = useState(dzisIdx);
  const [znika, setZnika] = useState(false);
  const [kolejnosc, setKolejnosc] = useState<PostacPodglad[]>(d.postacie);
  const [karta, setKarta] = useState(0);
  const glowna = kolejnosc[0];

  const pogoda = (i: number): Pogoda => {
    const v = d.dni7[i].wartosc;
    if (v >= d.dziennie) return "sun";
    if (v > 0) return "part";
    return d.dni7[i].dzis ? "cloud" : "storm";
  };

  const tekst = (i: number) => {
    const x = d.dni7[i];
    if (x.dzis) {
      return {
        pill: "Today's plan",
        h1: d.planZrobiony ? <>Today's plan<br />is done.</> : <>Today: {d.zostaloDzis} {rozmowy(d.zostaloDzis)}<br />{d.rozmowaMin} min each</>,
        p: `${d.dzis} of ${d.dziennie} ${rozmowy(d.dziennie)} done. ${d.powtorka ? `${d.powtorka}. ` : ""}You pick the call type, objection, goal, and customer type before you start.`,
      };
    }
    return {
      pill: "Calls in the last 7 days",
      h1: <>{x.nazwaPelna} {x.podpis}<br />{x.wartosc} {rozmowy(x.wartosc)}</>,
      p: x.wartosc === 0
        ? `No calls this day. Goal: ${d.dziennie} a day.`
        : `${x.wartosc} of ${d.dziennie} ${rozmowy(d.dziennie)}, ${x.minuty} min of practice.${x.srednia !== null ? ` Average score: ${x.srednia.toFixed(1)}/10.` : ""}`,
    };
  };
  const [pokazany, setPokazany] = useState(dzisIdx);
  const t = tekst(pokazany);

  const wybierz = (i: number) => {
    if (i === wybrany) return;
    setWybrany(i);
    setZnika(true);
    window.setTimeout(() => { setPokazany(i); setZnika(false); }, 260);
    if (pogoda(i) === "storm") burza.current?.uderz();
  };

  const zamien = (idx: number) => {
    setKolejnosc((k) => {
      const n = [...k];
      [n[0], n[idx]] = [n[idx], n[0]];
      return n;
    });
    setKarta((x) => x + 1);
  };

  // Klik w puste niebo = piorun (jak we wzorze).
  const klikNiebo = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest("button,a,.card,.col,.lead,.hdr,.side,.mnav")) return;
    burza.current?.uderz(e.clientX / window.innerWidth);
  };

  const powitanie = d.imie ? d.imie : "Bruno AI";

  return (
    <div className="bpb" onClick={klikNiebo}>
      <Burza ref={burza} />
      <div className="stage">
        <aside className="side">
          <Link href="/bruno/panel" className="logo" title="Bruno AI" aria-label="Bruno AI"><i /></Link>
          {LINKI.map((l) => (
            <Link key={l.href} href={l.href} className={`nav ${l.ikona === "panel" ? "on" : ""}`} aria-label={l.nazwa} title={l.nazwa} aria-current={l.ikona === "panel" ? "page" : undefined}>
              <Ikona nazwa={l.ikona} rozmiar={19} grubosc={1.8} />
            </Link>
          ))}
          <div className="grow" />
          <button type="button" className="nav" aria-label="Log out" title="Log out" onClick={wyloguj}><Ikona nazwa="wyjscie" rozmiar={19} grubosc={1.8} /></button>
        </aside>

        <header className="hdr">
          <div className="who"><small>Hi,</small><b>{powitanie}</b></div>
          <div className="sp" />
          {d.moznaRozmawiac && (
            <Link className="btn pri" href={d.linkRozmowy}>Talk to Bruno <Ikona nazwa="strzalka" rozmiar={16} grubosc={2.4} /></Link>
          )}
          <Link className="btn sec glass odb" href="/bruno/odblokuj">
            <Ikona nazwa="klodka" rozmiar={15} grubosc={2} />
            <span className="dlugi">Unlock full access</span>
            <span className="krotki">Unlock</span>
          </Link>
          <button type="button" className="ib glass" aria-label="Log out" title="Log out" onClick={wyloguj}><Ikona nazwa="wyjscie" rozmiar={18} grubosc={2} /></button>
          <span className="av" aria-hidden>{d.inicjal}</span>
        </header>

        <nav className="mnav" aria-label="Main menu">
          {LINKI.map((l) => (
            <Link key={l.href} href={l.href} className={`glass ${l.ikona === "panel" ? "on" : ""}`} aria-current={l.ikona === "panel" ? "page" : undefined}>{l.nazwa}</Link>
          ))}
        </nav>

        {d.wygasl ? (
          <section className="lead">
            <span className="pill glass"><i />Trial</span>
            <h1>Your trial<br />has ended</h1>
            <p>Your {d.dni}-day trial is over. Want to keep practicing with Bruno? Get in touch.</p>
            <div className="acts"><Link className="btn pri" href="/bruno/odblokuj">Unlock full access <Ikona nazwa="strzalka" rozmiar={16} grubosc={2.4} /></Link></div>
          </section>
        ) : (
          <>
            <section className="lead">
              <span className="pill glass"><i /><span className={`swap ${znika ? "out" : ""}`}>{t.pill}</span></span>
              <h1 className={`swap ${znika ? "out" : ""}`}>{t.h1}</h1>
              <p className={`swap ${znika ? "out" : ""}`}>{t.p}</p>
              <div className="rings">
                <div className="chip glass">
                  <b><Licz do={d.dniZostalo} /></b>
                  <span>{d.dniZostalo === 1 ? "day of access" : "days of access"}<small>{d.koniec ? `until ${d.koniec}` : `of ${d.dni}, from your first login`}</small></span>
                </div>
                <div className="chip glass">
                  <b>{d.dzis}/{d.dziennie}</b>
                  <span>calls today<small>{d.planZrobiony ? "today's plan done" : `${d.zostaloDzis} left, ${d.rozmowaMin} min each`}</small></span>
                </div>
              </div>
              {!d.skonfigurowany && (
                <p className="uwaga glass">Bruno doesn't know what you sell yet. <Link href="/bruno/dostosuj">Customize Bruno</Link> (2 minutes), or he'll play a generic customer.</p>
              )}
            </section>

            <section className="days" aria-label="Calls in the last 7 days">
              <div className="cols scores">
                {d.dni7.map((x, i) => (
                  <button type="button" key={x.podpis} className={`col ${wybrany === i ? "on" : ""}`} onClick={() => wybierz(i)} aria-label={`${x.nazwaPelna} ${x.podpis}: ${x.wartosc} ${rozmowy(x.wartosc)}`}>
                    <span><Licz do={x.wartosc} opoznienie={300 + i * 90} czas={1200} /></span>
                    <Pog p={pogoda(i)} />
                  </button>
                ))}
              </div>
              <Krzywa wartosci={d.dni7.map((x) => x.wartosc)} cel={d.dziennie} wybrany={wybrany} />
              <div className="cols labels">
                {d.dni7.map((x, i) => (
                  <button type="button" key={x.podpis} className={`col ${wybrany === i ? "on" : ""}`} onClick={() => wybierz(i)} tabIndex={-1} aria-hidden>
                    <span className="full">{x.dzis ? "Today" : x.nazwaPelna}</span>
                    <span className="short">{x.dzis ? "today" : x.etykieta}</span>
                  </button>
                ))}
              </div>
            </section>

            <aside className="right">
              <article className="card glass main" key={`m${karta}`}>
                <div className="tag">
                  <span className="kropka" style={{ background: glowna.kolor }} />
                  <span>{glowna.nazwa} customer</span>
                  {glowna.id === d.postac && <em>Your type</em>}
                </div>
                <div className="num">
                  {glowna.srednia !== null ? <Licz do={glowna.srednia} dec={1} /> : "–"}
                  <small>score</small>
                </div>
                <div className="desc">{glowna.opis}</div>
                <KulaLink d={d} nazwa={glowna.nazwa.toLowerCase()} />
                <div className="stats">
                  <div><Ikona nazwa="test" rozmiar={15} grubosc={2} />{glowna.rozmow} {rozmowy(glowna.rozmow)}</div>
                  <div><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>{d.rozmowaMin} min</div>
                  <div className="krotko">{glowna.krotko}</div>
                </div>
              </article>
              {kolejnosc.slice(1).map((p, i) => (
                <button type="button" key={p.id} className="card glass mini" onClick={() => zamien(i + 1)} aria-label={`Show ${p.nazwa} customer`}>
                  <small>Customer type</small>
                  <b><span className="kropka" style={{ background: p.kolor }} />{p.nazwa} customer</b>
                  <em>{p.krotko}{p.id === d.postac ? ", your type" : ""}</em>
                  <div className="sc">
                    <span>{p.srednia !== null ? p.srednia.toFixed(1) : "–"}</span>
                    <Pog p={p.srednia === null ? "cloud" : p.srednia >= 7 ? "sun" : p.srednia >= 5 ? "part" : "storm"} />
                  </div>
                </button>
              ))}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
