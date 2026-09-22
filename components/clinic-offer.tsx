"use client";

import { useEffect, useRef, useState } from "react";
import { CLINIC_OFFERS, funnel, type ClinicOffer } from "@/lib/clinic-offers";

// English offer page for clinics abroad (USER_001 2026-09-22). Structure
// mirrors lovemyself.pl/klinikaoferta (OfertaNowa in clinic mode): hero with
// three promises, "your month", funnel with numbers, price + what you get,
// guarantee, warning, who I am + payments, FAQ, closing. Texts rewritten in
// plain American English (12-year-old level, USER rule) for a clinic that
// has never heard of lovemyself: no Polish brand, no Polish directories.
//
// Look: the same as the jakubchodakowski.com home page (white, zinc text,
// cyan/teal accent), not the lovemyself blue.
//
// One CTA on the whole page. With a Stripe Payment Link it goes to payment;
// without one (Ailesbury today) it opens a reply email, because a EUR link
// does not exist yet.

const GREEN = "#16a34a";
const CARD = "rounded-2xl border border-zinc-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]";
const EMAIL = "hello@jakubchodakowski.com";

const eur = (n: number) => new Intl.NumberFormat("en-IE").format(n);
const range = (p: [number, number]) => (p[0] === p[1] ? eur(p[0]) : `${eur(p[0])}-${eur(p[1])}`);

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { rootMargin: "-60px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

function Cta({ label, href, big = false }: { label: string; href: string; big?: boolean }) {
  return (
    <a
      href={href}
      className={`inline-block rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-transform hover:scale-[1.03] ${
        big ? "px-9 py-4 text-[16px]" : "px-7 py-3 text-[15px]"
      }`}
    >
      {label}
    </a>
  );
}

function Tick({ color = GREEN, children }: { color?: string; children: React.ReactNode }) {
  return (
    <span
      className="mt-0.5 grid size-5 flex-none place-items-center rounded-full text-[0.7rem] font-bold text-white"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

const YOUR_MONTH = [
  { title: "You do only your work", text: "I bring the patients." },
  { title: "Peace of mind", text: "The website works while you rest." },
  { title: "You stay in control", text: "You get a report every month." },
];

const INCLUDED = (o: ClinicOffer) => [
  {
    what: "Your website, your domain",
    detail: `Optimised for ${o.procedure} in ${o.city}. First changes live within 14 days.`,
  },
  {
    what: "Articles on your website, every month",
    detail: "Written for what patients really type into Google: cost per graft, FUE vs DHI, recovery, results, Turkey vs Ireland.",
  },
  {
    what: "Technical fixes",
    detail: "Titles, headings, speed, clinic schema for Google, language versions set up properly.",
  },
  {
    what: "Google Business Profile",
    detail: "Photos, questions and answers, replies to reviews.",
  },
  {
    what: "Visibility in AI search",
    detail: "ChatGPT, Perplexity and Google AI answers. Content written so they quote you.",
  },
  {
    what: "Collecting patient reviews",
    detail: "New reviews bring new patients.",
  },
  {
    what: "Analytics set up",
    detail: "Google Search Console and Google Analytics on your website.",
  },
  {
    what: `Exclusivity: one clinic in ${o.city}`,
    detail: `I do not work with another ${o.procedure} clinic in ${o.city}.`,
  },
];

const BONUSES = [
  {
    what: "Monthly report",
    detail: "Impressions and clicks in Google, the phrases patients come from, and next steps.",
  },
  {
    what: "Online booking on your website",
    detail: "The patient picks a consultation slot and it lands in your calendar.",
  },
];

const FAQ = (o: ClinicOffer) => [
  {
    q: "We already have a website. Do you build a new one?",
    a: "No. I work on your website and your domain. Everything I build stays yours.",
  },
  {
    q: "We already run Google Ads. Does this replace them?",
    a: "No. Ads stop the moment you stop paying. This channel keeps working. Many clinics run both and cut the ad budget over time.",
  },
  {
    q: "Who owns the content if we stop?",
    a: "You do. Every article, page and setting stays on your domain. You can cancel any month.",
  },
  {
    q: "How soon do we see results?",
    a: "First changes go live within 14 days. Google needs time: the report shows impressions growing month by month, and consultations usually follow from month 3 to 4.",
  },
  {
    q: `Why only one clinic in ${o.city}?`,
    a: "Because I cannot put two clinics in the same first place in Google. One clinic per city per procedure, no exceptions.",
  },
];

export function ClinicOfferPage() {
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setKey((p.get("k") ?? "").toLowerCase());
  }, []);

  // Visit report: the page has no password, so this is how we learn it was opened.
  useEffect(() => {
    if (!key || !CLINIC_OFFERS[key]) return;
    const body = JSON.stringify({ clinic: key, from: document.referrer });
    const url = "/api/offer-view";
    if (!navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) {
      void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(
        () => {},
      );
    }
  }, [key]);

  if (key === null) return null;
  const o = CLINIC_OFFERS[key];
  if (!o) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center text-zinc-800">
        <h1 className="text-2xl font-semibold">This offer is not available</h1>
        <p className="mt-3 text-zinc-600">
          This link is sent by name. Please open it exactly as it came in the email, or reply to that
          email and I will send it again.
        </p>
      </main>
    );
  }

  const f = funnel(o);
  const noData = o.searches <= 0;
  const cta = o.paymentLink ?? `mailto:${EMAIL}?subject=${encodeURIComponent(`${o.name}: let's start`)}`;
  const monthsPerProcedure = Math.floor(o.procedurePriceEur / o.priceEur);
  const included = INCLUDED(o);
  const faq = FAQ(o);

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-zinc-800 antialiased">
      {noData && (
        <div className="sticky top-0 z-50 bg-red-600 px-5 py-3 text-center text-sm font-bold text-white">
          PREVIEW. No measured search volume for “{o.phrase}”. Fill `searches` in lib/clinic-offers.ts.
          DO NOT SEND this page.
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/profilowe_jakub.png"
            alt="Jakub Chodakowski"
            className="size-8 rounded-full object-cover ring-2 ring-cyan-500/30"
          />
          <span className="text-sm font-medium text-zinc-900">Jakub Chodakowski</span>
          <span className="ml-auto">
            <Cta label={`Start in ${o.city}`} href={cta} />
          </span>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 size-[28rem] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="mx-auto flex min-h-[calc(100svh-64px)] max-w-5xl flex-col justify-center px-5 pb-10 text-center">
          <Reveal>
            <p className="mb-5 font-mono text-xs uppercase tracking-widest text-cyan-600">
              Offer for {o.name}
            </p>
            <h1 className="text-[clamp(1.6rem,8vw,2.6rem)] font-bold leading-[1.08] tracking-tighter text-zinc-900 sm:text-7xl sm:leading-[1.03]">
              Patients
              <br />
              <Accent>will find you</Accent>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
              Instead of competing with comparison portals and clinics abroad,
              <br className="hidden sm:block" /> show patients in {o.city} that you are their best choice.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <ul className="mx-auto mt-9 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
              {["No commission per patient", `One clinic in ${o.city}`, "Cancel any month"].map((t) => (
                <li key={t} className={`${CARD} flex items-start gap-3 p-4 text-[0.95rem]`}>
                  <Tick>✓</Tick>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* YOUR MONTH */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tighter text-zinc-900 sm:text-5xl">
              What does <Accent>your month</Accent> look like?
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className={`${CARD} mx-auto mt-9 max-w-3xl overflow-hidden`}>
              {YOUR_MONTH.map((t) => (
                <div
                  key={t.title}
                  className="flex items-start gap-4 border-b border-zinc-200 p-6 last:border-0"
                  style={{ background: "rgba(22, 163, 74, 0.04)" }}
                >
                  <span
                    className="mt-0.5 grid size-7 flex-none place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: GREEN }}
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-base font-semibold" style={{ color: "#15803d" }}>
                      {t.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW MANY PATIENTS */}
      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tighter text-zinc-900 sm:text-5xl">
              How many patients <Accent>are out there?</Accent>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-zinc-600">
              {o.searching}
            </p>
          </Reveal>

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {[
              {
                step: `People search for a ${o.procedure} in ${o.city}`,
                value: noData ? "—" : `about ${eur(o.searches)} / month`,
                pct: null as string | null,
              },
              {
                step: "Land on your website",
                value: noData ? "—" : `${range(f.visits)} people`,
                pct: `${Math.round(o.visitShare[0] * 100)}-${Math.round(o.visitShare[1] * 100)}%`,
              },
              { step: "Send an enquiry", value: noData ? "—" : `${range(f.enquiries)} people`, pct: "5-8%" },
              {
                step: "New consultations a month",
                value: noData ? "—" : `${range(f.consultations)} consultations`,
                pct: "70%",
              },
            ].map((l, i, arr) => (
              <Reveal key={l.step} delay={i * 90}>
                <div
                  className={`${CARD} flex items-center justify-between gap-4 p-5 ${
                    i === arr.length - 1 ? "ring-2 ring-cyan-500" : ""
                  }`}
                >
                  <span className="flex items-center gap-3 text-[0.95rem]">
                    {l.pct && (
                      <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500">
                        {l.pct}
                      </span>
                    )}
                    {l.step}
                  </span>
                  <span className="shrink-0 text-xl font-semibold text-cyan-600">{l.value}</span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* PRICE + WHAT YOU GET */}
          <Reveal delay={120}>
            <div className={`${CARD} mx-auto mt-10 max-w-3xl overflow-hidden ring-2 ring-cyan-500`}>
              <div className="bg-white/60 px-4 py-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">My work</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 sm:text-3xl">
                  {eur(o.priceEur)} EUR / month
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  One {o.procedure} covers about {monthsPerProcedure} months of the partnership.
                </p>
              </div>
              <div className="border-t border-zinc-200 px-6 py-6 sm:px-8">
                <p className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                  What you get
                </p>
                <ul className="mt-4 divide-y divide-zinc-200">
                  {included.map((c) => (
                    <li key={c.what} className="flex items-start gap-3 py-4">
                      <Tick>✓</Tick>
                      <span>
                        <span className="text-[0.95rem] font-semibold text-zinc-900">{c.what}</span>
                        <span className="block text-sm leading-relaxed text-zinc-600">{c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-zinc-200 pt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Bonuses
                </p>
                <ul className="divide-y divide-zinc-200">
                  {BONUSES.map((c) => (
                    <li key={c.what} className="flex items-start gap-3 py-4">
                      <Tick color="#0891b2">+</Tick>
                      <span>
                        <span className="text-[0.95rem] font-semibold text-zinc-900">{c.what}</span>
                        <span className="block text-sm leading-relaxed text-zinc-600">{c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-8 text-center">
              <Cta label="Yes, this is for us" href={cta} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="mx-auto max-w-3xl px-5 py-12 text-center sm:py-16">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tighter text-zinc-900 sm:text-5xl">
            3-month <Accent>guarantee</Accent>
          </h2>
          <div className={`${CARD} mt-8 p-8`}>
            <p className="text-lg font-semibold text-zinc-900">
              For 3 months you see the report from Google Search Console.
            </p>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              If your impressions in Google have not grown,
              <br />
              I refund the last month.
            </p>
          </div>
        </Reveal>
      </section>

      {/* WARNING */}
      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:py-16">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tighter text-zinc-900 sm:text-5xl">
              What if you <Accent>don&apos;t?</Accent>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
              {o.warning ?? "Your next patient will go to another clinic."}
            </p>
            <div className="mt-8">
              <Cta label="I want those patients" href={cta} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* WHO + PAYMENTS */}
      <section className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className={`${CARD} h-full p-7`}>
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-600">Who you work with</p>
              <div className="mt-4 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profilowe_jakub.png"
                  alt="Jakub Chodakowski"
                  className="size-16 shrink-0 rounded-full object-cover"
                />
                <div>
                  <p className="text-xl font-semibold text-zinc-900">Jakub Chodakowski</p>
                  <p className="text-sm text-zinc-600">SEO for private clinics</p>
                </div>
              </div>
              <table className="mt-5 w-full border-collapse text-sm">
                <tbody>
                  {[
                    ["Phone", "+48 506 151 615"],
                    ["Email", EMAIL],
                    ["Business no. (PL)", "6711845485"],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-zinc-200 last:border-0">
                      <td className="py-2.5 pr-4 text-zinc-500">{k}</td>
                      <td className="break-all py-2.5 text-right font-medium text-zinc-900">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                I reply to every email myself. No agency, no account manager in between.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className={`${CARD} h-full p-7`}>
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Payments and invoices</p>
              <p className="mt-4 text-xl font-semibold text-zinc-900">Card payment by Stripe</p>
              <ul className="mt-4 space-y-3">
                {[
                  "An invoice in EUR for your company every month.",
                  "EU business: VAT reverse charge on your VAT number.",
                  "No commission on your patients' payments. Ever.",
                  "Month to month. Cancel any time, no notice period.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm leading-relaxed">
                    <Tick>✓</Tick>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tighter text-zinc-900 sm:text-5xl">
            <Accent>FAQ</Accent>
          </h2>
        </Reveal>
        <div className="mt-9 space-y-3">
          {faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="group rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
                <summary className="cursor-pointer list-none text-base font-semibold text-zinc-900 marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {f.q}
                    <span className="mt-0.5 shrink-0 text-xl leading-none text-cyan-600 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CLOSING + PS */}
      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:py-16">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tighter text-zinc-900 sm:text-5xl">
              Shall we take <Accent>{o.city}?</Accent>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600">
              {eur(o.priceEur)} EUR a month, no fixed term.
              <br />
              Renewed month by month.
            </p>
            <div className="mt-8">
              <Cta label="Let's start" href={cta} big />
            </div>
            {!o.paymentLink && (
              <p className="mt-3 text-xs text-zinc-500">The button opens an email to me. I send the invoice the same day.</p>
            )}
          </Reveal>
          <Reveal delay={200}>
            <div className="mx-auto mt-12 max-w-2xl border-t border-zinc-200 pt-8 text-left">
              <p className="text-sm leading-relaxed text-zinc-600">
                <strong className="text-zinc-900">PS.</strong> {eur(o.priceEur)} EUR a month is a fraction of one{" "}
                {o.procedure}. If even one new patient comes, you are ahead. If after 3 months your impressions
                in Google have not grown, I refund the last month.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-10 sm:flex-row sm:justify-between">
          <span className="text-sm font-medium text-zinc-900">jakubchodakowski.com</span>
          <p className="text-center text-xs text-zinc-500 sm:text-right">
            Jakub Chodakowski, business no. (PL) 6711845485, {EMAIL}
          </p>
        </div>
      </footer>
    </div>
  );
}
