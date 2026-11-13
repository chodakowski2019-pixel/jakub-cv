import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { szukajHandlowcow, type Filtry } from "./handlowcy";
import { getStripeBruno } from "@/lib/bruno/stripe";
import { GWARANCJA, SUBSKRYPCJA_PROG } from "./kontakty-cennik";
import { odczytajOpis } from "./opis-szukania";

// 12.11 (USER_001): subskrypcja i gwarancja w wyszukiwarce handlowców. Zlecenie = zapisany opis firmy („wystarczy to, co już
// dali”). Kolejność jak przy kontaktach: płatność (Stripe Checkout) → konto firmy → kontakty w panelu. Zapis robi webhook
// ALBO strona powrotu (która pierwsza), zawsze raz (unikalna `sesja`).
// Subskrypcja (13.11, USER_001): dosyłamy kontakty do handlowców, którzy dołączyli PO zakupie i pasują do opisu na co najmniej
// SUBSKRYPCJA_PROG %. Handlowców z dnia zakupu firma odblokowuje paczką. Rezygnacja w panelu firmy (anulujSubskrypcje).
// Gwarancja: do GWARANCJA.ile dopasowanych handlowców w GWARANCJA.dni dni; brak kompletu po terminie = zwrot (robi USER_001).

export type RodzajZlecenia = "subskrypcja" | "gwarancja";
export type Zlecenie = {
  id: string;
  sesja: string;
  rodzaj: RodzajZlecenia;
  email: string | null;
  konto_id: string | null;
  opis: string;
  filtry: Filtry;
  kwota_gr: number;
  stripe_sub: string | null;
  status: "aktywne" | "zakonczone";
  termin: string | null;
  test: boolean;
  created_at: string;
  /** Subskrypcja: firma zrezygnowała, działa do końca opłaconego miesiąca. */
  anulowano_at: string | null;
};
const POLA = "id,sesja,rodzaj,email,konto_id,opis,filtry,kwota_gr,stripe_sub,status,termin,test,created_at,anulowano_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function rodzajZlecenia(v: unknown): RodzajZlecenia | null {
  return v === "subskrypcja" || v === "gwarancja" ? v : null;
}

/** Zlecenie ma sens tylko wtedy, gdy z opisu wyszło choć jedno kryterium (inaczej „dopasowany” byłby każdy). */
export function maKryteria(f: Filtry): boolean {
  return f.branze.length > 0 || !!f.miasto || !!f.lata || !!f.rynek || f.tryb.length > 0;
}

export async function zleceniePoSesji(sesja: string): Promise<Zlecenie | null> {
  const { data } = await supabaseAdmin.from("praca_zlecenia").select(POLA).eq("sesja", sesja).maybeSingle();
  return (data as Zlecenie | null) ?? null;
}

/** Zapis zlecenia. Druga próba z tą samą sesją niczego nie zmienia i zwraca istniejący wiersz. */
export async function zapiszZlecenie(z: { sesja: string; rodzaj: RodzajZlecenia; email: string | null; opis: string; kwotaGr: number; stripeSub?: string | null; test?: boolean }): Promise<{ zlecenie: Zlecenie | null; nowe: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("praca_zlecenia")
    .upsert(
      {
        sesja: z.sesja,
        rodzaj: z.rodzaj,
        email: z.email,
        opis: z.opis,
        filtry: odczytajOpis(z.opis).filtry,
        kwota_gr: z.kwotaGr,
        stripe_sub: z.stripeSub ?? null,
        termin: z.rodzaj === "gwarancja" ? new Date(Date.now() + GWARANCJA.dni * 86_400_000).toISOString() : null,
        test: !!z.test,
      },
      { onConflict: "sesja", ignoreDuplicates: true },
    )
    .select(POLA);
  if (error) console.error("[praca zlecenia] zapis", error.message);
  if (data?.length) return { zlecenie: data[0] as Zlecenie, nowe: true };
  return { zlecenie: await zleceniePoSesji(z.sesja), nowe: false };
}

