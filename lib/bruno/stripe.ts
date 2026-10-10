import { supabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";
import { ROZMOWA_SEKUND_MAX } from "./db";

// 10.10 (USER_001): Bruno Pro dla handlowców (B2C), decyzja cenowa 9.10:
// 250 $ / mies. albo 2 500 $ / rok, 5 rozmów dziennie, wszystkie funkcje.
// Ceny żyją w Stripe (skrypt `scripts/bruno-stripe-produkty.mjs` je zakłada),
// tu tylko ich id z env. Konto Stripe = OSOBNE konto „Bruno AI" w organizacji Love My Self (10.10),
// klucz BRUNO_STRIPE_SECRET_KEY. Transkrypcje zostają na STRIPE_SECRET_KEY.

let _stripe: Stripe | null = null;
export function getStripeBruno(): Stripe {
  if (!_stripe) {
    const key = process.env.BRUNO_STRIPE_SECRET_KEY;
    if (!key) throw new Error("BRUNO_STRIPE_SECRET_KEY missing");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const PRO_ROZMOW_DZIENNIE = 5;
/** Limit sekund na rok z zapasem: 5 rozmów × 366 dni × pełna rozmowa. Webhook odnawia przy każdej fakturze. */
export const PRO_LIMIT_SEKUND = PRO_ROZMOW_DZIENNIE * 366 * ROZMOWA_SEKUND_MAX;

export type OkresPro = "miesiac" | "rok";

export function cenaPro(okres: OkresPro): string | undefined {
  return okres === "rok" ? process.env.BRUNO_STRIPE_CENA_ROK : process.env.BRUNO_STRIPE_CENA_MIESIAC;
}

/** Czy płatność online jest skonfigurowana (klucz + obie ceny). Bez tego paywall pokazuje „Chcę pełen dostęp". */
export function stripeBrunoGotowy(): boolean {
  return Boolean(process.env.BRUNO_STRIPE_SECRET_KEY && cenaPro("miesiac") && cenaPro("rok"));
}

/** Po opłaconej subskrypcji: konto przechodzi na plan „pelny" z limitami Bruno Pro. */
export async function wlaczPro(a: { email: string; customer: string | null; subscription: string | null; proDo: Date | null }) {
  const { error } = await supabaseAdmin
    .from("bruno_konta")
    .update({
      plan: "pelny",
      aktywne: true,
      rozmow_dziennie: PRO_ROZMOW_DZIENNIE,
      limit_sekund: PRO_LIMIT_SEKUND,
      dni: 3660,
      stripe_customer_id: a.customer,
      stripe_subscription_id: a.subscription,
      pro_do: a.proDo ? a.proDo.toISOString() : null,
    })
    .eq("email", a.email);
  if (error) throw new Error(`wlaczPro: ${error.message}`);
}

/** Po wygaśnięciu / anulowaniu: z powrotem na free. 3 darmowe rozmowy są zużyte, więc panel pokaże paywall. */
export async function wylaczPro(email: string) {
  const { error } = await supabaseAdmin
    .from("bruno_konta")
    .update({ plan: "free", rozmow_dziennie: 3, pro_do: new Date().toISOString() })
    .eq("email", email);
  if (error) throw new Error(`wylaczPro: ${error.message}`);
}

export async function zapiszPlatnosc(p: {
  email: string;
  zdarzenie: string;
  session?: string | null;
  subscription?: string | null;
  customer?: string | null;
  kwota?: number | null;
  waluta?: string | null;
  okres?: string | null;
  status?: string | null;
}) {
  const { error } = await supabaseAdmin.from("bruno_platnosci").insert({
    email: p.email,
    zdarzenie: p.zdarzenie,
    stripe_session_id: p.session ?? null,
    stripe_subscription_id: p.subscription ?? null,
    stripe_customer_id: p.customer ?? null,
    kwota: p.kwota ?? null,
    waluta: p.waluta ?? null,
    okres: p.okres ?? null,
    status: p.status ?? null,
  });
  if (error) console.error("[bruno platnosci]", error.message);
}

/** E-mail konta z subskrypcji: najpierw metadata (nasz zapis), potem klient Stripe. */
export async function emailZSubskrypcji(sub: Stripe.Subscription): Promise<string | null> {
  const zMeta = sub.metadata?.email;
  if (zMeta) return zMeta;
  const { data } = await supabaseAdmin.from("bruno_konta").select("email").eq("stripe_subscription_id", sub.id).maybeSingle();
  if (data?.email) return data.email as string;
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const c = await getStripeBruno().customers.retrieve(customer);
  return !c.deleted && c.email ? c.email : null;
}
