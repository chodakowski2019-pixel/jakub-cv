import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

type Person = {
  name?: string;
  linkedin?: string;
  company?: string;
  email?: string;
  context?: string;
};

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const {
    requesterName,
    requesterEmail,
    people,
    consentBusinessInterest,
    submittedAt,
    memberToken,
  }: {
    requesterName?: string;
    requesterEmail?: string;
    people?: Person[];
    consentBusinessInterest?: boolean;
    submittedAt?: string;
    memberToken?: string;
  } = await req.json();

  const allowedTokens = (process.env.SCAM_ALERT_MEMBER_TOKENS ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!memberToken || !allowedTokens.includes(String(memberToken))) {
    return NextResponse.json({ ok: false, error: "invalid_member_token" }, { status: 401 });
  }

  if (consentBusinessInterest !== true) {
    return NextResponse.json({ ok: false, error: "business_interest_required" }, { status: 400 });
  }

  const list = Array.isArray(people) ? people : [];
  if (list.length < 1 || list.length > 10) {
    return NextResponse.json({ ok: false, error: "people_count_invalid" }, { status: 400 });
  }

  const esc = (s: unknown) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const timestamp = submittedAt || new Date().toISOString();

  const peopleHtml = list
    .map((p, i) => {
      const linkedinBlock = p.linkedin
        ? `<p style="margin:4px 0"><b>LinkedIn:</b> <a href="${esc(p.linkedin)}">${esc(p.linkedin)}</a></p>`
        : `<p style="margin:4px 0;color:#888"><b>LinkedIn:</b> not provided</p>`;
      const companyBlock = p.company
        ? `<p style="margin:4px 0"><b>Company / project:</b> ${esc(p.company)}</p>`
        : `<p style="margin:4px 0;color:#888"><b>Company / project:</b> not provided</p>`;
      const emailBlock = p.email
        ? `<p style="margin:4px 0"><b>Email:</b> ${esc(p.email)}</p>`
        : `<p style="margin:4px 0;color:#888"><b>Email:</b> not provided</p>`;
      const contextBlock = `<p style="margin:6px 0 0"><b>Context:</b><br/>${esc(p.context).replace(/\n/g, "<br/>")}</p>`;

      return `
        <div style="border:1px solid #e5e5e5;border-radius:8px;padding:14px 16px;margin:12px 0;background:#fafafa">
          <p style="margin:0 0 6px"><b style="font-size:15px">#${i + 1} — ${esc(p.name)}</b></p>
          ${linkedinBlock}
          ${companyBlock}
          ${emailBlock}
          ${contextBlock}
        </div>
      `;
    })
    .join("");

  const html = `
    <h2>Scam Alert Miami — CHECK PEOPLE request</h2>
    <p><b>Requester:</b> ${esc(requesterName)}</p>
    <p><b>Reply to:</b> <a href="mailto:${esc(requesterEmail)}">${esc(requesterEmail)}</a></p>
    <p><b>People submitted:</b> ${list.length} / 10</p>
    <hr/>
    <h3>People to check</h3>
    ${peopleHtml}
    <hr/>
    <p style="color:#888;font-size:12px">
      Reply individually for each person within 7 business days.<br/>
      Business interest declaration: CONFIRMED (${esc(timestamp)})<br/>
      Submitted at: ${esc(timestamp)}
    </p>
  `;

  try {
    await resend.emails.send({
      from: "Scam Alert Miami <hello@jakubchodakowski.com>",
      to: "hello@jakubchodakowski.com",
      replyTo: requesterEmail || undefined,
      subject: `Scam Alert Miami — CHECK: ${list.length} person(s) by ${requesterName}`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