/** Opłacona sesja Stripe Checkout z /api/bruno/praca/zlecenie → zlecenie w bazie (+ mail do USER_001 przy pierwszym zapisie). */
export async function zlecenieZeStripe(s: Stripe.Checkout.Session): Promise<Zlecenie | null> {
  const m = s.metadata ?? {};
  const rodzaj = rodzajZlecenia(m.rodzaj);
  if (m.produkt !== "praca" || !rodzaj || s.payment_status !== "paid") return null;
  const email = s.customer_details?.email ?? s.customer_email ?? null;
  const stripeSub = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
  const { zlecenie, nowe } = await zapiszZlecenie({ sesja: s.id, rodzaj, email, opis: m.opis ?? "", kwotaGr: s.amount_total ?? 0, stripeSub });
  if (zlecenie && nowe) {
    const termin = zlecenie.termin ? new Date(zlecenie.termin).toLocaleDateString("pl-PL") : null;
    try {
      await wyslij({
        do: SKRZYNKA_JAKUBA,
        rodzaj: "inny",
        temat: `💰 Praca: ${rodzaj === "gwarancja" ? `GWARANCJA ${GWARANCJA.cena} zł (${GWARANCJA.ile} handlowców do ${termin})` : "SUBSKRYPCJA wyszukiwarki"}: ${email ?? "?"}`,
        html: `<p>Płatność w wyszukiwarce handlowców salesbruno.pl/wyszukiwarka.</p><p><b>E-mail:</b> ${email ?? "-"}<br/><b>Rodzaj:</b> ${rodzaj}<br/><b>Kwota:</b> ${((s.amount_total ?? 0) / 100).toFixed(0)} ${(s.currency ?? "").toUpperCase()}<br/><b>Szuka:</b> ${esc(zlecenie.opis)}${termin ? `<br/><b>Termin gwarancji:</b> ${termin}. Brak ${GWARANCJA.ile} dopasowanych handlowców do tego dnia = zwrot ${GWARANCJA.cena} zł.` : ""}</p>`,
      });
    } catch (e) {
      console.error("[praca zlecenia] mail", e);
    }
  }
  if (zlecenie && !zlecenie.konto_id && UUID.test(m.konto ?? "")) await przypiszZlecenie(zlecenie, m.konto!);
  return zlecenie;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function wydane(zlecenieId: string): Promise<number> {
  const { count } = await supabaseAdmin.from("praca_odblokowania").select("handlowiec_id", { count: "exact", head: true }).eq("zlecenie_id", zlecenieId);
  return count ?? 0;
}

/** Odblokowuje firmie kontakty do handlowców pasujących do zlecenia (bez puli kontaktów). `tylko` = sprawdź tylko te osoby.
 * Gwarancja: najwyżej GWARANCJA.ile osób łącznie, po komplecie zlecenie się kończy. Zwraca liczbę nowych kontaktów. */
async function rozdaj(z: Zlecenie, tylko?: string[]): Promise<number> {
  if (!z.konto_id || z.status !== "aktywne" || !maKryteria(z.filtry)) return 0;
  const prog = z.rodzaj === "subskrypcja" ? SUBSKRYPCJA_PROG : 0;
  let ids = (await szukajHandlowcow(z.filtry)).filter((k) => (k.dopasowanie ?? 0) >= prog).map((k) => k.id);
  if (tylko) ids = ids.filter((id) => tylko.includes(id));
  if (!ids.length) return 0;
  // Kontakt, który firma ma już z innego zakupu, nie liczy się do gwarancji.
  const { data: mam } = await supabaseAdmin.from("praca_odblokowania").select("handlowiec_id").eq("konto_id", z.konto_id).in("handlowiec_id", ids);
  const juz = new Set((mam ?? []).map((x) => x.handlowiec_id as string));
  ids = ids.filter((id) => !juz.has(id));
  const dotad = z.rodzaj === "gwarancja" ? await wydane(z.id) : 0;
  if (z.rodzaj === "gwarancja") ids = ids.slice(0, Math.max(0, GWARANCJA.ile - dotad));
  if (!ids.length) return 0;
  const { data: wstawione, error } = await supabaseAdmin
    .from("praca_odblokowania")
    .upsert(ids.map((id) => ({ konto_id: z.konto_id, handlowiec_id: id, zlecenie_id: z.id })), { onConflict: "konto_id,handlowiec_id", ignoreDuplicates: true })
    .select("handlowiec_id");
  if (error) console.error("[praca zlecenia] rozdaj", error.message);
  const ile = wstawione?.length ?? 0;
  if (z.rodzaj === "gwarancja" && dotad + ile >= GWARANCJA.ile) await supabaseAdmin.from("praca_zlecenia").update({ status: "zakonczone" }).eq("id", z.id);
  return ile;
}

/** Przypina zlecenie do konta pracodawcy (raz). Gwarancja: od razu kontakty do handlowców, którzy już pasują.
 * Subskrypcja: tylko do tych, którzy zostali zweryfikowani między płatnością a założeniem konta. */
export async function przypiszZlecenie(z: Zlecenie, kontoId: string): Promise<{ ok: boolean; odblokowane: number }> {
  const { data: moje } = await supabaseAdmin
    .from("praca_zlecenia")
    .update({ konto_id: kontoId, przypisany_at: new Date().toISOString() })
    .eq("id", z.id)
    .is("konto_id", null)
    .select("id");
  // Zlecenie przypięte wcześniej: do tego samego konta = w porządku (odświeżenie strony), do innego = odmowa.
  if (!moje?.length) return { ok: (await zleceniePoSesji(z.sesja))?.konto_id === kontoId, odblokowane: 0 };
  let tylko: string[] | undefined;
  if (z.rodzaj === "subskrypcja") {
    const { data: nowi } = await supabaseAdmin.from("praca_profile_handlowcow").select("konto_id").gte("mail_weryfikacji_at", z.created_at);
    tylko = (nowi ?? []).map((x) => x.konto_id as string);
  }
  return { ok: true, odblokowane: await rozdaj({ ...z, konto_id: kontoId }, tylko) };
}

/** Nowy zweryfikowany profil: kontakt trafia do każdej firmy z aktywnym zleceniem, do którego handlowiec pasuje, firma dostaje mail. */
export async function rozdajNowego(handlowiecId: string): Promise<number> {
  const { data } = await supabaseAdmin.from("praca_zlecenia").select(POLA).eq("status", "aktywne").not("konto_id", "is", null);
  let firm = 0;
  for (const z of (data ?? []) as Zlecenie[]) {
    if (!(await rozdaj(z, [handlowiecId]))) continue;
    firm++;
    if (!z.email) continue;
    try {
      await wyslij({
        do: z.email,
        rodzaj: "inny",
        temat: "Nowy dopasowany handlowiec w SalesBruno.pl",
        html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Dzień dobry,</p><p>do bazy dołączył handlowiec, który pasuje do wyszukiwania: „${esc(z.opis)}”.</p><p>Pełny profil z telefonem i e-mailem jest już w panelu: <a href="https://salesbruno.pl/praca/panel?z=handlowcy">salesbruno.pl/praca/panel</a></p><p>Pozdrawiam<br/>Jakub Chodakowski<br/>SalesBruno.pl</p></div>`,
      });
    } catch (e) {
      console.error("[praca zlecenia] mail do firmy", e);
    }
  }
  return firm;
}

/** Koniec subskrypcji w Stripe = zlecenie przestaje dostawać nowych handlowców. Odblokowane kontakty zostają. */
export async function zakonczSubskrypcje(stripeSub: string) {
  const { error } = await supabaseAdmin.from("praca_zlecenia").update({ status: "zakonczone" }).eq("stripe_sub", stripeSub);
  if (error) console.error("[praca zlecenia] koniec subskrypcji", error.message);
}

/** Aktywne i niedawno zakończone zlecenia firmy do panelu (zakładka „Handlowcy”). */
export async function zleceniaKonta(kontoId: string): Promise<Zlecenie[]> {
  const { data } = await supabaseAdmin.from("praca_zlecenia").select(POLA).eq("konto_id", kontoId).order("created_at", { ascending: false }).limit(20);
  return (data ?? []) as Zlecenie[];
}

/** 13.11 (USER_001): rezygnacja z subskrypcji w panelu firmy. Stripe kończy ją z końcem opłaconego miesiąca
 * (webhook oznaczy wtedy zlecenie jako zakończone). Zlecenie testowe (bez Stripe) kończy się od razu. */
export async function anulujSubskrypcje(kontoId: string, zlecenieId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from("praca_zlecenia").select(POLA).eq("id", zlecenieId).eq("konto_id", kontoId).eq("rodzaj", "subskrypcja").eq("status", "aktywne").maybeSingle();
  const z = data as Zlecenie | null;
  if (!z) return false;
  if (z.stripe_sub) {
    try {
      await getStripeBruno().subscriptions.update(z.stripe_sub, { cancel_at_period_end: true });
    } catch (e) {
      console.error("[praca zlecenia] anuluj", e);
      return false;
    }
  }
  await supabaseAdmin.from("praca_zlecenia").update({ anulowano_at: new Date().toISOString(), ...(z.stripe_sub ? {} : { status: "zakonczone" }) }).eq("id", z.id);
  return true;
}
