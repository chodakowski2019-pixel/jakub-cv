"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@vercel/analytics";
import Formularz from "./formularz";
import Rezerwacja from "./rezerwacja";
import s from "./bruno-lp.module.css";

// LP Bruno AI, wersja EN (9.10). Mówi do właściciela / dyrektora sprzedaży firmy z zespołem
// handlowców (decyzje 6.10 i 8.10: B2B, rynek UK → IE → USA, amerykański angielski, poziom 12-latki).
// Układ bez zmian: hero = bio-digital.html, reszta = adaptive-learning.html.
// Nazwy 5 kryteriów oceny = lib/bruno/rubryka.ts. Liczby = PLAN.md „Pozycjonowanie / hook”
// Kafelki „Co daje trening sprzedaży?” od 9.10: CSO Insights 2019 (str. 36) i 2015. Hero: 47 % vs 76 % MySalesCoach 2026.

const VoiceCanvas = dynamic(() => import("./voice-canvas"), { ssr: false });

export type Wersja = "business" | "reps";

type Teksty = {
  linkInny: { href: string; tekst: string };
  navCta: string;
  menuCta: string;
  hero: [string, string];
  treningDol: string;
  kroki: { maly: string; tytul: string; opis: string }[];
  krokiCta: string;
  korzysciOpis: [string, string, string];
  korzysciH: string;
  ctaH: [string, string];
  ctaBtn: string;
  ctaBok: string;
  stopka: string;
};

// 9.10 (USER_001, wariant A): dwie podstrony, jeden wygląd. /brunobusiness = prezes / dyrektor
// sprzedaży (B2B, główny kanał), /brunoai = handlowiec (B2C). Teksty: amerykański angielski, poziom 12-latki.
const TEKSTY_EN: Record<Wersja, Teksty> = {
  business: {
    linkInny: { href: "/brunoai", tekst: "For sales reps" },
    navCta: "Book a demo call",
    menuCta: "Book a demo call",
    hero: ["Your sales reps", "close more with AI."],
    treningDol: "Bruno AI coaches your team every day",
    kroki: [
      { maly: "Step 1", tytul: "Your reps practice\nreal sales calls", opis: "AI plays your toughest customer. Your product, your market, your objections." },
      { maly: "Step 2", tytul: "Your rep gets feedback\n+ a review plan", opis: "Bruno coaches each rep 1:1. Then it builds a review plan just for them." },
      { maly: "Step 3", tytul: "Your rep\nimproves results", opis: "It shows in real calls. You see who practiced and who improved." },
    ],
    krokiCta: "Book a 30-minute demo",
    korzysciH: "What sales training gives you",
    korzysciOpis: [
      "Companies that coach reps regularly, on a plan, win 32% more forecast deals than companies that leave coaching to chance.",
      "Regular, structured coaching lifts quota attainment by 28% compared with coaching that happens only now and then.",
      "Companies that invest the most in training earn 218% more income per employee and have 24% higher profit margins than those that invest the least.",
    ],
    ctaH: ["Give your team Bruno.", "Start with one month."],
    ctaBtn: "Book a demo call",
    ctaBok: "For the first month you test Bruno with your own team. If you stay, we sign a contract from 3 months.",
    stopka: "AI sales practice for teams",
  },
  reps: {
    linkInny: { href: "/brunobusiness", tekst: "For teams" },
    navCta: "Try it free",
    menuCta: "Get free access",
    hero: ["Practice your next call", "before it counts."],
    treningDol: "Bruno AI coaches you every day",
    kroki: [
      { maly: "Step 1", tytul: "You practice\nreal sales calls", opis: "Bruno plays a tough customer. Your product, your market, your objections. Any time, on your own." },
      { maly: "Step 2", tytul: "You get feedback\n+ a review plan", opis: "After each call you see what worked and what to fix. Bruno schedules your next practice so the skill sticks." },
      { maly: "Step 3", tytul: "You walk into real calls\nready", opis: "The objections you practiced with Bruno do not surprise you on a real call. You know your next line." },
    ],
    krokiCta: "Try Bruno free",
    korzysciH: "What sales training gives you",
    korzysciOpis: [
      "Reps coached regularly, on a plan, win 32% more forecast deals than reps coached only by chance.",
      "Regular, structured coaching lifts quota attainment by 28% compared with coaching that happens only now and then.",
      "Companies that invest the most in training earn 218% more income per employee than those that invest the least. Pick a company that invests in you.",
    ],
    ctaH: ["Practice with Bruno.", "Free for 3 days."],
    ctaBtn: "Get free access",
    ctaBok: "One account, 3 days, no card. We send you the login within 24 hours.",
    stopka: "AI sales practice for reps",
  },
};

