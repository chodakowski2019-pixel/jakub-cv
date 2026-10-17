import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { DNI_MIESIACA, DNI_ROKU, emailZSubskrypcji, getStripeBruno, wlaczPro, wylaczPro, zapiszPlatnosc } from "@/lib/bruno/stripe";
import { pobierzKonto } from "@/lib/bruno/db";
import { supabaseAdmin } from "@/lib/supabase";
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
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.metadata?.produkt === "praca") {
          await platnoscPraca(s);
          break;
        }
        if (s.metadata?.produkt !== "bruno-pro") break;
        // 11.10: rok = płatność jednorazowa (mode payment). Przelewy24 potwierdza później (async_payment_succeeded).
        if (s.mode === "payment" && s.payment_status !== "paid") break;
        if (s.mode !== "subscription" && s.mode !== "payment") break;
        const email = s.metadata.email ?? s.client_reference_id ?? s.customer_details?.email ?? null;
        if (!email) break;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
        const customer = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
        // 12.10: Stripe ponawia zdarzenia po błędzie. Ta sama sesja opłacona raz = jedno przedłużenie, nie dwa.
        const { data: juz } = await supabaseAdmin.from("bruno_platnosci").select("id").eq("stripe_session_id", s.id).eq("status", "paid").limit(1);
        if (juz && juz.length > 0) break;
        const sub = subId ? await getStripeBruno().subscriptions.retrieve(subId) : null;
        // 11.10: jednorazowo rok = 365 dni, miesiąc = 30 dni. Kolejny zakup przed końcem doliczamy do obecnego końca.
        const obecne = (await pobierzKonto(email))?.pro_do;
        const od = obecne && new Date(obecne).getTime() > Date.now() ? new Date(obecne).getTime() : Date.now();
        const proDo = s.mode === "payment" ? new Date(od + (s.metadata.okres === "rok" ? DNI_ROKU : DNI_MIESIACA) * 86_400_000) : sub ? koniecOkresu(sub) : null;
        await wlaczPro({ email, customer, subscription: subId, proDo });
        await zapiszPlatnosc({ email, zdarzenie: event.type, session: s.id, subscription: subId, customer, kwota: s.amount_total, waluta: s.currency, okres: s.metadata.okres, status: s.payment_status });
        const konto = await pobierzKonto(email);
        try {
          await wyslij({ do: email, rodzaj: "inny", temat: konto?.jezyk === "pl" ? "Bruno Pro jest aktywne" : "Bruno Pro is active", html: htmlProAktywny({ imie: konto?.imie ?? null, jezyk: konto?.jezyk, okres: s.metadata.okres === "rok" ? "rok" : "miesiac" }) });
          await wyslij({
            do: SKRZYNKA_JAKUBA,
            rodzaj: "inny",
            temat: `💰 Bruno Pro: ${email} (${s.metadata.okres}, ${((s.amount_total ?? 0) / 100).toFixed(0)} ${(s.currency ?? "").toUpperCase()})`,
            html: `<p>Nowa płatność Bruno Pro.</p><p><b>E-mail:</b> ${email}<br/><b>Okres:</b> ${s.metadata.okres}<br/><b>Kwota:</b> ${((s.amount_total ?? 0) / 100).toFixed(2)} ${(s.currency ?? "").toUpperCase()}<br/><b>Dostęp do:</b> ${proDo ? proDo.toISOString().slice(0, 10) : "-"}</p>`,
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
        // 18.10: anulowana subskrypcja ogłoszenia (portal /praca) = ogłoszenie wstrzymane.
        const subP = event.data.object as Stripe.Subscription;
        if (subP.metadata?.produkt === "praca") {
          const koniec = event.type === "customer.subscription.deleted" || ["canceled", "unpaid", "incomplete_expired"].includes(subP.status);
          if (koniec && subP.metadata.oferta) await supabaseAdmin.from("praca_oferty_firm").update({ status: "wstrzymana" }).eq("id", subP.metadata.oferta).eq("stripe_sub", subP.id);
          break;
        }
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

// 18.10 (USER_001): płatność za ogłoszenie na salesbruno.com/praca (Checkout z /api/bruno/praca/platnosc).
// „panel” = ogłoszenie z panelu pracodawcy → status „aktywna” od razu. „przejecie” = oferta z Adzuna przejęta z linku w mailu → mail do USER_001.
async function platnoscPraca(s: Stripe.Checkout.Session) {
  const m = s.metadata ?? {};
  const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
  const customer = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
  const kwota = `${((s.amount_total ?? 0) / 100).toFixed(0)} ${(s.currency ?? "").toUpperCase()}`;
  if (m.rodzaj === "panel" && m.oferta) {
    await supabaseAdmin
      .from("praca_oferty_firm")
      .update({ status: "aktywna", stripe_sub: subId, stripe_customer: customer, cena_zl: Number(m.cena) || null, oplacone_od: new Date().toISOString(), wazne_do: new Date(Date.now() + 31 * 86_400_000).toISOString() })
      .eq("id", m.oferta);
  }
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      rodzaj: "inny",
      replyTo: m.email,
      temat: `💰 Praca: opłacone ogłoszenie (${kwota}/mc, ${m.rodzaj === "panel" ? "AKTYWNE automatycznie" : "PRZEJĘCIE, do ręcznego przeniesienia"}): ${m.email}`,
      html: `<p>Płatność za ogłoszenie na salesbruno.com/praca.</p><p><b>E-mail:</b> ${m.email}<br/><b>Ogłoszenie:</b> ${m.oferta}<br/><b>Kwota:</b> ${kwota} / mies.<br/><b>Rodzaj:</b> ${m.rodzaj}${m.aplikuj ? `<br/><b>Aplikacje na:</b> ${m.aplikuj}` : ""}${m.nip ? `<br/><b>NIP:</b> ${m.nip}` : ""}<br/><b>Subskrypcja:</b> ${subId ?? "-"}</p>${m.rodzaj === "przejecie" ? "<p>Oferta z Adzuna: załóż firmie konto pracodawcy i przenieś ogłoszenie do panelu (status aktywna, stripe_sub).</p>" : ""}`,
    });
    if (m.email)
      await wyslij({
        do: m.email,
        rodzaj: "inny",
        temat: "Ogłoszenie na SalesBruno.pl opłacone",
        html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Dzień dobry,</p><p>dziękujemy za płatność (${kwota} / mies.). ${m.rodzaj === "panel" ? "Ogłoszenie jest już widoczne dla handlowców." : "Ogłoszenie przejmiemy na Państwa konto i damy znać mailem."}</p><p>Panel: <a href="https://salesbruno.com/praca/panel">salesbruno.com/praca/panel</a></p><p>Pozdrawiam<br/>Jakub Chodakowski<br/>SalesBruno.pl</p></div>`,
      });
  } catch (e) {
    console.error("[bruno stripe praca] mail", e);
  }
}
