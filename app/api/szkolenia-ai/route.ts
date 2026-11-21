import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

// Zapytanie o szkolenie AI dla firm (formularz na stronie szkolenia). Wzór: /api/aisaleskontakt.
// Mail leci z hello@jakubchodakowski.com na skrzynkę właściciela, reply-to = osoba z formularza.
// Kopia w Supabase (tabela szkolenia_ai_leady, SQL w supabase/szkolenia_ai_leady.sql) jest
// best-effort: jeśli tabeli nie ma, mail i tak pójdzie.

const OSOBY = ["do 5", "6 do 12", "13 do 25", "ponad 25"];
const FORMY = ["W firmie", "Online", "Jeszcze nie wiem"];

const tekst = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const html = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: NextRequest) {
  let d: Record<string, unknown>;
  try {
    d = await req.json();
  } catch {
    return NextResponse.json({ ok: false, blad: "Błędne dane." }, { status: 400 });
  }

  // Pole-pułapka: człowiek go nie widzi. Wypełnione = bot, udajemy sukces.
  if (tekst(d.www, 200)) return NextResponse.json({ ok: true });

  const imie = tekst(d.imie, 120);
  const firma = tekst(d.firma, 160);
  const email = tekst(d.email, 200).toLowerCase();
  const telefon = tekst(d.telefon, 40);
  const osoby = tekst(d.osoby, 20);
  const forma = tekst(d.forma, 30);
  const wiadomosc = tekst(d.wiadomosc, 2000);
  const zgoda = d.zgoda === true;

  if (!imie || !firma || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !OSOBY.includes(osoby) || !zgoda) {
    return NextResponse.json({ ok: false, blad: "Brak wymaganych pól." }, { status: 400 });
  }

  // supabase-js nie rzuca wyjątku przy błędzie zapisu, zwraca `error`.
  try {
    const { error } = await supabaseAdmin.from("szkolenia_ai_leady").insert({
      imie,
      firma,
      email,
      telefon: telefon || null,
      osoby,
      forma: FORMY.includes(forma) ? forma : null,
      wiadomosc: wiadomosc || null,
      zgoda,
    });
    if (error) console.error("szkolenia_ai_leady: zapis nieudany", error.code, error.message);
  } catch (err) {
    console.error("szkolenia_ai_leady: zapis nieudany", err);
  }

  // Lokalnie bez klucza Resend: pomijamy mail, żeby dało się obejrzeć ekran po wysłaniu.
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === "development") {
    console.warn("RESEND_API_KEY brak, mail pominięty (dev)");
    return NextResponse.json({ ok: true });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Szkolenia AI <hello@jakubchodakowski.com>",
      to: "chodakowski2019@gmail.com",
      replyTo: email,
      subject: `Szkolenie AI, zapytanie: ${firma}, ${osoby} osób${telefon ? ` (${telefon})` : ""}`,
      html: `
        <h2>Nowe zapytanie o szkolenie AI dla firm</h2>
        <p><b>Imię i nazwisko:</b> ${html(imie)}</p>
        <p><b>Firma:</b> ${html(firma)}</p>
        <p><b>E-mail:</b> ${html(email)}</p>
        <p><b>Telefon:</b> ${html(telefon) || "nie podano"}</p>
        <p><b>Liczba osób:</b> ${html(osoby)}</p>
        <p><b>Forma:</b> ${html(forma) || "nie wybrano"}</p>
        <p><b>Wiadomość:</b> ${html(wiadomosc) || "brak"}</p>
        <p style="margin-top:16px"><b>Obietnica ze strony:</b> odpowiedź w 24 godziny, w dni robocze.</p>
      `,
    });
    if (error) {
      console.error("szkolenia-ai: mail nieudany", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
