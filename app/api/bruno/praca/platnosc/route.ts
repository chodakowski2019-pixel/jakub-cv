import { NextResponse } from "next/server";
import { getStripeBruno } from "@/lib/bruno/stripe";
import { zalogowanePraca, nazwaFirmy } from "@/lib/bruno/praca/konta";
import { CENA_MIESIAC, CENA_REGULARNA, sprawdzToken } from "@/lib/bruno/praca/oferty";
import { ofertyKonta, wierszOferty } from "@/lib/bruno/praca/oferty-firm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bruno/praca/platnosc (18.10, USER_001: „trzeba link do Stripe”): Stripe Checkout w PLN.
// 18.10 (USER_001): na razie PŁATNOŚĆ JEDNORAZOWA za 30 dni (karta + BLIK + Przelewy24, faktura ze Stripe); subskrypcja po pierwszych sprzedażach.
// { id } = ogłoszenie z panelu pracodawcy (zalogowany): pierwsze ogłoszenie konta 50 zł, kolejne 200 zł.
// { id, k, email } = przejęcie ogłoszenia z linku w mailu (oferta z Adzuna, promocja 50 zł).
// Webhook /api/bruno/stripe (produkt „praca”) aktywuje ogłoszenie / powiadamia USER_001.
const zl = (n: number) => n * 100;

export async function POST(req: Request) {
  // Ogłoszenia nie potrzebują cen Bruno Pro z env (cena w price_data), wystarczy klucz.
  if (!process.env.BRUNO_STRIPE_SECRET_KEY) return NextResponse.json({ ok: false, blad: "Płatność online nie jest jeszcze włączona." }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const origin = new URL(req.url).origin;
  const id = String(b.id ?? "").slice(0, 160);

  let cena: number;
  let email: string;
  let opis: string;
  let metadata: Record<string, string>;
  let powrot: string;

  if (b.k) {
    const o = sprawdzToken(id, b.k);
    if (!o) return NextResponse.json({ ok: false, blad: "Ten link jest nieaktualny." }, { status: 404 });
    email = String(b.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail." }, { status: 400 });
    cena = CENA_MIESIAC;
    opis = `${o.stanowisko}, ${o.firma}`;
    metadata = { produkt: "praca", rodzaj: "przejecie", oferta: id, email, aplikuj: String(b.aplikuj ?? "").slice(0, 300), nip: String(b.nip ?? "").replace(/\D/g, "").slice(0, 10) };
    powrot = `${origin}/praca/${id}?k=${encodeURIComponent(String(b.k))}`;
  } else {
    const konto = await zalogowanePraca();
    if (!konto || konto.typ !== "pracodawca") return NextResponse.json({ ok: false, blad: "Zaloguj się jako pracodawca." }, { status: 401 });
    const w = await wierszOferty(id);
    if (!w || w.konto_id !== konto.id) return NextResponse.json({ ok: false, blad: "Nie ma takiego ogłoszenia." }, { status: 404 });
    // Aktywne i ważne dłużej niż 5 dni = nie ma czego przedłużać.
    if (w.status === "aktywna" && Date.parse(w.wazne_do) - Date.now() > 5 * 86_400_000) return NextResponse.json({ ok: false, blad: "To ogłoszenie jest już aktywne." }, { status: 400 });
    const pierwsza = [...(await ofertyKonta(konto.id))].sort((a, c) => a.created_at.localeCompare(c.created_at))[0]?.id;
    cena = id === pierwsza ? CENA_MIESIAC : CENA_REGULARNA;
    email = konto.email;
    opis = `${w.stanowisko}, ${nazwaFirmy(konto)}`;
    metadata = { produkt: "praca", rodzaj: "panel", oferta: id, email, konto: konto.id, cena: String(cena) };
    powrot = `${origin}/praca/panel`;
  }

  const sesja = await getStripeBruno().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "pln",
          unit_amount: zl(cena),
          product_data: { name: `Ogłoszenie na SalesBruno.pl, 30 dni: ${opis}`.slice(0, 250) },
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    customer_creation: "always",
    client_reference_id: email,
    metadata,
    payment_intent_data: { metadata },
    invoice_creation: { enabled: true, invoice_data: { metadata, description: "Ogłoszenie na SalesBruno.pl (30 dni)" } },
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    locale: "pl",
    success_url: `${powrot}${powrot.includes("?") ? "&" : "?"}platnosc=ok`,
    cancel_url: powrot,
  });
  return NextResponse.json({ ok: true, url: sesja.url });
}
