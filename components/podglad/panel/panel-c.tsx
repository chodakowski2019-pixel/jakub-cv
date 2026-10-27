"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DanePanelu } from "./dane";
import Licz from "./licz";
import { Ikona, linkiDla, rozmowy, useWyloguj } from "./wspolne";
import "./panel-c.css";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 27.10 (USER_001, z 3 wzorów z muz.li): wersja C panelu Bruno.
//  1. kokpit = Alexatel (Mirhayot): 3 kafle z listą ✓, duża karta wykresu z zakładkami, wiersze listy, prawa kolumna
//     (konsultant online, wiadomości, pole wpisu, żetony).
//  2. wizualizacja = Rabbet (Dhruv): linie z wypełnieniem (limonka / niebieski / czerwony) na ciemnej siatce + RADAR.
//  3. lewy pasek = exon (Fireart): ikona + nazwa, aktywna zakładka jasnym polem, znaczniki (kropka, „Live”),
//     na dole Pomoc / Ustawienia, karta z przyciskiem, użytkownik z e-mailem.
// Dwa motywy: ciemny (domyślny) i jasny (klasa .jasny). Dane = DanePanelu (jak wersja A); bez ocen = przykład.

/* ---------- pomocnicze ---------- */
function wygladz(pts: [number, number][]) {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2;
    s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return s;
}
const pl = (v: number, dec = 1) => v.toFixed(dec).replace(".", ",");

/* ---------- 1. trzy kafle z listą ✓ (Alexatel: Tariff Plans / Additional Options / Subscription) ---------- */
function Kafle({ t }: { t: (en: string, pl: string) => string }) {
  const kafle = [
    { href: "/bruno/rozmowa", ikona: "test" as const, kolor: "lila", tytul: t("Live call", "Test"), p: [t("4 customer types, 3 difficulty levels", "4 typy klienta, 3 poziomy trudności"), t("3 minutes, real voice", "3 minuty, prawdziwy głos"), t("Your product and your objections", "Twój produkt i Twoje obiekcje")] },
    { href: "/bruno/trening", ikona: "trening" as const, kolor: "nieb", tytul: t("Drills", "Trening"), p: [t("Flashcards from your own calls", "Fiszki z Twoich rozmów"), t("Spaced repetition (FSRS)", "Powtórki w rosnących odstępach"), t("Say it out loud, Bruno checks", "Mówisz na głos, Bruno sprawdza")] },
    { href: "/bruno/feedback", ikona: "feedback" as const, kolor: "brzo", tytul: t("Feedback", "Feedback"), p: [t("Score 1-10 on 5 criteria", "Ocena 1-10 w 5 kryteriach"), t("Quotes from the call", "Cytaty z rozmowy"), t("One thing to fix next time", "Jedna rzecz do poprawy")] },
  ];
  return (
    <section className="kafle">
      {kafle.map((k) => (
        <Link key={k.href} href={k.href} className="kafel">
          <div className="kafel-hd"><span className={`ik ${k.kolor}`}><Ikona nazwa={k.ikona} rozmiar={16} grubosc={2} /></span><b>{k.tytul}</b></div>
          <ul>{k.p.map((x) => <li key={x}><i className="chk" />{x}</li>)}</ul>
        </Link>
      ))}
    </section>
  );
}

