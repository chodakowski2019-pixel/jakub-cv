"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// Planeta (three.js, ok. 600 kB) ładowana po stronie przeglądarki, po treści (9.10).
const Planet = dynamic(() => import("./Planet"), { ssr: false });
import "./glowna.css";

// Treść z public/home.html (strona główna od 5.10), przetłumaczona na polski 6.10.
const PHOTO = "/profilowe_jakub.png";
const EMAIL = "hello@jakubchodakowski.com";
const LINKEDIN = "https://www.linkedin.com/in/jakub-chodakowski";
// 9.10 (USER_001): przyciski prowadzą na podstrony. Adresy podglądu, do podmiany przy przenosinach na prawdziwe adresy.
const BRUNO_LP = "/brunobusiness";
const PRACA = "/praca";
const HANDLOWCY = "/handlowcy";

// 9.10: zdjęcie w każdym kafelku. img: null = miejsce na zdjęcie (czeka na plik od USER_001).
const MILESTONES: { d: string; t: string; img: string | null; alt: string; logo?: "instagram" | "obraz" }[] = [
  { d: "Maj 2024", t: "Kurs AI Manager u Marii Parysz, która prowadziła projekty AI w Rolls-Royce i Sephorze.", img: "/cert-ai-managers.png", alt: "Certyfikat AI Manager" },
  { d: "Sierpień 2024", t: "Wystąpienie na CRASH Mondays: jak używać AI i danych w nowoczesnej sprzedaży. Prawdziwe przypadki z Żabki i Netflixa.", img: "/talk-crash-mondays.png", alt: "Wystąpienie na CRASH Mondays" },
  { d: "Marzec 2025", t: "Uruchomiłem agenta AI na Instagramie, który sam prowadzi rozmowy z leadami w wiadomościach.", img: null, alt: "Agent AI na Instagramie", logo: "instagram" },
  { d: "Czerwiec 2026", t: "Zbudowałem Bruno AI, głosowego sparingpartnera, który trenuje handlowców na rozmowach na żywo z klientem AI.", img: "/logo-doneclips.png", alt: "Logo", logo: "obraz" },
];

const Arrow = () => (
  <span className="ic">
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 7h10M8 3l4 4-4 4" /></svg>
  </span>
);
const Down = () => (
  <span className="ic">
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
  </span>
);

