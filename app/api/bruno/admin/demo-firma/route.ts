import { NextResponse } from "next/server";
import { zalozDemoFirmy } from "@/lib/bruno/demo-firma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// 25.10 (USER_001): „Demo pod firmę” z Admina (/bruno/admin?k=STATS_KEY). To samo, co skrypt
// scripts/bruno-demo-firma.ts, ale na serwerze, gdzie jest klucz modelu. Wejście: url, nazwa, jezyk,
// szef (e-mail), imie, kod (6 cyfr albo puste), reset. Wyjście: konto szefa + kod + 5 handlowców.
function autoryzowany(req: Request) {
  const k = process.env.STATS_KEY;
  if (!k) return false;
  return req.headers.get("x-klucz") === k || new URL(req.url).searchParams.get("k") === k;
}

export async function POST(req: Request) {
  if (!autoryzowany(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const log: string[] = [];
  try {
    const w = await zalozDemoFirmy(
      { url: String(b.url ?? ""), nazwa: String(b.nazwa ?? ""), jezyk: b.jezyk === "en" ? "en" : "pl", szef: String(b.szef ?? ""), imie: String(b.imie ?? ""), kod: String(b.kod ?? ""), reset: Boolean(b.reset) },
      (s) => log.push(s),
    );
    return NextResponse.json({ ok: true, firma: { id: w.firma.id, nazwa: w.firma.nazwa, logo_url: w.firma.logo_url, jezyk: w.firma.jezyk }, szef: w.szef, kod: w.kod, zespol: w.zespol, zModelu: w.zModelu, uwagi: w.uwagi, konfig: w.konfig, log });
  } catch (e) {
    console.error("[bruno demo-firma]", e);
    return NextResponse.json({ ok: false, blad: e instanceof Error ? e.message : "Nie udało się założyć demo.", log }, { status: 500 });
  }
}
