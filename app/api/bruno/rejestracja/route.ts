import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CIASTECZKO, HASLO_MIN, WAZNOSC_SESJI_S, normalizujEmail, nowyToken, poprawneHaslo } from "@/lib/bruno/auth";
import { jezykDomeny, pobierzKonto } from "@/lib/bruno/db";
import { zalozKontoFree } from "@/lib/bruno/konto-free";
import { zapiszWejscie } from "@/lib/bruno/wejscia";

export const dynamic = "force-dynamic";

// 9.10 (USER_001): rejestracja B2C. Handlowiec sam zakłada konto: plan „free” = 3 bezpłatne
// rozmowy łącznie (twarde odcięcie w /api/bruno/rozmowa/start). B2B się tu NIE rejestruje.
// 11.10 (USER_001): formularz = TYLKO e-mail + hasło (+ zgoda). Konto od razu zalogowane,
// dalej ekran /bruno/start (imię, telefon, rola, handlowcy, produkt), potem panel.
// Istniejące konto: hasła NIE zmieniamy (inaczej każdy mógłby przejąć cudze konto).

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // Na domenie Bruno język = domena; poza nią (lokalnie) z formularza.
  const jezyk = (await jezykDomeny()) ?? (b.jezyk === "pl" ? "pl" : "en");
  const T = (en: string, pl: string) => (jezyk === "pl" ? pl : en);
  // Pułapka na boty: ukryte pole.
  if (String(b.www ?? "")) return NextResponse.json({ ok: true });

  const email = normalizujEmail(b.email);
  const haslo = poprawneHaslo(b.haslo);
  if (!email) return NextResponse.json({ ok: false, blad: T("Enter a valid email.", "Podaj poprawny e-mail.") }, { status: 400 });
  if (!haslo) return NextResponse.json({ ok: false, blad: T(`Password: at least ${HASLO_MIN} characters.`, `Hasło: co najmniej ${HASLO_MIN} znaków.`) }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: T("Accept the Privacy Policy.", "Zaakceptuj politykę prywatności.") }, { status: 400 });

  const istnieje = { ok: false, kod: "istnieje", blad: T("This email already has an account. Log in.", "Ten e-mail ma już konto. Zaloguj się.") };
  if (await pobierzKonto(email)) return NextResponse.json(istnieje, { status: 409 });

  const z = await zalozKontoFree({ email, haslo, zrodlo: "formularz", jezyk });
  if (!z.ok) {
    if (z.istnieje) return NextResponse.json(istnieje, { status: 409 });
    return NextResponse.json({ ok: false, blad: T("Could not create your account. Try again.", "Nie udało się założyć konta. Spróbuj ponownie.") }, { status: 500 });
  }

  await zapiszWejscie({ email, rodzaj: "logowanie", zrodlo: null, agent: req.headers.get("user-agent") });
  const c = await cookies();
  c.set(CIASTECZKO, nowyToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WAZNOSC_SESJI_S,
  });
  return NextResponse.json({ ok: true, dalej: "/bruno/start" });
}
