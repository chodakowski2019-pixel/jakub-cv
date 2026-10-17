import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/alert (17.10): zapis na powiadomienia o nowych ofertach (salesbruno.com/praca).
// 18.10: alert w bazie (praca_alerty), zalogowany kandydat = przypięty do konta (lista w panelu, „Zapisane alerty”).
// { akcja: "usun", id } = usunięcie alertu z panelu. Wysyłka maili z ofertami: jeszcze nie ma (do zbudowania).
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function opisFiltra(f: Record<string, unknown>): string {
  const cz: string[] = [];
  if (f.q) cz.push(String(f.q));
  if (f.gdzie) cz.push(String(f.gdzie));
  if (f.branza) cz.push(String(f.branza));
  for (const k of ["poziom", "tryb", "umowa", "wymiar"]) if (Array.isArray(f[k]) && (f[k] as string[]).length) cz.push((f[k] as string[]).join(", "));
  return cz.join(" · ") || "Wszystkie oferty dla handlowców";
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const konto = await zalogowanePraca();
  if (b.akcja === "usun") {
    if (!konto) return NextResponse.json({ ok: false }, { status: 401 });
    await supabaseAdmin.from("praca_alerty").delete().eq("id", String(b.id ?? "")).eq("konto_id", konto.id);
    return NextResponse.json({ ok: true });
  }
  const email = String(b.email ?? konto?.email ?? "").trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail." }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: "Zaznacz zgodę na maile." }, { status: 400 });
  const filtr = typeof b.filtr === "object" && b.filtr ? b.filtr : {};
  const opis = opisFiltra(filtr);
  const { error } = await supabaseAdmin.from("praca_alerty").insert({ konto_id: konto?.typ === "kandydat" ? konto.id : null, email, filtr, opis });
  if (error) console.error("[bruno praca alert] baza", error.message);
  console.log("[bruno praca alert]", JSON.stringify({ email, opis, kiedy: new Date().toISOString() }));
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Praca: nowy zapis na powiadomienia, ${email}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Handlowiec zapisał się na powiadomienia o nowych ofertach (salesbruno.com/praca).</p><p><b>${esc(email)}</b></p><p style="color:#6b6b6b">Filtr: ${esc(opis)}</p></div>`,
    });
  } catch (e) {
    console.error("[bruno praca alert]", e);
  }
  return NextResponse.json({ ok: true });
}
