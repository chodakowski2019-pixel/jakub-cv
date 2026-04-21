import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const data = await req.json();

  const {
    nazwa, branza, opis, lata, kraje, przychod,
    pracownicy, dzialy,
    dane, jakoscDanych,
    aiPoziom, it, proby,
    zakres, decydent,
    budzet, dodatkowe,
  } = data;

  const html = `
    <h2>Nowa ankieta — Audyt AI</h2>

    <h3>🏢 Informacje o firmie</h3>
    <p><b>Nazwa:</b> ${nazwa}</p>
    <p><b>Branża:</b> ${branza}</p>
    <p><b>Opis:</b> ${opis}</p>
    <p><b>Lata działania:</b> ${lata}</p>
    <p><b>Kraje/rynki:</b> ${kraje}</p>
    <p><b>Przychód:</b> ${przychod}</p>

    <h3>👥 Struktura i zespół</h3>
    <p><b>Liczba pracowników:</b> ${pracownicy}</p>
    <p><b>Działy:</b> ${dzialy}</p>

    <h3>📊 Dane i systemy</h3>
    <p><b>Zbieranie danych / polityka:</b> ${dane}</p>
    <p><b>Jakość danych (1–10):</b> ${jakoscDanych}</p>

    <h3>🤖 AI i technologia</h3>
    <p><b>Poziom AI w zespole (1–10):</b> ${aiPoziom}</p>
    <p><b>Odpowiedzialny za IT:</b> ${it}</p>
    <p><b>Wcześniejsze próby automatyzacji:</b> ${proby}</p>

    <h3>🎯 Zakres i decyzja</h3>
    <p><b>Działy do audytu:</b> ${zakres}</p>
    <p><b>Decydent:</b> ${decydent}</p>

    <h3>💰 Budżet</h3>
    <p><b>Budżet na wdrożenie:</b> ${budzet}</p>

    <h3>📝 Dodatkowe</h3>
    <p>${dodatkowe || "—"}</p>
  `;

  try {
    await resend.emails.send({
      from: "Ankieta AI <onboarding@resend.dev>",
      to: "jakub@iteracity.com",
      subject: `Ankieta Audyt AI — ${nazwa}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
