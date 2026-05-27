import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Disclaimer — Scam Alert Miami",
  description:
    "Legal disclaimer for Scam Alert Miami. For informational and educational purposes only. NOT a consumer reporting agency under the FCRA.",
};

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "1",
    title: "1. Informational and educational purposes",
    body: (
      <>
        <p>
          The content published on Scam Alert Miami (newsletter, reports, database entries, articles, red-flag lists, and any other materials, collectively the <strong className="text-white">&ldquo;Content&rdquo;</strong>) is made available solely for <strong className="text-white">informational and educational purposes</strong>.
        </p>
        <p>The Content does NOT constitute:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>legal advice</li>
          <li>financial, investment, or tax advice</li>
          <li>professional due diligence</li>
          <li>a background check report</li>
          <li>a consumer report</li>
        </ul>
        <p>
          Before making any business, legal, financial, or hiring decision, consult a licensed attorney, financial advisor, or other appropriate professional.
        </p>
      </>
    ),
  },
  {
    id: "2",
    title: "2. We are NOT a consumer reporting agency (FCRA)",
    body: (
      <>
        <p>
          Scam Alert Miami is <strong className="text-white">NOT a consumer reporting agency</strong> within the meaning of the U.S. federal <em className="not-italic text-white">Fair Credit Reporting Act</em>, 15 U.S.C. § 1681 et seq. (&ldquo;FCRA&rdquo;). Information provided by the site is <strong className="text-white">NOT a consumer report</strong> under the FCRA.
        </p>
        <p>
          <strong className="text-white">You may not use the site or any information obtained from it for any of the following purposes:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>employment decisions (hiring, firing, promotion, retention)</li>
          <li>tenant or housing applicant screening</li>
          <li>credit eligibility decisions</li>
          <li>insurance underwriting</li>
          <li>scholarship or educational eligibility decisions</li>
          <li>government license or benefit decisions</li>
          <li>any other purpose covered by the FCRA or comparable state laws (including the California <em className="not-italic text-white">Investigative Consumer Reporting Agencies Act</em>, CCRAA)</li>
        </ul>
        <p>
          Any use of the site for a prohibited purpose is at your own risk. You agree to indemnify and hold us harmless from all claims, damages, penalties, and legal costs arising from such use.
        </p>
      </>
    ),
  },
  {
    id: "3",
    title: "3. User-submitted reports",
    body: (
      <>
        <p>
          A significant portion of the Content consists of <strong className="text-white">reports submitted by users</strong> of the site (&ldquo;Submissions&rdquo;). They reflect the personal accounts, opinions, and statements of the reporters.
        </p>
        <p>Submissions:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li><strong className="text-white">are NOT verified court rulings</strong></li>
          <li><strong className="text-white">do NOT constitute conclusive proof</strong> of guilt or unlawful conduct</li>
          <li><strong className="text-white">are NOT statements of fact</strong> made by Scam Alert Miami</li>
        </ul>
        <p>
          We require supporting documentation (screenshots, contracts, bank statements) before publishing a Submission, but we <strong className="text-white">do not independently verify</strong> the truth, accuracy, or completeness of every piece of information. Words like &ldquo;reported,&rdquo; &ldquo;alleged,&rdquo; or &ldquo;claimed&rdquo; reflect only the reporter&rsquo;s account and should be read as such.
        </p>
        <p>
          If you are the subject of a Submission and believe it is false, defamatory, or unlawful, email <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a> to request review, correction, or removal under our takedown procedure.
        </p>
      </>
    ),
  },
  {
    id: "4",
    title: "4. No warranties",
    body: (
      <>
        <p>
          The site and the Content are provided <strong className="text-white">&ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE,&rdquo;</strong> without any warranties of any kind, express or implied, including warranties of accuracy, completeness, merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p>We do not guarantee that:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>any person or company listed in the database is or is not engaged in fraudulent activity</li>
          <li>the site will identify every threat to you or your business</li>
          <li>the Content is current, accurate, or free of errors</li>
        </ul>
      </>
    ),
  },
  {
    id: "5",
    title: "5. Your decisions are your responsibility",
    body: (
      <>
        <p>
          You are solely responsible for every decision you make based on Content from the site, in particular:
        </p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>entering into or declining a business relationship</li>
          <li>making or withholding an investment</li>
          <li>taking or abandoning legal action</li>
          <li>publishing your own statements about third parties</li>
        </ul>
        <p>
          <strong className="text-white">We are not liable</strong> for any loss, damage, or liability arising from your use of the site or your reliance on the Content.
        </p>
      </>
    ),
  },
  {
    id: "6",
    title: "6. Third-party information",
    body: (
      <p>
        The site may reference or link to third-party websites, services, and content. We do not endorse, control, or take responsibility for external materials. Use of third-party services is at your own risk and subject to those parties&rsquo; terms.
      </p>
    ),
  },
  {
    id: "7",
    title: "7. Right to edit or remove Content",
    body: (
      <>
        <p>We reserve the right, at our sole discretion and without notice, to:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>edit, update, or remove any Content at any time</li>
          <li>suspend or terminate access to the site</li>
          <li>reject, remove, or anonymize any Submission</li>
        </ul>
      </>
    ),
  },
  {
    id: "8",
    title: "8. Governing law and jurisdiction",
    body: (
      <>
        <p>
          The site is operated from the territory of the <strong className="text-white">Republic of Poland</strong> by a Polish entity (a sole proprietorship registered in CEIDG). This Legal Disclaimer and any legal relationship arising from your use of the site are governed by <strong className="text-white">Polish law</strong>.
        </p>
        <p>
          Any dispute arising from your use of the site shall be resolved by the <strong className="text-white">Polish court having jurisdiction over the Service Provider&rsquo;s registered address</strong> (Kołobrzeg), unless mandatory consumer protection law provides otherwise.
        </p>
        <p>
          For users who are consumers in the European Union, the GDPR and consumer protection laws of the country of residence also apply to the extent required by mandatory law.
        </p>
        <p>
          References in this Legal Disclaimer to U.S. statutes (FCRA, CCRAA) are for informational purposes only — they mean that the site <strong className="text-white">is NOT a consumer reporting agency</strong> under those statutes and may not be used as such by U.S. users.
        </p>
        <p>
          Mandatory consumer protection laws of your country or US state of residence may also apply where required by law.
        </p>
      </>
    ),
  },
  {
    id: "9",
    title: "9. Contact",
    body: (
      <>
        <p>Questions, takedown requests, corrections:</p>
        <ul className="list-none pl-0 space-y-1 text-neutral-200">
          <li><a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a></li>
          <li>Jakub Chodakowski (sole proprietorship)</li>
          <li>ul. Stanisława Koniecpolskiego 12a/7, 78-100 Kołobrzeg, Poland</li>
          <li>NIP (Polish tax ID): 6711845485 · REGON: 388300543</li>
        </ul>
      </>
    ),
  },
];

