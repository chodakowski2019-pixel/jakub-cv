// Offer pages for clinics abroad (USER_001 2026-09-22), the same mechanism
// as lovemyself.pl/klinikaoferta: one page, content picked by ?k=<key>, the
// link is sent by name in an email, the page is noindex and reports every
// visit by email (/api/offer-view).
//
// First clinic: Ailesbury Hair Clinic, Dublin. Ioannis Ypatidis replied on
// 21.09 to the cold email sent from hello@jakubchodakowski.com ("can you
// please send me more detail about the SEO work you can deliver and what is
// the cost?").
//
// ⛔ Keep this file free of working notes in string fields: it is imported by
// a client component, so every string ends up in the JS bundle the clinic
// downloads. Reasoning stays in comments (stripped by the minifier).

export type ClinicOffer = {
  /** Clinic name exactly as they use it. */
  name: string;
  city: string;
  country: string;
  /** Market the search volume is measured for ("Ireland"). Exclusivity stays per city. */
  market: string;
  /** Procedure we build the channel for. */
  procedure: string;
  /** Main phrase we work on. */
  phrase: string;
  /** How this patient searches (one or two sentences). */
  searching: string;
  /** Who we address on the page. */
  person: string;
  /** Monthly searches for the phrase cluster in this market. 0 = not measured. */
  searches: number;
  /** Share of searches that land on the clinic's site once it ranks [min, max]. */
  visitShare: [number, number];
  /** Cap on consultations a month the clinic can realistically take [min, max]. */
  cap: [number, number];
  /** Typical price of one procedure, EUR, for the "one procedure pays for the year" line. */
  procedurePriceEur: number;
  /** Monthly fee, EUR. */
  priceEur: number;
  /** Stripe Payment Link in EUR. Missing = CTA opens an email instead. */
  paymentLink?: string;
  /** Extra sentence for the "what if you don't" section. */
  warning?: string;
};

