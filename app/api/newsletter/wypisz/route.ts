import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/newsletter/wypisz?t=<token>: „Wypisz się” z maila (22.11.2026, wzór: app/api/bruno/webinar/wypisz).
// Jedno kliknięcie, bez pytań. Nieznany token też kończy się komunikatem „wypisano”: nikt nie dostaje błędu przy wypisaniu.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("t") ?? "").trim();
  const baza = `${url.protocol}//${req.headers.get("host") ?? "jakubchodakowski.com"}`;
  if (/^[a-f0-9]{32}$/.test(token)) {
    const { error } = await supabaseAdmin.from("jc_newsletter").update({ wypisano: new Date().toISOString() }).eq("token", token).is("wypisano", null);
    if (error) console.error("[newsletter wypisz]", error.message);
  }
  return NextResponse.redirect(`${baza}/?newsletter=wypisano#newsletter`, 302);
}
