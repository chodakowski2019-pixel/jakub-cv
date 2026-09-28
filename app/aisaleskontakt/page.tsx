"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Lista stanowisk = grupa docelowa z researchu 28.09.
// Kolejność od decydenta do użytkownika, bo pierwsza opcja jest najczęściej klikana.
const ZAWODY = [
  "Dyrektor sprzedaży",
  "Kierownik zespołu sprzedaży",
  "Właściciel firmy",
  "Handlowiec",
  "Inne",
];

const KORZYSCI = [
  { liczba: "76%", opis: "planu robią handlowcy coachowani co tydzień. Przy coachingu raz na kwartał: 47%" },
  { liczba: "12", opis: "handlowców przypada dziś na jednego szefa sprzedaży. Nikt nie usiądzie z każdym" },
  { liczba: "3 mies.", opis: "bezpłatnego pilotażu dla pierwszych firm, które wejdą w testy" },
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

  // Materiał: translucent glass na ciemnym tle, akcent cyan (design zablokowany 27.05).
  const inputCls =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-base text-[#e8f4f8] placeholder-white/25 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.07] transition-colors duration-150";
  const labelCls = "block text-xs font-medium text-white/50 mb-1.5 tracking-[0.01em]";

  return (
    <div className="min-h-screen text-[#e8f4f8] font-[var(--font-open-sans)]">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a1218]/70 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/"
            className="text-sm text-white/45 hover:text-white active:scale-[0.98] transition-all duration-150 flex items-center gap-2"
          >
            <span aria-hidden>←</span>
            <span>jakubchodakowski.com</span>
          </Link>
        </div>
      </nav>

      {status === "ok" ? (
        <section className="px-6 py-28">
          <div className="max-w-md mx-auto flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-cyan-400/15 border-2 border-cyan-400/50 flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-cyan-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 font-[var(--font-poppins)] tracking-[-0.01em]">Dziękuję.</h2>
            <p className="text-white/55 leading-relaxed">Odezwę się w ciągu 24 godzin.</p>
            <p className="text-sm text-white/30 mt-4">Jakub Chodakowski</p>
          </div>
        </section>
      ) : (
        <>
          <section className="px-6 pt-14 pb-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-7">
                <Image
                  src="/profilowe_jakub.png"
                  alt="Jakub Chodakowski"
                  width={64}
                  height={64}
                  className="rounded-full object-cover border border-white/15 shrink-0"
                  priority
                />
                <div>
                  <p className="text-[11px] font-mono text-cyan-300 uppercase tracking-[0.18em]">Pilotaż</p>
                  <p className="text-sm text-white/55 mt-0.5">Jakub Chodakowski</p>
                </div>
              </div>

              <h1 className="text-[2rem] md:text-[3.25rem] font-bold font-[var(--font-poppins)] leading-[1.05] tracking-[-0.025em] mb-5">
                Twoi handlowcy trenują{" "}
                <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                  z AI
                </span>
                , nie na Twoich klientach
              </h1>

              <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-xl">
                Handlowiec rozmawia z AI, które gra trudnego klienta. Ty dostajesz raport, kto czego nie umie.
                Zostaw kontakt, a opowiem o szczegółach.
              </p>
            </div>
          </section>

          <section className="px-6 pb-10">
            <div className="max-w-2xl mx-auto grid gap-3 sm:grid-cols-3">
              {KORZYSCI.map((k) => (
                <div
                  key={k.liczba}
                  className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4"
                >
                  <p className="text-2xl font-bold text-cyan-300 font-[var(--font-poppins)] tracking-[-0.02em]">
                    {k.liczba}
                  </p>
                  <p className="text-[13px] text-white/55 leading-snug mt-1.5">{k.opis}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="px-6 pb-24">
            <div className="max-w-md mx-auto rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 sm:p-7 shadow-2xl shadow-black/40">
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
                    Numer telefonu *
                  </label>
                  <input
                    id="telefon"
                    required
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
                          className={`px-3.5 py-2 rounded-xl text-[13px] border active:scale-[0.97] transition-all duration-150 ${
                            wybrany
                              ? "bg-cyan-400/15 border-cyan-400/60 text-cyan-200 font-medium"
                              : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/25 hover:text-white"
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
                    className="mt-0.5 w-[18px] h-[18px] shrink-0 rounded accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-[12px] text-white/45 leading-relaxed group-hover:text-white/60 transition-colors duration-150">
                    Zgadzam się na kontakt telefoniczny i mailowy w sprawie pilotażu. Administratorem danych jest
                    Jakub Chodakowski, NIP 6711845485. Zgodę mogę wycofać w każdej chwili.
                  </span>
                </label>

                {status === "error" && (
                  <p className="text-red-300 text-sm text-center">
                    Coś poszło nie tak. Napisz na hello@jakubchodakowski.com
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending" || !form.zawod}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-[#04131a] font-semibold text-sm active:scale-[0.98] hover:brightness-110 transition-all duration-150 shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {status === "sending" ? "Wysyłam..." : "Chcę wejść w pilotaż →"}
                </button>

                <p className="text-[11px] text-white/30 text-center">
                  Odpowiadam w ciągu 24 godzin. Bez zapisu na newsletter.
                </p>
              </form>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
