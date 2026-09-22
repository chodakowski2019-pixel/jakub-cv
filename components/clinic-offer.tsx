"use client";

import { useEffect, useRef, useState } from "react";
import { CLINIC_OFFERS, funnel, type ClinicOffer } from "@/lib/clinic-offers";

// English offer page for clinics abroad (USER_001 2026-09-22).
//
// ⚠️ USER_001 22.09: the texts must be EXACTLY the ones from
// lovemyself.pl/klinikaoferta (OfertaNowa in clinic mode, version 2),
// translated, not rewritten. Section order, headings, bullet lists, CTA
// labels, guarantee, FAQ and PS follow src/components/oferta-nowa.tsx in
// zwiazki-lp one to one. Differences, all forced by the market:
//   - brand: Jakub Chodakowski instead of lovemyself (logo, header, footer),
//   - the social-proof section keeps the heading and CTA but not the photos
//     of Polish psychologists (no consent for their image, and they mean
//     nothing to a clinic in Dublin),
//   - "Premium Europa" (Polish patients abroad) is dropped: it sells Polish
//     search results, which an Irish clinic does not need,
//   - KSeF (Polish e-invoicing) does not exist in Ireland; the payments card
//     says "invoice in EUR" instead,
//   - the FAQ item about ZnanyLekarz becomes "a profile on a directory site".
//
// Look: same as the jakubchodakowski.com home page (white, zinc, cyan/teal).
//
// One CTA on the whole page, and it always opens a reply email: clinics do not
// buy SEO off a landing page, they buy after a call and pay on an invoice
// (USER_001 22.09). The page states the price, it does not take money.

const GREEN = "#16a34a";
const CARD = "rounded-2xl border border-zinc-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]";
const EMAIL = "hello@jakubchodakowski.com";
// Same number as on the Polish offers (LICZBA_SPECJALISTOW in oferta-nowa.tsx,
// given by USER_001, not counted from the database).
const SPECIALISTS = 250;

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

// PL: "0 prowizji od pacjenta" / "Gwarancja wzrostu" / "Rezygnujesz kiedy chcesz"
const HERO_POINTS = ["0 commission per patient", "Growth guarantee", "Cancel whenever you want"];

// PL: TWOJ_MIESIAC without the red row (clinic mode).
const YOUR_MONTH = [
  { title: "You do only your own work", text: "We find the patients." },
  { title: "Peace of mind", text: "The website works while you rest." },
  { title: "You are in control", text: "You receive a report every month." },
];

// PL: wPakiecie(v2) in clinic mode: report and online booking moved to
// bonuses, directory profile removed.
const INCLUDED = (o: ClinicOffer) => [
  { what: "Your clinic's website", detail: `Optimised for ${o.city}, ready in 14 days.` },
  {
    what: "Articles on your website",
    detail: "We write for what people really type into Google when they look for help.",
  },
  {
    what: "Google Business Profile",
    detail: "We run your profile: photos, questions and answers, replies to reviews.",
  },
  {
    what: "Ranking in AI search engines",
    detail: "ChatGPT, Perplexity and AI answers in Google. We write the content so that they quote you.",
  },
  { what: "Collecting patient reviews", detail: "New reviews strongly attract new patients." },
  {
    what: "Analytics tools connected",
    detail: "Google Search Console and Google Analytics on your website.",
  },
];

// PL: bonusy(v2) in clinic mode.
const BONUSES = [
  {
    what: "A report once a month",
    detail: "Impressions and clicks in Google, the phrases patients come in on, and conclusions for the next month.",
  },
  {
    what: "Online booking on the website",
    detail: "The patient picks the slot and lands in your calendar.",
  },
  {
    what: "Patient CRM",
    detail: "Patient card, visit history, payments, documents and notes in one place.",
  },
];

