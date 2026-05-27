"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, X as XIcon } from "lucide-react";

type Person = {
  name: string;
  linkedin: string;
  company: string;
  email: string;
  context: string;
};

const emptyPerson = (): Person => ({
  name: "",
  linkedin: "",
  company: "",
  email: "",
  context: "",
});

export default function CheckPeople() {
  const searchParams = useSearchParams();
  const memberToken = searchParams?.get("t") ?? "";

  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [people, setPeople] = useState<Person[]>([emptyPerson()]);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updatePerson(idx: number, patch: Partial<Person>) {
    setPeople((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function addPerson() {
    if (people.length >= 10) return;
    setPeople((prev) => [...prev, emptyPerson()]);
  }

  function removePerson(idx: number) {
    if (people.length <= 1) return;
    setPeople((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!consent) {
      setError("You must confirm the legitimate business interest declaration.");
      return;
    }
    if (people.length < 1 || people.length > 10) {
      setError("Please submit between 1 and 10 people.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/scamalertmiami/check-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName,
          requesterEmail,
          people,
          consentBusinessInterest: true,
          submittedAt: new Date().toISOString(),
          memberToken,
        }),
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

  const submitDisabled = submitting || !consent || people.length < 1 || people.length > 10;

  return (
    <main className="min-h-screen">
      {/* ===== Top bar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-[#0a1218]/85 via-[#0a1218]/55 to-transparent">
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/25">JC</span>
            <span className="text-xs text-neutral-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">jakubchodakowski.com</span>
          </Link>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-300 uppercase tracking-widest hidden md:inline pointer-events-none">Check people</span>
          <Link
            href="/scamalertmiami"
            className="relative z-10 text-xs font-medium px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-neutral-200 hover:text-white hover:border-cyan-500/40 hover:bg-white/[0.08] transition-all"
          >
            Back to site
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="pt-32 pb-10 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-5">Members area</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-[1.05]">
            Check people against the Scam Alert Miami database.
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto leading-relaxed text-base">
            Up to 10 people or companies per 30-day membership period. We email you back individually for each entry: clean / reported / confirmed (with context).
          </p>
        </div>
      </section>

      {/* ===== FORM ===== */}
      <section className="pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-2xl mx-auto relative">
          {!submitted && (
            <>
              {/* Members notice */}
              <div className="mb-6 p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] backdrop-blur-xl">
                <p className="text-sm text-neutral-200 leading-relaxed">
                  <span className="font-semibold text-cyan-300">Members-only page.</span>{" "}
                  If you reached this without being verified, email{" "}
                  <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                    hello@jakubchodakowski.com
                  </a>
                  .
                </p>
              </div>

              <form
                onSubmit={submit}
                className="p-8 md:p-10 rounded-3xl border border-cyan-500/30 bg-white/[0.05] backdrop-blur-xl relative overflow-hidden shadow-xl shadow-cyan-500/15"
              >
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="relative space-y-5">
                  <div>
                    <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-3">Your details</p>
                    <div className="space-y-4">
                      <Field label="Your full name" value={requesterName} onChange={setRequesterName} required />
                      <Field
                        label="Your email (for the reply)"
                        type="email"
                        value={requesterEmail}
                        onChange={setRequesterEmail}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest">People to check (1-10)</p>
                      <span className="text-xs font-mono text-neutral-400">{people.length} / 10 people</span>
                    </div>

                    <div className="space-y-5">
                      {people.map((p, i) => (
                        <div
                          key={i}
                          className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md relative"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-cyan-300">Person #{i + 1}</p>
                            {people.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePerson(i)}
                                aria-label={`Remove person ${i + 1}`}
                                className="w-7 h-7 flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-neutral-300 hover:text-white hover:border-red-400/40 hover:bg-red-500/10 transition-colors"
                              >
                                <XIcon size={14} />
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <Field
                              label="Full name"
                              value={p.name}
                              onChange={(v) => updatePerson(i, { name: v })}
                              required
                            />
                            <Field
                              label="LinkedIn URL"
                              type="url"
                              placeholder="https://linkedin.com/in/..."
                              value={p.linkedin}
                              onChange={(v) => updatePerson(i, { linkedin: v })}
                            />
                            <Field
                              label="Company / project"
                              value={p.company}
                              onChange={(v) => updatePerson(i, { company: v })}
                            />
                            <Field
                              label="Email (if known)"
                              type="email"
                              value={p.email}
                              onChange={(v) => updatePerson(i, { email: v })}
                            />
                            <Field
                              label="Why are you checking this person? (e.g. potential investor, partner, vendor)"
                              textarea
                              value={p.context}
                              onChange={(v) => updatePerson(i, { context: v })}
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {people.length < 10 && (
                      <button
                        type="button"
                        onClick={addPerson}
                        className="mt-5 w-full px-5 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.06] text-cyan-300 text-sm font-medium hover:bg-cyan-500/[0.12] hover:border-cyan-500/50 transition-colors"
                      >
                        + Add another person
                      </button>
                    )}
                  </div>

                  {/* Legitimate business interest disclosure */}
                  <div className="mt-2 p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] backdrop-blur-xl">
                    <p className="text-sm text-neutral-200 leading-relaxed">
                      <span className="font-semibold text-cyan-300">Why we ask for context:</span>{" "}
                      Under GDPR you may process personal data of third parties (names, LinkedIn URLs, etc.) only on a lawful basis. By checking the box below you declare that your reason to check these people is a legitimate business interest (potential client, investor, partner, vendor, employee, counterparty) and not curiosity, harassment, or research about random individuals.
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        required
                        className="mt-1 w-4 h-4 rounded border border-white/20 bg-white/5 accent-cyan-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-xs text-neutral-300 leading-relaxed group-hover:text-neutral-200 transition-colors">
                        I declare that I have a legitimate business interest in checking these people (potential business relationship, contract, or transaction). I understand misuse of this service is grounds for termination per the{" "}
                        <Link
                          href="/scamalertmiami/terms-of-service"
                          target="_blank"
                          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                        >
                          Terms of Service
                        </Link>
                        . <span className="text-cyan-400">*</span>
                      </span>
                    </label>
                  </div>

                  {error && (
                    <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitDisabled}
                    className="w-full px-7 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? "Sending..." : "Submit for checking"}
                  </button>
                </div>
              </form>
            </>
          )}

          {submitted && (
            <div className="p-10 rounded-3xl border border-cyan-500/40 bg-white/[0.05] backdrop-blur-xl text-center relative overflow-hidden shadow-xl shadow-cyan-500/20">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/25 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <CheckCircle2 size={56} className="mx-auto text-cyan-400 mb-5" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Submitted.</h2>
                <p className="text-neutral-300 leading-relaxed max-w-md mx-auto">
                  We'll email you individual results for each person within 7 business days at the email you provided.
                </p>
              </div>
            </div>
          )}
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
