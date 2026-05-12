import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aplikacja do Aivola — Nauczyciel AI Lab | Jakub Chodakowski",
  description:
    "Kandydat na rolę nauczyciela AI dla dzieci i młodzieży w Aivola Universe. AI Builder, mentor, doświadczenie w szkoleniu nauczycieli z AI.",
};

const whyMe = [
  {
    icon: "🎓",
    title: "Szkoliłem wiele szkół z AI",
    desc: "Mam za sobą szkolenia rad pedagogicznych i wystąpienia dla nauczycieli. Wiem jak tłumaczyć AI prostym językiem, bez technicznego żargonu, z konkretnymi przykładami z klasy.",
  },
  {
    icon: "🛠",
    title: "Buduję z AI codziennie",
    desc: "Nie jestem teoretykiem. Tworzę z wykorzystaniem AI aplikacje mobilne, agentów konwersacyjnych, automatyzacje dla firm oraz narzędzia edukacyjne. Pokażę dzieciom, co realnie można stworzyć.",
  },
  {
    icon: "🧭",
    title: "Komunikacja i przekazywanie wiedzy",
    desc: "Przez wiele lat zajmowałem się sprzedażą i marketingiem, dzięki czemu nabyłem solidne kompetencje w obszarze komunikacji z ludźmi. Potrafię przekazywać wiedzę w sposób przystępny, zadaję pytania, naprowadzam na rozwiązania, dostosowuję język do odbiorcy.",
  },
  {
    icon: "🔥",
    title: "Pasja od pierwszego dnia",
    desc: "30 listopada 2022 roku miała miejsce premiera ChatGPT. Od tego dnia każdy mój projekt zawodowy opiera się o AI. To nie jest dla mnie temat zainteresowań, lecz centralny obszar mojej działalności zawodowej.",
  },
];

const howILead = [
  {
    title: "Tworzenie komiksów z AI",
    desc: "Wprowadzę dzieci w narzędzia Midjourney, Canva oraz ChatGPT. Wspólnie napiszemy scenariusz, wygenerujemy panele i dodamy dialogi. Rezultat to ukończony komiks po pierwszych zajęciach.",
  },
  {
    title: "Muzyka z AI",
    desc: "Suno oraz Udio, od koncepcji do gotowego utworu w 10 minut. Uczniowie określają nastrój, gatunek i temat, a następnie obserwują, jak AI komponuje ich muzykę. Po wygenerowaniu utworu analizujemy proces, jak działa technologia oraz co można udoskonalić.",
  },
  {
    title: "Strony internetowe",
    desc: "Lovable, v0.dev oraz Bolt, narzędzia w których wystarczy opisać oczekiwania, aby otrzymać działającą stronę. Każde dziecko opuszcza zajęcia z linkiem do własnej witryny, którą może zaprezentować rodzicom.",
  },
  {
    title: "Krótkie filmy",
    desc: "Runway, Pika oraz Sora, od pojedynczego zdjęcia do animacji. Klatka po klatce poznajemy, w jaki sposób AI interpretuje obraz i ruch.",
  },
  {
    title: "Bezpieczeństwo AI",
    desc: "Co jest dozwolone, a czego unikać. Dlaczego AI generuje błędne informacje (zjawisko halucynacji). Czym są dane osobowe i dlaczego nie należy wprowadzać ich do ChatGPT. Konkretne studia przypadków przedstawione językiem dostosowanym do dziesięciolatka.",
  },
];

