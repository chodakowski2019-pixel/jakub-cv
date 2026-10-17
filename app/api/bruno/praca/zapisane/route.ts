import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/zapisane (17.10): zalogowany kandydat zapisuje / usuwa ofertę (serce). Bez konta zapis zostaje w przeglądarce.
// { ids: [...] } = scalenie zapisanych z przeglądarki po zalogowaniu.
export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || konto.typ !== "kandydat") return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b.ids) ? b.ids.slice(0, 200).map(String) : b.id ? [String(b.id)] : [];
  if (b.on === false && ids[0]) {
    await supabaseAdmin.from("praca_zapisane").delete().eq("konto_id", konto.id).eq("oferta_id", ids[0]);
  } else if (ids.length) {
    await supabaseAdmin.from("praca_zapisane").upsert(ids.map((oferta_id) => ({ konto_id: konto.id, oferta_id })), { onConflict: "konto_id,oferta_id" });
  }
  const { data } = await supabaseAdmin.from("praca_zapisane").select("oferta_id").eq("konto_id", konto.id);
  return NextResponse.json({ ok: true, ids: (data ?? []).map((x) => x.oferta_id) });
}
