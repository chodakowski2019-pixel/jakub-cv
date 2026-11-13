import { NextResponse } from "next/server";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { anulujSubskrypcje } from "@/lib/bruno/praca/zlecenia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bruno/praca/zlecenie/anuluj (13.11, USER_001): firma wyłącza subskrypcję wyszukiwarki w panelu. { id } → { ok }.
export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || konto.typ !== "pracodawca") return NextResponse.json({ ok: false, blad: "Zaloguj się jako pracodawca." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const ok = await anulujSubskrypcje(konto.id, String(b.id ?? "").slice(0, 60));
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, blad: "Nie udało się wyłączyć subskrypcji. Napisz: jakub@salesbruno.com." }, { status: 400 });
}
