import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { jezykZHosta } from "@/lib/bruno/domeny";
import { CIASTECZKO_GOOGLE, adresPowrotu, googleSkonfigurowany, linkDoGoogle } from "@/lib/bruno/google";

export const dynamic = "force-dynamic";

// GET /api/bruno/google?pl → przekierowanie do Google. Stan (ochrona CSRF) + język w ciasteczku na 10 min.
export async function GET(req: Request) {
  const url = new URL(req.url);
  // 11.10: polski z domeny salesbruno.pl albo z ?pl.
  // 11.10: na domenie Bruno decyduje domena; ?pl tylko poza nią (lokalnie, podglądy).
  const pl = (jezykZHosta(req.headers.get("host")) ?? (url.searchParams.has("pl") ? "pl" : "en")) === "pl";
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
