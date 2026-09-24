"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { STRATEGIA_OFERTY } from "@/lib/strategia-oferty";

// Oferta STRATEGII marketingowo-sprzedażowej dla kliniki (USER_001 2026-09-24).
// Pierwszy adresat: Perfect Hair Clinic, Katowice.
//
// USER_001 24.09: „to ma być oferta wychodząca poza to, co robimy z lovemyself
// i SEO. Kolorystycznie może zostać to samo, ale rozkład LP ma być zupełnie
// inny, nie wzoruj się na tym, co było". Dlatego:
//   - paleta ta sama (akcent, metal, szarości) i to wszystko, co zostaje,
//   - układ = dokument z rozdziałami 01-06, spis treści przyklejony z lewej
//     na desktopie, treść z prawej,
//   - nagłówki Poppinsem 600, zmienna --font-poppins z layoutu,
//   - cennik to jedna tabela porównawcza, wiersze = co dostają, kolumny = A/B,
//   - firmuje to Jakub Chodakowski jako doradca, nie marka lovemyself.
//
// PRZEJŚCIE DESIGNOWE (USER_001 24.09, „cyferki w kółeczkach, tabelki lepiej,
// teksty lepiej rozdzielone"): jedna skala typografii dla całej strony.
//   Nadtytuł  = xs, wersaliki, rozstrzelone, akcent          (<Nadtytul>)
//   H2        = Poppins 600, 2xl-3xl, z numerem w kółku      (<H2>)
//   H3        = Poppins 600, lg                               (style NAGLOWEK)
//   Tekst     = Inter 15px, szary                             (klasa TEKST)
//   Podpis    = xs, szary
// Każda liczba porządkowa siedzi w kółku (<Kolko>), ptaszki w tabeli też.
//
// BEZ Stripe. Kwoty 15-29 tys. zł i 50% zaliczki idą fakturą po rozmowie.
// BEZ gwarancji liczby pacjentów. Rachunek zwrotu to próg, nie prognoza.

const PALETA: Record<string, string> = {
  "--akcent": "#0071e3",
  "--akcent-ciemny": "#0060c2",
  "--akcent-mgla": "rgba(0, 113, 227, 0.10)",
  "--akcent-mgla-2": "rgba(0, 113, 227, 0.05)",
  "--akcent-cien": "rgba(0, 113, 227, 0.28)",
  "--metal-1": "#8fa9d4",
  "--metal-2": "#5f7dab",
  "--metal-3": "#48648f",
  "--metal-4": "#7d97c2",
  "--tekst": "#1d1d1f",
  "--tekst-cichy": "#6e6e73",
  "--ramka": "rgba(0, 0, 0, 0.08)",
  "--tlo-2": "#f5f5f7",
};

// Nagłówki: Poppins (USER_001 24.09), zmienna --font-poppins z layoutu, ciężar 600.
const NAGLOWEK: CSSProperties = {
  fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 600,
  letterSpacing: "-0.01em",
};
const ZIELONY = "#16a34a";

// Karta: jeden wygląd dla wszystkich pudełek na stronie.
const KARTA = "rounded-3xl border border-[var(--ramka)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_40px_-24px_rgba(0,0,0,0.12)]";
const TEKST = "text-[15px] leading-relaxed text-[var(--tekst-cichy)]";

const zl = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const ROZDZIALY = [
  { id: "sytuacja", nr: "01", tytul: "Sytuacja" },
  // USER_001 24.09: „Kto to prowadzi" na 2. miejscu, cel po cenniku.
  { id: "omnie", nr: "02", tytul: "Kto to prowadzi" },
  { id: "plan", nr: "03", tytul: "Plan" },
  { id: "inwestycja", nr: "04", tytul: "Inwestycja" },
  { id: "rachunek", nr: "05", tytul: "Cennik" },
  { id: "krok", nr: "06", tytul: "Następny krok" },
];

