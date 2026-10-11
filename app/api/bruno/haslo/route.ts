import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizujEmail, noweHasloTymczasowe, zaszyfrujKod } from "@/lib/bruno/auth";
import { jezykDomeny, pobierzKonto } from "@/lib/bruno/db";
import { htmlNoweHaslo, wyslij } from "@/lib/bruno/mail";

export const dynamic = "force-dynamic";

// POST /api/bruno/haslo { email } (11.10, USER_001): „Nie pamiętasz hasła?”. Nowe hasło tymczasowe
// mailem, zmiana w Ustawieniach. Odpowiedź zawsze ta sama (formularz nie zdradza, kto ma konto).
// Ochrona przed zasypywaniem: najwyżej raz na 2 minuty na konto (haslo_reset_at; blokada logowania osobno).

const ODSTEP_MS = 2 * 60 * 1000;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normalizujEmail(b.email);
  const ok = NextResponse.json({ ok: true });
  if (!email) return ok;
  const konto = await pobierzKonto(email);
  if (!konto || !konto.aktywne) return ok;
  if (konto.haslo_reset_at && Date.now() - new Date(konto.haslo_reset_at).getTime() < ODSTEP_MS) return ok;

  const haslo = noweHasloTymczasowe();
  const { error } = await supabaseAdmin
    .from("bruno_konta")
    .update({ kod_hash: zaszyfrujKod(haslo), nieudane: 0, blokada_do: null, haslo_reset_at: new Date().toISOString() })
    .eq("email", email);
  if (error) {
    console.error("[bruno haslo]", error.message);
    return ok;
  }
  const jezyk = (await jezykDomeny()) ?? (konto.jezyk === "pl" ? "pl" : "en");
  try {
    await wyslij({
      do: email,
      rodzaj: "dostep",
      temat: jezyk === "pl" ? "Bruno AI: Twoje nowe hasło" : "Bruno AI: your new password",
      html: htmlNoweHaslo({ imie: konto.imie, haslo, jezyk }),
    });
  } catch (e) {
    console.error("[bruno haslo] mail", e);
  }
  return ok;
}
