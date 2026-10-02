import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import {
  ROZMOWA_SEKUND,
  limitDzienny,
  pobierzKonfig,
  pobierzKonto,
  rozmowyDzis,
  stanDostepu,
  zamknijPorzucone,
  zuzyteSekundy,
  type Karta,
} from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";
import { POSTACIE, celLubDomyslny, instrukcjeKlienta, postacLubDomyslna, trybLubDomyslny } from "@/lib/bruno/postacie";
import { listaObiekcji } from "@/lib/bruno/obiekcje";
import { elevenlabsWlaczone, glosElevenlabs, pierwszaWypowiedz, tokenRozmowyEl } from "@/lib/bruno/elevenlabs";

export const dynamic = "force-dynamic";

// POST /api/bruno/rozmowa/start
//
// Twarde odcięcie na limicie PRZED startem (zasada nr 2 z /bruno): serwer
// sprawdza dostęp, limit sekund testu i plan dnia, dopiero potem wydaje
// klucz tymczasowy do OpenAI Realtime. Sam klucz żyje minutę i służy tylko
// do nawiązania połączenia WebRTC z przeglądarki.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: "Zaloguj się." }, { status: 401 });
  const dostawca: "elevenlabs" | "openai" = elevenlabsWlaczone() ? "elevenlabs" : "openai";
  if (dostawca === "openai" && !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, blad: "Brak OPENAI_API_KEY na serwerze." }, { status: 500 });
  }

  const konto = await pobierzKonto(email);
  const stan = stanDostepu(konto);
  if (!konto || !stan.aktywny) return NextResponse.json({ ok: false, blad: "Dostęp testowy wygasł." }, { status: 403 });

  await zamknijPorzucone(email);
  const zuzyte = await zuzyteSekundy(email);
  const zostalo = konto.limit_sekund - zuzyte;
  if (zostalo < 60) {
    return NextResponse.json(
      { ok: false, blad: "Limit minut testu wyczerpany.", kod: "limit" },
      { status: 403 },
    );
  }
  const dzis = await rozmowyDzis(email);
  const dziennie = limitDzienny(konto);
  if (dzis >= dziennie) {
    return NextResponse.json(
      { ok: false, blad: `Plan na dziś zrobiony: ${dziennie} rozmowy. Wróć jutro.`, kod: "plan" },
      { status: 403 },
    );
  }

  const b = await req.json().catch(() => ({}));
  const konfig = await pobierzKonfig(email);
  await zapewnijKarty(email, konfig);
  const postac = postacLubDomyslna(b.postac ?? konfig.postac);
  // Ustawienia wybrane przed rozmową (2.10): tryb, cel, obiekcja.
  const tryb = trybLubDomyslny(b.tryb);
  const cel = celLubDomyslny(b.cel);
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
  const { data: rozmowa, error } = await supabaseAdmin
    .from("bruno_rozmowy")
    .insert({ email, postac, karta_id: karta?.id ?? null, status: "trwa", tryb, cel, cel_wlasny: celWlasny, obiekcja, dostawca })
    .select("id")
    .single();
  if (error || !rozmowa) {
    console.error("[bruno start] insert", error);
    return NextResponse.json({ ok: false, blad: "Nie udało się zapisać rozmowy." }, { status: 500 });
  }

  const instrukcje = instrukcjeKlienta(konfig, postac, { tryb, cel, celWlasny, obiekcja, obiekcje: wybrane, karta });

  // ElevenLabs Agents (2.10): token WebRTC + nadpisania per rozmowa. Prompt idzie przez przeglądarkę
  // (tak działają nadpisania w SDK), więc nie ma w nim nic tajnego: to opis klienta z „Dostosuj Bruno".
  if (dostawca === "elevenlabs") {
    try {
      const [token, pierwsza] = await Promise.all([
        tokenRozmowyEl(),
        pierwszaWypowiedz({ tryb, postac, konfig, obiekcja: wybrane[0] ?? obiekcja }),
      ]);
      return NextResponse.json({
        ok: true,
        dostawca,
        rozmowa_id: rozmowa.id,
        token,
        prompt: instrukcje,
        pierwsza_wypowiedz: pierwsza,
        glos: glosElevenlabs(postac),
        sekundy: sekundyTejRozmowy,
        postac,
        postac_nazwa: POSTACIE[postac].nazwa,
        tryb,
        cel,
        obiekcja,
        karta: karta ? { typ: karta.typ, tresc: karta.tresc } : null,
      });
    } catch (e) {
      console.error("[bruno start] elevenlabs", e);
      await supabaseAdmin.from("bruno_rozmowy").update({ status: "przerwana", koniec: new Date().toISOString(), sekundy: 0 }).eq("id", rozmowa.id);
      return NextResponse.json({ ok: false, blad: "ElevenLabs nie wydało tokenu sesji." }, { status: 502 });
    }
  }

  const model = process.env.BRUNO_REALTIME_MODEL ?? "gpt-realtime-2.1";
  const sesja = {
    session: {
      type: "realtime",
      model,
      instructions: instrukcje,
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe", language: "pl" },
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
    return NextResponse.json({ ok: false, blad: "OpenAI nie wydało klucza sesji." }, { status: 502 });
  }
  const dane = (await odp.json()) as { value?: string; client_secret?: { value: string } };
  const klucz = dane.value ?? dane.client_secret?.value;
  if (!klucz) return NextResponse.json({ ok: false, blad: "Pusty klucz sesji." }, { status: 502 });

  return NextResponse.json({
    ok: true,
    dostawca,
    rozmowa_id: rozmowa.id,
    klucz,
    model,
    sekundy: sekundyTejRozmowy,
    postac,
    postac_nazwa: POSTACIE[postac].nazwa,
    tryb,
    cel,
    obiekcja,
    karta: karta ? { typ: karta.typ, tresc: karta.tresc } : null,
  });
}
