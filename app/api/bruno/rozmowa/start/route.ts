import { NextResponse } from "next/server";
import { dobierzRozmowe } from "@/lib/bruno/dobor";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import {
  PLAN_FREE,
  ROZMOWA_SEKUND,
  pulaFree,
  rozmowyFreeZuzyte,
  limitDzienny,
  pelnyDostep,
  pobierzKonfig,
  pobierzKonto,
  poprzedniaRozmowa,
  rozmowyDzis,
  stanDostepu,
  zamknijPorzucone,
  zuzyteSekundy,
  type Karta,
} from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";
import { POSTACIE, celLubDomyslny, instrukcjeKlienta, postacLubDomyslna, poziomLubDomyslny, trybLubDomyslny } from "@/lib/bruno/postacie";
import { listaObiekcji } from "@/lib/bruno/obiekcje";
import { zapewnijScenariusz } from "@/lib/bruno/scenariusze";
import { jezykLubDomyslny } from "@/lib/bruno/domeny";
import { etykiety } from "@/lib/bruno/etykiety";
import { mnoga, tDla } from "@/lib/bruno/i18n";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";
import { MIN_KREDYTOW_EL, elevenlabsWlaczone, glosElevenlabs, plecGlosu, ustawieniaGlosu, pierwszaWypowiedz, podpisanyUrlEl, polaczenieEl, tokenRozmowyEl, wolneKredytyEl } from "@/lib/bruno/elevenlabs";

export const dynamic = "force-dynamic";

