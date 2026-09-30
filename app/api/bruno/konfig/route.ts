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
    const wiersz = {
      email,
      produkt: String(b.produkt ?? "").slice(0, LIMITY.produkt),
      klient: String(b.klient ?? "").slice(0, LIMITY.klient),
      obiekcje: String(b.obiekcje ?? "").slice(0, LIMITY.obiekcje),
      udana_rozmowa: String(b.udana_rozmowa ?? "").slice(0, LIMITY.udana_rozmowa),
      skrypt: String(b.skrypt ?? "").slice(0, LIMITY.skrypt),
      postac: postacLubDomyslna(b.postac),
      godzina_przypomnienia: Math.min(22, Math.max(5, Number(b.godzina_przypomnienia) || 8)),
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