export default function GlownaPage({ fontClass }: { fontClass: string }) {
  const root = useRef<HTMLDivElement>(null);
  // 9.10 (USER_001): klik w zdjęcie = powiększenie na cały ekran, klik albo Esc zamyka.
  const [duze, setDuze] = useState<{ src: string; alt: string } | null>(null);
  useEffect(() => {
    if (!duze) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setDuze(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [duze]);

  // pojawianie sie przy scrollu (jak w Bloom), czat wchodzi dymek po dymku
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("on");
          io.unobserve(e.target);
        }),
      { threshold: 0.15 },
    );
    el.querySelectorAll<HTMLElement>(".reveal").forEach((n, i) => {
      n.style.transitionDelay = (i % 4) * 90 + "ms";
      io.observe(n);
    });
    el.querySelectorAll<HTMLElement>(".chat").forEach((c) => {
      c.querySelectorAll<HTMLElement>(".msg").forEach((m, i) => (m.style.transitionDelay = 250 + i * 450 + "ms"));
      io.observe(c);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className={`pgg ${fontClass}`} ref={root} lang="pl">
      {/* 1. HERO */}
      <header className="hero">
        <Planet className="planet" />
        <div className="hero-grid">
          <div className="card-main glass in">
            <span className="breath" aria-hidden="true" />
            <div className="cm-body">
              <svg className="flower in d1" viewBox="0 0 60 60" aria-hidden="true">
                <defs>
                  <linearGradient id="pgg-pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9fff1" /><stop offset=".5" stopColor="#5eead4" /><stop offset="1" stopColor="#2bb3a0" /></linearGradient>
                </defs>
                <g className="flower-spin">
                  <g fill="url(#pgg-pg)">
                    <rect x="6" y="6" width="22" height="22" rx="11" ry="11" />
                    <rect x="32" y="6" width="22" height="22" rx="11" />
                    <rect x="6" y="32" width="22" height="22" rx="11" />
                    <rect x="32" y="32" width="22" height="22" rx="11" />
                  </g>
                  <circle cx="30" cy="30" r="4" fill="#04140f" opacity=".55" />
                </g>
              </svg>
              <h1 className="in d2 h1-2"><span>Twoi handlowcy</span> <em>domykają więcej z AI</em></h1>
              <p className="lead-hero in d3">Handlowcy trenowani raz na kwartał robią 47% planu, raz w tygodniu 76%. Zbudowałem AI, które trenuje ich codziennie.</p>
              <p className="src-hero in d3">Źródło: MySalesCoach, badanie 3 700 handlowców, 2026</p>
            </div>

          </div>

          <div className="side">
            <div className="side-top in d2">
              <div className="side-r">
                <a href={`mailto:${EMAIL}`} className="icon-btn" aria-label="Email">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 7l8.5 6 8.5-6" /></svg>
                </a>
                <a href={LINKEDIN} className="icon-btn" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3V9.75zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.04c0-1.2-.02-2.75-1.68-2.75-1.68 0-1.94 1.31-1.94 2.66V21h-4V9.75z" /></svg>
                </a>
              </div>
            </div>

            <div className="photo-col">
            <a href="#story" className="hero-photo glass in d3">
              <span className="ph"><Image src={PHOTO} alt="Jakub Chodakowski" fill sizes="(max-width: 960px) 80vw, 360px" priority /></span>
              <span className="cap">
                <b>Jakub Chodakowski</b>
              </span>
            </a>
              <div className="cm-btns photo-btns in d4">
                <a href="#contact" className="btn solid">Porozmawiajmy <Arrow /></a>
                <a href="#story" className="btn">Moja historia <Down /></a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* 2. SALES FIRST */}
        <section className="sec" id="story">
          <div className="story">
            <div>
              <span className="sec-label reveal">Najpierw sprzedaż</span>
              <h2 className="reveal">Zaczynałem od <em>telefonów</em></h2>
              <p className="lead reveal">Szkoliłem się w startupach. Robiłem wszystkiego po trochu, ale w centrum zawsze była sprzedaż. Zimne telefony, prezentacje, przypomnienia, domykanie.</p>
              <p className="lead reveal">Prowadziłem własną firmę. Sprzedawałem klientom B2B, negocjowałem kontrakty i budowałem lejki sprzedażowe od zera.</p>
              <p className="lead reveal">Jedną rzecz zrozumiałem na własnej skórze. Transakcje wygrywa się albo przegrywa w rozmowie. A większość handlowców nigdy nie ćwiczy tej rozmowy, zanim będzie na serio.</p>
              <div className="tags reveal">
                <span className="tag">Sprzedaż B2B</span><span className="tag">Zimne telefony</span><span className="tag">Negocjacje</span><span className="tag">Lejki sprzedażowe</span><span className="tag">Własna firma</span>
              </div>
            </div>
            <div className="portrait reveal">
              <button type="button" className="zoom" onClick={() => setDuze({ src: PHOTO, alt: "Jakub Chodakowski" })} aria-label="Powiększ zdjęcie">
                <Image src={PHOTO} alt="Portret Jakuba Chodakowskiego" fill sizes="(max-width: 960px) 100vw, 480px" />
              </button>
              <div className="cap">
                <div><b>Jakub Chodakowski</b><span>Sprzedaż + AI</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TURNING POINT */}
        <section className="sec turn">
          <div className="date reveal">30 listopada 2022</div>
          <h2 className="reveal turn-h">Premiera ChatGPT</h2>
          <p className="lead reveal">Od tego dnia wszystko się zmieniło. Zawsze interesowałem się technologią, ale gdy pierwszy raz dostałem dostęp do AI, wiedziałem, że zmieni to cały nasz świat, a tym bardziej sprzedaż.</p>
        </section>

        {/* 4. SALES + AI */}
        <section className="sec" id="ai">
          <span className="sec-label reveal">Sprzedaż + AI</span>
          <h2 className="reveal">Nowe zasady <em>sprzedaży</em></h2>
          <div className="period reveal">Grudzień 2022 <b>do</b> dziś</div>
          <p className="lead reveal">Od pierwszego dnia zacząłem budować z AI. Nie czytać o nim. Budować. Testować. Wdrażać.</p>
          <p className="lead reveal">Zbudowałem agentów AI, którzy odpowiadają leadom całą dobę, automatyzacje, które prowadzą pierwszy kontakt i przypomnienia, oraz narzędzia, które aktualizują CRM bez ręcznego wpisywania.</p>
          <p className="lead reveal">Dziś łączę obie strony. Wiem, jak wygląda rozmowa sprzedażowa, bo sam je prowadziłem. I wiem, jak zbudować AI, które sprawi, że następna będzie lepsza.</p>
          <div className="tags reveal" style={{ justifyContent: "flex-start" }}>
            <span className="tag on">Trening rozmów z AI</span><span className="tag on">Agenci AI</span><span className="tag on">Automatyzacja kontaktu</span><span className="tag on">Automatyzacja CRM</span><span className="tag on">AI głosowe</span>
          </div>
          <div className="facts">
            {MILESTONES.map((m) => (
              <div key={m.d} className="fact glass reveal">
                <div className={`fact-img${m.logo ? " fact-logo" : ""}${m.logo === "instagram" ? " fact-ig" : ""}`}>
                  {m.logo === "instagram" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-label="Instagram" role="img">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4.2" />
                      <circle cx="17.4" cy="6.6" r="1.1" fill="#fff" stroke="none" />
                    </svg>
                  ) : m.img ? (
                    <button type="button" className="zoom" onClick={() => setDuze({ src: m.img!, alt: m.alt })} aria-label={`Powiększ: ${m.alt}`}>
                      <Image src={m.img} alt={m.alt} fill sizes="(max-width: 600px) 100vw, 280px" />
                    </button>
                  ) : (
                    <span>Zdjęcie: {m.alt}</span>
                  )}
                </div>
                <b>{m.d}</b>
                <span>{m.t}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. JAK MOGĘ CI POMÓC (9.10, USER_001): wygląd jak dawna sekcja „Co buduję" (etykieta, duży nagłówek, opis, przycisk), dwa takie bloki jeden pod drugim. */}
        <section className="sec" id="bruno">
          <span className="sec-label reveal">Jak mogę Ci pomóc?</span>
          <h2 className="reveal">Bruno <em>AI</em></h2>
          <p className="lead reveal">Klient AI, z którym Twoi handlowcy ćwiczą rozmowy, zanim zadzwonią do prawdziwego.</p>
          <div className="bruno-cta reveal">
            <a className="btn solid" href={BRUNO_LP}>Dowiedz się więcej <Arrow /></a>
          </div>
        </section>

        <section className="sec" id="praca">
          <h2 className="reveal">Znajdź <em>pracę</em></h2>
          <p className="lead reveal">Oferty pracy dla handlowców z całego świata.</p>
          <div className="bruno-cta reveal">
            <a className="btn solid" href={PRACA}>Szukaj ofert <Arrow /></a>
          </div>
        </section>

        <section className="sec" id="handlowcy">
          <h2 className="reveal">Znajdź <em>handlowca</em></h2>
          <p className="lead reveal">Handlowcy z całego świata.</p>
          <div className="bruno-cta reveal">
            <a className="btn solid" href={HANDLOWCY}>Szukaj handlowców <Arrow /></a>
          </div>
        </section>

        {/* 8. CONTACT */}
        <section className="sec" id="contact">
          <div className="contact glass reveal">
            <span className="sec-label">Kontakt</span>
            <h2>Domykajmy więcej<br /><em>Od tego tygodnia</em></h2>
            <p className="lead">Chcesz, żeby Twój zespół domykał więcej dzięki AI? Napisz do mnie. Porozmawiajmy o Twoim zespole i Twoich liczbach.</p>
            <div className="acts">
              <a href={`mailto:${EMAIL}`} className="btn solid">{EMAIL} <Arrow /></a>
              <a href={LINKEDIN} className="btn" target="_blank" rel="noopener noreferrer">LinkedIn <Arrow /></a>
            </div>
          </div>
        </section>
      </main>

      {duze && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={duze.alt} onClick={() => setDuze(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={duze.src} alt={duze.alt} />
          <button type="button" className="lightbox-x" aria-label="Zamknij" onClick={() => setDuze(null)}>×</button>
        </div>
      )}

      <footer>
        <span>Jakub Chodakowski © 2026 · NIP 6711845485</span>
        <nav className="foot-links" aria-label="Dokumenty">
          <a href="/regulamin">Regulamin</a>
          <a href="/polityka-prywatnosci">Polityka prywatności</a>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </nav>
      </footer>
    </div>
  );
}
