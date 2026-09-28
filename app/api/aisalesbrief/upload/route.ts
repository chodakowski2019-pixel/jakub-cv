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

// 50 MB to nie nasz wybór, tylko sufit planu Supabase: próba założenia kubełka
// na 200 MB wróciła z "Payload too large". Kubełek salesai-nagrania stoi
// z dokładnie tym limitem, więc klient nie może przyjąć większego pliku,
// bo magazyn i tak go odrzuci.
const MAX_BAJTOW = 50 * 1024 * 1024;

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
    return NextResponse.json({ ok: false, blad: "Plik za duży (limit 50 MB)" }, { status: 400 });
  }

  const rozszerzenie = nazwa.split(".").pop()?.toLowerCase() ?? "";
  if (!DOZWOLONE.includes(rozszerzenie)) {
    return NextResponse.json({ ok: false, blad: "Nieobsługiwany format" }, { status: 400 });
  }

  // Brak adresu albo klucza daje z klienta Supabase goły "fetch failed", po
  // którym nie widać, że to kwestia konfiguracji, a nie sieci. Lepiej powiedzieć
  // to wprost, niż szukać tego drugi raz.
  const brakKonfiguracji = [
    !process.env.SUPABASE_URL && "SUPABASE_URL",
    !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (brakKonfiguracji.length) {
    return NextResponse.json(
      { ok: false, blad: "Magazyn nieskonfigurowany", powod: `brak ${brakKonfiguracji.join(" i ")} na serwerze` },
      { status: 500 },
    );
  }

  const sciezka = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${bezpiecznaNazwa(nazwa)}`;
  const magazyn = supabaseAdmin.storage;

  // Najpierw próbujemy podpisać od razu. Zakładanie kubełka przy każdym pliku
  // kosztowało jedno wywołanie więcej i wywracało cały upload, gdy klucz
  // serwisowy nie miał prawa tworzyć kubełków — a nie musi go mieć, jeśli
  // kubełek już istnieje.
  let { data, error } = await magazyn.from(KUBELEK_NAGRANIA).createSignedUploadUrl(sciezka);

  // Kubełek prywatny: nagranie rozmowy handlowej nie ma prawa wisieć pod
  // zgadywalnym publicznym adresem. Do maila leci podpisany link.
  if (error && /not found|does not exist/i.test(error.message)) {
    const { error: bladKubelka } = await magazyn.createBucket(KUBELEK_NAGRANIA, {
      public: false,
      fileSizeLimit: MAX_BAJTOW,
    });
    if (bladKubelka && !/exist/i.test(bladKubelka.message)) {
      console.error("createBucket failed", bladKubelka);
      return NextResponse.json(
        { ok: false, blad: "Magazyn niedostępny", powod: bladKubelka.message },
        { status: 500 },
      );
    }
    ({ data, error } = await magazyn.from(KUBELEK_NAGRANIA).createSignedUploadUrl(sciezka));
  }

  if (error || !data) {
    console.error("createSignedUploadUrl failed", error);
    return NextResponse.json(
      { ok: false, blad: "Nie udało się przygotować wysyłki", powod: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, signedUrl: data.signedUrl, sciezka });
}
