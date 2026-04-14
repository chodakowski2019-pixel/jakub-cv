import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Oferta szkolenia AI dla nauczycieli — Jakub Chodakowski",
  description:
    "AI nie zastąpi nauczyciela, który potrafi z niej korzystać. Szkolenie dla rad pedagogicznych — teoria + warsztat praktyczny. Certyfikat dla każdego uczestnika.",
};

const agenda = [
  {
    part: "Część I — Teoria",
    duration: "2h 30min",
    items: [
      {
        title: "Nauczyciel przed AI i po AI",
        duration: "45 min",
        points: [
          "Dlaczego tyle pracujemy po godzinach — i czy da się to zmienić",
          "Czym tak naprawdę jest AI i co potrafi zrobić za nas",
          "Prawdziwe przykłady: opinia o uczniu w 2 minuty, test w 5 minut, wiadomość do rodzica w 30 sekund",
          "AI nie zastępuje nauczyciela — zastępuje papierkową robotę",
        ],
      },
      {
        title: "Pięć narzędzi, których użyjesz już w poniedziałek",
        duration: "45 min",
        points: [
          "ChatGPT, Claude, Gemini — pokaz na żywo",
          "Canva AI — prezentacja w 5 minut",
          "Gamma.app — wpisujesz temat, dostajesz gotowe slajdy",
          "Co jest za darmo, co kosztuje. Które działają po polsku.",
        ],
      },
      {
        title: "Jak rozmawiać z AI żeby rozumiało o co chodzi",
        duration: "30 min",
        points: [
          "Dlaczego AI czasem daje złe odpowiedzi — i jak tego uniknąć",
          "Prosty schemat: powiedz kim jesteś + co chcesz + dla kogo to jest",
          "Gotowe szablony do zabrania do domu — dla każdego przedmiotu",
        ],
      },
      {
        title: "Czy to jest bezpieczne? — co wolno, czego nie",
        duration: "15 min",
        points: [
          "Danych uczniów nie wklejamy do AI — dlaczego i jak to obejść",
          "Co z prawami autorskimi do materiałów stworzonych przez AI",
          "Jak sprawdzić, czy uczeń oddał pracę napisaną przez AI",
        ],
      },
    ],
  },
  {
    part: "Część II — Ćwiczenia praktyczne",
    duration: "2h",
    items: [
      {
        title: "Tworzenie materiałów do lekcji",
        duration: "40 min",
        points: [
          "Wpisujesz temat i klasę — dostajesz gotowy plan lekcji",
          "Test z odpowiedziami w 3 minuty",
          "Zadania dla uczniów słabszych i zdolnych — jednym kliknięciem",
          "Każdy tworzy materiał do swojego przedmiotu",
        ],
      },
      {
        title: "Koniec z godzinami przy dokumentach",
        duration: "25 min",
        points: [
          "Opinia o uczniu: mówisz co wiesz, AI pisze treść",
          "Wiadomość do trudnego rodzica — bez stresu",
          "Sprawozdania, wnioski, plany — szybciej niż myślisz",
          "Piszemy razem opinię o uczniu — na żywo",
        ],
      },
      {
        title: "Twój osobisty asystent AI",
        duration: "40 min",
        points: [
          "Ustawiamy AI tak, żeby znało Twój przedmiot i Twoje klasy",
          "Od teraz pamięta Twoje preferencje i pisze w Twoim stylu",
          "Każdy wychodzi z gotowym, skonfigurowanym asystentem",
        ],
      },
    ],
  },
];

const pricing = [
  {
    name: "Wariant podstawowy",
    duration: "2,5h — sama teoria",
    price: "3 500 zł",
    description:
      "Wykład dla rady pedagogicznej. Teoria, demo na żywo, Q&A. Każdy nauczyciel wychodzi z listą narzędzi i gotowymi szablonami.",
    included: [
      "Część I — teoria (2h 30min)",
      "Sesja Q&A",
      "Materiały do pobrania",
      "Certyfikat dla każdego uczestnika",
    ],
  },
  {
    name: "Wariant pełny",
    duration: "5h — teoria + warsztat",
    price: "4 500 zł",
    highlight: true,
    description:
      "Pełny dzień szkoleniowy. Teoria + 2h ćwiczeń praktycznych. Każdy nauczyciel wychodzi z własnym asystentem AI i gotowymi materiałami do swojego przedmiotu.",
    included: [
      "Część I — teoria (2h 30min)",
      "Przerwa kawowa",
      "Część II — warsztat praktyczny (2h)",
      "Sesja Q&A",
      "Materiały do pobrania",
      "Certyfikat dla każdego uczestnika",
    ],
  },
];