const TEKSTY_PL: Record<Wersja, Teksty> = {
  business: {
    linkInny: { href: "/brunoai", tekst: "Dla handlowców" },
    navCta: "Umów rozmowę z demo",
    menuCta: "Umów rozmowę z demo",
    hero: ["Twoi handlowcy", "domykają więcej z AI."],
    treningDol: "Bruno AI trenuje Twój zespół codziennie",
    kroki: [
      { maly: "Krok 1", tytul: "Twoi handlowcy ćwiczą\nprawdziwe rozmowy", opis: "AI gra Twojego najtrudniejszego klienta. Twój produkt, Twój rynek, Twoje obiekcje." },
      { maly: "Krok 2", tytul: "Handlowiec otrzymuje feedback\n+ plan powtórek", opis: "Bruno trenuje handlowca 1:1. Następnie planuje dla niego system powtórek." },
      { maly: "Krok 3", tytul: "Handlowiec\npoprawia wyniki", opis: "Widać to w prawdziwych rozmowach. Widzisz, kto ćwiczył i kto się poprawił." },
    ],
    krokiCta: "Umów 30-minutowe demo",
    korzysciH: "Co daje trening sprzedaży?",
    korzysciOpis: [
      "Firmy, które trenują handlowców regularnie, według planu, wygrywają o 32% więcej szans sprzedaży niż firmy, w których trening zależy od przypadku.",
      "Regularny trening według planu podnosi realizację planu o 28% w porównaniu z treningiem od czasu do czasu.",
      "Firmy, które najwięcej inwestują w szkolenia, mają o 218% wyższy dochód na pracownika i o 24% wyższą marżę niż firmy, które inwestują najmniej.",
    ],
    ctaH: ["Daj zespołowi Bruno.", "Zacznij od jednego miesiąca."],
    ctaBtn: "Umów rozmowę z demo",
    ctaBok: "Pierwszy miesiąc sprawdzasz Bruno na swoim zespole. Jeśli zostajecie, podpisujemy umowę od 3 miesięcy.",
    stopka: "Trening sprzedaży z AI dla zespołów",
  },
  reps: {
    linkInny: { href: "/brunobusiness", tekst: "Dla firm" },
    navCta: "Wypróbuj za darmo",
    menuCta: "Odbierz darmowy dostęp",
    hero: ["Przećwicz kolejną rozmowę,", "zanim zacznie się liczyć."],
    treningDol: "Bruno AI trenuje Cię codziennie",
    kroki: [
      { maly: "Krok 1", tytul: "Ćwiczysz\nprawdziwe rozmowy", opis: "Bruno gra trudnego klienta. Twój produkt, Twój rynek, Twoje obiekcje. O każdej porze, sam." },
      { maly: "Krok 2", tytul: "Otrzymujesz feedback\n+ plan powtórek", opis: "Po każdej rozmowie widzisz, co zagrało, a co poprawić. Bruno planuje kolejny trening, żeby umiejętność została." },
      { maly: "Krok 3", tytul: "Wchodzisz w prawdziwe rozmowy\ngotowy", opis: "Obiekcje przećwiczone z Bruno nie zaskoczą Cię w prawdziwej rozmowie. Wiesz, co powiedzieć." },
    ],
    krokiCta: "Wypróbuj Bruno za darmo",
    korzysciH: "Co daje trening sprzedaży?",
    korzysciOpis: [
      "Handlowcy trenowani regularnie, według planu, wygrywają o 32% więcej szans sprzedaży niż trenowani od przypadku do przypadku.",
      "Regularny trening według planu podnosi realizację planu o 28% w porównaniu z treningiem od czasu do czasu.",
      "Firmy, które najwięcej inwestują w szkolenia, mają o 218% wyższy dochód na pracownika niż te, które inwestują najmniej. Wybieraj firmę, która inwestuje w Ciebie.",
    ],
    ctaH: ["Ćwicz z Bruno.", "3 dni za darmo."],
    ctaBtn: "Odbierz darmowy dostęp",
    ctaBok: "Jedno konto, 3 dni, bez karty. Login wysyłamy w ciągu 24 godzin.",
    stopka: "Trening sprzedaży z AI dla handlowców",
  },
};

