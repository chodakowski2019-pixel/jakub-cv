import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { CIASTECZKO_GOOGLE, adresPowrotu, googleSkonfigurowany, linkDoGoogle } from "@/lib/bruno/google";

export const dynamic = "force-dynamic";

// GET /api/bruno/google?pl → przekierowanie do Google. Stan (ochrona CSRF) + język w ciasteczku na 10 min.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pl = url.searchParams.has("pl");
  if (!googleSkonfigurowany()) return NextResponse.redirect(new URL(`/bruno?blad=google${pl ? "&pl" : ""}`, url.origin));
  const stan = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(linkDoGoogle({ stan, powrot: adresPowrotu(url.origin) }));
  res.cookies.set(CIASTECZKO_GOOGLE, `${stan}.${pl ? "pl" : "en"}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
