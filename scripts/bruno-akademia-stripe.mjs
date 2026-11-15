// 15.11 (USER_001): subskrypcja Academy (salesbruno.pl/academy) = 50 zł co 30 dni, konto Stripe główne „Love My Self” (decyzja USER_001 15.11, wcześniej Bruno AI).
// Zakłada produkt, cenę i Payment Link. Idempotentne: cena po lookup_key, link po metadanych, nie dubluje.
//   node --env-file=.env.local scripts/bruno-akademia-stripe.mjs
import Stripe from "stripe";

const klucz = process.env.BRUNO_STRIPE_SECRET_KEY;
if (!klucz) {
  console.error("Brak BRUNO_STRIPE_SECRET_KEY");
  process.exit(1);
}
const stripe = new Stripe(klucz);
const LOOKUP = "bruno_akademia_50pln_30d";

const konto = await stripe.accounts.retrieve();
console.log("Konto:", konto.id, konto.settings?.dashboard?.display_name ?? "", klucz.startsWith("sk_live") ? "(LIVE)" : "(TEST)");

let cena = (await stripe.prices.list({ lookup_keys: [LOOKUP], limit: 1 })).data[0];
if (!cena) {
  const produkt = await stripe.products.create({
    name: "Bruno Academy: psychologia sprzedaży",
    description: "Co sobotę lekcja psychologii sprzedaży, co poniedziałek trening rozmowy z Bruno AI.",
    metadata: { produkt: "akademia" },
  });
  cena = await stripe.prices.create({
    product: produkt.id,
    currency: "pln",
    unit_amount: 5000,
    recurring: { interval: "day", interval_count: 30 },
    lookup_key: LOOKUP,
    metadata: { produkt: "akademia" },
  });
  console.log("Nowy produkt:", produkt.id, "cena:", cena.id);
} else {
  console.log("Cena już jest:", cena.id);
}

let link = (await stripe.paymentLinks.list({ limit: 100 })).data.find((l) => l.metadata?.produkt === "akademia" && l.active);
if (!link) {
  link = await stripe.paymentLinks.create({
    line_items: [{ price: cena.id, quantity: 1 }],
    metadata: { produkt: "akademia" },
    subscription_data: { metadata: { produkt: "akademia" } },
    phone_number_collection: { enabled: false },
  });
  console.log("Nowy link.");
}
console.log("LINK:", link.url);
