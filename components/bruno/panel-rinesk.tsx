"use client";

import Link from "next/link";
import { useState } from "react";
import type { DanePanelu } from "@/components/podglad/panel/dane";
import Licz from "@/components/podglad/panel/licz";
import { type DostepLinkow, Ikona, rozmowy } from "@/components/podglad/panel/wspolne";
import { useT } from "@/components/bruno/jezyk-kontekst";
import type { Logo } from "@/components/bruno/pasek-zloty";
import "./panel-rinesk.css";

// 27.10 (USER_001: „Rinesk wygrywa, przerób Bruno na taki”): PRAWDZIWY panel handlowca w stylu Rinesk
// (wzór: /podglad/bruno-panel-rinesk, ten był panelem szefa). Dane = DanePanelu (te same co wersja A).
// Hero: inicjał / logo, „Cześć, Jakub! 👋”, limonkowy „Rozmawiaj”, wielka liczba rozmów, legenda,
// 14 słupków z limonkową krzywą ocen i dymkiem. Rząd zakładek. 4 karty: kryteria, średnia ocena (półokrąg),
// ocena w czasie, plan dnia. Bez ocen: prawdziwe zera (to produkt, nie podgląd), zachęta do pierwszej rozmowy.

function wygladz(pts: [number, number][]) {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2; s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`; }
  return s;
}

// 28.10 (USER_001): „Cześć” + wykres po LEWEJ, „Twoje rozmowy” po PRAWEJ (CSS order); zamiast logo firmy zdjęcie osoby.
export default function PanelRinesk({ d, dostep, logo = null, inicjal, zdjecie = null }: { d: DanePanelu; dostep: DostepLinkow; logo?: Logo; inicjal: string; /** 28.10: zdjęcie zalogowanego (albo kogoś z zespołu), zamiast logo. */ zdjecie?: string | null }) {
  const { t, jezyk } = useT();
  const pl = (v: number, dec = 1) => v.toLocaleString(jezyk === "pl" ? "pl-PL" : "en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const [hover, setHover] = useState<number | null>(null);
  const dni14 = [...d.dniPoprzednie.map((w) => ({ wartosc: w, srednia: null as number | null, etykieta: "" })), ...d.dni7.map((x) => ({ wartosc: x.wartosc, srednia: x.srednia, etykieta: x.etykieta }))];
  const r7 = d.dni7.reduce((a, x) => a + x.wartosc, 0);
  const r14 = dni14.reduce((a, x) => a + x.wartosc, 0);
  const sred = d.srednia?.ocena ?? null;
  const ost = d.ostatnia?.ocena ?? null;
  const kryteria = (d.ostatnia ?? d.srednia)?.kryteria ?? [];
  const procSred = sred !== null ? Math.round(sred * 10) : 0;
  const W = 600, H = 150, max = Math.max(...dni14.map((x) => x.wartosc), d.dziennie, 1);
  const X = (i: number) => 8 + i * ((W - 16) / 13);
  const krzywa = dni14.map((x, i) => [X(i), x.srednia !== null ? 118 - (x.srednia / 10) * 80 : 118] as [number, number]);
  const maOceny = d.dni7.some((x) => x.srednia !== null);
  const h = hover ?? 13;
  const dzis = new Date();
  const data = (i: number) => new Date(dzis.getTime() - (13 - i) * 86_400_000).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "long" });
  const zak = [
    { href: "/bruno/rozmowa", n: t("Live call", "Test") }, { href: "/bruno/trening", n: t("Drills", "Trening") }, { href: "/bruno/feedback", n: t("Feedback", "Feedback") },
    ...(dostep.statystyki ? [{ href: "/bruno/statystyki", n: t("Stats", "Statystyki") }] : []), { href: "/bruno/kalendarz", n: t("Calendar", "Kalendarz") },
    ...(dostep.ogien ? [{ href: "/bruno/ogien", n: t("Mental zone", "Strefa mentalna") }] : []), ...(dostep.szef ? [{ href: "/bruno/szef", n: t("Team", "Zespół") }] : []),
  ];
  const planProc = d.dziennie ? Math.min(100, Math.round((d.dzis / d.dziennie) * 100)) : 0;

  if (d.wygasl) {
    return (
      <div className="brp">
        <section className="brp-hero brp-wygasl">
          <h1>{t("Your trial has ended", "Dostęp testowy wygasł")}</h1>
          <p>{t(`Your ${d.dni}-day trial is over. Want to keep practicing with Bruno? Get in touch.`, `${d.dni} dni minęło. Jeśli chcesz dalej trenować z Bruno, napisz do nas.`)}</p>
          <Link href="/bruno/ustawienia" className="brp-btn">{t("Message us", "Napisz do nas")}</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="brp">
      <section className="brp-hero">
        <div className="brp-lider">
          {zdjecie ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={zdjecie} alt="" className="brp-foto" />
          ) : logo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo.url} alt={logo.nazwa} />
          ) : (
            <span className="brp-inicjal">{inicjal}</span>
          )}
          <div><small>{logo?.nazwa ?? t("Sales rep", "Handlowiec")}</small><b>{d.imie ?? "Bruno"}</b></div>
          {d.moznaRozmawiac ? (
            <Link href={d.linkRozmowy} className="brp-btn">{t("Talk to Bruno", "Rozmawiaj")}</Link>
          ) : (
            <span className="brp-btn brp-btn-off">{d.planZrobiony ? t("Come back tomorrow", "Wróć jutro") : t("Out of minutes", "Limit minut")}</span>
          )}
          {/* 28.10 (USER_001): kółko „Trening” obok „Rozmawiaj” usunięte. */}
        </div>
        <div className="brp-hej">
          <h1>{d.imie ? t(`Hey, ${d.imie}!`, `Cześć, ${d.imie}!`) : t("Hey!", "Cześć!")} 👋</h1>
          <p>{d.powtorka ?? (d.skonfigurowany ? t("See how your calls are going", "Zobacz, jak idą Twoje rozmowy") : t("Tell Bruno what you sell, then make the first call", "Powiedz Bruno, co sprzedajesz, i zrób pierwszą rozmowę"))}</p>
        </div>
        {!d.skonfigurowany && <Link href="/bruno/dostosuj" className="brp-okr brp-okr-duzy" aria-label={t("Customize Bruno", "Dostosuj Bruno")} title={t("Customize Bruno", "Dostosuj Bruno")}><Ikona nazwa="dostosuj" rozmiar={18} /></Link>}

        <div className="brp-bok">
          {/* 28.10 (USER_001): kolumna ikonek usunięta. */}
          <div className="brp-opis">
            <h2>{t("Your calls", "Twoje rozmowy")}</h2>
            {/* 28.10 (USER_001): opis „Wszystko z Twoich rozmów…” usunięty. */}
            <div className="brp-wielka"><Licz do={d.ocenionych} /></div>
            <div className="brp-leg">
              <span><i className="brp-zol" />{t("Scored calls", "Rozmów ocenionych")}<b>{d.ocenionych}</b></span>
              <span><i className="brp-czar" />{t("Last 7 days", "Ostatnie 7 dni")}<b>{r7}</b></span>
              <span><i className="brp-sza" />{t("Minutes, 7 days", "Minut w 7 dni")}<b>{d.min7}</b></span>
            </div>
          </div>
        </div>

        <div className="brp-wyk">
          <div className="brp-tyg"><span>{t("Last 14 days", "Ostatnie 14 dni")}</span><span>{t("week before", "tydzień wcześniej")}</span><span>{t("this week", "ten tydzień")}</span></div>
          <div className="brp-wyk-wrap">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(13, Math.round((((e.clientX - r.left) / r.width) * W - 8) / ((W - 16) / 13))))); }} onPointerLeave={() => setHover(null)} role="img" aria-label={t("Calls per day and daily score, last 14 days", "Rozmowy na dzień i ocena, ostatnie 14 dni")}>
              <defs><linearGradient id="brp-z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9f542" stopOpacity=".55" /><stop offset="1" stopColor="#e9f542" stopOpacity="0" /></linearGradient></defs>
              {maOceny && <><path d={`${wygladz(krzywa)} L${X(13)},118 L${X(0)},118 Z`} fill="url(#brp-z)" /><path d={wygladz(krzywa)} fill="none" stroke="#dfe83a" strokeWidth="1.6" /></>}
              {dni14.map((x, i) => <line key={i} x1={X(i)} x2={X(i)} y1={118} y2={118 - Math.max(4, (x.wartosc / max) * 60)} stroke={i === h ? "#d9e000" : x.wartosc ? "#c9ccd2" : "#e6e7eb"} strokeWidth={i === h ? 2.6 : 1.8} strokeLinecap="round" />)}
              {dni14.map((x, i) => <line key={`d${i}`} x1={X(i)} x2={X(i)} y1={126} y2={126 + (x.wartosc / max) * 14} stroke={i === h ? "#141416" : "#e6e7eb"} strokeWidth="1.4" strokeLinecap="round" />)}
              <line x1={X(7) - (W - 16) / 26} x2={X(7) - (W - 16) / 26} y1={30} y2={140} stroke="#e6e7eb" strokeDasharray="2 4" />
            </svg>
            {/* 28.10 (USER_001): oś = ocena 10 / 5 / 0 (zakres krzywej), dymek nad punktem krzywej w dniu, na który najechano. */}
            <div className="brp-osie">{[10, 5, 0].map((v) => <span key={v}>{v}</span>)}</div>
            <div className="brp-tt" style={{ left: `${(X(h) / W) * 100}%`, top: `${(krzywa[h][1] / H) * 240 - 12}px`, transform: `translate(${h >= 11 ? "-100%" : h <= 1 ? "0" : "-50%"}, -100%)` }}>
              <b>{data(h)}</b>
              <span><em>{dni14[h].wartosc}</em> {rozmowy(dni14[h].wartosc, jezyk)}</span>
              <span><em>{dni14[h].srednia !== null ? pl(dni14[h].srednia as number) : "–"}</em> {t("score", "ocena")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 28.10 (USER_001): rząd zakładek (Test / Trening / …) usunięty. */}

      <section className="brp-rzad">
        <div className="brp-karta brp-tab">
          <div className="brp-hd"><small>{t("Last call", "Ostatnia rozmowa")}</small><Link href="/bruno/feedback" className="brp-roz" aria-label={t("Feedback", "Feedback")}>⤢</Link></div>
          <h3>{t("Score by criterion", "Ocena w kryteriach")}</h3>
          {kryteria.length ? (
            <table>
              <thead><tr><th>{t("Criterion", "Kryterium")}</th><th>{t("Score", "Ocena")}</th><th></th></tr></thead>
              <tbody>
                {kryteria.map((k) => (
                  <tr key={k.nazwa}><td>{k.nazwa}</td><td className={k.ocena >= 7 ? "brp-ok" : k.ocena > 0 && k.ocena <= 5 ? "brp-zle" : ""}>{k.ocena ? `${Math.round(k.ocena * 10)}%` : "–"}</td><td><i className="brp-kreska"><b style={{ width: `${k.ocena * 10}%` }} /></i></td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="brp-pusto">{t("After your first call Bruno scores 5 criteria here.", "Po pierwszej rozmowie Bruno oceni tu 5 kryteriów.")} <Link href={d.linkRozmowy}>{t("Start now", "Zacznij teraz")}</Link></p>
          )}
        </div>

        <div className="brp-karta brp-wsk">
          <small>{t("Average score", "Średnia ocena")}</small>
          <b className="brp-duza">{sred !== null ? <Licz do={procSred} /> : "–"}<span>%</span></b>
          <svg viewBox="0 0 200 110" aria-hidden>
            <path d="M15,100 A85,85 0 0 1 185,100" fill="none" stroke="#eceef2" strokeWidth="3" />
            <path d="M15,100 A85,85 0 0 1 185,100" fill="none" stroke="#d9e000" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${Math.PI * 85 * (procSred / 100)} ${Math.PI * 85}`} />
            <text x="100" y="92" textAnchor="middle" fontSize="10" fill="#8a8a93">{sred === null ? t("No calls yet", "Jeszcze nic") : procSred >= 70 ? t("On target", "W celu") : t("Below target", "Poniżej celu")}</text>
          </svg>
          <small className="brp-dol">{d.srednia?.opis ?? t("From all scored calls", "Ze wszystkich ocenionych rozmów")}</small>
        </div>

        {/* 28.10 (USER_001): karta „Ocena w czasie” usunięta. */}
        <div className="brp-karta brp-plan">
          <small>{t("Today's plan", "Plan dnia")}</small>
          <h3>{d.planZrobiony ? t("Done for today", "Zrobiony na dziś") : t(`${d.zostaloDzis} ${rozmowy(d.zostaloDzis)} left`, `Zostało ${d.zostaloDzis} ${rozmowy(d.zostaloDzis, "pl")}`)}</h3>
          <div className="brp-leg brp-leg-kol">
            <span><i className="brp-czar" />{t("Calls today", "Rozmowy dziś")}<b>{d.dzis} / {d.dziennie}</b></span>
            <span><i className="brp-sza" />{t("Minutes left", "Minut zostało")}<b>{d.minutZostalo}</b></span>
            <span><i className="brp-sza" />{t("Days of access", "Dni dostępu")}<b>{d.dniZostalo}</b></span>
          </div>
          <svg viewBox="0 0 200 60" aria-hidden><path d="M10,58 A90,90 0 0 1 190,58" fill="none" stroke="#eceef2" strokeWidth="3" /><path d="M10,58 A90,90 0 0 1 190,58" fill="none" stroke="#141416" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${Math.PI * 90 * (planProc / 100)} ${Math.PI * 90}`} /></svg>
          {d.moznaRozmawiac ? <Link href={d.linkRozmowy} className="brp-btn brp-btn-mala">{t("Talk to Bruno", "Rozmawiaj")}</Link> : <small className="brp-dol">{d.koniec ? t(`Access until ${d.koniec}`, `Dostęp do ${d.koniec}`) : ""}</small>}
        </div>
      </section>
    </div>
  );
}
