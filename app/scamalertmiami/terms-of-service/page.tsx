import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Scam Alert Miami",
  description:
    "Terms of Service for the Scam Alert Miami online service. Price: 50 USD / 30 days. No auto-renewal.",
};

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "1",
    title: "1. Definitions",
    body: (
      <>
        <p>The terms used in these Terms of Service have the following meanings:</p>
        <ul className="list-disc pl-6 space-y-2 marker:text-cyan-400">
          <li><strong className="text-white">Service Provider</strong> — Jakub Chodakowski, a sole proprietor registered in the Polish Central Registration and Information on Business (CEIDG), NIP 6711845485, REGON 388300543 (Polish business IDs), with a registered address at ul. Stanisława Koniecpolskiego 12a/7, 78-100 Kołobrzeg, Poland.</li>
          <li><strong className="text-white">Site</strong> — the Scam Alert Miami website available at <Link href="/scamalertmiami" className="text-cyan-400 hover:text-cyan-300">jakubchodakowski.com/scamalertmiami</Link> together with all subpages.</li>
          <li><strong className="text-white">User</strong> — a natural person or business entity visiting the Site or using its services.</li>
          <li><strong className="text-white">Applicant</strong> — a User who has submitted a request to join the Group through the application form.</li>
          <li><strong className="text-white">Member</strong> — an Applicant whose request has been accepted by the Service Provider and who has paid for access to the Group.</li>
          <li><strong className="text-white">Group</strong> — the closed Scam Alert Miami community, access to which requires verification and payment.</li>
          <li><strong className="text-white">Service</strong> — the service provided electronically by the Service Provider, described in §4 of these Terms.</li>
          <li><strong className="text-white">Consumer</strong> — a natural person making a purchase not directly connected with their business or professional activity (Art. 22¹ of the Polish Civil Code).</li>
          <li><strong className="text-white">Terms</strong> — this document.</li>
        </ul>
      </>
    ),
  },
  {
    id: "2",
    title: "2. General provisions",
    body: (
      <>
        <p>
          These Terms set out the rules for the Service Provider's electronic services on the Site, in accordance with the Polish Act on Provision of Services by Electronic Means of July 18, 2002 (Journal of Laws 2002 No. 144, item 1204, as amended).
        </p>
        <p>
          Using the Site means you accept these Terms. A User who does not accept these Terms should stop using the Site.
        </p>
        <p>
          These Terms are available on the Site free of charge. Anyone may download, save, and print them.
        </p>
      </>
    ),
  },
  {
    id: "3",
    title: "3. Technical requirements",
    body: (
      <>
        <p>To use the Site you need:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>a device with internet access (computer, phone, or tablet),</li>
          <li>a current web browser (Chrome, Safari, Firefox, Edge) with JavaScript enabled,</li>
          <li>an active email account,</li>
          <li>for Members: a LinkedIn account (for verification).</li>
        </ul>
        <p>
          The Service Provider is not responsible for technical problems on the User's end (no internet, outdated browser, or no access to email).
        </p>
      </>
    ),
  },
  {
    id: "4",
    title: "4. Types and scope of Services",
    body: (
      <>
        <p>The Service Provider offers the following Services on the Site:</p>

        <div className="space-y-3 mt-4">
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">a) Free of charge</p>
            <ul className="list-disc pl-6 text-sm space-y-1 marker:text-cyan-400">
              <li>access to the public part of the Site (homepage, FAQ, legal information)</li>
              <li>submitting an application to join the Group</li>
              <li>receiving a response to your application</li>
              <li>receiving the newsletter (after opting in through the form)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04]">
            <p className="text-white font-semibold mb-1">b) Paid — Group Membership (30 days)</p>
            <p className="text-sm mb-3 text-neutral-200">Price: <strong className="text-cyan-300">50 USD</strong> for 30 days of access. One-time payment, no auto-renewal.</p>
            <p className="text-sm font-medium text-neutral-200 mb-2">As a Member you get:</p>
            <ul className="list-disc pl-6 text-sm space-y-2 marker:text-cyan-400">
              <li><strong className="text-white">5 in-depth emails over 30 days</strong> — analysis of real Miami scams: who and what to avoid, specific case descriptions, and the playbooks scammers use.</li>
              <li><strong className="text-white">Verification checks on up to 10 people or companies</strong> over 30 days — the Member submits a list of names/companies through the verification form (name, LinkedIn, company, email, or other identifying details). The Service Provider checks whether the submitted parties appear in the scam database or have documented connections to known scams, and emails the results back to the Member.</li>
              <li><strong className="text-white">The ability to submit your own report</strong> about a person or situation as a suspected scam — procedure details in §9.</li>
            </ul>
            <p className="text-xs text-neutral-400 mt-3">The 5-email and 10-check limits apply to a single 30-day Membership period and do not roll over to the next period.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "5",
    title: "5. Group application procedure",
    body: (
      <>
        <p>Admission to the Group works as follows:</p>

        <div className="space-y-3 mt-4">
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">Step 1 — Application</p>
            <p className="text-sm">The User fills out the application form (name, email, LinkedIn URL, company, business description, reason for wanting to join) and accepts the Terms of Service and Privacy Policy.</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">Step 2 — Verification (up to 7 days)</p>
            <p className="text-sm">The Service Provider manually reviews the application: checks the LinkedIn profile, confirms the company exists, and checks that the business description is consistent.</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">Step 3 — Decision</p>
            <p className="text-sm">The Applicant receives an email with the decision (accepted or declined). If accepted — a payment link. If declined — a brief notice, with no obligation to provide reasons.</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">Step 4 — Payment and activation</p>
            <p className="text-sm">The Applicant pays for access (50 USD). Once the payment is recorded, they receive access credentials to the Group. The Membership period begins when access is granted.</p>
          </div>
        </div>

        <p className="mt-4">
          <strong className="text-white">The Service Provider reserves the right to decline any application</strong> without giving reasons. A rejection does not require justification or an appeal process. If declined, the Applicant owes nothing.
        </p>
      </>
    ),
  },
  {
    id: "6",
    title: "6. Payments",
    body: (
      <>
        <p>
          Payment for Membership is made as a <strong className="text-white">one-time</strong> electronic payment through a payment processor (Stripe). Price: <strong className="text-white">50 USD for 30 days</strong>.
        </p>
        <p>
          Once payment is recorded, the Member receives an email with an invoice or purchase confirmation. The Service Provider issues invoices in PLN (converted from USD at the average exchange rate published by the National Bank of Poland (NBP) on the business day preceding the transaction date), in line with Polish tax law.
        </p>
        <p>
          <strong className="text-white">No auto-renewal.</strong> After 30 days, access to the Group expires. To continue, the Member must pay again (no need to re-verify if less than 90 days have passed since the previous acceptance).
        </p>
        <p>
          All prices are gross prices (including VAT applicable under Polish tax law, if applicable).
        </p>
      </>
    ),
  },
  {
    id: "7",
    title: "7. Right of withdrawal (Consumer) — 14 days",
    body: (
      <>
        <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04]">
          <p className="text-white font-semibold mb-2">🛡️ Your refund guarantee</p>
          <p className="text-sm">
            A Consumer has the right to withdraw from a distance contract within <strong className="text-white">14 days</strong> without giving any reason — <strong className="text-white">even after gaining access to the Group</strong>.
          </p>
          <p className="text-sm mt-2">
            The Service Provider deliberately <strong className="text-white">does not request a waiver of this right of withdrawal</strong> (which would otherwise be permitted under Art. 38(1) of the Polish Consumer Rights Act). This is a deliberate choice: we want Members to feel fully safe in their purchase and to be able to try the Group.
          </p>
        </div>

        <p>
          Legal basis: Art. 27 of the Polish Consumer Rights Act of May 30, 2014 (Journal of Laws 2014, item 827, as amended).
        </p>

        <p className="font-semibold text-white">How to withdraw:</p>
        <ol className="list-decimal pl-6 space-y-1 marker:text-cyan-400">
          <li>Send an email to <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300">hello@jakubchodakowski.com</a> with the subject line "Withdrawal from contract" within 14 days of your Membership activation date.</li>
          <li>Include your first name, last name, the email address you used to apply, and your activation date.</li>
          <li>You do not need to give a reason.</li>
        </ol>

        <p className="font-semibold text-white mt-4">Refund:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li><strong className="text-white">Full refund of 50 USD</strong> within <strong className="text-white">14 days</strong> of our receiving your withdrawal notice.</li>
          <li>The refund is issued using the same payment method you used at purchase.</li>
          <li>Upon withdrawal, your access to the Group is immediately revoked.</li>
        </ul>

        <p className="text-sm text-neutral-400 mt-4">
          <strong className="text-neutral-300">Note for businesses:</strong> the consumer right of withdrawal applies only to Consumers as defined in Art. 22¹ of the Polish Civil Code. A business entity buying in connection with its business activity does not have the withdrawal right described in §7. Exception: a so-called "entrepreneur-consumer" (a sole proprietor whose purchase is not of a professional nature for them) — may use some consumer rights, including the 14-day right of withdrawal.
        </p>
      </>
    ),
  },
  {
    id: "8",
    title: "8. Rules for using the Site",
    body: (
      <>
        <p>The User agrees to use the Site in accordance with the law, good practice, and these Terms. <strong className="text-white">The following are specifically prohibited:</strong></p>
        <ul className="list-disc pl-6 space-y-2 marker:text-cyan-400">
          <li>providing false information in the application form, including a false identity, a fake LinkedIn profile, or a non-existent company,</li>
          <li>creating multiple accounts to gain unauthorized access to the Group,</li>
          <li>publishing, sharing, or reselling Group content to third parties (content is protected by the copyright of the Service Provider and of report authors),</li>
          <li>submitting reports that are false, defamatory, or unsupported by facts,</li>
          <li>submitting reports for the purpose of harassment, competitive attack, or revenge,</li>
          <li>scraping, automated downloading, or duplicating data from the database,</li>
          <li>attempting attacks on the Site's infrastructure (DDoS, SQL injection, intrusion attempts),</li>
          <li>using information from the Site for any purpose covered by the U.S. Fair Credit Reporting Act (FCRA) (employment, credit, insurance, housing) — see <Link href="/scamalertmiami/disclaimer" className="text-cyan-400 hover:text-cyan-300">Legal Disclaimer</Link>,</li>
          <li>violating the personal rights of third parties, including publishing accusations without evidence.</li>
        </ul>
        <p>
          A breach of these rules entitles the Service Provider to <strong className="text-white">immediately terminate the contract</strong>, block the Member's account with no refund, and pursue claims for damages.
        </p>
      </>
    ),
  },
  {
    id: "9",
    title: "9. User-submitted scam reports",
    body: (
      <>
        <p>
          Any Member (and any registered User, if the Service Provider enables this feature) may submit a person, company, or situation to the database as a suspected scam. Submissions are made through a dedicated form and must include <strong className="text-white">evidence</strong> (screenshots, correspondence, contracts, bank statements, court documents, or other proof supporting the claims).
        </p>

        <p className="font-semibold text-white mt-4">Report verification process:</p>

        <div className="space-y-3 mt-3">
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">Stage 1 — Report review (up to 14 days)</p>
            <p className="text-sm">The Service Provider reviews the report, checks the consistency of the evidence, the context, and credibility. Within <strong className="text-white">14 days</strong> of receiving the report, the Service Provider emails the submitter a <strong className="text-white">preliminary decision</strong>:</p>
            <ul className="list-disc pl-6 text-sm space-y-1 marker:text-cyan-400 mt-2">
              <li><strong className="text-white">Report accepted for further processing</strong> — moves to Stage 2,</li>
              <li><strong className="text-white">Report rejected</strong> — with a brief reason (e.g., insufficient evidence, obvious attempt at defamation, irrelevant content).</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">Stage 2 — Right of reply for the reported party (14 days)</p>
            <p className="text-sm">Before a report is published in the database, the person or company named in it is informed of the report's content and has <strong className="text-white">14 days</strong> to present their position, provide counter-evidence, or request removal. That response may be published alongside the report.</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <p className="text-white font-semibold mb-1">Stage 3 — Publication or refusal</p>
            <p className="text-sm">After gathering all materials, the Service Provider makes the final publication decision. Every published report uses language such as "reported incidents," "alleged," "described" — never "confirmed scammer," unless we have a final court judgment.</p>
          </div>
        </div>

        <p className="font-semibold text-white mt-5">Submitter's representations</p>
        <p>By submitting a report, the Member represents that:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>the content of the report is true and reflects their actual experience,</li>
          <li>they have evidence supporting their claims and are providing it to the Service Provider,</li>
          <li>they are not submitting the content for the purpose of defamation, personal revenge, or competitive attack,</li>
          <li>they release the Service Provider from liability for third-party claims arising out of the content of the report (indemnification clause),</li>
          <li>they accept the 3-stage verification process described above.</li>
        </ul>

        <p>
          The Service Provider reserves the right to <strong className="text-white">refuse publication</strong>, edit, anonymize, or remove a report without giving reasons. Detailed submission rules may be set out in a separate <em className="not-italic text-neutral-200">Submission Agreement</em> (in preparation).
        </p>
      </>
    ),
  },
  {
    id: "10",
    title: "10. Rights of the Service Provider",
    body: (
      <>
        <p>The Service Provider reserves the right to:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>decline an application without giving reasons,</li>
          <li>immediately terminate the contract with a Member in case of a material breach of these Terms,</li>
          <li>temporarily suspend the Site for maintenance, updates, or fixing outages,</li>
          <li>edit, remove, or anonymize content submitted by Members,</li>
          <li>change the Site's features, while preserving the core scope of the Service the Member is entitled to.</li>
        </ul>
      </>
    ),
  },
  {
    id: "11",
    title: "11. Complaints",
    body: (
      <>
        <p>Complaints about how the Site or the Services work can be sent by email to <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300">hello@jakubchodakowski.com</a>.</p>
        <p>A complaint should include:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>the first name, last name, and email address of the person filing it,</li>
          <li>a description of the issue and the circumstances in which it occurred,</li>
          <li>the resolution you are seeking (refund, fix, explanation).</li>
        </ul>
        <p>
          The Service Provider reviews the complaint within <strong className="text-white">14 days</strong> of receipt and notifies the User of the decision by email.
        </p>
        <p>
          A Consumer may also use out-of-court complaint and redress mechanisms, including the European Union's <strong className="text-white">ODR (Online Dispute Resolution)</strong> platform available at <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">ec.europa.eu/consumers/odr</a> (available to EU-resident consumers).
        </p>
      </>
    ),
  },
  {
    id: "12",
    title: "12. Liability",
    body: (
      <>
        <p>
          The Service is provided with due care, but the Service Provider <strong className="text-white">does not guarantee</strong> that the Site or the report database will identify every threat, nor that any person or company not listed in the database is trustworthy.
        </p>
        <p>
          Business decisions made based on content from the Site are <strong className="text-white">solely the User's responsibility</strong>. The Service Provider is not liable for any financial or non-financial losses arising from relying on Site content.
        </p>
        <p>
          The Service Provider's liability to a Member who is a business is <strong className="text-white">limited to the amount paid</strong> for the current Membership period (50 USD). This limitation does not apply to Consumers to the extent that mandatory law does not permit such a limitation.
        </p>
        <p>
          The full scope of the liability limitations is set out in the <Link href="/scamalertmiami/disclaimer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Legal Disclaimer</Link>.
        </p>
      </>
    ),
  },
  {
    id: "13",
    title: "13. Termination",
    body: (
      <>
        <p>A Membership contract ends:</p>
        <ul className="list-disc pl-6 space-y-1 marker:text-cyan-400">
          <li>after 30 days from Membership activation (no auto-renewal),</li>
          <li>by Consumer withdrawal (subject to §7),</li>
          <li>by immediate termination by the Service Provider in case of a material breach of these Terms by the Member,</li>
          <li>by mutual agreement of the parties.</li>
        </ul>
        <p>
          If the Service Provider terminates the contract due to the Member's fault, <strong className="text-white">the fee is not refundable</strong>.
        </p>
        <p>
          After the contract ends, the Member's personal data is processed in line with the <Link href="/scamalertmiami/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Privacy Policy</Link> (retained for up to 3 months after Membership ends).
        </p>
      </>
    ),
  },
  {
    id: "14",
    title: "14. Personal data",
    body: (
      <p>
        The rules for processing Users' personal data are set out in a separate document: <Link href="/scamalertmiami/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Privacy Policy</Link>, available on the Site. The data controller is the Service Provider.
      </p>
    ),
  },
  {
    id: "15",
    title: "15. Changes to these Terms",
    body: (
      <>
        <p>
          The Service Provider may change these Terms for important reasons (changes in law, changes to the scope of the Services, price changes, decisions by government authorities).
        </p>
        <p>
          Members will be notified of changes <strong className="text-white">at least 14 days before they take effect</strong>, by email. A Member who does not accept the changes may terminate the contract within that period and receive a proportional refund of the fee for the unused period.
        </p>
        <p>Contracts entered into before a change takes effect are governed by the version of these Terms in force at the time the contract was made, unless the Member expressly accepts the new version.</p>
      </>
    ),
  },
  {
    id: "16",
    title: "16. Final provisions",
    body: (
      <>
        <p>
          Matters not covered by these Terms are governed by <strong className="text-white">Polish law</strong>, in particular the Polish Civil Code, the Polish Act on Provision of Services by Electronic Means, the Polish Consumer Rights Act, and the GDPR.
        </p>
        <p>
          Any disputes arising from these Terms or the use of the Site are resolved by the <strong className="text-white">court with jurisdiction over the Service Provider's registered office</strong> (Kołobrzeg, Poland), unless mandatory consumer protection law in the Consumer's country of residence provides otherwise.
        </p>
        <p>
          If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions stay in force.
        </p>
        <p>
          These Terms take effect on <strong className="text-white">May 27, 2026</strong>.
        </p>
      </>
    ),
  },
  {
    id: "17",
    title: "17. Contact",
    body: (
      <ul className="list-none pl-0 space-y-1 text-neutral-200">
        <li><a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a></li>
        <li>Jakub Chodakowski</li>
        <li>ul. Stanisława Koniecpolskiego 12a/7</li>
        <li>78-100 Kołobrzeg, Poland</li>
        <li>NIP: 6711845485 · REGON: 388300543 (Polish business IDs)</li>
      </ul>
    ),
  },
];

