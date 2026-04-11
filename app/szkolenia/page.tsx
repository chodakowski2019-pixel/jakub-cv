import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Szkolenia AI dla Firm — Jakub Chodakowski",
  description:
    "Praktyczne szkolenia z AI dla firm i zespołów. Wdrożenie narzędzi, automatyzacja procesów, szkolenie pracowników. Bez teorii — konkretne efekty od pierwszego dnia.",
};

export default function SzkoleniaPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-[var(--font-geist-sans)]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>jakubchodakowski.com</span>
          </Link>
          <a
            href="mailto:chodakowski2019@gmail.com?subject=Szkolenie AI dla firmy"
            className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/20"
          >
            Zapytaj o wycenę
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-4">
            Dla firm i zespołów
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Szkolenia{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              AI dla firm
            </span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Twój zespół traci godziny na powtarzalne zadania. Pokazuję, jak AI
            może to robić za nich — szybciej, taniej, bez błędów. Bez teorii,
            bez slajdów. Wchodzimy, włączamy narzędzia i działamy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:chodakowski2019@gmail.com?subject=Szkolenie AI dla firmy"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/20"
            >
              Zapytaj o wycenę →
            </a>
            <a
              href="#oferty"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 transition-all duration-300"
            >
              Zobacz oferty
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-6 border-y border-white/[0.04] bg-white/[0.015]">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { value: "20+", label: "godzin oszczędności tygodniowo" },
            { value: "1 dzień", label: "i zespół działa z AI" },
            { value: "100%", label: "praktyki, 0% teorii" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Oferty */}
      <section id="oferty" className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Oferty szkoleń
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
            Trzy formaty — od szybkiego warsztatu po pełne wdrożenie AI w
            firmie. Każdy dopasowany do rozmiaru i potrzeb zespołu.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                tag: "Popularny start",
                name: "Warsztat AI",
                duration: "3–4h",
                highlight: false,
                desc: "Jeden intensywny warsztat. Zespół poznaje najważniejsze narzędzia AI i wychodzi z gotowymi promptami do swojej pracy.",
                points: [
                  "ChatGPT, Claude — praktyczne demo",
                  "Prompty dopasowane do branży",
                  "Live: robimy to razem",
                  "Lista narzędzi do zabrania",
                ],
              },
              {
                tag: "Rekomendowany",
                name: "Szkolenie + Wdrożenie",
                duration: "2 dni",
                highlight: true,
                desc: "Dzień 1: szkolenie zespołu. Dzień 2: wspólne wdrożenie AI w konkretnych procesach firmy. Efekty widoczne od razu.",
                points: [
                  "Audyt procesów przed szkoleniem",
                  "Szkolenie dla całego zespołu",
                  "Wdrożenie w 2–3 realnych procesach",
                  "Dokumentacja i materiały po",
                  "Wsparcie przez 30 dni",
                ],
              },
              {
                tag: "Dla zarządu",
                name: "AI Strategy",
                duration: "2h",
                highlight: false,
                desc: "Strategiczne spojrzenie na AI w firmie. Dla CEO, dyrektorów i managerów. Gdzie AI da największy ROI i jak zacząć.",
                points: [
                  "Analiza procesów pod AI",
                  "Mapa wdrożenia (co, kiedy, jak)",
                  "ROI i oszczędności",
                  "Plan działania na 90 dni",
                ],
              },
            ].map((offer, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border transition-all duration-500 flex flex-col ${
                  offer.highlight
                    ? "border-emerald-500/30 bg-emerald-500/[0.05] shadow-lg shadow-emerald-500/5"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15"
                }`}
              >
                <div className="mb-4">
                  <span
                    className={`text-xs font-mono uppercase tracking-widest ${
                      offer.highlight ? "text-emerald-400" : "text-neutral-500"
                    }`}
                  >
                    {offer.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">{offer.name}</h3>
                <p className="text-sm text-neutral-500 font-mono mb-4">
                  {offer.duration}
                </p>
                <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                  {offer.desc}
                </p>
                <ul className="space-y-2 mb-8 flex-1">
                  {offer.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="text-sm text-neutral-300">{point}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:chodakowski2019@gmail.com?subject=Zapytanie: ${offer.name}`}
                  className={`w-full py-3 rounded-full text-sm font-medium text-center transition-all duration-300 ${
                    offer.highlight
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
                      : "border border-white/10 text-neutral-300 hover:text-white hover:border-white/25"
                  }`}
                >
                  Zapytaj o wycenę
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dla kogo */}
      <section className="py-16 px-6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Dla jakich firm?
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
            Pracuję z firmami każdej wielkości. Ważne: masz zespół, który chce
            pracować mądrzej.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: "🏢",
                title: "Małe i średnie firmy (5–100 osób)",
                desc: "Szkolę cały team naraz. Każdy wychodzi z narzędziami AI dopasowanymi do swojej roli — sprzedaż, marketing, obsługa klienta, administracja.",
              },
              {
                icon: "📊",
                title: "Działy i zespoły w dużych firmach",
                desc: "Wybrany dział dostaje specjalistyczne szkolenie. Np. marketing uczy się AI w content i analityce, HR — AI w rekrutacji i onboardingu.",
              },
              {
                icon: "🚀",
                title: "Startupy",
                desc: "Szybkie tempo, wysokie oczekiwania. Wdrożenie AI od razu w kluczowych procesach — żeby rosnąć bez proporcjonalnego wzrostu kosztów.",
              },
              {
                icon: "👔",
                title: "Zarządy i management",
                desc: "Strategiczne szkolenie dla liderów. Jak AI zmieni Twoją branżę, gdzie działać teraz i jak zarządzać transformacją AI w firmie.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15 transition-all duration-500"
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tematy */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Tematy szkoleń
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
            To przykłady — zawsze układam program pod konkretną firmę i branżę.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              {
                cat: "Podstawy AI dla zespołu",
                items: [
                  "ChatGPT i Claude w codziennej pracy",
                  "Prompt engineering — jak rozmawiać z AI, żeby działało",
                  "AI w komunikacji: maile, raporty, prezentacje",
                  "Narzędzia AI według roli (sprzedaż, HR, marketing, ops)",
                ],
              },
              {
                cat: "Automatyzacja i procesy",
                items: [
                  "Automatyzacja powtarzalnych zadań (Make, Zapier + AI)",
                  "AI w obsłudze klienta — chatboty i asystenci",
                  "AI w analizie danych i raportowaniu",
                  "Tworzenie agentów AI dla Twojego biznesu",
                ],
              },
            ].map((group, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                <p className="text-xs font-mono text-emerald-400/70 uppercase tracking-widest mb-4">
                  {group.cat}
                </p>
                <ul className="space-y-3">
                  {group.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">
                        →
                      </span>
                      <span className="text-sm text-neutral-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">
            Doświadczenie
          </h2>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03]">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src="https://media.licdn.com/dms/image/v2/D4D22AQGgY4uuKD4_Wg/feedshare-shrink_800/feedshare-shrink_800/0/1721579818961?e=1776902400&v=beta&t=nc7AvLjWta4XPXQEkne5n8VLyJNDXpOh-chq8FihyK8"
                  alt="CRASH Mondays"
                  className="w-full md:w-48 h-36 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-xs font-mono text-emerald-400/60 mb-2">
                    Sierpień 2024
                  </p>
                  <h3 className="font-semibold mb-2">
                    Prelekcja na CRASH Mondays
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Temat: jak wykorzystać AI i dane w nowoczesnej sprzedaży.
                    Przykłady firm jak Żabka i Netflix, które zrewolucjonizowały
                    sprzedaż dzięki AI.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03]">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src="https://prod-fillout-oregon-s3.s3.us-west-2.amazonaws.com/orgid-542209/flowpublicid-i6Cw5dBunXus/67d299c9-f5c0-43d9-9c4a-a82550520903-PY7fXcqHejnPSSmEpcSes2G21gE0LB3EHvtMcsKDWCILwz6wAthEeP1GLLNhvxjHDq2alxyhhFwTCrEYqnrF4TpYtTlUqiN4OgC/Screenshot-2026-04-04-at-1.45.04aAM.png"
                  alt="Konferencja nauczyciele"
                  className="w-full md:w-48 h-36 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-xs font-mono text-emerald-400/60 mb-2">
                    Listopad 2025
                  </p>
                  <h3 className="font-semibold mb-2">
                    Konferencja — szkolenie z AI
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Szkoliłem uczestników z praktycznego wykorzystania AI w
                    codziennej pracy. Warsztat live — uczestnicy wychodzili z
                    gotowymi narzędziami.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
            Najczęstsze pytania
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Ile kosztuje szkolenie?",
                a: "Wycena zależy od formatu (warsztat / 2 dni / strategia), liczby uczestników i zakresu. Napisz do mnie — odpisz z konkretną propozycją w ciągu 24h.",
              },
              {
                q: "Czy szkolenie jest stacjonarne czy online?",
                a: "Obydwa formaty są dostępne. Szkolenia stacjonarne są bardziej efektywne (łatwiej robić live demo), ale online działa równie dobrze dla mniejszych grup.",
              },
              {
                q: "Jak szybko można zorganizować szkolenie?",
                a: "Najszybciej w ciągu 2 tygodni od potwierdzenia. Zaczyna się od 15-minutowej rozmowy, żebym mógł dopasować program.",
              },
              {
                q: "Czy zespół musi mieć doświadczenie z AI?",
                a: "Nie. Zaczynam od podstaw. Każde szkolenie jest dostosowane do poziomu grupy — od zera do sprawnego korzystania z AI w 1 dzień.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                <h3 className="font-semibold mb-2 text-sm">{item.q}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Gotowy na AI w firmie?
            </h2>
            <p className="text-neutral-400 mb-3 max-w-md mx-auto">
              Napisz do mnie z krótkim opisem firmy, liczby uczestników i celu
              szkolenia.
            </p>
            <p className="text-neutral-500 text-sm mb-10 max-w-md mx-auto">
              Odpiszę w ciągu 24h z propozycją programu i wyceną.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:chodakowski2019@gmail.com?subject=Szkolenie AI dla firmy"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/20"
              >
                chodakowski2019@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/jakub-chodakowski"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 transition-all duration-300"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-400 transition-colors">
            Jakub Chodakowski &copy; {new Date().getFullYear()}
          </Link>
          <span className="font-mono">jakubchodakowski.com/szkolenia</span>
        </div>
      </footer>
    </div>
  );
}
