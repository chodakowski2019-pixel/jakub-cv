"use client";

import Link from "next/link";
import { useState } from "react";
import type { DanePanelu } from "./dane";
import Licz from "./licz";
import { Ikona, useWyloguj } from "./wspolne";
import "./panel-w.css";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 27.10 (USER_001: wzór VogueAI / Taqwah z galerii, „w białych kolorach”): wersja W panelu Bruno.
// Biel, pigułki nawigacji u góry, „Przegląd” + awatary zespołu + przyciski, karta z 2 krzywymi i linijką,
// 2 karty z cienkimi słupkami-włoskami i polem pod linią, po prawej lawendowy panel z półokrągłym wskaźnikiem.

const ZESPOL = ["marta", "ola", "natalia", "julia", "kasia"];
function wygladz(pts: [number, number][]) {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2; s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`; }
  return s;
}
const pl = (v: number, dec = 1) => v.toFixed(dec).replace(".", ",");

/** Słupki-włoski: wiele cienkich pionowych linii (jak w wzorze), wysokość wg wartości. */
function Wloski({ dane, max, kolor = "#a78bfa", gest = 6, h = 120 }: { dane: number[]; max: number; kolor?: string; gest?: number; h?: number }) {
  const W = dane.length * gest * 6;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" className="wloski" aria-hidden>
      {dane.map((v, i) => Array.from({ length: gest }, (_, k) => {
        const x = i * gest * 6 + k * 6 + 3;
        const hh = Math.max(2, (v / max) * (h - 6));
        return <line key={`${i}-${k}`} x1={x} x2={x} y1={h} y2={h - hh} stroke={kolor} strokeWidth="1.4" strokeOpacity={0.35 + 0.65 * (k / gest)} />;
      }))}
    </svg>
  );
}

export default function PanelW({ d }: { d: DanePanelu }) {
  const { t, jezyk } = useT();
  const wyloguj = useWyloguj();
  const [hover, setHover] = useState<number | null>(null);
  const przyklad = d.ocenionych === 0;
  const teraz = przyklad ? [2, 3, 1, 4, 3, 5, 2] : d.dni7.map((x) => x.wartosc);
  const przed = przyklad ? [1, 2, 2, 1, 3, 2, 1] : d.dniPoprzednie;
  const sumaT = teraz.reduce((a, b) => a + b, 0), sumaP = przed.reduce((a, b) => a + b, 0);
  const oceny = przyklad ? [5.5, 6.1, 5.9, 6.8, 6.4, 7.1, 7.4] : d.dni7.map((x) => x.srednia ?? 0);
  const kryteria = d.ostatnia?.kryteria ?? [{ nazwa: t("Opening", "Otwarcie"), ocena: 7 }, { nazwa: t("Questions", "Pytania"), ocena: 6 }, { nazwa: t("Objections", "Obiekcje"), ocena: 5 }, { nazwa: t("Closing", "Zamknięcie"), ocena: 6 }, { nazwa: t("Confidence", "Mentalność"), ocena: 8 }];
  const sred = d.srednia?.ocena ?? (przyklad ? 6.8 : 0);
  const cel = d.dziennie * 7;
  const proc = Math.min(100, Math.round((sumaT / (cel || 1)) * 100));
  const nav = [
    { href: "/bruno/panel", n: t("Dashboard", "Panel"), on: true }, { href: "/bruno/rozmowa", n: t("Live call", "Test") }, { href: "/bruno/trening", n: t("Drills", "Trening") },
    { href: "/bruno/feedback", n: t("Feedback", "Feedback") }, { href: "/bruno/statystyki", n: t("Stats", "Statystyki") }, { href: "/bruno/kalendarz", n: t("Calendar", "Kalendarz") }, { href: "/bruno/szef", n: t("Team", "Zespół") },
  ];
  // dwie krzywe S kończące się kropką (Order Tracker)
  const S = (xEnd: number, yTop: number) => `M20,150 C${xEnd * 0.45},150 ${xEnd * 0.55},${yTop} ${xEnd},${yTop}`;
  const dzis = d.dni7[6]?.etykieta ?? "";
  const dataZakres = new Date(Date.now() - 6 * 86_400_000).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric" }) + "-" + new Date().toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short", year: "numeric" });
  const h = hover ?? 6;

  return (
    <div className="bpw">
      <header className="nav">
        <span className="logo">✳</span>
        <nav>{nav.map((x) => <Link key={x.href} href={x.href} className={x.on ? "on" : ""}>{x.n}</Link>)}</nav>
        <div className="ik">
          <button type="button" aria-label={t("Notifications", "Powiadomienia")}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></svg></button>
          <button type="button" aria-label={t("Messages", "Wiadomości")}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 5h16v11H8l-4 4z" /></svg></button>
          <button type="button" className="lila" onClick={wyloguj} aria-label={t("Log out", "Wyloguj")}>✳</button>
        </div>
      </header>

      <main>
        <div className="gora">
          <h1>{t("Overview", "Przegląd")}</h1>
          <div className="dostep">
            <small>{t("Team", "Zespół")}</small>
            <div className="aw">{ZESPOL.map((z) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={z} src={`/bruno/demo/${z}.jpg`} alt="" />)}</div>
          </div>
          <div className="sp" />
          <div className="akcje">
            <button type="button" aria-label={t("Search", "Szukaj")}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg></button>
            <button type="button" aria-label={t("Filter", "Filtr")}>▽</button>
            <button type="button" className="szer">▦ {dataZakres} ⌄</button>
            <Link href="/bruno/statystyki" className="szer">⚑ {t("Create report", "Raport")}</Link>
            <Link href={d.linkRozmowy} className="szer">+ {t("Talk to Bruno", "Rozmawiaj")}</Link>
          </div>
        </div>

        <div className="kol">
          <div className="lewa">
            <section className="karta sled">
              <div className="hd"><h2>{t("Calls tracker", "Rozmowy")}{przyklad && <small className="przyk">{t("sample", "przykład")}</small>}</h2><div className="ikk"><button type="button" aria-label="share">⇪</button><button type="button" aria-label="calendar">▦</button><button type="button" aria-label="settings">⚙</button></div></div>
              <div className="leg"><span><i style={{ background: "#b39cf9" }} />{t("Last week", "Poprzedni tydzień")}</span><span><i style={{ background: "#7c6cf0" }} />{t("This week", "Ten tydzień")}</span></div>
              <div className="krzywe">
                <svg viewBox="0 0 720 170" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <linearGradient id="bpw-a" x1="0" x2="1"><stop offset="0" stopColor="#b39cf9" stopOpacity=".1" /><stop offset="1" stopColor="#b39cf9" /></linearGradient>
                    <linearGradient id="bpw-b" x1="0" x2="1"><stop offset="0" stopColor="#7c6cf0" stopOpacity=".1" /><stop offset="1" stopColor="#7c6cf0" /></linearGradient>
                  </defs>
                  <path d={S(330, 40)} fill="none" stroke="url(#bpw-a)" strokeWidth="2.5" />
                  <circle cx="330" cy="40" r="5" fill="#b39cf9" />
                  <path d={S(600, 40)} fill="none" stroke="url(#bpw-b)" strokeWidth="2.5" />
                  <circle cx="600" cy="40" r="5" fill="#7c6cf0" />
                </svg>
                <div className="et" style={{ left: "47%" }}><small>{t("Last week", "Poprzedni tydzień")}</small><b>{sumaP}</b></div>
                <div className="et" style={{ left: "85%" }}><small>{t("This week", "Ten tydzień")}</small><b>{sumaT}</b></div>
              </div>
              <div className="linijka" aria-hidden>{Array.from({ length: 120 }, (_, i) => <i key={i} className={i % 10 === 0 ? "d" : ""} />)}</div>
              <div className="skala">{[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 35].map((v) => <span key={v}>{v}</span>)}</div>
            </section>

            <div className="dwie">
              <section className="karta prod">
                <div className="hd"><h2>{t("Criteria", "Kryteria")}</h2><div className="ikk"><button type="button" aria-label="filter">▽</button><button type="button" aria-label="settings">⚙</button></div></div>
                <div className="prod-wrap">
                  <div className="osy">{[10, 8, 6, 4, 2, 0].map((v) => <span key={v}>{v}</span>)}</div>
                  <div className="wl">
                    <Wloski dane={kryteria.map((k) => k.ocena)} max={10} gest={10} h={150} />
                    <div className="pod">{kryteria.map((k) => <span key={k.nazwa}>{k.nazwa}</span>)}</div>
                  </div>
                  <div className="bok">
                    <small>{t("Average score", "Średnia ocena")}</small>
                    <b><Licz do={sred} dec={1} /></b>
                    <em className="z">↗ {t("growing", "rośnie")}</em>
                    <div className="mini"><i className="z">↗</i><small>{t("Last call", "Ostatnia")}</small><b>{d.ostatnia ? pl(d.ostatnia.ocena) : "7,4"}</b></div>
                    <div className="mini"><i className="c">↘</i><small>{t("Weakest", "Najsłabsze")}</small><b>{kryteria.reduce((a, b) => (b.ocena < a.ocena ? b : a), kryteria[0]).nazwa}</b></div>
                  </div>
                </div>
              </section>

              <section className="karta cel">
                <div className="hd"><h2>{t("Weekly goal", "Cel tygodnia")}</h2><button type="button" className="kropki" aria-label="more">···</button></div>
                <small>{t("This week", "W tym tygodniu")}</small>
                <b className="duza">{sumaT} <span>/ {cel} {t("calls", "rozmów")}</span></b>
                <div className="cel-wrap">
                  <div className="osy">{[8, 6, 4, 2, 0].map((v) => <span key={v}>{v}</span>)}</div>
                  <svg viewBox="0 0 300 120" preserveAspectRatio="none" onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(6, Math.round(((e.clientX - r.left) / r.width) * 6)))); }} onPointerLeave={() => setHover(null)} role="img" aria-label={t("Calls per day", "Rozmowy na dzień")}>
                    <defs><linearGradient id="bpw-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a78bfa" stopOpacity=".45" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></linearGradient></defs>
                    {(() => { const max = Math.max(...teraz, d.dziennie, 1); const pts = teraz.map((v, i) => [10 + i * (280 / 6), 110 - (v / max) * 95] as [number, number]); return (<>
                      <path d={`${wygladz(pts)} L290,120 L10,120 Z`} fill="url(#bpw-c)" />
                      <path d={wygladz(pts)} fill="none" stroke="#a78bfa" strokeWidth="2" />
                      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#fff" stroke="#a78bfa" strokeWidth="2" />)}
                      <g transform={`translate(${Math.min(268, Math.max(32, pts[h][0]))},${pts[h][1] - 14})`}><rect x="-22" y="-16" width="44" height="16" rx="4" fill="#c4b5fd" /><text x="0" y="-4.5" textAnchor="middle" fontSize="9" fill="#2a1f5e" fontWeight="600">{teraz[h]} {t("calls", "rozm.")}</text></g>
                    </>); })()}
                  </svg>
                </div>
                <div className="pod">{d.dni7.map((x) => <span key={x.podpis} className={x.dzis ? "on" : ""}>{x.etykieta}</span>)}</div>
              </section>
            </div>
          </div>

          <aside className="lila-panel">
            <div className="hd"><h2>{t("Track your", "Śledź swój")}<br />{t("today's progress", "dzisiejszy postęp")}</h2><button type="button" aria-label="settings">⚙</button></div>
            <p>{t("Live numbers from today's calls, drills and feedback.", "Liczby na żywo z dzisiejszych rozmów, treningu i feedbacku.")}</p>
            <div className="wsk">
              <svg viewBox="0 0 300 170" aria-hidden>
                <path d="M30,160 A120,120 0 0 1 270,160" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeDasharray="2 5" />
                <path d="M30,160 A120,120 0 0 1 270,160" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray={`${Math.PI * 120 * (proc / 100)} ${Math.PI * 120}`} />
                {(() => { const a = Math.PI * (1 - proc / 100); const x = 150 + Math.cos(a) * 120, y = 160 - Math.sin(a) * 120; return <><line x1={x} y1={y} x2={x} y2={160} stroke="#fff" strokeWidth="1.5" /><circle cx={x} cy={y} r="5" fill="#fff" /></>; })()}
              </svg>
              <div className="wsk-et"><b>{proc}%</b><small>{t("of weekly goal", "celu tygodnia")}</small></div>
            </div>
            <div className="trzy">
              <div><small>{t("Calls today", "Rozmowy dziś")}</small><b>{d.dzis}/{d.dziennie}</b></div>
              <div><small>{t("Minutes today", "Minuty dziś")}</small><b>{d.minDzis}</b></div>
              <div><small>{t("Days left", "Dni dostępu")}</small><b>{d.dniZostalo}</b></div>
            </div>
            <div className="wzrost">
              <small>{t("Score, last 7 days", "Ocena, 7 dni")}</small>
              <div className="osy-b">{[10, 8, 6, 4, 2, 0].map((v) => <span key={v}>{v}</span>)}</div>
              <Wloski dane={oceny} max={10} kolor="#ffffff" gest={7} h={110} />
              <div className="pod">{d.dni7.map((x) => <span key={x.podpis}>{x.etykieta}</span>)}</div>
              <b className="proc">↑ {Math.round(((oceny[6] - oceny[0]) / (oceny[0] || 1)) * 100)}%</b>
            </div>
            <Link href={d.linkRozmowy} className="btn">{t("Talk to Bruno", "Rozmawiaj")} <Ikona nazwa="strzalka" rozmiar={14} grubosc={2.2} /></Link>
            <span className="dzis-et">{dzis}</span>
          </aside>
        </div>
      </main>
    </div>
  );
}
