"use client";

import Link from "next/link";
import type { DanePanelu } from "./dane";
import Licz from "./licz";
import { Ikona, linkiDla, rozmowy, useWyloguj } from "./wspolne";
import "./panel-o.css";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 27.10 (USER_001: wzór OpsPulse / Orbix Studio z galerii): wersja O panelu Bruno.
// Mrożone szkło na rozmytym tle (szarość + żółta plama), pigułki z ikonami u góry, „Witaj z powrotem”,
// rząd pigułek-akcji + żółty przycisk, „Pierwsze kroki” z paskiem i listą, „Puls umiejętności” z łukiem w 3 kolorach
// i tabelką, 4 KPI z włoskami, pasek segmentowy planu 30 dni, tabela ostatnich rozmów. Bez ocen = przykład.

const pl = (v: number, dec = 1) => v.toFixed(dec).replace(".", ",");

function Wloski({ dane, prog, kolor = "#2fa04a", zle = "#e5484d", nis = "#d8d8dc", h = 42 }: { dane: number[]; prog: number; kolor?: string; zle?: string; nis?: string; h?: number }) {
  const max = Math.max(...dane, 1);
  return (
    <svg viewBox={`0 0 ${dane.length * 7} ${h}`} preserveAspectRatio="none" className="wl" aria-hidden>
      {dane.map((v, i) => <line key={i} x1={i * 7 + 3} x2={i * 7 + 3} y1={h} y2={h - Math.max(3, (v / max) * (h - 4))} stroke={v === 0 ? nis : v < prog ? zle : v >= prog * 1.3 ? kolor : nis} strokeWidth="2.2" strokeLinecap="round" />)}
    </svg>
  );
}

