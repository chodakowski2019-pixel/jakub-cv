import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const data = await req.json();

  const { imie, telefon, email, godziny, kontakt, wiekDziecka } = data;

  const html = `
    <h2>Nowe zgłoszenie — Szkolenia z AI dla dzieci i nastolatków</h2>

    <p><b>Imię:</b> ${imie}</p>
    <p><b>Telefon:</b> ${telefon}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Najlepsze godziny kontaktu:</b> ${godziny || "—"}</p>
    <p><b>Preferowany kontakt:</b> ${kontakt || "—"}</p>
    <p><b>Wiek dziecka:</b> ${wiekDziecka || "—"}</p>
  `;

  try {
    await resend.emails.send({
      from: "Szkolenia AI <onboarding@resend.dev>",
      to: "hello@jakubchodakowski.com",
      subject: `Szkolenia AI dla dzieci — ${imie} (${telefon})`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
