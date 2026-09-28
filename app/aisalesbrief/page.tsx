"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

// Ankieta wdrożeniowa SalesAI. Wygląd przepisany z /aisaleskontakt (jasne szkło),
// żeby firma, która przeszła z lead forma, widziała tę samą stronę.
//
// Różnica wobec /aisaleskontakt: tam zbieramy kontakt, tu zbieramy wsad do
// narzędzia. Formularz jest długi z premedytacją — wypełnia go firma, która już
// powiedziała "tak", więc opór jest niski, a każde brakujące pole to rozmowa,
// w której AI gada ogólnikami.
//
// Nazwę firmy da się wstrzyknąć linkiem: /aisalesbrief?firma=STYROBUD
// (czytane z window.location, nie z useSearchParams — to drugie wymaga Suspense).
const TLO = "#ffffff";

const WARTOSC_TRANSAKCJI = [
  "do 5 tys. zł",
  "5-20 tys. zł",
  "20-100 tys. zł",
  "powyżej 100 tys. zł",
];

const WIELKOSC_ZESPOLU = ["1-4 handlowców", "5-15", "16-40", "powyżej 40"];

const KANALY = [
  "Zimny telefon",
  "Telefon do leada",
  "Spotkanie online",
  "Spotkanie u klienta",
  "Mail / oferta",
];

// Wielokrotny wybór: firma zwykle ma problem na 2-3 etapach naraz,
// a to one decydują, jakie scenariusze dostanie zespół.
const ETAPY = [
  "Pierwszy kontakt",
  "Badanie potrzeb",
  "Prezentacja oferty",
  "Obiekcje",
  "Negocjacja ceny",
  "Domykanie",
  "Follow-up po ofercie",
];

const ZACHOWANIA = [
  "Spieszy się, ucina rozmowę",
  "Milczy, nie daje sygnałów",
  "Agresywny, atakuje cenę",
  "Uprzejmy, ale ucieka w 'prześlij ofertę'",
  "Wie dużo, sprawdza handlowca",
  "Odsyła do kogoś innego",
];

type Form = {
  firma: string;
  osoba: string;
  email: string;
  coSprzedajecie: string;
  wartosc: string;
  zespol: string;
  ktoDecyduje: string;
  branzaKlienta: string;
  ileOsobDecyzja: string;
  zachowania: string[];
  kanal: string;
  etapy: string[];
  przebieg: string;
  obiekcje: string;
  sukces: string;
  powodPrzegranej: string;
  konkurencja: string;
  zargon: string;
  zakazy: string;
  nagranie: string;
};

