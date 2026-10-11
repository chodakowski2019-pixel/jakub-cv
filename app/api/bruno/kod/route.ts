import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hasloDoLogowania, kodPasuje, poprawneHaslo, zalogowanyEmail, zaszyfrujKod } from "@/lib/bruno/auth";
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
    // 11.10: kod → hasło. Obecne: hasło albo stary 6-cyfrowy kod. Nowe: 8-72 znaki.
    const stary = hasloDoLogowania(b.stary);
    const nowy = poprawneHaslo(b.nowy);
    if (!stary || !nowy) return NextResponse.json({ ok: false, blad: t("New password: at least 8 characters.", "Nowe hasło: co najmniej 8 znaków.") }, { status: 400 });
    if (!konto || !kodPasuje(stary, konto.kod_hash)) {
      return NextResponse.json({ ok: false, blad: t("Your current password doesn't match.", "Obecne hasło się nie zgadza.") }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("bruno_konta")
      .update({ kod_hash: zaszyfrujKod(nowy), nieudane: 0, blokada_do: null })
      .eq("email", email);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno kod]", e);
    return NextResponse.json({ ok: false, blad: t("Couldn't change your password. Try again.", "Nie udało się zmienić hasła. Spróbuj ponownie.") }, { status: 500 });
  }
}
