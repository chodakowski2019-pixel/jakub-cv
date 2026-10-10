import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, planFree } from "@/lib/bruno/db";
import { cenaPro, getStripeBruno, stripeBrunoGotowy, type OkresPro } from "@/lib/bruno/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bruno/checkout { okres: "miesiac" | "rok" } (10.10): Stripe Checkout
// na subskrypcję Bruno Pro dla zalogowanego konta free. E-mail konta jedzie
// w metadata i client_reference_id, webhook /api/bruno/stripe po nim włącza plan.
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: "Log in." }, { status: 401 });
  if (!stripeBrunoGotowy()) return NextResponse.json({ ok: false, blad: "Online payment isn't turned on yet." }, { status: 503 });
  const konto = await pobierzKonto(email);
  if (!konto) return NextResponse.json({ ok: false, blad: "Account not found." }, { status: 404 });
  if (!planFree(konto)) return NextResponse.json({ ok: false, blad: "This account already has full access." }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const okres: OkresPro = b?.okres === "rok" ? "rok" : "miesiac";
  const cena = cenaPro(okres)!;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  const session = await getStripeBruno().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: cena, quantity: 1 }],
    customer_email: konto.stripe_customer_id ? undefined : email,
    customer: konto.stripe_customer_id ?? undefined,
    client_reference_id: email,
    metadata: { produkt: "bruno-pro", email, okres },
    subscription_data: { metadata: { produkt: "bruno-pro", email, okres } },
    allow_promotion_codes: true,
    success_url: `${origin}/bruno/odblokuj?ok=1`,
    cancel_url: `${origin}/bruno/odblokuj`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
