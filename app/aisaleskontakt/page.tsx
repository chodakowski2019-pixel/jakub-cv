"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { firmowyEmail } from "@/lib/firmowy-email";

// Wariant jasny + szkło (USER_001 28.09).
//
// Tło ustawiane inline, bo globals.css maluje body na ciemno (#0a1218 + mesh).
// Ten sam chwyt co na /seo.
//
// Akcent zostaje cyan, ale przyciemniony do 700: #22d3ee na białym ma kontrast
// ok. 1.7:1 i jest nieczytelny, #0e7490 ma 4.9:1.
//
// Szkło na białym tle nie ma czego rozmywać, więc pod kartą leżą miękkie plamy
// cyan/teal/sky. Karta jest półprzezroczysta, ale pola formularza w środku są
// pełne białe: nie nakładamy jasnego szkła na jasne szkło, bo tekst przestaje
// być czytelny.
const TLO = "#ffffff";

// Lista stanowisk = grupa docelowa z researchu 28.09.
// Kolejność od decydenta do użytkownika, bo pierwsza opcja jest najczęściej klikana.
const ZAWODY = [
  "Dyrektor sprzedaży",
  "Kierownik zespołu sprzedaży",
  "Właściciel firmy",
  "Handlowiec",
  "Inne",
];