// PL: KLIENCI.slice(0, 8) from gabinety-lp.tsx, the same 8 people and photos
// as on the Polish offers (USER_001 22.09: the tiles must be there). Photos
// copied to public/klienci/. ⚠️ Same caveat as on the Polish side: the first
// five photos come from TwójPsycholog profiles without image consent.
const CLIENTS = [
  { name: "Katarzyna Klimowicz", title: "psychotherapist", file: "/klienci/katarzyna-klimowicz.jpg" },
  { name: "Barbara Czarny", title: "psychologist", file: "/klienci/barbara-czarny.jpg" },
  { name: "Joanna Wolff", title: "psychotherapist", file: "/klienci/joanna-wolff.jpg" },
  { name: "Joanna Nowicka", title: "psychologist", file: "/klienci/joanna-nowicka.jpg" },
  { name: "Krystian Sobczyk", title: "psychotherapist", file: "/klienci/krystian-sobczyk.jpg" },
  { name: "Tomasz Lipa", title: "psychotherapist", file: "/klienci/tomasz-lipa.jpg" },
  { name: "Przemysław Matul", title: "psychotherapist", file: "/klienci/przemyslaw-matul.jpg" },
  { name: "Martyna Kazanecka", title: "psychotherapist", file: "/klienci/martyna-kazanecka.jpg" },
];

