import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";

export const dynamic = "force-dynamic";

// Podpisany URL do wgrania nagrania rozmowy z Bruno prosto do Supabase Storage
// (wzór: /api/aisalesbrief/upload). Kubełek prywatny, zakłada się sam.
const MAX_BAJTOW = 50 * 1024 * 1024;

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = String(b?.rozmowa_id ?? "");
  const rozmiar = Number(b?.rozmiar);
  if (!id || !Number.isFinite(rozmiar) || rozmiar <= 0 || rozmiar > MAX_BAJTOW) {
    return NextResponse.json({ ok: false, blad: "Wrong size or missing ID." }, { status: 400 });
  }
  const { data: rozmowa } = await supabaseAdmin.from("bruno_rozmowy").select("id").eq("id", id).eq("email", email).maybeSingle();
  if (!rozmowa) return NextResponse.json({ ok: false }, { status: 404 });

  const sciezka = `${email.replace(/[^\w.@-]+/g, "_")}/${id}.webm`;
  const magazyn = supabaseAdmin.storage;
  let { data, error } = await magazyn.from(KUBELEK_BRUNO).createSignedUploadUrl(sciezka, { upsert: true });
  if (error && /not found|does not exist/i.test(error.message)) {
    const { error: bk } = await magazyn.createBucket(KUBELEK_BRUNO, { public: false, fileSizeLimit: MAX_BAJTOW });
    if (bk && !/exist/i.test(bk.message)) {
      console.error("createBucket bruno-nagrania", bk);
      return NextResponse.json({ ok: false, blad: bk.message }, { status: 500 });
    }
    ({ data, error } = await magazyn.from(KUBELEK_BRUNO).createSignedUploadUrl(sciezka, { upsert: true }));
  }
  if (error || !data) {
    console.error("createSignedUploadUrl bruno", error);
    return NextResponse.json({ ok: false, blad: error?.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, signedUrl: data.signedUrl, token: data.token, sciezka });
}
