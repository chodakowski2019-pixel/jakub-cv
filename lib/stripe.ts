import Stripe from "stripe";

// Leniwa inicjalizacja — import modułu nigdy nie crashuje, gdy brak klucza
// (klucz potrzebny dopiero przy realnym wywołaniu na produkcji).
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY missing");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Cennik transkrypcji (w groszach). Promocja vs cena po wygaśnięciu licznika.
export const PRICE_PROMO = 497; // 4,97 zł
export const PRICE_FULL = 1500; // 15,00 zł
export const PROMO_WINDOW_SECONDS = 143; // 2 min 23 s
