import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, planFree } from "@/lib/bruno/db";
import { tDla } from "@/lib/bruno/i18n";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";
import { MIESIAC_JEDNORAZOWO, PRODUKT_PRO, ROK_JEDNORAZOWO, cenaPro, getStripeBruno, stripeBrunoGotowy, type OkresPro } from "@/lib/bruno/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bruno/checkout { okres: "miesiac" | "rok" } (10.10): Stripe Checkout
// na subskrypcję Bruno Pro dla zalogowanego konta free. E-mail konta jedzie
// w metadata i client_reference_id, webhook /api/bruno/stripe po nim włącza plan.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: tDla(await jezykZadania())("Log in.", "Zaloguj się.") }, { status: 401 });
  const konto = await pobierzKonto(email);
  const t = tDla(konto?.jezyk ?? (await jezykZadania()));
  if (!stripeBrunoGotowy()) return NextResponse.json({ ok: false, blad: t("Online payment isn't turned on yet.", "Płatność online nie jest jeszcze włączona.") }, { status: 503 });
  if (!konto) return NextResponse.json({ ok: false, blad: t("Account not found.", "Nie znaleziono konta.") }, { status: 404 });
  if (!planFree(konto)) return NextResponse.json({ ok: false, blad: t("This account already has full access.", "To konto ma już pełny dostęp.") }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const okres: OkresPro = b?.okres === "rok" ? "rok" : "miesiac";
  const cena = cenaPro(okres, konto.jezyk);
  // 11.10: powrót na domenę, z której klient płaci (salesbruno.com / .pl). Ciasteczko sesji jest per domena.
  const origin = new URL(req.url).origin;

  const pl = konto.jezyk === "pl";
  // 11.10 (USER_001): rok = JEDNA płatność (bez subskrypcji), dostęp na 365 dni. W PLN Stripe pokaże BLIK
  // i Przelewy24, jeśli są włączone w panelu Stripe (metody płatności zależne od waluty, bez listy w kodzie).
  // 11.10 (USER_001): miesiąc też jednorazowo (30 dni). Subskrypcji nie sprzedajemy (ścieżka niżej zostaje nieużywana).
  if (okres === "rok" || okres === "miesiac") {
    const s = await getStripeBruno().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price_data: { currency: pl ? "pln" : "usd", unit_amount: okres === "rok" ? ROK_JEDNORAZOWO : MIESIAC_JEDNORAZOWO, product: PRODUKT_PRO }, quantity: 1 }],
      customer_email: konto.stripe_customer_id ? undefined : email,
      customer: konto.stripe_customer_id ?? undefined,
      customer_creation: konto.stripe_customer_id ? undefined : "always",
      client_reference_id: email,
      metadata: { produkt: "bruno-pro", email, okres, jezyk: pl ? "pl" : "en", jednorazowo: "tak" },
      payment_intent_data: { metadata: { produkt: "bruno-pro", email, okres } },
      allow_promotion_codes: true,
      success_url: `${origin}/bruno/odblokuj?ok=1`,
      cancel_url: `${origin}/bruno/odblokuj`,
    });
    return NextResponse.json({ ok: true, url: s.url });
  }

  const session = await getStripeBruno().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: cena!, quantity: 1 }],
    customer_email: konto.stripe_customer_id ? undefined : email,
    customer: konto.stripe_customer_id ?? undefined,
    client_reference_id: email,
    metadata: { produkt: "bruno-pro", email, okres, jezyk: konto.jezyk === "pl" ? "pl" : "en" },
    subscription_data: { metadata: { produkt: "bruno-pro", email, okres } },
    allow_promotion_codes: true,
    success_url: `${origin}/bruno/odblokuj?ok=1`,
    cancel_url: `${origin}/bruno/odblokuj`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
