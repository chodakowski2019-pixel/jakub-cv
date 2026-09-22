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
  /** Currency of this offer: the clinic's own, not ours. */
  currency: "EUR" | "NOK" | "SEK";
  /** Typical price of one procedure in that currency, for the "fraction of one procedure" line. */
  procedurePrice: number;
  /** Monthly fee in that currency. */
  price: number;
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
//   so procedurePrice = 5 500 EUR (middle of their range),
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
    currency: "EUR",
    procedurePrice: 5500,
    // USER_001 22.09: 2 000 EUR/mc (was 590 = Polish SEO+ converted), set
    // against their own price list (FUE 4 000-7 500 EUR) = 36% of one
    // procedure, and 8 700 zl, well over the 4 000 zl floor.
    // ⚠️ The cold email of 20.09 promised "one procedure a year covers the
    // cost of the whole partnership": at 2 000 EUR/mo that is 24 000 EUR a
    // year vs 4 000-7 500 EUR per FUE, so that sentence is no longer true and
    // must not be repeated in the reply. The page itself says "a fraction of
    // the price of one procedure" (2 000 of 5 500), which holds.
    price: 2000,
    warning:
      "The next patient who searches for a hair transplant in Dublin will land on a comparison portal or a clinic in Istanbul.",
  },

  // ── Scandinavian Hair Institute (Skandinavisk Hårinstitutt), Oslo ──────────
  // Dr Emil George (half Polish, writes in Polish) replied on 22.09.2026 at
  // 07:05 to the Norwegian cold email sent on 21.09 from
  // hello@jakubchodakowski.com, and at 08:09: "Może być. Zależy na oferty
  // konkretny" after USER_001 said he works remotely from Poland.
  // Clinic (their site, 22.09): FUE + FUT + beard, Oslo Kirkeveien 7A main,
  // also Stavanger and Trondheim (email footer lists Stockholm too), agency
  // built site (Journey Group) with a blog and SEO landing pages, Google 5.0
  // / 66 reviews, "one patient a day".
  // searches: no public Norwegian volume, ESTIMATE the same way as Ailesbury:
  // UK cluster 77 170/mo x population NO/UK 5.6 M / 68 M = 0.082 → ~6 300,
  // rounded DOWN to 5 000 because the Norwegian cluster splits between
  // "hårtransplantasjon" and English queries and part of it goes straight to
  // Turkish clinics. ⚠️ Replace with a Keyword Planner (Norway) reading.
  scandinavian: {
    name: "Scandinavian Hair Institute",
    city: "Oslo",
    country: "Norway",
    market: "Norway",
    procedure: "hair transplant",
    phrase: "hårtransplantasjon Oslo",
    searching:
      "A man thinking about a hair transplant searches Google for months. He compares methods, prices per graft and before-and-after photos, and reads about clinics in Turkey, before he books a single consultation.",
    person: "Emil",
    searches: 5000,
    visitShare: [0.01, 0.02],
    cap: [3, 10],
    // Cena w ICH walucie, ustawiona pod ICH cennik i pod ICH rynek agencyjny
    // (USER_001 22.09, obnizone z 20 000 po sprawdzeniu stawek):
    // - ich zabieg: norweskie FUE 30 000-85 000 NOK (cenniki Medicura i
    //   Poseidon, przewodnik altomnorge, 22.09.2026), srodek 55 000 NOK,
    // - rynek: norweskie agencje SEO biora 10 000-40 000 NOK/mc, SEO
    //   ogolnokrajowe (a przeszczep wlosow taki wlasnie jest) 15 000-30 000,
    //   lokalne 5 000-12 000 (mementor.no, moodymedia.io, nettify.no, 22.09).
    // 15 000 NOK/mc = dolny prog stawki krajowej, 27% ceny jednego zabiegu
    // i 6 040 zl, czyli ponad podloge 4 000 zl (w NOK: 9 900).
    // ⛔ Nie schodzic ponizej 10 000 NOK: w Norwegii taka cena czyta sie jako
    // amatorska i psuje pozycjonowanie oferty, a nie tylko marze.
    currency: "NOK",
    procedurePrice: 55000,
    price: 15000,
    warning:
      "The next patient who searches for a hair transplant in Oslo will land on a comparison portal or a clinic in Istanbul.",
  },
};

// ⚠️ CENA USTALANA PER KLINIKA (USER_001 2026-09-22). Nie ma jednej stawki:
// przed każdą ofertą sprawdzamy, ile TA klinika bierze za swoje zabiegi, i
// cenę ustawiamy pod to. Podłoga: 4 000 zł na rękę z jednej współpracy
// miesięcznie (kurs NBP 21.09.2026: 1 EUR = 4,353 zł, 1 NOK = 0,4026 zł,
// 1 SEK = 0,3862 zł), czyli nie schodzimy poniżej ~920 EUR / ~9 900 NOK /
// ~10 400 SEK miesięcznie.
export const MIN_MONTHLY_PLN = 4000;

// Klient nie płaci przez stronę: kupuje po rozmowie, na fakturę. Strona ma
// podać cenę, a nie zbierać płatność (USER_001 2026-09-22), więc żadnych
// Payment Linków tu nie ma i każdy guzik otwiera maila.

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