export type Jezyk = "en" | "pl";
// 9.10 (USER_001: „daj wszystko po polsku, żebym wiedział, jak to wygląda”): podgląd po polsku pod `?pl`.
// Rynek docelowy dalej EN (decyzja 8.10), PL służy do czytania i do laboratorium w Polsce.
const TEKSTY: Record<Jezyk, Record<Wersja, Teksty>> = { en: TEKSTY_EN, pl: TEKSTY_PL };

const UI = {
  en: { jak: "How it works", wyniki: "Benefits", jakBruno: "How Bruno AI works", krokiH: "How does Bruno AI work?", kroki3: "See the 3 steps", trenowani: "Reps who get coached:", kwartal: "once a quarter", tydzien: "once a week", robia: "hit", planu: "of quota", liczby: "See the numbers", ocena: "score 1-10", zrodlo: "Source:", zalozyciel: "Founder, Bruno AI", kryteria: ["Opening", "Questions", "Objections", "Closing", "Confidence"], korzysci: [["You win more deals", "CSO Insights, 2019 Sales Enablement Study, 900+ companies"], ["More reps hit quota", "CSO Insights, 2019 Sales Enablement Study, 900+ companies"], ["Training pays for itself", "ASTD, Profiting From Learning, 575 companies"]], vs: "vs" },
  pl: { jak: "Jak to działa", wyniki: "Korzyści", jakBruno: "Jak działa Bruno AI", krokiH: "Jak działa Bruno AI?", kroki3: "Zobacz 3 kroki", trenowani: "Handlowcy trenują sprzedaż:", kwartal: "raz na kwartał", tydzien: "raz w tygodniu", robia: "robią", planu: "planu", liczby: "Zobacz liczby", ocena: "ocena 1-10", zrodlo: "Źródło:", zalozyciel: "Założyciel, Bruno AI", kryteria: ["Otwarcie", "Pytania", "Obiekcje", "Zamknięcie", "Pewność siebie"], korzysci: [["Wygrywasz więcej transakcji", "CSO Insights, 2019 Sales Enablement Study, ponad 900 firm"], ["Więcej handlowców robi plan", "CSO Insights, 2019 Sales Enablement Study, ponad 900 firm"], ["Trening się zwraca", "ASTD, Profiting From Learning, 575 firm"]], vs: "vs" },
} as const;

// Liczby i źródła wspólne dla obu wersji, opisy w TEKSTY[wersja].korzysciOpis.
const KORZYSCI: { liczba: React.ReactNode }[] = [
  // 9.10 (USER_001: „trzeba inne badania”): dane sprawdzone w raporcie CSO Insights 2019, str. 36
  // (ponad 900 firm: coaching „dynamiczny” vs „przypadkowy”) i w CSO Insights 2015 (rotacja handlowców, za SBI).
  { liczba: "+32%" },
  { liczba: "+28%" },
  // ASTD „Profiting From Learning” 2000: górny vs dolny kwartyl wydatków na szkolenia, 575 firm.
  { liczba: "218%" },
]

// 9.10 (USER_001): pasek „wow” pod hero: 78%. +32% i 218% przeniesione do kafelków (USER_001). Źródła sprawdzone:
// Ebsta x Pavilion GTM Benchmarks 2025; CSO Insights 2019 str. 36 (dynamiczny vs przypadkowy coaching);
// ASTD „Profiting From Learning” 2000 (575 firm, górny vs dolny kwartyl wydatków na szkolenia).
const PASEK: Record<"en" | "pl", { liczba: string; tekst: string; zrodlo: string }[]> = {
  en: [
    { liczba: "78%", tekst: "of sales reps missed quota in 2025", zrodlo: "Ebsta x Pavilion, GTM Benchmarks 2025" },
  ],
  pl: [
    { liczba: "78%", tekst: "handlowców nie zrobiło planu w 2025 roku", zrodlo: "Ebsta x Pavilion, GTM Benchmarks 2025" },
  ],
};

