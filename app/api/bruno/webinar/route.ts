import { NextResponse } from "next/server";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { WEBINAR } from "@/lib/bruno/webinar";

export const dynamic = "force-dynamic";

// POST /api/bruno/webinar: zapis na webinar (USER_001 16.10; termin 21.10: śr 28.10 19:00, data z WEBINAR).
// 21.10 (USER_001): tylko imię + e-mail firmowy + akceptacja polityki prywatności.
// Na razie TYLKO powiadomienie do USER_001 (reply-to = uczestnik). Bez maila do uczestnika i bez bazy.
// Kopia zapisu w logach Vercela ("[bruno webinar] zapis"), gdyby mail nie doszedł.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.www) return NextResponse.json({ ok: true }); // pułapka na boty
  const imie = String(b.imie ?? "").trim().slice(0, 80);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  const grupa = b.grupa === "firmy" ? "firmy" : "handlowcy";
  if (imie.length < 2) return NextResponse.json({ ok: false, blad: "Wpisz imię." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail firmowy." }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: "Zaakceptuj politykę prywatności." }, { status: 400 });

  const zrodlo = String(b.zrodlo ?? "").slice(0, 120);
  console.log("[bruno webinar] zapis", JSON.stringify({ grupa, imie, email, zrodlo, kiedy: new Date().toISOString() }));
  const wiersz = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6b6b6b">${k}</td><td style="padding:6px 0;color:#0b0b0b"><b>${esc(v || "-")}</b></td></tr>`;
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Webinar ${WEBINAR.data}: nowy zapis, ${imie} (${email.split("@")[1]})`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Nowy zapis na webinar („${WEBINAR.tytul}”, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}).</p><table>${wiersz("Imię", imie)}${wiersz("E-mail firmowy", email)}${wiersz("Źródło", zrodlo)}</table></div>`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno webinar]", e);
    return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  }
}
