import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const data = await req.json();

  const {
    nazwa, contactName, position, branza, opis, lata, kraje, przychod,
    pracownicy, dzialy,
    dane, jakoscDanych,
    aiPoziom, it, proby,
    zakres, decydent,
    budzet, dodatkowe,
  } = data;

  const html = `
    <h2>New AI Audit Submission</h2>

    <h3>🏢 Company</h3>
    <p><b>Company:</b> ${nazwa}</p>
    <p><b>Contact:</b> ${contactName}</p>
    <p><b>Position:</b> ${position}</p>
    <p><b>Industry:</b> ${branza}</p>
    <p><b>Description:</b> ${opis}</p>
    <p><b>Years:</b> ${lata}</p>
    <p><b>Markets:</b> ${kraje}</p>
    <p><b>Revenue:</b> ${przychod}</p>

    <h3>👥 Team</h3>
    <p><b>Employees:</b> ${pracownicy}</p>
    <p><b>Departments:</b> ${dzialy}</p>

    <h3>📊 Data</h3>
    <p><b>Data policy:</b> ${dane}</p>
    <p><b>Data quality (1–10):</b> ${jakoscDanych}</p>

    <h3>🤖 AI & Tech</h3>
    <p><b>AI level (1–10):</b> ${aiPoziom}</p>
    <p><b>IT responsible:</b> ${it}</p>
    <p><b>Previous attempts:</b> ${proby}</p>

    <h3>🎯 Scope</h3>
    <p><b>Departments to audit:</b> ${zakres}</p>
    <p><b>Decision maker:</b> ${decydent}</p>

    <h3>💰 Budget</h3>
    <p><b>Budget:</b> ${budzet}</p>

    <h3>📝 Notes</h3>
    <p>${dodatkowe || "—"}</p>
  `;

  try {
    await resend.emails.send({
      from: "AI Audit <onboarding@resend.dev>",
      to: "iteracity@gmail.com",
      subject: `AI Audit — ${nazwa} (${contactName})`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
