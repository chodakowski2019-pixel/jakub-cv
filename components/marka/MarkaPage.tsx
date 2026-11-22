"use client";

// 22.11.2026: strona marki osobistej (podgląd /podglad/marka). Treść w dane.ts, wygląd w marka.css.
// Efekty: płynna kula limonkowa (shader z Bruno), karty wyboru ze światłem pod kursorem i lekkim przechyłem,
// paski rozwijane płynnie (grid 0fr → 1fr), szklany pasek u góry, wejście sekcji przy przewijaniu.
// Wszystko wyłącza się przy ograniczonym ruchu w systemie.

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import KulaLimonka from "@/components/bruno/kula-limonka";
import { MARKA, START, PASKI, O_MNIE, FIRMY, KAZDY, PODCAST, ROLKI, PROJEKTY, MATERIALY, NEWSLETTER } from "./dane";
import { UstawieniaCookies } from "@/components/analityka/Zgoda";
import Formularz from "@/components/szkolenia-ai/Formularz";
import { FORMULARZ } from "@/components/szkolenia-ai/dane";
import "./marka.css";

function Zapis({ przycisk, maly = false }: { przycisk: string; maly?: boolean }) {
  const [wyslane, setWyslane] = useState(false);
  const wyslij = (e: FormEvent) => {
    e.preventDefault();
    setWyslane(true);
  };
  return (
    <form className={`mk-zapis${maly ? " mk-zapis-maly" : ""}`} onSubmit={wyslij}>
      <label className="mk-ukryte" htmlFor={maly ? "mk-mail-2" : "mk-mail"}>Adres e-mail</label>
      <input id={maly ? "mk-mail-2" : "mk-mail"} type="email" required placeholder="Adres e-mail" autoComplete="email" />
      <button type="submit" className="mk-btn mk-btn-czarny">
        <span className="mk-plus" aria-hidden>+</span>
        {przycisk}
      </button>
      {wyslane && <p className="mk-zapis-info" role="status">{NEWSLETTER.podglad}</p>}
    </form>
  );
}

// 22.11: druga linia nagłówka zmienia się co 2,8 s. Wszystkie wersje leżą w jednej komórce siatki,
// więc szerokość i wysokość się nie zmieniają (strona nie skacze). Czytnik ekranu dostaje pełne zdanie raz.
function Zmiennik({ teksty }: { teksty: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % teksty.length), 2800);
    return () => clearInterval(t);
  }, [teksty.length]);
  return (
    <span className="mk-zm">
      <span className="mk-ukryte">{teksty.join(" albo ")}</span>
      {teksty.map((t, k) => (
        <span key={t} aria-hidden className={`mk-zm-el${k === i ? " mk-zm-on" : k === (i - 1 + teksty.length) % teksty.length ? " mk-zm-off" : ""}`}>
          {t}
        </span>
      ))}
    </span>
  );
}

