import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";

export const dynamic = "force-dynamic";

// POST /api/bruno/tour: film oprowadzający obejrzany (albo pominięty), nie pokazuj więcej.
export async function POST() {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const { error } = await supabaseAdmin.from("bruno_konta").update({ tour_obejrzany_at: new Date().toISOString() }).eq("email", email);
  if (error) return NextResponse.json({ ok: false, blad: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
