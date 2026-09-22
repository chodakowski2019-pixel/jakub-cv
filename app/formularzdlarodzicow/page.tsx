"use client";

import { useState } from "react";
import Link from "next/link";

const KONTAKT = ["Telefon", "Email"];

function PillSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-4 py-2 rounded-xl text-sm border transition-all duration-150 ${value === o
            ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-medium"
            : "bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

export default function FormularzRodzicePage() {
  const [form, setForm] = useState({
    imie: "", telefon: "", email: "", godziny: "", kontakt: "", wiekDziecka: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/formularzdlarodzicow", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-base text-[#ededed] placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all";
  const labelCls = "block text-xs font-medium text-neutral-400 mb-1.5";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-[var(--font-open-sans)]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="text-sm text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span><span>jakubchodakowski.com</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={`relative pt-16 pb-10 px-6 overflow-hidden ${status === "ok" ? "hidden" : ""}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-4">Dla rodziców</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 font-[var(--font-poppins)]">
            Szkolenia z AI dla{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">dzieci i nastolatków</span>
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed">
            Zostaw kontakt, a oddzwonię albo napiszę i opowiem o szczegółach.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 pb-24">
        <div className="max-w-md mx-auto">
          {status === "ok" ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 font-[var(--font-poppins)]">Dziękuję!</h2>
              <p className="text-neutral-400 max-w-sm leading-relaxed">Skontaktuję się w podanych godzinach.</p>
              <p className="text-sm text-neutral-600 mt-4">— Jakub Chodakowski</p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5 pt-6">
              <div><label className={labelCls}>Imię *</label>
                <input required className={inputCls} placeholder="Anna" value={form.imie} onChange={set("imie")} /></div>

              <div><label className={labelCls}>Numer telefonu *</label>
                <input required type="tel" className={inputCls} placeholder="+48 600 000 000" value={form.telefon} onChange={set("telefon")} /></div>

              <div><label className={labelCls}>Adres email *</label>
                <input required type="email" className={inputCls} placeholder="anna@example.com" value={form.email} onChange={set("email")} /></div>

              <div><label className={labelCls}>Kiedy najlepiej się skontaktować?</label>
                <input className={inputCls} placeholder="np. dni robocze po 17:00" value={form.godziny} onChange={set("godziny")} /></div>

              <div><label className={labelCls}>Wolisz kontakt przez:</label>
                <PillSelect options={KONTAKT} value={form.kontakt} onChange={setVal("kontakt")} /></div>

              <div><label className={labelCls}>Ile dziecko ma lat?</label>
                <input className={inputCls} placeholder="np. 12" value={form.wiekDziecka} onChange={set("wiekDziecka")} /></div>

              {status === "error" && (
                <p className="text-red-400 text-sm text-center">Coś poszło nie tak. Spróbuj ponownie albo napisz na jakub@jakubchodakowski.com</p>
              )}

              <button type="submit" disabled={status === "sending"}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {status === "sending" ? "Wysyłam..." : "Wyślij zgłoszenie →"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
