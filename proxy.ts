import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SCIEZKI, STARE_HANDLOWCY, adresBruno, jezykZHosta, type Jezyk } from "@/lib/bruno/domeny";

const GATED_PATHS = [
  "/scamalertmiami/report-scam",
  "/scamalertmiami/check-people",
];

function isGated(pathname: string): boolean {
  return GATED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isValidMemberToken(token: string | null): boolean {
  if (!token) return false;
  const allowed = (process.env.SCAM_ALERT_MEMBER_TOKENS ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return allowed.includes(token);
}

// Locale wybierany dla strony głównej: cookie ma pierwszeństwo, potem kraj.
// Spoza PL -> angielski. Brak danych o kraju (np. lokalnie) -> polski (canonical).
function pickLocale(request: NextRequest): "pl" | "en" {
  const cookieLang = request.cookies.get("lang")?.value;
  if (cookieLang === "pl" || cookieLang === "en") return cookieLang;
  const country = request.headers.get("x-vercel-ip-country");
  if (country && country !== "PL") return "en";
  return "pl";
}

function withLocaleHeader(request: NextRequest, locale: "pl" | "en") {
  const headers = new Headers(request.headers);
  headers.set("x-locale", locale);
  return NextResponse.next({ request: { headers } });
}

/** Stare adresy Bruno z jakubchodakowski.com (9-10.10). */
const STARE_BRUNO = ["/brunobusiness", "/brunoai", "/brunorejestracja", "/bruno", "/brunodemo"];

/** Nagłówki dla stron Bruno: ścieżka (blokada free w układzie) i język domeny. */
function dalej(request: NextRequest, pathname: string, jezyk: Jezyk | null, rewrite?: string) {
  const h = new Headers(request.headers);
  h.set("x-sciezka", pathname);
  if (jezyk) h.set("x-jezyk", jezyk);
  if (rewrite) {
    const url = request.nextUrl.clone();
    url.pathname = rewrite;
    return NextResponse.rewrite(url, { request: { headers: h } });
  }
  return NextResponse.next({ request: { headers: h } });
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get("host");

  // --- 11.10 (USER_001): DOMENY BRUNO. salesbruno.com = EN, salesbruno.pl = PL. Ładne adresy = rewrite
  // na istniejące strony, stare adresy = przekierowanie na ładne. Panel zostaje pod /bruno/... ---
  const jezyk = jezykZHosta(host);
  // 13.10: www.salesbruno.* → bez www (308). Inaczej logowanie Google wysyła adres powrotu z www,
  // którego nie ma w Google Cloud (redirect_uri_mismatch), a sesja żyje na dwóch osobnych hostach.
  const hostBezPortu = (host ?? "").toLowerCase().split(":")[0];
  if (jezyk && hostBezPortu.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.host = hostBezPortu.slice(4);
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  // 13.10 (USER_001): ikona karty na domenach Bruno pomarańczowa (jakubchodakowski.com zostaje zielona).
  const IKONY: Record<string, string> = { "/icon.svg": "/bruno/ikona.svg", "/favicon.ico": "/bruno/ikona.ico", "/apple-icon.png": "/bruno/ikona-apple.png" };
  if (IKONY[pathname]) {
    return jezyk ? NextResponse.rewrite(new URL(IKONY[pathname], request.url)) : NextResponse.next();
  }
  // 13.10 (USER_001): wejście z Polski (kraj z IP, nagłówek Vercela) na stronę firm albo handlowców salesbruno.com
  // → odpowiednik na salesbruno.pl. 307, bo wynik zależy od kraju. Rejestracja, logowanie i panel bez przekierowania
  // (sesja żyje osobno na każdej domenie). Link „English” na .pl daje ?lang=en = cookie na rok, bez przekierowania.
  if (jezyk === "en") {
    if (searchParams.get("lang") === "en") {
      const url = request.nextUrl.clone();
      url.searchParams.delete("lang");
      const odp = NextResponse.redirect(url, 307);
      odp.cookies.set("bruno_lang", "en", { maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax" });
      return odp;
    }
    const plOdpowiednik = pathname === SCIEZKI.en.firmy ? SCIEZKI.pl.firmy : null;
    if (plOdpowiednik && request.headers.get("x-vercel-ip-country") === "PL" && request.cookies.get("bruno_lang")?.value !== "en") {
      const cel = new URL(adresBruno("pl", plOdpowiednik));
      searchParams.forEach((v, k) => cel.searchParams.set(k, v));
      return NextResponse.redirect(cel, 307);
    }
  }
  // 17.10 (USER_001): /praca na domenach Bruno = portal ofert pracy dla handlowców (app/brunopraca).
  // Lokalnie (localhost) też, żeby dopracować bez domeny. jakubchodakowski.com/praca zostaje „Wkrótce”.
  if ((jezyk || hostBezPortu === "localhost") && (pathname === "/praca" || pathname.startsWith("/praca/"))) {
    return dalej(request, pathname, jezyk, `/brunopraca${pathname.slice("/praca".length)}`);
  }
  if (jezyk) {
    const P = SCIEZKI[jezyk];
    // 14.10 (USER_001): / = handlowcy (B2C), /wspolpraca | /business = firmy (B2B).
    // 17.10 (USER_001): Bruno tylko B2B: / = firmy, stare /wspolpraca, /business, /handlowcy, /reps → / (308).
    if (pathname === P.firmy) return dalej(request, pathname, jezyk, "/brunobusiness");
    if (pathname === P.rejestracja) return dalej(request, pathname, jezyk, "/brunorejestracja");
    // 21.10 (USER_001): /demo = kalendarz spotkania online (app/brunodemo). Każdy przycisk na LP prowadzi tu.
    if (pathname === P.demo) return dalej(request, pathname, jezyk, "/brunodemo");
    if (pathname === P.logowanie) return dalej(request, pathname, jezyk, "/bruno");
    // 12.10 (E11): /security (EN) = app/bezpieczenstwo. Na .pl adres jest ten sam, więc bez rewrite.
    if (pathname === P.bezpieczenstwo) return dalej(request, pathname, jezyk, pathname === "/bezpieczenstwo" ? undefined : "/bezpieczenstwo");
    const nowa: Record<string, string> = { "/brunobusiness": P.firmy, "/brunoai": P.handlowcy, "/brunorejestracja": P.rejestracja, "/bruno": P.logowanie, "/bezpieczenstwo": P.bezpieczenstwo, "/brunodemo": P.demo };
    for (const s of STARE_HANDLOWCY) nowa[s] = P.handlowcy;
    if (nowa[pathname]) {
      const url = request.nextUrl.clone();
      url.pathname = nowa[pathname];
      url.searchParams.delete("pl");
      return NextResponse.redirect(url, 308);
    }
    // Adres z drugiej domeny (np. /reps na .pl): na odpowiednik w tej domenie.
    const inny = SCIEZKI[jezyk === "pl" ? "en" : "pl"];
    const odpowiednik = pathname === inny.rejestracja ? P.rejestracja : pathname === inny.bezpieczenstwo ? P.bezpieczenstwo : null;
    if (odpowiednik) {
      const url = request.nextUrl.clone();
      url.pathname = odpowiednik;
      return NextResponse.redirect(url, 308);
    }
    if (pathname.startsWith("/bruno/")) return dalej(request, pathname, jezyk);
    return dalej(request, pathname, jezyk);
  }

  // --- 11.10: na jakubchodakowski.com nie zostaje nic z Bruno. 301 na salesbruno.com, z ?pl na salesbruno.pl.
  // Tylko produkcyjna domena: lokalnie i na podglądach Vercela Bruno działa dalej pod starymi adresami. ---
  const naJakubie = (host ?? "").toLowerCase().split(":")[0].endsWith("jakubchodakowski.com");
  if (naJakubie && (STARE_BRUNO.includes(pathname) || pathname.startsWith("/bruno/"))) {
    const j: Jezyk = searchParams.has("pl") ? "pl" : "en";
    const P = SCIEZKI[j];
    const sciezka =
      pathname === "/brunobusiness" ? P.firmy : pathname === "/brunoai" ? P.handlowcy : pathname === "/brunorejestracja" ? P.rejestracja : pathname === "/bruno" ? P.logowanie : pathname === "/brunodemo" ? P.demo : pathname;
    const cel = new URL(adresBruno(j, sciezka));
    searchParams.forEach((v, k) => {
      if (k !== "pl") cel.searchParams.set(k, v);
    });
    return NextResponse.redirect(cel, 301);
  }

  // --- 10.10: /bruno/panel ma własny układ (czarny ze złotym), app/bruno/layout.tsx czyta ścieżkę z nagłówka.
  // 10.10 wieczór: nagłówek dla całego /bruno, bo układ blokuje konto free po 3 rozmowach (poza Odblokuj / Feedback / Ustawienia). ---
  if (pathname === "/bruno" || pathname.startsWith("/bruno/")) {
    return dalej(request, pathname, searchParams.has("pl") ? "pl" : null);
  }

  // --- Strona główna (9.10): / = app/page.tsx (nowa, PL). /en = public/home.html (5.10, EN) ---
  if (pathname === "/en") {
    return NextResponse.rewrite(new URL("/home.html", request.url));
  }
  if (pathname === "/") {
    return NextResponse.next();
  }

  // --- Język strony głównej (nieużywane od 5.10, zostaje na powrót) ---
  if (pathname === "/") {
    const locale = pickLocale(request);
    if (locale === "en") {
      const url = request.nextUrl.clone();
      url.pathname = "/en";
      return NextResponse.redirect(url);
    }
    return withLocaleHeader(request, "pl");
  }
  if (pathname === "/en") {
    return withLocaleHeader(request, "en");
  }

  // --- Gated scamalert paths ---
  if (!isGated(pathname)) return NextResponse.next();

  const token = searchParams.get("t");
  if (isValidMemberToken(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/scamalertmiami/members-only";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  // 11.10: domeny Bruno łapią wszystko poza plikami statycznymi i API (strony Jakuba na salesbruno też dostają x-jezyk).
  matcher: ["/((?!api/|_next/|favicon|icon|apple-icon|.*\\.[a-z0-9]{2,5}$).*)", "/icon.svg", "/favicon.ico", "/apple-icon.png"],
};
