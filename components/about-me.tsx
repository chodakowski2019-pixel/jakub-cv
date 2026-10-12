"use client";

import { useEffect, useState, type CSSProperties } from "react";

// O mnie (USER_001 24.09.2026). Design 1:1 z oferty PHC
// (components/oferta-strategia.tsx): jasne tło, paleta akcent/metal/szarości,
// Poppins 600 na nagłówki, Inter 15px na tekst, numer rozdziału w kółku,
// spis treści przyklejony z lewej. Klocki (Kolko, Nadtytul, H2, Spis)
// skopiowane, nie importowane: oferta ma zostać nietknięta.
//
// Układ: okładka, potem DWIE OSIE CZASU:
//   01 Praca      = etaty, freelance, własne firmy (CV 04.2026)
//   02 Nauka i AI = kursy, certyfikaty, projekty AI, wystąpienia
// i na końcu kontakt.
//
// Źródła dat: CV z 16.04.2026 (Jakub_Chodakowski_CV-4.pdf) i strona główna.
// Rozbieżności ze starym CV z 02.2025 (start OMG 07 vs 10.2024, koniec
// VanityStyle 10 vs 11.2024): bierzemy nowsze CV.

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

const NAGLOWEK: CSSProperties = {
  fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 600,
  letterSpacing: "-0.01em",
};
const ZIELONY = "#16a34a";

const KARTA = "rounded-3xl border border-[var(--ramka)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_40px_-24px_rgba(0,0,0,0.12)]";
const TEKST = "text-[15px] leading-relaxed text-[var(--tekst-cichy)]";

const ROZDZIALY = [
  { id: "praca", nr: "01", tytul: "Praca" },
  { id: "nauka", nr: "02", tytul: "Nauka i AI" },
  { id: "narzedzia", nr: "03", tytul: "Narzędzia" },
  { id: "kontakt", nr: "04", tytul: "Kontakt" },
];

// ── Dane ────────────────────────────────────────────────────────────────

type Wpis = {
  od: string;
  do?: string;
  rok: string;
  tytul: string;
  gdzie: string;
  opis: string;
  tagi?: string[];
  /** Tylko oś 02: rodzaj wpisu, decyduje o kolorze kółka. */
  rodzaj?: "kurs" | "projekt" | "wystapienie" | "przelom";
  /** Wpis trwający do dziś: kółko pełne. */
  teraz?: boolean;
};

