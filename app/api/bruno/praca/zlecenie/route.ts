import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getStripeBruno } from "@/lib/bruno/stripe";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { GWARANCJA, SUBSKRYPCJA_ZL } from "@/lib/bruno/praca/kontakty-cennik";
import { odczytajOpis } from "@/lib/bruno/praca/opis-szukania";
import { maKryteria, rodzajZlecenia, zapiszZlecenie } from "@/lib/bruno/praca/zlecenia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bruno/praca/zlecenie (12.11, USER_001): subskrypcja (290 zł / mies.) albo gwarancja (990 zł) w wyszukiwarce handlowców.
// { rodzaj: "subskrypcja" | "gwarancja", opis } → { ok, url } (Stripe Checkout). Firma nie dodaje oferty drugi raz:
// zleceniem jest opis z wyszukiwania. Konto firma zakłada PO płatności, na stronie powrotu.
// Lokalnie bez klucza Stripe: zlecenie testowe bez pieniędzy. Na produkcji nigdy.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const origin = new URL(req.url).origin;
  const rodzaj = rodzajZlecenia(b.rodzaj);
  // Metadane Stripe mieszczą 500 znaków na pole.
  const opis = String(b.opis ?? "").trim().slice(0, 450);
  if (!rodzaj || opis.length < 2) return NextResponse.json({ ok: false, blad: "Opisz, jakiego handlowca szukasz." }, { status: 400 });
  if (!maKryteria(odczytajOpis(opis).filtry)) return NextResponse.json({ ok: false, blad: "Dopisz branżę albo miasto, żebyśmy wiedzieli, kogo szukać." }, { status: 400 });

  const konto = await zalogowanePraca();
  const pracodawca = konto?.typ === "pracodawca" ? konto : null;
  const cena = rodzaj === "gwarancja" ? GWARANCJA.cena : SUBSKRYPCJA_ZL;
  const powrot = `/wyszukiwarka?q=${encodeURIComponent(opis)}`;

  if (!process.env.BRUNO_STRIPE_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, blad: "Płatność online nie jest jeszcze włączona." }, { status: 503 });
    const sesja = `test_${randomBytes(12).toString("hex")}`;
    await zapiszZlecenie({ sesja, rodzaj, email: pracodawca?.email ?? null, opis, kwotaGr: cena * 100, test: true });
    return NextResponse.json({ ok: true, test: true, url: `/praca/handlowcy/zlecenie?sesja=${sesja}` });
  }

  const metadata = { produkt: "praca", rodzaj, opis, konto: pracodawca?.id ?? "" };
  const nazwa =
    rodzaj === "gwarancja"
      ? `SalesBruno.pl: ${GWARANCJA.ile} dopasowanych handlowców w ${GWARANCJA.dni} dni albo zwrot`
      : "SalesBruno.pl: subskrypcja wyszukiwarki handlowców";
  const wspolne = {
    ...(pracodawca ? { customer_email: pracodawca.email } : {}),
    metadata,
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
    billing_address_collection: "required" as const,
    locale: "pl" as const,
    success_url: `${origin}/praca/handlowcy/zlecenie?sesja={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${powrot}`,
  };
  const sesja =
    rodzaj === "gwarancja"
      ? await getStripeBruno().checkout.sessions.create({
          ...wspolne,
          mode: "payment",
          line_items: [{ price_data: { currency: "pln", unit_amount: cena * 100, product_data: { name: nazwa } }, quantity: 1 }],
          customer_creation: "always",
          payment_intent_data: { metadata },
          invoice_creation: { enabled: true, invoice_data: { metadata, description: nazwa } },
        })
      : await getStripeBruno().checkout.sessions.create({
          ...wspolne,
          mode: "subscription",
          line_items: [{ price_data: { currency: "pln", unit_amount: cena * 100, recurring: { interval: "month" }, product_data: { name: nazwa } }, quantity: 1 }],
          subscription_data: { metadata },
        });
  return NextResponse.json({ ok: true, url: sesja.url });
}
