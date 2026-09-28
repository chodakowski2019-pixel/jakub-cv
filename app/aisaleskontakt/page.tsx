"use client";

import { useState } from "react";

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

export default function AiSalesKontaktPage() {
  const [form, setForm] = useState({ imie: "", email: "", telefon: "", zawod: "", zgoda: false });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const set = (k: "imie" | "email" | "telefon") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/aisaleskontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "ok" : "error");
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
        {status !== "ok" && (
          <div className="max-w-2xl mx-auto mb-10 sm:mb-12 text-center">
            <h1 className="text-[1.9rem] sm:text-[2.75rem] font-bold font-[var(--font-poppins)] leading-[1.08] tracking-[-0.025em] mb-4">
              Twoi handlowcy uczą się na{" "}
              <span className="bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
                Twoich klientach
              </span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-7">
              Każda przepalona rozmowa to lead,
              <br />
              za którego już zapłaciłeś.
            </p>
            {/* Wezwanie w kafelku: ma odciac sie od reszty, zeby oko trafilo
                na nie w drodze do formularza. */}
            <div className="inline-block rounded-2xl bg-white/75 backdrop-blur-xl border border-cyan-600/30 ring-1 ring-inset ring-white/70 px-6 py-4 sm:px-8 sm:py-5 shadow-lg shadow-cyan-900/[0.07]">
              <p className="text-slate-800 text-[15px] sm:text-base font-semibold leading-relaxed">
                Wypełnij formularz i otrzymaj dostęp do narzędzia,
                <br className="hidden sm:block" /> które wytrenuje Twoich handlowców w sprzedaży 1:1
              </p>
            </div>
          </div>
        )}

        {status === "ok" ? (
          <div className="karta-szklo max-w-md mx-auto rounded-3xl p-8 flex flex-col items-center text-center">
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
            <h1 className="text-2xl font-bold mb-3 font-[var(--font-poppins)] tracking-[-0.01em]">Dziękuję.</h1>
            <p className="text-slate-700 leading-relaxed">Odezwę się w ciągu 24 godzin.</p>
            <p className="text-sm text-slate-500 mt-4">Jakub Chodakowski</p>
          </div>
        ) : (
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
                  onChange={set("email")}
                />
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
                <legend className={labelCls}>Wybierz swój zawód *</legend>
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

              {status === "error" && (
                <p className="text-red-700 text-sm text-center">
                  Coś poszło nie tak. Napisz na hello@jakubchodakowski.com
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !form.zawod}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-700 to-teal-700 text-white font-semibold text-sm active:scale-[0.98] hover:brightness-110 transition-all duration-150 shadow-lg shadow-cyan-800/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {status === "sending" ? "Wysyłam..." : "Wyślij →"}
              </button>
            </form>
          </div>
        )}
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