// POST /api/bruno/rozmowa/start
//
// Twarde odcięcie na limicie PRZED startem (zasada nr 2 z /bruno): serwer
// sprawdza dostęp, limit sekund testu i plan dnia, dopiero potem wydaje
// klucz tymczasowy do OpenAI Realtime. Sam klucz żyje minutę i służy tylko
// do nawiązania połączenia WebRTC z przeglądarki.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: tDla(await jezykZadania())("Log in.", "Zaloguj się.") }, { status: 401 });
  // 11.10: język konta steruje promptem Bruno, głosem, pierwszą wypowiedzią i komunikatami.
  const konto = await pobierzKonto(email);
  const jezyk = jezykLubDomyslny(konto?.jezyk);
  const t = tDla(jezyk);
  // Dostawca głosu (2.10): ElevenLabs, a gdy kredyty się kończą albo ElevenLabs nie odpowiada → OpenAI automatycznie.
  let dostawca: "elevenlabs" | "openai" = elevenlabsWlaczone() ? "elevenlabs" : "openai";
  let powodZmiany: string | null = null;
  if (dostawca === "elevenlabs") {
    const wolne = await wolneKredytyEl();
    if (wolne !== null && wolne < MIN_KREDYTOW_EL) {
      dostawca = "openai";
      powodZmiany = `ElevenLabs: zostało ${wolne} kredytów (< ${MIN_KREDYTOW_EL})`;
    }
  }
  if (dostawca === "openai" && !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, blad: t("OPENAI_API_KEY is missing on the server.", "Brak OPENAI_API_KEY na serwerze.") }, { status: 500 });
  }

  const stan = stanDostepu(konto);
  if (!konto || !stan.aktywny) return NextResponse.json({ ok: false, blad: t("Your trial access has expired.", "Twój dostęp testowy wygasł.") }, { status: 403 });

  await zamknijPorzucone(email);
  const zuzyte = await zuzyteSekundy(email);
  const zostalo = konto.limit_sekund - zuzyte;
  if (zostalo < 60) {
    return NextResponse.json(
      { ok: false, blad: t("You've used up your trial minutes.", "Minuty testu się skończyły."), kod: "limit" },
      { status: 403 },
    );
  }
  // 9.10: plan „free” (rejestracja B2C) = 3 rozmowy łącznie, liczone od założenia konta.
  // 10.10: liczą się rozmowy zakończone albo przerwane po ≥ 60 s (`rozmowyFreeZuzyte`), nie każdy wpis.
  if (konto.plan === PLAN_FREE) {
    const zuzyteFree = await rozmowyFreeZuzyte(email);
    // 17.10: pula per konto (demo B2B = 1, stare konta B2C = 3).
    const pula = pulaFree(konto);
    if (zuzyteFree >= pula) {
      return NextResponse.json(
        { ok: false, blad: pula === 1 ? t("You've used your demo call.", "Rozmowa demo jest już wykorzystana.") : t(`You've used all ${pula} free calls.`, `Wszystkie ${pula} bezpłatne rozmowy są już wykorzystane.`), kod: "limit" },
        { status: 403 },
      );
    }
  }
  const dzis = await rozmowyDzis(email);
  const dziennie = limitDzienny(konto);
  if (dzis >= dziennie) {
    return NextResponse.json(
      {
        ok: false,
        blad: t(
          `Today's plan is done: ${dziennie} ${dziennie === 1 ? "call" : "calls"}. Come back tomorrow.`,
          `Plan na dziś zrobiony: ${dziennie} ${mnoga("pl", dziennie, ["", ""], ["rozmowa", "rozmowy", "rozmów"])}. Wróć jutro.`,
        ),
        kod: "plan",
      },
      { status: 403 },
    );
  }

  const b = await req.json().catch(() => ({}));
  const konfig = await pobierzKonfig(email);
  // 25.10 (USER_001): autorski dobór rozmowy. Kreator nie wysyła ustawień, serwer dobiera je z historii (lib/bruno/dobor.ts).
  // „Rozmowa, którą masz jutro” (sytuacja) i powtórka karty dalej działają: sytuacja jest nadrzędna, karta obiekcji wygrywa.
  if (b.auto === true) {
    const dobor = await dobierzRozmowe(email, konfig);
    // Powtórka konkretnej obiekcji (fiszka z Treningu) ma pierwszeństwo przed doborem.
    Object.assign(b, { ...dobor, obiekcje: Array.isArray(b.obiekcje) && b.obiekcje.length ? b.obiekcje : dobor.obiekcje });
  }
  // 16.10 (USER_001): głos klienta wybierany w kreatorze (krok 2) ma pierwszeństwo; zapis do konfiguracji robi kreator.
  if (b.glos === "m" || b.glos === "k") konfig.glos = b.glos;
  await zapewnijKarty(email, konfig, jezyk);
  const postac = postacLubDomyslna(b.postac ?? konfig.postac);
  // Ustawienia wybrane przed rozmową (2.10): tryb, cel, obiekcja.
  const tryb = trybLubDomyslny(b.tryb);
  const cel = celLubDomyslny(b.cel);
  // Poziom trudności (2.10): zmienia tylko zachowanie Bruno, nie rubrykę trenera.
  const poziom = poziomLubDomyslny(b.poziom);
  const celWlasny = cel === "wlasny" ? String(b.cel_wlasny ?? "").trim().slice(0, 300) || null : null;
  const dostepne = listaObiekcji(konfig.obiekcje);
  // Kilka obiekcji naraz (2.10): tablica `obiekcje`, "__losowa__" = jedna losowa z konfiguracji. Stare `obiekcja` dalej działa.
  let wybrane: string[] = Array.isArray(b.obiekcje)
    ? b.obiekcje.filter((o: unknown): o is string => typeof o === "string" && o.trim().length > 0).map((o: string) => o.trim().slice(0, 300)).slice(0, 6)
    : typeof b.obiekcja === "string" && b.obiekcja.trim()
      ? [b.obiekcja.trim().slice(0, 300)]
      : [];
  if (wybrane.includes("__losowa__")) wybrane = dostepne.length ? [dostepne[Math.floor(Math.random() * dostepne.length)]] : [];
  let obiekcja: string | null = wybrane.length ? wybrane.join(" · ") : null;

  let karta: Karta | null = null;
  if (typeof b.karta_id === "string" && b.karta_id) {
    const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).eq("id", b.karta_id).maybeSingle();
    karta = (data as Karta | null) ?? null;
  }
  if (!obiekcja && karta?.typ === "obiekcja") {
    obiekcja = karta.tresc;
    wybrane = [karta.tresc];
  }
  // Karta FSRS = pierwsza z wybranych obiekcji.
  if (!karta && wybrane.length) {
    const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).eq("typ", "obiekcja").eq("tresc", wybrane[0]).maybeSingle();
    karta = (data as Karta | null) ?? null;
  }

  const sekundyTejRozmowy = Math.min(ROZMOWA_SEKUND, zostalo);
  // „Rozmowa, którą masz jutro" (9.10, moduł płatny): sytuacja z życia, TYLKO dla kont z pełnym dostępem.
  // Trial ją ignoruje po stronie serwera, nawet gdy ktoś wyśle pole ręcznie.
  const sytuacja = pelnyDostep(konto) && typeof b.sytuacja === "string" ? b.sytuacja.trim().slice(0, 3000) || null : null;
  // Scenariusz = powtarzalny egzamin (tryb + typ klienta + cel + obiekcje). Powstaje
  // sam z wyborów w kreatorze, żeby dwie rozmowy z tym samym wsadem dały się porównać.
  const scenariuszId = await zapewnijScenariusz(email, { tryb, postac, cel, celWlasny, obiekcje: wybrane, poziom });
  const { data: rozmowa, error } = await supabaseAdmin
    .from("bruno_rozmowy")
    .insert({ email, postac, karta_id: karta?.id ?? null, status: "trwa", tryb, cel, cel_wlasny: celWlasny, obiekcja, poziom, dostawca, scenariusz_id: scenariuszId, sytuacja })
    .select("id")
    .single();
  if (error || !rozmowa) {
    console.error("[bruno start] insert", error);
    return NextResponse.json({ ok: false, blad: t("Couldn't save the call. Try again.", "Nie udało się zapisać rozmowy. Spróbuj ponownie.") }, { status: 500 });
  }

  // 12.10 (E29): pamięć klienta. W trybach „na żywo” i „online” Bruno pamięta ostatnią zakończoną rozmowę
  // z tym samym typem klienta z ostatnich 30 dni (data, cel, obiekcja, czy był następny krok). Cold call = bez pamięci.
  const poprzednia = tryb !== "cold" ? await poprzedniaRozmowa(email, postac, rozmowa.id) : null;
  const instrukcje = instrukcjeKlienta(konfig, postac, { tryb, cel, celWlasny, poziom, obiekcja, obiekcje: wybrane, karta, sytuacja, poprzednia }, jezyk);
  const postacNazwa = etykiety(jezyk).POSTACIE[postac].nazwa;

  // ElevenLabs Agents (2.10): token WebRTC + nadpisania per rozmowa. Prompt idzie przez przeglądarkę
  // (tak działają nadpisania w SDK), więc nie ma w nim nic tajnego: to opis klienta z „Dostosuj Bruno".
  if (dostawca === "elevenlabs") {
    try {
      // 27.10: aplikacja mobilna (@elevenlabs/react-native) łączy się tylko przez WebRTC (LiveKit).
      const polaczenie = b.aplikacja === true ? "webrtc" : polaczenieEl();
      const [token, pierwsza] = await Promise.all([
        polaczenie === "webrtc" ? tokenRozmowyEl() : podpisanyUrlEl(),
        pierwszaWypowiedz({ tryb, postac, konfig, obiekcja: wybrane[0] ?? obiekcja, sytuacja, jezyk }),
      ]);
      return NextResponse.json({
        ok: true,
        dostawca,
        polaczenie,
        rozmowa_id: rozmowa.id,
        token,
        prompt: instrukcje,
        pierwsza_wypowiedz: pierwsza,
        glos: glosElevenlabs(postac, jezyk, plecGlosu(konfig.glos)),
        // 11.10: ustawienia głosu (płynność) dla wybranego głosu, null = ustawienia agenta.
        glos_ustawienia: ustawieniaGlosu(jezyk, plecGlosu(konfig.glos)),
        // 11.10: przeglądarka ustawia z tego `language` w nadpisaniach agenta ElevenLabs.
        jezyk,
        sekundy: sekundyTejRozmowy,
        postac,
        postac_nazwa: postacNazwa,
        tryb,
        cel,
        poziom,
        obiekcja,
        karta: karta ? { typ: karta.typ, tresc: karta.tresc } : null,
      });
    } catch (e) {
      console.error("[bruno start] elevenlabs → OpenAI", e);
      powodZmiany = `ElevenLabs nie wydało tokenu: ${String((e as Error)?.message ?? e).slice(0, 120)}`;
      dostawca = "openai";
      if (!process.env.OPENAI_API_KEY) {
        await supabaseAdmin.from("bruno_rozmowy").update({ status: "przerwana", koniec: new Date().toISOString(), sekundy: 0 }).eq("id", rozmowa.id);
        return NextResponse.json({ ok: false, blad: t("ElevenLabs didn't issue a session token, and OpenAI isn't set up.", "ElevenLabs nie wydało tokenu sesji, a OpenAI nie jest skonfigurowane.") }, { status: 502 });
      }
      await supabaseAdmin.from("bruno_rozmowy").update({ dostawca: "openai" }).eq("id", rozmowa.id);
    }
  }
  if (powodZmiany) console.warn("[bruno start] dostawca → openai:", powodZmiany);

  const model = process.env.BRUNO_REALTIME_MODEL ?? "gpt-realtime-2.1";
  const sesja = {
    session: {
      type: "realtime",
      model,
      instructions: instrukcje,
      audio: {
        input: {
          // 11.10: język transkrypcji = język konta (wcześniej na sztywno "pl", także dla EN).
          transcription: { model: "gpt-4o-mini-transcribe", language: jezyk },
          // interrupt_response: false (2.10): bez słuchawek głos Bruno z głośnika wracał do mikrofonu i przerywał mu w pół zdania.
          // Bruno mówi max 2-3 zdania, więc brak możliwości wejścia mu w słowo kosztuje mało, a kończy problem urywania.
          turn_detection: { type: "semantic_vad", eagerness: "medium", create_response: true, interrupt_response: false },
        },
        output: { voice: POSTACIE[postac].glos },
      },
      max_output_tokens: 400,
    },
  };

  const odp = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(sesja),
  });
  if (!odp.ok) {
    const tekst = await odp.text();
    console.error("[bruno start] client_secrets", odp.status, tekst.slice(0, 500));
    await supabaseAdmin.from("bruno_rozmowy").update({ status: "przerwana", koniec: new Date().toISOString(), sekundy: 0 }).eq("id", rozmowa.id);
    return NextResponse.json({ ok: false, blad: t("OpenAI didn't issue a session key.", "OpenAI nie wydało klucza sesji.") }, { status: 502 });
  }
  const dane = (await odp.json()) as { value?: string; client_secret?: { value: string } };
  const klucz = dane.value ?? dane.client_secret?.value;
  if (!klucz) return NextResponse.json({ ok: false, blad: t("Empty session key.", "Pusty klucz sesji.") }, { status: 502 });

  return NextResponse.json({
    ok: true,
    dostawca,
    powod_zmiany: powodZmiany,
    rozmowa_id: rozmowa.id,
    klucz,
    model,
    sekundy: sekundyTejRozmowy,
    postac,
    postac_nazwa: postacNazwa,
    jezyk,
    tryb,
    cel,
    poziom,
    obiekcja,
    karta: karta ? { typ: karta.typ, tresc: karta.tresc } : null,
  });
}
