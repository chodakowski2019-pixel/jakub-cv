import { NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { sciagnijNagranieEl } from "@/lib/bruno/nagrania";
import { ROZMOWA_SEKUND, ROZMOWA_SEKUND_MAX, listaObiekcji, pobierzKonfig, pobierzKonto, type Wypowiedz } from "@/lib/bruno/db";
import { dodajKartyPoprawek, zaktualizujKarty } from "@/lib/bruno/fsrs";
import { kartyZFeedbacku } from "@/lib/bruno/fiszka";
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
  if (!id) return NextResponse.json({ ok: false, blad: "Missing call ID." }, { status: 400 });

  const { data: rozmowa } = await supabaseAdmin.from("bruno_rozmowy").select("*").eq("id", id).eq("email", email).maybeSingle();
  if (!rozmowa) return NextResponse.json({ ok: false, blad: "Call not found." }, { status: 404 });
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
  // ElevenLabs trzyma nagranie i transkrypcję u siebie pod id rozmowy (2.10).
  const elId = typeof b?.el_conversation_id === "string" ? b.el_conversation_id.slice(0, 120) : null;

  // Ścieżka ElevenLabs nie nagrywa w przeglądarce: audio ściągamy z ich konta po
  // odpowiedzi (`after`), bo plik bywa gotowy kilka sekund po rozłączeniu. Gdy się
  // nie uda, dobierze je cron (`dociagnijNagraniaEl`).
  if (elId && !nagranie) {
    after(async () => {
      await sciagnijNagranieEl({ email, rozmowaId: id, elId, proby: 3 });
    });
  }

  const [konfig, konto] = await Promise.all([pobierzKonfig(email), pobierzKonto(email)]);
  const metrykiCzyste = policzMetryki(transkrypcja, sekundy, listaObiekcji(konfig.obiekcje));
  // Koniec przez limit czasu aplikacji (przeglądarka mówi „limit" albo czas doszedł do sufitu rozmowy).
  const ucietaLimitem = b?.powod === "limit" || sekundy >= ROZMOWA_SEKUND;
  // Diagnostyka jakości dźwięku (2.10): statystyki WebRTC i błędy Realtime z przeglądarki, zapisywane obok metryk.
  const rtc = b?.rtc && typeof b.rtc === "object" ? JSON.parse(JSON.stringify(b.rtc).slice(0, 4000)) : undefined;
  const metryki = rtc ? { ...metrykiCzyste, rtc } : metrykiCzyste;
  const koniec = new Date().toISOString();

  // Za krótka albo pusta rozmowa: zapisujemy, nie wołamy trenera, nie liczymy do planu dnia.
  const slowaH = metrykiCzyste.slowa_handlowca;
  if (sekundy < 20 || slowaH < 5) {
    await supabaseAdmin
      .from("bruno_rozmowy")
      .update({ status: "przerwana", koniec, sekundy, transkrypcja, metryki, nagranie_sciezka: nagranie, ...(elId ? { el_conversation_id: elId } : {}) })
      .eq("id", id);
    return NextResponse.json({ ok: true, przerwana: true, id });
  }

  await supabaseAdmin
    .from("bruno_rozmowy")
    .update({ status: "zakonczona", koniec, sekundy, transkrypcja, metryki, nagranie_sciezka: nagranie, ...(elId ? { el_conversation_id: elId } : {}) })
    .eq("id", id);

  try {
    const feedback = await ocenRozmowe({
      transkrypcja,
      metryki: metrykiCzyste,
      konfig,
      postac: postacLubDomyslna(rozmowa.postac),
      tryb: trybLubDomyslny(rozmowa.tryb),
      cel: opisCelu(celLubDomyslny(rozmowa.cel), rozmowa.cel_wlasny),
      obiekcja: rozmowa.obiekcja ?? null,
      poziom: rozmowa.poziom ?? null,
      imie: konto?.imie ?? null,
      ucieta_limitem: ucietaLimitem,
      sytuacja: rozmowa.sytuacja ?? null,
    });
    await supabaseAdmin.from("bruno_rozmowy").update({ feedback, ocena: feedback.ocena }).eq("id", id);
    await zaktualizujKarty(email, feedback);
    // Minusy z tej rozmowy → fiszki „do poprawy" w Treningu (USER_001 2.10).
    try {
      const nowe = await kartyZFeedbacku({ feedback, produkt: konfig.produkt });
      await dodajKartyPoprawek(email, nowe, id);
    } catch (e) {
      console.error("[bruno koniec] karty poprawek", e);
    }
    return NextResponse.json({ ok: true, id, feedback, ocena: feedback.ocena });
  } catch (e) {
    console.error("[bruno koniec] trener", e);
    // Powód błędu zapisujemy przy rozmowie (1.10: na produkcji feedback=null
    // bez śladu, a logów Vercela nie da się ściągnąć z CLI). Krótki, bez kluczy.
    const err = e as { status?: number; message?: string };
    const trener_blad = `${err?.status ?? ""} ${String(err?.message ?? e).slice(0, 300)}`.trim();
    await supabaseAdmin.from("bruno_rozmowy").update({ metryki: { ...metryki, trener_blad } }).eq("id", id);
    return NextResponse.json({ ok: true, id, feedback: null, blad: "Call saved, but the coach didn't respond. Try refreshing your history.", trener_blad });
  }
}
