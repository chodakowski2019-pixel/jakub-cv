"use client";

import { useState } from "react";
import Link from "next/link";

const PRZYCHOD_OPTIONS = ["<500K PLN/USD", "500K–2M PLN/USD", "2M–10M PLN/USD", ">10M PLN/USD"];
const BUDZET_OPTIONS = ["<5K PLN/USD", "5K–15K PLN/USD", "15K–30K PLN/USD", ">30K PLN/USD"];

export default function AudytPage() {
  const [form, setForm] = useState({
    nazwa: "", branza: "", opis: "", lata: "", kraje: "", przychod: "",
    pracownicy: "", dzialy: "",
    dane: "", jakoscDanych: "",
    aiPoziom: "", it: "", proby: "",
    zakres: "", decydent: "",
    budzet: "", dodatkowe: "",
  });
  const [status, setStatus] = useState<"idle" | "ok">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("ok");
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#ededed] placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all";
  const labelCls = "block text-xs font-medium text-neutral-400 mb-1.5";
  const sectionCls = "space-y-4";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-[var(--font-open-sans)]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span>
            <span>jakubchodakowski.com</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 pb-10 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-4">Audyt AI</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 font-[var(--font-poppins)]">
            Wypełnij{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              ankietę
            </span>
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed">
            Na podstawie Twoich odpowiedzi przygotuję wycenę audytu AI dla Twojej firmy. Zajmie to ~10 minut.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {status === "ok" ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="relative mb-6">
                <img
                  src="https://media.licdn.com/dms/image/v2/D4D03AQFWaMpQd3x-_Q/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1726162788974?e=1776902400&v=beta&t=hqAM6AfC-sl9Bre2Rk5VxgFHIUy37-5vsZgFtAc4A"
                  alt="Jakub Chodakowski"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-emerald-500/40"
                />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-sm">✓</div>
              </div>
              <h2 className="text-2xl font-bold mb-3 font-[var(--font-poppins)]">Dziękuję za wypełnienie ankiety!</h2>
              <p className="text-neutral-400 max-w-sm leading-relaxed">
                Skontaktuję się z Tobą w ciągu <span className="text-white font-medium">3 dni roboczych</span> z wyceną audytu AI dla Twojego projektu.
              </p>
              <p className="text-sm text-neutral-600 mt-4">— Jakub Chodakowski</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-10">

              {/* Sekcja 1 */}
              <div className={sectionCls}>
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest pb-2 border-b border-white/[0.06] font-[var(--font-poppins)]">
                  🏢 Informacje o firmie
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nazwa firmy *</label>
                    <input required className={inputCls} placeholder="np. Acme Sp. z o.o." value={form.nazwa} onChange={set("nazwa")} />
                  </div>
                  <div>
                    <label className={labelCls}>Branża *</label>
                    <input required className={inputCls} placeholder="np. E-commerce, Logistyka" value={form.branza} onChange={set("branza")} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Opisz firmę — czym się zajmujecie? *</label>
                  <textarea required rows={3} className={inputCls} placeholder="Krótki opis działalności..." value={form.opis} onChange={set("opis")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Ile lat działa firma?</label>
                    <input className={inputCls} placeholder="np. 5 lat" value={form.lata} onChange={set("lata")} />
                  </div>
                  <div>
                    <label className={labelCls}>Kraje / rynki</label>
                    <input className={inputCls} placeholder="np. Polska, USA" value={form.kraje} onChange={set("kraje")} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Roczny przychód firmy</label>
                  <select className={inputCls} value={form.przychod} onChange={set("przychod")}>
                    <option value="">Wybierz przedział</option>
                    {PRZYCHOD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Sekcja 2 */}
              <div className={sectionCls}>
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest pb-2 border-b border-white/[0.06] font-[var(--font-poppins)]">
                  👥 Struktura i zespół
                </h2>
                <div>
                  <label className={labelCls}>Ile osób zatrudnia firma łącznie? (full-time + part-time)</label>
                  <input className={inputCls} placeholder="np. 12" value={form.pracownicy} onChange={set("pracownicy")} />
                </div>
                <div>
                  <label className={labelCls}>Jakie działy i ile osób w każdym?</label>
                  <textarea rows={3} className={inputCls} placeholder="np. Sprzedaż – 4 os. | Marketing – 2 os. | Operacje – 6 os." value={form.dzialy} onChange={set("dzialy")} />
                </div>
              </div>

              {/* Sekcja 3 */}
              <div className={sectionCls}>
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest pb-2 border-b border-white/[0.06] font-[var(--font-poppins)]">
                  📊 Dane i systemy
                </h2>
                <div>
                  <label className={labelCls}>Czy zbieracie dane o klientach, sprzedaży, operacjach? Czy jest polityka zbierania danych?</label>
                  <textarea rows={2} className={inputCls} placeholder="Opisz jak to wygląda..." value={form.dane} onChange={set("dane")} />
                </div>
                <div>
                  <label className={labelCls}>Jak oceniasz jakość danych? (1 = chaos, 10 = wszystko w jednym miejscu i aktualne)</label>
                  <input type="number" min={1} max={10} className={inputCls} placeholder="1–10" value={form.jakoscDanych} onChange={set("jakoscDanych")} />
                </div>
              </div>

              {/* Sekcja 4 */}
              <div className={sectionCls}>
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest pb-2 border-b border-white/[0.06] font-[var(--font-poppins)]">
                  🤖 AI i technologia
                </h2>
                <div>
                  <label className={labelCls}>Poziom wiedzy AI w zespole — czy używają narzędzi, są szkoleni? (1 = zero wiedzy, 10 = aktywnie używają na co dzień)</label>
                  <input type="number" min={1} max={10} className={inputCls} placeholder="1–10" value={form.aiPoziom} onChange={set("aiPoziom")} />
                </div>
                <div>
                  <label className={labelCls}>Czy masz kogoś odpowiedzialnego za IT? Wewnętrznie czy zewnętrznie?</label>
                  <input className={inputCls} placeholder="np. Zewnętrzna firma IT" value={form.it} onChange={set("it")} />
                </div>
                <div>
                  <label className={labelCls}>Czy była wcześniej jakaś próba wdrożenia automatyzacji lub AI? Co wyszło, co nie?</label>
                  <textarea rows={2} className={inputCls} placeholder="Opisz jeśli tak..." value={form.proby} onChange={set("proby")} />
                </div>
              </div>

              {/* Sekcja 5 */}
              <div className={sectionCls}>
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest pb-2 border-b border-white/[0.06] font-[var(--font-poppins)]">
                  🎯 Zakres i decyzja
                </h2>
                <div>
                  <label className={labelCls}>Które działy chcesz objąć audytem — wszystkie, czy wybrane?</label>
                  <input className={inputCls} placeholder="np. Wszystkie / tylko Sprzedaż i Marketing" value={form.zakres} onChange={set("zakres")} />
                </div>
                <div>
                  <label className={labelCls}>Kto po Twojej stronie podejmuje decyzję o wdrożeniu AI? *</label>
                  <input required className={inputCls} placeholder="np. Ja — właściciel / Zarząd" value={form.decydent} onChange={set("decydent")} />
                </div>
              </div>

              {/* Sekcja 6 */}
              <div className={sectionCls}>
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest pb-2 border-b border-white/[0.06] font-[var(--font-poppins)]">
                  💰 Budżet
                </h2>
                <div>
                  <label className={labelCls}>Jaki budżet rozważasz na wdrożenie AI?</label>
                  <select className={inputCls} value={form.budzet} onChange={set("budzet")}>
                    <option value="">Wybierz przedział</option>
                    {BUDZET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Sekcja 7 */}
              <div className={sectionCls}>
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest pb-2 border-b border-white/[0.06] font-[var(--font-poppins)]">
                  📝 Dodatkowe informacje
                </h2>
                <div>
                  <label className={labelCls}>Jeżeli masz coś jeszcze do przekazania — napisz tutaj</label>
                  <textarea rows={3} className={inputCls} placeholder="Opcjonalnie..." value={form.dodatkowe} onChange={set("dodatkowe")} />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/20"
              >
                Wyślij ankietę →
              </button>

            </form>
          )}
        </div>
      </section>
    </div>
  );
}
