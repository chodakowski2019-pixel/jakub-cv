import type { Metadata } from "next";
import Link from "next/link";
import ZoomableImage from "./ZoomableImage";

export const metadata: Metadata = {
  title: "Aplikacja do Aivola — Nauczyciel AI Lab | Jakub Chodakowski",
  description:
    "Kandydat na rolę nauczyciela AI dla dzieci i młodzieży w Aivola Universe.",
};

const whyMe = [
  {
    icon: "🎓",
    title: "Szkolę nauczycieli z AI",
    desc: "Prowadzę szkolenia dla nauczycieli w szkołach i na konferencjach. Tłumaczę AI prostym językiem, bez technicznych terminów.",
  },
  {
    icon: "🛠",
    title: "Tworzę z AI każdego dnia",
    desc: "Buduję aplikacje, chatboty oraz narzędzia do nauki. Pokażę uczniom, co dzięki AI można naprawdę zrobić.",
  },
  {
    icon: "🧭",
    title: "Umiem rozmawiać z ludźmi",
    desc: "Przez lata pracowałem w sprzedaży i marketingu. Nauczyłem się słuchać, zadawać dobre pytania i pomagać znaleźć rozwiązanie.",
  },
  {
    icon: "🔥",
    title: "Pasja od pierwszego dnia",
    desc: "Od premiery ChatGPT (30 listopada 2022) każdy mój projekt to AI. To centrum mojej zawodowej działalności.",
  },
];

const howILead = [
  {
    title: "Komiksy z AI",
    desc: "Razem z uczniami stworzymy komiksy w Midjourney, Canva i ChatGPT. Każde dziecko wyjdzie z własnym, gotowym komiksem.",
  },
  {
    title: "Muzyka z AI",
    desc: "Pokażę uczniom Suno i Udio. Od pomysłu do gotowej piosenki w 10 minut.",
  },
  {
    title: "Strony internetowe",
    desc: "Lovable, v0.dev i Bolt. Każde dziecko wyjdzie z linkiem do własnej strony, którą pokaże rodzicom.",
  },
  {
    title: "Krótkie filmy",
    desc: "Runway, Pika i Sora. Zobaczymy razem, jak ze zwykłego zdjęcia powstaje animowany film.",
  },
  {
    title: "Bezpieczeństwo AI",
    desc: "Porozmawiamy o tym, dlaczego AI czasem zmyśla, dlaczego nie wpisujemy swojego adresu i co wolno z nim robić. Wszystko prostym językiem.",
  },
];

const credentials = [
  {
    img: "/cert-ai-managers.png",
    label: "Czerwiec 2024",
    title: "AI for Managers",
    desc: "7-tygodniowy kurs prowadzony przez Marię Parysz, ekspertkę, która wdrażała AI w Rolls-Royce i Sephora.",
    objectFit: "contain" as const,
  },
  {
    img: "/talk-crash-mondays.png",
    label: "Sierpień 2024",
    title: "Szkolenie dla nauczycieli",
    desc: "Wystąpienie dla nauczycieli. Pokazałem im, jak AI może pomóc w codziennej pracy w szkole.",
    objectFit: "cover" as const,
  },
  {
    img: "https://prod-fillout-oregon-s3.s3.us-west-2.amazonaws.com/orgid-542209/flowpublicid-i6Cw5dBunXus/67d299c9-f5c0-43d9-9c4a-a82550520903-PY7fXcqHejnPSSmEpcSes2G21gE0LB3EHvtMcsKDWCILwz6wAthEeP1GLLNhvxjHDq2alxyhhFwTCrEYqnrF4TpYtTlUqiN4OgC/Screenshot-2026-04-04-at-1.45.04aAM.png",
    label: "Listopad 2025 · Wrocław",
    title: "Wykład dla nauczycieli",
    desc: "Wystąpienie na konferencji dla szkół. Pokazałem nauczycielom, jak korzystać z AI każdego dnia.",
    objectFit: "cover" as const,
  },
];

const bring = [
  {
    label: "Praktyk, nie teoretyk",
    desc: "Pokażę uczniom mój własny kod, aplikacje i narzędzia. To autentyczność, której nie da się udać.",
  },
  {
    label: "Tłumacz AI",
    desc: "Od trzech lat tłumaczę AI osobom, które wcześniej z nim nie pracowały. Z dziećmi idzie to jeszcze szybciej.",
  },
  {
    label: "Energia twórcy",
    desc: "Uczniowie wyjdą z chęcią tworzenia własnych projektów, nie tylko z teorią w głowie.",
  },
];

