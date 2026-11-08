import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { dealFirmy, zapiszProfil } from "@/lib/bruno/klienci";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 8.11 (USER_001): zdjęcie klienta w kółku (klik w sylwetkę = wgraj) albo zmiana płci sylwetki.
// multipart: deal_id + plik (jpg/png/webp, przeglądarka zmniejsza do 320 px, max 2 MB) albo JSON { deal_id, plec }.
// Plik w prywatnym kubełku: klienci/<firma>/<deal>-<czas>.jpg; poprzednie zdjęcie kasowane.

const MAX = 2 * 1024 * 1024;

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ blad: "401" }, { status: 401 });
  const konto = await pobierzKonto(email);
  const firma = await pobierzFirme(konto?.firma_id);
  if (!konto || !firma) return NextResponse.json({ blad: "403" }, { status: 403 });
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (!ct.includes("multipart/form-data")) {
      const b = (await req.json().catch(() => ({}))) as { deal_id?: number; plec?: string };
      const id = Number(b.deal_id);
      if (!Number.isFinite(id) || !(b.plec === "m" || b.plec === "k")) return NextResponse.json({ blad: "400" }, { status: 400 });
      if (!(await dealFirmy(firma, id))) return NextResponse.json({ blad: "404" }, { status: 404 });
      await zapiszProfil(firma.id, id, { plec: b.plec });
      return NextResponse.json({ ok: true });
    }
    const fd = await req.formData();
    const id = Number(fd.get("deal_id"));
    const p = fd.get("plik");
    if (!Number.isFinite(id) || !(p instanceof File)) return NextResponse.json({ blad: "400" }, { status: 400 });
    if (!/^image\/(jpeg|png|webp)$/.test(p.type) || p.size > MAX) return NextResponse.json({ blad: "Tylko JPG, PNG, WEBP do 2 MB." }, { status: 400 });
    if (!(await dealFirmy(firma, id))) return NextResponse.json({ blad: "404" }, { status: 404 });
    const sciezka = `klienci/${firma.id.replace(/[^\w-]/g, "_")}/${id}-${Date.now()}.${p.type === "image/png" ? "png" : p.type === "image/webp" ? "webp" : "jpg"}`;
    const { data: stary } = await supabaseAdmin.from("bruno_klient_profil").select("zdjecie_sciezka").eq("firma_id", firma.id).eq("deal_id", id).maybeSingle();
    const up = await supabaseAdmin.storage.from(KUBELEK_BRUNO).upload(sciezka, Buffer.from(await p.arrayBuffer()), { contentType: p.type, upsert: true });
    if (up.error) throw new Error(up.error.message);
    await zapiszProfil(firma.id, id, { zdjecie_sciezka: sciezka });
    if (stary?.zdjecie_sciezka) void supabaseAdmin.storage.from(KUBELEK_BRUNO).remove([stary.zdjecie_sciezka]).catch(() => null);
    const { data: s } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUrl(sciezka, 6 * 3600);
    return NextResponse.json({ ok: true, url: s?.signedUrl ?? null });
  } catch (e) {
    console.error("[bruno klienci zdjecie]", e);
    return NextResponse.json({ blad: String((e as Error)?.message ?? e).slice(0, 300) }, { status: 500 });
  }
}
