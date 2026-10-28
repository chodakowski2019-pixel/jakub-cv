import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import { FIRMY } from "@/lib/bruno/formularz-firmy";

export const dynamic = "force-dynamic";

// POST /api/bruno/formularz/nagranie (28.10, USER_001): podpisany URL do wgrania głosówki z formularza CRM
// prosto do Supabase Storage (wzór: /api/bruno/rozmowa/nagranie). Bez logowania: osoba z firmy nie ma konta.
// Ochrona: znana firma, rozmiar do 60 MB (20 min opus ≈ 15 MB), ścieżka losowa w `formularze/<firma>/`.
const MAX_BAJTOW = 60 * 1024 * 1024;

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const firma = FIRMY[String(b?.firma ?? "")];
  const rozmiar = Number(b?.rozmiar);
  const typ = String(b?.typ ?? "audio/webm");
  if (!firma || !Number.isFinite(rozmiar) || rozmiar <= 0 || rozmiar > MAX_BAJTOW) {
    return NextResponse.json({ ok: false, blad: "Zły rozmiar albo nieznany formularz." }, { status: 400 });
  }
  const roz = /mp4|m4a|aac/i.test(typ) ? "m4a" : /ogg/i.test(typ) ? "ogg" : "webm";
  const sciezka = `formularze/${firma.klucz}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${roz}`;

  const magazyn = supabaseAdmin.storage;
  let { data, error } = await magazyn.from(KUBELEK_BRUNO).createSignedUploadUrl(sciezka);
  if (error && /not found|does not exist/i.test(error.message)) {
    const { error: bk } = await magazyn.createBucket(KUBELEK_BRUNO, { public: false, fileSizeLimit: MAX_BAJTOW });
    if (bk && !/exist/i.test(bk.message)) {
      console.error("createBucket bruno-nagrania", bk);
      return NextResponse.json({ ok: false, blad: bk.message }, { status: 500 });
    }
    ({ data, error } = await magazyn.from(KUBELEK_BRUNO).createSignedUploadUrl(sciezka));
  }
  if (error || !data) {
    console.error("createSignedUploadUrl formularz", error);
    return NextResponse.json({ ok: false, blad: error?.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, signedUrl: data.signedUrl, sciezka });
}
