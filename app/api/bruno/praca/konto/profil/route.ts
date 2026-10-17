import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { plikCV, zalogowanePraca, zapiszCV } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/konto/profil (17.10): kandydat (imię, telefon, LinkedIn, CV) albo pracodawca (imię, telefon, firma, NIP).
export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto) return NextResponse.json({ ok: false, blad: "Zaloguj się ponownie." }, { status: 401 });
  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ ok: false, blad: "Nie udało się odczytać formularza." }, { status: 400 });
  const g = (k: string, n = 160) => String(f.get(k) ?? "").trim().slice(0, n);
  const zmiany: Record<string, string | null> = { imie: g("imie", 120) || null, telefon: g("telefon", 40) || null };
  if (konto.typ === "pracodawca") {
    zmiany.firma = g("firma") || konto.firma;
    zmiany.nip = g("nip").replace(/\D/g, "").slice(0, 10) || null;
  } else {
    zmiany.linkedin = g("linkedin", 300) || null;
    const cv = await plikCV(f.get("plik"));
    if (typeof cv === "string") return NextResponse.json({ ok: false, blad: cv }, { status: 400 });
    if (cv) {
      const sciezka = await zapiszCV(`kandydaci/${konto.id}`, cv);
      if (!sciezka) return NextResponse.json({ ok: false, blad: "Nie udało się zapisać CV. Spróbuj ponownie." }, { status: 500 });
      zmiany.cv_sciezka = sciezka;
      zmiany.cv_nazwa = cv.nazwa;
    }
  }
  const { error } = await supabaseAdmin.from("praca_konta").update(zmiany).eq("id", konto.id);
  if (error) return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
