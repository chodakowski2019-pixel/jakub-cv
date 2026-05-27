import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB

type IncomingFile = {
  name?: string;
  type?: string;
  size?: number;
  base64?: string;
};

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const {
    reporterName,
    reporterEmail,
    scammerName,
    scammerLinkedin,
    scammerCompany,
    scammerOther,
    incidentDate,
    lossAmount,
    description,
    evidenceLinks,
    files,
    consentSA,
    publishAnonymously,
    submittedAt,
    memberToken,
  } = await req.json();

  const allowedTokens = (process.env.SCAM_ALERT_MEMBER_TOKENS ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!memberToken || !allowedTokens.includes(String(memberToken))) {
    return NextResponse.json({ ok: false, error: "invalid_member_token" }, { status: 401 });
  }

  if (consentSA !== true) {
    return NextResponse.json({ ok: false, error: "sa_consent_required" }, { status: 400 });
  }

  const safeFiles: IncomingFile[] = Array.isArray(files) ? files : [];
  const totalBytes = safeFiles.reduce((sum, f) => sum + (Number(f?.size) || 0), 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json({ ok: false, error: "attachments_too_large" }, { status: 400 });
  }

  const esc = (s: string) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const timestamp = String(submittedAt || new Date().toISOString());

  const anonBadge =
    publishAnonymously === false
      ? `<span style="background:#b45309;color:white;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600">ANONYMOUS PUBLICATION: NO (reporter named)</span>`
      : `<span style="background:#0891b2;color:white;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600">ANONYMOUS PUBLICATION: YES</span>`;

  // Render evidence links as <a> tags
  const linksRaw = String(evidenceLinks || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const linksHtml = linksRaw.length
    ? `<ul>${linksRaw
        .map((l) => `<li><a href="${esc(l)}">${esc(l)}</a></li>`)
        .join("")}</ul>`
    : `<p style="color:#888"><i>No links provided.</i></p>`;

  const lossDisplay = lossAmount && String(lossAmount).trim() ? esc(lossAmount) : "<i>not specified</i>";
  const linkedinDisplay = scammerLinkedin
    ? `<a href="${esc(scammerLinkedin)}">${esc(scammerLinkedin)}</a>`
    : "<i>not provided</i>";
  const companyDisplay = scammerCompany ? esc(scammerCompany) : "<i>not provided</i>";
  const otherDisplay = scammerOther
    ? esc(scammerOther).replace(/\n/g, "<br/>")
    : "<i>not provided</i>";

  const fileCount = safeFiles.length;
  const totalKb = (totalBytes / 1024).toFixed(1);

  const html = `
    <h2>Scam Alert Miami — NEW REPORT</h2>
    <p>${anonBadge}</p>

    <h3>Reporter</h3>
    <p><b>Name:</b> ${esc(reporterName)}</p>
    <p><b>Email:</b> <a href="mailto:${esc(reporterEmail)}">${esc(reporterEmail)}</a></p>

    <h3>Reported party</h3>
    <p><b>Name:</b> ${esc(scammerName)}</p>
    <p><b>LinkedIn:</b> ${linkedinDisplay}</p>
    <p><b>Company / website:</b> ${companyDisplay}</p>
    <p><b>Other identifiers:</b><br/>${otherDisplay}</p>

    <h3>Incident</h3>
    <p><b>Date:</b> ${esc(incidentDate)}</p>
    <p><b>Estimated loss:</b> ${lossDisplay}</p>

    <h3>What happened</h3>
    <p>${esc(description).replace(/\n/g, "<br/>")}</p>

    <h3>Evidence links</h3>
    ${linksHtml}

    <h3>Evidence files</h3>
    <p><b>Attached:</b> ${fileCount} file(s), total ${esc(totalKb)} KB</p>
    ${
      fileCount
        ? `<ul>${safeFiles
            .map(
              (f) =>
                `<li>${esc(String(f?.name || "(unnamed)"))} (${esc(
                  String(f?.type || "unknown"),
                )}, ${esc(String(Number(f?.size) || 0))} bytes)</li>`,
            )
            .join("")}</ul>`
        : ""
    }

    <hr/>
    <p style="color:#888;font-size:12px">
      Submission Agreement accepted: YES (${esc(timestamp)})<br/>
      Anonymous publication: ${publishAnonymously === false ? "NO" : "YES"}<br/>
      Submitted at: ${esc(timestamp)}<br/>
      <br/>
      Review checklist:<br/>
      1) Stage 1 — Operator vetting (up to 14 days). Verify identifiers and evidence.<br/>
      2) Stage 2 — Notify reported party with 14-day right of reply.<br/>
      3) Stage 3 — Publish, edit/anonymize, or reject.
    </p>
  `;

  const attachments = safeFiles
    .filter((f) => f && f.base64 && f.name)
    .map((f) => {
      let b64 = String(f.base64 || "");
      const idx = b64.indexOf(",");
      if (b64.startsWith("data:") && idx >= 0) b64 = b64.slice(idx + 1);
      return {
        filename: String(f.name),
        content: b64,
        contentType: String(f.type || "application/octet-stream"),
      };
    });

  try {
    await resend.emails.send({
      from: "Scam Alert Miami <hello@jakubchodakowski.com>",
      to: "hello@jakubchodakowski.com",
      replyTo: reporterEmail,
      subject: `Scam Alert Miami — REPORT: ${scammerName} (by ${reporterName})`,
      html,
      attachments: attachments.length ? attachments : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
