"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";

const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 3;

type FilePayload = {
  name: string;
  type: string;
  size: number;
  base64: string;
};

function formatBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      // strip data URI prefix
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function ReportScam() {
  const searchParams = useSearchParams();
  const memberToken = searchParams?.get("t") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    reporterName: "",
    reporterEmail: "",
    scammerName: "",
    scammerLinkedin: "",
    scammerCompany: "",
    scammerOther: "",
    incidentDate: "",
    lossAmount: "",
    description: "",
    evidenceLinks: "",
  });

  const [files, setFiles] = useState<FilePayload[]>([]);
  const [consentSA, setConsentSA] = useState(false);
  const [publishAnonymously, setPublishAnonymously] = useState(true);

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const overLimit = totalBytes > MAX_TOTAL_BYTES;

  async function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;

    const incoming: FilePayload[] = [];
    for (const f of Array.from(picked)) {
      if (files.length + incoming.length >= MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} files.`);
        break;
      }
      try {
        const base64 = await fileToBase64(f);
        incoming.push({ name: f.name, type: f.type || "application/octet-stream", size: f.size, base64 });
      } catch {
        setError("Could not read one of the selected files. Try again.");
      }
    }

    const next = [...files, ...incoming];
    setFiles(next);
    // reset the input so the same file can be re-picked after removal
    e.target.value = "";

    const nextTotal = next.reduce((s, f) => s + f.size, 0);
    if (nextTotal > MAX_TOTAL_BYTES) {
      setError(`Total attachment size exceeds 10 MB (currently ${formatBytes(nextTotal)}). Remove a file.`);
    }
  }

  function removeFile(idx: number) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    const nextTotal = next.reduce((s, f) => s + f.size, 0);
    if (nextTotal <= MAX_TOTAL_BYTES) setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!consentSA) {
      setError("You must accept the Submission Agreement to submit a report.");
      return;
    }
    if (overLimit) {
      setError(`Total attachment size exceeds 10 MB (currently ${formatBytes(totalBytes)}). Remove a file.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scamalertmiami/report-scam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          files,
          consentSA: true,
          publishAnonymously,
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

  return (
    <main className="min-h-screen">
      {/* ===== Top bar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-[#0a1218]/85 via-[#0a1218]/55 to-transparent">
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/25">JC</span>
            <span className="text-xs text-neutral-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">jakubchodakowski.com</span>
          </Link>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-300 uppercase tracking-widest hidden md:inline pointer-events-none">Report a scam</span>
          <Link
            href="/scamalertmiami"
            className="relative z-10 text-xs font-medium px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-neutral-200 hover:text-white hover:border-cyan-500/40 hover:bg-white/[0.08] transition-all"
          >
            Back to site
          </Link>
        </div>
      </nav>

      {/* ===== HEADER ===== */}
      <section className="pt-32 pb-10 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">Scam Alert Miami</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-[1.05]">
            Report a scam to the Scam Alert Miami database.
          </h1>
          <p className="text-neutral-300 leading-relaxed text-base md:text-lg">
            Members only. Every report goes through our 3-stage review (Operator vetting, Reported party&rsquo;s 14-day right of reply, Publish or reject).
          </p>
        </div>
      </section>

      {/* ===== NOTICE ===== */}
      <section className="px-6 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.05] backdrop-blur-xl">
            <p className="text-sm text-cyan-100 leading-relaxed">
              <strong className="text-white">Members-only page.</strong> If you reached this without being verified, email{" "}
              <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">
                hello@jakubchodakowski.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ===== FORM ===== */}
      <section className="pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          {!submitted && (
            <div className="p-8 md:p-10 rounded-3xl border border-cyan-500/30 bg-white/[0.05] backdrop-blur-xl relative overflow-hidden shadow-xl shadow-cyan-500/15">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-3">Report</p>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Submit a scam report</h2>
                <p className="text-neutral-300 mb-8 text-sm leading-relaxed">
                  Be specific. The more concrete the timeline and evidence, the faster we can review and decide.
                </p>

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      label="Your full name"
                      value={form.reporterName}
                      onChange={(v) => setForm({ ...form, reporterName: v })}
                      required
                    />
                    <Field
                      label="Your email (for follow-up)"
                      type="email"
                      value={form.reporterEmail}
                      onChange={(v) => setForm({ ...form, reporterEmail: v })}
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Reported party</p>
                  </div>

                  <Field
                    label="Reported party name (person or company)"
                    value={form.scammerName}
                    onChange={(v) => setForm({ ...form, scammerName: v })}
                    required
                  />
                  <Field
                    label="Reported party LinkedIn URL"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={form.scammerLinkedin}
                    onChange={(v) => setForm({ ...form, scammerLinkedin: v })}
                  />
                  <Field
                    label="Reported party company / website"
                    value={form.scammerCompany}
                    onChange={(v) => setForm({ ...form, scammerCompany: v })}
                  />
                  <Field
                    label="Other identifiers (email, phone, handles, etc.)"
                    textarea
                    value={form.scammerOther}
                    onChange={(v) => setForm({ ...form, scammerOther: v })}
                  />

                  <div className="pt-2">
                    <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">The incident</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      label="When did this happen?"
                      type="date"
                      value={form.incidentDate}
                      onChange={(v) => setForm({ ...form, incidentDate: v })}
                      required
                    />
                    <Field
                      label="Estimated financial loss (e.g. $25,000 or 'reputation only')"
                      value={form.lossAmount}
                      onChange={(v) => setForm({ ...form, lossAmount: v })}
                    />
                  </div>

                  <Field
                    label="What happened? Be specific, hook, trap, timeline, outcome."
                    textarea
                    value={form.description}
                    onChange={(v) => setForm({ ...form, description: v })}
                    required
                  />

                  <Field
                    label="Evidence URLs (Google Drive / Dropbox links, public posts, court records). Paste links separated by new lines."
                    textarea
                    value={form.evidenceLinks}
                    onChange={(v) => setForm({ ...form, evidenceLinks: v })}
                  />

                  {/* File uploads */}
                  <div className="pt-2">
                    <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Evidence files</p>
                    <label className="block">
                      <span className="text-xs font-medium text-neutral-300 mb-2 block">
                        Upload up to 3 files (images, PDF, TXT, EML). Max 10 MB combined.
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.txt,.eml"
                        onChange={onFilesChange}
                        className="block w-full text-xs text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-cyan-500/15 file:text-cyan-200 hover:file:bg-cyan-500/25 file:cursor-pointer cursor-pointer"
                      />
                    </label>

                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {files.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04]"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">{f.name}</p>
                              <p className="text-xs text-neutral-400">{formatBytes(f.size)} &middot; {f.type || "unknown"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="flex-shrink-0 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                              aria-label="Remove file"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <p className={"text-xs " + (overLimit ? "text-red-300" : "text-neutral-400")}>
                          Total: {formatBytes(totalBytes)} / 10 MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Consents */}
                  <div className="pt-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentSA}
                        onChange={(e) => setConsentSA(e.target.checked)}
                        required
                        className="mt-1 w-4 h-4 rounded border border-white/20 bg-white/5 accent-cyan-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-xs text-neutral-300 leading-relaxed group-hover:text-neutral-200 transition-colors">
                        I have read and accept the{" "}
                        <Link
                          href="/scamalertmiami/submission-agreement"
                          target="_blank"
                          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                        >
                          Submission Agreement
                        </Link>{" "}
                        and confirm that this report is truthful, evidence-backed, and submitted in good faith.{" "}
                        <span className="text-cyan-400">*</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={publishAnonymously}
                        onChange={(e) => setPublishAnonymously(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border border-white/20 bg-white/5 accent-cyan-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-xs text-neutral-300 leading-relaxed group-hover:text-neutral-200 transition-colors">
                        Publish my report anonymously (default: yes, I am not named publicly; only the Operator knows my identity).
                      </span>
                    </label>
                  </div>

                  {error && (
                    <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !consentSA || overLimit}
                    className="w-full px-7 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? "Sending..." : "Submit report"}
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
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Report submitted.</h2>
                <p className="text-neutral-300 leading-relaxed max-w-md mx-auto">
                  We&rsquo;ll review within 14 days and email you the preliminary decision (accepted for further review or rejected).
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
            <Link href="/scamalertmiami" className="hover:text-cyan-300 transition-colors">Scam Alert Miami</Link>
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
          rows={4}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base + " resize-y min-h-[100px]"}
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
