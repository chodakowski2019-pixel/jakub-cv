import { NextResponse } from "next/server";
import { CIASTECZKO_PRACA } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/konto/wyloguj (17.10)
export async function POST() {
  const odp = NextResponse.json({ ok: true });
  odp.cookies.set(CIASTECZKO_PRACA, "", { path: "/", maxAge: 0 });
  return odp;
}
