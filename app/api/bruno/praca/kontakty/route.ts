import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getStripeBruno } from "@/lib/bruno/stripe";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { odblokowaneId, widoczneId } from "@/lib/bruno/praca/handlowcy";
import { czysteId, odblokuj, zapiszZakup } from "@/lib/bruno/praca/kontakty";
import { kontaktow, pakietDla, pakietPoLiczbie } from "@/lib/bruno/praca/kontakty-cennik";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bruno/praca/kontakty (11.11, USER_001): firma odblokowuje kontakty do handlowców z wyniku wyszukiwania.
// { wybrani: [id…], pakiet: 1 | 5 | 10, powrot } → { ok, url }.
// 1. Zalogowany pracodawca z wystarczającą pulą kontaktów na koncie: odblokowanie od razu, bez płatności.
// 2. W pozostałych przypadkach Stripe Checkout (jednorazowo, zł). Konto firma zakłada PO płatności, na stronie powrotu.
// 3. Lokalnie bez klucza Stripe: zakup testowy bez pieniędzy, żeby dało się przejść całą ścieżkę. Na produkcji nigdy.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const origin = new URL(req.url).origin;
  const konto = await zalogowanePraca();
  const pracodawca = konto?.typ === "pracodawca" ? konto : null;

  let ids = await widoczneId(czysteId(b.wybrani));
  if (pracodawca) {
    const mam = new Set(await odblokowaneId(pracodawca.id));
    ids = ids.filter((id) => !mam.has(id));
  }
  if (!ids.length) return NextResponse.json({ ok: false, blad: "Wybierz co najmniej jednego handlowca." }, { status: 400 });

  if (pracodawca && b.zKonta) {
    if (pracodawca.kontakty < ids.length) return NextResponse.json({ ok: false, blad: `Na koncie jest za mało kontaktów (${pracodawca.kontakty}). Wybierz pakiet.` }, { status: 400 });
    const w = await odblokuj(pracodawca.id, ids);
    return NextResponse.json({ ok: true, url: `/praca/panel?z=handlowcy&odblokowane=${w.odblokowane}` });
  }

  const wybrany = pakietPoLiczbie(b.pakiet);
  const pakiet = wybrany && wybrany.ile >= ids.length ? wybrany : pakietDla(ids.length);
  const powrot = typeof b.powrot === "string" && b.powrot.startsWith("/praca/handlowcy") ? b.powrot : "/praca/handlowcy";

  if (!process.env.BRUNO_STRIPE_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, blad: "Płatność online nie jest jeszcze włączona." }, { status: 503 });
    const sesja = `test_${randomBytes(12).toString("hex")}`;
    await zapiszZakup({ sesja, email: pracodawca?.email ?? null, pakiet: pakiet.ile, kwotaGr: pakiet.cena * 100, wybrani: ids, test: true });
    return NextResponse.json({ ok: true, test: true, url: `/praca/handlowcy/odblokowane?sesja=${sesja}` });
  }

  const metadata = { produkt: "praca", rodzaj: "kontakty", pakiet: String(pakiet.ile), wybrani: ids.join(","), konto: pracodawca?.id ?? "" };
  const opis = `Kontakty do handlowców na SalesBruno.pl: ${kontaktow(pakiet.ile)}`;
  const sesja = await getStripeBruno().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: "pln", unit_amount: pakiet.cena * 100, product_data: { name: opis } }, quantity: 1 }],
    ...(pracodawca ? { customer_email: pracodawca.email } : {}),
    customer_creation: "always",
    metadata,
    payment_intent_data: { metadata },
    invoice_creation: { enabled: true, invoice_data: { metadata, description: opis } },
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    locale: "pl",
    success_url: `${origin}/praca/handlowcy/odblokowane?sesja={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${powrot}`,
  });
  return NextResponse.json({ ok: true, url: sesja.url });
}