// Oś 01. Od najnowszego do najstarszego.
const PRACA: Wpis[] = [
  {
    od: "2026",
    do: "teraz",
    rok: "2026",
    tytul: "Własna działalność",
    gdzie: "Warszawa",
    opis: "Marketing, SEO i strategie sprzedaży dla gabinetów i klinik. Doradztwo we wdrażaniu AI w firmach.",
    tagi: ["SEO", "Strategia sprzedaży", "Wdrożenia AI"],
    teraz: true,
  },
  {
    od: "10.2024",
    do: "teraz",
    rok: "2024",
    tytul: "CTO, współzałożyciel",
    gdzie: "OhMyGosh!, startup",
    opis: "Kierunek techniczny i rozwój produktu. Automatyzacje AI w procesach firmy. Sprzedaż B2B: pozyskiwanie klientów, prezentacje, domykanie. Strategia AI i dobór narzędzi.",
    tagi: ["AI", "Produkt", "Sprzedaż B2B"],
    teraz: true,
  },
  {
    od: "04.2024",
    do: "10.2024",
    rok: "2024",
    tytul: "Specjalista ds. sprzedaży B2G",
    gdzie: "VanityStyle, Warszawa",
    opis: "Sprzedaż do instytucji publicznych: muzea, urzędy miast, zamki. Cold call, cold mail, prospecting. Spotkania z władzami miast w całej Polsce.",
    tagi: ["B2G", "Prospecting"],
  },
  {
    od: "07.2023",
    do: "02.2024",
    rok: "2023",
    tytul: "Specjalista ds. marketingu i sprzedaży",
    gdzie: "Storywind, Gdynia",
    opis: "Startup z Pomorskiego Parku Naukowo-Technologicznego. Aplikacja AR dla turystów. Social media, strategia marketingowa i sprzedażowa, kontakt z mediami, konferencje. Dodatkowo 1/4 etatu przy drugim startupie założyciela, benchly.",
    tagi: ["Startup", "Marketing", "Sprzedaż"],
  },
  {
    od: "03.2021",
    do: "06.2023",
    rok: "2021",
    tytul: "Digital marketing, freelance",
    gdzie: "Modern-Marketing, zdalnie",
    opis: "Strony na WordPress, Wix, Shopify i Webflow. Social media i płatne kampanie dla fotowoltaiki, jogi, medytacji i salonów piękności. Remarketing, Pixel, Google Ads, lejki, Mailchimp, Mailerlite, Hotjar, Google Analytics.",
    tagi: ["Meta Ads", "Google Ads", "Strony www"],
  },
  {
    od: "11.2021",
    do: "04.2022",
    rok: "2021",
    tytul: "Junior digital marketing",
    gdzie: "iMarketing Transformer, zdalnie",
    opis: "Strategie marketingowe, prowadzenie social mediów, kampanie Facebook, LinkedIn i Instagram Ads, raporty, obsługa klientów.",
    tagi: ["Kampanie", "Raporty"],
  },
  {
    od: "09.2020",
    do: "03.2021",
    rok: "2020",
    tytul: "Przedstawiciel handlowy",
    gdzie: "Columbus Energy, Wrocław",
    opis: "Największa firma OZE w Polsce. Pozyskiwanie klientów na fotowoltaikę, prezentacje sprzedażowe, negocjacje umów.",
    tagi: ["Sprzedaż", "Fotowoltaika"],
  },
];

// Oś 02. Od najnowszego do najstarszego.
const NAUKA: Wpis[] = [
  {
    od: "03.2026",
    rok: "2026",
    rodzaj: "projekt",
    tytul: "Agent AI na Instagramie",
    gdzie: "Projekt",
    opis: "Wdrożenie agenta, który sam prowadzi rozmowy w wiadomościach prywatnych.",
  },
  {
    od: "02.2026",
    rok: "2026",
    rodzaj: "projekt",
    tytul: "Itera City",
    gdzie: "Projekt",
    opis: "Aplikacja mobilna. Przewodnik turystyczny oparty o AI: co zobaczyć, jak dojechać, historia miejsca.",
  },
  {
    od: "11.2025",
    rok: "2025",
    rodzaj: "wystapienie",
    tytul: "Szkolenie nauczycieli z AI",
    gdzie: "Wystąpienie",
    opis: "Konferencja. Praktyczne użycie AI w codziennej pracy nauczyciela.",
  },
  {
    od: "08.2024",
    rok: "2024",
    rodzaj: "wystapienie",
    tytul: "Prelekcja na CRASH Mondays",
    gdzie: "Wystąpienie",
    opis: "Jak wykorzystać dane i AI w nowoczesnej sprzedaży. Przykłady Żabki i Netflixa.",
  },
  {
    od: "06.2024",
    rok: "2024",
    rodzaj: "kurs",
    tytul: "AI Manager, certyfikat",
    gdzie: "Elephant AI, Maria Parysz",
    opis: "Wdrażanie AI w firmach. Prowadząca wdrażała AI w Rolls-Royce i Sephorze.",
  },
  {
    od: "11.2023",
    rok: "2023",
    rodzaj: "kurs",
    tytul: "Machina B2B",
    gdzie: "Szymon Negacz",
    opis: "Prospecting i marketing B2B.",
  },
  {
    od: "11.2023",
    do: "02.2024",
    rok: "2023",
    rodzaj: "projekt",
    tytul: "AI w SEO",
    gdzie: "Projekt",
    opis: "Strona z automatyczną publikacją artykułów. Ruch organiczny po 3 miesiącach, zero wcześniejszego doświadczenia w SEO.",
  },
  {
    od: "07.2023",
    rok: "2023",
    rodzaj: "kurs",
    tytul: "Liczy się oferta",
    gdzie: "Bartek Popiel",
    opis: "Pisanie ofert sprzedażowych.",
  },
  {
    od: "07.2023",
    rok: "2023",
    rodzaj: "kurs",
    tytul: "Mailketing",
    gdzie: "Maciej Aniserowicz",
    opis: "E-mail marketing.",
  },
  {
    od: "30.11.2022",
    rok: "2022",
    rodzaj: "przelom",
    tytul: "Premiera ChatGPT",
    gdzie: "Punkt zwrotny",
    opis: "Od tego dnia buduję z AI. Nie czytam o nim. Buduję, testuję, wdrażam.",
  },
  {
    od: "08.2022",
    rok: "2022",
    rodzaj: "kurs",
    tytul: "Digital Marketing Institute",
    gdzie: "DMI, Europa",
    opis: "Certyfikat digital marketingu.",
  },
  {
    od: "05.2021",
    rok: "2021",
    rodzaj: "kurs",
    tytul: "Google Ads",
    gdzie: "Google",
    opis: "Kampanie w wyszukiwarce.",
  },
  {
    od: "04.2020",
    do: "03.2021",
    rok: "2020",
    rodzaj: "kurs",
    tytul: "Akademia Expertów 2.0",
    gdzie: "Platforma edukacyjna",
    opis: "Roczny program digital marketingu.",
  },
  {
    od: "09.2014",
    do: "06.2017",
    rok: "2014",
    rodzaj: "kurs",
    tytul: "Liceum",
    gdzie: "LO nr 1 im. H. Sienkiewicza, Kołobrzeg",
    opis: "Matura.",
  },
];

