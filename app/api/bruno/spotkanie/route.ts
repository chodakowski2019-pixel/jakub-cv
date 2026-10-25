import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { zalozDemoFirmy } from "@/lib/bruno/demo-firma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// 25.10 (USER_001): „Przygotuj spotkanie” na koncie spotkań. Wejście: imię rozmówcy + adres strony firmy
// (+ opcjonalnie nazwa). Serwer czyta stronę, zakłada firmę z logo, przepina na nią konto spotkań
// (imię = imię rozmówcy, nagłówek = nazwa firmy), robi 5 handlowców i rozmowy na produkcie firmy.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: "Zaloguj się." }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!konto?.spotkania) return NextResponse.json({ ok: false, blad: "To konto nie jest kontem spotkań." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const imie = String(b.imie ?? "").trim().slice(0, 60);
  const url = String(b.url ?? "").trim().slice(0, 300);
  if (!imie || !url) return NextResponse.json({ ok: false, blad: "Podaj imię rozmówcy i adres strony." }, { status: 400 });
  try {
    const w = await zalozDemoFirmy({ url, nazwa: String(b.nazwa ?? "").trim().slice(0, 80), jezyk: "pl", szef: email, imie, kod: null, naglowek: null });
    return NextResponse.json({ ok: true, firma: w.firma.nazwa, rozmow: w.zespol.rozmow, zModelu: w.zModelu, uwagi: w.uwagi });
  } catch (e) {
    console.error("[bruno spotkanie]", e);
    return NextResponse.json({ ok: false, blad: e instanceof Error ? e.message : "Nie udało się przygotować panelu." }, { status: 500 });
  }
}
