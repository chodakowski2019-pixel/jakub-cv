// Zakłada w Stripe produkt „Bruno Pro" i 2 ceny (USD): 250 $/mies., 2 500 $/rok.
// Idempotentne: szuka po lookup_key, nie dubluje. Wypisuje id cen do wpisania w Vercelu:
//   BRUNO_STRIPE_CENA_MIESIAC, BRUNO_STRIPE_CENA_ROK (+ BRUNO_STRIPE_WEBHOOK_SECRET z webhooka).
//
//   BRUNO_STRIPE_SECRET_KEY=sk_live_... node scripts/bruno-stripe-produkty.mjs
//   (albo node --env-file=.env.local, jeśli klucz tam jest)
import Stripe from "stripe";

const klucz = process.env.BRUNO_STRIPE_SECRET_KEY;
if (!klucz) {
  console.error("Brak BRUNO_STRIPE_SECRET_KEY");
  process.exit(1);
}
const stripe = new Stripe(klucz);

const CENY = [
  { lookup_key: "bruno_pro_miesiac", unit_amount: 250_00, interval: "month", nickname: "Bruno Pro miesięcznie" },
  { lookup_key: "bruno_pro_rok", unit_amount: 2_500_00, interval: "year", nickname: "Bruno Pro rocznie (2 miesiące gratis)" },
];

const istniejace = await stripe.prices.list({ lookup_keys: CENY.map((c) => c.lookup_key), active: true, limit: 10 });
const mapa = new Map(istniejace.data.map((p) => [p.lookup_key, p]));

let produkt = istniejace.data[0]?.product;
if (!produkt) {
  const p = await stripe.products.create({
    name: "Bruno Pro",
    description: "AI sales trainer: 5 live roleplay calls a day, coach feedback, recordings, flashcards.",
    metadata: { projekt: "bruno" },
  });
  produkt = p.id;
  console.log("Produkt:", p.id);
} else {
  produkt = typeof produkt === "string" ? produkt : produkt.id;
  console.log("Produkt (istnieje):", produkt);
}

for (const c of CENY) {
  let cena = mapa.get(c.lookup_key);
  if (!cena) {
    cena = await stripe.prices.create({
      product: produkt,
      currency: "usd",
      unit_amount: c.unit_amount,
      recurring: { interval: c.interval },
      lookup_key: c.lookup_key,
      nickname: c.nickname,
    });
    console.log("Cena założona:", c.lookup_key, cena.id);
  } else {
    console.log("Cena (istnieje):", c.lookup_key, cena.id);
  }
}

const m = (await stripe.prices.list({ lookup_keys: ["bruno_pro_miesiac"] })).data[0]?.id;
const r = (await stripe.prices.list({ lookup_keys: ["bruno_pro_rok"] })).data[0]?.id;
console.log(`\nDo Vercela (Production + Preview):\nBRUNO_STRIPE_CENA_MIESIAC=${m}\nBRUNO_STRIPE_CENA_ROK=${r}`);
console.log("Webhook: Stripe → Developers → Webhooks → Add endpoint: https://jakubchodakowski.com/api/bruno/stripe");
console.log("Zdarzenia: checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted");
console.log("Signing secret → BRUNO_STRIPE_WEBHOOK_SECRET");
