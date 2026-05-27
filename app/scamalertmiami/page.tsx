"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, CheckCircle2 } from "lucide-react";

const PROBLEMS = [
  {
    title: "Crypto VC in your DMs",
    text: "Polished LinkedIn. \"Family office\" in the bio. Wants 30 minutes to talk about your \"exciting round.\" Two weeks later, $40K is gone and the LinkedIn is deleted.",
  },
  {
    title: "Luxury broker out of Wynwood",
    text: "Shows up to your event in a borrowed Lambo. Pitches off-market deals. The deposit clears. The property was never his. Welcome to Miami real estate.",
  },
  {
    title: "The Pura Vida \"founder\"",
    text: "Coffee in Wynwood. Big vision. Bigger ask. Wants a check, an intro, and your operator. Nothing adds up. By the time you catch on, your reputation already vouched for him.",
  },
];

const FEATURES = [
  {
    label: "Newsletter",
    title: "Weekly scam breakdowns",
    text: "One fresh Miami scam dissected piece by piece: the hook, the trap, what the founder lost. Plus 2-3 new reports from group members.",
  },
  {
    label: "Database",
    title: "Searchable reports",
    text: "Search a name, company, email, or LinkedIn. See if there are reported incidents, with context, evidence, and dates.",
  },
  {
    label: "Reports",
    title: "Report what you saw",
    text: "Got burned, or watched someone else get burned? Submit it with evidence (screenshots, contracts, statements). Verified before publication.",
  },
  {
    label: "Playbook",
    title: "Miami red flag list",
    text: "The patterns that hit founders here: fake VC connects, off-market real estate flips, crypto / Web3 partnerships, visa schemes.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Fill out the form",
    text: "LinkedIn, company, what you do in Miami, why you want in. 90 seconds.",
  },
  {
    n: "02",
    title: "We vet you for 7 days",
    text: "I personally review every application: active LinkedIn, real company, a real reason to be in this room.",
  },
  {
    n: "03",
    title: "You get a decision",
    text: "Pass: you're in the group. Fail: we let you know and that's it. Nobody gets in without vetting.",
  },
];

