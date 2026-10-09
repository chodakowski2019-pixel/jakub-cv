import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { firmowyEmail } from "@/lib/firmowy-email";

// Lead form SalesAI (/aisaleskontakt). Wzór: /api/formularzdlarodzicow.
// Mail leci z hello@jakubchodakowski.com na skrzynkę USER_001, reply-to = lead.
// Kopia w Supabase jest best-effort: jeśli tabela salesai_leady nie istnieje,
// mail i tak pójdzie.

export async function POST(req: NextRequest) {
  const data = await req.json();

  const { imie, email, telefon, zawod, zgoda, produkt } = data;
  // 9.10: LP dla handlowca (/brunoai) wysyła typ „handlowiec”: każdy e-mail, handlowcy = 1.
  const handlowiec = data.typ === "handlowiec";
  const handlowcy = handlowiec ? 1 : Number(data.handlowcy);

  // Telefon jest opcjonalny (decyzja USER_001 28.09): przy ruchu z reklamy
  // to pole o najwyzszym oporze, a do odpisania wystarczy mail.
  // Handlowcy + produkt obowiązkowe od 29.09: wsad do ręcznej weryfikacji (ICP 5-40).
  if (!imie || !email || !zawod || !zgoda || !produkt || !Number.isInteger(handlowcy) || handlowcy < 1) {
    return NextResponse.json({ ok: false, blad: "Brak wymaganych pól" }, { status: 400 });
  }
  if (!handlowiec && !firmowyEmail(String(email))) {
    return NextResponse.json({ ok: false, blad: "Podaj firmowy adres e-mail." }, { status: 400 });
  }

  // supabase-js nie rzuca wyjątku przy błędzie zapisu, zwraca `error`.
  // Bez tego sprawdzenia błąd ginie po cichu (tak było 28-29.09).
  try {
    const { error } = await supabaseAdmin.from("salesai_leady").insert({
      imie,
      email,
      telefon,
      zawod,
      handlowcy,
      produkt: String(produkt).slice(0, 200),
      zgoda: Boolean(zgoda),
    });
    if (error) console.error("supabase insert failed", error.code, error.message);
  } catch (err) {
    console.error("supabase insert failed", err);
  }

  const html = `
    <h2>Nowy lead — SalesAI (pilotaż)${handlowiec ? " — HANDLOWIEC (/brunoai)" : ""}</h2>

    <p><b>Imię:</b> ${imie}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Telefon:</b> ${telefon || "nie podano"}</p>
    <p><b>Zawód:</b> ${zawod}</p>
    <p><b>Handlowców w firmie:</b> ${handlowcy}</p>
    <p><b>Produkt:</b> ${String(produkt).replace(/</g, "&lt;")}</p>
    <p><b>Zgoda na kontakt:</b> ${zgoda ? "tak" : "nie"}</p>
    <p style="margin-top:16px"><b>Do weryfikacji.</b> Lead czeka na dostęp (obietnica: do 24 h). Po zatwierdzeniu wyślij link do ankiety: https://jakubchodakowski.com/aisalesbrief</p>
  `;

  // Lokalnie bez klucza Resend: pomijamy mail, żeby dało się obejrzeć ekran po wysłaniu.
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === "development") {
    console.warn("RESEND_API_KEY brak, mail pominięty (dev)");
    return NextResponse.json({ ok: true });
  }

  try {
    // Konstruktor rzuca bez klucza, więc dopiero tu: walidacja i zapis do bazy
    // mają działać także bez maila.
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "SalesAI <hello@jakubchodakowski.com>",
      to: "chodakowski2019@gmail.com",
      replyTo: email,
      subject: `Bruno AI, do weryfikacji: ${imie}, ${zawod}, ${handlowcy} handl.${telefon ? ` (${telefon})` : ""}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