const NARZEDZIA = [
  { nazwa: "AI i automatyzacja", pozycje: ["ChatGPT / Claude Code", "Agenci AI", "Automatyzacja procesów", "Prompt engineering", "Bazy wiedzy AI (RAG)"] },
  { nazwa: "Budowa aplikacji", pozycje: ["Next.js / React", "TypeScript", "Python", "Supabase", "Hosting i deploy"] },
  { nazwa: "Biznes", pozycje: ["Strategia i wdrażanie AI", "Analiza procesów", "Zarządzanie projektami", "Sprzedaż B2B", "Digital marketing"] },
];

const RODZAJ: Record<NonNullable<Wpis["rodzaj"]>, { etykieta: string; ton: "pelne" | "jasne" | "zielone" | "metal" }> = {
  kurs: { etykieta: "Kurs", ton: "jasne" },
  projekt: { etykieta: "Projekt AI", ton: "zielone" },
  wystapienie: { etykieta: "Wystąpienie", ton: "metal" },
  przelom: { etykieta: "Przełom", ton: "pelne" },
};

// ── Klocki typografii (1:1 z oferty PHC) ────────────────────────────────

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

function Etykieta({ children, ton }: { children: React.ReactNode; ton: "pelne" | "jasne" | "zielone" | "metal" }) {
  const style: Record<string, CSSProperties> = {
    pelne: { background: "var(--akcent)", color: "#fff" },
    jasne: { background: "var(--akcent-mgla)", color: "var(--akcent)" },
    zielone: { background: "rgba(22,163,74,0.12)", color: ZIELONY },
    metal: { background: "rgba(95,125,171,0.14)", color: "var(--metal-3)" },
  };
  return (
    <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={style[ton]}>
      {children}
    </span>
  );
}

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

// ── Oś czasu ────────────────────────────────────────────────────────────
// Pionowa linia z lewej, kółko na linii przy każdym wpisie, karta z prawej.
// Rok pokazujemy raz, przy pierwszym wpisie z danego roku (lista idzie od
// najnowszego). Na osi 02 kółko ma kolor rodzaju wpisu, na osi 01 wpis
// trwający do dziś ma kółko pełne, reszta jasne.

