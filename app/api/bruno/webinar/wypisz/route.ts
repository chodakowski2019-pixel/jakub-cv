import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { WEBINAR } from "@/lib/bruno/webinar";

export const dynamic = "force-dynamic";

// GET /api/bruno/webinar/wypisz?t=<token>: link „Wypisz się” z każdego maila (Aniserowicz 01-05 / 10-03: jedno kliknięcie,
// bez pytań, wypisuje ze wszystkiego). Ustawia `wypisano`; cron M1-M4 i skrypt M5 pomijają wypisanych. Potem strona /webinar/wypisano.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("t") ?? "").trim();
  const baza = `${url.protocol}//${req.headers.get("host") ?? "salesbruno.pl"}`;
  if (/^[a-f0-9]{32}$/.test(token)) {
    const { error } = await supabaseAdmin.from("bruno_webinar_zapisy").update({ wypisano: new Date().toISOString() }).eq("webinar", WEBINAR.klucz).eq("token", token).is("wypisano", null);
    if (error) console.error("[bruno webinar wypisz]", error.message);
  }
  // Nieznany token też ląduje na stronie „wypisano”: nikt nie ma dostać błędu przy próbie wypisania.
  return NextResponse.redirect(`${baza}/webinar/wypisano`, 302);
}
