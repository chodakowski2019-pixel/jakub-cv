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
    duration: "ok. 2,5h",
    items: [
      {
        title: "Wstęp",
        duration: "",
        points: [
          "AI jest już w Twojej klasie — czy chcesz czy nie",
          "Co to jest AI i jak działa",
          "Każdy z nas ma z nią styczność na co dzień",
          "Prompty — język komunikacji z AI",
        ],
      },
      {
        title: "Rozwinięcie",
        duration: "",
        points: [
          "Jak uczniowie wykorzystują sztuczną inteligencję",
          "Jak zaoszczędzić 10h tygodniowo korzystając z AI",
          "AI w 5 sytuacjach które zdarzają Ci się co tydzień",
          "5 najważniejszych narzędzi dla nauczyciela",
          "Jak ułatwić swoje życie i pracę dzięki tej technologii",
        ],
      },
      {
        title: "Zakończenie",
        duration: "",
        points: [
          "Bezpieczeństwo AI — co wolno, czego nie",
          "Prawa autorskie i dane",
          "Jak AI zmienia edukację w Polsce i na świecie",
          "Przyszłość pracy nauczyciela",
          "Podsumowanie",
        ],
      },
      {
        title: "Sesja pytań i odpowiedzi",
        duration: "30 min",
        points: [],
      },
    ],
  },
  {
    part: "Część II — Warsztat praktyczny",
    duration: "2h 15min",
    items: [
      {
        title: "Twój osobisty Asystent AI",
        duration: "60 min",
        points: [
          "Agent pomaga Ci w pracy — dzięki czemu zaoszczędzisz kilka godzin tygodniowo",
          "Ułatwi Ci życie codzienne",
          "Każdy wychodzi z gotowym, skonfigurowanym asystentem",
        ],
      },
      {
        title: "5 narzędzi AI w praktyce",
        duration: "60 min",
        points: [
          "Tworzenie grafik, tekstów i filmów z AI",
          "Sprawdzanie testów i prac domowych",
          "Planowanie lekcji i materiały dydaktyczne w minuty",
          "I wiele, wiele więcej — ćwiczymy razem na żywo",
        ],
      },
      {
        title: "Podsumowanie i certyfikaty",
        duration: "15 min",
        points: [
          "Sesja Q&A",
          "Podsumowanie",
          "Rozdanie certyfikatów",
        ],
      },
    ],
  },
];

const bonuses = [
  {
    icon: "🎓",
    title: "Certyfikat ukończenia",
    desc: "Imienny certyfikat dla każdego uczestnika — potwierdzenie doskonalenia zawodowego.",
  },
  {
    icon: "📋",
    title: "Lista 50 narzędzi AI dla nauczycieli",
    desc: "Gotowa baza narzędzi z opisem zastosowania — do użycia od razu po szkoleniu.",
  },
  {
    icon: "💬",
    title: "7 dni kontaktu ze mną po szkoleniu",
    desc: "Pytania po szkoleniu? Nauczyciele mogą się ze mną kontaktować po szkoleniu.",
  },
  {
    icon: "📄",
    title: "PDF: Gotowe prompty dla nauczycieli",
    desc: "Zbiór najlepszych promptów dopasowanych do pracy nauczyciela.",
  },
];

const pricing = [
  {
    name: "Wariant podstawowy",
    duration: "2h  teoria + Q&A",
    price: "3 500 zł",
    description:
      "Wykład dla rady pedagogicznej. Teoria, demo na żywo, Q&A. Każdy nauczyciel wychodzi z wiedzą i narzędziami gotowymi do użycia.",
    included: [
      "Część I — teoria (ok. 2,5h)",
      "Sesja Q&A (30 min)",
      "Lista 50 narzędzi AI",
      "PDF: Gotowe prompty dla nauczycieli",
      "Certyfikat ukończenia",
      "7 dni kontaktu po szkoleniu",
    ],
  },
  {
    name: "Wariant pełny",
    duration: "ok. 5h  teoria + Q&A + warsztat",
    price: "4 500 zł",
    highlight: true,
    description:
      "Teoria + warsztat praktyczny. Każdy nauczyciel wychodzi z własnym asystentem AI i konkretnymi umiejętnościami do zastosowania od następnego dnia.",
    included: [
      "Część I — teoria (ok. 2,5h)",
      "Sesja Q&A (30 min)",
      "Przerwa (30 min)",
      "Część II — warsztat praktyczny (2h 15min)",
      "Lista 50 narzędzi AI",
      "PDF: Gotowe prompty dla nauczycieli",
      "Certyfikat ukończenia",
      "7 dni kontaktu po szkoleniu",
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
          <div className="flex flex-nowrap justify-center items-center gap-6 md:gap-10 overflow-x-auto">
            {[
              { label: "Dla kogo", value: "Rada pedagogiczna" },
              { label: "Czas trwania", value: "ok. 2,5h lub ok. 5h" },
              { label: "Format", value: "W szkole lub online" },
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
          <div className="mb-12" />

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
                  <div className="mt-4">
                    <div className="flex items-center gap-4 mt-2">
                      <div className="h-px flex-1 bg-white/[0.06]" />
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-neutral-200">Przerwa</span>
                        <span className="text-xs font-mono text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded-full">30 min</span>
                      </div>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <p className="text-xs text-neutral-600 text-center mt-8">
              * Agendę spotkania możemy edytować i dostosować do potrzeb placówki.
            </p>
          </div>
        </div>
      </section>

      {/* Bonuses */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">
            Bonusy dla uczestników
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {bonuses.map((bonus, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15 transition-all duration-500"
              >
                <div className="text-2xl mb-3">{bonus.icon}</div>
                <h3 className="font-semibold mb-2 text-neutral-100">{bonus.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{bonus.desc}</p>
              </div>
            ))}
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