// Sekcja stoi POZA komponentem strony z rozmysłem. Zdefiniowana w środku byłaby
// przy każdym naciśnięciu klawisza nowym typem komponentu, React odmontowałby
// całe pudło i pole traciłoby kursor po pierwszej literze.
// Z tego samego powodu klasa szkła leci przez `style jsx global`: scope'owany
// styled-jsx nie dosięga JSX-a innego komponentu.
function Sekcja({
  numer,
  tytul,
  podtytul,
  children,
}: {
  numer: string;
  tytul: string;
  podtytul: string;
  children: React.ReactNode;
}) {
  return (
    <section className="brief-szklo rounded-3xl p-6 sm:p-8">
      <div className="mb-6">
        <span className="inline-block text-[11px] font-bold tracking-[0.12em] text-cyan-700 mb-2">{numer}</span>
        <h2 className="text-xl sm:text-2xl font-bold font-[var(--font-poppins)] tracking-[-0.015em] leading-tight">
          {tytul}
        </h2>
        <p className="text-slate-500 text-[13px] mt-1.5 leading-relaxed">{podtytul}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

const PUSTY: Form = {
  firma: "",
  osoba: "",
  email: "",
  coSprzedajecie: "",
  wartosc: "",
  zespol: "",
  ktoDecyduje: "",
  branzaKlienta: "",
  ileOsobDecyzja: "",
  zachowania: [],
  kanal: "",
  etapy: [],
  przebieg: "",
  obiekcje: "",
  sukces: "",
  powodPrzegranej: "",
  konkurencja: "",
  zargon: "",
  zakazy: "",
  nagranie: "",
};

export default function AiSalesBriefPage() {
  const [form, setForm] = useState<Form>(PUSTY);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  useEffect(() => {
    const firma = new URLSearchParams(window.location.search).get("firma");
    if (firma) setForm((f) => ({ ...f, firma }));
  }, []);

  const pole =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const przelacz = (k: "zachowania" | "etapy", v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/aisalesbrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "ok" : "error");
      if (res.ok) track("salesai_brief", { firma: form.firma });
    } catch {
      setStatus("error");
    }
  };

  const inputCls =
    "w-full bg-white border border-slate-300/90 rounded-xl px-4 py-3 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 transition-all duration-150";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 tracking-[0.01em]";
  const opisCls = "block text-[11px] text-slate-400 mb-1.5 leading-snug";

  const chip = (wybrany: boolean) =>
    `px-3.5 py-2 rounded-xl text-[13px] border shadow-sm active:scale-[0.97] transition-all duration-150 ${
      wybrany
        ? "bg-cyan-600 border-cyan-600 text-white font-medium"
        : "bg-white border-slate-300/90 text-slate-600 hover:border-slate-400 hover:text-slate-900"
    }`;

  const komplet =
    form.firma &&
    form.osoba &&
    form.email &&
    form.coSprzedajecie &&
    form.wartosc &&
    form.zespol &&
    form.ktoDecyduje &&
    form.branzaKlienta &&
    form.ileOsobDecyzja &&
    form.zachowania.length > 0 &&
    form.kanal &&
    form.etapy.length > 0 &&
    form.przebieg &&
    form.obiekcje &&
    form.sukces &&
    form.powodPrzegranej;

  return (
    <div className="min-h-screen text-slate-900 font-[var(--font-open-sans)]" style={{ background: TLO }}>
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

      <main className="relative px-5 sm:px-6 py-12 sm:py-16">
        {status === "ok" ? (
          <div className="brief-szklo max-w-md mx-auto rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/70 border-2 border-cyan-600/40 flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-cyan-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3 font-[var(--font-poppins)] tracking-[-0.01em]">Mam wszystko.</h1>
            <p className="text-slate-700 leading-relaxed">
              Ustawiam trening pod Waszą rozmowę i odzywam się w ciągu 48 godzin.
            </p>
            <p className="text-sm text-slate-500 mt-4">Jakub Chodakowski</p>
          </div>
        ) : (
          <>
            <div className="max-w-2xl mx-auto mb-10 sm:mb-12 text-center">
              <h1 className="text-[1.8rem] sm:text-[2.5rem] font-bold font-[var(--font-poppins)] leading-[1.1] tracking-[-0.025em] mb-4">
                Opisz swoją rozmowę,{" "}
                <span className="bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
                  AI zagra Twojego klienta
                </span>
              </h1>
              <p className="text-slate-600 text-[15px] sm:text-base leading-relaxed">
                Im dokładniej to wypełnisz, tym mniej trening będzie przypominał rozmowę z botem.
                Zajmie 10-15 minut. Pola z gwiazdką są konieczne.
              </p>
            </div>

            <form onSubmit={submit} className="max-w-2xl mx-auto flex flex-col gap-6">
              <Sekcja
                numer="CZĘŚĆ 1 / 3"
                tytul="Wy i Wasz produkt"
                podtytul="Bez tego AI nie wie, o czym w ogóle jest rozmowa."
              >
                <div>
                  <label className={labelCls} htmlFor="firma">
                    Nazwa firmy *
                  </label>
                  <input id="firma" required className={inputCls} placeholder="STYROBUD" value={form.firma} onChange={pole("firma")} />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls} htmlFor="osoba">
                      Imię i nazwisko *
                    </label>
                    <input
                      id="osoba"
                      required
                      autoComplete="name"
                      className={inputCls}
                      placeholder="Adam Nowak"
                      value={form.osoba}
                      onChange={pole("osoba")}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="email">
                      Adres email *
                    </label>
                    <input
                      id="email"
                      required
                      type="email"
                      autoComplete="email"
                      className={inputCls}
                      placeholder="adam@firma.pl"
                      value={form.email}
                      onChange={pole("email")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls} htmlFor="coSprzedajecie">
                    Co sprzedajecie? *
                  </label>
                  <span className={opisCls}>Jedno, dwa zdania. Tak, jak powiedziałbyś to klientowi przez telefon.</span>
                  <textarea
                    id="coSprzedajecie"
                    required
                    rows={3}
                    className={inputCls}
                    placeholder="Prefabrykaty betonowe dla firm budowlanych. Produkcja na zamówienie, dostawa w 14 dni."
                    value={form.coSprzedajecie}
                    onChange={pole("coSprzedajecie")}
                  />
                </div>

                <fieldset>
                  <legend className={labelCls}>Średnia wartość jednej transakcji *</legend>
                  <div className="flex flex-wrap gap-2">
                    {WARTOSC_TRANSAKCJI.map((w) => (
                      <button key={w} type="button" aria-pressed={form.wartosc === w} onClick={() => setForm((f) => ({ ...f, wartosc: w }))} className={chip(form.wartosc === w)}>
                        {w}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className={labelCls}>Ilu macie handlowców? *</legend>
                  <div className="flex flex-wrap gap-2">
                    {WIELKOSC_ZESPOLU.map((w) => (
                      <button key={w} type="button" aria-pressed={form.zespol === w} onClick={() => setForm((f) => ({ ...f, zespol: w }))} className={chip(form.zespol === w)}>
                        {w}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </Sekcja>

              <Sekcja
                numer="CZĘŚĆ 2 / 3"
                tytul="Kto jest Waszym klientem"
                podtytul="W tę osobę wciela się AI. Im konkretniej, tym trudniej będzie handlowcowi."
              >
                <div>
                  <label className={labelCls} htmlFor="ktoDecyduje">
                    Kto po stronie klienta podejmuje decyzję? *
                  </label>
                  <span className={opisCls}>Stanowisko, nie nazwisko. Np. kierownik budowy, właściciel zakładu, dyrektor zakupów.</span>
                  <input id="ktoDecyduje" required className={inputCls} placeholder="Kierownik budowy" value={form.ktoDecyduje} onChange={pole("ktoDecyduje")} />
                </div>

                <div>
                  <label className={labelCls} htmlFor="branzaKlienta">
                    Branża i wielkość firmy klienta *
                  </label>
                  <input
                    id="branzaKlienta"
                    required
                    className={inputCls}
                    placeholder="Firmy budowlane, 20-100 osób, Podkarpacie"
                    value={form.branzaKlienta}
                    onChange={pole("branzaKlienta")}
                  />
                </div>

                <div>
                  <label className={labelCls} htmlFor="ileOsobDecyzja">
                    Ile osób po stronie klienta bierze udział w decyzji? *
                  </label>
                  <span className={opisCls}>Jeden człowiek decyduje sam czy musi to przez kogoś przepchnąć?</span>
                  <input id="ileOsobDecyzja" required className={inputCls} placeholder="Zwykle dwie: kierownik i właściciel" value={form.ileOsobDecyzja} onChange={pole("ileOsobDecyzja")} />
                </div>

                <fieldset>
                  <legend className={labelCls}>Jak taki klient zachowuje się w rozmowie? *</legend>
                  <span className={opisCls}>Zaznacz wszystko, co pasuje. To ustawia trudność treningu.</span>
                  <div className="flex flex-wrap gap-2">
                    {ZACHOWANIA.map((z) => (
                      <button key={z} type="button" aria-pressed={form.zachowania.includes(z)} onClick={() => przelacz("zachowania", z)} className={chip(form.zachowania.includes(z))}>
                        {z}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </Sekcja>

              <Sekcja
                numer="CZĘŚĆ 3 / 3"
                tytul="Jak wygląda Wasza rozmowa"
                podtytul="Scenariusz, który AI ma prowadzić, i moment, w którym rozmowy najczęściej padają."
              >
                <fieldset>
                  <legend className={labelCls}>Gdzie odbywa się rozmowa? *</legend>
                  <div className="flex flex-wrap gap-2">
                    {KANALY.map((k) => (
                      <button key={k} type="button" aria-pressed={form.kanal === k} onClick={() => setForm((f) => ({ ...f, kanal: k }))} className={chip(form.kanal === k)}>
                        {k}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className={labelCls}>Który etap ma trenować zespół? *</legend>
                  <span className={opisCls}>Zaznacz wszystkie, na których dziś tracicie najwięcej.</span>
                  <div className="flex flex-wrap gap-2">
                    {ETAPY.map((e) => (
                      <button key={e} type="button" aria-pressed={form.etapy.includes(e)} onClick={() => przelacz("etapy", e)} className={chip(form.etapy.includes(e))}>
                        {e}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label className={labelCls} htmlFor="przebieg">
                    Przebieg rozmowy krok po kroku *
                  </label>
                  <span className={opisCls}>
                    Od pierwszego zdania do końca. Jeśli macie skrypt, wklej go tutaj w całości.
                  </span>
                  <textarea
                    id="przebieg"
                    required
                    rows={7}
                    className={inputCls}
                    placeholder={"1. Przedstawienie się i powód telefonu\n2. Pytanie o aktualnego dostawcę\n3. Pytanie o terminy dostaw\n4. Propozycja wyceny\n5. Umówienie się na wysłanie oferty"}
                    value={form.przebieg}
                    onChange={pole("przebieg")}
                  />
                </div>

                <div>
                  <label className={labelCls} htmlFor="obiekcje">
                    Trzy najczęstsze obiekcje, dosłownie *
                  </label>
                  <span className={opisCls}>
                    Przepisz zdania, które realnie słyszycie. Nie „obiekcja cenowa", tylko „macie drożej niż konkurencja".
                  </span>
                  <textarea
                    id="obiekcje"
                    required
                    rows={5}
                    className={inputCls}
                    placeholder={"1. Mamy już dostawcę i jesteśmy zadowoleni\n2. To jest drogie, konkurencja daje taniej\n3. Prześlijcie ofertę mailem, odezwiemy się"}
                    value={form.obiekcje}
                    onChange={pole("obiekcje")}
                  />
                </div>

                <div>
                  <label className={labelCls} htmlFor="sukces">
                    Co znaczy, że rozmowa się udała? *
                  </label>
                  <span className={opisCls}>Bez tego AI nie ma czego oceniać. Umówione spotkanie? Wysłana wycena? Podpis?</span>
                  <input
                    id="sukces"
                    required
                    className={inputCls}
                    placeholder="Klient zgadza się na wycenę i podaje ilości"
                    value={form.sukces}
                    onChange={pole("sukces")}
                  />
                </div>

                <div>
                  <label className={labelCls} htmlFor="powodPrzegranej">
                    Najczęstszy powód, dla którego przegrywacie *
                  </label>
                  <textarea
                    id="powodPrzegranej"
                    required
                    rows={3}
                    className={inputCls}
                    placeholder="Klient ma dostawcę od lat i nie chce zmieniać. Handlowiec odpuszcza po pierwszym 'nie'."
                    value={form.powodPrzegranej}
                    onChange={pole("powodPrzegranej")}
                  />
                </div>

                <div className="h-px bg-slate-200/80 my-1" />
                <p className="text-[12px] text-slate-500 -mb-1">Poniżej opcjonalnie, ale każde pole podnosi jakość treningu.</p>

                <div>
                  <label className={labelCls} htmlFor="konkurencja">
                    Z kim porównuje Was klient?
                  </label>
                  <input id="konkurencja" className={inputCls} placeholder="Nazwy 2-3 firm" value={form.konkurencja} onChange={pole("konkurencja")} />
                </div>

                <div>
                  <label className={labelCls} htmlFor="zargon">
                    Żargon i skróty z Waszej branży
                  </label>
                  <span className={opisCls}>Słowa, których używa klient. Dzięki nim AI brzmi jak człowiek z branży, a nie jak bot.</span>
                  <textarea id="zargon" rows={3} className={inputCls} placeholder="MPP, strop filigran, ITB, deklaracja właściwości użytkowych" value={form.zargon} onChange={pole("zargon")} />
                </div>

                <div>
                  <label className={labelCls} htmlFor="zakazy">
                    Czego handlowcowi nie wolno powiedzieć?
                  </label>
                  <span className={opisCls}>Ograniczenia prawne, zakazane obietnice, tematy do omijania.</span>
                  <textarea id="zakazy" rows={3} className={inputCls} placeholder="Nie wolno podawać ceny przed wyceną techniczną. Nie obiecujemy terminu dostawy przez telefon." value={form.zakazy} onChange={pole("zakazy")} />
                </div>

                <div>
                  <label className={labelCls} htmlFor="nagranie">
                    Link do nagrania prawdziwej rozmowy
                  </label>
                  <span className={opisCls}>
                    Jedno nagranie zastępuje połowę tego formularza. Drive, Dropbox, WeTransfer. Potrzebna zgoda drugiej strony.
                  </span>
                  <input id="nagranie" type="url" className={inputCls} placeholder="https://" value={form.nagranie} onChange={pole("nagranie")} />
                </div>
              </Sekcja>

              {status === "error" && (
                <p className="text-red-700 text-sm text-center">
                  Coś poszło nie tak. Napisz na hello@jakubchodakowski.com
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !komplet}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-700 to-teal-700 text-white font-semibold text-sm active:scale-[0.98] hover:brightness-110 transition-all duration-150 shadow-lg shadow-cyan-800/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {status === "sending" ? "Wysyłam..." : "Wyślij ankietę →"}
              </button>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed pb-4">
                Dane trafiają wyłącznie do Jakuba Chodakowskiego, NIP 6711845485, i służą wyłącznie
                do ustawienia treningu dla Waszego zespołu.
              </p>
            </form>
          </>
        )}
      </main>

      <style jsx global>{`
        .brief-szklo {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.85);
          box-shadow:
            0 24px 60px -20px rgba(15, 23, 42, 0.22),
            0 2px 10px -4px rgba(15, 23, 42, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        @media (prefers-reduced-transparency: reduce) {
          .brief-szklo {
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
