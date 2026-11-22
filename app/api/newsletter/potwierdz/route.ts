import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mailWitaj, wyslijMail } from "@/lib/newsletter-marka";

export const dynamic = "force-dynamic";

// GET /api/newsletter/potwierdz?t=<token>: klik w „Potwierdzam zapis” (22.11.2026, wzór: app/api/bruno/webinar/potwierdz).
// Ustawia `potwierdzono`, wysyła raz mail powitalny z linkiem „Wypisz się”, wraca na stronę główną z komunikatem.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("t") ?? "").trim();
  const baza = `${url.protocol}//${req.headers.get("host") ?? "jakubchodakowski.com"}`;
  if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.redirect(`${baza}/?newsletter=zly-link#newsletter`, 302);
  const { data: z, error } = await supabaseAdmin.from("jc_newsletter").select("id, email, imie, zrodlo, potwierdzono, chce_webinar").eq("token", token).maybeSingle();
  if (error || !z) {
    if (error) console.error("[newsletter potwierdz] baza", error.message);
    return NextResponse.redirect(`${baza}/?newsletter=zly-link#newsletter`, 302);
  }
  if (!z.potwierdzono) {
    const { error: e } = await supabaseAdmin.from("jc_newsletter").update({ potwierdzono: new Date().toISOString(), wypisano: null }).eq("id", z.id);
    if (e) console.error("[newsletter potwierdz] zapis", e.message);
    try {
      const m = mailWitaj({ baza, wypisz: `${baza}/api/newsletter/wypisz?t=${token}`, webinar: z.chce_webinar, rodzice: z.zrodlo === "rodzice", imie: z.imie });
      await wyslijMail({ do: z.email, temat: m.temat, html: m.html });
    } catch (e) {
      console.error("[newsletter potwierdz] mail powitalny", e);
    }
  }
  // 22.11 (2): zapis z webinaru dla rodziców wraca na jego stronę „Gotowe, masz miejsce”.
  if (z.zrodlo === "rodzice") return NextResponse.redirect(`${baza}/webinar-dla-rodzicow/dzieki?potwierdzone=1`, 302);
  return NextResponse.redirect(`${baza}/?newsletter=potwierdzony#newsletter`, 302);
}