// 22.11 (USER_001): kula z pierwszego ekranu przy przewijaniu maleje i zjeżdża do prawego dolnego rogu, potem jedzie z czytelnikiem.
// Przy newsletterze schodzi do dużej kuli i w niej znika (duża pojawia się w tym samym tempie, w jakim mała w nią wpada).
// Płynność: cel liczony z przewinięcia, a kula dociąga do celu sprężyście (wygładzanie wykładnicze zależne od czasu klatki),
// więc nie szarpie przy kółku myszy. Ruch tylko transformem i przezroczystością.
function KulaZaCzytelnikiem({ miejsce }: { miejsce: React.RefObject<HTMLDivElement | null> }) {
  const kula = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = kula.current;
    if (!k) return;
    const malo = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gladko = (v: number) => {
      const t = Math.min(1, Math.max(0, v));
      return t * t * (3 - 2 * t);
    };
    const stan = { x: 0, y: 0, d: 0, o: 0, start: false };
    let raf = 0;
    let poprz = 0;
    let duza: HTMLElement | null = null;

    const cel = () => {
      const m = miejsce.current;
      if (!m) return null;
      const r = m.getBoundingClientRect();
      if (!r.width) return null;
      const tel = innerWidth < 860;
      const maly = tel ? 40 : 52;
      const margines = tel ? 18 : 30;
      // 1) z pierwszego ekranu do rogu
      const p = gladko(scrollY / (innerHeight * 0.6));
      let x = r.left + (innerWidth - margines - maly - r.left) * p;
      let y = r.top + (innerHeight - margines - maly - r.top) * p;
      let d = r.width + (maly - r.width) * p;
      let o = 1;
      // 2) z rogu do dużej kuli w newsletterze
      duza = duza ?? document.querySelector<HTMLElement>(".mk-news-kula");
      if (duza) {
        const n = duza.getBoundingClientRect();
        const q = gladko((innerHeight - n.top) / (innerHeight * 0.75));
        if (q > 0) {
          x += (n.left - x) * q;
          y += (n.top - y) * q;
          d += (n.width - d) * q;
          o = 1 - gladko((q - 0.6) / 0.4);
        }
        duza.style.opacity = String(0.95 * gladko((q - 0.45) / 0.55));
      }
      return { x, y, d, o, baza: r.width };
    };

    const klatka = (t: number) => {
      raf = 0;
      const c = cel();
      if (!c) return;
      const dt = poprz ? Math.min(64, t - poprz) : 16;
      poprz = t;
      const a = malo || !stan.start ? 1 : 1 - Math.exp(-dt / 90);
      stan.x += (c.x - stan.x) * a;
      stan.y += (c.y - stan.y) * a;
      stan.d += (c.d - stan.d) * a;
      stan.o += (c.o - stan.o) * a;
      stan.start = true;
      k.style.width = `${c.baza}px`;
      k.style.height = `${c.baza}px`;
      k.style.transform = `translate3d(${stan.x}px, ${stan.y}px, 0) scale(${stan.d / c.baza})`;
      k.style.opacity = String(stan.o);
      const ruch = Math.abs(c.x - stan.x) + Math.abs(c.y - stan.y) + Math.abs(c.d - stan.d) + Math.abs(c.o - stan.o) * 100;
      if (ruch > 0.3) raf = requestAnimationFrame(klatka);
      else poprz = 0;
    };
    const zaplanuj = () => {
      if (!raf) raf = requestAnimationFrame(klatka);
    };
    zaplanuj();
    addEventListener("scroll", zaplanuj, { passive: true });
    addEventListener("resize", zaplanuj);
    return () => {
      removeEventListener("scroll", zaplanuj);
      removeEventListener("resize", zaplanuj);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [miejsce]);
  return (
    <div ref={kula} className="mk-kula-lot" aria-hidden>
      <div className="mk-kula-wn">
        <KulaLimonka tempo="czeka" />
      </div>
    </div>
  );
}

