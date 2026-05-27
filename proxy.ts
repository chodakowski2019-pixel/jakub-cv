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

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (!isGated(pathname)) return NextResponse.next();

  const token = searchParams.get("t");
  if (isValidMemberToken(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/scamalertmiami/members-only";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/scamalertmiami/:path*"],
};
