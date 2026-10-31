import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { wyslij } from "@/lib/bruno/mail";
import { ADRES_WEBINARU, NADAWCA_WEBINARU, mailWebinarPotwierdzenie } from "@/lib/bruno/mail-webinar";
import { WEBINAR } from "@/lib/bruno/webinar";

export const dynamic = "force-dynamic";

// GET /api/bruno/webinar/potwierdz?t=<token>: klik w „Potwierdzam zapis »” z maila M0 (double opt-in, 29.10, Aniserowicz).
// Klik = zgoda na komunikację + dowód, że adres należy do klikającego. Wtedy: `potwierdzono`, mail M0b z linkiem Zoom
// (raz; drugi klik = tylko przekierowanie) i strona „Dzięki bardzo” (/webinar/dzieki-bardzo) z linkiem i kalendarzem.
// Zły / nieznany token → strona zapisu z informacją.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("t") ?? "").trim();
  const baza = `${url.protocol}//${req.headers.get("host") ?? "salesbruno.pl"}`;
  if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.redirect(`${baza}/webinar?potwierdzenie=zly-link`, 302);

  const { data: z, error } = await supabaseAdmin
    .from("bruno_webinar_zapisy")
    .select("id, imie, email, potwierdzono, mail_potwierdzenie")
    .eq("webinar", WEBINAR.klucz)
    .eq("token", token)
    .maybeSingle();
  if (error || !z) {
    if (error) console.error("[bruno webinar potwierdz] baza", error.message);
    return NextResponse.redirect(`${baza}/webinar?potwierdzenie=zly-link`, 302);
  }

  if (!z.potwierdzono) {
    const { error: e } = await supabaseAdmin.from("bruno_webinar_zapisy").update({ potwierdzono: new Date().toISOString() }).eq("id", z.id);
    if (e) console.error("[bruno webinar potwierdz] zapis", e.message);
    console.log("[bruno webinar] potwierdzono", JSON.stringify({ email: z.email, kiedy: new Date().toISOString() }));
  }
  // Mail z linkiem Zoom tylko raz (kolumna `mail_potwierdzenie`), nawet gdy ktoś kliknie link drugi raz.
  if (!z.mail_potwierdzenie) {
    try {
      const m = mailWebinarPotwierdzenie({ imie: z.imie, baza, wypisz: `${baza}/api/bruno/webinar/wypisz?t=${token}`, test: `${baza}/webinar/dzieki-bardzo?t=${token}#test` });
      await wyslij({ do: z.email, od: NADAWCA_WEBINARU, replyTo: ADRES_WEBINARU, rodzaj: "webinar", temat: m.temat, html: m.html });
      await supabaseAdmin.from("bruno_webinar_zapisy").update({ mail_potwierdzenie: new Date().toISOString() }).eq("id", z.id);
    } catch (e) {
      console.error("[bruno webinar potwierdz] mail z linkiem", e);
      // Strona „Dzięki bardzo” i tak pokazuje link do Zooma, więc uczestnik nie zostaje bez linku.
    }
  }
  // 31.10 (USER_001): token w adresie, bo na tej stronie od razu robi test predyspozycji (wynik przypisany do zapisu).
  return NextResponse.redirect(`${baza}/webinar/dzieki-bardzo?t=${token}`, 302);
}
