import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { jezykLubDomyslny } from "@/lib/bruno/domeny";
import { tDla } from "@/lib/bruno/i18n";
import { PYTANIA, braki, type Odpowiedzi } from "@/lib/bruno/ankieta";
import { zapiszAnkiete } from "@/lib/bruno/ankieta-db";

export const dynamic = "force-dynamic";

// POST /api/bruno/ankieta (21.10, USER_001): zapis ankiety Mazura. Przyjmujemy tylko znane pytania,
// skala 1-5 jako liczba, teksty przycięte do 1 000 znaków.

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!konto) return NextResponse.json({ ok: false }, { status: 401 });
  const jezyk = jezykLubDomyslny(konto.jezyk);
  const t = tDla(jezyk);

  const b = (await req.json().catch(() => ({}))) as { odpowiedzi?: Record<string, unknown> };
  const wej = b.odpowiedzi ?? {};
  const o: Odpowiedzi = {};
  for (const p of PYTANIA) {
    const v = wej[p.id];
    if (v === undefined || v === null) continue;
    if (p.typ === "skala") o[p.id] = Math.round(Number(v));
    else if (p.typ === "liczba") o[p.id] = String(v).trim() === "" ? "" : Math.max(0, Math.min(100000, Math.round(Number(v))));
    else o[p.id] = String(v).trim().slice(0, 1000);
  }
  if (braki(o).length) return NextResponse.json({ ok: false, blad: t("Answer every question.", "Odpowiedz na wszystkie pytania.") }, { status: 400 });

  const z = await zapiszAnkiete(email, jezyk, o);
  if (!z.ok) return NextResponse.json({ ok: false, blad: t("Could not save. Try again.", "Nie udało się zapisać. Spróbuj ponownie.") }, { status: 500 });
  return NextResponse.json({ ok: true });
}
