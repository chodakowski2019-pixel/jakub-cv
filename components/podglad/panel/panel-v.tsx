"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DanePanelu } from "./dane";
import Licz from "./licz";
import { Ikona, linkiDla, rozmowy, useWyloguj } from "./wspolne";
import "./panel-v.css";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 27.10 (USER_001: „zrób dokładnie w takim stylu” = Vaulto, Orbix Studio, muz.li 2026): wersja V panelu Bruno.
// Czerń z ziarnem i smugą światła, karty z ledwo widoczną ramką, pomarańczowo-czerwony akcent, pasek z sekcjami
// (OGÓLNE / NARZĘDZIA / WGLĄD / INNE), okruszki + pole polecenia, duża liczba z pigułką, 3 karty z iskierką + „dodaj”,
// wykres 2 linii z dymkiem i pigułkami dni, słupki-kapsuły, lista aktywności, sankey kryteriów, siatka kropek.
// Dane = DanePanelu; bez ocen = przykład z etykietą.

function wygladz(pts: [number, number][]) {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2;
    s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return s;
}
const pl = (v: number, dec = 1) => v.toFixed(dec).replace(".", ",");

/* iskierka (sparkline) w karcie waluty */
function Iskra({ dane, kolor }: { dane: number[]; kolor: string }) {
  const max = Math.max(...dane, 1), min = Math.min(...dane, 0);
  const pts = dane.map((v, i) => [i * (90 / (dane.length - 1)), 28 - ((v - min) / (max - min || 1)) * 24] as [number, number]);
  return (
    <svg viewBox="0 0 90 30" className="iskra" aria-hidden>
      <path d={`${wygladz(pts)} L90,30 L0,30 Z`} fill={kolor} fillOpacity=".12" />
      <path d={wygladz(pts)} fill="none" stroke={kolor} strokeWidth="1.6" />
    </svg>
  );
}

// 27.10 (USER_001): prawa kolumna 1:1 z Alexatel (konsultant online + Join, Wiadomości, pole wpisu, żetony) i motyw jasny.
const ZESPOL = [
  { imie: "Marta", foto: "/bruno/demo/marta.jpg" }, { imie: "Ola", foto: "/bruno/demo/ola.jpg" }, { imie: "Natalia", foto: "/bruno/demo/natalia.jpg" },
  { imie: "Julia", foto: "/bruno/demo/julia.jpg" }, { imie: "Kasia", foto: "/bruno/demo/kasia.jpg" },
];

