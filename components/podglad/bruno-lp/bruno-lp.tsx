"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@vercel/analytics";
import Formularz from "./formularz";
import s from "./bruno-lp.module.css";

// LP Bruno AI, wersja EN (9.10). Mówi do właściciela / dyrektora sprzedaży firmy z zespołem
// handlowców (decyzje 6.10 i 8.10: B2B, rynek UK → IE → USA, amerykański angielski, poziom 12-latki).
// Układ bez zmian: hero = bio-digital.html, reszta = adaptive-learning.html.
// Nazwy 5 kryteriów oceny = lib/bruno/rubryka.ts. Liczby = PLAN.md „Pozycjonowanie / hook”
// (tylko potwierdzone: 47 % vs 76 % MySalesCoach, +170 % RAIN, 58 % vs 47 % RAIN 472 firm).

const VoiceCanvas = dynamic(() => import("./voice-canvas"), { ssr: false });

const KROKI = [
  {
    maly: "Step 1",
    tytul: "Your reps practice\nreal sales calls",
    opis: "Bruno plays your toughest customer. Your product, your market, your objections. Any time, no manager needed.",
  },
  {
    maly: "Step 2",
    tytul: "Every call gets a score\n+ a practice plan",
    opis: "After each call your rep sees what worked and what to fix. Bruno schedules the next practice so the skill does not fade.",
  },
  {
    maly: "Step 3",
    tytul: "They close more\nwith real customers",
    opis: "What your reps practice with Bruno shows up in real calls. You see who practiced and who improved.",
  },
];

const KRYTERIA = ["Opening", "Questions", "Objections", "Closing", "Confidence"];

const KORZYSCI: { liczba: React.ReactNode; tytul: string; opis: string; zrodlo: string }[] = [
  {
    liczba: (
      <>
        47% <span className={s.g}>vs</span> 76%
      </>
    ),
    tytul: "Of quota hit",
    opis: "Reps coached once a quarter hit 47% of quota. Reps coached once a week hit 76%. Bruno coaches your team every day.",
    zrodlo: "MySalesCoach, State of Sales Coaching 2026, 3,700+ reps",
  },
  {
    liczba: "+170%",
    tytul: "Better skill retention",
    opis: "Practice with spaced reviews beats one-off training. Bruno plans the reviews for every rep, so you do not have to.",
    zrodlo: "RAIN Group, sales training reinforcement",
  },
  {
    liczba: (
      <>
        58% <span className={s.g}>vs</span> 47%
      </>
    ),
    tytul: "Of proposals won",
    opis: "Companies that train their reps well win 58% of proposals. The rest win 47%. That gap is your pipeline.",
    zrodlo: "RAIN Group, Top-Performing Sales Organization, 472 companies",
  },
];

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

