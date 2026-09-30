import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CIASTECZKO } from "@/lib/bruno/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const c = await cookies();
  c.set(CIASTECZKO, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
