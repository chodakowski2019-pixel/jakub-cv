"use client";

import { useState } from "react";
import Link from "next/link";

const PRZYCHOD = {
  en: ["<$500K", "$500K–$2M", "$2M–$10M", ">$10M"],
  pl: ["<500K USD", "500K–2M USD", "2M–10M USD", ">10M USD"],
};
const BUDZET = {
  en: ["<$5K", "$5K–$15K", "$15K–$30K", ">$30K"],
  pl: ["<5K USD", "5K–15K USD", "15K–30K USD", ">30K USD"],
};

const T = {
  en: {
    badge: "AI Audit",
    h1a: "Fill out the", h1b: "questionnaire",
    sub: "Based on your answers, I'll prepare an AI audit quote tailored to your company.",
    nav: "jakubchodakowski.com",
    s1: "🏢 Company Information",
    s2: "👥 Structure & Team",
    s3: "📊 Data & Systems",
    s4: "🤖 AI & Technology",
    s5: "🎯 Scope & Decision",
    s6: "💰 Budget",
    s7: "📝 Additional Notes",
    companyName: "Company name *", contactName: "First & last name *", position: "Position *", industry: "Industry *",
    description: "Describe your company: what do you do? *",
    descriptionPh: "Brief description...",
    years: "Years in business", yearsPh: "e.g. 5",
    countries: "Countries / markets", countriesPh: "e.g. USA, Poland",
    revenue: "Annual revenue",
    employees: "Total number of employees", employeesPh: "e.g. 12",
    departments: "What departments does the company have and how many people work in each?",
    departmentsPh: "e.g. Sales – 4 | Marketing – 2 | Operations – 6 | Finance – 1",
    dataPolicy: "Do you collect data on customers, sales, operations? Do you have a data collection policy?",
    dataPolicyPh: "Describe how it works...",
    dataQuality: "How would you rate your data quality?",
    dataQualityHint: "1 = total chaos · 10 = everything organized & up to date",
    aiLevel: "AI knowledge level in the team",
    aiLevelHint: "1 = no knowledge · 10 = actively used daily",
    it: "Do you have someone responsible for IT? Internal or external?", itPh: "e.g. External IT company",
    attempts: "Previous attempt at automation or AI? What worked, what didn't?", attemptsPh: "Describe if applicable...",
    scope: "Which departments to include — all or selected?", scopePh: "e.g. All / only Sales & Marketing",
    decisionMaker: "Who makes the decision on AI implementation? *", decisionMakerPh: "e.g. Me — owner / Board",
    budget: "Budget for AI implementation",
    notes: "Any additional information to share?", notesPh: "Optional...",
    submit: "Submit questionnaire →",
    successTitle: "Thank you!",
    successSub: "I'll get back to you within 3 business days with an AI audit quote.",
    successName: "— Jakub Chodakowski",
  },
  pl: {
    badge: "Audyt AI",
    h1a: "Wypełnij", h1b: "ankietę",
    sub: "Na podstawie Twoich odpowiedzi przygotuję wycenę audytu AI dla Twojej firmy.",
    nav: "jakubchodakowski.com",
    s1: "🏢 Informacje o firmie",
    s2: "👥 Struktura i zespół",
    s3: "📊 Dane i systemy",
    s4: "🤖 AI i technologia",
    s5: "🎯 Zakres i decyzja",
    s6: "💰 Budżet",
    s7: "📝 Dodatkowe informacje",
    companyName: "Nazwa firmy *", contactName: "Imię i nazwisko *", position: "Stanowisko *", industry: "Branża *",
    description: "Opisz firmę: czym się zajmujecie? *",
    descriptionPh: "Krótki opis działalności...",
    years: "Ile lat działa firma?", yearsPh: "np. 5",
    countries: "Kraje / rynki", countriesPh: "np. Polska, USA",
    revenue: "Roczny przychód firmy",
    employees: "Ile osób zatrudnia firma łącznie?", employeesPh: "np. 12",
    departments: "Jakie firma ma działy i ile osób pracuje w każdym z tych działów?",
    departmentsPh: "np. Sprzedaż – 4 os. | Marketing – 2 os. | Operacje – 6 os.",
    dataPolicy: "Czy zbieracie dane o klientach, sprzedaży, operacjach? Czy posiadacie politykę zbierania danych?",
    dataPolicyPh: "Opisz jak to wygląda...",
    dataQuality: "Jak oceniasz jakość danych?",
    dataQualityHint: "1 = chaos · 10 = wszystko w jednym miejscu i aktualne",
    aiLevel: "Poziom wiedzy AI w zespole",
    aiLevelHint: "1 = zero wiedzy · 10 = aktywnie używają na co dzień",
    it: "Czy masz kogoś odpowiedzialnego za IT? Wewnętrznie czy zewnętrznie?", itPh: "np. Zewnętrzna firma IT",
    attempts: "Czy była wcześniej próba wdrożenia automatyzacji lub AI? Co wyszło, co nie?", attemptsPh: "Opisz jeśli tak...",
    scope: "Które działy objąć audytem — wszystkie, czy wybrane?", scopePh: "np. Wszystkie / tylko Sprzedaż i Marketing",
    decisionMaker: "Kto podejmuje decyzję o wdrożeniu AI? *", decisionMakerPh: "np. Ja — właściciel / Zarząd",
    budget: "Jaki budżet rozważasz na wdrożenie AI?",
    notes: "Jeżeli masz coś jeszcze do przekazania — napisz tutaj", notesPh: "Opcjonalnie...",
    submit: "Wyślij ankietę →",
    successTitle: "Dziękuję!",
    successSub: "Skontaktuję się z Tobą w ciągu 3 dni roboczych z wyceną audytu AI.",
    successName: "— Jakub Chodakowski",
  },
};

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