export default function BrunoLp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pokazFormularz, setPokazFormularz] = useState(false);
  const [menu, setMenu] = useState(false);

  // Numer przycisku leci do Analytics: 1 = pod krokami, 2 = pod korzyściami, 3 = nawigacja.
  const otworzFormularz = (przycisk: number) => () => {
    setMenu(false);
    setPokazFormularz(true);
    track("salesai_cta", { przycisk });
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
              How it works
            </a>
            <a href="#korzysci" onClick={doSekcji("korzysci")}>
              Results
            </a>
          </div>
          {menu && (
            <div className={s.menu}>
              <a href="#kroki" onClick={doSekcji("kroki")}>
                How Bruno AI works
              </a>
              <a href="#korzysci" onClick={doSekcji("korzysci")}>
                Results
              </a>
              <button type="button" onClick={otworzFormularz(3)}>
                Get free access
              </button>
            </div>
          )}
        </div>
        <button type="button" className={`${s.pill} ${s.pillRight}`} onClick={otworzFormularz(3)}>
          <span className={s.dot}>+</span>Try it with my team
        </button>
      </nav>

      {pokazFormularz ? (
        <Formularz onWstecz={() => setPokazFormularz(false)} />
      ) : (
        <>
          <section className={s.intro} id="top">
            <VoiceCanvas className={s.voice} />
            <div className={s.introInner}>
              <div className={s.introLeft}>
                <div className={`${s.eyebrow} ${s.rv}`}>Bruno AI</div>
                <h2 className={`${s.bigH} ${s.rv} ${s.d1}`}>
                  Your sales reps
                  <br />
                  close more with AI.
                </h2>
                <a className={`${s.btnOutline} ${s.rv} ${s.d2}`} href="#kroki" onClick={doSekcji("kroki")}>
                  See the 3 steps
                </a>
              </div>
              <div className={s.introRight}>
                <div className={`${s.trening} ${s.rv} ${s.d2}`}>
                  <p>Reps who get coached:</p>
                  <ul>
                    <li>
                      <span>once a quarter</span> hit <b>47%</b> of quota
                    </li>
                    <li>
                      <span>once a week</span> hit <b>76%</b> of quota
                    </li>
                  </ul>
                  <p className={s.treningBruno}>Bruno AI coaches your team every day</p>
                </div>
                <a className={`${s.btnDark} ${s.rv} ${s.d3}`} href="#korzysci" onClick={doSekcji("korzysci")}>
                  {strzalka}
                  See the numbers
                </a>
              </div>
            </div>
          </section>

          <div className={s.panelWrap} id="kroki">
            <div className={s.panel}>
              {KROKI.map((k, i) => (
                <div className={`${s.row} ${s.rv}`} key={k.tytul}>
                  <div className={s.num}>0{i + 1}</div>
                  <div className={s.meta}>
                    <small>{k.maly}</small>
                    <h3>
                      <Tytul t={k.tytul} />
                    </h3>
                  </div>
                  <div className={s.rowFull}>
                    <p className={s.rowText}>{k.opis}</p>
                    {i === 1 && (
                      <div className={s.critGrid}>
                        {KRYTERIA.map((c) => (
                          <div className={s.crit} key={c}>
                            <b>{c}</b>
                            <span>score 1-10</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className={`${s.panelCta} ${s.rv}`}>
              <button type="button" className={`${s.btnDark} ${s.btnBig}`} onClick={otworzFormularz(1)}>
                Try Bruno with my team
              </button>
            </div>
          </div>

          <section className={s.block} id="korzysci">
            <div className={s.blockHead}>
              <h2 className={s.rv}>Results</h2>
            </div>
            <ul className={s.benefits}>
              {KORZYSCI.map((k, i) => (
                <li className={`${s.benefit} ${s.rv} ${i === 1 ? s.d1 : i === 2 ? s.d2 : ""}`} key={k.tytul}>
                  <span className={s.idx}>0{i + 1}</span>
                  <div className={s.benefitNum}>{k.liczba}</div>
                  <h3>{k.tytul}</h3>
                  <p>{k.opis}</p>
                  <span className={s.src}>Source: {k.zrodlo}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className={s.cta}>
            <div>
              <h2 className={s.rv}>
                Give your team Bruno.
                <br />
                <span className={s.g}>Free for 7 days.</span>
              </h2>
              <div className={`${s.ctaBtns} ${s.rv} ${s.d1}`}>
                <button type="button" className={`${s.btnDark} ${s.btnBig}`} onClick={otworzFormularz(2)}>
                  Get free access
                </button>
              </div>
            </div>
            <div className={`${s.side} ${s.rv} ${s.d2}`}>
              <p>
                One account for you, the sales leader, to test for 7 days. No card. After a quick check we send you the
                login within 24 hours.
              </p>
              <div className={s.founder}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jakub.jpg" alt="Jakub Chodakowski" width={46} height={46} />
                <div>
                  <b>Jakub Chodakowski</b>
                  <span>Founder, Bruno AI</span>
                </div>
              </div>
            </div>
          </div>

          <footer className={s.footer}>
            <span>Bruno AI</span>
            <span>AI sales practice for teams</span>
          </footer>
        </>
      )}
    </div>
  );
}
