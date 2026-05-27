import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Submission Agreement — Scam Alert Miami",
  description:
    "Rules and representations that apply when reporting a person, business, or situation as a scam to the Scam Alert Miami database.",
};

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "1",
    title: "1. What This Agreement Covers",
    body: (
      <>
        <p>
          This Submission Agreement (the &ldquo;Agreement&rdquo;) governs the terms on which a Scam Alert Miami Member submits to the Operator a report about a person, business, or situation as a potential scam (a &ldquo;Submission&rdquo;).
        </p>
        <p>
          This Agreement <strong className="text-white">supplements</strong> the <Link href="/scamalertmiami/terms-of-service" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Terms of Service</Link>. Before sending a first Submission, the Member accepts both agreements (a separate checkbox in the submission form).
        </p>
        <p>
          Purpose of this Agreement: to clearly define the responsibility of the Reporter, to protect Reported Parties against abuse, and to shield the Operator from claims arising out of content posted by Users.
        </p>
      </>
    ),
  },
  {
    id: "2",
    title: "2. Definitions",
    body: (
      <ul className="list-disc pl-6 space-y-2 marker:text-cyan-400">
        <li><strong className="text-white">Reporter</strong> — a Scam Alert Miami Member who submits a Submission.</li>
        <li><strong className="text-white">Reported Party</strong> — the individual, business, or other entity that the Submission concerns.</li>
        <li><strong className="text-white">Evidence</strong> — any materials attached to the Submission, including in particular: screenshots, correspondence (email, DM, SMS), contracts, invoices, bank statements, court documents, recordings.</li>
        <li><strong className="text-white">Publication</strong> — making the Submission content available in the Scam Alert Miami database to the extent visible to other Members.</li>
        <li>Other terms have the meaning given to them in the Terms of Service.</li>
      </ul>
    ),
  },
  {
    id: "3",
    title: "3. Reporter Representations",
    body: (
      <>
        <p>By making a Submission, the Reporter makes the following representations, subject to civil and criminal liability:</p>

        <div className="space-y-3 mt-4">
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">a) Truthfulness</p>
            <p className="text-sm">All information in the Submission is true to the best of my knowledge. The description of events is accurate and has not been manipulated.</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">b) Evidence</p>
            <p className="text-sm">I have Evidence to support the statements made in the Submission, I have provided authentic copies to the Operator, and I have not altered their content. If questions arise, I agree to produce originals or additional confirmations.</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">c) No Bad Faith</p>
            <p className="text-sm">I am not making this Submission to defame, to settle personal scores, to gain a competitive edge, to pressure anyone, or for any other improper purpose. My sole motivation is to warn other Members about a real risk.</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">d) Right to Share Evidence</p>
            <p className="text-sm">I have the right to share the attached Evidence with the Operator. It does not infringe third-party copyrights, professional secrecy, or other legally protected interests (other than the Reported Party&rsquo;s privacy, which is assessed in Stage 2 of verification).</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">e) Awareness of Consequences</p>
            <p className="text-sm">I understand that knowingly making a false Submission may constitute <strong className="text-white">defamation under Art. 212 of the Polish Criminal Code (defamation)</strong> or a violation of the Reported Party&rsquo;s personal rights under Art. 23 and 24 of the Polish Civil Code (personal rights protection), and that it gives rise to personal liability.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "4",
    title: "4. Indemnification",
    body: (
      <>
        <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04]">
          <p className="text-amber-200 font-semibold mb-2">⚠️ Key clause — read carefully</p>
          <p className="text-sm leading-relaxed">
            The Reporter <strong className="text-white">shall indemnify and hold the Operator harmless</strong> from and against any and all third-party claims (in particular by the Reported Party) arising out of or related to the content of the Submission or its Publication.
          </p>
        </div>

        <p className="mt-4">In particular, the Reporter agrees to:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>reimburse the Operator for <strong className="text-white">all costs of legal defense</strong> (attorneys&rsquo; fees, court fees, expert witness costs) incurred in connection with any proceeding relating to the Submission;</li>
          <li>cover any <strong className="text-white">damages, settlements, judgments, and costs awarded to third parties</strong> if the Submission turns out to be untrue or made in bad faith;</li>
          <li>cooperate with the Operator in any such proceeding (provide evidence, give testimony).</li>
        </ul>

        <p className="text-sm text-neutral-400 mt-4">
          This indemnification <strong className="text-neutral-300">does not cover</strong> situations in which the harm arose solely from the Operator&rsquo;s fault (for example, Publication of a Submission bypassing the verification procedure described in §6).
        </p>
      </>
    ),
  },
  {
    id: "5",
    title: "5. Publication License",
    body: (
      <>
        <p>
          By submitting a Submission, the Reporter grants the Operator a <strong className="text-white">non-exclusive, royalty-free, worldwide license</strong> to:
        </p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>publish the content of the Submission in the Scam Alert Miami database (in the form visible to Members);</li>
          <li>edit, anonymize, redact, and archive the content to improve readability or to protect the data of third parties unrelated to the Submission;</li>
          <li>reference the Submission in the newsletter and educational materials (preserving the Reporter&rsquo;s anonymity, unless the Reporter has expressly consented to disclosure);</li>
          <li>archive the content for historical and evidentiary purposes.</li>
        </ul>
        <p>
          The license is granted for an <strong className="text-white">indefinite term</strong>. Withdrawal of the Submission (§9) ends further Publication but does not affect archive retention or liability for the effects of past Publication.
        </p>
      </>
    ),
  },
  {
    id: "6",
    title: "6. Verification Procedure",
    body: (
      <>
        <p>
          The full verification procedure is described in <Link href="/scamalertmiami/terms-of-service#section-9" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">§9 of the Terms of Service</Link>. In short, it consists of three stages:
        </p>
        <ol className="list-decimal pl-6 space-y-1 marker:text-cyan-400">
          <li>Operator review (up to 14 days) — preliminary decision: accept / reject;</li>
          <li>Right of reply for the Reported Party (14 days from contact);</li>
          <li>Final decision: Publication, editing, anonymization, or refusal.</li>
        </ol>
        <p>
          The language of any Publication is <strong className="text-white">always cautious</strong>: &ldquo;reported incidents,&rdquo; &ldquo;alleged,&rdquo; &ldquo;as described.&rdquo; We never use categorical phrases like &ldquo;confirmed scammer&rdquo; unless a final court judgment is in hand.
        </p>
      </>
    ),
  },
  {
    id: "7",
    title: "7. Anonymity and Identification of the Reporter",
    body: (
      <>
        <p>
          <strong className="text-white">By default, the Reporter&rsquo;s identity is not disclosed</strong> in the Publication. Other Members see only the Submission content and Evidence (with the Reporter&rsquo;s data anonymized) — no name, email, or LinkedIn profile.
        </p>
        <p>
          The Reporter may <strong className="text-white">voluntarily choose to disclose their identity</strong> (for example, to increase the credibility of the Submission) by making an express statement to that effect in the submission form.
        </p>
        <p>
          The Operator <strong className="text-white">knows the full identity of the Reporter</strong> (for credibility verification and potential liability) and may disclose it only:
        </p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>pursuant to a final and binding order of a Polish court;</li>
          <li>upon a request from authorized government authorities (prosecutor&rsquo;s office, police) in the course of an investigation or proceeding;</li>
          <li>in the case of a clearly false Submission, to defend the Operator against claims (§4 indemnification);</li>
          <li>with the prior written consent of the Reporter.</li>
        </ul>
      </>
    ),
  },
  {
    id: "8",
    title: "8. Consequences of a False Submission",
    body: (
      <>
        <p>
          If the Operator determines that a Submission was made in bad faith — knowingly providing false or fabricated information, or for the purpose of defaming someone — the Operator may apply the following sanctions:
        </p>
        <ul className="list-disc pl-6 space-y-2 marker:text-cyan-400">
          <li><strong className="text-white">Immediate ban</strong> — termination of Membership without refund of the fee (USD 50);</li>
          <li><strong className="text-white">Permanent ban</strong> on re-applying to the Group in the future;</li>
          <li><strong className="text-white">Damages claim</strong> for harm caused to the Operator (defense costs, reputational damage, any amounts awarded to the Reported Party);</li>
          <li><strong className="text-white">Notification to the Reported Party</strong> of the Reporter&rsquo;s identity (§7), enabling the Reported Party to pursue claims directly against the Reporter;</li>
          <li>In extreme cases (fabricated evidence, clear bad faith) — <strong className="text-white">a criminal complaint to law enforcement</strong> alleging defamation (Art. 212 of the Polish Criminal Code (defamation)) or false accusation (Art. 234 of the Polish Criminal Code (false accusation)).</li>
        </ul>
      </>
    ),
  },
  {
    id: "9",
    title: "9. Withdrawal of a Submission",
    body: (
      <>
        <p>
          The Reporter may withdraw a Submission at any time in writing by sending a request to <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300">hello@jakubchodakowski.com</a> with the Submission identification number.
        </p>
        <p>
          Withdrawal results in:
        </p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>cessation of further Publication in the database;</li>
          <li>possible — but not guaranteed — removal of the content from the database; <strong className="text-white">the decision rests with the Operator</strong>, because the Submission may carry independent warning value for other Members;</li>
          <li>retention of the Submission materials in the Operator&rsquo;s archive for up to 5 years (evidentiary purposes, potential claims);</li>
          <li>no impact on the Reporter&rsquo;s liability for the effects of any prior Publication.</li>
        </ul>
      </>
    ),
  },
  {
    id: "10",
    title: "10. Corrections and Updates",
    body: (
      <>
        <p>
          If, after sending a Submission, the Reporter learns of new circumstances (for example, the dispute was resolved or the situation turned out to be a misunderstanding), the Reporter agrees to <strong className="text-white">promptly notify</strong> the Operator at <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300">hello@jakubchodakowski.com</a>.
        </p>
        <p>
          Failure to do so may be treated as maintaining the Submission in bad faith and may trigger the consequences described in §8.
        </p>
      </>
    ),
  },
  {
    id: "11",
    title: "11. Personal Data",
    body: (
      <p>
        Processing of the Reporter&rsquo;s personal data and the Reported Party&rsquo;s data (included in the Submission) is governed by the <Link href="/scamalertmiami/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Privacy Policy</Link>. By making a Submission, the Reporter confirms that they have read the Privacy Policy.
      </p>
    ),
  },
  {
    id: "12",
    title: "12. Final Provisions",
    body: (
      <>
        <p>
          Matters not governed by this Agreement are governed accordingly by the <Link href="/scamalertmiami/terms-of-service" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Terms of Service</Link>, the <Link href="/scamalertmiami/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Privacy Policy</Link>, the <Link href="/scamalertmiami/disclaimer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Legal Disclaimer</Link>, and by <strong className="text-white">Polish law</strong>.
        </p>
        <p>
          Any disputes arising out of this Agreement shall be resolved by the Polish court with jurisdiction over the Operator&rsquo;s registered seat (Kołobrzeg), subject to mandatory provisions of consumer protection law.
        </p>
        <p>
          This Agreement becomes effective upon the Reporter&rsquo;s acceptance (checking the corresponding box in the submission form) and remains in force for the duration of the Service.
        </p>
        <p>
          This Agreement, in its current form, is effective as of <strong className="text-white">May 27, 2026</strong>.
        </p>
      </>
    ),
  },
  {
    id: "13",
    title: "13. Contact",
    body: (
      <ul className="list-none pl-0 space-y-1 text-neutral-200">
        <li><a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a></li>
        <li>Jakub Chodakowski</li>
        <li>ul. Stanisława Koniecpolskiego 12a/7</li>
        <li>78-100 Kołobrzeg, Poland</li>
        <li>NIP: 6711845485 · REGON: 388300543</li>
      </ul>
    ),
  },
];

export default function ScamAlertSubmissionAgreementEN() {
  return (
    <main className="min-h-screen">
      {/* ===== Top bar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-[#0a1218]/85 via-[#0a1218]/55 to-transparent">
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/25">JC</span>
            <span className="text-xs text-neutral-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">jakubchodakowski.com</span>
          </Link>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-300 uppercase tracking-widest hidden md:inline pointer-events-none">Submission Agreement</span>
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
            Submission Agreement
          </h1>
          <p className="text-neutral-400 text-sm">
            Last updated: <span className="text-neutral-300">May 27, 2026</span> · Effective: <span className="text-neutral-300">May 27, 2026</span>
          </p>
          <p className="text-neutral-300 leading-relaxed mt-6">
            This Agreement applies to every Member <strong className="text-white">before submitting a scammer report</strong> to the Scam Alert Miami database. It defines the Reporter&rsquo;s responsibility, the verification procedure, anonymity, and the consequences of false submissions.
          </p>
          <p className="text-neutral-300 leading-relaxed mt-3">
            Goal: to protect honest Members and Reported Parties from abuse, and to shield the Operator from claims.
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
              By sending a Submission to Scam Alert Miami, you represent that you have read, understand, and accept the terms of this Submission Agreement.
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