// Kafelki nad formularzem (USER_001 29.09). Treści przychodzą od USER_001,
// poniżej ZAŚLEPKI do podmiany. Stary nagłówek ("Twoi handlowcy uczą się na
// Twoich klientach") odłożony do SalesAI/COPY-ODLOZONE.md na inną stronę.
// Grafiki 3 kroków: SVG w kodzie, kreska w kolorach strony (cyan 700 / teal 700).
// Bez plików PNG: ostre na retinie, zero dodatkowego ładowania, łatwo przemalować.
const KRESKA = { fill: "none", stroke: "url(#bruno-grad)", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Gradient() {
  return (
    <defs>
      <linearGradient id="bruno-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0e7490" />
        <stop offset="1" stopColor="#0f766e" />
      </linearGradient>
    </defs>
  );
}

// Krok 1: człowiek i AI w rozmowie, dwa dymki.
function GrafikaRozmowa() {
  return (
    <svg viewBox="0 0 96 96" className="w-24 h-24" aria-hidden>
      <Gradient />
      {/* człowiek */}
      <circle cx="26" cy="34" r="9" {...KRESKA} />
      <path d="M10 66c0-10 7-16 16-16s16 6 16 16" {...KRESKA} />
      {/* AI: głowa robota */}
      <rect x="58" y="26" width="24" height="20" rx="6" {...KRESKA} />
      <circle cx="66" cy="36" r="2" fill="#0e7490" />
      <circle cx="74" cy="36" r="2" fill="#0f766e" />
      <path d="M70 26v-6M64 20h12" {...KRESKA} />
      <path d="M56 66c0-10 6-16 14-16s14 6 14 16" {...KRESKA} />
      {/* dymki */}
      <path d="M38 12h20a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5h-8l-6 5v-5h-6a5 5 0 0 1-5-5v-6a5 5 0 0 1 5-5z" {...KRESKA} />
      <path d="M40 76h16M40 82h10" {...KRESKA} />
    </svg>
  );
}

// Krok 2: karta wyniku z ocenami i wykresem po rozmowie.
function GrafikaFeedback() {
  return (
    <svg viewBox="0 0 96 96" className="w-24 h-24" aria-hidden>
      <Gradient />
      <rect x="18" y="14" width="60" height="68" rx="8" {...KRESKA} />
      <path d="M36 14v-4h24v4" {...KRESKA} />
      {/* wiersze z zaliczeniem */}
      <path d="M30 34l4 4 8-8" {...KRESKA} />
      <path d="M48 34h18" {...KRESKA} />
      <path d="M30 50l4 4 8-8" {...KRESKA} />
      <path d="M48 50h18" {...KRESKA} />
      {/* wiersz do poprawy */}
      <circle cx="34" cy="66" r="4" {...KRESKA} />
      <path d="M48 66h12" {...KRESKA} />
      {/* gwiazdka oceny */}
      <path d="M72 6l2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L64 11.8l5.4-.8z" fill="#0e7490" stroke="none" />
    </svg>
  );
}

// Krok 3: słupki rosną, strzałka w górę, cel trafiony.
function GrafikaWynik() {
  return (
    <svg viewBox="0 0 96 96" className="w-24 h-24" aria-hidden>
      <Gradient />
      <path d="M14 80h68" {...KRESKA} />
      <rect x="20" y="58" width="12" height="22" rx="3" {...KRESKA} />
      <rect x="40" y="44" width="12" height="36" rx="3" {...KRESKA} />
      <rect x="60" y="28" width="12" height="52" rx="3" fill="url(#bruno-grad)" stroke="none" opacity="0.9" />
      {/* strzałka trendu */}
      <path d="M18 46l20-14 14 8 22-20" {...KRESKA} />
      <path d="M64 20h10v10" {...KRESKA} />
    </svg>
  );
}

const KROKI: { tytul: string; opis: string; grafika: React.ReactNode }[] = [
  {
    tytul: "Spotkania sprzedażowe 1:1",
    opis: "Rozmawiasz z Bruno jak z prawdziwym klientem.",
    grafika: <GrafikaRozmowa />,
  },
  {
    tytul: "Dostajesz feedback\n+ plan powtórek",
    opis: "Po rozmowie wiesz, co jest skuteczne, i utrwalasz to w pamięci.",
    grafika: <GrafikaFeedback />,
  },
  {
    tytul: "Lepiej sprzedajesz na żywo",
    opis: "Przećwiczone techniki przenosisz na prawdziwe rozmowy z klientami.",
    grafika: <GrafikaWynik />,
  },
];

// Korzyści = liczby z researchu 25.09 i 28.09 (SalesAI/PLAN.md). Trzy wybrane
// przez USER_001 29.09 (ROI 353 % wyleciał). Tytuł = liczba, opis = co znaczy, zrodlo = skąd.
// Liczba jest grafiką kafelka (jak ikony w krokach), reszta tytułu pod nią (USER_001 29.09).
function GrafikaLiczba({ liczba }: { liczba: string }) {
  // Dłuższy zapis ("76 % vs 47 %") dostaje mniejszą czcionkę, żeby zmieścić się w kafelku.
  const dluga = liczba.length > 7;
  return (
    <span
      className={`whitespace-nowrap px-5 font-extrabold font-[var(--font-poppins)] tracking-[-0.04em] leading-none bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent ${
        dluga ? "text-[1.9rem] sm:text-[2.1rem]" : "text-[2.6rem] sm:text-[3rem]"
      }`}
    >
      {liczba}
    </span>
  );
}

const KORZYSCI: { liczba: string; tytul: string; opis: string; zrodlo: string }[] = [
  {
    liczba: "+28 %",
    tytul: "Domkniętych rozmów",
    opis: "O tyle rośnie skuteczność domykania po treningach.",
    zrodlo: "RAIN Group, badanie 472 firm",
  },
  {
    liczba: "76 % vs 47 %",
    tytul: "Realizacji planu sprzedażowego",
    opis: "Tyle robią handlowcy trenowani 1 raz w tygodniu, a tyle 1 raz na kwartał.",
    zrodlo: "MySalesCoach, badanie 3 700 handlowców, 2026",
  },
  {
    liczba: "+170 %",
    tytul: "Lepsze zapamiętanie technik",
    opis: "Tyle daje trening z powtórkami zamiast jednorazowego. Bruno planuje powtórki za Ciebie.",
    zrodlo: "RAIN Group, program wzmocnień",
  },
];

function Kafelek({
  numer,
  tytul,
  opis,
  grafika,
  zrodlo,
}: {
  numer: number;
  tytul: string;
  opis: string;
  grafika?: React.ReactNode;
  zrodlo?: string;
}) {
  // Nie uzywa .karta-szklo: <style jsx> w stronie jest zakresowy i nie siega
  // do tego komponentu. Te same wartosci wpisane klasami Tailwind.
  return (
    <li className="relative overflow-hidden rounded-2xl p-5 sm:p-6 text-left flex flex-col gap-3 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/90 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.22),0_2px_10px_-4px_rgba(15,23,42,0.1),inset_0_1px_0_rgba(255,255,255,0.9)]">
      {/* Numer jako znak wodny: wielka cyfra w tle, prawy górny róg (USER_001 29.09).
          Kolor = bardzo jasny cyan, żeby nie walczył z tekstem. */}
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -top-5 right-3 sm:right-4 text-[11rem] sm:text-[12rem] leading-none font-extrabold font-[var(--font-poppins)] tracking-[-0.06em] text-cyan-700/10"
      >
        {numer}
      </span>
      {grafika && (
        <div className="relative self-center min-w-28 h-28 rounded-2xl bg-white/70 border border-cyan-600/15 flex items-center justify-center shrink-0">
          {grafika}
        </div>
      )}
      {/* \n w tytule = łamanie wiersza tylko od md w górę. Na telefonie jedna linia (USER_001 29.09). */}
      <h3 className="relative text-base sm:text-lg font-bold font-[var(--font-poppins)] tracking-[-0.01em] leading-snug">
        {tytul.split("\n").map((czesc, i, arr) => (
          <span key={i}>
            {czesc}
            {i < arr.length - 1 && (
              <>
                <span className="md:hidden"> </span>
                <br className="hidden md:inline" />
              </>
            )}
          </span>
        ))}
      </h3>
      <p className="relative text-slate-600 text-sm sm:text-[15px] leading-relaxed">{opis}</p>
      {zrodlo && <p className="relative mt-auto pt-2 text-[11px] text-slate-400">Źródło: {zrodlo}</p>}
    </li>
  );
}

export default function AiSalesKontaktPage() {
  // Weryfikacja przed dostępem (USER_001 29.09): formularz zbiera to, po czym
  // odsiewamy firmy poza ICP (5-40 handlowców): liczbę handlowców, produkt
  // i FIRMOWY adres e-mail. Po wysłaniu komunikat o weryfikacji do 24 h,
  // ankieta konfiguracyjna już się tu nie pokazuje (idzie linkiem po weryfikacji).
  const [form, setForm] = useState({
    imie: "",
    email: "",
    telefon: "",
    zawod: "",
    handlowcy: "",
    produkt: "",
    zgoda: false,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [blad, setBlad] = useState<string | null>(null);
  // Formularz pokazuje się dopiero po kliknięciu jednego z 3 przycisków (USER_001 29.09).
  // Numer przycisku leci do Analytics: będzie widać, który tekst przekonuje.
  const [pokazFormularz, setPokazFormularz] = useState(false);
  const otworzFormularz = (przycisk: number) => () => {
    setPokazFormularz(true);
    track("salesai_cta", { przycisk });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const przyciskCls =
    "inline-block px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-700 to-teal-700 text-white font-semibold text-[15px] sm:text-base active:scale-[0.98] hover:brightness-110 transition-all duration-150 shadow-lg shadow-cyan-800/25";

  const set =
    (k: "imie" | "email" | "telefon" | "handlowcy" | "produkt") => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const emailPrywatny = form.email.includes("@") && !firmowyEmail(form.email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    if (!firmowyEmail(form.email)) {
      setBlad("Podaj firmowy adres e-mail (nie Gmail, WP, Onet itp.).");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/aisaleskontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, handlowcy: Number(form.handlowcy) }),
      });
      if (res.ok) {
        setStatus("ok");
        // Zdarzenie w Vercel Analytics: same wejscia nie mowia nic o skutecznosci.
        // Zawod i liczba handlowców lecą jako wymiary, zeby bylo widac, kto realnie wypelnia.
        track("salesai_lead", { zawod: form.zawod, handlowcy: Number(form.handlowcy) });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const body = (await res.json().catch(() => null)) as { blad?: string } | null;
        setBlad(body?.blad ?? null);
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const inputCls =
    "w-full bg-white border border-slate-300/90 rounded-xl px-4 py-3 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 transition-all duration-150";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 tracking-[0.01em]";

  return (
    <div
      className="min-h-screen text-slate-900 font-[var(--font-open-sans)]"
      style={{ background: TLO }}
    >
      {/* Materiał robi się tylko wtedy, gdy ma co rozmywać. Te plamy są tym, co widać przez szkło. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-white">
        <div
          className="absolute -top-32 -left-24 w-[620px] h-[620px] rounded-full blur-[120px] opacity-70"
          style={{ background: "radial-gradient(closest-side, #a5f3fc, transparent)" }}
        />
        <div
          className="absolute top-1/3 -right-32 w-[560px] h-[560px] rounded-full blur-[120px] opacity-60"
          style={{ background: "radial-gradient(closest-side, #99f6e4, transparent)" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-[640px] h-[520px] rounded-full blur-[130px] opacity-50"
          style={{ background: "radial-gradient(closest-side, #bae6fd, transparent)" }}
        />
      </div>

      <main className="relative px-6 py-14 sm:py-20">
        {/* Copy nad formularzem (USER_001 28.09) pod ruch z reklamy na Instagramie.
            Ruch z cold maila zna juz kontekst, ruch z reklamy nie, wiec formularz
            nie moze byc pierwsza rzecza na ekranie. */}
        {status !== "ok" && !pokazFormularz && (
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-[2.2rem] sm:text-[3.25rem] font-bold font-[var(--font-poppins)] leading-[1.08] tracking-[-0.025em] mb-8 sm:mb-10">
              Jak działa{" "}
              <span className="bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
                Bruno AI
              </span>
              ?
            </h1>
            <ul className="grid gap-4 md:grid-cols-3 mb-8 sm:mb-10">
              {KROKI.map((k, i) => (
                <Kafelek key={k.tytul} numer={i + 1} tytul={k.tytul} opis={k.opis} grafika={k.grafika} />
              ))}
            </ul>

            {/* Przycisk 1: pod 3 krokami, po wyjaśnieniu czym jest Bruno AI (USER_001 29.09). */}
            <div className="mb-12 sm:mb-16">
              <button type="button" onClick={otworzFormularz(1)} className={przyciskCls}>
                Chcę przetestować narzędzie!
              </button>
            </div>

            <h2 className="text-[2rem] sm:text-[2.75rem] font-bold font-[var(--font-poppins)] leading-[1.1] tracking-[-0.02em] mb-6 sm:mb-8">
              Korzyści
            </h2>
            <ul className="grid gap-4 md:grid-cols-3 mb-12 sm:mb-14">
              {KORZYSCI.map((k, i) => (
                <Kafelek
                  key={k.tytul}
                  numer={i + 1}
                  tytul={k.tytul}
                  opis={k.opis}
                  zrodlo={k.zrodlo}
                  grafika={<GrafikaLiczba liczba={k.liczba} />}
                />
              ))}
            </ul>

            {/* Przycisk 2: pod korzyściami, w miejscu dawnego wezwania „Otrzymaj dostęp...”.
                Bez obwódki (USER_001 29.09). */}
            <button type="button" onClick={otworzFormularz(2)} className={przyciskCls}>
              Chcę otrzymać dostęp do narzędzia bezpłatnie!
            </button>
          </div>
        )}

        {status !== "ok" && pokazFormularz && (
          <div className="max-w-md mx-auto text-center mb-8">
            <h1 className="text-[1.9rem] sm:text-[2.5rem] font-bold font-[var(--font-poppins)] leading-[1.1] tracking-[-0.025em]">
              <span className="bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
                Wypełnij formularz,
              </span>
              <br /> aby otrzymać dostęp
            </h1>
          </div>
        )}

        {status === "ok" ? (
          // Komunikat o weryfikacji (USER_001 29.09). Lead zapisany, mail poszedł.
          // Dostęp + ankieta konfiguracyjna idą mailem po ręcznej weryfikacji.
          <div className="karta-szklo max-w-md mx-auto rounded-3xl p-8 sm:p-10 text-center">
            <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-white/80 border border-cyan-600/20 flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden>
                <Gradient />
                <circle cx="24" cy="24" r="17" {...KRESKA} />
                <path d="M24 13v11l7 5" {...KRESKA} />
              </svg>
            </div>
            <h1 className="text-[1.75rem] sm:text-[2.25rem] font-bold font-[var(--font-poppins)] leading-[1.1] tracking-[-0.02em] mb-4">
              Trwa weryfikacja
            </h1>
            <p className="text-slate-600 text-base leading-relaxed mb-3">
              Może potrwać do <span className="font-semibold text-slate-800">24 godzin</span>.
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              Po jej zakończeniu prześlemy na <span className="font-semibold text-slate-800">{form.email}</span>{" "}
              bezpłatny dostęp do Bruno AI na 7 dni.
            </p>
          </div>
        ) : pokazFormularz ? (
          <div className="karta-szklo max-w-md mx-auto rounded-3xl p-6 sm:p-8">
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <label className={labelCls} htmlFor="imie">
                  Imię *
                </label>
                <input
                  id="imie"
                  required
                  autoComplete="given-name"
                  className={inputCls}
                  placeholder="Adam"
                  value={form.imie}
                  onChange={set("imie")}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="email">
                  Firmowy adres email *
                </label>
                <input
                  id="email"
                  required
                  type="email"
                  autoComplete="email"
                  aria-invalid={emailPrywatny}
                  className={`${inputCls} ${emailPrywatny ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/15" : ""}`}
                  placeholder="adam@twojafirma.pl"
                  value={form.email}
                  onChange={set("email")}
                />
                {emailPrywatny && (
                  <p className="mt-1.5 text-[12px] text-amber-700">
                    Podaj adres w domenie firmy. Prywatne skrzynki nie przechodzą weryfikacji.
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls} htmlFor="telefon">
                  Numer telefonu <span className="font-normal text-slate-400">(opcjonalnie)</span>
                </label>
                <input
                  id="telefon"
                  type="tel"
                  autoComplete="tel"
                  className={inputCls}
                  placeholder="+48 600 000 000"
                  value={form.telefon}
                  onChange={set("telefon")}
                />
              </div>

              <fieldset>
                <legend className={labelCls}>Wybierz swoją rolę *</legend>
                <div className="flex flex-wrap gap-2">
                  {ZAWODY.map((z) => {
                    const wybrany = form.zawod === z;
                    return (
                      <button
                        key={z}
                        type="button"
                        aria-pressed={wybrany}
                        onClick={() => setForm((f) => ({ ...f, zawod: z }))}
                        className={`px-3.5 py-2 rounded-xl text-[13px] border shadow-sm active:scale-[0.97] transition-all duration-150 ${
                          wybrany
                            ? "bg-cyan-600 border-cyan-600 text-white font-medium"
                            : "bg-white border-slate-300/90 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                        }`}
                      >
                        {z}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label className={labelCls} htmlFor="handlowcy">
                  Ilu handlowców jest w Twojej firmie? *
                </label>
                <input
                  id="handlowcy"
                  required
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={9999}
                  step={1}
                  className={inputCls}
                  placeholder="np. 8"
                  value={form.handlowcy}
                  onChange={set("handlowcy")}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="produkt">
                  Jaki produkt sprzedajecie? *
                </label>
                <input
                  id="produkt"
                  required
                  maxLength={200}
                  className={inputCls}
                  placeholder="np. ubezpieczenia na życie dla firm"
                  value={form.produkt}
                  onChange={set("produkt")}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  checked={form.zgoda}
                  onChange={(e) => setForm((f) => ({ ...f, zgoda: e.target.checked }))}
                  className="mt-0.5 w-[18px] h-[18px] shrink-0 rounded accent-cyan-600 cursor-pointer"
                />
                <span className="text-[12px] text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors duration-150">
                  Zgadzam się na kontakt telefoniczny i mailowy w sprawie pilotażu. Administratorem danych jest
                  Jakub Chodakowski, NIP 6711845485. Zgodę mogę wycofać w każdej chwili.
                </span>
              </label>

              {(blad || status === "error") && (
                <p className="text-red-700 text-sm text-center">
                  {blad ?? "Coś poszło nie tak. Napisz na hello@jakubchodakowski.com"}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !form.zawod || emailPrywatny}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-700 to-teal-700 text-white font-semibold text-sm active:scale-[0.98] hover:brightness-110 transition-all duration-150 shadow-lg shadow-cyan-800/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {status === "sending" ? "Wysyłam..." : "Wyślij →"}
              </button>
            </form>
          </div>
        ) : null}
      </main>

      <style jsx>{`
        .karta-szklo {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          /* jasna górna krawędź = światło łapiące się materiału */
          border: 1px solid rgba(255, 255, 255, 0.85);
          box-shadow:
            0 24px 60px -20px rgba(15, 23, 42, 0.22),
            0 2px 10px -4px rgba(15, 23, 42, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        /* Gdy ktoś wyłączył przezroczystość, szkło robi się szybą matową. */
        @media (prefers-reduced-transparency: reduce) {
          .karta-szklo {
            background: #ffffff;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border-color: rgb(203 213 225);
          }
        }
      `}</style>
    </div>
  );
}
