import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { KUBELEK_NAGRANIA } from "@/lib/salesai";

// Podpisany URL do wgrania nagrania rozmowy (/aisalesbrief).
//
// Plik NIE przechodzi przez ten endpoint. Vercel tnie treść żądania na 4,5 MB,
// a nagranie rozmowy handlowej to dziesiątki megabajtów. Zamiast tego
// oddajemy przeglądarce jednorazowy URL prosto do Supabase Storage.
//
// Kubełek zakłada się sam przy pierwszym pliku, bo projektu Supabase tego repo
// nie da się ruszyć z zewnątrz (MCP jest podpięty do innego konta).

const MAX_BAJTOW = 200 * 1024 * 1024;

const DOZWOLONE = ["mp3", "m4a", "wav", "ogg", "mp4", "mov", "webm", "aac", "flac"];

// Nazwa pliku od klienta trafia do ścieżki w kubełku, więc zostaje z niej
// tylko to, co nie potrafi z tej ścieżki wyjść.
const bezpiecznaNazwa = (n: string) =>
  n
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);

export async function POST(req: NextRequest) {
  const { nazwa, rozmiar } = await req.json();

  if (typeof nazwa !== "string" || !nazwa) {
    return NextResponse.json({ ok: false, blad: "Brak nazwy pliku" }, { status: 400 });
  }
  if (typeof rozmiar !== "number" || rozmiar <= 0 || rozmiar > MAX_BAJTOW) {
    return NextResponse.json({ ok: false, blad: "Plik za duży (limit 200 MB)" }, { status: 400 });
  }

  const rozszerzenie = nazwa.split(".").pop()?.toLowerCase() ?? "";
  if (!DOZWOLONE.includes(rozszerzenie)) {
    return NextResponse.json({ ok: false, blad: "Nieobsługiwany format" }, { status: 400 });
  }

  // Kubełek prywatny: nagranie rozmowy handlowej nie ma prawa wisieć pod
  // zgadywalnym publicznym adresem. Do maila leci podpisany link.
  const { error: bladKubelka } = await supabaseAdmin.storage.createBucket(KUBELEK_NAGRANIA, {
    public: false,
    fileSizeLimit: MAX_BAJTOW,
  });
  // "already exists" to normalny stan po pierwszym pliku, nie awaria.
  if (bladKubelka && !/exist/i.test(bladKubelka.message)) {
    console.error("createBucket failed", bladKubelka);
    return NextResponse.json({ ok: false, blad: "Magazyn niedostępny" }, { status: 500 });
  }

  const sciezka = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${bezpiecznaNazwa(nazwa)}`;

  const { data, error } = await supabaseAdmin.storage.from(KUBELEK_NAGRANIA).createSignedUploadUrl(sciezka);
  if (error || !data) {
    console.error("createSignedUploadUrl failed", error);
    return NextResponse.json({ ok: false, blad: "Nie udało się przygotować wysyłki" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, signedUrl: data.signedUrl, sciezka });
}
