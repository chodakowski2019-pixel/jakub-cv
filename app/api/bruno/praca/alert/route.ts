import { NextResponse } from "next/server";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/alert (17.10): handlowiec zapisuje się na powiadomienia o nowych ofertach (salesbruno.com/praca).
// Na razie TYLKO powiadomienie do USER_001 + log. Docelowo: tabela w Supabase i mail co poniedziałek.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail." }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: "Zaznacz zgodę na maile." }, { status: 400 });
  const filtr = JSON.stringify(b.filtr ?? {}).slice(0, 1000);
  console.log("[bruno praca alert]", JSON.stringify({ email, filtr, kiedy: new Date().toISOString() }));
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Praca: nowy zapis na powiadomienia, ${email}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Handlowiec zapisał się na powiadomienia o nowych ofertach (salesbruno.com/praca).</p><p><b>${esc(email)}</b></p><p style="color:#6b6b6b">Filtry: ${esc(filtr)}</p></div>`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno praca alert]", e);
    if (process.env.NODE_ENV !== "production") return NextResponse.json({ ok: true, lokalnie: true });
    return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  }
}
