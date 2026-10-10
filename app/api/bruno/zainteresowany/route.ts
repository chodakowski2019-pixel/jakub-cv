import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, pobierzRozmowy } from "@/lib/bruno/db";
import { SKRZYNKA_JAKUBA, htmlZainteresowany, wyslij } from "@/lib/bruno/mail";

export const dynamic = "force-dynamic";

// „Odblokuj pełen dostęp" → formularz „Jestem zainteresowany" → mail do USER_001,
// który dzwoni i wycenia (decyzja 30.09: sprzedaż po rozmowie, nie Stripe).
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const wiadomosc = String(b.wiadomosc ?? "").slice(0, 2000);
  try {
    const { error } = await supabaseAdmin.from("bruno_zainteresowani").insert({ email, wiadomosc });
    if (error) console.error("bruno_zainteresowani", error.code, error.message);
    const konto = await pobierzKonto(email);
    const rozmowy = (await pobierzRozmowy(email, 100)).filter((r) => r.status === "zakonczona" && r.ocena);
    const srednia = rozmowy.length ? Math.round((rozmowy.reduce((s, r) => s + (r.ocena ?? 0), 0) / rozmowy.length) * 10) / 10 : null;
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Bruno AI: ZAINTERESOWANY ${konto?.imie ?? email}${konto?.firma ? ` (${konto.firma})` : ""}`,
      html: htmlZainteresowany({ email, imie: konto?.imie ?? null, firma: konto?.firma ?? null, wiadomosc, rozmow: rozmowy.length, sredniaOcena: srednia }),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno zainteresowany]", e);
    return NextResponse.json({ ok: false, blad: "Couldn't send. Try again." }, { status: 500 });
  }
}