// \n w tytule = łamanie wiersza tylko na szerokim ekranie.
function Tytul({ t }: { t: string }) {
  const [a, b] = t.split("\n");
  return b ? (
    <>
      {a} {b}
    </>
  ) : (
    <>{a}</>
  );
}

export default function BrunoLp({ wersja = "business" }: { wersja?: Wersja }) {
  const [jezyk, setJezyk] = useState<Jezyk>("en");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has("pl") || q.get("lang") === "pl") setJezyk("pl");
  }, []);
  const t = TEKSTY[jezyk][wersja];
  const u = UI[jezyk];
  const KROKI = t.kroki;
  const rootRef = useRef<HTMLDivElement>(null);
  const [pokazFormularz, setPokazFormularz] = useState(false);
  const [menu, setMenu] = useState(false);

  // Numer przycisku leci do Analytics: 1 = pod krokami, 2 = pod korzyściami, 3 = nawigacja.
  const otworzFormularz = (przycisk: number) => () => {
    setMenu(false);
    setPokazFormularz(true);
    track("salesai_cta", { przycisk, wersja });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    try {
      CSS.registerProperty({ name: "--blp-a", syntax: "<angle>", inherits: false, initialValue: "0deg" });
    } catch {}
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(s.in);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    root.querySelectorAll(`.${s.rv}`).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add(s.in);
      else io.observe(el);
    });
    return () => io.disconnect();
  }, [pokazFormularz]);

  useEffect(() => {
    if (!menu) return;
    const zamknij = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", zamknij);
    return () => window.removeEventListener("keydown", zamknij);
  }, [menu]);

  const doSekcji = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu(false);
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    if (pokazFormularz) {
      setPokazFormularz(false);
      requestAnimationFrame(() => requestAnimationFrame(go));
    } else go();
  };

  const strzalka = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M12 4v16m0 0-6-6m6 6 6-6" />
    </svg>
  );

  return (
    <div className={s.root} ref={rootRef}>
      <nav className={s.nav}>
        <div className={s.navL}>
          <a className={s.logo} href="#top" onClick={doSekcji("top")}>
            Bruno AI
          </a>
          <button
            type="button"
            className={`${s.pill} ${s.pillBlack}`}
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            <span className={`${s.dot} ${menu ? s.dotOpen : ""}`}>+</span>Menu
          </button>
          <div className={`${s.pill} ${s.pillLight}`}>
            <a href="#kroki" onClick={doSekcji("kroki")}>
              {u.jak}
            </a>
            <a href="#korzysci" onClick={doSekcji("korzysci")}>
              {u.wyniki}
            </a>
            <a href={t.linkInny.href}>{t.linkInny.tekst}</a>
          </div>
          {menu && (
            <div className={s.menu}>
              <a href="#kroki" onClick={doSekcji("kroki")}>
                {u.jakBruno}
              </a>
              <a href="#korzysci" onClick={doSekcji("korzysci")}>
                {u.wyniki}
              </a>
              <button type="button" onClick={otworzFormularz(3)}>
                {t.menuCta}
              </button>
              <a href={t.linkInny.href}>{t.linkInny.tekst}</a>
            </div>
          )}
        </div>
        <button type="button" className={`${s.pill} ${s.pillRight}`} onClick={otworzFormularz(3)}>
          <span className={s.dot}>+</span>{t.navCta}
        </button>
      </nav>

      {pokazFormularz ? (
        wersja === "business" ? (
          // 9.10 (USER_001): firmy umawiają 30-minutową rozmowę z demo zamiast formularza.
          <Rezerwacja jezyk={jezyk} onWstecz={() => setPokazFormularz(false)} />
        ) : (
          <Formularz wersja={wersja} jezyk={jezyk} onWstecz={() => setPokazFormularz(false)} />
        )
      ) : (
        <>
          <section className={s.intro} id="top">
            <VoiceCanvas className={s.voice} />
            <div className={s.introInner}>
              <div className={s.introLeft}>
                <h2 className={`${s.bigH} ${s.rv} ${s.d1}`}>
                  {t.hero[0]}
                  <br />
                  {t.hero[1]}
                </h2>
                <a className={`${s.btnOutline} ${s.rv} ${s.d2}`} href="#kroki" onClick={doSekcji("kroki")}>
                  {u.kroki3}
                </a>
              </div>
              <div className={s.introRight}>
                <div className={`${s.trening} ${s.rv} ${s.d2}`}>
                  <p>{u.trenowani}</p>
                  <ul>
                    <li>
                      <span>{u.kwartal}</span> {u.robia} <b>47%</b> {u.planu}
                    </li>
                    <li>
                      <span>{u.tydzien}</span> {u.robia} <b>76%</b> {u.planu}
                    </li>
                  </ul>
                  <p className={s.treningBruno}>{t.treningDol}</p>
                </div>
                <a className={`${s.btnDark} ${s.rv} ${s.d3}`} href="#korzysci" onClick={doSekcji("korzysci")}>
                  {strzalka}
                  {u.liczby}
                </a>
              </div>
            </div>
          </section>

          <section className={s.wow} aria-label={jezyk === "pl" ? "Liczby" : "Numbers"}>
            {PASEK[jezyk].map((w, i) => (
              <div className={`${s.wowItem} ${s.rv} ${i === 1 ? s.d1 : i === 2 ? s.d2 : ""}`} key={w.liczba}>
                <div className={s.wowNum}>{w.liczba}</div>
                <p className={s.wowTxt}>{w.tekst}</p>
                <span className={s.src}>{u.zrodlo} {w.zrodlo}</span>
              </div>
            ))}
          </section>

          <section className={s.block} id="korzysci">
            <div className={s.blockHead}>
              <h2 className={s.rv}>{t.korzysciH}</h2>
            </div>
            <ul className={s.benefits}>
              {KORZYSCI.map((k, i) => (
                <li className={`${s.benefit} ${s.rv} ${i === 1 ? s.d1 : i === 2 ? s.d2 : ""}`} key={i}>
                  <span className={s.idx}>0{i + 1}</span>
                  <div className={s.benefitNum}>{k.liczba}</div>
                  <h3>{u.korzysci[i][0]}</h3>
                  <p>{t.korzysciOpis[i]}</p>
                  <span className={s.src}>{u.zrodlo} {u.korzysci[i][1]}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className={s.panelWrap} id="kroki">
            {/* 9.10 (USER_001): nagłówek jak „Co daje trening sprzedaży?”. */}
            <div className={`${s.blockHead} ${s.krokiHead}`}>
              <h2 className={s.rv}>{u.krokiH}</h2>
            </div>
            <div className={s.panel}>
              {KROKI.map((k, i) => (
                <div className={`${s.row} ${s.rv}`} key={i}>
                  <div className={s.num}>0{i + 1}</div>
                  <div className={s.meta}>
                    <h3>
                      <Tytul t={k.tytul} />
                    </h3>
                  </div>
                  <div className={s.rowFull}>
                    <p className={s.rowText}>{k.opis}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={`${s.panelCta} ${s.rv}`}>
              <button type="button" className={`${s.btnDark} ${s.btnBig}`} onClick={otworzFormularz(1)}>
                {t.krokiCta}
              </button>
            </div>
          </div>

          <div className={s.cta}>
            <div>
              <h2 className={s.rv}>
                {t.ctaH[0]}
                <br />
                <span className={s.g}>{t.ctaH[1]}</span>
              </h2>
              <div className={`${s.ctaBtns} ${s.rv} ${s.d1}`}>
                <button type="button" className={`${s.btnDark} ${s.btnBig}`} onClick={otworzFormularz(2)}>
                  {t.ctaBtn}
                </button>
              </div>
            </div>
            <div className={`${s.side} ${s.rv} ${s.d2}`}>
              <p>{t.ctaBok}</p>
              <div className={s.founder}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jakub.jpg" alt="Jakub Chodakowski" width={46} height={46} />
                <div>
                  <b>Jakub Chodakowski</b>
                  <span>{u.zalozyciel}</span>
                </div>
              </div>
            </div>
          </div>

          <footer className={s.footer}>
            <span>Bruno AI</span>
            <span>{t.stopka}</span>
          </footer>
        </>
      )}
    </div>
  );
}
