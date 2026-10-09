import { NextResponse } from "next/server";
import { normalizujEmail } from "@/lib/bruno/auth";
import { ROZMOW_ZA_DARMO, pobierzKonto } from "@/lib/bruno/db";
import { zalozKontoFree } from "@/lib/bruno/konto-free";
import { htmlRejestracja, wyslij } from "@/lib/bruno/mail";

export const dynamic = "force-dynamic";

// 9.10 (USER_001): rejestracja B2C z /brunorejestracja. Handlowiec sam zakłada konto:
// plan „free” = 3 bezpłatne rozmowy łącznie (twarde odcięcie w /api/bruno/rozmowa/start),
// kod logowania od razu mailem. B2B się tu NIE rejestruje (konta firm zakłada USER_001).
// Istniejące konto: kodu NIE zmieniamy (inaczej każdy mógłby zresetować komuś dostęp).

const ROLE_OK = new Set([
  "Sales Director", "Sales Team Lead", "Business Owner", "Sales Rep", "Other",
  "Dyrektor sprzedaży", "Kierownik zespołu sprzedaży", "Właściciel firmy", "Handlowiec", "Inne",
]);

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pl = b.jezyk === "pl";
  const T = (en: string, plT: string) => (pl ? plT : en);
  // Pułapka na boty: ukryte pole.
  if (String(b.www ?? "")) return NextResponse.json({ ok: true });

  const imie = String(b.imie ?? "").trim().slice(0, 80);
  const email = normalizujEmail(b.email);
  const telefon = String(b.telefon ?? "").replace(/[^\d+ ]/g, "").trim().slice(0, 24) || null;
  const zawod = ROLE_OK.has(String(b.zawod)) ? String(b.zawod) : null;
  const produkt = String(b.produkt ?? "").trim().slice(0, 200);
  const handlowcy = Math.max(1, Math.min(100000, Math.round(Number(b.handlowcy)) || 1));

  if (imie.length < 2) return NextResponse.json({ ok: false, blad: T("Enter your first name.", "Podaj imię.") }, { status: 400 });
  if (!email) return NextResponse.json({ ok: false, blad: T("Enter a valid email.", "Podaj poprawny e-mail.") }, { status: 400 });
  if (!zawod) return NextResponse.json({ ok: false, blad: T("Choose your role.", "Wybierz rolę.") }, { status: 400 });
  if (produkt.length < 2) return NextResponse.json({ ok: false, blad: T("Tell us what you sell.", "Napisz, co sprzedajesz.") }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: T("Accept the Privacy Policy.", "Zaakceptuj Politykę prywatności.") }, { status: 400 });

  if (await pobierzKonto(email)) {
    return NextResponse.json(
      { ok: false, kod: "istnieje", blad: T("This email already has an account. Log in with your code.", "Ten e-mail ma już konto. Zaloguj się swoim kodem.") },
      { status: 409 },
    );
  }

  const z = await zalozKontoFree({ email, imie, zKodem: true, zrodlo: "formularz", jezyk: pl ? "pl" : "en", produkt, zawod, telefon, handlowcy });
  if (!z.ok) {
    if (z.istnieje)
      return NextResponse.json({ ok: false, kod: "istnieje", blad: T("This email already has an account. Log in with your code.", "Ten e-mail ma już konto. Zaloguj się swoim kodem.") }, { status: 409 });
    return NextResponse.json({ ok: false, blad: T("Could not create your account. Try again.", "Nie udało się założyć konta. Spróbuj ponownie.") }, { status: 500 });
  }

  let mail: "wyslany" | "blad" = "wyslany";
  try {
    await wyslij({
      do: email,
      rodzaj: "dostep",
      temat: T("Your Bruno AI access", "Twój dostęp do Bruno AI"),
      html: htmlRejestracja({ imie, email, kod: z.kod ?? "", jezyk: pl ? "pl" : "en", rozmow: ROZMOW_ZA_DARMO }),
    });
  } catch (e) {
    console.error("[bruno rejestracja] mail", e);
    mail = "blad";
  }

  if (mail === "blad")
    return NextResponse.json({ ok: false, blad: T("Account created, but the email failed. Write to hello@jakubchodakowski.com", "Konto założone, ale mail nie doszedł. Napisz na hello@jakubchodakowski.com") }, { status: 502 });
  return NextResponse.json({ ok: true });
}
