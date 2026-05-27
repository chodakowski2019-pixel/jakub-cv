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

  const autoReplyHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6">
      <h2 style="color:#0a1218;font-size:20px;margin:0 0 16px">Application received.</h2>
      <p>Hey ${esc(name).split(" ")[0] || "there"},</p>
      <p>Thanks for applying to <strong>Scam Alert Miami</strong>. Your application is in the queue.</p>
      <p><strong>What happens next:</strong></p>
      <ul style="padding-left:20px">
        <li>I personally review every application: LinkedIn, company, context.</li>
        <li>You'll get a decision email within <strong>7 days</strong>, accepted or not.</li>
        <li>If accepted, the next email includes the payment link ($50 / 30 days) and your personal access link to the member tools.</li>
      </ul>
      <p>No need to do anything in the meantime. If you want to add context or evidence to your application, reply to this email.</p>
      <p>— Jakub<br/>
      <a href="https://jakubchodakowski.com/scamalertmiami" style="color:#0891b2">jakubchodakowski.com/scamalertmiami</a></p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0"/>
      <p style="font-size:11px;color:#888">
        Scam Alert Miami · operated by Jakub Chodakowski (sole proprietorship), ul. Stanisława Koniecpolskiego 12a/7, 78-100 Kołobrzeg, Poland · NIP 6711845485<br/>
        You're receiving this because you submitted an application at jakubchodakowski.com/scamalertmiami.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Scam Alert Miami <onboarding@resend.dev>",
      to: "hello@jakubchodakowski.com",
      replyTo: email,
      subject: `Scam Alert Miami — ${name} (${company})`,
      html,
    });

    // Auto-reply to the applicant (best-effort, doesn't block success)
    try {
      await resend.emails.send({
        from: "Jakub Chodakowski <onboarding@resend.dev>",
        to: email,
        replyTo: "hello@jakubchodakowski.com",
        subject: "Your Scam Alert Miami application is in the queue",
        html: autoReplyHtml,
      });
    } catch {
      // swallow: auto-reply failure shouldn't fail the form
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
