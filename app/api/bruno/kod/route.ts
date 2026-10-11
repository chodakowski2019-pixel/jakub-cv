import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { kodPasuje, poprawnyKod, zalogowanyEmail, zaszyfrujKod } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { tDla } from "@/lib/bruno/i18n";

export const dynamic = "force-dynamic";

// POST /api/bruno/kod: zmiana własnego kodu logowania z panelu (USER_001 30.09).
// Wymaga podania starego kodu, żeby porzucona sesja w cudzej przeglądarce nie
// wystarczyła do przejęcia konta.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const konto = await pobierzKonto(email);
  const t = tDla(konto?.jezyk);
  try {
    const b = await req.json();
    const stary = poprawnyKod(b.stary);
    const nowy = poprawnyKod(b.nowy);
    if (!stary || !nowy) return NextResponse.json({ ok: false, blad: t("The code must be 6 digits.", "Kod ma mieć 6 cyfr.") }, { status: 400 });
    if (/^(\d)\1{5}$/.test(nowy) || nowy === "123456") {
      return NextResponse.json({ ok: false, blad: t("This code is too easy to guess.", "Ten kod jest zbyt łatwy do zgadnięcia.") }, { status: 400 });
    }

    if (!konto || !kodPasuje(stary, konto.kod_hash)) {
      return NextResponse.json({ ok: false, blad: t("Your current code doesn't match.", "Obecny kod się nie zgadza.") }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("bruno_konta")
      .update({ kod_hash: zaszyfrujKod(nowy), nieudane: 0, blokada_do: null })
      .eq("email", email);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno kod]", e);
    return NextResponse.json({ ok: false, blad: t("Couldn't change your code. Try again.", "Nie udało się zmienić kodu. Spróbuj ponownie.") }, { status: 500 });
  }
}