function Os({ wpisy, zRodzajem }: { wpisy: Wpis[]; zRodzajem?: boolean }) {
  return (
    <ol className="relative mt-10 pl-14 sm:pl-16">
      <span aria-hidden className="absolute bottom-6 left-[21px] top-6 w-px bg-[var(--ramka)] sm:left-[22px]" />
      {wpisy.map((w, i) => {
        const nowyRok = i === 0 || wpisy[i - 1].rok !== w.rok;
        const rodzaj = zRodzajem && w.rodzaj ? RODZAJ[w.rodzaj] : null;
        const ton = rodzaj ? rodzaj.ton : w.teraz ? "pelne" : "jasne";
        const zakres = w.do ? `${w.od} – ${w.do}` : w.od;
        return (
          <li key={`${w.od}-${w.tytul}`} className="relative pb-5 last:pb-0">
            <span className="absolute -left-14 top-5 sm:-left-16">
              <Kolko ton={ton} rozmiar="lg">
                {nowyRok ? w.rok.slice(2) : ""}
              </Kolko>
            </span>
            <div className={`${KARTA} p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <Nadtytul kolor="szary">{zakres}</Nadtytul>
                {rodzaj && <Etykieta ton={rodzaj.ton}>{rodzaj.etykieta}</Etykieta>}
                {!rodzaj && w.teraz && <Etykieta ton="pelne">teraz</Etykieta>}
              </div>
              <H3 className="mt-2">{w.tytul}</H3>
              <p className="mt-0.5 text-sm font-medium text-[var(--tekst-cichy)]">{w.gdzie}</p>
              <p className={`${TEKST} mt-3`}>{w.opis}</p>
              {w.tagi && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {w.tagi.map((t) => (
                    <span key={t} className="rounded-full bg-[var(--tlo-2)] px-3 py-1 text-xs font-medium text-[var(--tekst)]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ── Strona ──────────────────────────────────────────────────────────────

export function AboutMe() {
  const lata = new Date().getFullYear() - 2020;
  const projekty = NAUKA.filter((w) => w.rodzaj === "projekt").length;
  const wystapienia = NAUKA.filter((w) => w.rodzaj === "wystapienie").length;
  const kursy = NAUKA.filter((w) => w.rodzaj === "kurs").length - 1; // bez liceum

  return (
    <div style={PALETA as CSSProperties} className="min-h-screen bg-white text-[var(--tekst)] antialiased">
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
            <Nadtytul>Warszawa · wdrożenia AI, sprzedaż, marketing</Nadtytul>
            <h1 className="mt-5 text-[clamp(2.4rem,7vw,4.25rem)] leading-[1.04]" style={NAGLOWEK}>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, var(--metal-1) 0%, var(--metal-2) 40%, var(--metal-3) 60%, var(--metal-4) 100%)",
                }}
              >
                Jakub Chodakowski
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--tekst-cichy)] sm:text-xl">
              Zaczynałem od sprzedaży i marketingu w startupach. Od premiery ChatGPT buduję z AI:
              automatyzacje, agentów i aplikacje, które{" "}
              <span className="font-medium text-[var(--tekst)]">oszczędzają firmom czas i pieniądze</span>.
            </p>
          </div>

          <aside className={`${KARTA} flex flex-col gap-5 p-6 sm:p-7`}>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/jakub.jpg"
                alt="Jakub Chodakowski"
                className="size-20 shrink-0 rounded-full object-cover ring-4 ring-[var(--akcent-mgla)]"
              />
              <div>
                <Nadtytul kolor="szary">W liczbach</Nadtytul>
                <H3 className="mt-1">Od 2020 do dziś</H3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: `${lata}+`, o: "lat w sprzedaży i marketingu" },
                { l: String(PRACA.length), o: "firm i startupów" },
                { l: String(projekty), o: "projekty AI" },
                { l: String(wystapienia + kursy), o: "wystąpienia i kursy" },
              ].map((s) => (
                <div key={s.o} className="rounded-2xl bg-[var(--tlo-2)] p-4">
                  <p className="text-2xl leading-none tabular-nums" style={{ ...NAGLOWEK, color: "var(--akcent)" }}>
                    {s.l}
                  </p>
                  <p className="mt-1.5 text-xs text-[var(--tekst-cichy)]">{s.o}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* ── Treść: spis z lewej, rozdziały z prawej ─────────────────── */}
      <div className="mx-auto max-w-6xl px-5 lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">
        <Spis />

        <div className="divide-y divide-[var(--ramka)]">
          {/* 01 PRACA */}
          <section id="praca" className="scroll-mt-8 py-16">
            <H2 nr="01" nad="Oś czasu · praca">
              Gdzie pracowałem
            </H2>
            <Os wpisy={PRACA} />
          </section>

          {/* 02 NAUKA I AI */}
          <section id="nauka" className="scroll-mt-8 py-16">
            <H2 nr="02" nad="Oś czasu · nauka i AI">
              Kursy, projekty, wystąpienia
            </H2>
            <div className="mt-6 flex flex-wrap gap-2">
              {(Object.keys(RODZAJ) as Array<keyof typeof RODZAJ>).map((k) => (
                <Etykieta key={k} ton={RODZAJ[k].ton}>
                  {RODZAJ[k].etykieta}
                </Etykieta>
              ))}
            </div>
            <Os wpisy={NAUKA} zRodzajem />
          </section>

          {/* 03 NARZĘDZIA */}
          <section id="narzedzia" className="scroll-mt-8 py-16">
            <H2 nr="03" nad="Narzędzia">
              Z czym pracuję
            </H2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {NARZEDZIA.map((n) => (
                <div key={n.nazwa} className={`${KARTA} p-6`}>
                  <Nadtytul>{n.nazwa}</Nadtytul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {n.pozycje.map((p) => (
                      <span key={p} className="rounded-full bg-[var(--tlo-2)] px-3 py-1.5 text-xs font-medium">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className={`${KARTA} mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5`}>
              <div className="flex items-center gap-3">
                <Kolko ton="jasne" rozmiar="sm">EN</Kolko>
                <span className="text-sm">Angielski B2</span>
              </div>
              <div className="flex items-center gap-3">
                <Kolko ton="jasne" rozmiar="sm">B</Kolko>
                <span className="text-sm">Prawo jazdy kat. B</span>
              </div>
            </div>
          </section>

          {/* 04 KONTAKT */}
          <section id="kontakt" className="scroll-mt-8 py-16">
            <H2 nr="04" nad="Kontakt">
              Porozmawiajmy
            </H2>
            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className={`${KARTA} flex gap-4 px-6 py-5`}>
                <span className="w-1 shrink-0 rounded-full" style={{ background: "var(--akcent)" }} />
                <p className="text-lg leading-relaxed text-[var(--tekst-cichy)]">
                  Szukasz kogoś, kto wdroży AI w Twojej firmie albo poukłada sprzedaż i marketing? Napisz.
                </p>
              </div>
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
                    <p className="text-sm text-[var(--tekst-cichy)]">wdrożenia AI, sprzedaż, marketing</p>
                  </div>
                </div>
                <div className="mt-5 divide-y divide-[var(--ramka)] text-sm">
                  <a href="mailto:hello@jakubchodakowski.com" className="flex items-center justify-between gap-3 py-2.5 font-medium hover:underline">
                    <span className="text-[var(--tekst-cichy)]">E-mail</span>
                    <span className="truncate">hello@jakubchodakowski.com</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/jakub-chodakowski"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-2.5 font-medium hover:underline"
                  >
                    <span className="text-[var(--tekst-cichy)]">LinkedIn</span>
                    jakub-chodakowski
                  </a>
                </div>
                <a
                  href="mailto:hello@jakubchodakowski.com"
                  className="mt-6 block rounded-full bg-[var(--akcent)] px-6 py-3.5 text-center text-[15px] font-semibold text-white shadow-[0_8px_24px_var(--akcent-cien)] transition-colors hover:bg-[var(--akcent-ciemny)]"
                >
                  Napisz do mnie
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-[var(--ramka)]">
        <div className="mx-auto max-w-6xl px-5 py-8 text-xs text-[var(--tekst-cichy)]">
          <p>Jakub Chodakowski</p>
        </div>
      </footer>
    </div>
  );
}