/* ---------- 2. wykres liniowy z wypełnieniem (Rabbet: Cash Flow Statement) ---------- */
function Wykres({ d, t, jezyk }: { d: DanePanelu; t: (en: string, pl: string) => string; jezyk: string }) {
  const [zak, setZak] = useState<"d" | "t" | "m">("t");
  const [hover, setHover] = useState<number | null>(null);
  const przyklad = d.ocenionych === 0;
  const teraz = przyklad ? [2, 3, 1, 4, 3, 5, 2] : d.dni7.map((x) => x.wartosc);
  const przed = przyklad ? [1, 2, 2, 1, 3, 2, 1] : d.dniPoprzednie;
  const oceny = przyklad ? [5.5, 6.1, 5.9, 6.8, 6.4, 7.1, 7.4] : d.dni7.map((x) => x.srednia ?? 0);
  const max = Math.max(d.dziennie, ...teraz, ...przed, 1);
  const W = 640, H = 220, L = 40, R = 16, T = 14, B = 34;
  const X = (i: number) => L + (i * (W - L - R)) / 6;
  const Y = (v: number) => T + (H - T - B) - (v / max) * (H - T - B);
  const Yo = (v: number) => T + (H - T - B) - (v / 10) * (H - T - B);
  const pT = useMemo(() => teraz.map((v, i) => [X(i), Y(v)] as [number, number]), [teraz.join(), max]); // eslint-disable-line react-hooks/exhaustive-deps
  const pP = useMemo(() => przed.map((v, i) => [X(i), Y(v)] as [number, number]), [przed.join(), max]); // eslint-disable-line react-hooks/exhaustive-deps
  const pO = useMemo(() => oceny.map((v, i) => [X(i), Yo(v)] as [number, number]), [oceny.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const osie = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const h = hover ?? 6;
  const etyk = d.dni7.map((x) => x.etykieta);
  const ruch = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(6, Math.round(((x - L) / (W - L - R)) * 6))));
  };
  return (
    <section className="karta wykres">
      <div className="hd">
        <h3>{t("Calls and score", "Rozmowy i ocena")}{przyklad && <small className="przyk">{t("sample", "przykład")}</small>}</h3>
        <div className="zak">
          {(["d", "t", "m"] as const).map((z) => <button key={z} type="button" className={zak === z ? "on" : ""} onClick={() => setZak(z)}>{{ d: t("Daily", "Dziś"), t: t("Weekly", "Tydzień"), m: t("Monthly", "Miesiąc") }[z]}</button>)}
        </div>
      </div>
      <div className="wyk-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="wyk" onPointerMove={ruch} onPointerLeave={() => setHover(null)} role="img" aria-label={t("Calls this week vs last week and average score", "Rozmowy w tym i poprzednim tygodniu oraz średnia ocena")}>
          <defs>
            <linearGradient id="bpc-lim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--lim)" stopOpacity=".35" /><stop offset="1" stopColor="var(--lim)" stopOpacity="0" /></linearGradient>
            <linearGradient id="bpc-nieb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--nieb)" stopOpacity=".3" /><stop offset="1" stopColor="var(--nieb)" stopOpacity="0" /></linearGradient>
            <linearGradient id="bpc-czer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--czer)" stopOpacity=".22" /><stop offset="1" stopColor="var(--czer)" stopOpacity="0" /></linearGradient>
          </defs>
          {osie.map((v, i) => (
            <g key={i}>
              <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} className="siatka" />
              <text x={L - 8} y={Y(v) + 4} textAnchor="end" className="os">{v}</text>
            </g>
          ))}
          {etyk.map((e, i) => <text key={i} x={X(i)} y={H - 10} textAnchor="middle" className="os">{e}</text>)}
          <path d={`${wygladz(pP)} L${X(6)},${Y(0)} L${X(0)},${Y(0)} Z`} fill="url(#bpc-nieb)" />
          <path d={`${wygladz(pT)} L${X(6)},${Y(0)} L${X(0)},${Y(0)} Z`} fill="url(#bpc-lim)" />
          <path d={`${wygladz(pO)} L${X(6)},${Y(0)} L${X(0)},${Y(0)} Z`} fill="url(#bpc-czer)" />
          <path d={wygladz(pP)} fill="none" stroke="var(--nieb)" strokeWidth="2" />
          <path d={wygladz(pO)} fill="none" stroke="var(--czer)" strokeWidth="2" />
          <path d={wygladz(pT)} fill="none" stroke="var(--lim)" strokeWidth="2.4" />
          <line x1={X(h)} x2={X(h)} y1={T} y2={H - B} className="kursor" opacity={hover === null ? 0 : 1} />
          {[pP[h], pO[h], pT[h]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" className="kropka" style={{ stroke: ["var(--nieb)", "var(--czer)", "var(--lim)"][i] }} />)}
        </svg>
        <div className={`tt ${hover !== null ? "on" : ""}`} style={{ left: `${(X(h) / W) * 100}%` }}>
          <b>{d.dni7[h]?.nazwaPelna ?? ""}</b>
          <span><i style={{ background: "var(--lim)" }} />{teraz[h]} {rozmowy(teraz[h], jezyk as "pl" | "en")}</span>
          <span><i style={{ background: "var(--nieb)" }} />{t("week before", "tydzień wcześniej")}: {przed[h]}</span>
          <span><i style={{ background: "var(--czer)" }} />{t("score", "ocena")}: {oceny[h] ? pl(oceny[h]) : "–"}</span>
        </div>
      </div>
      <div className="legenda">
        <span><i className="m" style={{ borderColor: "var(--lim)" }} /><em style={{ background: "var(--lim)" }} />{t("This week", "Ten tydzień")}</span>
        <span><i className="m" style={{ borderColor: "var(--nieb)" }} /><em style={{ background: "var(--nieb)" }} />{t("Last week", "Poprzedni tydzień")}</span>
        <span><i className="m" style={{ borderColor: "var(--czer)" }} /><em style={{ background: "var(--czer)" }} />{t("Average score", "Średnia ocena")}</span>
      </div>
    </section>
  );
}

