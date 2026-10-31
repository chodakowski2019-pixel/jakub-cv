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
        // 30.10 (USER_001): kurs B2C (salesbruno.pl/kursy/<slug>). Nie włącza Bruno Pro: konto zakłada USER_001 po telefonie.
        if (s.metadata?.produkt === "kurs") {
          await platnoscKurs(s);
          break;
        }
        // 18.10: Payment Link ogłoszenia (50 / 200 zł) z client_reference_id = id konta pracodawcy → +1 kredyt.
        if (s.payment_link && s.client_reference_id && /^[0-9a-f-]{36}$/i.test(s.client_reference_id)) {
          await kredytPraca(s);
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
  // 18.10: jednorazowo; BLIK / Przelewy24 potwierdzają później (async_payment_succeeded). Ponowione zdarzenie = bez drugiego przedłużenia.
  if (s.mode === "payment" && s.payment_status !== "paid") return;
  const { data: juz } = await supabaseAdmin.from("bruno_platnosci").select("id").eq("stripe_session_id", s.id).eq("status", "paid").limit(1);
  if (juz && juz.length > 0) return;
  await zapiszPlatnosc({ email: m.email ?? "", zdarzenie: "praca", session: s.id, subscription: null, customer: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null, kwota: s.amount_total, waluta: s.currency, okres: "30 dni", status: s.payment_status });
  const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
  const customer = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
  const kwota = `${((s.amount_total ?? 0) / 100).toFixed(0)} ${(s.currency ?? "").toUpperCase()}`;
  if (m.rodzaj === "panel" && m.oferta) {
    // 30 dni od dziś albo od końca obecnej ważności (przedłużenie przed wygaśnięciem).
    const { data: w } = await supabaseAdmin.from("praca_oferty_firm").select("status,wazne_do").eq("id", m.oferta).maybeSingle();
    const od = w?.status === "aktywna" && w.wazne_do && Date.parse(w.wazne_do) > Date.now() ? Date.parse(w.wazne_do) : Date.now();
    await supabaseAdmin
      .from("praca_oferty_firm")
      .update({ status: "aktywna", stripe_sub: subId, stripe_customer: customer, cena_zl: Number(m.cena) || null, oplacone_od: new Date().toISOString(), wazne_do: new Date(od + 30 * 86_400_000).toISOString() })
      .eq("id", m.oferta);
  }
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      rodzaj: "inny",
      replyTo: m.email,
      temat: `💰 Praca: opłacone ogłoszenie (${kwota}/mc, ${m.rodzaj === "panel" ? "AKTYWNE automatycznie" : "PRZEJĘCIE, do ręcznego przeniesienia"}): ${m.email}`,
      html: `<p>Płatność za ogłoszenie na salesbruno.com/praca.</p><p><b>E-mail:</b> ${m.email}<br/><b>Ogłoszenie:</b> ${m.oferta}<br/><b>Kwota:</b> ${kwota} (30 dni)<br/><b>Rodzaj:</b> ${m.rodzaj}${m.aplikuj ? `<br/><b>Aplikacje na:</b> ${m.aplikuj}` : ""}${m.nip ? `<br/><b>NIP:</b> ${m.nip}` : ""}<br/><b>Subskrypcja:</b> ${subId ?? "-"}</p>${m.rodzaj === "przejecie" ? "<p>Oferta z Adzuna: załóż firmie konto pracodawcy i przenieś ogłoszenie do panelu (status aktywna, stripe_sub).</p>" : ""}`,
    });
    if (m.email)
      await wyslij({
        do: m.email,
        rodzaj: "inny",
        temat: "Ogłoszenie na SalesBruno.pl opłacone",
        html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Dzień dobry,</p><p>dziękujemy za płatność (${kwota} za 30 dni). ${m.rodzaj === "panel" ? "Ogłoszenie jest już widoczne dla handlowców." : "Ogłoszenie przejmiemy na Państwa konto i damy znać mailem."}</p><p>Panel: <a href="https://salesbruno.com/praca/panel">salesbruno.com/praca/panel</a></p><p>Pozdrawiam<br/>Jakub Chodakowski<br/>SalesBruno.pl</p></div>`,
      });
  } catch (e) {
    console.error("[bruno stripe praca] mail", e);
  }
}

// 18.10 (USER_001): „najpierw płatność, potem ogłoszenie”. Opłacony Payment Link = 1 ogłoszenie do wystawienia (30 dni).
async function kredytPraca(s: Stripe.Checkout.Session) {
  if (s.payment_status !== "paid") return; // BLIK / Przelewy24: przyjdzie async_payment_succeeded
  const { data: juz } = await supabaseAdmin.from("bruno_platnosci").select("id").eq("stripe_session_id", s.id).eq("status", "paid").limit(1);
  if (juz && juz.length > 0) return;
  const kontoId = s.client_reference_id!;
  const { data: k } = await supabaseAdmin.from("praca_konta").select("id,email,firma,kredyty").eq("id", kontoId).maybeSingle();
  if (!k) {
    console.error("[bruno stripe praca] brak konta", kontoId, s.id);
    return;
  }
  const kwota = s.amount_total ?? 0;
  await supabaseAdmin
    .from("praca_konta")
    .update({ kredyty: (k.kredyty ?? 0) + 1, ...(kwota <= 50_00 ? { promo_uzyta: true } : {}) })
    .eq("id", k.id);
  // 18.10 (USER_001: „jak się zaloguje i opłaci, system mu aktywuje”): czekające ogłoszenie (np. przejęte z maila) aktywujemy od razu.
  const { data: czeka } = await supabaseAdmin.from("praca_oferty_firm").select("id,stanowisko").eq("konto_id", k.id).in("status", ["oczekuje", "wstrzymana"]).order("created_at", { ascending: true }).limit(1);
  const { aktywujKredytem } = await import("@/lib/bruno/praca/przejecie");
  const aktywowane = czeka?.[0] && (await aktywujKredytem(k.id, czeka[0].id)) ? czeka[0].stanowisko : null;
  await zapiszPlatnosc({ email: k.email, zdarzenie: "praca-kredyt", session: s.id, subscription: null, customer: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null, kwota, waluta: s.currency, okres: "30 dni", status: s.payment_status });
  const zl = `${(kwota / 100).toFixed(0)} ${(s.currency ?? "").toUpperCase()}`;
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      rodzaj: "inny",
      replyTo: k.email,
      temat: `💰 Praca: opłacone ogłoszenie (${zl}), ${k.firma ?? k.email}`,
      html: `<p>Firma opłaciła ogłoszenie na salesbruno.com/praca (Payment Link).</p><p><b>Firma:</b> ${k.firma ?? "-"}<br/><b>E-mail:</b> ${k.email}<br/><b>Kwota:</b> ${zl} (30 dni)<br/><b>${aktywowane ? `Aktywowane automatycznie: ${aktywowane}` : `Opłacone ogłoszenia do wystawienia: ${(k.kredyty ?? 0) + 1}`}</b></p>`,
    });
    await wyslij({
      do: k.email,
      rodzaj: "inny",
      temat: aktywowane ? "Płatność przyjęta: ogłoszenie jest aktywne" : "Płatność przyjęta: możesz dodać ogłoszenie",
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Dzień dobry,</p><p>dziękujemy za płatność (${zl}). ${aktywowane ? `Ogłoszenie „${aktywowane}” jest już aktywne i widoczne przez 30 dni. Opis, logo i kandydatów znajdziesz w panelu:` : "Możesz teraz dodać ogłoszenie, będzie widoczne przez 30 dni:"}</p><p><a href="https://salesbruno.com/praca/panel">salesbruno.com/praca/panel</a></p><p>Pozdrawiam<br/>Jakub Chodakowski<br/>SalesBruno.pl</p></div>`,
    });
  } catch (e) {
    console.error("[bruno stripe praca kredyt] mail", e);
  }
}

