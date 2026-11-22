import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, esc, mailPotwierdz, wyslijMail } from "@/lib/newsletter-marka";

export const dynamic = "force-dynamic";

// POST /api/newsletter: zapis na newsletter marki (22.11.2026, wzór: app/api/bruno/webinar/route.ts).
// 1) wiersz w jc_newsletter (ten sam mail = ten sam wiersz i token), 2) mail „Potwierdź zapis” (double opt-in),
// 3) powiadomienie do USER_001. Ponowny zapis po wypisaniu = nowe potwierdzenie. Kopia zapisu w logach Vercela.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.www) return NextResponse.json({ ok: true }); // pułapka na boty
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ ok: false, blad: "Adres e-mail wygląda na niepełny." }, { status: 400 });
  if (b.zgoda !== true) return NextResponse.json({ ok: false, blad: "Brak zgody na newsletter." }, { status: 400 });
  // 22.11 (2): „rodzice” = strona zapisu na webinar dla rodziców (/webinardlarodzicow), z imieniem.
  const zrodlo = ["newsletter", "webinar", "pasek", "rodzice"].includes(b.zrodlo) ? String(b.zrodlo) : "newsletter";
  const webinar = zrodlo === "webinar" || zrodlo === "rodzice";
  const imie = String(b.imie ?? "").trim().slice(0, 80) || null;
  const baza = `${new URL(req.url).protocol}//${req.headers.get("host") ?? "jakubchodakowski.com"}`;
  console.log("[newsletter] zapis", JSON.stringify({ email, zrodlo, kiedy: new Date().toISOString() }));

  // Polityka prywatności (pkt 5): adres bez potwierdzenia kasuję po 30 dniach. Sprzątanie przy każdym nowym zapisie.
  try {
    const granica = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("jc_newsletter").delete().is("potwierdzono", null).is("wypisano", null).lt("zapisano", granica);
    if (error) console.error("[newsletter] sprzątanie", error.message);
  } catch (e) {
    console.error("[newsletter] sprzątanie", e);
  }

  let token = randomBytes(16).toString("hex");
  let potwierdzony = false;
  let ponownie = false;
  try {
    const { data: byl } = await supabaseAdmin.from("jc_newsletter").select("id, token, potwierdzono, wypisano, chce_webinar").eq("email", email).maybeSingle();
    if (byl) {
      ponownie = true;
      token = byl.token ?? token;
      potwierdzony = Boolean(byl.potwierdzono) && !byl.wypisano;
      const zmiana: Record<string, unknown> = { zrodlo, token, chce_webinar: byl.chce_webinar || webinar, ...(imie ? { imie } : {}) };
      if (byl.wypisano) Object.assign(zmiana, { wypisano: null, potwierdzono: null, mail_potwierdz: null });
      const { error } = await supabaseAdmin.from("jc_newsletter").update(zmiana).eq("id", byl.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("jc_newsletter").insert({ email, zrodlo, token, chce_webinar: webinar, imie });
      if (error) throw new Error(error.message);
    }
  } catch (e) {
    console.error("[newsletter] baza", e);
    return NextResponse.json({ ok: false, blad: "Zapis się nie udał. Spróbuj za chwilę." }, { status: 500 });
  }

  // Na webinar dla rodziców zapis jest „nowy”, nawet gdy adres już jest w newsletterze: potwierdzenie i tak dotyczy listy.
  if (potwierdzony) return NextResponse.json({ ok: true, stan: "juz" });

  try {
    const m = mailPotwierdz(`${baza}/api/newsletter/potwierdz?t=${token}`, zrodlo === "rodzice" ? { imie, webinar: "webinar dla rodziców o AI i zawodach przyszłości" } : undefined);
    const wynik = await wyslijMail({ do: email, temat: m.temat, html: m.html });
    if (wynik === "pominiety") return NextResponse.json({ ok: false, blad: "Lokalnie mail nie wychodzi (brak klucza Resend). Zapis działa na jakubchodakowski.com." }, { status: 503 });
    await supabaseAdmin.from("jc_newsletter").update({ mail_potwierdz: new Date().toISOString() }).eq("email", email);
  } catch (e) {
    console.error("[newsletter] mail potwierdzający", e);
    return NextResponse.json({ ok: false, blad: "Mail potwierdzający nie wyszedł. Spróbuj za chwilę." }, { status: 500 });
  }

  try {
    await wyslijMail({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `${zrodlo === "rodzice" ? "Webinar dla rodziców" : "Newsletter"}: ${ponownie ? "ponowny zapis" : "nowy zapis"}, ${imie ?? ""} (${email.split("@")[1]})${zrodlo === "webinar" ? " (chce info o webinarze)" : ""}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>${ponownie ? "Ponowny zapis" : "Nowy zapis"} na newsletter jakubchodakowski.com. Na liście będzie po kliknięciu „Potwierdzam zapis”.</p><p>${imie ? `<b>Imię:</b> ${esc(imie)}<br>` : ""}<b>E-mail:</b> ${esc(email)}<br><b>Skąd:</b> ${esc(zrodlo)}</p></div>`,
    });
  } catch (e) {
    console.error("[newsletter] powiadomienie", e);
  }
  return NextResponse.json({ ok: true, stan: "potwierdz" });
}
