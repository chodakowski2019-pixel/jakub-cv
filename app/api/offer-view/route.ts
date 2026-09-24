import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CLINIC_OFFERS } from "@/lib/clinic-offers";
import { STRATEGIA_OFERTY } from "@/lib/strategia-oferty";

export const dynamic = "force-dynamic";

// POST /api/offer-view
// The offer page has no password gate, so without this nobody would know the
// clinic opened it. The page calls it on load; we get an email and know it is
// a good moment to call. Same idea as lovemyself.pl/api/oferta/wejscie.
//
// Sender/recipient can be overridden by env (OFFER_MAIL_FROM, OFFER_MAIL_TO).
// Default sender is hello@jakubchodakowski.com, the same verified Resend
// domain scamalertmiami already sends from; recipient is that inbox, the one
// the cold emails go from.
export async function POST(req: Request) {
  try {
    const b = await req.json();

    // Oferta strategii (/wspolpracampphc, USER_001 24.09): osobna gałąź, bo
    // klucz siedzi w lib/strategia-oferty.ts, a temat maila ma odróżniać tę
    // linię od ofert klinik zagranicznych. Strona woła to PO wpisaniu kodu.
    const strategy = String(b.strategy ?? "").trim().slice(0, 40).toLowerCase();
    if (strategy) {
      const o = STRATEGIA_OFERTY[strategy];
      if (!o) return NextResponse.json({ error: "Unknown offer." }, { status: 400 });
      if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true });
      const when = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
      const from = String(b.from ?? "").trim().slice(0, 200) || "wpisane wprost";
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.OFFER_MAIL_FROM ?? "Jakub Chodakowski <hello@jakubchodakowski.com>",
        to: process.env.OFFER_MAIL_TO ?? "hello@jakubchodakowski.com",
        subject: `Wejście na ofertę STRATEGII: ${o.nazwa}`,
        html: `<p><strong>${o.nazwa}</strong> (${o.miasto}) wpisała kod i otworzyła ofertę strategii. Dobry moment na telefon.</p>
<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
<tr><td style="color:#666">Pakiety</td><td>${o.cenaA} / ${o.cenaB} zł, nadzór ${o.cenaNadzor} zł/mc</td></tr>
<tr><td style="color:#666">Kiedy</td><td>${when}</td></tr>
<tr><td style="color:#666">Skąd przyszedł</td><td>${from}</td></tr>
</table>`,
      });
      return NextResponse.json({ ok: true });
    }

    const key = String(b.clinic ?? "").trim().slice(0, 40).toLowerCase();
    const o = CLINIC_OFFERS[key];
    if (!o) return NextResponse.json({ error: "Unknown clinic." }, { status: 400 });
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true });

    const when = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
    const from = String(b.from ?? "").trim().slice(0, 200) || "typed directly";
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.OFFER_MAIL_FROM ?? "Jakub Chodakowski <hello@jakubchodakowski.com>",
      to: process.env.OFFER_MAIL_TO ?? "hello@jakubchodakowski.com",
      subject: `Wejście na ofertę: ${o.name}`,
      html: `<p><strong>${o.name}</strong> (${o.city}, ${o.country}) otworzyła ofertę. Dobry moment na telefon.</p>
<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
<tr><td style="color:#666">Zabieg</td><td>${o.procedure}</td></tr>
<tr><td style="color:#666">Kiedy</td><td>${when}</td></tr>
<tr><td style="color:#666">Skąd przyszedł</td><td>${from}</td></tr>
</table>`,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
}