function Tresc({ id }: { id: string }) {
  if (id === "o-mnie")
    return (
      <div className="mk-tresc mk-omnie">
        <div className="mk-omnie-lewa">
          <div className="mk-kolko">
            <Image src={O_MNIE.zdjecie.src} alt={O_MNIE.zdjecie.alt} width={O_MNIE.zdjecie.w} height={O_MNIE.zdjecie.h} sizes="220px" />
          </div>
          <p className="mk-omnie-tekst">
            {O_MNIE.tekst.map((c, i) => (c.b ? <b key={i}>{c.b}</b> : <span key={i}>{c.t}</span>))}
          </p>
          <a className="mk-omnie-mail" href={`mailto:${MARKA.email}`}>
            <span className="mk-plus" aria-hidden>@</span>
            {MARKA.email}
          </a>
        </div>
        <figure className="mk-cert">
          <Image src={O_MNIE.cert.src} alt={O_MNIE.cert.alt} width={O_MNIE.cert.w} height={O_MNIE.cert.h} sizes="(max-width: 860px) 100vw, 520px" />
          <figcaption>{O_MNIE.cert.podpis}</figcaption>
        </figure>
      </div>
    );
  if (id === "firmy")
    return (
      <div className="mk-tresc">
        <p className="mk-lead">{FIRMY.lead}</p>
        <div className="mk-kafle">
          {FIRMY.punkty.map((p) => (
            <div key={p.co} className="mk-kafel">
              <b>{p.co}</b>
              <span>{p.o}</span>
            </div>
          ))}
        </div>
        {/* 22.11 (USER_001): formularz zamiast przycisku „Zobacz szkolenie”. Ten sam co na stronie szkoleń:
            /api/szkolenia-ai (mail + tabela szkolenia_ai_leady) i zdarzenie lead_szkolenie. Jasny wygląd: .mk-form w marka.css. */}
        <div className="mk-form">
          <p className="mk-mono">{FORMULARZ.tytul}</p>
          <p className="mk-form-obietnica">{FORMULARZ.dalej.kroki[0]} {FORMULARZ.dalej.kroki[1]}</p>
          <Formularz />
        </div>
      </div>
    );
  if (id === "kazdy")
    return (
      <div className="mk-tresc">
        <p className="mk-lead">{KAZDY.lead}</p>
        <div className="mk-kafle">
          {KAZDY.punkty.map((p) => (
            <div key={p.co} className="mk-kafel">
              <b>{p.co}</b>
              <span>{p.o}</span>
            </div>
          ))}
        </div>
        <Zapis przycisk={KAZDY.zapis} maly />
      </div>
    );
  if (id === "podcast")
    return (
      <div className="mk-tresc">
        <p className="mk-lead">{PODCAST.lead}</p>
        <p className="mk-mono">Pierwsze odcinki</p>
        <ol className="mk-tematy">
          {PODCAST.tematy.map((t, i) => (
            <li key={t}>
              <span className="mk-nr">{String(i + 1).padStart(2, "0")}</span>
              {t}
            </li>
          ))}
        </ol>
        <div className="mk-kanaly">
          {PODCAST.kanaly.map((k) => (
            <span key={k} className="mk-kanal">{k}<em>wkrótce</em></span>
          ))}
        </div>
      </div>
    );
  if (id === "rolki")
    return (
      <div className="mk-tresc">
        <p className="mk-lead">{ROLKI.lead}</p>
        <div className="mk-telefony" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="mk-telefon" style={{ animationDelay: `${i * 0.6}s` }}>
              <div className="mk-telefon-ekran" />
            </div>
          ))}
        </div>
        <div className="mk-kanaly">
          {ROLKI.kanaly.map((k) => (
            <span key={k} className="mk-kanal">{k}<em>wkrótce</em></span>
          ))}
        </div>
      </div>
    );
  if (id === "projekty")
    return (
      <div className="mk-tresc">
        <div className="mk-projekty">
          {PROJEKTY.map((p) => (
            <a key={p.nazwa} className="mk-projekt" href={p.href} target={p.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              <b>{p.nazwa}</b>
              <span>{p.opis}</span>
              <em>{p.adres} ↗</em>
            </a>
          ))}
        </div>
      </div>
    );
  if (id === "sklep")
    return (
      <div className="mk-tresc">
        <p className="mk-lead">{MATERIALY.lead}</p>
        <div className="mk-projekty">
          {MATERIALY.darmowe.map((m) => (
            <a key={m.co} className="mk-projekt" href={m.href}>
              <b>{m.co}</b>
              <span>{m.o}</span>
              <em>za darmo ↗</em>
            </a>
          ))}
        </div>
      </div>
    );
  return null;
}

