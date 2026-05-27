import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, email, linkedin, company, role, why } = await req.json();

  const esc = (s: string) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const html = `
    <h2>Scam Alert Miami — nowa aplikacja</h2>
    <p><b>Imię i nazwisko:</b> ${esc(name)}</p>
    <p><b>Email:</b> ${esc(email)}</p>
    <p><b>LinkedIn:</b> <a href="${esc(linkedin)}">${esc(linkedin)}</a></p>
    <p><b>Firma / projekt:</b> ${esc(company)}</p>
    <h3>Czym się zajmuje w Miami</h3>
    <p>${esc(role).replace(/\n/g, "<br/>")}</p>
    <h3>Dlaczego chce dołączyć</h3>
    <p>${esc(why).replace(/\n/g, "<br/>")}</p>
    <hr/>
    <p style="color:#888;font-size:12px">Sprawdź LinkedIn + firmę. Odpowiedz w ciągu 7 dni.</p>
  `;

  try {
    await resend.emails.send({
      from: "Scam Alert Miami <onboarding@resend.dev>",
      to: "hello@jakubchodakowski.com",
      replyTo: email,
      subject: `Scam Alert Miami — ${name} (${company})`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
