import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { NADAWCA_WEBINARU, mailWebinarPotwierdzenie } from "@/lib/bruno/mail-webinar";
import { WEBINAR } from "@/lib/bruno/webinar";

export const dynamic = "force-dynamic";

// POST /api/bruno/webinar: zapis na webinar (USER_001 16.10; termin 27.10: śr 4.11 19:00, data z WEBINAR).
// 21.10 (USER_001): tylko imię + e-mail firmowy + akceptacja polityki prywatności.
// 27.10 (USER_001): zapis do `bruno_webinar_zapisy` + mail potwierdzenia z linkiem Zoom do uczestnika (M0)
// + powiadomienie do USER_001 (reply-to = uczestnik). Przypomnienia: lib/bruno/webinar-cron.ts.
// Kopia zapisu w logach Vercela ("[bruno webinar] zapis"), gdyby baza albo mail zawiodły.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.www) return NextResponse.json({ ok: true }); // pułapka na boty
  const imie = String(b.imie ?? "").trim().slice(0, 80);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  if (imie.length < 2) return NextResponse.json({ ok: false, blad: "Wpisz imię." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail firmowy." }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: "Zaakceptuj politykę prywatności." }, { status: 400 });

  const zrodlo = String(b.zrodlo ?? "").slice(0, 120);
  console.log("[bruno webinar] zapis", JSON.stringify({ imie, email, zrodlo, kiedy: new Date().toISOString() }));
  // Domena, z której przyszedł zapis (salesbruno.pl / .com), do linku .ics w mailu.
  const baza = `${new URL(req.url).protocol}//${req.headers.get("host") ?? "salesbruno.pl"}`;

  // 1. Wiersz w bazie. Drugi zapis tym samym mailem = odświeżenie imienia i źródła, bez drugiego wiersza.
  let ponownie = false;
  try {
    const { data: byl } = await supabaseAdmin.from("bruno_webinar_zapisy").select("id, mail_potwierdzenie").eq("webinar", WEBINAR.klucz).eq("email", email).maybeSingle();
    ponownie = Boolean(byl);
    const { error } = await supabaseAdmin.from("bruno_webinar_zapisy").upsert({ webinar: WEBINAR.klucz, imie, email, zrodlo: zrodlo || null }, { onConflict: "webinar,email" });
    if (error) console.error("[bruno webinar] baza", error.message);
  } catch (e) {
    console.error("[bruno webinar] baza", e);
  }

  // 2. Mail potwierdzenia z linkiem Zoom do uczestnika (także przy ponownym zapisie: „nie dostałem linku”).
  let potwierdzenie: "wyslane" | "blad" = "blad";
  try {
    const m = mailWebinarPotwierdzenie({ imie, baza });
    await wyslij({ do: email, od: NADAWCA_WEBINARU, replyTo: "hello@jakubchodakowski.com", rodzaj: "webinar", temat: m.temat, html: m.html });
    potwierdzenie = "wyslane";
    await supabaseAdmin.from("bruno_webinar_zapisy").update({ mail_potwierdzenie: new Date().toISOString() }).eq("webinar", WEBINAR.klucz).eq("email", email);
  } catch (e) {
    console.error("[bruno webinar] potwierdzenie", e);
  }

  // 3. Powiadomienie do USER_001.
  const wiersz = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6b6b6b">${k}</td><td style="padding:6px 0;color:#0b0b0b"><b>${esc(v || "-")}</b></td></tr>`;
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Webinar ${WEBINAR.data}: ${ponownie ? "ponowny zapis" : "nowy zapis"}, ${imie} (${email.split("@")[1]})`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>${ponownie ? "Ponowny zapis" : "Nowy zapis"} na webinar („${WEBINAR.tytul}”, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}).</p><table>${wiersz("Imię", imie)}${wiersz("E-mail firmowy", email)}${wiersz("Źródło", zrodlo)}${wiersz("Mail z linkiem Zoom", potwierdzenie)}</table></div>`,
    });
  } catch (e) {
    console.error("[bruno webinar] powiadomienie", e);
    // Uczestnik ma już potwierdzenie albo wiersz w bazie; brak powiadomienia do USER_001 nie psuje zapisu.
    if (potwierdzenie === "blad") return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
