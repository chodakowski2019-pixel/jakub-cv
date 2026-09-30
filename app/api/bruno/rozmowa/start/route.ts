import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import {
  ROZMOWA_SEKUND,
  ROZMOW_DZIENNIE,
  pobierzKonfig,
  pobierzKonto,
  rozmowyDzis,
  stanDostepu,
  zuzyteSekundy,
  type Karta,
} from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";
import { POSTACIE, instrukcjeKlienta, postacLubDomyslna } from "@/lib/bruno/postacie";

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
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, blad: "Brak OPENAI_API_KEY na serwerze." }, { status: 500 });
  }

  const konto = await pobierzKonto(email);
  const stan = stanDostepu(konto);
  if (!konto || !stan.aktywny) return NextResponse.json({ ok: false, blad: "Dostęp testowy wygasł." }, { status: 403 });

  const zuzyte = await zuzyteSekundy(email);
  const zostalo = konto.limit_sekund - zuzyte;
  if (zostalo < 60) {
    return NextResponse.json(
      { ok: false, blad: "Limit minut testu wyczerpany.", kod: "limit" },
      { status: 403 },
    );
  }
  const dzis = await rozmowyDzis(email);
  if (dzis >= ROZMOW_DZIENNIE) {
    return NextResponse.json(
      { ok: false, blad: `Plan na dziś zrobiony: ${ROZMOW_DZIENNIE} rozmowy. Wróć jutro.`, kod: "plan" },
      { status: 403 },
    );
  }

  const b = await req.json().catch(() => ({}));
  const konfig = await pobierzKonfig(email);
  await zapewnijKarty(email, konfig);
  const postac = postacLubDomyslna(b.postac ?? konfig.postac);

  let karta: Karta | null = null;
  if (typeof b.karta_id === "string" && b.karta_id) {
    const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).eq("id", b.karta_id).maybeSingle();
    karta = (data as Karta | null) ?? null;
  }

  const sekundyTejRozmowy = Math.min(ROZMOWA_SEKUND, zostalo);
  const { data: rozmowa, error } = await supabaseAdmin
    .from("bruno_rozmowy")
    .insert({ email, postac, karta_id: karta?.id ?? null, status: "trwa" })
    .select("id")
    .single();
  if (error || !rozmowa) {
    console.error("[bruno start] insert", error);
    return NextResponse.json({ ok: false, blad: "Nie udało się zapisać rozmowy." }, { status: 500 });
  }

  const model = process.env.BRUNO_REALTIME_MODEL ?? "gpt-realtime-2.1";
  const sesja = {
    session: {
      type: "realtime",
      model,
      instructions: instrukcjeKlienta(konfig, postac, karta),
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe", language: "pl" },
          turn_detection: { type: "semantic_vad", eagerness: "medium", create_response: true, interrupt_response: true },
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
    rozmowa_id: rozmowa.id,
    klucz,
    model,
    sekundy: sekundyTejRozmowy,
    postac,
    postac_nazwa: POSTACIE[postac].nazwa,
    karta: karta ? { typ: karta.typ, tresc: karta.tresc } : null,
  });
}
