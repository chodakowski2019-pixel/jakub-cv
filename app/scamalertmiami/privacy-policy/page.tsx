import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Scam Alert Miami",
  description:
    "Privacy Policy for Scam Alert Miami. Data Controller: Jakub Chodakowski (sole proprietorship). GDPR and CCPA/CPRA compliant.",
};

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "1",
    title: "1. Who is the Controller of your data",
    body: (
      <>
        <p>The controller of your personal data is:</p>
        <ul className="list-none pl-0 space-y-1 text-neutral-200">
          <li><strong className="text-white">Jakub Chodakowski</strong></li>
          <li>sole proprietorship registered in the Polish CEIDG business register</li>
          <li>ul. Stanisława Koniecpolskiego 12a/7, 78-100 Kołobrzeg, Poland</li>
          <li>NIP: 6711845485 · REGON: 388300543 (Polish business IDs)</li>
          <li>Email: <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a></li>
        </ul>
        <p>
          For any matter regarding your personal data (questions, access requests, deletion, objections), please email the address above.
        </p>
      </>
    ),
  },
  {
    id: "2",
    title: "2. What data we collect",
    body: (
      <>
        <p>We only collect the data you provide yourself in the application form:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>first and last name</li>
          <li>email address</li>
          <li>LinkedIn profile URL</li>
          <li>company / project name</li>
          <li>description of your Miami business</li>
          <li>reason for wanting to join the group</li>
        </ul>
        <p>
          In addition, when you use the site, basic technical data (IP address, browser type, visit time) is automatically collected by our hosting provider for security and server log analysis.
        </p>
        <p>
          <strong className="text-white">We do not collect</strong> sensitive data (health, sexual orientation, political views, religion). We do not use analytics or marketing cookies. We do not use Google Analytics, Meta Pixel, or similar tools.
        </p>
      </>
    ),
  },
  {
    id: "3",
    title: "3. Why we collect data and on what legal basis",
    body: (
      <>
        <p>We process your data for the following purposes:</p>

        <div className="space-y-4 mt-4">
          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">a) Reviewing your application to the Scam Alert Miami group</p>
            <p className="text-sm text-neutral-400 mb-2"><strong className="text-neutral-300">Legal basis:</strong> Art. 6(1)(b) GDPR — steps taken at your request before entering into a contract.</p>
            <p className="text-sm">We manually review your LinkedIn, company, and business description to decide whether you meet the membership criteria.</p>
          </div>

          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">b) Communicating with you about your application and (after acceptance) providing the service</p>
            <p className="text-sm text-neutral-400 mb-2"><strong className="text-neutral-300">Legal basis:</strong> Art. 6(1)(b) GDPR — performance of a contract.</p>
            <p className="text-sm">We send you our decision on your application, access credentials, and handle your membership.</p>
          </div>

          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">c) Sending the newsletter</p>
            <p className="text-sm text-neutral-400 mb-2"><strong className="text-neutral-300">Legal basis:</strong> Art. 6(1)(a) GDPR — your voluntary consent (checkbox in the form), and Article 10 of the Polish Act on Provision of Services by Electronic Means.</p>
            <p className="text-sm">We send an occasional newsletter with Miami scam analysis, product updates, and notifications. Frequency varies depending on current events. You can withdraw your consent at any time using the "unsubscribe" link in the footer of every email, or by writing to <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300">hello@jakubchodakowski.com</a>.</p>
          </div>

          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">d) Protection against abuse and fraud</p>
            <p className="text-sm text-neutral-400 mb-2"><strong className="text-neutral-300">Legal basis:</strong> Art. 6(1)(f) GDPR — the Controller's legitimate interest.</p>
            <p className="text-sm">We keep logs of rejected applications so the same person cannot reapply under a different email, and to maintain a trail if anyone tries to flood the form with fake submissions.</p>
          </div>

          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">e) Compliance with legal obligations (accounting, taxes)</p>
            <p className="text-sm text-neutral-400 mb-2"><strong className="text-neutral-300">Legal basis:</strong> Art. 6(1)(c) GDPR — legal obligation imposed on the Controller (Polish Tax Ordinance, Polish Accounting Act).</p>
            <p className="text-sm">After a paid membership is established, we are required to retain data for invoicing and tax purposes.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "4",
    title: "4. Who we share your data with",
    body: (
      <>
        <p>
          Your data is shared only with trusted data processors, with whom we have data processing agreements compliant with Art. 28 GDPR:
        </p>

        <div className="space-y-3 mt-4">
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold">Vercel Inc.</p>
            <p className="text-sm text-neutral-400">Website hosting and application data storage. Based in: USA (California).</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold">Resend, Inc.</p>
            <p className="text-sm text-neutral-400">Transactional email delivery (application decisions, service correspondence). Based in: USA (Delaware).</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold">Sendinblue SAS (Brevo)</p>
            <p className="text-sm text-neutral-400">Newsletter delivery and subscriber list management (if you have consented). Based in: France (EU).</p>
          </div>
        </div>

        <p className="mt-4">
          <strong className="text-white">We do not sell</strong> your data to any third parties. We do not share it with data brokers, advertisers, or any other entities outside the processors listed above.
        </p>
        <p>
          For email marketing to US recipients, we comply with the <strong className="text-white">CAN-SPAM Act</strong>: every commercial email includes clear sender identification, our physical mailing address, and a working unsubscribe mechanism that is honored within 10 business days.
        </p>
        <p>
          Data may be disclosed to government authorities only on the basis of a valid court order or other applicable legal grounds.
        </p>
      </>
    ),
  },
  {
    id: "5",
    title: "5. Transferring data outside the EEA (USA)",
    body: (
      <>
        <p>
          Some of our processors (Vercel, Resend) are based in the <strong className="text-white">United States</strong>. Your data may therefore be transferred outside the European Economic Area.
        </p>
        <p>These transfers are made on the basis of:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li><strong className="text-white">Standard Contractual Clauses (SCC)</strong> approved by the European Commission (Commission Implementing Decision 2021/914),</li>
          <li>and, where applicable, the European Commission's adequacy decision of July 10, 2023 regarding the EU-U.S. Data Privacy Framework (for processors certified under DPF).</li>
        </ul>
        <p>
          These mechanisms ensure that your data is protected in the USA at a level comparable to GDPR. You may request a copy of the safeguards in place at any time by writing to <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300">hello@jakubchodakowski.com</a>.
        </p>
      </>
    ),
  },
  {
    id: "6",
    title: "6. How long we keep your data",
    body: (
      <>
        <div className="space-y-3 mt-2">
          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">Rejected application</p>
            <p className="text-sm">We delete your data <strong className="text-white">within 30 days</strong> of the decision to deny admission to the group.</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">Accepted application (membership)</p>
            <p className="text-sm">We keep your data <strong className="text-white">for the entire duration of your membership</strong>, plus <strong className="text-white">3 months</strong> afterward (in case of claims, disputes, or rejoining the group).</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">Newsletter (subscribers)</p>
            <p className="text-sm">We keep your data until you <strong className="text-white">withdraw your consent</strong> (by clicking "unsubscribe" in the email footer). After withdrawal, we delete the data within 30 days.</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-2">Tax and accounting data</p>
            <p className="text-sm">We keep invoices and accounting documents <strong className="text-white">for 5 years from the end of the tax year</strong> in which the tax obligation arose (Art. 86 § 1 of the Polish Tax Ordinance).</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "7",
    title: "7. Your rights",
    body: (
      <>
        <p>Under GDPR (Regulation (EU) 2016/679), you have the full right to:</p>
        <ul className="list-disc pl-6 space-y-2 marker:text-cyan-400">
          <li><strong className="text-white">Access your data</strong> (Art. 15) — you may request a copy of all the data we hold about you</li>
          <li><strong className="text-white">Rectification</strong> (Art. 16) — if the data is incorrect or incomplete</li>
          <li><strong className="text-white">Erasure</strong> (Art. 17, the "right to be forgotten") — you may request deletion of your data unless we are legally required to retain it (e.g., accounting records)</li>
          <li><strong className="text-white">Restriction of processing</strong> (Art. 18)</li>
          <li><strong className="text-white">Data portability</strong> (Art. 20) — in a readable format, such as JSON</li>
          <li><strong className="text-white">Objection to processing</strong> (Art. 21) — in particular against marketing</li>
          <li><strong className="text-white">Withdrawal of consent at any time</strong> (Art. 7(3)) — without affecting the lawfulness of processing before withdrawal</li>
        </ul>
        <p>
          To exercise any of these rights, write to <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300">hello@jakubchodakowski.com</a>. We respond within <strong className="text-white">30 days</strong> (in accordance with Art. 12(3) GDPR).
        </p>
        <p>
          You also have the right to <strong className="text-white">file a complaint with the President of the Personal Data Protection Office (PUODO)</strong>, the Polish data protection authority, Stawki 2, 00-193 Warsaw, Poland, if you believe we are processing your data unlawfully.
        </p>
      </>
    ),
  },
  {
    id: "7a",
    title: "7a. Additional Rights for California Residents (CCPA / CPRA)",
    body: (
      <>
        <p>
          If you are a California (USA) resident, in addition to rights under GDPR you have additional rights under the <strong className="text-white">California Consumer Privacy Act (CCPA)</strong> and the <strong className="text-white">California Privacy Rights Act (CPRA)</strong>:
        </p>
        <ul className="list-disc pl-6 space-y-2 marker:text-cyan-400">
          <li><strong className="text-white">Right to Know</strong> — the right to know what personal information we collect about you, from what sources, for what purposes, and with whom we share it (in the past 12 months),</li>
          <li><strong className="text-white">Right to Delete</strong> — the right to request deletion of your personal information,</li>
          <li><strong className="text-white">Right to Correct</strong> — the right to correct inaccurate information,</li>
          <li><strong className="text-white">Right to Opt-Out of Sale or Sharing</strong> — the right to opt out of the sale or sharing of personal information (we state: <strong className="text-white">we do not sell</strong> your data to anyone),</li>
          <li><strong className="text-white">Right to Limit Use of Sensitive Personal Information</strong> — the right to limit the use of sensitive personal information (we state: <strong className="text-white">we do not collect</strong> sensitive personal information),</li>
          <li><strong className="text-white">Right to Non-Discrimination</strong> — the right to non-discriminatory treatment when exercising the rights listed above.</li>
        </ul>
        <p>
          To exercise these rights, write to <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300">hello@jakubchodakowski.com</a> with the subject line "California Privacy Request". We respond within <strong className="text-white">45 days</strong> (in accordance with CCPA § 1798.130).
        </p>
        <p>
          <strong className="text-white">"Do Not Sell or Share My Personal Information" statement:</strong> Scam Alert Miami does not sell or share personal information within the meaning of the CCPA/CPRA. We do not use data for cross-context behavioral advertising.
        </p>
      </>
    ),
  },
  {
    id: "8",
    title: "8. Cookies and tracking technologies",
    body: (
      <>
        <p>
          The site <strong className="text-white">does not use</strong> analytics, marketing, or profiling cookies.
        </p>
        <p>
          Only so-called <strong className="text-white">technical cookies</strong> strictly necessary for the site to function (such as a form session cookie) may be used. These do not require consent under Article 173(3) of the Polish Telecommunications Law.
        </p>
        <p>
          We do not use Google Analytics, Meta Pixel (Facebook), Hotjar, or any other user tracking tools.
        </p>
        <p>
          If we add any analytics tools in the future, this policy will be updated and users will be informed before deployment.
        </p>
      </>
    ),
  },
  {
    id: "9",
    title: "9. Profiling and automated decisions",
    body: (
      <p>
        <strong className="text-white">We do not make automated decisions.</strong> Every application to the Scam Alert Miami group is reviewed <strong className="text-white">manually, by a human</strong> (the Controller). We do not use AI algorithms, scoring, or any automated profiling within the meaning of Art. 22 GDPR.
      </p>
    ),
  },
  {
    id: "10",
    title: "10. Data security",
    body: (
      <>
        <p>We apply appropriate technical and organizational measures to protect your data:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>encrypted transmission (HTTPS / TLS across the entire site)</li>
          <li>email account access protected by password and two-factor authentication</li>
          <li>infrastructure providers (Vercel, Resend) hold SOC 2 / ISO 27001 security certifications</li>
          <li>data minimization principle — we collect only data necessary to fulfill our purposes</li>
          <li>no data sharing outside the processors listed above</li>
        </ul>
        <p>
          In the event of a personal data breach that may pose a risk to your rights and freedoms, we will promptly notify you and, where required, report the incident to PUODO within 72 hours (Art. 33-34 GDPR).
        </p>
      </>
    ),
  },
  {
    id: "11",
    title: "11. Changes to the Privacy Policy",
    body: (
      <p>
        We may update this Privacy Policy in case of changes to how we process data, addition of new site features, or changes in law. We will notify you of material changes by email (if we have your address) or via a notice on the site. The date of the last update is always shown at the top of this document.
      </p>
    ),
  },
  {
    id: "12",
    title: "12. Contact for GDPR matters",
    body: (
      <>
        <p>
          For any matter regarding your personal data, write to:
        </p>
        <ul className="list-none pl-0 space-y-1 text-neutral-200">
          <li><a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a></li>
          <li>Jakub Chodakowski</li>
          <li>ul. Stanisława Koniecpolskiego 12a/7</li>
          <li>78-100 Kołobrzeg, Poland</li>
        </ul>
        <p>You will receive a response within <strong className="text-white">30 days</strong>.</p>
      </>
    ),
  },
];

export default function ScamAlertPrivacyEN() {
  return (
    <main className="min-h-screen">
      {/* ===== Top bar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-[#0a1218]/85 via-[#0a1218]/55 to-transparent">
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/25">JC</span>
            <span className="text-xs text-neutral-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">jakubchodakowski.com</span>
          </Link>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-300 uppercase tracking-widest hidden md:inline pointer-events-none">Privacy Policy</span>
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
            Privacy Policy
          </h1>
          <p className="text-neutral-400 text-sm">
            Last updated: <span className="text-neutral-300">May 27, 2026</span> · Effective from: <span className="text-neutral-300">May 27, 2026</span>
          </p>
          <p className="text-neutral-300 leading-relaxed mt-6">
            This Privacy Policy explains what data we collect on the Scam Alert Miami site, for what purpose, on what legal basis, with whom we share it, and what rights you have. This document is compliant with <strong className="text-white">GDPR (Regulation (EU) 2016/679)</strong> and includes additional protections for California residents under CCPA/CPRA.
          </p>
          <p className="text-neutral-300 leading-relaxed mt-3">
            Written in plain English. If something is unclear, email <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a> and we will explain.
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
              By using Scam Alert Miami, you confirm that you have read this Privacy Policy.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>Scam Alert Miami &copy; {new Date().getFullYear()} — a project by Jakub Chodakowski</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/scamalertmiami" className="hover:text-cyan-300 transition-colors">Scam Alert Miami</Link>
            <Link href="/scamalertmiami/terms-of-service" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
            <Link href="/scamalertmiami/submission-agreement" className="hover:text-cyan-300 transition-colors">Submission Agreement</Link>
            <Link href="/scamalertmiami/disclaimer" className="hover:text-cyan-300 transition-colors">Disclaimer</Link>
            <Link href="/" className="hover:text-cyan-300 transition-colors">jakubchodakowski.com</Link>
            <a href="mailto:hello@jakubchodakowski.com" className="hover:text-cyan-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