export default function PanelV({ d, logo = null, jasny = false, prawa = false }: { d: DanePanelu; logo?: { url: string | null; nazwa: string } | null; /** 27.10: jasne kolory. */ jasny?: boolean; /** 27.10: prawa kolumna jak w Alexatel. */ prawa?: boolean }) {
  const { t, jezyk } = useT();
  const wyloguj = useWyloguj();
  const linki = linkiDla({ ogien: true, statystyki: true, szef: true }, jezyk);
  const przyklad = d.ocenionych === 0;
  const L = (ik: string) => linki.find((l) => l.ikona === ik);

  // liczby główne
  const sred = d.srednia?.ocena ?? (przyklad ? 6.8 : 0);
  const ost = d.ostatnia?.ocena ?? (przyklad ? 7.4 : 0);
  const zmiana = ost - sred;
  const r7 = przyklad ? 12 : d.dni7.reduce((a, x) => a + x.wartosc, 0);
  const min7 = przyklad ? 36 : d.min7;

  // 3 karty postaci + dodaj
  const postacie = d.postacie.slice(0, 3).map((p, i) => ({
    ...p,
    rozmow: przyklad ? [6, 4, 3][i] : p.rozmow,
    srednia: przyklad ? [7.2, 6.4, 5.8][i] : p.srednia,
    zm: przyklad ? [0.6, -0.3, 0.9][i] : (p.srednia ?? 0) - sred,
    iskra: przyklad ? [[5, 6, 5.5, 6.5, 7, 6.8, 7.2], [6.8, 6.5, 6.6, 6.2, 6.4, 6.1, 6.4], [4.5, 5, 5.2, 5.1, 5.6, 5.9, 5.8]][i] : d.dni7.map((x) => x.srednia ?? 0),
  }));

  // wykres 14 dni: czerwona = ocena dnia, biała = średnia krocząca
  const [hover, setHover] = useState<number | null>(null);
  const oceny14 = przyklad ? [5.2, 5.6, 5.4, 6.0, 5.9, 6.3, 6.1, 6.6, 6.4, 6.9, 6.7, 7.1, 7.0, 7.4] : [...d.dniPoprzednie.map(() => 0), ...d.dni7.map((x) => x.srednia ?? 0)];
  const kroczaca = oceny14.map((_, i) => { const w = oceny14.slice(Math.max(0, i - 3), i + 1).filter((v) => v > 0); return w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0; });
  const W = 560, H = 200, PL = 8, PR = 8, PT = 10, PB = 10;
  const X = (i: number) => PL + (i * (W - PL - PR)) / 13;
  const nieZero = oceny14.filter((v) => v > 0);
  const yMin = Math.max(0, Math.min(...nieZero, 10) - 0.8), yMax = Math.min(10, Math.max(...nieZero, 0) + 0.8);
  const Y = (v: number) => PT + (H - PT - PB) - (Math.max(0, v - yMin) / (yMax - yMin || 1)) * (H - PT - PB);
  const pC = useMemo(() => oceny14.map((v, i) => [X(i), Y(v)] as [number, number]), [oceny14.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const pB = useMemo(() => kroczaca.map((v, i) => [X(i), Y(v)] as [number, number]), [kroczaca.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const h = hover ?? 13;
  const dzis = new Date();
  const data = (i: number) => new Date(dzis.getTime() - (13 - i) * 86_400_000).toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short" });
  const ruch = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.max(0, Math.min(13, Math.round((((e.clientX - r.left) / r.width) * W - PL) / ((W - PL - PR) / 13)))));
  };

  // słupki-kapsuły: minuty w 7 dniach
  const minuty = przyklad ? [6, 3, 9, 12, 0, 6, 0] : d.dni7.map((x) => x.minuty);
  const maxMin = Math.max(...minuty, 1);
  const dzisIdx = 6;

  // aktywność
  const akt = [
    { ik: "test" as const, naz: t("Live call", "Rozmowa testowa"), kiedy: t("Finished · Today", "Zakończona · dziś"), w: przyklad ? "+7,4" : d.ostatnia ? `+${pl(d.ostatnia.ocena)}` : "–", ok: true },
    { ik: "trening" as const, naz: t("Drills", "Trening fiszek"), kiedy: t("12 cards · Yesterday", "12 fiszek · wczoraj"), w: "+12", ok: true },
    { ik: "ogien" as const, naz: t("Mental zone", "Strefa mentalna"), kiedy: t("Before a real call · Mon", "Przed prawdziwą rozmową · pn"), w: "4:30", ok: true },
    { ik: "feedback" as const, naz: t("Feedback", "Feedback"), kiedy: t("Objections · Mon", "Obiekcje · pn"), w: "-0,3", ok: false },
  ];

  // sankey: ostatnia rozmowa → 5 kryteriów (szerokość = ocena, najsłabsze czerwone)
  const kryt = d.ostatnia?.kryteria ?? [
    { nazwa: t("Opening", "Otwarcie"), ocena: 7 }, { nazwa: t("Questions", "Pytania"), ocena: 6 }, { nazwa: t("Objections", "Obiekcje"), ocena: 5 }, { nazwa: t("Closing", "Zamknięcie"), ocena: 6 }, { nazwa: t("Confidence", "Mentalność"), ocena: 8 },
  ];
  const najslabsze = kryt.reduce((a, b) => (b.ocena < a.ocena ? b : a), kryt[0]);
  const suma = kryt.reduce((a, k) => a + k.ocena, 0) || 1;
  const SW = 360, SH = 190, lewoX = 8, prawoX = SW - 118, wysL = 150, yL0 = 20;
  let yl = yL0, yr = 6;
  const wstegi = kryt.map((k) => {
    const hh = (k.ocena / suma) * wysL;
    const y0 = yl; yl += hh;
    const hr = 26, y1 = yr; yr += hr + 10;
    const x0 = lewoX + 92, x1 = prawoX;
    const path = `M${x0},${y0} C${(x0 + x1) / 2},${y0} ${(x0 + x1) / 2},${y1 + 4} ${x1},${y1 + 4} L${x1},${y1 + hr - 4} C${(x0 + x1) / 2},${y1 + hr - 4} ${(x0 + x1) / 2},${y0 + hh} ${x0},${y0 + hh} Z`;
    return { ...k, path, y1, hr, slabe: k.nazwa === najslabsze.nazwa };
  });

  // siatka kropek: 35 dni treningu
  const kropki = przyklad ? Array.from({ length: 35 }, (_, i) => [1, 0, 1, 1, 0, 1, 0][i % 7] ^ (i % 5 === 0 ? 1 : 0)) : Array.from({ length: 35 }, (_, i) => (i >= 28 ? (d.dni7[i - 28]?.wartosc ? 1 : 0) : 0));
  const seria = przyklad ? 4 : [...d.dni7].reverse().findIndex((x) => !x.wartosc) === -1 ? 7 : [...d.dni7].reverse().findIndex((x) => !x.wartosc);

  const wiadomosci = [
    t("Closed 8/10 with the red customer. Bruno says: ask for the date.", "Zamknęłam 8/10 z klientem czerwonym. Bruno: pytaj o termin."),
    t("“Too expensive” drilled 12 times today.", "„Za drogo” przećwiczone dziś 12 razy."),
    t("Best opening of the week: 9/10.", "Najlepsze otwarcie tygodnia: 9/10."),
    t("Mental zone before the real call. Worked.", "Strefa mentalna przed prawdziwą rozmową. Zadziałało."),
    t("Streak: 6 days in a row.", "Seria: 6 dni z rzędu."),
  ];
  return (
    <div className={`bpv ${jasny ? "jasny" : ""} ${prawa ? "z-prawa" : ""}`}>
      <div className="swiatlo" aria-hidden />
      <div className="ziarno" aria-hidden />
      <div className="ukl">
        <aside className="pasek">
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo?.url ? <img src={logo.url} alt={logo.nazwa} /> : <i>✳</i>}
            <b>Bruno AI</b>
            <button type="button" aria-label={t("Collapse", "Zwiń")} className="zwin"><span /></button>
          </div>
          <div className="sekcja">{t("General", "Ogólne")}</div>
          <nav>
            {[L("panel"), L("test"), L("trening")].filter(Boolean).map((l) => (
              <Link key={l!.href} href={l!.href} className={l!.ikona === "panel" ? "on" : ""} aria-current={l!.ikona === "panel" ? "page" : undefined}>
                <i><Ikona nazwa={l!.ikona} rozmiar={13} grubosc={2} /></i><span>{l!.nazwa}</span>
                {l!.ikona === "trening" && <em>3</em>}
              </Link>
            ))}
          </nav>
          <div className="sekcja">{t("Tools", "Narzędzia")}</div>
          <nav>
            {[L("ogien"), L("feedback"), L("statystyki"), L("kalendarz")].filter(Boolean).map((l) => (
              <Link key={l!.href} href={l!.href}><i><Ikona nazwa={l!.ikona} rozmiar={13} grubosc={2} /></i><span>{l!.nazwa}</span>{l!.ikona === "ogien" && <em className="strz">⌄</em>}</Link>
            ))}
          </nav>
          <div className="sekcja">{t("Insights", "Wgląd")}</div>
          <nav>
            {[L("zespol")].filter(Boolean).map((l) => (
              <Link key={l!.href} href={l!.href}><i><Ikona nazwa={l!.ikona} rozmiar={13} grubosc={2} /></i><span>{l!.nazwa}</span></Link>
            ))}
            <Link href="/bruno/statystyki"><i><Ikona nazwa="statystyki" rozmiar={13} grubosc={2} /></i><span>{t("Reports", "Raporty")}</span></Link>
          </nav>
          <div className="sekcja">{t("Other", "Inne")}</div>
          <nav>
            <Link href="/bruno/ustawienia"><i><Ikona nazwa="ustawienia" rozmiar={13} grubosc={2} /></i><span>{t("Settings", "Ustawienia")}</span></Link>
            <Link href="/bruno/ustawienia"><i><Ikona nazwa="dostosuj" rozmiar={13} grubosc={2} /></i><span>{t("Customize Bruno", "Dostosuj Bruno")}</span><em>{d.dziennie}</em></Link>
          </nav>
          <div className="grow" />
          <Link href={d.linkRozmowy} className="pro">
            <i><Ikona nazwa="mikrofon" rozmiar={14} grubosc={2} /></i>
            <div><b>{t("Today's plan", "Plan dnia")}</b><small>{d.planZrobiony ? t("Done for today", "Zrobiony na dziś") : t(`${d.dzis} of ${d.dziennie} calls · ${d.zostaloDzis} left`, `${d.dzis} z ${d.dziennie} rozmów · zostało ${d.zostaloDzis}`)}</small></div>
          </Link>
        </aside>

        <main>
          <header className="gora">
            <div className="okr"><span>{t("Dashboard", "Panel")}</span> / <b>{t("Home", "Start")}</b></div>
            <label className="cmd"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg><input placeholder={t("Search or type command", "Szukaj albo wpisz polecenie")} aria-label={t("Search", "Szukaj")} /><kbd>⌘</kbd><kbd>{t("Space", "Spacja")}</kbd></label>
            <div className="ikony">
              <button type="button" aria-label={t("Apps", "Aplikacje")}><Ikona nazwa="panel" rozmiar={16} /></button>
              <button type="button" aria-label={t("Notifications", "Powiadomienia")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></svg></button>
              <button type="button" aria-label={t("Help", "Pomoc")} className="pyt">?</button>
              <button type="button" onClick={wyloguj} aria-label={t("Log out", "Wyloguj")} className="aw">{d.inicjal}</button>
            </div>
          </header>

          <section className="saldo">
            <small>{t("Average score", "Średnia ocena")}{przyklad && <span className="przyk">{t("sample", "przykład")}</span>}</small>
            <div className="duza"><Licz do={sred} dec={1} /><span className={`pig ${zmiana >= 0 ? "ziel" : "czer"}`}>{zmiana >= 0 ? "↑" : "↓"} {zmiana >= 0 ? "+" : ""}{pl(zmiana)}</span></div>
            <div className="pod"><span><Ikona nazwa="test" rozmiar={11} /> {t("Calls", "Rozmowy")}: <b>{r7}</b> <i className="z">↗</i></span><span className="sep">|</span><span><Ikona nazwa="kalendarz" rozmiar={11} /> {t("Minutes", "Minuty")}: <b>{min7}</b> <i className="c">↘</i></span></div>
            <div className="akcje">
              <Link href={d.linkRozmowy} className="btn pri">+ {t("Talk to Bruno", "Rozmawiaj")}</Link>
              <Link href="/bruno/trening" className="btn">↗ {t("Drills", "Trening")}</Link>
              <Link href="/bruno/feedback" className="btn">⟳ {t("Feedback", "Feedback")}</Link>
            </div>
          </section>

          <section className="waluty">
            {postacie.map((p) => (
              <Link key={p.id} href={`/bruno/rozmowa?postac=${p.id}`} className="waluta">
                <div className="hd"><i style={{ color: p.kolor }}>◎</i><b>{t(`${p.nazwa}`, p.nazwa)}</b></div>
                <Iskra dane={p.iskra} kolor={p.zm >= 0 ? "#3ddc84" : "#ff4d4d"} />
                <div className="licz">{p.srednia !== null ? pl(p.srednia) : "–"}<span className={p.zm >= 0 ? "z" : "c"}>{p.zm >= 0 ? "↗" : "↘"} {p.zm >= 0 ? "+" : ""}{pl(p.zm)}</span></div>
                <small>{p.rozmow} {rozmowy(p.rozmow, jezyk)} · {t("last month", "ostatni miesiąc")}</small>
              </Link>
            ))}
            <Link href="/bruno/rozmowa" className="waluta dodaj">
              <i>+</i>
              <p>{t("Add a", "Dodaj")} <b>{t("scenario", "scenariusz")}</b> {t("or the call you have tomorrow.", "albo rozmowę, którą masz jutro.")}</p>
            </Link>
          </section>

          <section className="rzad">
            <div className="karta wyk">
              <div className="hd"><div><small>{t("Score over time", "Ocena w czasie")}</small><b>{pl(ost)} <span>/ 10</span></b></div><div className="sel"><span>{t("All", "Wszystko")} ⌄</span><span>{t("Custom", "Własne")} ⌄</span></div></div>
              <div className="wyk-wrap">
                <svg viewBox={`0 0 ${W} ${H}`} onPointerMove={ruch} onPointerLeave={() => setHover(null)} role="img" aria-label={t("Daily score and 4-day average, last 14 days", "Ocena dzienna i średnia z 4 dni, ostatnie 14 dni")}>
                  <defs><pattern id="bpv-siatka" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.05)" /></pattern></defs>
                  <rect x="0" y="0" width={W} height={H} fill="url(#bpv-siatka)" />
                  <path d={wygladz(pB)} fill="none" stroke="#e8e8e8" strokeWidth="2.2" />
                  <path d={wygladz(pC)} fill="none" stroke="#ff3b1f" strokeWidth="2.2" />
                  <line x1={X(h)} x2={X(h)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.18)" strokeDasharray="3 4" />
                  <circle cx={X(h)} cy={Y(oceny14[h])} r="5" fill="#ff5a1f" stroke="#120f0e" strokeWidth="2" />
                </svg>
                <div className="tt" style={{ left: `${(X(h) / W) * 100}%`, top: `${(Y(oceny14[h]) / H) * 100}%` }}><b>{data(h)}</b><span>{t("Score", "Ocena")}: <em>{oceny14[h] ? pl(oceny14[h]) : "–"}</em></span></div>
              </div>
              <div className="dni">{oceny14.map((_, i) => <button type="button" key={i} className={i === h ? "on" : ""} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>{i + 1}</button>)}</div>
            </div>

            <div className="karta slupki">
              <div className="hd"><div><small>{t("Training minutes", "Minuty treningu")}</small><b>{min7}<span> min</span></b></div><button type="button" className="mini">{t("See all", "Wszystko")}</button></div>
              <div className="kapsuly">
                {minuty.map((m, i) => (
                  <div key={i} className={`kap ${i === dzisIdx ? "dzis" : ""}`}>
                    <div className="tor"><div className="wyp" style={{ height: `${Math.max(6, (m / maxMin) * 100)}%` }} /></div>
                    <span>{d.dni7[i]?.etykieta ?? ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rzad dol">
            <div className="karta akt">
              <div className="hd"><small>{t("Recent activity", "Ostatnia aktywność")}</small><button type="button" className="mini">{t("See all", "Wszystko")}</button></div>
              <ul>
                {akt.map((a) => (
                  <li key={a.naz}><i><Ikona nazwa={a.ik} rozmiar={14} grubosc={2} /></i><div><b>{a.naz}</b><small>{a.kiedy}</small></div><span className={a.ok ? "" : "c"}>{a.w}</span></li>
                ))}
              </ul>
            </div>

            <div className="karta sankey">
              <div className="hd"><div><small>{t("Last call: criteria", "Ostatnia rozmowa: kryteria")}</small><b>{pl(ost)}<span> / 10</span></b></div></div>
              <svg viewBox={`0 0 ${SW} ${SH}`} role="img" aria-label={t("Score split by 5 criteria", "Ocena rozłożona na 5 kryteriów")}>
                {wstegi.map((w) => <path key={w.nazwa} d={w.path} fill={w.slabe ? "#ff3b1f" : "#8a8a8a"} fillOpacity={w.slabe ? ".55" : ".3"} />)}
                <rect x={lewoX} y={yL0} width="92" height={wysL} rx="6" className="wezel" />
                <text x={lewoX + 10} y={yL0 + 22} className="w-naz">◎ {t("Call", "Rozmowa")}</text>
                <text x={lewoX + 10} y={yL0 + 40} className="w-wart">{pl(ost)}</text>
                {wstegi.map((w) => (
                  <g key={w.nazwa}>
                    <rect x={prawoX} y={w.y1} width="110" height={w.hr} rx="5" className={`wezel ${w.slabe ? "slabe" : ""}`} />
                    <text x={prawoX + 8} y={w.y1 + 11} className="w-naz">{w.nazwa}</text>
                    <text x={prawoX + 8} y={w.y1 + 22} className="w-wart">{w.ocena}/10</text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="karta seria">
              <div className="hd"><div><small>{t("Training streak", "Seria treningu")}</small><b>{seria} <span>{t(seria === 1 ? "day" : "days", seria === 1 ? "dzień" : "dni")}</span></b></div><span className={`pig ${seria >= 3 ? "ziel" : "czer"}`}>{seria >= 3 ? "↗" : "↘"} {seria >= 3 ? "+" : ""}{seria}</span></div>
              <div className="kropki" aria-label={t("Last 35 days", "Ostatnie 35 dni")}>
                {kropki.map((k, i) => <i key={i} className={k ? "on" : ""} />)}
              </div>
            </div>
          </section>
        </main>

        {prawa && (
          <aside className="prawa">
            <div className="hd"><h3>{t("Talk to Bruno", "Rozmowa z Bruno")}</h3><Link href={d.linkRozmowy} className="plus">+ {t("Start", "Start")}</Link></div>
            <Link href={d.linkRozmowy} className="operator">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bruno/demo/jakub.jpg" alt="" />
              <b>Bruno · {t(`${d.postacie[0].nazwa} customer`, `klient ${d.postacie[0].nazwa.toLowerCase()}`)}</b>
              <Ikona nazwa="test" rozmiar={17} grubosc={1.8} />
              <i>⋮</i>
            </Link>

            <h3>{t("Messages", "Wiadomości")}</h3>
            <ul className="wiad">
              {ZESPOL.map((z, i) => (
                <li key={z.imie}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={z.foto} alt="" />
                  <div><b>{z.imie} S.</b><small>{wiadomosci[i]}</small></div>
                </li>
              ))}
            </ul>

            <h3>{t("Ask Bruno", "Zapytaj Bruno")}</h3>
            <label className="wpis"><input placeholder={t("How do I handle “too expensive”?", "Jak zbić „za drogo”?")} aria-label={t("Ask Bruno", "Zapytaj Bruno")} /><button type="button" aria-label={t("Send", "Wyślij")}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" /></svg></button></label>

            <h3>{t("Train with", "Trenuj z")}</h3>
            <div className="zetony">
              {ZESPOL.slice(0, 2).map((z) => (
                <span key={z.imie}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={z.foto} alt="" />{z.imie} {z.imie[0]}.<button type="button" aria-label={t("Remove", "Usuń")}>×</button>
                </span>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