/* ---------- 2b. radar 5 kryteriów (Rabbet: Budget Breakdown) ---------- */
function Radar({ d, t }: { d: DanePanelu; t: (en: string, pl: string) => string }) {
  const przyklad = !d.ostatnia;
  const nazwy = d.ostatnia?.kryteria.map((k) => k.nazwa) ?? (t("x", "pl") === "pl" ? ["Otwarcie", "Pytania", "Obiekcje", "Zamknięcie", "Mentalność"] : ["Opening", "Questions", "Objections", "Closing", "Confidence"]);
  const ost = d.ostatnia?.kryteria.map((k) => k.ocena) ?? [7, 6, 5, 6, 8];
  const sr = d.srednia?.kryteria.map((k) => k.ocena) ?? [6.2, 5.8, 5.1, 5.4, 7];
  const cx = 180, cy = 150, R = 96, n = 5;
  const kat = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number): [number, number] => [cx + Math.cos(kat(i)) * R * (v / 10), cy + Math.sin(kat(i)) * R * (v / 10)];
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <section className="karta radar">
      <div className="hd"><h3>{t("Skills radar", "Radar umiejętności")}{przyklad && <small className="przyk">{t("sample", "przykład")}</small>}</h3><button type="button" className="kropki" aria-label={t("More", "Więcej")}>···</button></div>
      <svg viewBox="0 0 360 300" role="img" aria-label={t("Last call vs average on 5 criteria", "Ostatnia rozmowa i średnia w 5 kryteriach")}>
        {[2, 4, 6, 8, 10].map((v) => <polygon key={v} points={poly(Array(n).fill(v))} className="siatka-r" />)}
        {Array.from({ length: n }, (_, i) => { const [x, y] = pt(i, 10); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="siatka-r" />; })}
        <polygon points={poly(sr)} fill="var(--czer)" fillOpacity=".14" stroke="var(--czer)" strokeWidth="1.6" />
        <polygon points={poly(ost)} fill="var(--lim)" fillOpacity=".16" stroke="var(--lim)" strokeWidth="1.8" />
        {sr.map((v, i) => { const [x, y] = pt(i, v); return <circle key={`s${i}`} cx={x} cy={y} r="3" fill="var(--czer)" />; })}
        {ost.map((v, i) => { const [x, y] = pt(i, v); return <circle key={`o${i}`} cx={x} cy={y} r="3.2" fill="var(--lim)" />; })}
        {nazwy.map((nz, i) => {
          const [x, y] = pt(i, 13.2);
          const anchor = Math.abs(Math.cos(kat(i))) < 0.2 ? "middle" : Math.cos(kat(i)) > 0 ? "start" : "end";
          const roz = ost[i] - sr[i];
          return (
            <g key={nz}>
              <text x={x} y={y - 6} textAnchor={anchor} className="r-naz">{nz}</text>
              <text x={x} y={y + 9} textAnchor={anchor} className="r-wart" style={{ fill: roz >= 0 ? "var(--lim)" : "var(--czer)" }}>{pl(ost[i])} <tspan className="r-roz">({roz >= 0 ? "+" : ""}{pl(roz)})</tspan></text>
            </g>
          );
        })}
      </svg>
      <div className="legenda">
        <span><em style={{ background: "var(--lim)" }} />{t("Last call", "Ostatnia rozmowa")}</span>
        <span><em style={{ background: "var(--czer)" }} />{t("Your average", "Twoja średnia")}</span>
      </div>
    </section>
  );
}