export default function AivolaPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf6] text-neutral-900 font-[var(--font-geist-sans)]">
      {/* Hero */}
      <section className="relative pt-12 md:pt-16 pb-10 md:pb-12 px-5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-300/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="flex justify-center mb-6">
            <img
              src="/profilowe_jakub.png"
              alt="Jakub Chodakowski"
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-2 border-emerald-600/30 shadow-xl shadow-emerald-600/10"
            />
          </div>
          <p className="text-[10px] md:text-xs font-mono text-emerald-700 uppercase tracking-widest mb-3">
            Aplikacja do Aivola Universe · AI Lab
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.15] text-balance">
            Szanowni Państwo,{" "}
            <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              przedstawiam swoją kandydaturę.
            </span>
          </h1>
          <p className="text-neutral-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto text-balance">
            Strona przygotowana specjalnie pod ten proces rekrutacyjny. Zamiast standardowego CV, znajdą Państwo tutaj komplet informacji potrzebnych do podjęcia decyzji.
          </p>
        </div>
      </section>

      {/* Quick info bar */}
      <section className="py-5 px-5 border-y border-neutral-200 bg-white/60">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Imię", value: "Jakub Chodakowski" },
              { label: "Rola", value: "Founder + AI Strategist" },
              { label: "Doświadczenie AI", value: "Od grudnia 2022" },
              { label: "Język", value: "Polski + English" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-neutral-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why me */}
      <section className="py-12 md:py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-center mb-3">
            Dlaczego moja kandydatura
          </h2>
          <p className="text-neutral-600 text-center mb-8 max-w-xl mx-auto text-balance">
            Po dokładnej analizie Państwa oferty, wskazuję cztery obszary bezpośredniej zgodności.
          </p>
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {whyMe.map((item, i) => (
              <div
                key={i}
                className="p-5 md:p-6 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-600/5 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-2 text-neutral-900">{item.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials — proof */}
      <section className="py-12 md:py-16 px-5 bg-emerald-50/40 border-y border-emerald-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-center mb-3">
            Dowody, nie deklaracje
          </h2>
          <p className="text-neutral-600 text-center mb-8 max-w-xl mx-auto text-balance">
            Certyfikat ukończenia kursu wdrożeniowego AI oraz wystąpienia publiczne na temat AI.
          </p>
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            <div className="p-5 rounded-2xl border border-emerald-200 bg-white">
              <img
                src="/cert-ai-managers.png"
                alt="Certyfikat AI for Managers — Elephant AI"
                className="w-full h-48 object-contain rounded-xl mb-4 bg-neutral-50 p-2"
              />
              <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest mb-2">
                Czerwiec 2024 · Certyfikat
              </p>
              <h3 className="font-semibold text-neutral-900 mb-2">
                AI for Managers — Elephant AI
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Intensywny 7-tygodniowy program edukacyjny obejmujący ponad 35 godzin warsztatów i wykładów, projekt końcowy oraz egzamin pisemny. Prowadzenie: Maria Parysz, ekspertka wdrażająca AI w Rolls-Royce oraz Sephora.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-emerald-200 bg-white">
              <img
                src="/talk-crash-mondays.png"
                alt="Wystąpienie publiczne na temat AI"
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
              <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest mb-2">
                Sierpień 2024
              </p>
              <h3 className="font-semibold text-neutral-900 mb-2">
                Szkolenie dla nauczycieli
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Wystąpienie skierowane do grona pedagogicznego. Pokazałem nauczycielom praktyczne zastosowania AI w codziennej pracy oraz to, w jaki sposób mogą wykorzystać te narzędzia w komunikacji z uczniami.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-emerald-200 bg-white">
              <img
                src="https://prod-fillout-oregon-s3.s3.us-west-2.amazonaws.com/orgid-542209/flowpublicid-i6Cw5dBunXus/67d299c9-f5c0-43d9-9c4a-a82550520903-PY7fXcqHejnPSSmEpcSes2G21gE0LB3EHvtMcsKDWCILwz6wAthEeP1GLLNhvxjHDq2alxyhhFwTCrEYqnrF4TpYtTlUqiN4OgC/Screenshot-2026-04-04-at-1.45.04aAM.png"
                alt="Szkolenie nauczycieli z AI — Listopad 2025, Wrocław"
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
              <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest mb-2">
                Listopad 2025 · Wrocław
              </p>
              <h3 className="font-semibold text-neutral-900 mb-2">
                Wykład dla nauczycieli
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Wystąpienie na konferencji oświatowej. Szkoliłem nauczycieli z praktycznego wykorzystania AI w codziennej pracy. Posiadam umiejętność wprowadzania w świat AI osób bez wcześniejszego doświadczenia w tej technologii.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How I'll lead AI Lab */}
      <section className="py-12 md:py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-center mb-3">
            Jak poprowadzę AI Lab
          </h2>
          <p className="text-neutral-600 text-center mb-8 max-w-xl mx-auto text-balance">
            Państwa oferta wymienia komiksy, muzykę, strony internetowe oraz filmy. Poniżej przedstawiam koncepcję realizacji tych obszarów z grupą uczniów w wieku 9+.
          </p>
          <div className="space-y-3">
            {howILead.map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-600/5 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <span className="text-emerald-700 text-sm font-mono mt-0.5 flex-shrink-0 font-semibold">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-base text-neutral-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Remote work */}
      <section className="py-12 md:py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="p-6 md:p-8 rounded-2xl border border-neutral-200 bg-white text-center">
            <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest mb-3">
              Praca zdalna
            </p>
            <h2 className="text-xl md:text-3xl font-bold tracking-tight mb-3">
              Codziennie pracuję zdalnie
            </h2>
            <p className="text-neutral-600 leading-relaxed max-w-xl mx-auto">
              Prowadzę firmy, prowadzę zespoły, prowadzę szkolenia, wszystko zdalnie. Sprzęt, internet oraz otoczenie pracy w pełni gotowe pod profesjonalne prowadzenie zajęć online.
            </p>
          </div>
        </div>
      </section>

      {/* What I bring */}
      <section className="py-12 md:py-16 px-5 bg-emerald-50/40 border-y border-emerald-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-center mb-8">
            Co wnoszę do Aivola
          </h2>
          <div className="space-y-3 md:space-y-4">
            <div className="p-5 md:p-6 rounded-2xl border border-emerald-200 bg-white">
              <h3 className="font-semibold text-neutral-900 mb-2">Praktyk, nie teoretyk</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Dzieci niezwykle szybko rozpoznają brak autentyczności. Nie ograniczam się do lektury książek o AI, codziennie tworzę rozwiązania w oparciu o tę technologię. Mogę zaprezentować uczniom własny kod, własne aplikacje oraz autorskie narzędzia. Tego rodzaju autorytetu nie da się odtworzyć teorią.
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-2xl border border-emerald-200 bg-white">
              <h3 className="font-semibold text-neutral-900 mb-2">Tłumacz między AI a człowiekiem</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Przez ostatnie trzy lata tłumaczyłem zagadnienia AI osobom, które obawiały się tej technologii, czyli nauczycielom, właścicielom firm oraz sprzedawcom. Potrafię rozłożyć złożone koncepcje na zrozumiałe elementy. W przypadku dzieci ten proces będzie jeszcze efektywniejszy, ponieważ nie posiadają one mentalnych barier wobec nowych technologii.
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-2xl border border-emerald-200 bg-white">
              <h3 className="font-semibold text-neutral-900 mb-2">Energia twórcy</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Aktywnie tworzę z wykorzystaniem sztucznej inteligencji, czyli aplikacje, treści oraz modele biznesowe. Ta energia twórcza jest zaraźliwa. Uczniowie nie wyjdą z zajęć wyłącznie z wiedzą teoretyczną o AI, lecz z motywacją do tworzenia własnych rozwiązań. To zasadnicza różnica.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-20 px-5">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-300/30 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
              Zapraszam na 15-minutową rozmowę
            </h2>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              Jeśli przedstawione informacje odpowiadają Państwa oczekiwaniom, chętnie umówię się na pierwszą rozmowę w ramach procesu rekrutacyjnego.
            </p>
            <div className="flex items-center justify-center">
              <a
                href="mailto:chodakowski2019@gmail.com?subject=Aplikacja Aivola — Nauczyciel AI Lab"
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm md:text-base font-medium hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-lg shadow-emerald-600/20"
              >
                chodakowski2019@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-5 border-t border-neutral-200">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <Link href="/" className="hover:text-neutral-700 transition-colors">
            Jakub Chodakowski &copy; {new Date().getFullYear()}
          </Link>
          <span className="font-mono">jakubchodakowski.com/aivola</span>
        </div>
      </footer>
    </div>
  );
}
