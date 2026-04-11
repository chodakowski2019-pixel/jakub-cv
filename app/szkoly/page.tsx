import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI dla Szkół — Jakub Chodakowski",
  description:
    "Wykłady i warsztaty AI dla uczniów i nauczycieli. Praktyczne szkolenia dopasowane do potrzeb Twojej szkoły.",
};

export default function SzkolyPage() {
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
            href="mailto:chodakowski2019@gmail.com"
            className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/20"
          >
            Zapytaj o termin
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-4">
            Dla szkół
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            AI w Twojej{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              szkole
            </span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Praktyczne wykłady i warsztaty ze sztucznej inteligencji —<br />
            dla uczniów, nauczycieli lub całej kadry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:chodakowski2019@gmail.com"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-500/20"
            >
              Zapytaj o termin →
            </a>
            <a
              href="#tematy"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 transition-all duration-300"
            >
              Zobacz tematy
            </a>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="py-6 px-6 border-y border-white/[0.04] bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-mono text-neutral-500 uppercase tracking-widest mb-5">
            Zaufały mi
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {[
              "HKF Centrum Wrocław",
              "Szkoły podstawowe",
              "Szkoły średnie",
              "Placówki oświatowe",
            ].map((name, i) => (
              <span key={i} className="text-sm text-neutral-400 font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Dla kogo */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Dla kogo?
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
            Dostosowuję poziom, tempo i przykłady do odbiorcy.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: "🎓",
                title: "Uczniowie",
                who: "Klasy 4–8 SP, szkoły średnie",
                desc: "Jak AI może pomóc w nauce, pisaniu, kreatywnych projektach. Praktyczne demo — działamy razem na żywo.",
              },
              {
                icon: "👩‍🏫",
                title: "Nauczyciele",
                who: "Rady pedagogiczne, kadra",
                desc: "Jak AI oszczędza czas przy planowaniu lekcji, ocenianiu i komunikacji. Narzędzia do codziennej pracy.",
              },
              {
                icon: "🏫",
                title: "Cała szkoła",
                who: "Uczniowie + nauczyciele + rodzice",
                desc: "Dzień otwarty z AI. Każda grupa dostaje odpowiednie warsztaty. Jeden dzień, maksymalny efekt.",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15 transition-all duration-500"
              >
                <div className="text-2xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                <p className="text-xs font-mono text-emerald-400/60 mb-3">
                  {card.who}
                </p>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Format */}
      <section className="py-16 px-6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Jak to wygląda?
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
            Bardzo prosta i łatwa współpraca.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                num: "01",
                title: "Rozmowa planująca (bezpłatna)",
                desc: "15 minut. Pytam o grupę, poziom i cel. Na tej podstawie układam program.",
              },
              {
                num: "02",
                title: "Wykład lub warsztat (1–3h)",
                desc: "Dostosowany do odbiorcy. Widzimy się online lub na żywo w Państwa szkole.",
              },
              {
                num: "03",
                title: "Materiały po spotkaniu",
                desc: "Lista narzędzi, prompty, ściągawka. Uczestnicy wychodzą z czymś, co mogą użyć od razu.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/15 transition-all duration-500"
              >
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold text-sm mt-0.5 font-mono">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tematy */}
      <section id="tematy" className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Przykładowe tematy
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
            To lista startowa — temat zawsze dopasowuję do potrzeb szkoły.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              {
                label: "Dla uczniów",
                topics: [
                  "Twój asystent AI w szkole — ChatGPT w praktyce",
                  "Jak uczyć się 2x szybciej z pomocą AI",
                  "AI w kreatywnych projektach (muzyka, grafika, pisanie)",
                  "Bezpieczne korzystanie z AI — co wolno, czego nie",
                ],
              },
              {
                label: "Dla nauczycieli",
                topics: [
                  "AI w codziennej pracy nauczyciela",
                  "Planowanie lekcji z AI — oszczędzasz 5h tygodniowo",
                  "Ocenianie prac z pomocą AI",
                  "Jak rozpoznać, że uczeń użył AI — i co z tym zrobić",
                ],
              },
            ].map((group, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                <p className="text-xs font-mono text-emerald-400/70 uppercase tracking-widest mb-4">
                  {group.label}
                </p>
                <ul className="space-y-3">
                  {group.topics.map((topic, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">
                        →
                      </span>
                      <span className="text-sm text-neutral-300">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof — HKF */}
      <section className="py-16 px-6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">
            Już to robiłem
          </h2>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03]">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src="https://prod-fillout-oregon-s3.s3.us-west-2.amazonaws.com/orgid-542209/flowpublicid-i6Cw5dBunXus/67d299c9-f5c0-43d9-9c4a-a82550520903-PY7fXcqHejnPSSmEpcSes2G21gE0LB3EHvtMcsKDWCILwz6wAthEeP1GLLNhvxjHDq2alxyhhFwTCrEYqnrF4TpYtTlUqiN4OgC/Screenshot-2026-04-04-at-1.45.04aAM.png"
                  alt="HKF Centrum Wrocław"
                  className="w-full md:w-48 h-36 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-xs font-mono text-emerald-400/60 mb-2">
                    Listopad 2025 — Wrocław
                  </p>
                  <h3 className="font-semibold mb-2">
                    Dzień Otwarty dla Oświaty — HKF Centrum
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    „Twój asystent AI w szkole" — szkolenie dla nauczycieli.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "14+", label: "Licea" },
                { value: "8+", label: "Szkoły podstawowe" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center"
                >
                  <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Zainteresowana/y?
            </h2>
            <p className="text-neutral-400 mb-3 max-w-md mx-auto">
              Napisz do mnie!
            </p>
            <p className="text-neutral-500 text-sm mb-10 max-w-md mx-auto">
              Odpiszę w ciągu 24h z propozycją programu i wyceną.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:chodakowski2019@gmail.com?subject=Szkolenie AI dla szkoły"
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
          <span className="font-mono">jakubchodakowski.com/szkoly</span>
        </div>
      </footer>
    </div>
  );
}

