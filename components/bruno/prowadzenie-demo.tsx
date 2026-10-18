"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 17.10 (USER_001): konto DEMO (B2B, 1 rozmowa) nie ogląda filmu. Zamiast niego Bruno prowadzi krok po kroku:
// chmurka przy każdym polu, reszta ekranu przyciemniona, „Dalej” przechodzi do następnego pola.
// Kolejność (18.10): panel → Dostosuj: NAJPIERW „Wczytaj ofertę”, potem sprawdzenie i poprawa produktu, klienta,
// obiekcji → kreator rozmowy (6 kroków + Start) → ocena → fiszki w Treningu → kalendarz („Bruno dla zespołu”).
// Gdy chmurka jest na ekranie, strona się nie przewija (przewija ją tylko przewodnik do kolejnego pola).
// Cele = atrybuty data-tour / id w komponentach. Chmurka czeka, aż cel pojawi się na ekranie
// (ocena dopiero po rozmowie). Postęp w przeglądarce (localStorage), „Pomiń” kończy przewodnik.

type Krok = {
  id: string;
  sciezka: string;
  /** Selektory celu (pierwszy widoczny). Brak = chmurka na środku ekranu. */
  cel?: string[];
  tytul: [string, string];
  tekst: [string, string];
  /** Przycisk zamiast „Dalej”: tekst + adres, na który przechodzi. */
  przejdz?: { tekst: [string, string]; adres: string };
  /** Ostatni krok przed rozmową: chmurka znika, przewodnik wraca po rozmowie (ocena). */
  przycisk?: [string, string];
};