// O mnie (USER_001 24.09, jego słowa, tylko wygładzone). Kolejność od
// najmocniejszego dowodu: kasa z webinarów, bo to kanał, który klinika
// sama wskazała.
const O_MNIE = [
  {
    liczba: "+ 1 mln zł",
    co: "sprzedaży z webinarów",
    opis: "Ponad milion złotych sprzedaży zrobionej przez webinary. Ten sam kanał, który chcecie uruchomić.",
  },
  {
    liczba: "Gwiazdy",
    co: "Prowadzenie marek osobistych",
    opis: "Osoby z Forbes, z ponad 100 tys. obserwujących na Instagramie.",
  },
  {
    liczba: "Startupy",
    co: "z parków naukowo-technologicznych",
    opis: "Prowadziłem sprzedaż i marketing w startupach.",
  },
  {
    liczba: "Miami",
    co: "startup w USA",
    opis: "Doświadczenie w prowadzeniu sprzedaży i marketingu w USA.",
  },
  {
    liczba: "AI",
    co: "szkolenie u Marii Parysz",
    opis: "Szkolenie u jednej z najlepszych specjalistek w tej dziedzinie, która wprowadzała AI do firm takich jak Rolls-Royce czy Sephora.",
  },
];

// Co usłyszałem w rozmowie 17.09. USER_001 24.09: jedno zdanie, bez
// komentarzy (trzy fakty z komentarzami i blok „Wniosek" zdjęte).
const SYTUACJA = "Potrzebujecie specjalisty od sprzedaży i marketingu.";

// Cztery fazy. Faza 4 tylko w pakiecie B.
const PLAN = [
  {
    faza: "Audyt",
    kiedy: "Tydzień 1",
    co: "Rozmowa z Wami. Przegląd strony, kanałów, liczb, materiałów, statystyk, tego, co już macie. Badanie grupy docelowej.",
    pakiet: "A i B",
  },
  {
    faza: "Strategia",
    kiedy: "Tydzień 2 i 3",
    co: "Jeden plan od pierwszego kontaktu do zabiegu: kanały, oferta, komunikacja, plan webinarów, newsletter z gotowymi mailami, skrypty rozmów.",
    pakiet: "A i B",
  },
  {
    faza: "Szkolenie",
    kiedy: "Tydzień 4",
    co: "4 x 50 min z Waszym zespołem. Strategia przechodzi do ręki osoby, która będzie ją prowadzić.",
    pakiet: "A i B",
  },
  {
    faza: "Wdrożenie",
    kiedy: "Dzień 30 do 90",
    co: "Prowadzę pierwszy webinar, pierwsze kampanie, pierwsze rozmowy razem z Wami. Spotkanie co tydzień. Oddaję działający lejek.",
    pakiet: "tylko B",
  },
];

// Macierz cennika. `a` / `b` = czy pozycja jest w pakiecie.
const MACIERZ = () => [
  { co: "Audyt lejka i sprzedaży", a: true, b: true },
  // USER_001 24.09: badanie grupy docelowej + newsletter z gotowymi mailami.
  { co: "Badanie grupy docelowej", a: true, b: true },
  { co: "Strategia marketingowo-sprzedażowa", a: true, b: true },
  { co: "Webinary", a: true, b: true },
  { co: "Skrypty rozmów: telefon, konsultacja, cena", a: true, b: true },
  { co: "Newsletter", a: true, b: true },
  // Marka osobista w podtytule oferty (USER_001 24.09), więc i w pakiecie.
  { co: "Marka osobista: plan treści i wystąpień", a: true, b: true },
  { co: "Szkolenie zespołu: 4 x 50 min", a: true, b: true },
  { co: "60 dni prowadzenia razem z Wami", a: false, b: true },
  { co: "Spotkanie z zespołem co tydzień", a: false, b: true },
  { co: "Prowadzę pierwszy webinar i pierwszą kampanię", a: false, b: true },
];

// Następne kroki (USER_001 24.09: tytuły i pierwszy opis jego, opisy 2 i 3
// dopasowane).
const KROKI = [
  ["Spotkanie online - piątek, 13:00", "Omówienie warunków współpracy."],
  ["Audyt", "Rozmowa z Wami i przegląd tego, co już macie."],
  ["Start współpracy", "Strategia, szkolenie zespołu, wdrożenie."],
];

// ── Klocki typografii ─────────────────────────────────────────────────────