// ── Ailesbury Hair Clinic, Dublin ─────────────────────────────────────────
// Price 2 000 EUR/mo (USER_001 22.09, first draft had 590 = Polish SEO+
// converted). Dublin market check the same day: agencies with public prices
// start at the same level (Webjuice 1 497-3 500, &Grow 1 500-5 000+, Riordan
// up to 1 500), "SEO cost Ireland" guides give 800-3 500 for a service
// business in a competitive city, medical/aesthetic SEO in UK 1 500-5 000 GBP.
// The cold email promised: own patient channel, site optimised for Dublin,
// no commission, exclusivity (one clinic in Dublin). Kept on the page.
//
// Research 22.09.2026 (web, sources in memory project_gabi_oferta_kliniki_zagranica):
// - their own price page: FUE/AHI 4 000-7 500 EUR, eyebrows 2 000-3 500 EUR,
//   so procedurePriceEur = 5 500 (middle of their range),
// - legal entity Fleming Place Health Clinic Ltd, founded 07.2024, micro
//   company, Ioannis Ypatidis = CEO; Google 4.9 / 282 reviews on their site,
//   IG 29 000 followers, Facebook dead (59 likes), Trustpilot 3.7 unclaimed,
// - they ALREADY have SEO basics: WordPress + Yoast, landing pages for
//   "Non-Shave FUE Ireland", "DHI Ireland", "Cork", 20 blog posts (irregular,
//   none in 07-08.2026), FAQ schema. Gaps: no MedicalClinic/LocalBusiness
//   schema, ~40 DE/FR pages without hreflang, blog irregular. Hence the
//   "technical fixes" line in INCLUDED and no talk of "building a site",
// - GTM carries Google Ads, Meta and TikTok pixels: they pay for leads today,
// - Dublin competition publishes prices harder (Total Hair 6 495, Grow Club
//   from 3 499, Tir na nOg 2 000-5 000) with similar Google ratings (4.8-4.9).
//
// searches: NO public source gives Irish volumes for "hair transplant
// Dublin / Ireland / cost" (agent research 22.09: Semrush/Ahrefs previews,
// Google Trends, Irish agency articles, all empty). ESTIMATE used instead,
// the same way as KPU Lublin on the Polish side when the Planner was silent:
//   UK cluster "hair transplant" = 77 170/mo (Keyword Planner via Istanbul
//   Care study, goodmenproject.com, 2025/26) x population ratio IE/UK
//   5.3 M / 68 M = 0.078 → ~6 000/mo for the whole of Ireland. Google Trends
//   2018-2023 puts Ireland at 92 vs UK 89 per capita (PMC13143260), so the
//   ratio does not overstate. Rounded DOWN to 6 000.
//   The market is national, like hair transplants in Poland: the patient
//   travels for the procedure, so the funnel says "in Ireland" and the
//   exclusivity stays "one clinic in Dublin".
// visitShare cut to 1-2% (not the default 2-4%): a national cluster mixes
// head terms held by comparison portals and Turkish clinics with a long tail
// we can win, the same reasoning as LUX MED (0.3-0.8%) vs Medmix (2-4%) on
// the Polish side.
// ⚠️ Replace with a Keyword Planner (Ireland) reading as soon as USER_001
// runs it; 6 000 is an estimate, not a measurement.
export const CLINIC_OFFERS: Record<string, ClinicOffer> = {
  ailesbury: {
    name: "Ailesbury Hair Clinic",
    city: "Dublin",
    country: "Ireland",
    market: "Ireland",
    procedure: "hair transplant",
    phrase: "hair transplant Dublin",
    searching:
      "A man thinking about a hair transplant searches Google for months. He compares methods, prices per graft and before-and-after photos, and reads about clinics in Turkey, before he books a single consultation.",
    person: "Ioannis",
    searches: 6000,
    visitShare: [0.01, 0.02],
    cap: [3, 10],
    procedurePriceEur: 5500,
    // USER_001 22.09: 2 000 EUR/mc (was 590 = Polish SEO+ converted).
    // ⚠️ The cold email of 20.09 promised "one procedure a year covers the
    // cost of the whole partnership": at 2 000 EUR/mo that is 24 000 EUR a
    // year vs 4 000-7 500 EUR per FUE, so that sentence is no longer true and
    // must not be repeated in the reply. The page itself says "a fraction of
    // the price of one procedure" (2 000 of 5 500), which holds.
    priceEur: 2000,
    warning:
      "The next patient who searches for a hair transplant in Dublin will land on a comparison portal or a clinic in Istanbul.",
  },
};

export const DEFAULT_PRICE_EUR = 2000;

// Funnel: the same market ranges as the Polish offers (lib/oferta-miasta.ts).
// 2-4% of city searches land on the site, 5-8% of visitors send an enquiry,
// 70% of enquiries turn into a consultation. Each end is capped by what the
// clinic can take.
export const ENQUIRY_SHARE: [number, number] = [0.05, 0.08];
export const TO_CONSULTATION = 0.7;

const round = (x: number) => (x >= 100 ? Math.round(x / 10) * 10 : Math.round(x));

export function funnel(o: ClinicOffer) {
  const visits: [number, number] = [
    round(o.searches * o.visitShare[0]),
    round(o.searches * o.visitShare[1]),
  ];
  const enquiries: [number, number] = [
    Math.round(visits[0] * ENQUIRY_SHARE[0]),
    Math.round(visits[1] * ENQUIRY_SHARE[1]),
  ];
  const market: [number, number] = [
    Math.round(enquiries[0] * TO_CONSULTATION),
    Math.round(enquiries[1] * TO_CONSULTATION),
  ];
  const consultations: [number, number] = [
    Math.min(market[0], o.cap[0]),
    Math.min(market[1], o.cap[1]),
  ];
  return { visits, enquiries, consultations };
}
