import { NextResponse } from "next/server";
import { hasloDoLogowania, normalizujEmail } from "@/lib/bruno/auth";
import { CIASTECZKO_PRACA, OPCJE_CIASTECZKA, tokenSesji, typKonta, zaloguj } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/konto/login (17.10): e-mail + hasło, osobno dla kandydata i pracodawcy. 5 złych prób = 15 min blokady.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const typ = typKonta(b.typ);
  const email = normalizujEmail(b.email);
  const haslo = hasloDoLogowania(b.haslo);
  if (!typ || !email || !haslo) return NextResponse.json({ ok: false, blad: "Podaj e-mail i hasło." }, { status: 400 });
  const w = await zaloguj(typ, email, haslo);
  if (!w.ok) return NextResponse.json({ ok: false, blad: w.blad }, { status: w.status });
  const odp = NextResponse.json({ ok: true, panel: "/praca/panel" });
  odp.cookies.set(CIASTECZKO_PRACA, tokenSesji(typ, email), OPCJE_CIASTECZKA);
  return odp;
}
