import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonfig } from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";
import { postacLubDomyslna } from "@/lib/bruno/postacie";

export const dynamic = "force-dynamic";

// „Dostosuj Bruno" (USER_001 30.09): produkt, klient, pula obiekcji, definicja
// udanej rozmowy, skrypt, postać. Bruno czyta to przed każdą rozmową.
const LIMITY = { produkt: 1500, klient: 2000, obiekcje: 3000, udana_rozmowa: 1000, skrypt: 8000 } as const;

export async function GET() {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, konfig: await pobierzKonfig(email) });
}

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const b = await req.json();
    // Zapis częściowy: „Dostosuj Bruno" i „Ustawienia" (godzina przypomnienia)
    // to osobne formularze, więc pole nieobecne w żądaniu zostaje bez zmian.
    const stare = await pobierzKonfig(email);
    const tekst = (k: keyof typeof LIMITY) => (b[k] === undefined ? stare[k] : String(b[k] ?? "").slice(0, LIMITY[k]));
    const wiersz = {
      email,
      produkt: tekst("produkt"),
      klient: tekst("klient"),
      obiekcje: tekst("obiekcje"),
      udana_rozmowa: tekst("udana_rozmowa"),
      skrypt: tekst("skrypt"),
      postac: b.postac === undefined ? postacLubDomyslna(stare.postac) : postacLubDomyslna(b.postac),
      godzina_przypomnienia:
        b.godzina_przypomnienia === undefined ? stare.godzina_przypomnienia : Math.min(22, Math.max(5, Number(b.godzina_przypomnienia) || 8)),
      zaktualizowano: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("bruno_konfig").upsert(wiersz, { onConflict: "email" });
    if (error) throw error;
    await zapewnijKarty(email, { ...wiersz });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno konfig]", e);
    return NextResponse.json({ ok: false, blad: "Nie udało się zapisać." }, { status: 500 });
  }
}