export default function MarkaPage() {
  const [otwarty, setOtwarty] = useState<string | null>("o-mnie");
  const [przewiniete, setPrzewiniete] = useState(false);
  const korzen = useRef<HTMLDivElement>(null);
  const miejsceKuli = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (PASKI.some((p) => p.id === h)) setOtwarty(h);
    const naScroll = () => setPrzewiniete(window.scrollY > 12);
    naScroll();
    window.addEventListener("scroll", naScroll, { passive: true });
    const obs = new IntersectionObserver(
      (wpisy) => wpisy.forEach((w) => w.isIntersecting && (w.target.classList.add("mk-widac"), obs.unobserve(w.target))),
      { rootMargin: "0px 0px -8% 0px" },
    );
    korzen.current?.querySelectorAll(".mk-wejdz").forEach((el) => obs.observe(el));
    return () => {
      window.removeEventListener("scroll", naScroll);
      obs.disconnect();
    };
  }, []);

  const otworz = (id: string) => {
    setOtwarty(id);
    history.replaceState(null, "", `#${id}`);
    requestAnimationFrame(() => document.getElementById(`pasek-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="mk" ref={korzen}>
      <header className={`mk-pasek${przewiniete ? " mk-pasek-szklo" : ""}`}>
        <a href="#" className="mk-znak">{MARKA.imie.toUpperCase()}</a>
        <a href="#newsletter" className="mk-btn mk-btn-czarny mk-btn-pasek">
          <span className="mk-plus" aria-hidden>+</span>
          {MARKA.przyciskGora}
        </a>
      </header>

      <main>
        <section className="mk-start">
          <div className="mk-start-tekst">
            <h1 className="mk-h1">
              <span className="mk-linia"><span style={{ animationDelay: ".1s" }}>{START.h1a}</span></span>
              <span className="mk-linia mk-szary"><span style={{ animationDelay: ".22s" }}><Zmiennik teksty={START.h1b} /></span></span>
            </h1>
            <dl className="mk-fakty mk-wejdz" style={{ transitionDelay: ".45s" }}>
              {START.fakty.map((f) => (
                <div key={f.o}>
                  <dt>{f.n}</dt>
                  <dd>{f.o}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mk-start-obraz">
            <div className="mk-portret">
              <Image src={START.zdjecie.src} alt={START.zdjecie.alt} width={START.zdjecie.w} height={START.zdjecie.h} priority sizes="(max-width: 860px) 92vw, 640px" />
              <span className="mk-portret-podpis">{START.zdjecie.podpis}</span>
            </div>
            <div className="mk-kula" ref={miejsceKuli} aria-hidden />
          </div>
        </section>

        <section className="mk-paski" aria-label="Co robię">
          {PASKI.map((p) => {
            const jest = otwarty === p.id;
            return (
              <div key={p.id} id={`pasek-${p.id}`} className={`mk-p mk-wejdz${jest ? " mk-p-otwarty" : ""}`}>
                <button
                  className="mk-p-glowa"
                  aria-expanded={jest}
                  aria-controls={`tresc-${p.id}`}
                  onClick={() => (jest ? setOtwarty(null) : otworz(p.id))}
                >
                  <span className="mk-p-nr">{p.nr}</span>
                  <span className="mk-p-tytul">{p.tytul}</span>
                  <span className="mk-p-zajawka">{p.zajawka}</span>
                  {p.stan ? <span className="mk-p-stan">{p.stan}</span> : <span className="mk-p-stan mk-p-stan-pusty" aria-hidden />}
                  <span className="mk-p-ikona" aria-hidden />
                </button>
                <div className="mk-p-cialo" id={`tresc-${p.id}`} role="region" aria-hidden={!jest} inert={!jest}>
                  <div className="mk-p-wnetrze">
                    <Tresc id={p.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mk-news mk-wejdz" id="newsletter">
          <div className="mk-news-kula" aria-hidden>
            <KulaLimonka tempo="czeka" />
          </div>
          <p className="mk-mono">Newsletter</p>
          <h2 className="mk-h2">{NEWSLETTER.h2}</h2>
          <p className="mk-news-opis">{NEWSLETTER.opis}</p>
          <Zapis przycisk={NEWSLETTER.przycisk} />
        </section>
      </main>

      <KulaZaCzytelnikiem miejsce={miejsceKuli} />

      <footer className="mk-stopka">
        <div className="mk-stopka-linki">
          <a href="/blog">Blog</a>
          <a href="/ai">Narzędzia AI</a>
          <a href="/szkolenie-ai-dla-firm">Szkolenia dla firm</a>
          <a href={`mailto:${MARKA.email}`}>{MARKA.email}</a>
          <a href="/polityka-prywatnosci">Polityka prywatności</a>
          <UstawieniaCookies className="jcz-link" />
          <a className="mk-linkedin" href={MARKA.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn: Jakub Chodakowski">
            {/* Ikona LinkedIn: Bootstrap Icons (MIT). */}
            <svg viewBox="0 0 16 16" width="22" height="22" aria-hidden fill="currentColor">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
            </svg>
            LinkedIn
          </a>
        </div>
        <p className="mk-stopka-wielki" aria-hidden>Chodakowski</p>
      </footer>
    </div>
  );
}
