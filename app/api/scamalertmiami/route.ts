import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, email, linkedin, company, role, why, consentNewsletter, consentPrivacy } = await req.json();

  if (!consentPrivacy) {
    return NextResponse.json({ ok: false, error: "privacy_consent_required" }, { status: 400 });
  }

  const esc = (s: string) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const timestamp = new Date().toISOString();
  const newsletterBadge = consentNewsletter
    ? `<span style="background:#0891b2;color:white;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600">NEWSLETTER: TAK — dodaj do Brevo</span>`
    : `<span style="background:#525252;color:white;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600">Newsletter: nie</span>`;

  const html = `
    <h2>Scam Alert Miami — nowa aplikacja</h2>
    <p>${newsletterBadge}</p>
    <p><b>Imię i nazwisko:</b> ${esc(name)}</p>
    <p><b>Email:</b> ${esc(email)}</p>
    <p><b>LinkedIn:</b> <a href="${esc(linkedin)}">${esc(linkedin)}</a></p>
    <p><b>Firma / projekt:</b> ${esc(company)}</p>
    <h3>Czym się zajmuje w Miami</h3>
    <p>${esc(role).replace(/\n/g, "<br/>")}</p>
    <h3>Dlaczego chce dołączyć</h3>
    <p>${esc(why).replace(/\n/g, "<br/>")}</p>
    <hr/>
    <p style="color:#888;font-size:12px">
      Sprawdź LinkedIn + firmę. Odpowiedz w ciągu 7 dni.<br/>
      Zgoda na Politykę prywatności: TAK (${esc(timestamp)})<br/>
      Zgoda na newsletter: ${consentNewsletter ? "TAK" : "nie"} (${esc(timestamp)})
    </p>
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