// 30.10 (USER_001): płatność za kurs B2C. Zapis w bruno_platnosci + bruno_kursy_zapisy (etap „opłacony”), mail do USER_001
// (zadzwonić w 24 h, założyć konto Bruno) i do kursanta. Ponowione zdarzenie = bez drugiego zapisu.
async function platnoscKurs(s: Stripe.Checkout.Session) {
  const m = s.metadata ?? {};
  if (s.payment_status !== "paid") return;
  const { data: juz } = await supabaseAdmin.from("bruno_platnosci").select("id").eq("stripe_session_id", s.id).eq("status", "paid").limit(1);
  if (juz && juz.length > 0) return;
  const email = (s.customer_details?.email ?? "").toLowerCase();
  const imie = s.customer_details?.name ?? "";
  const telefon = s.customer_details?.phone ?? "";
  const customer = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
  const kwota = `${((s.amount_total ?? 0) / 100).toFixed(0)} ${(s.currency ?? "").toUpperCase()}`;
  const plan = m.plan === "miesiac" ? "miesiac" : "z-gory";
  await zapiszPlatnosc({ email, zdarzenie: "kurs", session: s.id, customer, kwota: s.amount_total, waluta: s.currency, okres: `kurs:${m.kurs}:${plan}`, status: s.payment_status });
  const { error } = await supabaseAdmin.from("bruno_kursy_zapisy").insert({ kurs: m.kurs, imie: imie || email, email, telefon, plan, zrodlo: m.zrodlo || "platnosc", etap: "opłacony" });
  if (error) console.error("[bruno stripe kurs] zapis", error.message);
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      rodzaj: "inny",
      replyTo: email || undefined,
      temat: `💰 Kurs: ${m.kurs} (${kwota}, ${plan === "z-gory" ? "z góry" : "1. rata"}${m.promo === "tak" ? ", -50 %" : ""}): ${imie || email}`,
      html: `<p>Nowa płatność za kurs.</p><p><b>Kurs:</b> ${m.kurs}<br/><b>Imię:</b> ${imie}<br/><b>E-mail:</b> ${email}<br/><b>Telefon:</b> ${telefon}<br/><b>Kwota:</b> ${kwota}<br/><b>Plan:</b> ${plan}<br/><b>Rabat:</b> ${m.promo}<br/><b>Źródło:</b> ${m.zrodlo || "-"}</p><p>Zadzwoń w 24 h i załóż konto Bruno.${plan === "miesiac" ? " Kolejne 2 raty: wyślij link przed końcem miesiąca." : ""}</p>`,
    });
    if (email)
      await wyslij({
        do: email,
        rodzaj: "inny",
        temat: "Witaj na kursie sprzedaży Bruno AI",
        html: `<p>Cześć${imie ? ` ${imie.split(" ")[0]}` : ""},</p><p>dziękuję za zapis. Płatność ${kwota} dotarła.</p><p>W ciągu 24 godzin zadzwonię do Ciebie, ustalimy start i dostaniesz dostęp do treningu z Bruno.</p><p>Jakub Chodakowski</p>`,
      });
  } catch (e) {
    console.error("[bruno stripe kurs] mail", e);
  }
}
