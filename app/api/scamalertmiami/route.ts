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

  const firstName = esc(name).split(" ")[0] || "there";
  const autoReplyHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>Your application is in the queue</title>
<style>
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
  img { border: 0; outline: none; text-decoration: none; display: block; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f5f5f7; }
  a { color: #0066cc; text-decoration: none; }
  @media screen and (max-width: 600px) {
    .container { width: 100% !important; max-width: 100% !important; }
    .px-mobile { padding-left: 24px !important; padding-right: 24px !important; }
    .py-mobile-lg { padding-top: 48px !important; padding-bottom: 48px !important; }
    .h1-mobile { font-size: 32px !important; line-height: 1.1 !important; letter-spacing: -1.2px !important; }
    .hide-mobile { display: none !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f7; font-family:-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <div style="display:none; font-size:1px; color:#f5f5f7; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">Your application is in the queue. Decision within 7 days.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f7;">
    <tr><td align="center" style="padding:0;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
        <tr><td class="px-mobile" align="center" style="padding:32px 48px 16px; font-size:12px; color:#86868b; letter-spacing:0.5px; text-transform:uppercase;">Application &middot; Confirmation</td></tr>
      </table>
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:18px; overflow:hidden;">
        <tr><td class="px-mobile" style="padding:40px 48px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="left" valign="middle" style="font-size:17px; color:#1d1d1f; font-weight:600; letter-spacing:-0.3px;"><span style="display:inline-block; width:10px; height:10px; background-color:#1d1d1f; border-radius:50%; vertical-align:middle; margin-right:10px;">&nbsp;</span><span style="vertical-align:middle;">Scam Alert Miami</span></td>
            <td align="right" valign="middle" class="hide-mobile" style="font-size:13px; color:#86868b;"><a href="https://jakubchodakowski.com/scamalertmiami" style="color:#86868b; text-decoration:none;">View on web</a></td>
          </tr></table>
        </td></tr>
        <tr><td class="px-mobile py-mobile-lg" style="padding:56px 48px 40px;">
          <p style="margin:0 0 20px; font-size:13px; color:#0066cc; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">Application received</p>
          <h1 class="h1-mobile" style="margin:0 0 24px; font-size:40px; line-height:1.05; color:#1d1d1f; font-weight:700; letter-spacing:-1.5px;">You're in the queue.</h1>
          <p style="margin:0 0 16px; font-size:18px; line-height:1.55; color:#424245;">Hey ${firstName},</p>
          <p style="margin:0; font-size:18px; line-height:1.55; color:#424245;">Thanks for applying to Scam Alert Miami. Your application is in the queue and I'll personally review it within 7 days.</p>
        </td></tr>
        <tr><td class="px-mobile" style="padding:0 48px 16px;"><p style="margin:0 0 24px; font-size:13px; color:#86868b; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">What happens next</p></td></tr>
        <tr><td class="px-mobile" style="padding:0 48px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="60" valign="top" style="width:60px; padding-right:20px;"><table role="presentation" width="60" cellpadding="0" cellspacing="0" border="0"><tr><td width="60" height="60" style="width:60px; height:60px; background-color:#f5f5f7; border-radius:12px; font-size:22px; color:#1d1d1f; font-weight:700; text-align:center; vertical-align:middle; letter-spacing:-0.5px;">01</td></tr></table></td>
            <td valign="top">
              <h3 style="margin:0 0 6px; font-size:18px; line-height:1.3; color:#1d1d1f; font-weight:600; letter-spacing:-0.3px;">I review every application personally</h3>
              <p style="margin:0; font-size:15px; line-height:1.5; color:#424245;">LinkedIn, company, your context. No automated vetting.</p>
            </td>
          </tr></table>
        </td></tr>
        <tr><td class="px-mobile" style="padding:0 48px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="60" valign="top" style="width:60px; padding-right:20px;"><table role="presentation" width="60" cellpadding="0" cellspacing="0" border="0"><tr><td width="60" height="60" style="width:60px; height:60px; background-color:#f5f5f7; border-radius:12px; font-size:22px; color:#1d1d1f; font-weight:700; text-align:center; vertical-align:middle; letter-spacing:-0.5px;">02</td></tr></table></td>
            <td valign="top">
              <h3 style="margin:0 0 6px; font-size:18px; line-height:1.3; color:#1d1d1f; font-weight:600; letter-spacing:-0.3px;">Decision in 7 days</h3>
              <p style="margin:0; font-size:15px; line-height:1.5; color:#424245;">You hear back from me either way, accepted or not.</p>
            </td>
          </tr></table>
        </td></tr>
        <tr><td class="px-mobile" style="padding:0 48px 56px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="60" valign="top" style="width:60px; padding-right:20px;"><table role="presentation" width="60" cellpadding="0" cellspacing="0" border="0"><tr><td width="60" height="60" style="width:60px; height:60px; background-color:#f5f5f7; border-radius:12px; font-size:22px; color:#1d1d1f; font-weight:700; text-align:center; vertical-align:middle; letter-spacing:-0.5px;">03</td></tr></table></td>
            <td valign="top">
              <h3 style="margin:0 0 6px; font-size:18px; line-height:1.3; color:#1d1d1f; font-weight:600; letter-spacing:-0.3px;">If accepted: payment + access</h3>
              <p style="margin:0; font-size:15px; line-height:1.5; color:#424245;">Next email includes a $50 payment link (30 days) and your personal access link to the member tools.</p>
            </td>
          </tr></table>
        </td></tr>
        <tr><td class="px-mobile" style="padding:0 48px 56px;">
          <p style="margin:0; font-size:15px; line-height:1.55; color:#424245;">No action needed in the meantime. If you want to add context or evidence to your application, just reply to this email.</p>
          <p style="margin:24px 0 0; font-size:15px; line-height:1.55; color:#1d1d1f;">&mdash; Jakub</p>
        </td></tr>
      </table>
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
        <tr><td class="px-mobile" align="center" style="padding:40px 48px 16px; font-size:13px; line-height:1.6; color:#86868b; text-align:center;">You're reading <strong style="color:#1d1d1f; font-weight:600;">Scam Alert Miami</strong>, a private vetting group for founders and operators in Miami.</td></tr>
        <tr><td align="center" class="px-mobile" style="padding:8px 48px 0; font-size:13px; color:#86868b;"><a href="https://jakubchodakowski.com/scamalertmiami" style="color:#86868b; text-decoration:none;">Site</a> &middot; <a href="https://jakubchodakowski.com/scamalertmiami/terms-of-service" style="color:#86868b; text-decoration:none;">Terms</a> &middot; <a href="https://jakubchodakowski.com/scamalertmiami/privacy-policy" style="color:#86868b; text-decoration:none;">Privacy</a> &middot; <a href="mailto:hello@jakubchodakowski.com" style="color:#86868b; text-decoration:none;">Contact</a></td></tr>
        <tr><td align="center" class="px-mobile" style="padding:24px 48px 8px; font-size:12px; line-height:1.5; color:#a1a1a6;">Scam Alert Miami &middot; operated by Jakub Chodakowski (sole proprietorship)<br/>ul. Stanisława Koniecpolskiego 12a/7, 78-100 Kołobrzeg, Poland &middot; NIP 6711845485</td></tr>
        <tr><td align="center" class="px-mobile" style="padding:4px 48px 48px; font-size:12px; line-height:1.5; color:#a1a1a6;">You received this because you submitted an application at jakubchodakowski.com/scamalertmiami.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "Scam Alert Miami <hello@jakubchodakowski.com>",
      to: "hello@jakubchodakowski.com",
      replyTo: email,
      subject: `Scam Alert Miami — ${name} (${company})`,
      html,
    });

    // Auto-reply to the applicant (best-effort, doesn't block success)
    try {
      await resend.emails.send({
        from: "Jakub Chodakowski <hello@jakubchodakowski.com>",
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
