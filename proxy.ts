import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // --- Język strony głównej ---
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
  matcher: ["/", "/en", "/scamalertmiami/:path*"],
};
