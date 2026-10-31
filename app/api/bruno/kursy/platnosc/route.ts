import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStripeBruno } from "@/lib/bruno/stripe";
import { CENA, PROMO, cenaKursu, kursPoSlugu, promoAktywne, type Plan } from "@/lib/bruno/kursy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/bruno/kursy/platnosc (30.10, USER_001): przycisk płatności na stronie kursu → Stripe Checkout (konto Bruno AI).
// Płatność jednorazowa w PLN: „z-gory” = cały kurs, „miesiac” = 1. rata z 3 (kolejne raty USER_001 wysyła linkiem).
// Cena po rabacie tylko, gdy cookie zegara (PROMO.cookie) jeszcze trwa. Webhook /api/bruno/stripe: metadata.produkt = "kurs".
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const kurs = kursPoSlugu(String(b.kurs ?? ""));
  const plan: Plan = b.plan === "miesiac" ? "miesiac" : "z-gory";
  if (!kurs) return NextResponse.json({ ok: false, blad: "Nie ma takiego kursu." }, { status: 400 });
  if (!process.env.BRUNO_STRIPE_SECRET_KEY) return NextResponse.json({ ok: false, blad: "Płatności chwilowo nie działają. Napisz do nas." }, { status: 500 });

  const koniec = Number((await cookies()).get(PROMO.cookie)?.value ?? "");
  const promo = promoAktywne(koniec);
  const zl = cenaKursu(plan, promo);
  const origin = new URL(req.url).origin;
  const nazwa = plan === "z-gory" ? `Kurs: ${kurs.tytul} (${CENA.miesiecy} miesiące)` : `Kurs: ${kurs.tytul} (miesiąc 1 z ${CENA.miesiecy})`;
  const zrodlo = String(b.zrodlo ?? "").slice(0, 100);

  try {
    const s = await getStripeBruno().checkout.sessions.create({
      mode: "payment",
      locale: "pl",
      line_items: [{ quantity: 1, price_data: { currency: "pln", unit_amount: zl * 100, product_data: { name: nazwa } } }],
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      customer_creation: "always",
      metadata: { produkt: "kurs", kurs: kurs.slug, plan, promo: promo ? "tak" : "nie", zrodlo },
      payment_intent_data: { metadata: { produkt: "kurs", kurs: kurs.slug, plan } },
      success_url: `${origin}/kursy/dziekujemy?kurs=${kurs.slug}`,
      cancel_url: `${origin}/kursy/${kurs.slug}#cena`,
    });
    return NextResponse.json({ ok: true, url: s.url });
  } catch (e) {
    console.error("[bruno kursy platnosc]", e);
    return NextResponse.json({ ok: false, blad: "Nie udało się otworzyć płatności. Spróbuj ponownie." }, { status: 500 });
  }
}
