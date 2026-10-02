import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { ROZMOWA_SEKUND_MAX, pobierzKonfig, type Wypowiedz } from "@/lib/bruno/db";
import { zaktualizujKarty } from "@/lib/bruno/fsrs";
import { policzMetryki } from "@/lib/bruno/metryki";
import { celLubDomyslny, opisCelu, postacLubDomyslna, trybLubDomyslny } from "@/lib/bruno/postacie";
import { ocenRozmowe } from "@/lib/bruno/rubryka";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/bruno/rozmowa/koniec
// Przeglądarka przysyła transkrypcję i czas. Serwer liczy czas po swojemu
// (od startu w bazie), z sufitem, zapisuje, woła trenera i aktualizuje karty.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = String(b?.rozmowa_id ?? "");
  if (!id) return NextResponse.json({ ok: false, blad: "Brak id rozmowy." }, { status: 400 });

  const { data: rozmowa } = await supabaseAdmin.from("bruno_rozmowy").select("*").eq("id", id).eq("email", email).maybeSingle();
  if (!rozmowa) return NextResponse.json({ ok: false, blad: "Nie ma takiej rozmowy." }, { status: 404 });
  if (rozmowa.status === "zakonczona" && rozmowa.feedback) {
    return NextResponse.json({ ok: true, feedback: rozmowa.feedback, ocena: rozmowa.ocena, id });
  }

  const transkrypcja: Wypowiedz[] = Array.isArray(b?.transkrypcja)
    ? b.transkrypcja
        .filter((w: Wypowiedz) => w && (w.rola === "handlowiec" || w.rola === "klient") && typeof w.tekst === "string")
        .map((w: Wypowiedz) => ({ rola: w.rola, tekst: w.tekst.slice(0, 2000), t: Math.max(0, Number(w.t) || 0) }))
        .slice(0, 400)
    : [];

  const odStartu = (Date.now() - new Date(rozmowa.start).getTime()) / 1000;
  const zPrzegladarki = Number(b?.sekundy) || 0;
  const sekundy = Math.round(Math.min(ROZMOWA_SEKUND_MAX, Math.max(0, Math.min(odStartu, zPrzegladarki || odStartu))));
  const nagranie = typeof b?.nagranie_sciezka === "string" ? b.nagranie_sciezka.slice(0, 300) : null;

  const metrykiCzyste = policzMetryki(transkrypcja, sekundy);
  // Diagnostyka jakości dźwięku (2.10): statystyki WebRTC i błędy Realtime z przeglądarki, zapisywane obok metryk.
  const rtc = b?.rtc && typeof b.rtc === "object" ? JSON.parse(JSON.stringify(b.rtc).slice(0, 4000)) : undefined;
  const metryki = rtc ? { ...metrykiCzyste, rtc } : metrykiCzyste;
  const koniec = new Date().toISOString();

  // Za krótka albo pusta rozmowa: zapisujemy, nie wołamy trenera, nie liczymy do planu dnia.
  const slowaH = metrykiCzyste.slowa_handlowca;
  if (sekundy < 20 || slowaH < 5) {
    await supabaseAdmin
      .from("bruno_rozmowy")
      .update({ status: "przerwana", koniec, sekundy, transkrypcja, metryki, nagranie_sciezka: nagranie })
      .eq("id", id);
    return NextResponse.json({ ok: true, przerwana: true, id });
  }

  await supabaseAdmin
    .from("bruno_rozmowy")
    .update({ status: "zakonczona", koniec, sekundy, transkrypcja, metryki, nagranie_sciezka: nagranie })
    .eq("id", id);

  try {
    const konfig = await pobierzKonfig(email);
    const feedback = await ocenRozmowe({
      transkrypcja,
      metryki: metrykiCzyste,
      konfig,
      postac: postacLubDomyslna(rozmowa.postac),
      tryb: trybLubDomyslny(rozmowa.tryb),
      cel: opisCelu(celLubDomyslny(rozmowa.cel), rozmowa.cel_wlasny),
      obiekcja: rozmowa.obiekcja ?? null,
    });
    await supabaseAdmin.from("bruno_rozmowy").update({ feedback, ocena: feedback.ocena }).eq("id", id);
    await zaktualizujKarty(email, feedback);
    return NextResponse.json({ ok: true, id, feedback, ocena: feedback.ocena });
  } catch (e) {
    console.error("[bruno koniec] trener", e);
    // Powód błędu zapisujemy przy rozmowie (1.10: na produkcji feedback=null
    // bez śladu, a logów Vercela nie da się ściągnąć z CLI). Krótki, bez kluczy.
    const err = e as { status?: number; message?: string };
    const trener_blad = `${err?.status ?? ""} ${String(err?.message ?? e).slice(0, 300)}`.trim();
    await supabaseAdmin.from("bruno_rozmowy").update({ metryki: { ...metryki, trener_blad } }).eq("id", id);
    return NextResponse.json({ ok: true, id, feedback: null, blad: "Rozmowa zapisana, trener nie odpowiedział. Spróbuj odświeżyć historię.", trener_blad });
  }
}