export default function ScamAlertDisclaimerEN() {
  return (
    <main className="min-h-screen">
      {/* ===== Top bar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-[#0a1218]/85 via-[#0a1218]/55 to-transparent">
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/25">JC</span>
            <span className="text-xs text-neutral-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">jakubchodakowski.com</span>
          </Link>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-300 uppercase tracking-widest hidden md:inline pointer-events-none">Legal Disclaimer</span>
          <Link
            href="/scamalertmiami"
            className="relative z-10 text-xs font-medium px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-neutral-200 hover:text-white hover:border-cyan-500/40 hover:bg-white/[0.08] transition-all"
          >
            Back to site
          </Link>
        </div>
      </nav>

      {/* ===== HEADER ===== */}
      <section className="pt-32 pb-12 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">Scam Alert Miami</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5 bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-[1.05]">
            Legal Disclaimer
          </h1>
          <p className="text-neutral-400 text-sm">
            Last updated: <span className="text-neutral-300">May 27, 2026</span> · Effective: <span className="text-neutral-300">May 27, 2026</span>
          </p>
          <p className="text-neutral-300 leading-relaxed mt-6">
            Please read this Legal Disclaimer carefully before using Scam Alert Miami (the &ldquo;site&rdquo;), operated by <strong className="text-white">Jakub Chodakowski</strong>, a sole proprietor based in Kołobrzeg, Poland (NIP 6711845485) (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;). By using the site, you accept the terms of this Legal Disclaimer.
          </p>
        </div>
      </section>

      {/* ===== SECTIONS ===== */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {SECTIONS.map((s) => (
            <article
              key={s.id}
              id={`section-${s.id}`}
              className="p-7 md:p-8 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-5 text-white tracking-tight">{s.title}</h2>
              <div className="space-y-4 text-neutral-300 leading-relaxed text-[15px]">
                {s.body}
              </div>
            </article>
          ))}

          <div className="p-7 md:p-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.04] backdrop-blur-xl text-center">
            <p className="text-white font-medium leading-relaxed">
              By using Scam Alert Miami, you acknowledge that you have read, understood, and accepted this Legal Disclaimer.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>Scam Alert Miami &copy; {new Date().getFullYear()} — a Jakub Chodakowski project</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/scamalertmiami" className="hover:text-cyan-300 transition-colors">Scam Alert Miami</Link>
            <Link href="/scamalertmiami/terms-of-service" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
            <Link href="/scamalertmiami/submission-agreement" className="hover:text-cyan-300 transition-colors">Submission Agreement</Link>
            <Link href="/scamalertmiami/privacy-policy" className="hover:text-cyan-300 transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-cyan-300 transition-colors">jakubchodakowski.com</Link>
            <a href="mailto:hello@jakubchodakowski.com" className="hover:text-cyan-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