/* ---------- strona ---------- */
export default function PanelC({ d, jasny = false, logo = null }: { d: DanePanelu; jasny?: boolean; logo?: { url: string | null; nazwa: string } | null }) {
  const { t, jezyk } = useT();
  const linki = linkiDla({ ogien: true, statystyki: true, szef: true }, jezyk);
  const wyloguj = useWyloguj();
  const przyklad = d.ocenionych === 0;
  const postacie = d.postacie.map((p, i) => (przyklad ? { ...p, rozmow: [6, 4, 3, 2][i] ?? 1, srednia: [7.2, 6.4, 5.8, 6.9][i] ?? 6 } : p));
  const kryteria = d.ostatnia?.kryteria ?? [
    { nazwa: t("Opening", "Otwarcie"), ocena: 7 }, { nazwa: t("Questions", "Pytania"), ocena: 6 }, { nazwa: t("Objections", "Obiekcje"), ocena: 5 }, { nazwa: t("Closing", "Zamknięcie"), ocena: 6 }, { nazwa: t("Confidence", "Mentalność"), ocena: 8 },
  ];
  const komentarz = (o: number) => (o >= 8 ? t("Strong side. Keep it.", "Mocna strona. Trzymaj.") : o <= 5 ? t("Weakest. Drill today.", "Najsłabsze. Dziś trening.") : t("Fine. One step up next time.", "W porządku. Następnym razem krok wyżej."));
  const obiekcje = [t("Too expensive", "Za drogo"), t("Need to think", "Muszę przemyśleć"), t("We have a supplier", "Mamy dostawcę")];

  return (
    <div className={`bpc ${jasny ? "jasny" : ""}`}>
      <div className="ukl">
        {/* 3. lewy pasek (exon) */}
        <aside className="pasek">
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo?.url ? <img src={logo.url} alt={logo.nazwa} /> : <i />}
            <b>Bruno<span>AI</span></b>
          </div>
          <nav>
            {linki.map((l) => (
              <Link key={l.href} href={l.href} className={l.ikona === "panel" ? "on" : ""} aria-current={l.ikona === "panel" ? "page" : undefined}>
                <Ikona nazwa={l.ikona} rozmiar={17} grubosc={1.9} />
                <span>{l.nazwa}</span>
                {l.ikona === "test" && <em className="live">Live</em>}
                {l.ikona === "feedback" && <em className="kropa" aria-label={t("new", "nowe")} />}
              </Link>
            ))}
          </nav>
          <div className="grow" />
          <nav className="dol">
            <Link href="/bruno/ustawienia"><Ikona nazwa="ustawienia" rozmiar={17} grubosc={1.9} /><span>{t("Help & Support", "Pomoc")}</span></Link>
            <Link href="/bruno/ustawienia"><Ikona nazwa="dostosuj" rozmiar={17} grubosc={1.9} /><span>{t("Settings", "Ustawienia")}</span></Link>
          </nav>
          <div className="plan">
            <b>{t("Today's plan", "Plan dnia")}</b>
            <p>{d.planZrobiony ? t("Done for today.", "Zrobiony na dziś.") : t(`${d.dzis} of ${d.dziennie} calls, ${d.zostaloDzis} left`, `${d.dzis} z ${d.dziennie} rozmów, zostało ${d.zostaloDzis}`)}</p>
            <Link href={d.linkRozmowy} className="btn">{t("Talk to Bruno", "Rozmawiaj")}</Link>
          </div>
          <div className="ja">
            <span className="aw">{d.inicjal}</span>
            <div><b>{d.imie ?? "Bruno"}</b><small>{logo?.nazwa ?? "Bruno AI"}</small></div>
            <button type="button" onClick={wyloguj} aria-label={t("Log out", "Wyloguj")}><Ikona nazwa="wyjscie" rozmiar={16} /></button>
          </div>
        </aside>

        {/* 1. kokpit (Alexatel) */}
        <main>
          <header className="gora">
            <h1>{d.imie ? t(`Hi, ${d.imie}`, `Cześć, ${d.imie}`) : t("My Dashboard", "Mój panel")}</h1>
            <label className="szukaj"><input placeholder={t("Search…", "Szukaj…")} aria-label={t("Search", "Szukaj")} /><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg></label>
            <button type="button" className="okr" aria-label={t("Notifications", "Powiadomienia")}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></svg></button>
            <span className="aw duzy">{d.inicjal}</span>
            <button type="button" className="okr" onClick={wyloguj} aria-label={t("Log out", "Wyloguj")}><Ikona nazwa="wyjscie" rozmiar={17} /></button>
          </header>

          <div className="kol">
            <div className="lewa">
              <Kafle t={t} />
              <Wykres d={d} t={t} jezyk={jezyk} />
              <section className="lista">
                <h3>{t("Your customers", "Twoi klienci")}</h3>
                {postacie.map((p) => (
                  <div className="wiersz" key={p.id}>
                    <span className="ik-okr" style={{ background: p.kolor }}><Ikona nazwa="test" rozmiar={16} grubosc={2} /></span>
                    <div className="kto"><b>{t(`${p.nazwa} customer`, `Klient ${p.nazwa.toLowerCase()}`)}</b><small>{p.rozmow} {rozmowy(p.rozmow, jezyk)}</small></div>
                    <div className="opis"><span>{p.krotko}</span><Link href={`/bruno/rozmowa?postac=${p.id}`} className="link"><Ikona nazwa="strzalka" rozmiar={14} /> {t("Train with this customer", "Trenuj z tym klientem")}</Link></div>
                    <span className={`pig ${p.srednia !== null && p.srednia >= 7 ? "ziel" : "fiol"}`}>{p.srednia !== null ? `${t("avg", "śr.")} ${pl(p.srednia)}` : t("No calls yet", "Jeszcze nic")}</span>
                  </div>
                ))}
              </section>
            </div>

            <aside className="prawa">
              <div className="hd"><h3>{t("Talk to Bruno", "Rozmowa z Bruno")}</h3><Link href={d.linkRozmowy} className="plus">+ {t("Start", "Start")}</Link></div>
              <Link href={d.linkRozmowy} className="operator">
                <span className="aw bruno">B</span>
                <b>Bruno · {t(`${d.postacie[0].nazwa} customer`, `klient ${d.postacie[0].nazwa.toLowerCase()}`)}</b>
                <Ikona nazwa="mikrofon" rozmiar={18} />
                <i>···</i>
              </Link>

              <Radar d={d} t={t} />

              <h3>{t("Feedback", "Feedback")}</h3>
              <ul className="wiad">
                {kryteria.map((k) => (
                  <li key={k.nazwa}>
                    <span className={`aw mala ${k.ocena >= 8 ? "ok" : k.ocena <= 5 ? "zle" : ""}`}>{k.ocena}</span>
                    <div><b>{k.nazwa}</b><small>{komentarz(k.ocena)}</small></div>
                  </li>
                ))}
              </ul>

              <h3>{t("Ask Bruno", "Zapytaj Bruno")}</h3>
              <label className="wpis"><input placeholder={t("How do I handle “too expensive”?", "Jak zbić „za drogo”?")} aria-label={t("Ask Bruno", "Zapytaj Bruno")} /><button type="button" aria-label={t("Send", "Wyślij")}><Ikona nazwa="strzalka" rozmiar={15} grubosc={2} /></button></label>

              <h3>{t("Objections to drill", "Obiekcje do przećwiczenia")}</h3>
              <div className="zetony">
                {obiekcje.map((o) => <span key={o}><em className="aw mini">„</em>{o}<button type="button" aria-label={t("Remove", "Usuń")}>×</button></span>)}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
