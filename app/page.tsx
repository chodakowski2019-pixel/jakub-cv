import type { Metadata } from "next";
import Image from "next/image";

// Strona główna jakubchodakowski.com (USER_001 2026-09-19).
//
// ZAMIANA: do 19.09 stała tu oferta wdrożeń AI. Decyzja USER-a: marka osobista
// sprzedaje SEO dla klinik prywatnych, bo to jest biznes, który realnie idzie.
// Stara strona AI nie zniknęła, leży pod /ai.
//
// ⚠️ Ceny NIE MA i ma nie być. Cennik wysyłamy imiennie mailem (decyzja z 11.08),
// a ta strona jest indeksowana, żeby dało się na nią puścić Google Ads.
// Obietnice zgodne z audytem ZRODLA-KLIENTOW-I-OBIETNICE-2026-09-19.md w zwiazki-lp:
// 14 dni na start, zero liczby artykułów, zero obietnic liczby pacjentów.

export const metadata: Metadata = {
  title: "Nowi pacjenci w Twoim gabinecie | Jakub Chodakowski",
  description:
    "Buduję klinikom prywatnym własny kanał pacjentów z Google. Pozycjonowanie na zabieg i miasto, treści, analityka i raport co miesiąc. Bez prowizji od pacjenta.",
  alternates: { canonical: "https://jakubchodakowski.com" },
  openGraph: {
    title: "Nowi pacjenci w Twoim gabinecie | Jakub Chodakowski",
    description:
      "Pacjent szuka zabiegu w Google i trafia do porównywarek. Buduję klinikom własny kanał pacjentów.",
    url: "https://jakubchodakowski.com",
    type: "website",
  },
};

const TLO = "#ffffff";

const PROBLEM = [
  {
    tytul: "Decyzja zapada tygodniami",
    opis: "Pacjent czyta o zabiegu kilka tygodni, zanim zadzwoni. Cały ten czas jest w Google.",
  },
  {
    tytul: "Pierwsze miejsca mają katalogi",
    opis: "Na „przeszczep włosów Kraków” wyżej od Ciebie stoją porównywarki i kliniki z Turcji.",
  },
  {
    tytul: "Płacisz za miejsce w kolejce",
    opis: "Katalog bierze abonament i prowizję za listę, na której stoisz obok kilkunastu innych.",
  },
];

const ZAKRES = [
  { tytul: "Pozycjonowanie Twojej strony", opis: "Twoja domena, Twoja strona." },
  { tytul: "Treści pod pytania pacjentów", opis: "Przebieg, rekonwalescencja, ryzyka, koszty." },
  { tytul: "Porządki techniczne", opis: "Tytuły, opisy, nagłówki, szybkość, wizytówka Google." },
  { tytul: "Analityka", opis: "Search Console i Analytics podpięte do Twojej strony." },
  { tytul: "Raport co miesiąc", opis: "Wyświetlenia, kliknięcia i frazy, na które wchodzą pacjenci." },
  { tytul: "Wyłączność na miasto", opis: "Jedna klinika w mieście na dany zabieg." },
];

const BRANZE = [
  "Przeszczep włosów",
  "Chirurgia plastyczna",
  "Stomatologia i implanty",
  "Okulistyka laserowa",
  "Leczenie niepłodności",
  "Ortopedia",
];

const KROKI = [
  "Rozmowa, 10 minut. Pytam o zabiegi i o to, skąd dziś masz pacjentów.",
  "Audyt. Pokazuję, na jakie frazy masz szansę się pokazać.",
  "Start w 14 dni. Pierwsze treści i porządki techniczne.",
  "Co miesiąc. Nowe treści i raport.",
];

function Sekcja({
  id,
  etykieta,
  tytul,
  children,
}: {
  id?: string;
  etykieta: string;
  tytul: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-cyan-600">
          {etykieta}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
      </div>
      <h2 className="mb-10 text-3xl font-bold tracking-tighter text-zinc-900 md:text-4xl">{tytul}</h2>
      {children}
    </section>
  );
}

function Karta({ tytul, opis }: { tytul: string; opis: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-colors hover:border-cyan-500/50">
      <h3 className="font-semibold text-zinc-900">{tytul}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{opis}</p>
    </div>
  );
}

