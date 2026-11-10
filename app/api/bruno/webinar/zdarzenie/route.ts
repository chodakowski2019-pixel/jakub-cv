import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { WEBINAR } from "@/lib/bruno/webinar";

export const dynamic = "force-dynamic";

// POST /api/bruno/webinar/zdarzenie: 2 pierwsze etapy lejka webinaru (10.11, USER_001: „śledzić każdy etap”).
// { zdarzenie: "wejscie" | "klik", sesja, zrodlo } → `bruno_webinar_zdarzenia`, jeden wiersz na sesję i zdarzenie.
// Bez danych osobowych: sesja = losowy identyfikator z sessionStorage. Boty pomijane po nagłówku User-Agent.
// Raport: node --env-file=.env.local scripts/bruno-webinar.mjs lejek
const BOT = /bot|crawl|spider|facebookexternalhit|preview|headless|lighthouse|monitor/i;

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const zdarzenie = b.zdarzenie === "klik" ? "klik" : b.zdarzenie === "wejscie" ? "wejscie" : null;
  const sesja = String(b.sesja ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 40);
  if (!zdarzenie || sesja.length < 8 || BOT.test(req.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true });
  const zrodlo = String(b.zrodlo ?? "").slice(0, 120) || null;
  const { error } = await supabaseAdmin.from("bruno_webinar_zdarzenia").upsert({ webinar: WEBINAR.klucz, zdarzenie, sesja, zrodlo }, { onConflict: "webinar,zdarzenie,sesja", ignoreDuplicates: true });
  if (error) console.error("[bruno webinar zdarzenie]", error.message);
  return NextResponse.json({ ok: true });
}
