import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { ADRES_WEBINARU, NADAWCA_WEBINARU, mailWebinarPotwierdz } from "@/lib/bruno/mail-webinar";
import { WEBINAR } from "@/lib/bruno/webinar";

export const dynamic = "force-dynamic";

// POST /api/bruno/webinar: zapis na webinar (USER_001 16.10; termin 27.10: śr 4.11 19:00, data z WEBINAR).
// 21.10 (USER_001): tylko imię + e-mail firmowy + zgoda (29.10: klik pod klauzulą w pop-upie, bez checkboxa).
// 27.10 (USER_001): wiersz w `bruno_webinar_zapisy` + powiadomienie do USER_001 (reply-to = uczestnik).
// 29.10 (USER_001, Aniserowicz 02.05-02.07) DOUBLE OPT-IN: M0 = mail „Potwierdzam zapis »” z tokenem, BEZ linku Zoom.
// Link Zoom (M0b) idzie dopiero po kliknięciu: app/api/bruno/webinar/potwierdz/route.ts. Przypomnienia: lib/bruno/webinar-cron.ts.
// Ponowny zapis tym samym mailem = ten sam token, mail potwierdzający jeszcze raz (Aniserowicz: „ponowne wpisanie adresu” to
// jedyny dozwolony sposób ponowienia; jeśli już potwierdzony, mail nie idzie drugi raz).
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
  // Domena, z której przyszedł zapis (salesbruno.pl / .com), do linku potwierdzającego.
  const baza = `${new URL(req.url).protocol}//${req.headers.get("host") ?? "salesbruno.pl"}`;

  // 1. Wiersz w bazie. Drugi zapis tym samym mailem = odświeżenie imienia i źródła, ten sam token, bez drugiego wiersza.
  let ponownie = false;
  let potwierdzony = false;
  let token = randomBytes(16).toString("hex");
  try {
    const { data: byl } = await supabaseAdmin.from("bruno_webinar_zapisy").select("id, token, potwierdzono").eq("webinar", WEBINAR.klucz).eq("email", email).maybeSingle();
    ponownie = Boolean(byl);
    potwierdzony = Boolean(byl?.potwierdzono);
    if (byl?.token) token = byl.token;
    const { error } = await supabaseAdmin.from("bruno_webinar_zapisy").upsert({ webinar: WEBINAR.klucz, imie, email, zrodlo: zrodlo || null, token }, { onConflict: "webinar,email" });
    if (error) console.error("[bruno webinar] baza", error.message);
  } catch (e) {
    console.error("[bruno webinar] baza", e);
  }

  // 2. M0: mail „Potwierdzam zapis »” (bez linku Zoom). Potwierdzony wcześniej → nie wysyłamy drugi raz.
  let m0: "wyslane" | "blad" | "juz-potwierdzony" = "blad";
  if (potwierdzony) {
    m0 = "juz-potwierdzony";
  } else {
    try {
      const m = mailWebinarPotwierdz({ imie, link: `${baza}/api/bruno/webinar/potwierdz?t=${token}` });
      const r = await wyslij({ do: email, od: NADAWCA_WEBINARU, replyTo: ADRES_WEBINARU, rodzaj: "webinar", temat: m.temat, html: m.html });
      // 29.10: lokalnie (bez RESEND_API_KEY) mail jest pomijany; wtedy NIE udajemy sukcesu (zapis USER_001 przez localhost bez maila).
      if (r.pominiety) throw new Error("mail pominięty: brak RESEND_API_KEY (localhost); zapisuj się na salesbruno.pl");
      m0 = "wyslane";
      await supabaseAdmin.from("bruno_webinar_zapisy").update({ mail_potwierdz: new Date().toISOString() }).eq("webinar", WEBINAR.klucz).eq("email", email);
    } catch (e) {
      console.error("[bruno webinar] mail potwierdzający", e);
    }
  }

  // 3. Powiadomienie do USER_001.
  const wiersz = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6b6b6b">${k}</td><td style="padding:6px 0;color:#0b0b0b"><b>${esc(v || "-")}</b></td></tr>`;
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Webinar ${WEBINAR.data}: ${ponownie ? "ponowny zapis" : "nowy zapis"}, ${imie} (${email.split("@")[1]})`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>${ponownie ? "Ponowny zapis" : "Nowy zapis"} na webinar („${WEBINAR.tytul}”, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}). Link Zoom dostanie po kliknięciu „Potwierdzam zapis”.</p><table>${wiersz("Imię", imie)}${wiersz("E-mail firmowy", email)}${wiersz("Źródło", zrodlo)}${wiersz("Mail „potwierdź zapis”", m0)}</table></div>`,
    });
  } catch (e) {
    console.error("[bruno webinar] powiadomienie", e);
    // Brak powiadomienia do USER_001 nie psuje zapisu, jeśli mail potwierdzający wyszedł.
  }
  // Bez maila potwierdzającego uczestnik nigdy nie dostanie linku, więc mówimy to wprost (Aniserowicz: nie zostawiaj go w próżni).
  if (m0 === "blad") return NextResponse.json({ ok: false, blad: "Zapis się urwał: mail potwierdzający nie wyszedł. Spróbuj za chwilę." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
