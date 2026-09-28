import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

// Lead form SalesAI (/aisaleskontakt). Wzór: /api/formularzdlarodzicow.
// Mail leci z hello@jakubchodakowski.com na skrzynkę USER_001, reply-to = lead.
// Kopia w Supabase jest best-effort: jeśli tabela salesai_leady nie istnieje,
// mail i tak pójdzie.

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const data = await req.json();

  const { imie, email, telefon, zawod, zgoda } = data;

  // Telefon jest opcjonalny (decyzja USER_001 28.09): przy ruchu z reklamy
  // to pole o najwyzszym oporze, a do odpisania wystarczy mail.
  if (!imie || !email || !zawod || !zgoda) {
    return NextResponse.json({ ok: false, blad: "Brak wymaganych pól" }, { status: 400 });
  }

  try {
    await supabaseAdmin.from("salesai_leady").insert({
      imie,
      email,
      telefon,
      zawod,
      zgoda: Boolean(zgoda),
    });
  } catch (err) {
    console.error("supabase insert failed", err);
  }

  const html = `
    <h2>Nowy lead — SalesAI (pilotaż)</h2>

    <p><b>Imię:</b> ${imie}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Telefon:</b> ${telefon || "nie podano"}</p>
    <p><b>Zawód:</b> ${zawod}</p>
    <p><b>Zgoda na kontakt:</b> ${zgoda ? "tak" : "nie"}</p>
  `;

  try {
    await resend.emails.send({
      from: "SalesAI <hello@jakubchodakowski.com>",
      to: "chodakowski2019@gmail.com",
      replyTo: email,
      subject: `SalesAI — ${imie}, ${zawod}${telefon ? ` (${telefon})` : ""}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
