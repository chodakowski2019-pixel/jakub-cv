import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { opisZLinku, opisZPdf, PDF_MAKS_B } from "@/lib/bruno/praca/zrodlo-szukania";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/bruno/praca/szukaj (12.11, USER_001): wyszukiwarka handlowców, 3 źródła. Formularz (multipart):
// { link } albo { plik: PDF } albo { opis } → { ok, q }, gdzie q = krótki opis do /wyszukiwarka?q=.
// Link i PDF kosztują (pobranie strony + model), stąd limit prób na adres IP, liczony w pamięci instancji.
const OKNO_MS = 10 * 60_000;
const LIMIT = 8;
const proby = new Map<string, number[]>();

function zaDuzo(ip: string): boolean {
  const teraz = Date.now();
  const moje = (proby.get(ip) ?? []).filter((t) => teraz - t < OKNO_MS);
  moje.push(teraz);
  proby.set(ip, moje);
  if (proby.size > 5000) proby.clear();
  return moje.length > LIMIT;
}

export async function POST(req: Request) {
  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ ok: false, blad: "Coś poszło nie tak. Spróbuj ponownie." }, { status: 400 });
  const opis = String(f.get("opis") ?? "").trim().slice(0, 600);
  if (opis.length >= 2) return NextResponse.json({ ok: true, q: opis });

  const link = String(f.get("link") ?? "").trim();
  const plik = f.get("plik");
  const maPlik = plik instanceof File && plik.size > 0;
  if (!link && !maPlik) return NextResponse.json({ ok: false, blad: "Wklej link, wgraj PDF albo opisz, kogo szukasz." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (zaDuzo(ip)) return NextResponse.json({ ok: false, blad: "Za dużo prób. Spróbuj za kilka minut albo opisz, kogo szukasz." }, { status: 429 });

  if (maPlik && plik.size > PDF_MAKS_B) return NextResponse.json({ ok: false, blad: "Plik jest za duży. Najwyżej 4 MB." }, { status: 400 });
  const w = maPlik ? await opisZPdf(Buffer.from(await plik.arrayBuffer())) : await opisZLinku(link);
  if (!w.ok) {
    // Nieudane źródło też zapisujemy (lejek firm: ile prób z linku / PDF kończy się niczym).
    await supabaseAdmin.from("praca_wyszukiwania").insert({ filtry: { zrodlo: maPlik ? "pdf" : "link", ...(maPlik ? {} : { link: link.slice(0, 300) }), blad: w.blad }, wynik: 0 });
    return NextResponse.json({ ok: false, blad: w.blad }, { status: 422 });
  }
  return NextResponse.json({ ok: true, q: w.opis, zrodlo: maPlik ? "pdf" : "link" });
}