const KROKI: Krok[] = [
  {
    id: "witaj",
    sciezka: "/bruno/panel",
    tytul: ["Hi! I'm Bruno", "Cześć! Jestem Bruno"],
    tekst: [
      "I'll show you around step by step. We start with your offer: I read your website and set myself up as your customer.",
      "Pokażę Ci wszystko krok po kroku. Zaczynamy od Twojej oferty: przeczytam Twoją stronę i ustawię się jako Twój klient.",
    ],
    przejdz: { tekst: ["Let's start", "Zaczynamy"], adres: "/bruno/dostosuj" },
  },
  {
    id: "oferta",
    sciezka: "/bruno/dostosuj",
    cel: ['[data-tour="oferta"]'],
    tytul: ["Load your offer", "Wczytaj ofertę"],
    tekst: [
      "Paste your website address or pick a PDF and click Load. I'll fill in the fields below. Then we check them one by one.",
      "Wklej adres swojej strony albo wybierz PDF i kliknij Wczytaj. Wypełnię pola poniżej. Potem sprawdzimy je po kolei.",
    ],
  },
  {
    id: "produkt",
    sciezka: "/bruno/dostosuj",
    cel: ["#produkt"],
    tytul: ["Check: what you sell", "Sprawdź: co sprzedajesz"],
    tekst: ["Fix anything that's off: price, who it's for, what makes it different.", "Popraw, jeśli coś się nie zgadza: cena, dla kogo, czym się wyróżnia."],
  },
  {
    id: "klient",
    sciezka: "/bruno/dostosuj",
    cel: ["#klient"],
    tytul: ["Check: your customer", "Sprawdź: Twój klient"],
    tekst: ["Age, job title, what they're afraid of, who they decide with. I'll play exactly this person.", "Wiek, stanowisko, czego się boi, z kim decyduje. Zagram dokładnie tę osobę. Popraw, jeśli trzeba."],
  },
  {
    id: "obiekcje",
    sciezka: "/bruno/dostosuj",
    cel: ["#obiekcje"],
    tytul: ["Check: objections", "Sprawdź: obiekcje"],
    tekst: ["One per line, for example “Too expensive”. Add the ones you hear most. I'll use them in the call.", "Jedna w linii, np. „Za drogo”. Dopisz te, które słyszysz najczęściej. Użyję ich w rozmowie."],
  },
  {
    id: "zapis",
    sciezka: "/bruno/dostosuj",
    tytul: ["Saved", "Zapisane"],
    tekst: ["Everything saves on its own. Now the call.", "Wszystko zapisuje się samo. Teraz rozmowa."],
    przejdz: { tekst: ["Go to the call", "Przejdź do rozmowy"], adres: "/bruno/rozmowa" },
  },
  {
    id: "k1",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="kreator-1"]'],
    tytul: ["1. Call type", "1. Rodzaj rozmowy"],
    tekst: ["Cold call, meeting in person or online. Pick what your team does most.", "Zimny telefon, spotkanie na żywo albo online. Wybierz to, co Twój zespół robi najczęściej."],
  },
  {
    id: "k2",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="kreator-2"]'],
    tytul: ["2. Customer's voice", "2. Głos klienta"],
    tekst: ["A man (Bruno) or a woman (Anna).", "Mężczyzna (Bruno) albo kobieta (Anna)."],
  },
  {
    id: "k3",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="kreator-3"]'],
    tytul: ["3. Objections", "3. Obiekcje"],
    tekst: ["Tick the ones you want to practice. You can pick more than one.", "Zaznacz te, które chcesz przećwiczyć. Możesz kilka."],
  },
  {
    id: "k4",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="kreator-4"]'],
    tytul: ["4. Call goal", "4. Cel rozmowy"],
    tekst: ["What should happen at the end, for example a booked meeting or a signed deal.", "Co ma się wydarzyć na końcu, np. umówione spotkanie albo podpisana umowa."],
  },
  {
    id: "k5",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="kreator-5"]'],
    tytul: ["5. Customer type", "5. Typ klienta"],
    tekst: ["4 colors, 4 personalities. Each one reacts differently.", "4 kolory, 4 charaktery. Każdy reaguje inaczej."],
  },
  {
    id: "k6",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="kreator-6"]'],
    tytul: ["6. Difficulty", "6. Poziom trudności"],
    tekst: ["Start with medium.", "Zacznij od średniego."],
  },
  {
    id: "start",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="start"]'],
    tytul: ["Click Start", "Kliknij Start"],
    tekst: [
      "Put on headphones. I'll pick up like a real customer. You have 3 minutes. At the end, ask for a decision.",
      "Załóż słuchawki. Odbiorę jak prawdziwy klient. Masz 3 minuty. Na końcu poproś o decyzję.",
    ],
    przycisk: ["Got it", "Rozumiem"],
  },
  {
    id: "ocena",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="ocena"]'],
    tytul: ["Your score", "Twoja ocena"],
    tekst: ["From 1 to 10. Bruno the coach listened to the whole call.", "Od 1 do 10. Bruno-trener słuchał całej rozmowy."],
  },
  {
    id: "plusy",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="plusy"]', '[data-tour="plusy-tel"]'],
    tytul: ["Pluses and minuses", "Plusy i minusy"],
    tekst: ["What worked and what didn't, with quotes from your call.", "Co zagrało, a co nie, z cytatami z Twojej rozmowy."],
  },
  {
    id: "poprawka",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="poprawka"]'],
    tytul: ["One thing to fix", "Jedna rzecz do poprawy"],
    tekst: ["Your reps get this after every call.", "Twoi handlowcy dostają to po każdej rozmowie."],
  },
  {
    id: "do-fiszek",
    sciezka: "/bruno/rozmowa",
    cel: ['[data-tour="poprawka"]'],
    tytul: ["Now: flashcards", "Teraz fiszki"],
    tekst: ["I turned your mistakes from this call into flashcards. Let's see one.", "Z błędów w tej rozmowie zrobiłem fiszki. Zobaczmy jedną."],
    przejdz: { tekst: ["Go to flashcards", "Przejdź do fiszek"], adres: "/bruno/trening" },
  },
  {
    id: "fiszka",
    sciezka: "/bruno/trening",
    cel: ['[data-tour="fiszka"]'],
    tytul: ["Flashcards from your mistakes", "Fiszki z Twoich błędów"],
    tekst: [
      "Objections and moments from your calls. Each one comes back at the right time, so it sticks.",
      "Obiekcje i momenty z Twoich rozmów. Każda wraca w dobrym momencie, żeby zostało w głowie.",
    ],
  },
  {
    id: "odpowiedz",
    sciezka: "/bruno/trening",
    cel: ["#odp"],
    tytul: ["Answer like you would to a customer", "Odpowiedz jak klientowi"],
    tekst: ["Type it or say it out loud, then click Check. The coach scores it and shows a model answer.", "Napisz albo powiedz głosem, potem kliknij Sprawdź. Trener oceni i pokaże wzór odpowiedzi."],
  },
  {
    id: "koniec",
    sciezka: "/bruno/trening",
    tytul: ["Bruno for your whole team", "Bruno dla całego zespołu"],
    tekst: ["Book an online meeting to talk about Bruno for your team.", "Umów spotkanie online, aby omówić Bruno dla Twojego zespołu."],
    przejdz: { tekst: ["Book a meeting", "Umów spotkanie"], adres: "/bruno/odblokuj" },
  },
];

