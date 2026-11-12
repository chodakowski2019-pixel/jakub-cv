import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { KROKI } from "@/lib/bruno/praca/profil-handlowca";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/profil-handlowca/postep (12.11, USER_001): formularz profilu zapisuje, na którym kroku jest handlowiec
// i co wpisał do tej pory (przy otwarciu i przy każdym „Dalej”). JSON { krok: 0..KROKI.length-1, odpowiedzi: {...} }.
// Panel administratora giełdy pokazuje to w zakładce „Niedokończone”. Pliki (CV, zdjęcie) idą dopiero z wysłaniem profilu.
export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || konto.typ !== "kandydat") return NextResponse.json({ ok: false }, { status: 401 });
  const j = (await req.json().catch(() => null)) as { krok?: unknown; odpowiedzi?: unknown } | null;
  const krok = Number(j?.krok);
  if (!Number.isInteger(krok) || krok < 0 || krok >= KROKI.length) return NextResponse.json({ ok: false }, { status: 400 });
  const odp = j?.odpowiedzi && typeof j.odpowiedzi === "object" && !Array.isArray(j.odpowiedzi) ? j.odpowiedzi : {};
  if (JSON.stringify(odp).length > 20_000) return NextResponse.json({ ok: false }, { status: 413 });
  // Najdalszy krok i wcześniejsze odpowiedzi zostają: ponowne otwarcie formularza (krok 0, w nowej karcie bez szkicu)
  // nie cofa etapu, do którego handlowiec już doszedł, i nie kasuje tego, co wpisał.
  const { data: teraz } = await supabaseAdmin.from("praca_konta").select("formularz_krok,formularz_szkic").eq("id", konto.id).maybeSingle();
  const najdalej = Math.max(krok, (teraz?.formularz_krok as number | null) ?? 0);
  const szkic = { ...((teraz?.formularz_szkic as Record<string, unknown> | null) ?? {}), ...odp };
  const { error } = await supabaseAdmin.from("praca_konta").update({ formularz_krok: najdalej, formularz_szkic: szkic, formularz_at: new Date().toISOString() }).eq("id", konto.id);
  if (error) {
    console.error("[praca profil postęp]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
