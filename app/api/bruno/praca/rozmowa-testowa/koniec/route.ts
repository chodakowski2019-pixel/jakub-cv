import { NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Wypowiedz } from "@/lib/bruno/db";
import { policzMetryki } from "@/lib/bruno/metryki";
import { listaObiekcji } from "@/lib/bruno/obiekcje";
import { opisCelu } from "@/lib/bruno/postacie";
import { ocenRozmowe } from "@/lib/bruno/rubryka";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { SCENARIUSZE_TESTU, SEKUND_TESTU, SEKUND_TESTU_MAX, konfigTestu, mozeNagrywac, sciagnijNagranieTestu } from "@/lib/bruno/praca/rozmowy-testowe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/bruno/praca/rozmowa-testowa/koniec
// Przeglądarka przysyła transkrypcję. Serwer liczy czas od startu w bazie (z sufitem), zapisuje, ściąga nagranie
// z ElevenLabs do naszego kubełka i woła trenera (ta sama rubryka co w panelu Bruno).
export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || !mozeNagrywac(konto.email)) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = String(b?.rozmowa_id ?? "");
  const { data: rozmowa } = id ? await supabaseAdmin.from("praca_rozmowy_testowe").select("*").eq("id", id).eq("konto_id", konto.id).maybeSingle() : { data: null };
  if (!rozmowa) return NextResponse.json({ ok: false, blad: "Nie znaleziono rozmowy." }, { status: 404 });
  if (rozmowa.status !== "trwa") return NextResponse.json({ ok: true, przerwana: rozmowa.status === "przerwana", ocena: rozmowa.ocena });
  const s = SCENARIUSZE_TESTU.find((x) => x.nr === rozmowa.nr)!;

  const transkrypcja: Wypowiedz[] = Array.isArray(b?.transkrypcja)
    ? b.transkrypcja
        .filter((w: Wypowiedz) => w && (w.rola === "handlowiec" || w.rola === "klient") && typeof w.tekst === "string")
        .map((w: Wypowiedz) => ({ rola: w.rola, tekst: w.tekst.slice(0, 2000), t: Math.max(0, Number(w.t) || 0) }))
        .slice(0, 400)
    : [];
  const odStartu = (Date.now() - new Date(rozmowa.start).getTime()) / 1000;
  const zPrzegladarki = Number(b?.sekundy) || 0;
  const sekundy = Math.round(Math.min(SEKUND_TESTU_MAX, Math.max(0, Math.min(odStartu, zPrzegladarki || odStartu))));
  const elId = typeof b?.el_conversation_id === "string" ? b.el_conversation_id.slice(0, 120) : null;
  const konfig = konfigTestu(s);
  const metryki = policzMetryki(transkrypcja, sekundy, listaObiekcji(konfig.obiekcje), "pl");
  const koniec = new Date().toISOString();

  // Za krótka albo pusta rozmowa nie jest zaliczona: handlowiec nagrywa ten scenariusz jeszcze raz.
  if (sekundy < 60 || metryki.slowa_handlowca < 20) {
    await supabaseAdmin.from("praca_rozmowy_testowe").update({ status: "przerwana", koniec, sekundy, transkrypcja, el_conversation_id: elId }).eq("id", id);
    return NextResponse.json({ ok: true, przerwana: true });
  }
  await supabaseAdmin.from("praca_rozmowy_testowe").update({ status: "zakonczona", koniec, sekundy, transkrypcja, el_conversation_id: elId }).eq("id", id);
  if (elId) {
    after(async () => {
      await sciagnijNagranieTestu({ id, kontoId: konto.id, elId, proby: 3 });
    });
  }
  try {
    const feedback = await ocenRozmowe({ transkrypcja, metryki, konfig, postac: s.postac, tryb: s.tryb, cel: opisCelu(s.cel, null, "pl"), obiekcja: s.obiekcja, poziom: s.poziom, imie: konto.imie, ucieta_limitem: b?.powod === "limit" || sekundy >= SEKUND_TESTU, jezyk: "pl" });
    await supabaseAdmin.from("praca_rozmowy_testowe").update({ feedback, ocena: feedback.ocena }).eq("id", id);
    return NextResponse.json({ ok: true, ocena: feedback.ocena });
  } catch (e) {
    console.error("[praca rozmowa testowa] trener", e);
    return NextResponse.json({ ok: true, ocena: null });
  }
}
