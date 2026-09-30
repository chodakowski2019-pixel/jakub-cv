import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { kodPasuje, poprawnyKod, zalogowanyEmail, zaszyfrujKod } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";

export const dynamic = "force-dynamic";

// POST /api/bruno/kod: zmiana własnego kodu logowania z panelu (USER_001 30.09).
// Wymaga podania starego kodu, żeby porzucona sesja w cudzej przeglądarce nie
// wystarczyła do przejęcia konta.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const b = await req.json();
    const stary = poprawnyKod(b.stary);
    const nowy = poprawnyKod(b.nowy);
    if (!stary || !nowy) return NextResponse.json({ ok: false, blad: "Kod ma mieć 6 cyfr." }, { status: 400 });
    if (/^(\d)\1{5}$/.test(nowy) || nowy === "123456") {
      return NextResponse.json({ ok: false, blad: "Ten kod jest zbyt łatwy do zgadnięcia." }, { status: 400 });
    }

    const konto = await pobierzKonto(email);
    if (!konto || !kodPasuje(stary, konto.kod_hash)) {
      return NextResponse.json({ ok: false, blad: "Obecny kod się nie zgadza." }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("bruno_konta")
      .update({ kod_hash: zaszyfrujKod(nowy), nieudane: 0, blokada_do: null })
      .eq("email", email);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno kod]", e);
    return NextResponse.json({ ok: false, blad: "Nie udało się zmienić kodu." }, { status: 500 });
  }
}