export default function Strona() {
  return (
    <main
      className="min-h-screen text-zinc-800"
      style={{ background: TLO }}
    >
      {/* pasek */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.85)" }}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          {/* USER_001 2026-09-19: zamiast inicjałów JC prawdziwe zdjęcie, to samo co w stopce maili. */}
          <Image
            src="/profilowe_jakub.png"
            alt="Jakub Chodakowski"
            width={32}
            height={32}
            priority
            className="size-8 rounded-full object-cover ring-2 ring-cyan-500/30"
          />
          <span className="text-sm font-medium text-zinc-900">Jakub Chodakowski</span>
          <a
            href="#kontakt"
            className="ml-auto rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 transition-transform hover:scale-[1.03]"
          >
            Porozmawiajmy
          </a>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 size-[28rem] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
          {/* USER_001 2026-09-19: hero prowadzi korzyścią, nie nazwą usługi. */}
          <p className="mb-5 font-mono text-xs uppercase tracking-widest text-cyan-600">
            Nowi pacjenci w Twoim gabinecie
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tighter text-zinc-900 md:text-6xl">
            Twoi klienci
            <br />
            <span className="bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent">
              sami Cię znajdą!
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Bez katalogu, bez listy konkurencji obok.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#kontakt"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-7 py-3.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/40 transition-transform hover:scale-[1.03]"
            >
              Umów 10 minut rozmowy
            </a>
            <a
              href="#zakres"
              className="rounded-full border border-zinc-300 px-7 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:border-cyan-500"
            >
              Zobacz, co robię
            </a>
          </div>
        </div>
      </section>

      <Sekcja etykieta="Problem" tytul="Dlaczego nie widać Cię w Google?">
        <div className="grid gap-4 md:grid-cols-3">
          {PROBLEM.map((p) => (
            <Karta key={p.tytul} {...p} />
          ))}
        </div>
      </Sekcja>

      <div className="border-y border-zinc-200 bg-zinc-50">
        <Sekcja id="zakres" etykieta="Zakres" tytul="Co dokładnie robię">
          <div className="grid gap-4 md:grid-cols-2">
            {ZAKRES.map((z) => (
              <Karta key={z.tytul} {...z} />
            ))}
          </div>
        </Sekcja>
      </div>

      <Sekcja etykieta="Dla kogo" tytul="Placówki, z którymi pracuję">
        <div className="flex flex-wrap gap-3">
          {BRANZE.map((b) => (
            <span
              key={b}
              className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm text-zinc-700"
            >
              {b}
            </span>
          ))}
        </div>
      </Sekcja>


      <Sekcja etykieta="Przebieg" tytul="Jak zaczynamy?">
        <ol className="space-y-5">
          {KROKI.map((k, i) => (
            <li key={k} className="flex gap-4">
              <span className="grid size-8 flex-none place-items-center rounded-full border border-cyan-500/40 bg-cyan-50 text-sm font-semibold text-cyan-700">
                {i + 1}
              </span>
              <span className="pt-1 leading-relaxed text-zinc-700">{k}</span>
            </li>
          ))}
        </ol>
      </Sekcja>

      {/* kontakt */}
      <section id="kontakt" className="relative overflow-hidden border-t border-zinc-200">
        <div className="pointer-events-none absolute -bottom-40 left-0 size-[28rem] rounded-full bg-teal-400/20 blur-[120px]" />
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-zinc-900 md:text-4xl">
            Porozmawiajmy 10 minut
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-zinc-600">
            Powiem wprost, czy widzę miejsce na wzrost. Jeśli nie widzę, też to powiem.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4">
            <a
              href="mailto:hello@jakubchodakowski.com?subject=Rozmowa%20w%20sprawie%20wsp%C3%B3%C5%82pracy"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-base font-medium text-white shadow-lg shadow-cyan-500/40 transition-transform hover:scale-[1.03]"
            >
              hello@jakubchodakowski.com
            </a>
            <a href="tel:+48506151615" className="text-sm text-zinc-500 underline underline-offset-4">
              albo zadzwoń: 506 151 615
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-zinc-500">
          <span>Jakub Chodakowski, NIP 6711845485</span>
        </div>
      </footer>
    </main>
  );
}