const KLUCZ = "bruno_demo_prowadzenie";
const czytaj = (email: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(`${KLUCZ}:${email}`) ?? "[]");
  } catch {
    return [];
  }
};
const zapisz = (email: string, zrobione: string[]) => {
  try {
    localStorage.setItem(`${KLUCZ}:${email}`, JSON.stringify(zrobione));
  } catch {}
};

function znajdz(cel?: string[]): HTMLElement | null {
  for (const sel of cel ?? []) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}

type Ramka = { top: number; left: number; width: number; height: number };

export default function ProwadzenieDemo({ email }: { email: string }) {
  const { t } = useT();
  const sciezka = usePathname() ?? "";
  const router = useRouter();
  const [zrobione, setZrobione] = useState<string[] | null>(null);
  const [ramka, setRamka] = useState<Ramka | null>(null);
  const [gotowy, setGotowy] = useState(false);

  useEffect(() => setZrobione(czytaj(email)), [email]);

  // Pierwszy niezrobiony krok tej strony (kroki z innych stron nie blokują, np. ktoś wszedł prosto w Test).
  const krok = useMemo(() => (zrobione ? KROKI.find((k) => k.sciezka === sciezka && !zrobione.includes(k.id)) ?? null : null), [zrobione, sciezka]);

  const oznacz = useCallback(
    (ids: string[]) => {
      setZrobione((z) => {
        const nowe = [...new Set([...(z ?? []), ...ids])];
        zapisz(email, nowe);
        return nowe;
      });
      setGotowy(false);
      setRamka(null);
    },
    [email],
  );

  // Czekamy na cel (pojawia się później, np. ocena po rozmowie), potem przewijamy i mierzymy.
  useEffect(() => {
    if (!krok) return;
    if (!krok.cel) {
      setRamka(null);
      setGotowy(true);
      return;
    }
    let el: HTMLElement | null = null;
    let przewiniety = false;
    const mierz = () => {
      el = znajdz(krok.cel);
      if (!el) {
        setGotowy(false);
        return;
      }
      if (!przewiniety) {
        przewiniety = true;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      const r = el.getBoundingClientRect();
      setRamka({ top: r.top, left: r.left, width: r.width, height: r.height });
      setGotowy(true);
    };
    mierz();
    const co = window.setInterval(mierz, 250);
    window.addEventListener("resize", mierz);
    window.addEventListener("scroll", mierz, { passive: true });
    return () => {
      window.clearInterval(co);
      window.removeEventListener("resize", mierz);
      window.removeEventListener("scroll", mierz);
    };
  }, [krok]);

  // Pozycja chmurki: pod celem, a gdy brak miejsca, nad nim. Bez celu = środek ekranu.
  const [okno, setOkno] = useState({ w: 1024, h: 768 });
  useLayoutEffect(() => {
    const licz = () => setOkno({ w: window.innerWidth, h: window.innerHeight });
    licz();
    window.addEventListener("resize", licz);
    return () => window.removeEventListener("resize", licz);
  }, []);

  // 18.10 (USER_001): gdy chmurka jest na ekranie, strony nie da się przewijać. Przewodnik przewija sam
  // (scrollIntoView działa mimo overflow: hidden), użytkownik nie. Pole w dziurze dalej da się klikać i pisać.
  const widoczny = Boolean(krok && gotowy);
  useEffect(() => {
    if (!widoczny) return;
    const html = document.documentElement;
    const body = document.body;
    const przed = [html.style.overflow, body.style.overflow, html.style.overscrollBehavior];
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    // iOS Safari ignoruje overflow na body przy przesuwaniu palcem: blokujemy przesuwanie poza polami tekstowymi.
    const dotyk = (e: TouchEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("textarea, [role=dialog]")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", dotyk, { passive: false });
    return () => {
      [html.style.overflow, body.style.overflow, html.style.overscrollBehavior] = przed;
      document.removeEventListener("touchmove", dotyk);
    };
  }, [widoczny]);

  if (!krok || !gotowy) return null;

  const nr = KROKI.indexOf(krok) + 1;
  const szer = Math.min(360, okno.w - 32);
  const MARGINES = 14;
  let styl: React.CSSProperties;
  if (ramka) {
    const pod = ramka.top + ramka.height + MARGINES;
    const miejscePod = okno.h - pod;
    const left = Math.min(Math.max(16, ramka.left + ramka.width / 2 - szer / 2), okno.w - szer - 16);
    styl = miejscePod > 220 || ramka.top < 240 ? { top: Math.min(pod, okno.h - 240), left, width: szer } : { bottom: okno.h - ramka.top + MARGINES, left, width: szer };
  } else {
    styl = { top: "50%", left: "50%", width: szer, transform: "translate(-50%, -50%)" };
  }

  const dalej = () => {
    if (krok.przejdz) {
      oznacz([krok.id]);
      router.push(krok.przejdz.adres);
      return;
    }
    oznacz([krok.id]);
  };
  const pomin = () => oznacz(KROKI.map((k) => k.id));
  const tekstPrzycisku = krok.przejdz ? t(...krok.przejdz.tekst) : krok.przycisk ? t(...krok.przycisk) : t("Next", "Dalej");

  // Portal do <body>: panel ma własne warstwy (kafelki nad nakładką), więc chmurka idzie na sam wierzch.
  return createPortal(
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483000 }} aria-live="polite">
      {/* Przyciemnienie z „dziurą” na cel. Klikać da się wszędzie (pointer-events: none), chmurka ma własne. */}
      {ramka ? (
        <div
          className="fixed rounded-2xl transition-all duration-300 ease-out motion-reduce:transition-none"
          style={{ top: ramka.top - 8, left: ramka.left - 8, width: ramka.width + 16, height: ramka.height + 16, boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px #d4af5a" }}
        />
      ) : (
        <div className="fixed inset-0" style={{ background: "rgba(0,0,0,0.6)" }} />
      )}
      <div
        role="dialog"
        aria-label={t(...krok.tytul)}
        className="fixed pointer-events-auto rounded-2xl shadow-2xl p-5 flex flex-col gap-3 transition-[top,left,bottom] duration-300 motion-reduce:transition-none"
        // Kolory inline: motyw panelu (czarno-złoty) nadpisuje klasy bg-white / text-slate-*.
        style={{ ...styl, background: "#ffffff", color: "#0b0b0b", border: "1px solid rgba(212,175,90,0.6)", backdropFilter: "none" }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#8a8a8a" }}>
            {nr} / {KROKI.length}
          </span>
          <button type="button" onClick={pomin} className="text-xs underline" style={{ color: "#8a8a8a", background: "none" }}>
            {t("Skip guide", "Pomiń przewodnik")}
          </button>
        </div>
        <p className="text-[17px] font-semibold leading-snug" style={{ color: "#0b0b0b" }}>{t(...krok.tytul)}</p>
        <p className="text-[15px] leading-relaxed" style={{ color: "#4a4a4a" }}>{t(...krok.tekst)}</p>
        <div className="flex justify-end">
          <button type="button" onClick={dalej} className="rounded-full text-sm font-semibold px-5 py-2.5 active:scale-[0.97] transition-transform" style={{ background: "#0b0b0b", color: "#ffffff" }}>
            {tekstPrzycisku}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