export default function OfertaPage() {
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
            href="mailto:chodakowski2019@gmail.com?subject=Szkolenie AI — zapytanie"
            className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/20"
          >
            Umów rozmowę
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-4">
            Szkolenie dla nauczycieli
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 leading-tight">
            AI nie zastąpi nauczyciela,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              który potrafi z niej korzystać
            </span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Jak zaoszczędzić nawet 10 godzin pracy tygodniowo
          </p>
        </div>
      </section>

      {/* Quick info bar */}
      <section className="py-6 px-6 border-y border-white/[0.04] bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { label: "Dla kogo", value: "Rada pedagogiczna" },
              { label: "Czas trwania", value: "2,5h lub 5h" },
              { label: "Format", value: "Na miejscu w szkole lub online" },
              { label: "Certyfikat", value: "Dla każdego uczestnika" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-neutral-200">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Program szkolenia
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
            Wymagania techniczne: sala z projektorem, każdy uczestnik z laptopem
            lub tabletem. Nic do instalowania — wszystko działa przez
            przeglądarkę.
          </p>

          <div className="space-y-10">
            {agenda.map((block, bi) => (
              <div key={bi}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-neutral-200">
                      {block.part}
                    </span>
                    <span className="text-xs font-mono text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {block.duration}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                <div className="space-y-4">
                  {block.items.map((item, ii) => (
                    <div
                      key={ii}
                      className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15 transition-all duration-500"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-semibold text-sm text-neutral-100">
                          {item.title}
                        </h3>
                        <span className="text-xs font-mono text-emerald-400/50 flex-shrink-0">
                          {item.duration}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {item.points.map((point, pi) => (
                          <li
                            key={pi}
                            className="flex items-start gap-2.5 text-sm text-neutral-400"
                          >
                            <span className="text-emerald-400/60 mt-0.5 flex-shrink-0 text-xs">
                              →
                            </span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {bi === 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] text-center">
                      <p className="text-xs font-mono text-neutral-500 mb-1">
                        Sesja pytań i odpowiedzi
                      </p>
                      <p className="text-xs text-neutral-600">15 min</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] text-center">
                      <p className="text-xs font-mono text-neutral-500 mb-1">
                        Przerwa kawowa
                      </p>
                      <p className="text-xs text-neutral-600">15 min</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Closing */}
            <div className="p-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03]">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-semibold text-sm text-neutral-100">
                  Podsumowanie i certyfikaty
                </h3>
                <span className="text-xs font-mono text-emerald-400/50 flex-shrink-0">
                  15 min
                </span>
              </div>
              <ul className="space-y-1.5">
                {[
                  "Trzy rzeczy które zrobisz w tym tygodniu",
                  "Wręczenie certyfikatów ukończenia szkolenia",
                ].map((point, pi) => (
                  <li
                    key={pi}
                    className="flex items-start gap-2.5 text-sm text-neutral-400"
                  >
                    <span className="text-emerald-400/60 mt-0.5 flex-shrink-0 text-xs">
                      →
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Cennik
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
            Cena dotyczy całej rady pedagogicznej — bez limitu uczestników.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {pricing.map((plan, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border transition-all duration-500 ${
                  plan.highlight
                    ? "border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/40"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15"
                }`}
              >
                {plan.highlight && (
                  <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">
                    Rekomendowany
                  </p>
                )}
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-xs font-mono text-neutral-500 mb-4">
                  {plan.duration}
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                  {plan.price}
                </p>
                <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                  {plan.description}
                </p>
                <ul className="space-y-2">
                  {plan.included.map((item, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm">
                      <span className="text-emerald-400 flex-shrink-0">✓</span>
                      <span className="text-neutral-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Umówmy się na 15 minut
            </h2>
            <p className="text-neutral-400 mb-10 max-w-md mx-auto">
              Dopasujemy program do potrzeb Państwa szkoły i ustalimy termin.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:chodakowski2019@gmail.com?subject=Szkolenie AI dla nauczycieli — zapytanie"
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
          <span className="font-mono">jakubchodakowski.com/oferta</span>
        </div>
      </footer>
    </div>
  );
}
