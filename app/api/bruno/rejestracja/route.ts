import { NextResponse } from "next/server";
import { normalizujEmail } from "@/lib/bruno/auth";
import { jezykDomeny, pobierzKonto } from "@/lib/bruno/db";
import { HANDLOWCY, zapiszProsbe } from "@/lib/bruno/prosby";

export const dynamic = "force-dynamic";

// 17.10 (USER_001): Bruno tylko B2B. Rejestracja ZAMKNIĘTA: formularz = prośba o dostęp
// (imię, e-mail, telefon, firma, ilu handlowców, co sprzedajecie). Konto zakłada USER_001
// w Adminie („Daj dostęp”, do 24 h). Było (9-11.10): konto B2C od razu, 3 bezpłatne rozmowy.

const tekst = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const jezyk = (await jezykDomeny()) ?? (b.jezyk === "en" ? "en" : "pl");
  const T = (en: string, pl: string) => (jezyk === "pl" ? pl : en);
  // Pułapka na boty: ukryte pole.
  if (String(b.www ?? "")) return NextResponse.json({ ok: true });

  const email = normalizujEmail(b.email);
  const imie = tekst(b.imie, 80);
  const telefon = tekst(b.telefon, 40);
  const firma = tekst(b.firma, 120);
  const produkt = tekst(b.produkt, 1000);
  const handlowcy = HANDLOWCY.find((h) => h === b.handlowcy);
  if (!imie) return NextResponse.json({ ok: false, blad: T("Enter your name.", "Podaj imię.") }, { status: 400 });
  if (!email) return NextResponse.json({ ok: false, blad: T("Enter a valid email.", "Podaj poprawny e-mail.") }, { status: 400 });
  if (telefon.replace(/\D/g, "").length < 7) return NextResponse.json({ ok: false, blad: T("Enter your phone number.", "Podaj numer telefonu.") }, { status: 400 });
  if (!firma) return NextResponse.json({ ok: false, blad: T("Enter your company name.", "Podaj nazwę firmy.") }, { status: 400 });
  if (!handlowcy) return NextResponse.json({ ok: false, blad: T("Choose how many reps you have.", "Wybierz, ilu masz handlowców.") }, { status: 400 });
  if (!produkt) return NextResponse.json({ ok: false, blad: T("Tell us what you sell.", "Napisz, co sprzedajecie.") }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: T("Accept the Privacy Policy.", "Zaakceptuj politykę prywatności.") }, { status: 400 });

  if (await pobierzKonto(email)) {
    return NextResponse.json({ ok: false, kod: "istnieje", blad: T("This email already has an account. Log in.", "Ten e-mail ma już konto. Zaloguj się.") }, { status: 409 });
  }

  const z = await zapiszProsbe({ email, imie, telefon, firma, handlowcy, produkt, jezyk });
  if (!z.ok) return NextResponse.json({ ok: false, blad: T("Could not send. Try again.", "Nie udało się wysłać. Spróbuj ponownie.") }, { status: 500 });
  return NextResponse.json({ ok: true });
}