const FAQS = [
  {
    q: "What if you reject me?",
    a: "We let you know within 7 days. No explanations, vetting is binary. If you don't make it, there's no appeal in this round.",
  },
  {
    q: "Is this legal? Can you really publish names?",
    a: "Access is restricted to vetted members (not the public web). Every report requires evidence (screenshots, contracts, bank statements). Reported parties are notified with a 14-day right of reply before publication. Language: \"reported incidents,\" \"alleged,\" never \"confirmed scammer\" unless we have court documents.",
  },
  {
    q: "Is this a background check service?",
    a: "No. This is NOT a consumer reporting agency under the U.S. Fair Credit Reporting Act (FCRA). Information here may not be used for employment, credit, insurance, housing, or any other FCRA-covered purpose. It is strictly educational and informational.",
  },
  {
    q: "What if someone reports me unfairly?",
    a: "Every reported party is notified before publication and gets 14 days to respond. You can submit counter-evidence, request removal, or contest the claim. Reports without verifiable evidence are rejected.",
  },
  {
    q: "Are you building a public \"scammer list\"?",
    a: "No. Public lists are magnets for defamation lawsuits. This is members-only, evidence-based, with a right of reply built in. The goal: protect founders, not put up a billboard.",
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
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentNewsletter, setConsentNewsletter] = useState(false);

  function reveal() {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!consentPrivacy) {
      setError("You must accept the Terms of Service and Privacy Policy to submit.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/scamalertmiami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consentNewsletter, consentPrivacy }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error("send failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again or email hello@jakubchodakowski.com");
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
            I want in
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-14 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[36rem] h-[36rem] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-5">For founders & operators in Miami</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-[1.05]">
            Before you shake the hand of that Wynwood "investor", check if he hasn't done the same to three others.
          </h1>
          <p className="text-xl md:text-2xl font-medium mb-6 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Closed people-vetting group for Miami. 7-day vetting on the way in.
          </p>
          <p className="text-neutral-300 max-w-xl mx-auto mb-10 leading-relaxed text-base">
            Crypto "VCs" in the DMs. Off-market flips out of borrowed Lambos. A "partner" who needs your intro and your operator. Miami is their hunting ground, and you're fresh meat. Get in the group, pull up the database of reported names, read the weekly scam breakdown, and run through the Miami red flag list before you meet the fourth one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={reveal}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60"
            >
              I want in
            </button>
            <a
              href="#how"
              className="px-8 py-4 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-neutral-200 hover:text-white hover:border-cyan-500/40 hover:bg-white/[0.08] text-sm font-medium transition-all duration-300"
            >
              How it works
            </a>
          </div>

          <a href="#problem" className="inline-flex flex-col items-center gap-3 text-neutral-400 hover:text-cyan-300 transition-colors">
            <span className="text-sm font-medium">See what we protect you from</span>
            <ChevronDown size={20} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section id="problem" className="py-20 px-6 bg-white/[0.03] border-y border-cyan-500/15 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">The Pattern</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">Three scenes that played out in Miami this week.</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              Different costumes. Same play. Every founder who lost a five-figure check said the same thing: <span className="text-cyan-300">"I knew something was off."</span>
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
            <p>Then the second layer kicks in. Your bank asks about the wire. Your partner finds out your intro cost him. The same scammer comes back, new face, to your buddy and says, "Jakub sent me."</p>
            <p className="text-white font-medium">The first loss is money. The second loss is a reputation you can't wire back.</p>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">What you get</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">What you get once you're vetted in.</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              Protect your money, your reputation, and your operators from the people who target Miami because the money is loud and the vetting is lazy.
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
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">We vet every applicant for 7 days.</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              Open signup lets scammers walk right in and see who reported them. Without vetting, the group dies in a week. So we check every person by hand.
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
              <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">The choice is simple</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-tight">
                You really want to wait until your first scam teaches you this?
              </h2>
              <p className="text-neutral-300 mb-8 max-w-xl mx-auto leading-relaxed">
                Every week without vetting is another week where some "investor" slides into your DMs. The average scam here runs $25K-$80K. Apply once, get vetted, and have the database in your pocket before anyone hands you a business card.
              </p>
              <p className="text-cyan-300 text-sm font-medium mb-10 max-w-lg mx-auto">
                Either we get you in the group before your first scam, or you meet these people on your own dime.
              </p>
              <button
                onClick={reveal}
                className="inline-block px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-base font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60"
              >
                I want in
              </button>
            </div>
          )}

          {showForm && !submitted && (
            <div className="p-8 md:p-10 rounded-3xl border border-cyan-500/30 bg-white/[0.05] backdrop-blur-xl relative overflow-hidden shadow-xl shadow-cyan-500/15">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-3">Application</p>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Apply to Scam Alert Miami</h2>
                <p className="text-neutral-300 mb-8 text-sm leading-relaxed">
                  We review every application by hand over 7 days. You'll get an answer at the email you provided, regardless of the outcome.
                </p>

                <form onSubmit={submit} className="space-y-4">
                  <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                  <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <Field label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} required />
                  <Field label="Company / project" value={form.company} onChange={(v) => setForm({ ...form, company: v })} required />
                  <Field label="What do you do in Miami?" textarea value={form.role} onChange={(v) => setForm({ ...form, role: v })} required />
                  <Field label="Why should we let you in?" textarea value={form.why} onChange={(v) => setForm({ ...form, why: v })} required />

                  <div className="pt-2 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentPrivacy}
                        onChange={(e) => setConsentPrivacy(e.target.checked)}
                        required
                        className="mt-1 w-4 h-4 rounded border border-white/20 bg-white/5 accent-cyan-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-xs text-neutral-300 leading-relaxed group-hover:text-neutral-200 transition-colors">
                        I've read and agree to the <Link href="/scamalertmiami/terms-of-service" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Terms of Service</Link> and <Link href="/scamalertmiami/privacy-policy" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Privacy Policy</Link>. <span className="text-cyan-400">*</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentNewsletter}
                        onChange={(e) => setConsentNewsletter(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border border-white/20 bg-white/5 accent-cyan-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-xs text-neutral-300 leading-relaxed group-hover:text-neutral-200 transition-colors">
                        I'd like to receive the Scam Alert Miami newsletter (weekly Miami scam breakdowns + member reports). Optional, opt-out anytime via "unsubscribe" in any email.
                      </span>
                    </label>
                  </div>

                  {error && (
                    <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !consentPrivacy}
                    className="w-full px-7 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? "Sending..." : "Submit application"}
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
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Thanks. Application received.</h2>
                <p className="text-neutral-300 leading-relaxed max-w-md mx-auto">
                  We're reviewing your info. We'll get back to you on the email you provided within 7 days, regardless of the outcome.
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
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-white">Questions you should be asking.</h2>
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
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4 text-center">Legal</p>
          <div className="space-y-3 text-xs text-neutral-400 leading-relaxed">
            <p>
              <strong className="text-neutral-300">We are not a consumer reporting agency.</strong> Scam Alert Miami is not a consumer reporting agency under the U.S. Fair Credit Reporting Act (FCRA). Information published here may NOT be used for decisions about employment, credit, insurance, housing, or any other purpose covered by the FCRA. The service is strictly educational and informational.
            </p>
            <p>
              <strong className="text-neutral-300">User-submitted content.</strong> Reports reflect the statements of the people who submit them. Every reported person or company is notified before publication and gets 14 days to respond. Our language ("reported incidents," "alleged") is not a legal determination. No claim is made without court documents or signed evidence.
            </p>
            <p>
              <strong className="text-neutral-300">Access for vetted members only.</strong> The content is not public. Access requires an application and a manual 7-day review. Full documents: <Link href="/scamalertmiami/terms-of-service" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Terms of Service</Link>, <Link href="/scamalertmiami/submission-agreement" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Submission Agreement</Link>, <Link href="/scamalertmiami/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Privacy Policy</Link>, <Link href="/scamalertmiami/disclaimer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Legal Disclaimer</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>Scam Alert Miami &copy; {new Date().getFullYear()} by Jakub Chodakowski</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/scamalertmiami/terms-of-service" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
            <Link href="/scamalertmiami/submission-agreement" className="hover:text-cyan-300 transition-colors">Submission Agreement</Link>
            <Link href="/scamalertmiami/privacy-policy" className="hover:text-cyan-300 transition-colors">Privacy Policy</Link>
            <Link href="/scamalertmiami/disclaimer" className="hover:text-cyan-300 transition-colors">Legal Disclaimer</Link>
            <Link href="/" className="hover:text-cyan-300 transition-colors">jakubchodakowski.com</Link>
            <a href="mailto:hello@jakubchodakowski.com" className="hover:text-cyan-300 transition-colors">Contact</a>
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
