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
  /** 9.10: własny 3. kafelek (handlowcy: zamiast „Trening się zwraca” o firmach). */
  korzysc3?: { liczba: string; tytul: string; zrodlo: string };
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
    ctaBok: "30-minute call. I will show you Bruno playing your own customer, live.",
    stopka: "AI sales practice for teams",
  },
  reps: {
    linkInny: { href: "/brunobusiness", tekst: "For teams" },
    navCta: "I want to test it",
    menuCta: "I want free access",
    hero: ["Start selling", "MORE."],
    treningDol: "Bruno AI coaches you every day",
    kroki: [
      { maly: "Step 1", tytul: "You practice\nreal sales calls", opis: "Bruno plays a tough customer. Your product, your market, your objections. Any time, on your own." },
      { maly: "Step 2", tytul: "You get feedback\n+ a review plan", opis: "After each call you see what worked and what to fix. Bruno schedules your next practice so the skill sticks." },
      { maly: "Step 3", tytul: "You walk into real calls\nready", opis: "The objections you practiced with Bruno do not surprise you on a real call. You know your next line." },
    ],
    krokiCta: "Try Bruno free",
    korzysciH: "What sales training gives you",
    korzysc3: { liczba: "17%", tytul: "Join the top reps", zrodlo: "Ebsta x Pavilion, GTM Benchmarks 2025" },
    korzysciOpis: [
      "Reps coached regularly, on a plan, win 32% more forecast deals than reps coached only by chance.",
      "Regular, structured coaching lifts quota attainment by 28% compared with coaching that happens only now and then.",
      "17% of sales reps bring in 81% of the revenue. Practice is the shortest way into that group.",
    ],
    ctaH: ["Practice with Bruno.", "3 calls free."],
    ctaBtn: "I want free access",
    ctaBok: "Your first 3 calls with Bruno are free. No card.",
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
    ctaBok: "30 minut rozmowy. Pokażę Ci na żywo, jak Bruno gra Waszego klienta.",
    stopka: "Trening sprzedaży z AI dla zespołów",
  },
  reps: {
    linkInny: { href: "/brunobusiness", tekst: "Dla firm" },
    navCta: "Chcę przetestować",
    menuCta: "Chcę bezpłatny dostęp",
    hero: ["Zacznij więcej", "sprzedawać."],
    treningDol: "Bruno AI trenuje Cię codziennie",
    kroki: [
      { maly: "Krok 1", tytul: "Ćwiczysz\nprawdziwe rozmowy", opis: "Bruno gra trudnego klienta. Twój produkt, Twój rynek, Twoje obiekcje. O każdej porze, sam." },
      { maly: "Krok 2", tytul: "Otrzymujesz feedback\n+ plan powtórek", opis: "Po każdej rozmowie widzisz, co zagrało, a co poprawić. Bruno planuje kolejny trening, żeby umiejętność została." },
      { maly: "Krok 3", tytul: "Wchodzisz w prawdziwe rozmowy\ngotowy", opis: "Obiekcje przećwiczone z Bruno nie zaskoczą Cię w prawdziwej rozmowie. Wiesz, co powiedzieć." },
    ],
    krokiCta: "Wypróbuj Bruno za darmo",
    korzysciH: "Co daje trening sprzedaży?",
    korzysc3: { liczba: "17%", tytul: "Dołącz do najlepszych", zrodlo: "Ebsta x Pavilion, GTM Benchmarks 2025" },
    korzysciOpis: [
      "Handlowcy trenowani regularnie, według planu, wygrywają o 32% więcej szans sprzedaży niż trenowani od przypadku do przypadku.",
      "Regularny trening według planu podnosi realizację planu o 28% w porównaniu z treningiem od czasu do czasu.",
      "17% handlowców przynosi 81% przychodu. Trening to najkrótsza droga do tej grupy.",
    ],
    ctaH: ["Ćwicz z Bruno.", "3 rozmowy za darmo."],
    ctaBtn: "Chcę bezpłatny dostęp",
    ctaBok: "Pierwsze 3 rozmowy z Bruno są za darmo. Bez karty.",
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

// 9.10 (USER_001): sekcje tylko dla handlowców (/brunoai): zarobki najlepszych, „Pokaż szefowi”, FAQ.
// Zarobki: BLS, Occupational Employment and Wages, maj 2024, „Sales Representatives, Wholesale and
// Manufacturing, Technical and Scientific Products” (41-4011): mediana 100 070 $, górne 10% od 194 890 $.
const REPS = {
  en: {
    zarH: "How much do the best reps earn?",
    sredni: "Typical sales rep",
    najlepsi: "Top 10% of sales reps",
    rocznie: "a year",
    zarTekst: "The best reps are not born that way. They practice more calls than everyone else.",
    zarZrodlo: "U.S. Bureau of Labor Statistics, May 2024, technical and scientific sales reps",
    szefH: "Want Bruno for your whole team?",
    szefTekst: "Send this page to your manager. Bruno for teams has team plans and a demo call.",
    szefMail: "Email it to my manager",
    szefKopiuj: "Copy the link",
    szefSkopiowane: "Link copied",
    szefTemat: "Bruno AI for our sales team",
    szefTresc: "Hi,\n\nI found Bruno AI. It is an AI customer our reps can practice sales calls with before real ones. Every call gets a score and a practice plan.\n\nHere is the page for teams, you can book a 30-minute demo there:\n",
    faqH: "Questions",
    faq: [
      ["What is Bruno?", "An AI customer you talk to out loud. Bruno plays a buyer for your product, raises real objections and tries to end the call. After every call you get a score and a practice plan."],
      ["What do I need?", "A computer with Chrome, a microphone and headphones. Nothing to install."],
      ["How long is one call?", "3 minutes, plus 45 seconds to close the deal."],
      ["Can my company pay for it?", "Yes. Send your manager jakubchodakowski.com/brunobusiness, the page for teams."],
    ],
  },
  pl: {
    zarH: "Ile zarabiają najlepsi handlowcy?",
    sredni: "Przeciętny handlowiec",
    najlepsi: "Najlepsze 10% handlowców",
    rocznie: "rocznie",
    zarTekst: "Najlepsi nie rodzą się najlepsi. Ćwiczą więcej rozmów niż wszyscy inni.",
    zarZrodlo: "U.S. Bureau of Labor Statistics, maj 2024, handlowcy techniczni i naukowi (USA)",
    szefH: "Chcesz Bruno dla całego zespołu?",
    szefTekst: "Wyślij tę stronę szefowi. Bruno dla firm ma plany dla zespołów i rozmowę z demo.",
    szefMail: "Wyślij szefowi mailem",
    szefKopiuj: "Kopiuj link",
    szefSkopiowane: "Skopiowano",
    szefTemat: "Bruno AI dla naszego zespołu sprzedaży",
    szefTresc: "Cześć,\n\nznalazłem Bruno AI. To klient AI, z którym nasi handlowcy mogą ćwiczyć rozmowy, zanim zadzwonią do prawdziwego. Każda rozmowa dostaje ocenę i plan ćwiczeń.\n\nTu jest strona dla firm, można umówić 30-minutowe demo:\n",
    faqH: "Pytania",
    faq: [
      ["Czym jest Bruno?", "Klientem AI, z którym rozmawiasz na głos. Bruno gra kupującego Twój produkt, zgłasza prawdziwe obiekcje i próbuje skończyć rozmowę. Po każdej rozmowie dostajesz ocenę i plan ćwiczeń."],
      ["Czego potrzebuję?", "Komputera z Chrome, mikrofonu i słuchawek. Nic nie instalujesz."],
      ["Ile trwa jedna rozmowa?", "3 minuty plus 45 sekund na domknięcie."],
      ["Czy firma może za to zapłacić?", "Tak. Wyślij szefowi stronę dla firm: jakubchodakowski.com/brunobusiness."],
    ],
  },
} as const;

// 9.10 (USER_001): cennik dla handlowców = JEDEN pakiet, 250 $ / mies. albo 2 500 $ z góry za rok
// (2 miesiące gratis). Bez Jakuba w pakiecie („Bruno jest trenerem, nie ja”). 5 rozmów dziennie (USER_001 9.10, było 6).
const CENNIK = {
  en: {
    h: "One plan. Everything in it.",
    mies: "Monthly",
    rok: "Yearly",
    gratis: "2 months free",
    cenaMies: "$250",
    okresMies: "/ month",
    cenaRok: "$2,500",
    okresRok: "/ year",
    podRok: "That is $208 a month, paid once a year.",
    podMies: "Cancel any time.",
    nazwa: "Bruno Pro",
    lista: [
      "5 calls with Bruno every day",
      "Feedback after every call",
      "Practice and review plan",
      "Recording and transcript of every call",
      "Bruno knows your product",
      "Your objections, your script, your customer",
      "3 call types: cold call, in-person meeting, online meeting",
      "4 customer types: dominant, social, steady, analytical",
      "3 levels: easy, medium, hard",
      "Practice tomorrow's real call today",
      "Warm-up before a real call",
      "Stats and progress over time",
      "Daily reminders",
    ],
    cta: "I start for free",
    pod: "No card for the free calls.",
  },
  pl: {
    h: "Jeden plan. Wszystko w środku.",
    mies: "Miesięcznie",
    rok: "Rocznie",
    gratis: "2 miesiące gratis",
    cenaMies: "250 $",
    okresMies: "/ mies.",
    cenaRok: "2 500 $",
    okresRok: "/ rok",
    podRok: "To 208 $ miesięcznie, płatne raz w roku.",
    podMies: "Rezygnujesz w każdej chwili.",
    nazwa: "Bruno Pro",
    lista: [
      "5 rozmów z Bruno każdego dnia",
      "Feedback po każdej rozmowie",
      "Plan ćwiczeń i powtórek",
      "Nagranie i transkrypcja każdej rozmowy",
      "Bruno zna Twój produkt",
      "Twoje obiekcje, Twój skrypt, Twój klient",
      "3 rodzaje rozmów: zimny telefon, spotkanie na żywo, spotkanie online",
      "4 typy klientów: dominujący, towarzyski, stabilny, analityczny",
      "3 poziomy trudności: łatwy, średni, trudny",
      "Przećwicz dziś prawdziwą rozmowę, którą masz jutro",
      "Ćwiczenia przed prawdziwą rozmową",
      "Statystyki i postęp",
      "Codzienne przypomnienia",
    ],
    cta: "Zaczynam za darmo",
    pod: "Do darmowych rozmów nie potrzebujesz karty.",
  },
} as const;

// 9.10 (USER_001): sekcja „Zobacz Bruno w środku”: 3 zrzuty ekranu (panel, rozmowa, feedback).
// Zrzuty wchodzą po poprawie designu panelu (zadanie 3 na 10.10); do tego czasu ramki z podpisem.
const ZRZUTY = {
  en: { h: "See Bruno inside", pod: [["Your panel", "Today's plan, your calls, your progress"], ["A call with Bruno", "Bruno talks back, raises objections, pushes to end the call"], ["Feedback", "Score, what worked, what to fix next time"]] },
  pl: { h: "Zobacz Bruno w środku", pod: [["Twój panel", "Plan dnia, Twoje rozmowy, Twój postęp"], ["Rozmowa z Bruno", "Bruno odpowiada, zgłasza obiekcje, próbuje skończyć rozmowę"], ["Feedback", "Ocena, co zagrało, co poprawić następnym razem"]] },
} as const;
const ZRZUTY_PLIKI = ["/bruno-zrzut-panel.png", "/bruno-zrzut-rozmowa.png", "/bruno-zrzut-feedback.png"];

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
    // 9.10: link prosto do zapisu (np. w cold mailu): /brunobusiness#demo
    if (window.location.hash.startsWith("#demo")) setPokazFormularz(true);
  }, []);
  const t = TEKSTY[jezyk][wersja];
  const u = UI[jezyk];
  const KROKI = t.kroki;
  const rootRef = useRef<HTMLDivElement>(null);
  const [pokazFormularz, setPokazFormularz] = useState(false);
  const [menu, setMenu] = useState(false);
  const [skopiowane, setSkopiowane] = useState(false);
  const [roczny, setRoczny] = useState(false);
  // 9.10 (USER_001): sekcja „Zobacz Bruno w środku” jak scrollytelling: 3 punkty po lewej, laptop po prawej
  // stoi w miejscu, obraz w laptopie zmienia się, gdy kolejny punkt wjeżdża na środek ekranu.
  const [aktywnyZrzut, setAktywnyZrzut] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (wersja !== "reps" || pokazFormularz) return;
    const licz = () => {
      const el = scrollRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const droga = el.offsetHeight - window.innerHeight;
      const postep = droga > 0 ? Math.min(1, Math.max(0, -r.top / droga)) : 0;
      setAktywnyZrzut(Math.min(2, Math.floor(postep * 3)));
    };
    licz();
    window.addEventListener("scroll", licz, { passive: true });
    window.addEventListener("resize", licz);
    return () => {
      window.removeEventListener("scroll", licz);
      window.removeEventListener("resize", licz);
    };
  }, [wersja, pokazFormularz]);

  // Numer przycisku leci do Analytics: 1 = pod krokami, 2 = pod korzyściami, 3 = nawigacja.
  const otworzFormularz = (przycisk: number) => () => {
    setMenu(false);
    track("salesai_cta", { przycisk, wersja });
    // 9.10 (USER_001): na stronie dla handlowców każdy przycisk prowadzi do /bruno (założenie darmowego konta albo logowanie).
    if (wersja === "reps") {
      window.location.href = "/bruno";
      return;
    }
    setPokazFormularz(true);
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
      <nav className={`${s.nav} ${pokazFormularz ? s.navFormularz : ""}`}>
        <div className={s.navL}>
          <a className={s.logo} href="#top" onClick={doSekcji("top")}>
            Bruno AI
          </a>
          <div className={`${s.pill} ${s.pillLight}`}>
            <a href="#kroki" onClick={doSekcji("kroki")}>
              {u.jak}
            </a>
            <a href="#korzysci" onClick={doSekcji("korzysci")}>
              {u.wyniki}
            </a>
            <a href={t.linkInny.href}>{t.linkInny.tekst}</a>
          </div>
        </div>
        {/* 9.10 (USER_001): bez przycisku „Menu”; przycisk zapisu w stylu dawnego „Menu” (czarny, biała kropka). */}
        <button type="button" className={`${s.pill} ${s.pillBlack}`} onClick={otworzFormularz(3)}>
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
                  <div className={s.benefitNum}>{i === 2 && t.korzysc3 ? t.korzysc3.liczba : k.liczba}</div>
                  <h3>{i === 2 && t.korzysc3 ? t.korzysc3.tytul : u.korzysci[i][0]}</h3>
                  <p>{t.korzysciOpis[i]}</p>
                  <span className={s.src}>{u.zrodlo} {i === 2 && t.korzysc3 ? t.korzysc3.zrodlo : u.korzysci[i][1]}</span>
                </li>
              ))}
            </ul>
          </section>

          {wersja === "reps" && (
            <>
              {/* Zarobki najlepszych (BLS, maj 2024). */}
              <section className={s.block} id="zarobki">
                <div className={`${s.blockHead} ${s.blockHeadPelny}`}>
                  <h2 className={s.rv}>{REPS[jezyk].zarH}</h2>
                </div>
                <div className={s.zarobki}>
                  <div className={`${s.zarobek} ${s.rv}`}>
                    <span className={s.zarEtykieta}>{REPS[jezyk].sredni}</span>
                    <span className={s.zarKwota}>$100,070</span>
                    <span className={s.zarRok}>{REPS[jezyk].rocznie}</span>
                  </div>
                  <div className={`${s.zarobek} ${s.zarobekTop} ${s.rv} ${s.d1}`}>
                    <span className={s.zarEtykieta}>{REPS[jezyk].najlepsi}</span>
                    <span className={s.zarKwota}>$194,890+</span>
                    <span className={s.zarRok}>{REPS[jezyk].rocznie}</span>
                  </div>
                </div>
                <p className={`${s.zarTekst} ${s.rv}`}>{REPS[jezyk].zarTekst}</p>
                <span className={s.src}>{u.zrodlo} {REPS[jezyk].zarZrodlo}</span>
                {/* 9.10 (USER_001): przycisk zapisu pod zarobkami. */}
                <div className={`${s.panelCta} ${s.rv}`}>
                  <button type="button" className={`${s.btnDark} ${s.btnBig}`} onClick={otworzFormularz(6)}>
                    {t.ctaBtn}
                  </button>
                </div>
              </section>
            </>
          )}

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
            {/* 9.10 (USER_001): na stronie dla handlowców przycisk jest pod laptopem, nie pod krokami. */}
            {wersja !== "reps" && (
              <div className={`${s.panelCta} ${s.rv}`}>
                <button type="button" className={`${s.btnDark} ${s.btnBig}`} onClick={otworzFormularz(1)}>
                  {t.krokiCta}
                </button>
              </div>
            )}
          </div>

          {wersja === "reps" && (
            <>
              {/* Zobacz Bruno w środku: 3 punkty po lewej, laptop po prawej (sticky), obraz zmienia się przy przewijaniu. */}
              <section className={`${s.block} ${s.zrzutyBlok}`} id="zrzuty" aria-label={ZRZUTY[jezyk].h}>
                <div className={s.scrollTor} ref={scrollRef}>
                  <div className={s.scroll}>
                    <ol className={s.scrollPunkty}>
                      {ZRZUTY[jezyk].pod.map(([tytul, opis], i) => (
                        <li key={tytul} className={`${s.scrollPunkt} ${aktywnyZrzut === i ? s.scrollPunktOn : ""} ${aktywnyZrzut > i ? s.scrollPunktZrob : ""}`}>
                          <button type="button" className={s.scrollPunktBtn} onClick={() => setAktywnyZrzut(i)}>
                            <span className={s.scrollNr}>{aktywnyZrzut > i ? "✓" : i + 1}</span>
                            <span className={s.scrollTxt}>
                              <b>{tytul}</b>
                              <span>{opis}</span>
                            </span>
                          </button>
                          {i < 2 && <span className={s.scrollLinia} aria-hidden />}
                        </li>
                      ))}
                    </ol>
                    <div className={s.scrollLaptop}>
                      <div className={s.laptop}>
                        <div className={s.laptopEkran} data-brak={jezyk === "pl" ? "zrzut ekranu wkrótce" : "screenshot coming soon"}>
                          {ZRZUTY_PLIKI.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={src} src={src} alt={ZRZUTY[jezyk].pod[i][0]} loading="lazy" className={aktywnyZrzut === i ? s.laptopObrazOn : ""} onError={(e) => (e.currentTarget.style.display = "none")} />
                          ))}
                        </div>
                        <div className={s.laptopPodstawa} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cennik: jeden pakiet, miesięcznie albo rocznie. */}
              <section className={`${s.block} ${s.cennikBlok}`} id="cennik">
                <div className={`${s.blockHead} ${s.blockHeadPelny}`}>
                  <h2 className={s.rv}>{CENNIK[jezyk].h}</h2>
                </div>
                <div className={s.cennikPrzelacznik} role="group" aria-label={jezyk === "pl" ? "Okres płatności" : "Billing period"}>
                  <button type="button" aria-pressed={!roczny} className={!roczny ? s.cennikOn : ""} onClick={() => setRoczny(false)}>{CENNIK[jezyk].mies}</button>
                  <button type="button" aria-pressed={roczny} className={roczny ? s.cennikOn : ""} onClick={() => setRoczny(true)}>
                    {CENNIK[jezyk].rok} <span className={s.cennikGratis}>{CENNIK[jezyk].gratis}</span>
                  </button>
                </div>
                <div className={s.cennikKarta}>
                  <div className={s.cennikNazwa}>{CENNIK[jezyk].nazwa}</div>
                  <div className={s.cennikCena}>
                    <span>{roczny ? CENNIK[jezyk].cenaRok : CENNIK[jezyk].cenaMies}</span>
                    <small>{roczny ? CENNIK[jezyk].okresRok : CENNIK[jezyk].okresMies}</small>
                  </div>
                  <p className={s.cennikPod}>{roczny ? CENNIK[jezyk].podRok : CENNIK[jezyk].podMies}</p>
                  <ul className={s.cennikLista}>
                    {CENNIK[jezyk].lista.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                  <button type="button" className={`${s.btnDark} ${s.btnBig} ${s.cennikCta}`} onClick={otworzFormularz(4)}>
                    {CENNIK[jezyk].cta}
                  </button>
                  <p className={s.cennikPod}>{CENNIK[jezyk].pod}</p>
                </div>
              </section>

              {/* FAQ */}
              <section className={`${s.block} ${s.faqBlok}`} id="faq">
                <div className={s.blockHead}>
                  <h2 className={s.rv}>{REPS[jezyk].faqH}</h2>
                </div>
                <div className={s.faq}>
                  {REPS[jezyk].faq.map(([p, o]) => (
                    <details key={p} className={s.faqItem}>
                      <summary>{p}</summary>
                      <p>{o}</p>
                    </details>
                  ))}
                </div>
              </section>
            </>
          )}

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

          {/* 9.10 (USER_001): przyklejony przycisk zapisu na telefonie. */}
          <div className={s.lepki}>
            <button type="button" className={`${s.btnDark} ${s.btnBig}`} onClick={otworzFormularz(5)}>
              {t.ctaBtn}
            </button>
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