// Dwie ikony na okładce, inline SVG, kolor dziedziczony z kółka.
function Ikona({ nazwa }: { nazwa: string }) {
  const wspolne = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (nazwa === "czas") {
    return (
      <svg {...wspolne} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg {...wspolne} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// Kółko z liczbą albo znakiem. `ton`: pelne (akcent, biały napis), jasne
// (mgła, akcent), zielone (ptaszek), szare (brak pozycji), metal (faza tylko B).
function Kolko({
  children,
  ton = "jasne",
  rozmiar = "md",
}: {
  children: React.ReactNode;
  ton?: "pelne" | "jasne" | "zielone" | "szare" | "metal";
  rozmiar?: "sm" | "md" | "lg";
}) {
  const wymiar = rozmiar === "lg" ? "size-11 text-base" : rozmiar === "sm" ? "size-6 text-[11px]" : "size-9 text-sm";
  const kolory: Record<string, CSSProperties> = {
    pelne: { background: "var(--akcent)", color: "#fff", boxShadow: "0 6px 16px var(--akcent-cien)" },
    jasne: { background: "var(--akcent-mgla)", color: "var(--akcent)" },
    zielone: { background: "rgba(22,163,74,0.12)", color: ZIELONY },
    szare: { background: "var(--tlo-2)", color: "#c7c7cc" },
    metal: { background: "rgba(95,125,171,0.14)", color: "var(--metal-3)" },
  };
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold tabular-nums ${wymiar}`}
      style={{ ...kolory[ton], fontFamily: NAGLOWEK.fontFamily }}
    >
      {children}
    </span>
  );
}

// `mocny` = pogrubiony i czarny (USER_001 24.09: „CO OTRZYMACIE" i „PO ODDANIU" pogrubić).
function Nadtytul({
  children,
  kolor = "akcent",
  mocny = false,
}: {
  children: React.ReactNode;
  kolor?: "akcent" | "szary";
  mocny?: boolean;
}) {
  return (
    <p
      className={`text-[11px] uppercase tracking-[0.2em] ${mocny ? "font-bold" : "font-semibold"}`}
      style={{ color: mocny ? "var(--tekst)" : kolor === "akcent" ? "var(--akcent)" : "var(--tekst-cichy)" }}
    >
      {children}
    </p>
  );
}

// Nagłówek rozdziału: numer w kółku, nadtytuł, tytuł Poppinsem.
function H2({ nr, nad, children }: { nr: string; nad: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <Kolko ton="pelne" rozmiar="lg">
        {nr}
      </Kolko>
      <div className="pt-0.5">
        <Nadtytul>{nad}</Nadtytul>
        <h2 className="mt-1.5 text-[1.75rem] leading-tight sm:text-3xl" style={NAGLOWEK}>
          {children}
        </h2>
      </div>
    </div>
  );
}

function H3({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-lg leading-snug ${className}`} style={NAGLOWEK}>
      {children}
    </p>
  );
}

// Spis treści z lewej, podświetla rozdział, który jest na ekranie (USER_001
// 24.09: „jak zjeżdżam w dół, ma się podświetlać punkt, na którym jestem").
// Aktywny = ten, którego nagłówek jest najbliżej górnej krawędzi okna, ale
// jeszcze nie odjechał powyżej. Liczymy na scrollu, nie IntersectionObserverem,
// bo sekcje są wyższe niż ekran i observer gubiłby środek długiej sekcji.
function Spis() {
  const [aktywny, setAktywny] = useState(ROZDZIALY[0].id);
  useEffect(() => {
    let raf = 0;
    const licz = () => {
      raf = 0;
      const linia = window.innerHeight * 0.3;
      let wybrany = ROZDZIALY[0].id;
      for (const r of ROZDZIALY) {
        const el = document.getElementById(r.id);
        if (el && el.getBoundingClientRect().top <= linia) wybrany = r.id;
      }
      // Na samym dole strony ostatni rozdział ma być aktywny, nawet jeśli
      // jego nagłówek nie doszedł do linii.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        wybrany = ROZDZIALY[ROZDZIALY.length - 1].id;
      }
      setAktywny((a) => (a === wybrany ? a : wybrany));
    };
    const naScroll = () => {
      if (!raf) raf = requestAnimationFrame(licz);
    };
    naScroll();
    window.addEventListener("scroll", naScroll, { passive: true });
    window.addEventListener("resize", naScroll);
    return () => {
      window.removeEventListener("scroll", naScroll);
      window.removeEventListener("resize", naScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <nav className="hidden lg:block">
      <ol className="sticky top-8 space-y-1.5 py-16">
        {ROZDZIALY.map((r) => {
          const on = r.id === aktywny;
          return (
            <li key={r.id}>
              <a
                href={`#${r.id}`}
                aria-current={on ? "true" : undefined}
                className={`flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 text-sm transition-colors ${
                  on
                    ? "bg-[var(--akcent-mgla)] font-semibold text-[var(--tekst)]"
                    : "text-[var(--tekst-cichy)] hover:bg-[var(--tlo-2)] hover:text-[var(--tekst)]"
                }`}
              >
                <Kolko ton={on ? "pelne" : "jasne"} rozmiar="sm">
                  {r.nr}
                </Kolko>
                {r.tytul}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Strona ──────────────────────────────────────────────────────────────

// Wersja na jakubchodakowski.com (USER_001 24.09): stały klucz z propsa,
// bez ?k= w adresie, bo strona stoi pod własnym adresem za kodem
// (app/wspolpracampphc). Meldunek o wejściu idzie do /api/offer-view.
export function OfertaStrategia({ klucz }: { klucz: string }) {
  const m = STRATEGIA_OFERTY[klucz];

  // Meldunek: ktoś wpisał kod i otworzył ofertę (POST /api/offer-view).
  useEffect(() => {
    if (!m) return;
    // Jeden meldunek na sesję karty: bez tego każde odświeżenie (i podwójny
    // efekt w trybie dev) wysyłałoby kolejnego maila.
    const znacznik = `meldunek:${klucz}`;
    try {
      if (sessionStorage.getItem(znacznik) === "1") return;
      sessionStorage.setItem(znacznik, "1");
    } catch {}
    const dane = JSON.stringify({ strategy: klucz, from: document.referrer });
    const url = "/api/offer-view";
    const body = new Blob([dane], { type: "application/json" });
    if (!navigator.sendBeacon?.(url, body)) {
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: dane,
        keepalive: true,
      }).catch(() => {});
    }
  }, [klucz, m]);

  if (!m) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold">Oferta niedostępna</h1>
        <p className="mt-3 text-zinc-600">
          Ten adres wysyłamy imiennie. Proszę otworzyć link dokładnie taki, jaki
          przyszedł mailem, albo odpisać na wiadomość, a prześlę go ponownie.
        </p>
      </main>
    );
  }

  const zwrotA = Math.ceil(m.cenaA / m.cenaZabiegu);
  const zwrotB = Math.ceil(m.cenaB / m.cenaZabiegu);
  // USER_001 24.09: pół roku (minimum umowy), nie cały rok. 12 mies. = 42 000 zł
  // wyglądało na najdroższą pozycję w ofercie i kotwiczyło w złą stronę.
  const polRokuNadzoru = m.cenaNadzor * 6;
  const zwrotPolRoku = Math.ceil(polRokuNadzoru / m.cenaZabiegu);

  return (
    <div style={PALETA as CSSProperties} className="min-h-screen bg-white text-[var(--tekst)] antialiased">
      {/* Pasek u góry (nazwisko + nazwa kliniki) zdjęty, USER_001 24.09. */}

      {/* ── Okładka ─────────────────────────────────────────────────── */}
      <section
        className="border-b border-[var(--ramka)]"
        style={{
          background:
            "radial-gradient(70% 60% at 20% 0%, var(--akcent-mgla), transparent 65%), radial-gradient(40% 50% at 95% 30%, rgba(95,125,171,0.10), transparent 70%), #fff",
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-20">
          <div>
            <Nadtytul>
              {m.miasto} · {m.zabieg}
            </Nadtytul>
            {/* USER_001 24.09: tytuł „Oferta współpracy", podtytuł z marką osobistą. */}
            <h1 className="mt-5 text-[clamp(2.4rem,7vw,4.25rem)] leading-[1.04]" style={NAGLOWEK}>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, var(--metal-1) 0%, var(--metal-2) 40%, var(--metal-3) 60%, var(--metal-4) 100%)",
                }}
              >
                Oferta współpracy
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--tekst-cichy)] sm:text-xl">
              Plan marketingu i sprzedaży dla <span className="font-medium text-[var(--tekst)]">{m.nazwa}</span> oraz
              dla marki osobistej.
            </p>
          </div>

          {/* USER_001 24.09: bez nagłówka „W skrócie", bez inwestycji i progu
              zwrotu na okładce. Cena pojawia się dopiero w rozdziale Inwestycja. */}
          {/* USER_001 24.09: Cel i Czas jako DWIE osobne karty, nie jedna. */}
          <aside className="grid gap-4">
            {[
              { k: "Cel", v: "Zbudować lejek marketingowo-sprzedażowy", i: "cel" },
              { k: "Czas", v: "4 tygodnie, z wdrożeniem 90 dni", i: "czas" },
            ].map((w) => (
              <div key={w.k} className={`${KARTA} flex items-start gap-4 p-5`}>
                <Kolko ton="jasne" rozmiar="lg">
                  <Ikona nazwa={w.i} />
                </Kolko>
                <div className="pt-0.5">
                  <Nadtytul kolor="szary">{w.k}</Nadtytul>
                  <p className="mt-1 text-[15px] font-medium leading-snug">{w.v}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {/* ── Treść: spis z lewej, rozdziały z prawej ─────────────────── */}
      <div className="mx-auto max-w-6xl px-5 lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">
        <Spis />

        <div className="divide-y divide-[var(--ramka)]">
          {/* 01 SYTUACJA */}
          <section id="sytuacja" className="scroll-mt-8 py-16">
            <H2 nr="01" nad="Sytuacja">
              Co usłyszałem w rozmowie
            </H2>
            {/* USER_001 24.09: jedno zdanie, bez komentarzy i bez „Wniosku". */}
            <div className={`${KARTA} mt-10 flex gap-4 px-6 py-5`}>
              <span className="w-1 shrink-0 rounded-full" style={{ background: "var(--akcent)" }} />
              {/* USER_001 24.09: mniejsza czcionka, szary, nie czarny nagłówek. */}
              <p className="text-lg leading-relaxed text-[var(--tekst-cichy)]">{SYTUACJA}</p>
            </div>
          </section>

          {/* 02 O MNIE (USER_001 24.09: na 2. miejsce) */}
          <section id="omnie" className="scroll-mt-8 py-16">
            <H2 nr="02" nad="Kto to prowadzi">
              Jakub Chodakowski
            </H2>
            <div className={`${KARTA} mt-10 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/jakub.jpg"
                alt="Jakub Chodakowski"
                className="size-20 shrink-0 rounded-full object-cover ring-4 ring-[var(--akcent-mgla)]"
              />
              <div>
                <Nadtytul kolor="szary">Doradca</Nadtytul>
                <H3 className="mt-1">Marketing i sprzedaż</H3>
                <p className={`${TEKST} mt-2`}>
                  Wszystko, co jest w tym planie, robiłem już wcześniej. Posiadam
                  doświadczenie praktyczne, nie teoretyczne.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {O_MNIE.map((o, i) => {
                const glowny = i === 0;
                return (
                  <div
                    key={o.liczba}
                    className={`${KARTA} p-6 ${glowny ? "lg:col-span-2" : ""}`}
                    style={glowny ? { background: "linear-gradient(135deg, var(--akcent-mgla-2), #fff 60%)" } : undefined}
                  >
                    <p
                      className={glowny ? "text-[2.5rem] leading-none" : "text-[1.75rem] leading-none"}
                      style={{ ...NAGLOWEK, color: glowny ? "var(--akcent)" : undefined }}
                    >
                      {o.liczba}
                    </p>
                    <H3 className="mt-3 !text-base">{o.co}</H3>
                    <p className={`${TEKST} mt-2 !text-sm ${glowny ? "max-w-md" : ""}`}>{o.opis}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 03 PLAN */}
          <section id="plan" className="scroll-mt-8 py-16">
            <H2 nr="03" nad="Plan">
              Cztery fazy
            </H2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2">
              {PLAN.map((f, i) => {
                const b = f.pakiet === "tylko B";
                return (
                  <li key={f.faza} className={`${KARTA} flex flex-col p-6`}>
                    <div className="flex items-center justify-between">
                      <Kolko ton={b ? "metal" : "pelne"} rozmiar="lg">
                        {i + 1}
                      </Kolko>
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{
                          background: b ? "rgba(95,125,171,0.14)" : "var(--akcent-mgla)",
                          color: b ? "var(--metal-3)" : "var(--akcent)",
                        }}
                      >
                        pakiet {f.pakiet}
                      </span>
                    </div>
                    <Nadtytul kolor="szary">
                      <span className="mt-5 block">{f.kiedy}</span>
                    </Nadtytul>
                    <p className="mt-1 text-2xl" style={NAGLOWEK}>
                      {f.faza}
                    </p>
                    <p className={`${TEKST} mt-2`}>{f.co}</p>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* 04 INWESTYCJA */}
          <section id="inwestycja" className="scroll-mt-8 py-16">
            <H2 nr="04" nad="Inwestycja">
              Dwa pakiety
            </H2>
            <div className={`${KARTA} mt-10 overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-[15px]">
                  <thead>
                    <tr className="border-b border-[var(--ramka)]">
                      <th className="w-[46%] px-6 py-6 text-left align-bottom">
                        <Nadtytul kolor="szary" mocny>Co otrzymacie</Nadtytul>
                      </th>
                      <th className="px-6 py-6 text-left align-bottom">
                        <div className="flex items-center gap-2.5">
                          <Kolko ton="jasne" rozmiar="sm">
                            A
                          </Kolko>
                          <H3>Strategia</H3>
                        </div>
                        <p className="mt-3 whitespace-nowrap text-2xl tabular-nums" style={NAGLOWEK}>
                          {zl(m.cenaA)} zł
                        </p>
                        <p className="mt-0.5 text-xs font-normal text-[var(--tekst-cichy)]">jednorazowo</p>
                      </th>
                      <th
                        className="relative px-6 py-6 text-left align-bottom"
                        style={{ background: "var(--akcent-mgla-2)", boxShadow: "inset 0 3px 0 var(--akcent)" }}
                      >
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Kolko ton="pelne" rozmiar="sm">
                            B
                          </Kolko>
                          <H3>Strategia + wdrożenie</H3>
                          <span
                            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                            style={{ background: "var(--akcent)" }}
                          >
                            polecam
                          </span>
                        </div>
                        <p className="mt-3 whitespace-nowrap text-2xl tabular-nums" style={NAGLOWEK}>
                          {zl(m.cenaB)} zł
                        </p>
                        <p className="mt-0.5 text-xs font-normal text-[var(--tekst-cichy)]">jednorazowo</p>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MACIERZ().map((w, i) => (
                      <tr
                        key={w.co}
                        className="border-b border-[var(--ramka)] last:border-0"
                        style={{ background: i % 2 ? "rgba(0,0,0,0.012)" : undefined }}
                      >
                        <td className="px-6 py-3.5 font-medium">{w.co}</td>
                        <td className="px-6 py-3.5">
                          {w.a ? (
                            <Kolko ton="zielone" rozmiar="sm">
                              ✓
                            </Kolko>
                          ) : (
                            <Kolko ton="szare" rozmiar="sm">
                              –
                            </Kolko>
                          )}
                        </td>
                        <td className="px-6 py-3.5" style={{ background: "var(--akcent-mgla-2)" }}>
                          {w.b ? (
                            <Kolko ton="zielone" rozmiar="sm">
                              ✓
                            </Kolko>
                          ) : (
                            <Kolko ton="szare" rozmiar="sm">
                              –
                            </Kolko>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nadzór po oddaniu: dwie karty, nie trzecia kolumna. */}
            <div className="mt-8">
              <Nadtytul kolor="szary" mocny>Po oddaniu, opcja do A i do B</Nadtytul>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
                <div className="rounded-3xl bg-[var(--tlo-2)] p-6">
                  <H3>Nadzór miesięczny</H3>
                  <p className={`${TEKST} mt-2`}>
                    Cotygodniowy przegląd liczb i poprawki lejka.
                    Minimum 6 miesięcy. Dla porównania: kierownik marketingu na etacie
                    to około 13 500 zł miesięcznie kosztu pracodawcy.
                  </p>
                </div>
                {[
                  { n: "Nadzór", c: m.cenaNadzor },
                  { n: "Nadzór + kampanie", c: m.cenaNadzorPlus },
                ].map((w) => (
                  <div key={w.n} className={`${KARTA} flex flex-col justify-between p-6`}>
                    <Nadtytul kolor="szary">{w.n}</Nadtytul>
                    <p className="mt-4 text-3xl tabular-nums" style={NAGLOWEK}>
                      {zl(w.c)} zł
                      <span className="ml-1 text-sm font-normal text-[var(--tekst-cichy)]">/ mc</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Płatność / Ważność / Prowizja zdjęte (USER_001 24.09). */}
          </section>

          {/* 05 CENNIK (USER_001 24.09: po Inwestycji) */}
          <section id="rachunek" className="scroll-mt-8 py-16">
            <H2 nr="05" nad="Cennik">
              Ile zabiegów zwraca pakiet
            </H2>
            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
              <div
                className="rounded-3xl p-7 text-white sm:p-8"
                style={{
                  background: "linear-gradient(160deg, var(--metal-2) 0%, var(--metal-3) 100%)",
                  boxShadow: "0 24px 60px -30px rgba(72,100,143,0.6)",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Pakiet {m.pakietZabiegu} · {m.zabieg}
                </p>
                <p className="mt-5 text-[clamp(2.75rem,8vw,4.5rem)] leading-none tabular-nums" style={NAGLOWEK}>
                  {zl(m.cenaZabiegu)}
                  <span className="ml-2 text-2xl font-medium text-white/80">zł</span>
                </p>
                <p className="mt-5 text-[15px] leading-relaxed text-white/80">
                  Najniższa kwota z Waszego cennika.
                </p>
                <p className="mt-1 text-xs text-white/55">z cennika {m.nazwa}</p>
              </div>
              <div className={`${KARTA} divide-y divide-[var(--ramka)] p-2`}>
                {[
                  ["Strategia", m.cenaA, zwrotA],
                  ["Strategia + wdrożenie", m.cenaB, zwrotB],
                  ["Nadzór przez pół roku", polRokuNadzoru, zwrotPolRoku],
                ].map(([p, c, z]) => (
                  // USER_001 24.09: liczba w kółku + „zabieg SILVER" z lewej,
                  // nazwa pakietu i cena z prawej.
                  <div key={String(p)} className="flex items-center gap-4 px-4 py-4 sm:px-5">
                    <Kolko ton="zielone" rozmiar="lg">
                      {z}
                    </Kolko>
                    <p className="whitespace-nowrap text-base font-semibold" style={{ color: "#15803d" }}>
                      {Number(z) === 1 ? "zabieg" : "zabiegi"} {m.pakietZabiegu}
                    </p>
                    <div className="min-w-0 flex-1 text-right">
                      <H3 className="!text-base">{p}</H3>
                      <p className="mt-0.5 text-sm text-[var(--tekst-cichy)]">{zl(Number(c))} zł</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 06 NASTĘPNY KROK (sekcja „Cel" usunięta, USER_001 24.09) */}
          <section id="krok" className="scroll-mt-8 py-16">
            <H2 nr="06" nad="Następny krok">
              Jak zaczynamy
            </H2>
            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_340px]">
              <ol className={`${KARTA} divide-y divide-[var(--ramka)] p-2`}>
                {KROKI.map(([t, o], i) => (
                  <li key={t} className="flex items-start gap-4 px-4 py-5 sm:px-5">
                    <Kolko ton="pelne" rozmiar="lg">
                      {i + 1}
                    </Kolko>
                    <div className="pt-1">
                      <H3>{t}</H3>
                      <p className={`${TEKST} mt-1`}>{o}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className={`${KARTA} flex flex-col p-6`}>
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/jakub.jpg"
                    alt="Jakub Chodakowski"
                    className="size-14 shrink-0 rounded-full object-cover ring-4 ring-[var(--akcent-mgla)]"
                  />
                  <div>
                    <H3 className="!text-base">Jakub Chodakowski</H3>
                    <p className="text-sm text-[var(--tekst-cichy)]">strategia marketingu i sprzedaży</p>
                  </div>
                </div>
                <div className="mt-5 divide-y divide-[var(--ramka)] text-sm">
                  <a href="tel:+48506151615" className="flex items-center justify-between py-2.5 font-medium hover:underline">
                    <span className="text-[var(--tekst-cichy)]">Telefon</span>
                    506 151 615
                  </a>
                  <a
                    href={`mailto:hello@jakubchodakowski.com?subject=${encodeURIComponent(`Strategia dla ${m.nazwa}`)}`}
                    className="flex items-center justify-between gap-3 py-2.5 font-medium hover:underline"
                  >
                    <span className="text-[var(--tekst-cichy)]">E-mail</span>
                    <span className="truncate">hello@jakubchodakowski.com</span>
                  </a>
                </div>
                <a
                  href="tel:+48506151615"
                  className="mt-6 block rounded-full bg-[var(--akcent)] px-6 py-3.5 text-center text-[15px] font-semibold text-white shadow-[0_8px_24px_var(--akcent-cien)] transition-colors hover:bg-[var(--akcent-ciemny)]"
                >
                  Zadzwoń i umów rozmowę
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-[var(--ramka)]">
        {/* USER_001 24.09: w stopce tylko nazwisko, bez NIP i linków prawnych. */}
        <div className="mx-auto max-w-6xl px-5 py-8 text-xs text-[var(--tekst-cichy)]">
          <p>Jakub Chodakowski</p>
        </div>
      </footer>
    </div>
  );
}