export default function PanelO({ d }: { d: DanePanelu }) {
  const { t, jezyk } = useT();
  const wyloguj = useWyloguj();
  const linki = linkiDla({ ogien: true, statystyki: true, szef: true }, jezyk);
  const przyklad = d.ocenionych === 0;
  const sred = d.srednia?.ocena ?? (przyklad ? 6.8 : 0);
  const kryteria = d.ostatnia?.kryteria ?? [{ nazwa: t("Opening", "Otwarcie"), ocena: 7 }, { nazwa: t("Questions", "Pytania"), ocena: 6 }, { nazwa: t("Objections", "Obiekcje"), ocena: 5 }, { nazwa: t("Closing", "Zamknięcie"), ocena: 6 }, { nazwa: t("Confidence", "Mentalność"), ocena: 8 }];
  const r7 = przyklad ? 12 : d.dni7.reduce((a, x) => a + x.wartosc, 0);
  const min7 = przyklad ? 36 : d.min7;
  const seria14 = (f: (i: number) => number) => Array.from({ length: 28 }, (_, i) => f(i));
  const kroki = [
    { ok: true, n: t("Create your account", "Załóż konto") },
    { ok: d.skonfigurowany, n: t("Tell Bruno what you sell", "Powiedz Bruno, co sprzedajesz") },
    { ok: d.ocenionych > 0 || przyklad, n: t("Do your first live call", "Zrób pierwszą rozmowę") },
    { ok: false, n: t("Set up your daily plan", "Ustaw plan dnia") },
  ];
  const procKrok = Math.round((kroki.filter((k) => k.ok).length / kroki.length) * 100);
  const procSred = Math.round(sred * 10);
  // łuk 3 kolorów: 3 najważniejsze kryteria jako segmenty (pomarańcz / zieleń / niebieski)
  const seg = [{ k: kryteria[0], c: "#f0803c" }, { k: kryteria[2], c: "#2fa04a" }, { k: kryteria[3], c: "#3b82f6" }];
  const R = 86, C = Math.PI * R;
  // plan 30 dni: zrobione / dziś / zostało
  const cel30 = d.dziennie * 30, zrob30 = przyklad ? 11 : Math.min(cel30, r7 * 4), dzis30 = d.dzis, zost30 = Math.max(0, cel30 - zrob30 - dzis30);
  const p = (v: number) => Math.round((v / (cel30 || 1)) * 100);
  const ost = przyklad
    ? [{ kto: t("Red customer", "Klient czerwony"), kiedy: t("2 min ago", "2 min temu"), czas: "3:00", st: "ok" }, { kto: t("Yellow customer", "Klient żółty"), kiedy: t("1 h ago", "1 godz. temu"), czas: "2:41", st: "ok" }, { kto: t("Green customer", "Klient zielony"), kiedy: t("Yesterday", "wczoraj"), czas: "0:48", st: "x" }, { kto: t("Blue customer", "Klient niebieski"), kiedy: t("Yesterday", "wczoraj"), czas: "3:00", st: "ok" }]
    : d.postacie.filter((x) => x.rozmow).slice(0, 4).map((x) => ({ kto: t(`${x.nazwa} customer`, `Klient ${x.nazwa.toLowerCase()}`), kiedy: `${x.rozmow} ${rozmowy(x.rozmow, jezyk)}`, czas: x.srednia !== null ? pl(x.srednia) : "–", st: (x.srednia ?? 0) >= 6 ? "ok" : "x" }));

  return (
    <div className="bpo">
      <div className="tlo" aria-hidden><i className="p1" /><i className="p2" /><i className="p3" /></div>
      <div className="rama">
        <header className="gora">
          <span className="logo">✺ Bruno AI</span>
          <nav>
            {linki.map((l) => (
              <Link key={l.href} href={l.href} className={l.ikona === "panel" ? "on" : ""} aria-label={l.nazwa} title={l.nazwa}><Ikona nazwa={l.ikona} rozmiar={15} grubosc={1.9} />{l.ikona === "panel" && <span>{l.nazwa}</span>}</Link>
            ))}
            <button type="button" onClick={wyloguj} aria-label={t("Log out", "Wyloguj")}><Ikona nazwa="wyjscie" rozmiar={15} grubosc={1.9} /></button>
          </nav>
          <div className="ik">
            <button type="button" aria-label={t("Search", "Szukaj")}>⌕</button>
            <button type="button" aria-label={t("Theme", "Motyw")}>☼</button>
            <span className="jez">🌐 {jezyk === "pl" ? "Polski" : "English"}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bruno/demo/jakub.jpg" alt="" />
          </div>
        </header>

        <div className="witaj">
          <div>
            <h1>{t(`Welcome back, ${d.imie ?? "Jakub"}`, `Witaj z powrotem, ${d.imie ?? "Jakub"}`)}</h1>
            <p>{t("Your training room: calls, scores and drills.", "Twoje centrum treningu: rozmowy, oceny i fiszki.")}</p>
          </div>
          <div className="akcje">
            <Link href="/bruno/rozmowa" className="pig"><Ikona nazwa="test" rozmiar={14} grubosc={2} />{t("New call", "Nowa rozmowa")}</Link>
            <Link href="/bruno/trening" className="pig"><Ikona nazwa="trening" rozmiar={14} grubosc={2} />{t("Drills", "Trening")}</Link>
            <Link href="/bruno/feedback" className="pig"><Ikona nazwa="feedback" rozmiar={14} grubosc={2} />{t("Review feedback", "Feedback")}</Link>
            <Link href="/bruno/szef" className="pig"><Ikona nazwa="zespol" rozmiar={14} grubosc={2} />{t("View team", "Zespół")}</Link>
            <Link href={d.linkRozmowy} className="pig zol"><Ikona nazwa="mikrofon" rozmiar={14} grubosc={2} />{t("Talk to Bruno", "Rozmawiaj z Bruno")}</Link>
          </div>
        </div>

        <div className="siatka">
          <section className="szklo kroki">
            <h3>{t("Getting started", "Pierwsze kroki")}</h3>
            <p>{t("What's left before Bruno sounds exactly like your customer.", "Co zostało, zanim Bruno zabrzmi dokładnie jak Twój klient.")}</p>
            <div className="pasek"><i style={{ width: `${procKrok}%` }} /><b>{procKrok}%</b></div>
            <ul>{kroki.map((k) => <li key={k.n} className={k.ok ? "ok" : ""}><i /><span>{k.n}</span></li>)}</ul>
          </section>

          <div className="srodek" aria-hidden />

          <section className="szklo puls">
            <div className="hd"><h3>{t("Skills pulse", "Puls umiejętności")}{przyklad && <small className="przyk">{t("sample", "przykład")}</small>}</h3><button type="button" aria-label="more">···</button></div>
            <div className="luk">
              <svg viewBox="0 0 220 120" aria-hidden>
                {seg.map((s, i) => { const start = (i / 3) * C + 7, len = C / 3 - 14; return <path key={i} d={`M24,110 A${R},${R} 0 0 1 196,110`} fill="none" stroke={s.c} strokeOpacity={0.45 + 0.55 * (s.k.ocena / 10)} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${len} ${C}`} strokeDashoffset={-start} />; })}
              </svg>
              <div className="luk-et"><small>{t("Average score", "Średnia ocena")}</small><b><Licz do={procSred} po="%" /></b></div>
            </div>
            <table>
              <tbody>
                {kryteria.slice(0, 3).map((k) => <tr key={k.nazwa}><td>{k.nazwa} ({k.ocena}/10)</td><td><span className={`st ${k.ocena >= 7 ? "ok" : k.ocena >= 6 ? "" : "x"}`}>{k.ocena >= 7 ? t("Strong", "Mocne") : k.ocena >= 6 ? t("OK", "OK") : t("1 to fix", "Do pracy")}</span></td></tr>)}
              </tbody>
            </table>
          </section>
        </div>

        <div className="kpi">
          {[
            { n: t("Calls", "Rozmowy"), v: String(r7), z: "+18%", ok: true, s: t("Compare from last 7 days", "vs poprzednie 7 dni"), dane: seria14((i) => [2, 3, 1, 4, 3, 5, 2, 3, 4, 2, 5, 3, 4, 6][i % 14]), prog: 3 },
            { n: t("Minutes", "Minuty"), v: String(min7), z: "+15%", ok: true, s: t("Compare from last 7 days", "vs poprzednie 7 dni"), dane: seria14((i) => Math.round(6 + 6 * Math.abs(Math.sin(i * 0.4)))), prog: 8 },
            { n: t("Average score", "Średnia ocena"), v: pl(sred), z: "+2,4%", ok: true, s: t("Compare from last month", "vs poprzedni miesiąc"), dane: seria14((i) => [5, 6, 5, 7, 6, 7, 8, 6, 7, 5, 8, 7, 6, 8][i % 14]), prog: 6 },
            { n: t("Closing", "Zamknięcie"), v: `${kryteria[3].ocena}/10`, z: "-12%", ok: false, s: t("Compare from last month", "vs poprzedni miesiąc"), dane: seria14((i) => [6, 5, 6, 7, 5, 4, 6, 5, 7, 6, 5, 4, 5, 6][i % 14]), prog: 6 },
          ].map((k) => (
            <section className="szklo k" key={k.n}>
              <div className="hd"><small>{k.n}</small><button type="button" aria-label="more">···</button></div>
              <div className="w"><b>{k.v}</b><span className={`st ${k.ok ? "ok" : "x"}`}>{k.ok ? "↗" : "↘"} {k.z}</span></div>
              <small className="s">{k.s}</small>
              <Wloski dane={k.dane} prog={k.prog} />
            </section>
          ))}
        </div>

        <div className="dol">
          <section className="szklo plan">
            <small>{t("30-day plan", "Plan na 30 dni")}</small>
            <b className="duza">{cel30} <span>{rozmowy(cel30, jezyk)}</span></b>
            <div className="w"><span className="st ok">↗ {p(zrob30)}%</span><small>{t("Done so far, this month", "Zrobione do dziś w tym miesiącu")}</small></div>
            <div className="segm-et"><span style={{ width: `${p(zrob30)}%` }}>{p(zrob30)}%</span><span style={{ width: `${Math.max(8, p(dzis30))}%` }}>{p(dzis30)}%</span><span>{p(zost30)}%</span></div>
            <div className="segm">
              <i className="nieb" style={{ width: `${p(zrob30)}%` }} />
              <i className="pom" style={{ width: `${Math.max(2, p(dzis30))}%` }} />
              <div className="ziel" style={{ width: `${p(zost30)}%` }}>{Array.from({ length: Math.max(1, Math.round(p(zost30) / 9)) }, (_, i) => <b key={i} />)}</div>
            </div>
            <div className="leg"><span><i className="nieb" />{t("Done", "Zrobione")}</span><span><i className="pom" />{t("Today", "Dziś")}</span><span><i className="ziel" />{t("Left", "Zostało")}</span></div>
            <div className="pewn"><span>⚠ {t("Streak:", "Seria:")}</span><b>{przyklad ? 4 : d.dni7.filter((x) => x.wartosc).length} {t("days", "dni")}</b><small>{t("vs last month", "vs poprzedni miesiąc")}</small></div>
          </section>

          <section className="szklo strum">
            <div className="hd"><h3><i className="kropa" />{t("Recent calls", "Ostatnie rozmowy")}</h3><span className="ost">{t("Last 50", "Ostatnie 50")}</span></div>
            <table>
              <thead><tr><th>{t("Customer", "Klient")}</th><th>{t("Time", "Kiedy")}</th><th>{t("Length", "Czas")}</th><th>{t("Status", "Status")}</th></tr></thead>
              <tbody>{ost.map((o, i) => <tr key={i}><td>{o.kto}</td><td>{o.kiedy}</td><td>{o.czas}</td><td><span className={`st ${o.st === "ok" ? "ok" : "x"}`}>{o.st === "ok" ? t("Scored", "Oceniona") : t("Dropped", "Przerwana")}</span></td></tr>)}</tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
