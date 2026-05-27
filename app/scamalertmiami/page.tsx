"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, CheckCircle2 } from "lucide-react";

const PROBLEMS = [
  {
    title: "Krypto-VC w twoich DM-ach",
    text: "Wypolerowany LinkedIn. „Family office” w bio. Chce 30 minut na rozmowę o twojej „ekscytującej rundzie”. Dwa tygodnie później 40 tys. dolarów znika, a LinkedIn jest skasowany.",
  },
  {
    title: "Luksusowy broker z Wynwood",
    text: "Pojawia się na twoim evencie w pożyczonym Lambo. Oferuje oferty off-market. Zaliczka schodzi. Nieruchomość nigdy nie była jego. Witaj w Miami real estate.",
  },
  {
    title: "„Founder” z Pura Vida",
    text: "Kawa w Wynwood. Wielka wizja. Większa prośba. Chce czeku, intro i twojego operatora. Nic się nie spina. Zanim się zorientujesz, twoja reputacja już za niego ręczyła.",
  },
];

const FEATURES = [
  {
    label: "Newsletter",
    title: "Tygodniowe rozbiory scamów",
    text: "Jeden świeży scam z Miami rozłożony na czynniki — hook, pułapka, ile founder stracił. Plus 2-3 nowe raporty od członków grupy.",
  },
  {
    label: "Baza",
    title: "Wyszukiwarka raportów",
    text: "Wpisz nazwisko, firmę, email albo LinkedIn. Zobacz czy ma zgłoszone incydenty — z kontekstem, dowodami i datami.",
  },
  {
    label: "Zgłoszenia",
    title: "Zgłoś co widziałeś",
    text: "Sparzyłeś się albo widziałeś jak ktoś inny się sparzył? Zgłoś z dowodami (screenshoty, kontrakty, wyciągi). Weryfikacja przed publikacją.",
  },
  {
    label: "Playbook",
    title: "Lista red flagów Miami",
    text: "Wzorce które uderzają founderów tutaj: fake VC connect, flipy nieruchomości off-market, partnerstwa krypto/Web3, schematy wizowe.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Wypełniasz formularz",
    text: "LinkedIn, firma, czym się zajmujesz w Miami, dlaczego chcesz dołączyć. 90 sekund.",
  },
  {
    n: "02",
    title: "Weryfikujemy przez 7 dni",
    text: "Osobiście sprawdzam każdą aplikację — aktywny LinkedIn, realna firma, sensowny powód żeby tu być.",
  },
  {
    n: "03",
    title: "Dostajesz decyzję",
    text: "Pass: zapraszamy do grupy. Fail: dajemy znać i kończymy temat. Nikt nie wchodzi bez weryfikacji.",
  },
];

const FAQS = [
  {
    q: "Co jeśli mnie odrzucicie?",
    a: "Dajemy znać w ciągu 7 dni. Bez tłumaczenia się — weryfikacja jest zerojedynkowa. Jeśli nie przechodzisz, nie ma drogi w tył w tej iteracji.",
  },
  {
    q: "Czy to jest legalne? Naprawdę można publikować nazwiska?",
    a: "Dostęp tylko dla zweryfikowanych członków (nie publiczny web). Każdy raport wymaga dowodów (screenshoty, kontrakty, wyciągi bankowe). Osoba zgłoszona dostaje notyfikację z 14-dniowym prawem odpowiedzi przed publikacją. Język: „zgłoszone incydenty”, „rzekomy”, nigdy „potwierdzony oszust” — chyba że są dokumenty sądowe.",
  },
  {
    q: "Czy to jest serwis sprawdzający tożsamość?",
    a: "Nie. To NIE jest agencja raportująca pod amerykańską ustawą FCRA (Fair Credit Reporting Act). Informacje stąd nie mogą być używane do decyzji o zatrudnieniu, kredycie, ubezpieczeniu, mieszkaniu ani żadnym innym celu pod FCRA. To jest wyłącznie edukacja i informacja.",
  },
  {
    q: "Co jeśli ktoś niesłusznie mnie zgłosi?",
    a: "Każda zgłoszona osoba dostaje notyfikację przed publikacją z 14 dniami na odpowiedź. Możesz zgłosić dowody, prosić o usunięcie, kwestionować. Zgłoszenia bez weryfikowalnych dowodów są odrzucane.",
  },
  {
    q: "Czy będziecie budować publiczną „listę oszustów”?",
    a: "Nie. Publiczne listy to magnes na pozwy o zniesławienie. To jest only-members, oparte na dowodach, z prawem odpowiedzi wbudowanym. Cel: chronić founderów, nie publikować billboard.",
  },
];

