import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { ROZMOW_TESTOWYCH, SCENARIUSZ_TESTU, SEKUND_TESTU, SYTUACJA_TESTU, STARTOW_MAX, konfigTestu, mozeNagrywac, odpowiedziProfilu, stanTestu, sytuacjaZProfilu } from "@/lib/bruno/praca/rozmowy-testowe";
import { instrukcjeKlienta } from "@/lib/bruno/postacie";
import { MIN_KREDYTOW_EL, elevenlabsWlaczone, glosElevenlabs, pierwszaWypowiedz, podpisanyUrlEl, polaczenieEl, tokenRozmowyEl, ustawieniaGlosu, wolneKredytyEl } from "@/lib/bruno/elevenlabs";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/rozmowa-testowa/start
// 16.11 (USER_001): rozmowa testowa handlowca giełdy (zakładka „Nagraj rozmowę”). Twarde odcięcie PRZED startem:
// 2 zaliczone podejścia albo 4 starty łącznie = koniec. Jedna rozmowa (SCENARIUSZ_TESTU), powtarzana do 3 razy.
// Tylko ElevenLabs: nagranie ściągamy z ich konta, więc bez nich nie byłoby czego pokazać firmie.
export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || !mozeNagrywac(konto)) return NextResponse.json({ ok: false, blad: "Zaloguj się." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b?.zgoda !== true) return NextResponse.json({ ok: false, blad: "Zaznacz zgodę na nagranie i udostępnienie rozmowy firmom." }, { status: 400 });

  // Porzucone podejścia (zamknięta karta) nie mogą wisieć jako „trwa”.
  await supabaseAdmin.from("praca_rozmowy_testowe").update({ status: "przerwana", koniec: new Date().toISOString() }).eq("konto_id", konto.id).eq("status", "trwa");
  const stan = await stanTestu(konto.id);
  if (!stan.nastepna) {
    const wszystkie = stan.zaliczone >= ROZMOW_TESTOWYCH;
    return NextResponse.json({ ok: false, kod: "limit", blad: wszystkie ? `Wszystkie ${ROZMOW_TESTOWYCH} podejścia są już wykorzystane.` : `Wykorzystane wszystkie ${STARTOW_MAX} podejść. Napisz do nas, odblokujemy kolejne.` }, { status: 403 });
  }
  if (!elevenlabsWlaczone()) return NextResponse.json({ ok: false, blad: "Rozmowy z Bruno są chwilowo niedostępne. Spróbuj później." }, { status: 503 });
  const wolne = await wolneKredytyEl();
  if (wolne !== null && wolne < MIN_KREDYTOW_EL) {
    console.error("[praca rozmowa testowa] ElevenLabs: brak kredytów", wolne);
    return NextResponse.json({ ok: false, blad: "Rozmowy z Bruno są chwilowo niedostępne. Spróbuj później." }, { status: 503 });
  }

  const s = SCENARIUSZ_TESTU;
  // Bruno gra klienta z branży handlowca (profil); handlowiec bez profilu = branża domyślna. Branżę z żądania bierze tylko konto testowe.
  const odp = await odpowiedziProfilu(konto.id);
  const syt = konto.typ === "kandydat" ? sytuacjaZProfilu(odp ?? {}) : sytuacjaZProfilu(odp, typeof b?.branza === "string" ? b.branza : null);
  const konfig = konfigTestu(syt);
  const { data: rozmowa, error } = await supabaseAdmin.from("praca_rozmowy_testowe").insert({ konto_id: konto.id, nr: stan.nastepna, zgoda_udostepnienia: true, branza: syt.branza, segment: syt.segment }).select("id").single();
  if (error || !rozmowa) {
    console.error("[praca rozmowa testowa] insert", error);
    return NextResponse.json({ ok: false, blad: "Nie udało się zapisać rozmowy. Spróbuj ponownie." }, { status: 500 });
  }
  try {
    const polaczenie = polaczenieEl();
    const [token, pierwsza] = await Promise.all([
      polaczenie === "webrtc" ? tokenRozmowyEl() : podpisanyUrlEl(),
      pierwszaWypowiedz({ tryb: s.tryb, postac: s.postac, konfig, obiekcja: s.obiekcje[0], sytuacja: SYTUACJA_TESTU, jezyk: "pl" }),
    ]);
    return NextResponse.json({
      ok: true,
      rozmowa_id: rozmowa.id,
      nr: stan.nastepna,
      polaczenie,
      token,
      prompt: instrukcjeKlienta(konfig, s.postac, { tryb: s.tryb, cel: s.cel, poziom: s.poziom, obiekcja: s.obiekcje.join(" · "), obiekcje: s.obiekcje, sytuacja: SYTUACJA_TESTU }, "pl"),
      pierwsza_wypowiedz: pierwsza,
      glos: glosElevenlabs(s.postac, "pl", "m"),
      glos_ustawienia: ustawieniaGlosu("pl", "m"),
      sekundy: SEKUND_TESTU,
    });
  } catch (e) {
    console.error("[praca rozmowa testowa] elevenlabs", e);
    // Nieudane połączenie nie zjada podejścia.
    await supabaseAdmin.from("praca_rozmowy_testowe").delete().eq("id", rozmowa.id);
    return NextResponse.json({ ok: false, blad: "Nie udało się połączyć z Bruno. Spróbuj ponownie." }, { status: 502 });
  }
}
