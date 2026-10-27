"use client";

import Link from "next/link";
import { useState } from "react";
import type { DanePanelu } from "./dane";
import Licz from "./licz";
import { useWyloguj } from "./wspolne";
import "./panel-r.css";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 27.10 (USER_001: wzór Rinesk call-centre / Anastasiia z galerii, „na biało, bo ten ma dziwny kolor”): wersja R.
// Panel SZEFA zespołu: pigułki nawigacji, duża jasna karta (lider + „Dodaj handlowca”, „Cześć, Jakub! 👋”, wielka liczba,
// legenda, słupki-włoski z żółtą krzywą i dymkiem), rząd zakładek, 4 karty (tabela handlowców, półokrągły wskaźnik,
// słupki w czasie, prognoza). Akcent = żółto-limonkowy. Dane zespołu = demo (Bruno Demo).

const ZESPOL = [
  { imie: "Marta", foto: "/bruno/demo/marta.jpg", zespol: "A", ocena: 7.8, rozmow: 11 },
  { imie: "Ola", foto: "/bruno/demo/ola.jpg", zespol: "A", ocena: 5.9, rozmow: 9 },
  { imie: "Natalia", foto: "/bruno/demo/natalia.jpg", zespol: "B", ocena: 5.7, rozmow: 8 },
  { imie: "Julia", foto: "/bruno/demo/julia.jpg", zespol: "B", ocena: 5.6, rozmow: 7 },
  { imie: "Kasia", foto: "/bruno/demo/kasia.jpg", zespol: "B", ocena: 4.5, rozmow: 6 },
];
function wygladz(pts: [number, number][]) {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2; s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`; }
  return s;
}
const pl = (v: number, dec = 1) => v.toFixed(dec).replace(".", ",");
/** 30 wartości (dni) z lekkim falowaniem, deterministycznie. */
const dni30 = Array.from({ length: 30 }, (_, i) => 40 + Math.round(30 * Math.abs(Math.sin(i * 0.6)) + 20 * Math.abs(Math.cos(i * 1.3))));

export default function PanelR({ d }: { d: DanePanelu }) {
  const { t, jezyk } = useT();
  const wyloguj = useWyloguj();
  const [hover, setHover] = useState<number | null>(19);
  const razem = ZESPOL.reduce((a, z) => a + z.rozmow, 0) * 7;
  const sred = ZESPOL.reduce((a, z) => a + z.ocena, 0) / ZESPOL.length;
  const procSred = Math.round(sred * 10);
  const nav = [t("Home", "Start"), t("Statistics", "Statystyki"), t("Reps", "Handlowcy"), t("Groups", "Grupy"), t("Scores", "Oceny"), t("Drills", "Trening"), t("Contacts", "Kontakty")];
  const zak = [t("Calls", "Rozmowy"), t("Overview", "Przegląd"), t("Moments", "Momenty"), t("Keywords", "Słowa kluczowe"), t("Missed", "Bez oceny"), t("Level", "Poziom"), t("Scores", "Oceny"), t("Duration", "Czas"), t("Transcripts", "Transkrypcje"), t("Rep status", "Status")];
  const W = 600, H = 150;
  const max = Math.max(...dni30);
  const X = (i: number) => 6 + i * ((W - 12) / 29);
  const krzywa = dni30.map((v, i) => [X(i), 120 - (v / max) * 70] as [number, number]);
  const h = hover ?? 29;
  const data = (i: number) => new Date(Date.now() - (29 - i) * 86_400_000).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "long", year: "numeric" });
  const miesiac = new Date().toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { month: "long", year: "numeric" });
  const sredniaCzas = Array.from({ length: 30 }, (_, i) => 50 + Math.round(45 * Math.abs(Math.sin(i * 0.5 + 1))));

  return (
    <div className="bpr">
      <header className="nav">
        <span className="logo"><i /> Bruno AI</span>
        <nav>{nav.map((n, i) => <Link key={n} href={i === 0 ? "/bruno/panel" : i === 2 ? "/bruno/szef" : "/bruno/statystyki"} className={i === 1 ? "on" : ""}>{n}</Link>)}</nav>
        <div className="ik"><button type="button" aria-label="settings">⚙</button><button type="button" aria-label="bell">◐</button>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/bruno/demo/jakub.jpg" alt="" onClick={wyloguj} /></div>
      </header>

      <main>
        <section className="hero">
          <div className="lider">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bruno/demo/jakub.jpg" alt="" />
            <div><small>{t("Team lead", "Lider zespołu")}</small><b>{d.imie ?? "Jakub"}</b></div>
            <Link href="/bruno/szef" className="btn">{t("Add teammate", "Dodaj handlowca")}</Link>
            <button type="button" className="okr" aria-label={t("Search", "Szukaj")}>⌕</button>
          </div>
          <div className="hej">
            <h1>{t(`Hey, ${d.imie ?? "Jakub"}!`, `Cześć, ${d.imie ?? "Jakub"}!`)} 👋</h1>
            <p>{t("Explore your team's call history", "Zobacz historię rozmów zespołu")}</p>
          </div>
          <button type="button" className="okr duzy" aria-label={t("Refresh", "Odśwież")}>⟲</button>

          <div className="bok">
            <div className="ikonki">{["☏", "☆", "◎", "✧", "⟲"].map((x) => <span key={x}>{x}</span>)}</div>
            <div className="opis">
              <h2>{t("All calls", "Wszystkie rozmowy")}</h2>
              <p>{t("Everything that's happening on your team's training calls with Bruno.", "Wszystko, co dzieje się w rozmowach treningowych zespołu z Bruno.")} <b>{t("Need help?", "Potrzebujesz pomocy?")}</b></p>
              <div className="wielka"><Licz do={razem} /></div>
              <div className="leg">
                <span><i className="zol" />{t("Bruno prediction", "Prognoza Bruno")}<b>{Math.round(razem * 1.08)}</b></span>
                <span><i className="bia" />{t("Scored", "Ocenione")}<b>{Math.round(razem * 0.8)}</b></span>
                <span><i className="sza" />{t("Not scored", "Bez oceny")}<b>{Math.round(razem * 0.2)}</b></span>
              </div>
            </div>
          </div>

          <div className="wyk">
            <div className="tyg"><span>{miesiac}</span>{["W1", "W2", "W3", "W4", "W5"].map((w) => <span key={w}>{w}</span>)}</div>
            <div className="wyk-wrap">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(29, Math.round((((e.clientX - r.left) / r.width) * W - 6) / ((W - 12) / 29))))); }} onPointerLeave={() => setHover(19)} role="img" aria-label={t("Calls per day, 30 days", "Rozmowy na dzień, 30 dni")}>
                <defs><linearGradient id="bpr-z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9f542" stopOpacity=".55" /><stop offset="1" stopColor="#e9f542" stopOpacity="0" /></linearGradient></defs>
                <path d={`${wygladz(krzywa)} L${X(29)},120 L${X(0)},120 Z`} fill="url(#bpr-z)" />
                <path d={wygladz(krzywa)} fill="none" stroke="#dfe83a" strokeWidth="1.6" />
                {dni30.map((v, i) => <line key={i} x1={X(i)} x2={X(i)} y1={120} y2={120 - (v / max) * 60} stroke={i === h ? "#d9e000" : "#cfd1d6"} strokeWidth={i === h ? 2.4 : 1.6} strokeLinecap="round" />)}
                {dni30.map((v, i) => <line key={`d${i}`} x1={X(i)} x2={X(i)} y1={128} y2={128 + (v / max) * 14} stroke={i === h ? "#141416" : "#e2e3e8"} strokeWidth="1.4" strokeLinecap="round" />)}
              </svg>
              <div className="osie">{[600, 500, 200, 100, 0, 100].map((v, i) => <span key={i}>{v}</span>)}</div>
              <div className="tt" style={{ left: `${(X(h) / W) * 100}%` }}><b>{data(h)}</b><span><em>{dni30[h] * 2}</em> {t("calls scored", "rozmów ocenionych")}</span><span><em>{Math.round(dni30[h] / 3)}</em> {t("not scored", "bez oceny")}</span><span><em>{Math.round(dni30[h] * 2.2)}</em> {t("Bruno prediction", "prognoza Bruno")}</span></div>
            </div>
          </div>
        </section>

        <div className="zak">{zak.map((z, i) => <button type="button" key={z} className={i === 6 ? "on" : ""}>{z}</button>)}<button type="button" className="kr">⋮</button></div>

        <section className="rzad">
          <div className="karta tab">
            <div className="hd"><small>{t("Reps performance", "Wyniki handlowców")}</small><span className="roz">⤢</span></div>
            <h3>{t("Bruno + customer ratings", "Oceny Bruno i klienta")}</h3>
            <table>
              <thead><tr><th>{t("Reps", "Handlowcy")}</th><th>{t("Score", "Ocena")}</th><th>{t("Calls rated", "Ocenionych")}</th></tr></thead>
              <tbody>
                {ZESPOL.map((z) => (
                  <tr key={z.imie}><td><Link href={`/bruno/szef/${encodeURIComponent(`${z.imie.toLowerCase()}.bruno-demo@demo.salesbruno.pl`)}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={z.foto} alt="" /><div><b>{z.imie} S.</b><small>{t("Team", "Zespół")} {z.zespol}</small></div></Link></td><td className={z.ocena >= 7 ? "ok" : ""}>{Math.round(z.ocena * 10)}%</td><td>{z.rozmow}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="karta wsk">
            <small>{t("Team score", "Ocena zespołu")}</small>
            <b className="duza">{procSred}<span>%</span></b>
            <svg viewBox="0 0 200 110" aria-hidden>
              <path d="M15,100 A85,85 0 0 1 185,100" fill="none" stroke="#eceef2" strokeWidth="3" />
              <path d="M15,100 A85,85 0 0 1 185,100" fill="none" stroke="#d9e000" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${Math.PI * 85 * (procSred / 100)} ${Math.PI * 85}`} />
              <text x="100" y="92" textAnchor="middle" fontSize="10" fill="#8a8a93">{procSred >= 70 ? t("On target", "W celu") : t("Below target", "Poniżej celu")}</text>
            </svg>
            <small className="dol">{t("Response rate", "Tempo odpowiedzi")}</small>
          </div>

          <div className="karta czas">
            <div className="hd"><small>{t("Score over time", "Ocena w czasie")}</small><span className="sel">{t("Week", "Tydzień")} ⌄</span></div>
            <div className="leg"><span><i className="zol" />{t("Customer", "Klient")}</span><span><i className="bia" />{t("Bruno", "Bruno")}</span></div>
            <svg viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden>
              {sredniaCzas.map((v, i) => <line key={i} x1={6 + i * 10.6} x2={6 + i * 10.6} y1={100} y2={100 - (v / 100) * 80} stroke={v > 85 ? "#d9e000" : "#d7d9de"} strokeWidth="2" strokeLinecap="round" />)}
            </svg>
            <div className="pod"><span>1 {t("Oct", "paź")}</span><span>8 {t("Oct", "paź")}</span><span>16 {t("Oct", "paź")}</span><span>30 {t("Oct", "paź")}</span></div>
            <small className="dol">{t("Handled calls", "Obsłużone rozmowy")}</small>
          </div>

          <div className="karta prog">
            <small>{t("Prediction rate", "Trafność prognozy")}</small>
            <h3>{t("Bruno powered", "Zasilane przez Bruno")}</h3>
            <div className="leg kol"><span><i className="bia" />{t("Scored", "Ocenione")}<b>{Math.round(razem * 0.8)} {t("calls", "rozmów")}</b></span><span><i className="sza" />{t("Inbound", "Przychodzące")}<b>{Math.round(razem * 1.4)} {t("calls", "rozmów")}</b></span></div>
            <svg viewBox="0 0 200 60" aria-hidden><path d="M10,58 A90,90 0 0 1 190,58" fill="none" stroke="#eceef2" strokeWidth="3" /><path d="M10,58 A90,90 0 0 1 190,58" fill="none" stroke="#141416" strokeWidth="3" strokeDasharray="120 400" strokeLinecap="round" /></svg>
            <small className="dol">{t("+ 2% vs. last month", "+ 2 % vs poprzedni miesiąc")}</small>
          </div>
        </section>
      </main>
    </div>
  );
}
