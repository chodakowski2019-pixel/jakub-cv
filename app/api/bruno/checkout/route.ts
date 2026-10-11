import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, planFree } from "@/lib/bruno/db";
import { tDla } from "@/lib/bruno/i18n";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";
import { cenaPro, getStripeBruno, stripeBrunoGotowy, type OkresPro } from "@/lib/bruno/stripe";

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
  if (!cena) return NextResponse.json({ ok: false, blad: t("Online payment is not set up yet.", "Płatność online nie jest jeszcze skonfigurowana.") }, { status: 503 });
  // 11.10: powrót na domenę, z której klient płaci (salesbruno.com / .pl). Ciasteczko sesji jest per domena.
  const origin = new URL(req.url).origin;

  const session = await getStripeBruno().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: cena, quantity: 1 }],
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
