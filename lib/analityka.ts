// 22.11.2026 (USER_001: „na stronie ma być też bardzo dobra analityka, wszystkie narzędzia analityczne podpięte, piksele itd.”).
// JEDNO MIEJSCE na identyfikatory wszystkich narzędzi marki jakubchodakowski.com.
// Pusty identyfikator = narzędzie się nie ładuje. Identyfikatory są publiczne (widać je w kodzie każdej strony), to nie sekrety.
//
// Zasady (RODO + prawo telekomunikacyjne):
// - nic poza Vercel Web Analytics (bez ciasteczek) nie startuje przed zgodą w banerze (components/analityka/Zgoda.tsx);
// - dwie osobne zgody: „analityka” (GA4, Clarity) i „marketing” (piksele reklamowe, Google Ads);
// - tylko na jakubchodakowski.com. Domeny Bruno (salesbruno.*) mają osobne zasady i tu nic się nie ładuje;
// - na localhost baner działa, ale skrypty się NIE ładują, zdarzenia lecą tylko do konsoli (żeby nie brudzić danych).
// Zmiana listy narzędzi = poprawka polityki prywatności (app/polityka-prywatnosci, punkt 8) w tym samym zadaniu.

export const ANALITYKA = {
  /** Google Analytics 4, identyfikator pomiaru „G-XXXXXXX”. */
  ga4: "",
  /** Google Ads, „AW-XXXXXXXXX”. */
  googleAds: "",
  /** Google Ads, etykieta konwersji „zapytanie o szkolenie” (część po ukośniku w „AW-…/etykieta”). */
  googleAdsEtykietaLead: "",
  /** Microsoft Clarity, identyfikator projektu (np. „abc123xyz”). Mapy kliknięć i nagrania sesji. */
  clarity: "",
  /** Meta (Facebook + Instagram) Pixel, sam numer. */
  metaPixel: "",
  /** TikTok Pixel, identyfikator piksela. */
  tiktokPixel: "",
  /** LinkedIn Insight Tag, Partner ID (sam numer). */
  linkedinPartner: "",
};

export const KLUCZ_ZGODY = "jc-zgoda-v1";
export const ZDARZENIE_OTWORZ_ZGODY = "jc-zgoda-otworz";

export type Zgody = { analityka: boolean; marketing: boolean };

/** Domena marki (tu działa baner). */
export function hostMarki(host: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  return h === "jakubchodakowski.com" || h === "www.jakubchodakowski.com" || h === "localhost" || h === "127.0.0.1";
}

/** Lokalnie: baner tak, skrypty nie. */
export function hostTestowy(host: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  return h === "localhost" || h === "127.0.0.1";
}

export function czytajZgody(): Zgody | null {
  try {
    const z = JSON.parse(localStorage.getItem(KLUCZ_ZGODY) ?? "null");
    if (z && typeof z.analityka === "boolean" && typeof z.marketing === "boolean") return { analityka: z.analityka, marketing: z.marketing };
  } catch {
    // prywatne okno albo zablokowany storage: traktujemy jak brak decyzji
  }
  return null;
}

/** Zdarzenia biznesowe marki. Jedna nazwa u nas → odpowiednik w każdym narzędziu. */
export type NazwaZdarzenia = "lead_szkolenie" | "zapis_newsletter" | "zapis_webinar" | "wybor_segmentu";

type Okno = Window & {
  gtag?: (...a: unknown[]) => void;
  fbq?: (...a: unknown[]) => void;
  ttq?: { track: (n: string, d?: object) => void };
  lintrk?: (...a: unknown[]) => void;
};

const GA4: Record<NazwaZdarzenia, string> = {
  lead_szkolenie: "generate_lead",
  zapis_newsletter: "sign_up",
  zapis_webinar: "sign_up",
  wybor_segmentu: "select_content",
};
const META: Record<NazwaZdarzenia, [string, boolean]> = {
  // [nazwa, czy standardowe zdarzenie Mety]
  lead_szkolenie: ["Lead", true],
  zapis_newsletter: ["CompleteRegistration", true],
  zapis_webinar: ["CompleteRegistration", true],
  wybor_segmentu: ["WyborSegmentu", false],
};
const TIKTOK: Partial<Record<NazwaZdarzenia, string>> = {
  lead_szkolenie: "SubmitForm",
  zapis_newsletter: "CompleteRegistration",
  zapis_webinar: "CompleteRegistration",
};

/** Wysyła zdarzenie do wszystkich narzędzi, które są załadowane (czyli mają zgodę i identyfikator). */
export function zdarzenie(nazwa: NazwaZdarzenia, dane: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const w = window as Okno;
  if (hostTestowy(location.host)) {
    console.info("[analityka, tryb lokalny]", nazwa, dane);
    return;
  }
  w.gtag?.("event", GA4[nazwa], { ...dane, zdarzenie: nazwa });
  if (nazwa === "lead_szkolenie" && ANALITYKA.googleAds && ANALITYKA.googleAdsEtykietaLead)
    w.gtag?.("event", "conversion", { send_to: `${ANALITYKA.googleAds}/${ANALITYKA.googleAdsEtykietaLead}` });
  const [m, std] = META[nazwa];
  w.fbq?.(std ? "track" : "trackCustom", m, dane);
  const t = TIKTOK[nazwa];
  if (t) w.ttq?.track(t, dane);
}