export default function AivolaPage() {
  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 font-[var(--font-geist-sans)] antialiased selection:bg-emerald-500/30">
      {/* Hero */}
      <section className="relative pt-20 md:pt-28 pb-16 md:pb-24 px-6 overflow-hidden">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-br from-emerald-500/15 via-teal-500/8 to-transparent rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[200px] right-[-100px] w-[400px] h-[400px] bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="flex justify-center mb-8 md:mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full blur-xl opacity-30" />
              <img
                src="/profilowe_jakub.png"
                alt="Jakub Chodakowski"
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-full object-cover ring-1 ring-white/10"
              />
            </div>
          </div>

          <p className="text-[10px] md:text-xs font-mono text-emerald-300/80 uppercase tracking-[0.2em] mb-5">
            Aplikacja · Aivola Universe
          </p>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05] text-balance">
            Nauczyciel AI,
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              którego szukacie.
            </span>
          </h1>

          <p className="text-stone-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto text-pretty">
            Strona przygotowana specjalnie dla Państwa. Wszystko w jednym miejscu, bez zbędnego CV.
          </p>
        </div>
      </section>

      {/* Quick facts */}
      <section className="px-6 pt-4 md:pt-8 pb-10 md:pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
            {[
              { label: "Rola", value: "Founder · AI" },
              { label: "Z AI od", value: "12.2022" },
              { label: "Język", value: "PL · EN" },
              { label: "Tryb", value: "Zdalny" },
            ].map((item, i) => (
              <div key={i} className="bg-[#0c0a09] px-4 py-5 text-center">
                <p className="text-[9px] font-mono text-stone-500 uppercase tracking-[0.15em] mb-1.5">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-stone-100">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why me */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 md:mb-14">
            <p className="text-[10px] font-mono text-emerald-300/60 uppercase tracking-[0.2em] mb-3">
              01 · Dopasowanie
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
              Cztery punkty,
              <br />
              <span className="text-stone-500">cztery dopasowania.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {whyMe.map((item, i) => (
              <div
                key={i}
                className="group relative p-6 md:p-7 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-emerald-400/30 hover:bg-white/[0.035] transition-all duration-500 backdrop-blur-xl"
              >
                <div className="text-2xl mb-4">{item.icon}</div>
                <h3 className="font-semibold mb-2 text-stone-100 text-base md:text-lg">
                  {item.title}
                </h3>
                <p className="text-sm text-stone-400 leading-relaxed text-pretty">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16 md:py-24 px-6 relative">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 md:mb-14">
            <p className="text-[10px] font-mono text-emerald-300/60 uppercase tracking-[0.2em] mb-3">
              02 · Dowody
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
              Certyfikat
              <br />
              <span className="text-stone-500">oraz wystąpienia publiczne.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {credentials.map((c, i) => (
              <div
                key={i}
                className="group p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-emerald-400/30 transition-all duration-500"
              >
                <div className="w-full h-48 rounded-xl mb-4 overflow-hidden bg-white/[0.02]">
                  <ZoomableImage
                    src={c.img}
                    alt={c.title}
                    containerClassName="w-full h-full"
                    className={`w-full h-full ${c.objectFit === "contain" ? "object-contain p-3 bg-white" : "object-cover"}`}
                  />
                </div>
                <p className="text-[10px] font-mono text-emerald-300/60 uppercase tracking-[0.15em] mb-2">
                  {c.label}
                </p>
                <h3 className="font-semibold text-stone-100 mb-2">{c.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 md:mt-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-emerald-500/[0.06] border border-emerald-400/20 backdrop-blur-xl">
              <span className="text-emerald-300 font-mono text-sm font-semibold">+10</span>
              <span className="text-stone-300 text-sm">
                kolejnych wystąpień i szkoleń o AI w edukacji
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How I'll lead AI Lab */}
      <section className="py-16 md:py-24 px-6 relative">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 md:mb-14">
            <p className="text-[10px] font-mono text-emerald-300/60 uppercase tracking-[0.2em] mb-3">
              03 · AI Lab
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
              Jak poprowadzę zajęcia
              <br />
              <span className="text-stone-500">z grupą 9+.</span>
            </h2>
          </div>

          <div className="space-y-2">
            {howILead.map((item, i) => (
              <div
                key={i}
                className="group flex items-baseline gap-5 md:gap-6 p-5 md:p-6 rounded-2xl hover:bg-white/[0.025] border border-transparent hover:border-white/[0.06] transition-all duration-300"
              >
                <span className="text-emerald-300/40 text-xs font-mono flex-shrink-0 group-hover:text-emerald-300 transition-colors">
                  0{i + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-100 mb-1">{item.title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What I bring */}
      <section className="py-16 md:py-24 px-6 relative">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 md:mb-14">
            <p className="text-[10px] font-mono text-emerald-300/60 uppercase tracking-[0.2em] mb-3">
              04 · Wartość
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
              Co wnoszę
              <br />
              <span className="text-stone-500">do Aivola.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {bring.map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/[0.04] to-transparent border border-emerald-400/15"
              >
                <p className="text-[10px] font-mono text-emerald-300/80 uppercase tracking-[0.15em] mb-3">
                  {item.label}
                </p>
                <p className="text-sm text-stone-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-br from-emerald-500/15 to-teal-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight mb-4 text-balance leading-[1.05]">
            15 minut.
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              Tyle wystarczy.
            </span>
          </h2>
          <p className="text-stone-400 mb-10 md:mb-12 text-base md:text-lg">
            Z przyjemnością spotkam się z Państwem na pierwszą rozmowę w ramach rekrutacji.
          </p>
          <a
            href="mailto:hello@jakubchodakowski.com?subject=Aplikacja Aivola — Nauczyciel AI Lab"
            className="inline-flex items-center gap-3 px-7 py-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-stone-950 text-sm md:text-base font-semibold hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-2xl shadow-emerald-500/20"
          >
            hello@jakubchodakowski.com
            <span className="text-lg">→</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-stone-300 transition-colors">
            Jakub Chodakowski · {new Date().getFullYear()}
          </Link>
          <span className="font-mono">jakubchodakowski.com/aivola</span>
        </div>
      </footer>
    </div>
  );
}