function ScaleSelect({ value, onChange, hint }: { value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <div>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-xl text-sm font-medium border transition-all duration-150 ${value === n
              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
              : "bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white"}`}>
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-600 mt-2">{hint}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 pb-8 border-b border-white/[0.06]">
      <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest font-[var(--font-poppins)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function AnkietaPage() {
  const [lang, setLang] = useState<"en" | "pl">("en");
  const t = T[lang];
  const [form, setForm] = useState({
    nazwa: "", contactName: "", position: "", branza: "", opis: "", lata: "", kraje: "", przychod: "",
    pracownicy: "", dzialy: "",
    dane: "", jakoscDanych: "",
    aiPoziom: "", it: "", proby: "",
    zakres: "", decydent: "",
    budzet: "", dodatkowe: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/ankieta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span><span>{t.nav}</span>
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "pl" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-xs text-neutral-400 hover:text-white"
          >
            <span>{lang === "en" ? "🇵🇱" : "🇺🇸"}</span>
            <span>{lang === "en" ? "PL" : "EN"}</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className={`relative pt-16 pb-10 px-6 overflow-hidden ${status === "ok" ? "hidden" : ""}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-4">{t.badge}</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 font-[var(--font-poppins)]">
            {t.h1a}{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{t.h1b}</span>
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed">{t.sub}</p>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {status === "ok" ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 font-[var(--font-poppins)]">{t.successTitle}</h2>
              <p className="text-neutral-400 max-w-sm leading-relaxed">{t.successSub}</p>
              <p className="text-sm text-neutral-600 mt-4">{t.successName}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-0 flex flex-col gap-8 pt-6">

              <Section title={t.s1}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>{t.contactName}</label>
                    <input required className={inputCls} placeholder="John Smith" value={form.contactName} onChange={set("contactName")} /></div>
                  <div><label className={labelCls}>{t.position}</label>
                    <input required className={inputCls} placeholder="CEO / Founder" value={form.position} onChange={set("position")} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>{t.companyName}</label>
                    <input required className={inputCls} placeholder="Acme Inc." value={form.nazwa} onChange={set("nazwa")} /></div>
                  <div><label className={labelCls}>{t.industry}</label>
                    <input required className={inputCls} placeholder="e.g. E-commerce" value={form.branza} onChange={set("branza")} /></div>
                </div>
                <div><label className={labelCls}>{t.description}</label>
                  <textarea required rows={3} className={inputCls} placeholder={t.descriptionPh} value={form.opis} onChange={set("opis")} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>{t.years}</label>
                    <input className={inputCls} placeholder={t.yearsPh} value={form.lata} onChange={set("lata")} /></div>
                  <div><label className={labelCls}>{t.countries}</label>
                    <input className={inputCls} placeholder={t.countriesPh} value={form.kraje} onChange={set("kraje")} /></div>
                </div>
                <div><label className={labelCls}>{t.revenue}</label>
                  <PillSelect options={PRZYCHOD[lang]} value={form.przychod} onChange={setVal("przychod")} /></div>
              </Section>

              <Section title={t.s2}>
                <div><label className={labelCls}>{t.employees}</label>
                  <input className={inputCls} placeholder={t.employeesPh} value={form.pracownicy} onChange={set("pracownicy")} /></div>
                <div><label className={labelCls}>{t.departments}</label>
                  <textarea rows={3} className={inputCls} placeholder={t.departmentsPh} value={form.dzialy} onChange={set("dzialy")} /></div>
              </Section>

              <Section title={t.s3}>
                <div><label className={labelCls}>{t.dataPolicy}</label>
                  <textarea rows={2} className={inputCls} placeholder={t.dataPolicyPh} value={form.dane} onChange={set("dane")} /></div>
                <div><label className={labelCls}>{t.dataQuality}</label>
                  <ScaleSelect value={form.jakoscDanych} onChange={setVal("jakoscDanych")} hint={t.dataQualityHint} /></div>
              </Section>

              <Section title={t.s4}>
                <div><label className={labelCls}>{t.aiLevel}</label>
                  <ScaleSelect value={form.aiPoziom} onChange={setVal("aiPoziom")} hint={t.aiLevelHint} /></div>
                <div><label className={labelCls}>{t.it}</label>
                  <input className={inputCls} placeholder={t.itPh} value={form.it} onChange={set("it")} /></div>
                <div><label className={labelCls}>{t.attempts}</label>
                  <textarea rows={2} className={inputCls} placeholder={t.attemptsPh} value={form.proby} onChange={set("proby")} /></div>
              </Section>

              <Section title={t.s5}>
                <div><label className={labelCls}>{t.scope}</label>
                  <input className={inputCls} placeholder={t.scopePh} value={form.zakres} onChange={set("zakres")} /></div>
                <div><label className={labelCls}>{t.decisionMaker}</label>
                  <input required className={inputCls} placeholder={t.decisionMakerPh} value={form.decydent} onChange={set("decydent")} /></div>
              </Section>

              <Section title={t.s6}>
                <div><label className={labelCls}>{t.budget}</label>
                  <PillSelect options={BUDZET[lang]} value={form.budzet} onChange={setVal("budzet")} /></div>
              </Section>

              <div className="space-y-4">
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest font-[var(--font-poppins)]">{t.s7}</h2>
                <div><label className={labelCls}>{t.notes}</label>
                  <textarea rows={3} className={inputCls} placeholder={t.notesPh} value={form.dodatkowe} onChange={set("dodatkowe")} /></div>
              </div>

              {status === "error" && (
                <p className="text-red-400 text-sm text-center">Something went wrong. Try again or email jakub@jakubchodakowski.com</p>
              )}

              <button type="submit" disabled={status === "sending"}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {status === "sending" ? "Sending..." : t.submit}
              </button>

            </form>
          )}
        </div>
      </section>
    </div>
  );
}
