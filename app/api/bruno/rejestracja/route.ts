import { NextResponse } from "next/server";
import { normalizujEmail, poprawneHaslo, tokenProsbyPasuje, HASLO_MIN } from "@/lib/bruno/auth";
import { jezykDomeny, pobierzKonto } from "@/lib/bruno/db";
import { HANDLOWCY, zapiszKrok1, zapiszKrok2 } from "@/lib/bruno/prosby";

export const dynamic = "force-dynamic";

// 21.10 (USER_001): rejestracja w 2 krokach.
//   krok 1: { krok: 1, email, haslo, zgoda }   → wiersz bruno_prosby 'krok1', zwraca { id, token }
//   krok 2: { krok: 2, id, token, imie, telefon, firma, handlowcy, produkt } → status 'nowa', mail do USER_001
// Każdy e-mail przechodzi (gmail też), etykieta „e-mail służbowy” to tylko sugestia. Konto zakłada USER_001
// w Adminie („Daj dostęp”, do 24 h), hasło z kroku 1 trafia do konta.
// Było (17.10): jeden formularz z 6 polami bez hasła, konto dostawało losowy kod mailem.

const tekst = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const jezyk = (await jezykDomeny()) ?? (b.jezyk === "en" ? "en" : "pl");
  const T = (en: string, pl: string) => (jezyk === "pl" ? pl : en);
  // 25.10 (USER_001: „dezaktywuj rejestrację”): nowe prośby nie przechodzą. Konto = po spotkaniu online.
  if (process.env.BRUNO_REJESTRACJA !== "on") {
    return NextResponse.json({ ok: false, blad: T("Sign-up is closed. Book an online meeting instead.", "Rejestracja jest wyłączona. Umów spotkanie online.") }, { status: 410 });
  }
  // Pułapka na boty: ukryte pole.
  if (String(b.www ?? "")) return NextResponse.json({ ok: true, id: 0, token: "" });

  const email = normalizujEmail(b.email);
  if (!email) return NextResponse.json({ ok: false, blad: T("Enter a valid email.", "Podaj poprawny e-mail.") }, { status: 400 });

  if (Number(b.krok) === 2) {
    const id = Number(b.id);
    if (!Number.isInteger(id) || id <= 0 || !tokenProsbyPasuje(id, email, b.token)) {
      return NextResponse.json({ ok: false, blad: T("Start again from step 1.", "Zacznij jeszcze raz od kroku 1.") }, { status: 400 });
    }
    const imie = tekst(b.imie, 80);
    const telefon = tekst(b.telefon, 40);
    const firma = tekst(b.firma, 120);
    const produkt = tekst(b.produkt, 1000);
    const handlowcy = HANDLOWCY.find((h) => h === b.handlowcy);
    if (!imie) return NextResponse.json({ ok: false, blad: T("Enter your name.", "Podaj imię.") }, { status: 400 });
    if (telefon.replace(/\D/g, "").length < 7) return NextResponse.json({ ok: false, blad: T("Enter your phone number.", "Podaj numer telefonu.") }, { status: 400 });
    if (!firma) return NextResponse.json({ ok: false, blad: T("Enter your company name.", "Podaj nazwę firmy.") }, { status: 400 });
    if (!handlowcy) return NextResponse.json({ ok: false, blad: T("Choose how many reps you have.", "Wybierz, ilu masz handlowców.") }, { status: 400 });
    if (!produkt) return NextResponse.json({ ok: false, blad: T("Tell us what you sell.", "Napisz, co sprzedajecie.") }, { status: 400 });
    const z = await zapiszKrok2(id, { email, imie, telefon, firma, handlowcy, produkt, jezyk });
    if (!z.ok) return NextResponse.json({ ok: false, blad: T("Could not send. Try again.", "Nie udało się wysłać. Spróbuj ponownie.") }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Krok 1
  const haslo = poprawneHaslo(b.haslo);
  if (!haslo) return NextResponse.json({ ok: false, blad: T(`Password: at least ${HASLO_MIN} characters.`, `Hasło: co najmniej ${HASLO_MIN} znaków.`) }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: T("Accept the Privacy Policy.", "Zaakceptuj politykę prywatności.") }, { status: 400 });
  if (await pobierzKonto(email)) {
    return NextResponse.json({ ok: false, kod: "istnieje", blad: T("This email already has an account. Log in.", "Ten e-mail ma już konto. Zaloguj się.") }, { status: 409 });
  }
  const z = await zapiszKrok1({ email, haslo, jezyk });
  if (!z.ok) return NextResponse.json({ ok: false, blad: T("Could not save. Try again.", "Nie udało się zapisać. Spróbuj ponownie.") }, { status: 500 });
  return NextResponse.json({ ok: true, id: z.id, token: z.token });
}