export default function ScamAlertMiami() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    linkedin: "",
    company: "",
    role: "",
    why: "",
  });

  function reveal() {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/scamalertmiami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error("send failed");
      setSubmitted(true);
    } catch {
      setError("Coś poszło nie tak. Spróbuj jeszcze raz albo napisz na hello@jakubchodakowski.com");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* ===== Top bar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-[#0a1218]/85 via-[#0a1218]/55 to-transparent">
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/25">JC</span>
            <span className="text-xs text-neutral-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">jakubchodakowski.com</span>
          </Link>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-300 uppercase tracking-widest hidden md:inline pointer-events-none">Scam Alert Miami</span>
          <button
            onClick={reveal}
            className="relative z-10 text-xs font-medium px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-[1.03]"
          >
            Chcę dołączyć
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-14 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[36rem] h-[36rem] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-5">Dla przedsiębiorców w Miami</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-[1.05]">
            Zanim podasz rękę „inwestorowi” z Wynwood, sprawdź czy nie zrobił tego samego trzem przed tobą.
          </h1>
          <p className="text-xl md:text-2xl font-medium mb-6 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Zamknięta grupa weryfikacji ludzi w Miami. 7-dniowy vetting przy wejściu.
          </p>
          <p className="text-neutral-300 max-w-xl mx-auto mb-10 leading-relaxed text-base">
            Krypto „VC” w DM-ach. Off-market flipy z pożyczonych Lambo. „Wspólnik”, co potrzebuje twojego intro i twojego operatora. Miami to ich łowisko, a ty jesteś świeży. Wchodzisz do grupy — dostajesz bazę zgłoszonych, tygodniowy rozbiór nowego scamu i listę red flagów, zanim trafisz na czwarty.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={reveal}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60"
            >
              Chcę dołączyć do grupy
            </button>
            <a
              href="#how"
              className="px-8 py-4 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-neutral-200 hover:text-white hover:border-cyan-500/40 hover:bg-white/[0.08] text-sm font-medium transition-all duration-300"
            >
              Jak to działa
            </a>
          </div>

          <a href="#problem" className="inline-flex flex-col items-center gap-3 text-neutral-400 hover:text-cyan-300 transition-colors">
            <span className="text-sm font-medium">Zobacz przed czym chronimy</span>
            <ChevronDown size={20} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section id="problem" className="py-20 px-6 bg-white/[0.03] border-y border-cyan-500/15 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Schemat</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">Trzy sceny, które rozegrały się w Miami w tym tygodniu.</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              Inne kostiumy. Ta sama sztuka. Każdy founder który stracił pięciocyfrową kwotę mówił to samo: <span className="text-cyan-300">„Czułem, że coś jest nie tak."</span>
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.08] hover:border-cyan-500/40 transition-all duration-500 shadow-sm hover:shadow-md hover:shadow-cyan-500/15">
                <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">#{String(i + 1).padStart(2, "0")}</p>
                <h3 className="text-xl font-bold mb-3 text-white">{p.title}</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 max-w-3xl mx-auto text-center space-y-4 text-neutral-300 leading-relaxed">
            <p>A potem zaczyna się druga warstwa. Bank pyta o transakcję. Wspólnik dowiaduje się, że twoje intro zrobiło mu szkodę. Ten sam scammer wraca pod inną twarzą do twojego znajomego i mówi: „polecił mnie Jakub”.</p>
            <p className="text-white font-medium">Pierwsza strata to pieniądze. Druga strata to reputacja, której nie odzyskasz wirtualnym przelewem.</p>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Co dostajesz</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">Co dostajesz po przejściu weryfikacji.</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              Chroń pieniądze, reputację i swoich operatorów przed ludźmi którzy celują w Miami, bo pieniądz jest głośny, a weryfikacja leniwa.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.08] hover:border-cyan-500/40 transition-all duration-500 shadow-sm hover:shadow-md hover:shadow-cyan-500/15">
                <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">{f.label}</p>
                <h3 className="text-2xl font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-neutral-300 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-20 px-6 bg-white/[0.03] border-y border-cyan-500/15 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Jak to działa</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">Weryfikujemy każdego przez 7 dni.</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              Sama otwarta rejestracja pozwala scammerom wejść i zobaczyć kto ich zgłosił. Bez weryfikacji grupa traci sens w tydzień. Dlatego sprawdzamy każdego osobiście.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.n} className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl">
                <p className="text-3xl font-bold text-cyan-400 mb-4 font-mono">{s.n}</p>
                <h3 className="text-xl font-bold mb-3 text-white">{s.title}</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== APPLICATION FORM ===== */}
      <section id="apply" ref={formRef} className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-2xl mx-auto relative">
          {!showForm && !submitted && (
            <div className="text-center">
              <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">Decyzja jest prosta</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-tight">
                Naprawdę chcesz czekać, aż twój pierwszy scam cię tego nauczy?
              </h2>
              <p className="text-neutral-300 mb-8 max-w-xl mx-auto leading-relaxed">
                Każdy tydzień bez weryfikacji to tydzień, w którym kolejny „inwestor” pisze do ciebie z LinkedIna. Średni scam tutaj kosztuje 25-80 tys. dolarów. Aplikuj raz, daj się sprawdzić, miej bazę pod ręką zanim ktoś poda ci wizytówkę.
              </p>
              <p className="text-cyan-300 text-sm font-medium mb-10 max-w-lg mx-auto">
                Albo wpuszczamy cię do grupy zanim trafisz na pierwszy scam, albo poznasz tych ludzi na własnej karcie.
              </p>
              <button
                onClick={reveal}
                className="inline-block px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-base font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60"
              >
                Chcę dołączyć do grupy
              </button>
            </div>
          )}

          {showForm && !submitted && (
            <div className="p-8 md:p-10 rounded-3xl border border-cyan-500/30 bg-white/[0.05] backdrop-blur-xl relative overflow-hidden shadow-xl shadow-cyan-500/15">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-3">Aplikacja</p>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Aplikacja do Scam Alert Miami</h2>
                <p className="text-neutral-300 mb-8 text-sm leading-relaxed">
                  Sprawdzamy każdego osobiście przez 7 dni. Dostaniesz odpowiedź na email — niezależnie od decyzji.
                </p>

                <form onSubmit={submit} className="space-y-4">
                  <Field label="Imię i nazwisko" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                  <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <Field label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} required />
                  <Field label="Firma / projekt" value={form.company} onChange={(v) => setForm({ ...form, company: v })} required />
                  <Field label="Czym się zajmujesz w Miami?" textarea value={form.role} onChange={(v) => setForm({ ...form, role: v })} required />
                  <Field label="Dlaczego mamy cię wpuścić?" textarea value={form.why} onChange={(v) => setForm({ ...form, why: v })} required />

                  {error && (
                    <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-7 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Wysyłam..." : "Wyślij aplikację"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {submitted && (
            <div className="p-10 rounded-3xl border border-cyan-500/40 bg-white/[0.05] backdrop-blur-xl text-center relative overflow-hidden shadow-xl shadow-cyan-500/20">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/25 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <CheckCircle2 size={56} className="mx-auto text-cyan-400 mb-5" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Dziękujemy. Aplikacja przyjęta.</h2>
                <p className="text-neutral-300 leading-relaxed max-w-md mx-auto">
                  Sprawdzamy twoje dane. Odezwiemy się na podany email w ciągu 7 dni — niezależnie od decyzji.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 px-6 bg-white/[0.03] border-y border-cyan-500/15 relative overflow-hidden">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-12">
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">Pytania, które powinieneś zadać.</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <details key={i} className="group p-6 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl open:border-cyan-500/40 transition-all">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-base md:text-lg font-semibold text-white pr-4">{f.q}</span>
                  <ChevronDown size={20} className="text-cyan-400 flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-neutral-300 leading-relaxed mt-4">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LEGAL DISCLAIMER ===== */}
      <section className="py-12 px-6 border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4 text-center">Informacja prawna</p>
          <div className="space-y-3 text-xs text-neutral-400 leading-relaxed">
            <p>
              <strong className="text-neutral-300">Nie jesteśmy agencją raportującą.</strong> Scam Alert Miami nie jest agencją raportującą konsumencko pod amerykańską ustawą Fair Credit Reporting Act (FCRA). Informacje publikowane tutaj NIE mogą być używane do decyzji o zatrudnieniu, kredycie, ubezpieczeniu, mieszkaniu ani innym celu objętym FCRA. Serwis jest wyłącznie edukacyjny i informacyjny.
            </p>
            <p>
              <strong className="text-neutral-300">Treści zgłoszone przez użytkowników.</strong> Raporty odzwierciedlają oświadczenia zgłaszających. Każda zgłoszona osoba lub firma dostaje notyfikację przed publikacją i 14 dni na odpowiedź. Język („zgłoszone incydenty", „rzekome") nie stanowi określenia prawnego. Żadne twierdzenie nie jest składane bez dokumentów sądowych lub podpisanych dowodów.
            </p>
            <p>
              <strong className="text-neutral-300">Dostęp tylko dla zweryfikowanych członków.</strong> Treść nie jest publiczna. Dostęp wymaga aplikacji i ręcznej weryfikacji (7 dni). Pełen Regulamin i Umowa Zgłoszenia (linki wkrótce).
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>Scam Alert Miami &copy; {new Date().getFullYear()} — projekt Jakub Chodakowski</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-cyan-300 transition-colors">jakubchodakowski.com</Link>
            <a href="mailto:hello@jakubchodakowski.com" className="hover:text-cyan-300 transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
}) {
  const base =
    "w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.06] transition-colors";
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-300 mb-2 block">
        {label} {required && <span className="text-cyan-400">*</span>}
      </span>
      {textarea ? (
        <textarea
          rows={3}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base + " resize-y min-h-[80px]"}
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </label>
  );
}
