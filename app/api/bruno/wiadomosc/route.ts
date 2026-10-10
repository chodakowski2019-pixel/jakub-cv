import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { SKRZYNKA_JAKUBA, htmlWiadomosc, wyslij } from "@/lib/bruno/mail";

export const dynamic = "force-dynamic";

// POST /api/bruno/wiadomosc: dymek czatu z panelu (USER_001 1.10).
// Mail do USER_001 z reply-to = tester. Odpowiedź idzie z Gmaila, nie z panelu.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const tekst = String(b.tekst ?? "").trim().slice(0, 3000);
  if (tekst.length < 2) return NextResponse.json({ ok: false, blad: "Your message is empty." }, { status: 400 });
  try {
    const konto = await pobierzKonto(email);
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Bruno AI, wiadomość z panelu: ${konto?.imie ?? email}${konto?.firma ? ` (${konto.firma})` : ""}`,
      html: htmlWiadomosc({ email, imie: konto?.imie ?? null, firma: konto?.firma ?? null, tekst }),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno wiadomosc]", e);
    return NextResponse.json({ ok: false, blad: "Couldn't send. Try again." }, { status: 500 });
  }
}
