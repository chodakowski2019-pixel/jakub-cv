import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { emailZSubskrypcji, getStripeBruno, wlaczPro, wylaczPro, zapiszPlatnosc } from "@/lib/bruno/stripe";
import { pobierzKonto } from "@/lib/bruno/db";
import { SKRZYNKA_JAKUBA, htmlProAktywny, wyslij } from "@/lib/bruno/mail";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/bruno/stripe (10.10): webhook Stripe dla Bruno Pro. Osobny endpoint i osobny
// sekret (BRUNO_STRIPE_WEBHOOK_SECRET) niż transkrypcje. Po deployu zarejestrować w Stripe:
// checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted.

function koniecOkresu(sub: Stripe.Subscription): Date | null {
  const t = sub.items?.data?.[0]?.current_period_end;
  return t ? new Date(t * 1000) : null;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.BRUNO_STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "Missing signature/secret" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripeBruno().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.metadata?.produkt !== "bruno-pro" || s.mode !== "subscription") break;
        const email = s.metadata.email ?? s.client_reference_id ?? s.customer_details?.email ?? null;
        if (!email) break;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
        const customer = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
        const sub = subId ? await getStripeBruno().subscriptions.retrieve(subId) : null;
        await wlaczPro({ email, customer, subscription: subId, proDo: sub ? koniecOkresu(sub) : null });
        await zapiszPlatnosc({ email, zdarzenie: event.type, session: s.id, subscription: subId, customer, kwota: s.amount_total, waluta: s.currency, okres: s.metadata.okres, status: s.payment_status });
        const konto = await pobierzKonto(email);
        try {
          await wyslij({ do: email, rodzaj: "inny", temat: "Bruno Pro is active", html: htmlProAktywny({ imie: konto?.imie ?? null, okres: s.metadata.okres === "rok" ? "rok" : "miesiac" }) });
          await wyslij({
            do: SKRZYNKA_JAKUBA,
            rodzaj: "inny",
            temat: `💰 Bruno Pro: ${email} (${s.metadata.okres}, ${((s.amount_total ?? 0) / 100).toFixed(0)} ${(s.currency ?? "").toUpperCase()})`,
            html: `<p>Nowa subskrypcja Bruno Pro.</p><p><b>E-mail:</b> ${email}<br/><b>Okres:</b> ${s.metadata.okres}<br/><b>Kwota:</b> ${((s.amount_total ?? 0) / 100).toFixed(2)} ${(s.currency ?? "").toUpperCase()}<br/><b>Subskrypcja:</b> ${subId}</p>`,
          });
        } catch (e) {
          console.error("[bruno stripe] mail", e);
        }
        break;
      }
      case "invoice.paid": {
        // Odnowienie: przedłuż opłacony okres.
        const inv = event.data.object as Stripe.Invoice;
        const subRef = inv.parent?.subscription_details?.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id ?? null;
        if (!subId) break;
        const sub = await getStripeBruno().subscriptions.retrieve(subId);
        if (sub.metadata?.produkt !== "bruno-pro") break;
        const email = await emailZSubskrypcji(sub);
        if (!email) break;
        const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await wlaczPro({ email, customer, subscription: sub.id, proDo: koniecOkresu(sub) });
        await zapiszPlatnosc({ email, zdarzenie: event.type, subscription: sub.id, customer, kwota: inv.amount_paid, waluta: inv.currency, okres: sub.metadata?.okres, status: inv.status });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.metadata?.produkt !== "bruno-pro") break;
        const email = await emailZSubskrypcji(sub);
        if (!email) break;
        const martwa = event.type === "customer.subscription.deleted" || ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
        if (martwa) await wylaczPro(email);
        await zapiszPlatnosc({ email, zdarzenie: event.type, subscription: sub.id, customer: typeof sub.customer === "string" ? sub.customer : sub.customer.id, okres: sub.metadata?.okres, status: sub.status });
        break;
      }
    }
  } catch (e) {
    console.error("[bruno stripe]", event.type, e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
