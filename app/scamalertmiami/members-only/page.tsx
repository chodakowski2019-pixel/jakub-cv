import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Members only — Scam Alert Miami",
  description:
    "This page is restricted to paying Scam Alert Miami members. If you are a member and reached this page in error, contact support.",
  robots: { index: false, follow: false },
};

export default function MembersOnly() {
  return (
    <main className="min-h-screen">
      {/* ===== Top bar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-[#0a1218]/85 via-[#0a1218]/55 to-transparent">
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/25">JC</span>
            <span className="text-xs text-neutral-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">jakubchodakowski.com</span>
          </Link>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-300 uppercase tracking-widest hidden md:inline pointer-events-none">Members only</span>
          <Link
            href="/scamalertmiami"
            className="relative z-10 text-xs font-medium px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-neutral-200 hover:text-white hover:border-cyan-500/40 hover:bg-white/[0.08] transition-all"
          >
            Back to site
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-14 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-xl mx-auto text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/15 border border-cyan-500/30 mb-8">
            <Lock size={28} className="text-cyan-400" />
          </div>

          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">Restricted area</p>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-[1.05]">
            This page is for paying members.
          </h1>

          <p className="text-neutral-300 mb-8 leading-relaxed">
            Member tools (report a scam, check people) are available only to vetted, paying members of Scam Alert Miami. Members receive a personal access link by email after their application is approved and payment is processed.
          </p>

          <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl text-left mb-8">
            <p className="text-sm font-semibold text-white mb-3">If you ARE a paying member:</p>
            <ul className="text-sm text-neutral-300 space-y-2 leading-relaxed">
              <li>Use the personal link from your welcome email (it includes your access token, e.g. <code className="text-cyan-300 text-xs">?t=...</code>).</li>
              <li>Lost the link or token expired? Email <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a> from the address you used at signup.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.04] backdrop-blur-xl text-left mb-10">
            <p className="text-sm font-semibold text-white mb-3">Not a member yet?</p>
            <p className="text-sm text-neutral-300 mb-4 leading-relaxed">
              Apply for vetting (7-day review). Once accepted, you can purchase 30-day access for $50.
            </p>
            <Link
              href="/scamalertmiami"
              className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60"
            >
              Apply to join
            </Link>
          </div>

          <Link href="/scamalertmiami" className="text-sm text-neutral-400 hover:text-cyan-300 transition-colors">
            ← Back to Scam Alert Miami
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>Scam Alert Miami &copy; {new Date().getFullYear()} — by Jakub Chodakowski</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/scamalertmiami" className="hover:text-cyan-300 transition-colors">Scam Alert Miami</Link>
            <Link href="/scamalertmiami/terms-of-service" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
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