export default function ScamAlertTermsEN() {
  return (
    <main className="min-h-screen">
      {/* ===== Top bar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-[#0a1218]/85 via-[#0a1218]/55 to-transparent">
        <div className="relative max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 group relative z-10">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/25">JC</span>
            <span className="text-xs text-neutral-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">jakubchodakowski.com</span>
          </Link>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-300 uppercase tracking-widest hidden md:inline pointer-events-none">Terms of Service</span>
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
            Terms of Service
          </h1>
          <p className="text-neutral-400 text-sm">
            Last updated: <span className="text-neutral-300">May 27, 2026</span> · Effective: <span className="text-neutral-300">May 27, 2026</span>
          </p>
          <p className="text-neutral-300 leading-relaxed mt-6">
            Terms of Service for electronic services provided through the Scam Alert Miami site. Compliant with the Polish Act on Provision of Services by Electronic Means of July 18, 2002 and the Polish Consumer Rights Act of May 30, 2014.
          </p>
          <p className="text-neutral-300 leading-relaxed mt-3">
            Written as plainly as possible. If anything is unclear, email <a href="mailto:hello@jakubchodakowski.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">hello@jakubchodakowski.com</a>.
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
              By using Scam Alert Miami, you confirm that you have read and accept these Terms of Service.
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
