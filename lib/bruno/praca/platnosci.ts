// 18.10 (USER_001): Stripe Payment Links na ogłoszenia (płatność jednorazowa, 30 dni publikacji).
// Najpierw płatność, potem dodanie ogłoszenia: webhook /api/bruno/stripe po client_reference_id (= id konta pracodawcy)
// dodaje 1 kredyt. Linki założył USER_001 w Stripe (muszą być na koncie Stripe Bruno, tym samym co webhook).
export const LINK_PROMO = "https://buy.stripe.com/9B6bJ164NcDN0wXeOK3AY02"; // 50 zł, pierwsze ogłoszenie
export const LINK_REGULARNY = "https://buy.stripe.com/cNi8wP2SB1Z9cfF3623AY03"; // 200 zł

export function linkPlatnosci(promo: boolean, kontoId: string, email: string): string {
  const u = new URL(promo ? LINK_PROMO : LINK_REGULARNY);
  u.searchParams.set("client_reference_id", kontoId);
  u.searchParams.set("prefilled_email", email);
  u.searchParams.set("locale", "pl");
  return u.toString();
}
