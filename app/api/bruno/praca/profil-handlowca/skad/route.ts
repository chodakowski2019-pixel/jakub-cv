import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/profil-handlowca/skad (12.11, USER_001): „Ostatnie pytanie” po wysłaniu profilu,
// handlowiec pisze, skąd się o nas dowiedział. JSON { skad: tekst }. Zapis w odpowiedziach profilu (klucz skad), bez zmiany statusu.
export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || konto.typ !== "kandydat") return NextResponse.json({ ok: false, blad: "Zaloguj się na konto kandydata." }, { status: 401 });
  const j = (await req.json().catch(() => null)) as { skad?: unknown } | null;
  const skad = String(j?.skad ?? "").trim().slice(0, 300);
  if (!skad) return NextResponse.json({ ok: false, blad: "Napisz, skąd się o nas dowiedziałeś." }, { status: 400 });
  const { data } = await supabaseAdmin.from("praca_profile_handlowcow").select("odpowiedzi").eq("konto_id", konto.id).maybeSingle();
  if (!data) return NextResponse.json({ ok: false, blad: "Najpierw wyślij profil." }, { status: 400 });
  const { error } = await supabaseAdmin
    .from("praca_profile_handlowcow")
    .update({ odpowiedzi: { ...(data.odpowiedzi as Record<string, unknown>), skad } })
    .eq("konto_id", konto.id);
  if (error) {
    console.error("[praca profil skad]", error);
    return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