// PL: FAQ, one to one.
const FAQ = [
  {
    q: "We already have a clinic website. Do you build a new one?",
    a: "If you have a website, we work on it and start pushing it higher.",
  },
  {
    q: "We take bookings in several places at once. Can that be combined?",
    a: "Yes. We can merge all your calendars into one to make your work easier.",
  },
  {
    q: "We have a profile on a directory site. Does that clash?",
    a: "No. You can keep it. We work outside the directories, so one does not get in the way of the other.",
  },
  {
    q: "Who owns the website and what happens to it if we cancel?",
    a: "The domain and the website are yours. If you end the partnership, we hand over the whole website and everything we built.",
  },
  {
    q: "Our clinic has several specialists. Does that change anything?",
    a: "For the better. More specialisations mean more phrases we can show you under in Google.",
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
        <h1 className="text-2xl font-semibold">Offer not available</h1>
        <p className="mt-3 text-zinc-600">
          This address is sent by name. Please open the link exactly as it came by email, or reply to
          the message and I will send it again.
        </p>
      </main>
    );
  }

  const f = funnel(o);
  const noData = o.searches <= 0;
  // USER_001 22.09: nobody buys SEO off a landing page, so the page only
  // states the price. Every button opens an email, there is no payment link.
  const cta = `mailto:${EMAIL}?subject=${encodeURIComponent(`${o.name}: let's start`)}`;
  const price = `${eur(o.price)} ${o.currency}`;
  const included = INCLUDED(o);

  // PL: lejek(): "Ludzie szukają pomocy w X" / "Wchodzi na Twoją stronę" /
  // "Zostawia zgłoszenie" / "Nowych pacjentów miesięcznie".
  const FUNNEL = [
    {
      step: `People look for a ${o.procedure} in ${o.market}`,
      value: noData ? "—" : `approx. ${eur(o.searches)} / month`,
      pct: null as string | null,
    },
    {
      step: "Land on your website",
      value: noData ? "—" : `${range(f.visits)} people`,
      pct: `${Math.round(o.visitShare[0] * 100)}-${Math.round(o.visitShare[1] * 100)}%`,
    },
    { step: "Send an enquiry", value: noData ? "—" : `${range(f.enquiries)} people`, pct: "5-8%" },
    {
      step: "New patients a month",
      value: noData ? "—" : `${range(f.consultations)} new patients`,
      pct: "70%",
    },
  ];

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
            {/* PL: "Rezerwuję {miasto}" */}
            <Cta label={`I'm booking ${o.city}`} href={cta} />
          </span>
        </div>
      </header>

      {/* ── HERO: "Pacjenci sami Cię znajdą" ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 size-[28rem] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="mx-auto flex min-h-[calc(100svh-64px)] max-w-5xl flex-col justify-center px-5 pb-10 text-center">
          <Reveal>
            <h1 className="text-[clamp(1.55rem,8vw,2.6rem)] font-semibold leading-[1.08] tracking-tight text-zinc-900 sm:text-7xl sm:leading-[1.03]">
              Patients
              <br />
              <Accent>will find you themselves</Accent>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            {/* PL clinic subtitle: "Zamiast konkurować z innymi, pokaż pacjentom,
                że jesteś ich najlepszym wyborem." */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
              Instead of competing with others, show patients
              <br />
              that you are their best choice.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <ul className="mx-auto mt-9 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
              {HERO_POINTS.map((t) => (
                <li key={t} className={`${CARD} flex items-start gap-3 p-4 text-[0.95rem]`}>
                  <Tick>✓</Tick>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          {/* Partner logos under the three points (USER_001 22.09), the same
              files as public/partnerzy on lovemyself.pl. USER confirmed 11.08
              these are real partnerships. */}
          <Reveal delay={360}>
            {/* Thin dividers between the logos (USER_001 22.09), the same
                layout as Partnerzy on lovemyself.pl: a divider row on wide
                screens, stacked with horizontal lines on the phone. */}
            <div className="mx-auto mt-10 flex max-w-2xl flex-col items-stretch divide-y divide-zinc-200 sm:flex-row sm:divide-x sm:divide-y-0">
              {[
                { name: "LUX MED", file: "/partnerzy/luxmed.png" },
                { name: "Medicover", file: "/partnerzy/medicover.svg" },
                { name: "ALAB", file: "/partnerzy/alab.svg" },
              ].map((p) => (
                <div key={p.name} className="flex flex-1 items-center justify-center px-6 py-5 sm:py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.file} alt={p.name} className="h-8 w-auto object-contain opacity-75 sm:h-10" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── "Jak wygląda Twój miesiąc?" ── */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              What does <Accent>your month look like?</Accent>
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

      {/* ── "Ile na tym zarobisz?" (no calculator in clinic mode) ── */}
      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              How much will you <Accent>earn on this?</Accent>
            </h2>
          </Reveal>

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {FUNNEL.map((l, i) => (
              <Reveal key={l.step} delay={i * 90}>
                <div
                  className={`${CARD} flex items-center justify-between gap-4 p-5 ${
                    i === FUNNEL.length - 1 ? "ring-2 ring-cyan-500" : ""
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

          {/* PL: panel "Nasza praca X zł / msc." + "Co otrzymasz" + "Bonusy" */}
          <Reveal delay={120}>
            <div className={`${CARD} mx-auto mt-10 max-w-3xl overflow-hidden ring-2 ring-cyan-500`}>
              <div className="bg-white/60 px-4 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Our work</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 sm:text-2xl">
                  {price} / month
                </p>
              </div>
              <div className="border-t border-zinc-200 px-6 py-6 sm:px-8">
                <p className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                  What you will receive
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
                      <Tick color="#5856d6">+</Tick>
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
              {/* PL: "Tak! to coś dla mnie!" */}
              <Cta label="Yes! This is for me!" href={cta} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Social proof: "+250 specjalistów otrzymało od nas pacjentów" ── */}
      <section className="mx-auto max-w-5xl px-5 pb-4 pt-12 sm:pt-16">
        <Reveal>
          <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            <Accent>+{SPECIALISTS}</Accent> specialists
            <br />
            have received patients from us
          </h2>
        </Reveal>
        <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CLIENTS.map((k, i) => (
            <Reveal key={k.name} delay={i * 60}>
              <div className={`${CARD} h-full p-5 text-center`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={k.file} alt={k.name} className="mx-auto size-20 rounded-full object-cover" />
                <p className="mt-3 text-[0.95rem] font-semibold leading-tight text-zinc-900">{k.name}</p>
                <span className="mt-2 inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  {k.title}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <div className="mt-9 text-center">
            {/* PL: "Chcę do nich dołączyć" */}
            <Cta label="I want to join them" href={cta} big />
          </div>
        </Reveal>
      </section>

      {/* ── "3 miesiące Gwarancji" ── */}
      <section className="mx-auto max-w-3xl px-5 py-12 text-center sm:py-16">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            3 months of <Accent>Guarantee</Accent>
          </h2>
          <div className={`${CARD} mt-8 p-8`}>
            <p className="text-lg font-semibold text-zinc-900">
              For 3 months we show you the report from the analytics tools.
            </p>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              If your clinic&apos;s impressions have not grown,
              <br />
              we refund the money for the last month.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── "Co jeśli nie podejmiesz współpracy?" ── */}
      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:py-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              What if you <Accent>don&apos;t start the partnership?</Accent>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
              Your potential patients will go to another specialist.
            </p>
            <div className="mt-8">
              {/* PL: "Chcę dołączyć!" */}
              <Cta label="I want to join!" href={cta} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CEO + Płatności ── */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className={`${CARD} h-full p-7`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">CEO</p>
                <div className="mt-4 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/profilowe_jakub.png"
                    alt="Jakub Chodakowski"
                    className="size-16 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xl font-semibold text-zinc-900">Jakub Chodakowski</p>
                    <p className="text-sm text-zinc-600">founder</p>
                  </div>
                </div>
                <table className="mt-5 w-full border-collapse text-sm">
                  <tbody>
                    {[
                      ["Phone", "+48 506 151 615"],
                      ["E-mail", EMAIL],
                      ["Tax ID (PL)", "6711845485"],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-zinc-200 last:border-0">
                        <td className="py-2.5 pr-4 text-zinc-500">{k}</td>
                        <td className="break-all py-2.5 text-right font-medium text-zinc-900">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className={`${CARD} h-full p-7`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Payments and invoices
                </p>
                <p className="mt-4 text-xl font-semibold text-zinc-900">You pay by bank transfer</p>
                <ul className="mt-4 space-y-3">
                  {[
                    "An invoice for your company's details for every month.",
                    `Issued in ${o.currency}, VAT reverse charge for EU businesses.`,
                    "We take no commission on the patient's payment.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm leading-relaxed">
                      <Tick>✓</Tick>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                {/* USER_001 22.09: no card payment on the page (clinics buy
                    after a call, on an invoice), so no Stripe/Visa marks. */}
                <p className="mt-6 text-sm leading-relaxed text-zinc-500">
                  The first invoice is issued once we agree to start. You can cancel before any month, with
                  no notice period.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <Reveal>
          <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            <Accent>FAQ</Accent>
          </h2>
        </Reveal>
        <div className="mt-9 space-y-3">
          {FAQ.map((f, i) => (
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

      {/* ── "Rezerwujesz {miasto}?" + PS ── */}
      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:py-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              Are you booking <Accent>{o.city}?</Accent>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600">
              {price} a month, no fixed-term contract.
              <br />
              The partnership renews every month.
            </p>
            <div className="mt-8">
              {/* PL: "Chcę nowych pacjentów!" */}
              <Cta label="I want new patients!" href={cta} big />
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              The button opens an e-mail to me. The invoice goes out the same day.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mx-auto mt-12 max-w-2xl border-t border-zinc-200 pt-8 text-left">
              {/* PL clinic PS: "X zł miesięcznie to ułamek ceny jednego zabiegu.
                  Jeśli przyjdzie choćby jeden nowy pacjent, wychodzisz na plus,
                  a przy dwóch zarabiasz drugie tyle. Jeśli przez 3 miesiące
                  wyświetlenia nie urosną, oddajemy pieniądze za ostatni miesiąc." */}
              <p className="text-sm leading-relaxed text-zinc-600">
                <strong className="text-zinc-900">PS.</strong> {price} a month is a fraction of
                the price of one procedure. If even one new patient comes, you are in profit, and with two you
                earn as much again. If impressions do not grow within 3 months, we give back the money for the
                last month.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-10 sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/profilowe_jakub.png" alt="Jakub Chodakowski" className="size-9 rounded-full object-cover" />
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900">Jakub Chodakowski</span>
          </span>
          <p className="text-center text-xs text-zinc-500 sm:text-right">
            Jakub Chodakowski, Tax ID (PL) 6711845485, {EMAIL}
          </p>
        </div>
      </footer>
    </div>
  );
}
