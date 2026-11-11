import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { odblokowaneId, widoczneId } from "./handlowcy";
import { MAKS_WYBRANYCH, pakietPoLiczbie } from "./kontakty-cennik";

// 11.11 (USER_001): giełda handlowców, zakup kontaktów. Kolejność: wynik wyszukiwania → płatność (Stripe Checkout)
// → konto firmy → kontakty odblokowane w panelu. Zakup zapisuje webhook ALBO strona powrotu ze Stripe (która pierwsza),
// zawsze raz (unikalna `sesja`). Konto przypisuje się do zakupu raz: pakiet trafia na konto jako kontakty do odblokowania,
// wybrane osoby odblokowują się od razu, reszta czeka na koncie.

export type Zakup = {
  id: string;
  sesja: string;
  email: string | null;
  konto_id: string | null;
  pakiet: number;
  kwota_gr: number;
  wybrani: string[];
  test: boolean;
  przypisany_at: string | null;
};
const POLA = "id,sesja,email,konto_id,pakiet,kwota_gr,wybrani,test,przypisany_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lista id z żądania albo z metadanych Stripe: tylko poprawne uuid, bez powtórek, najwyżej tyle, ile ma największy pakiet. */
export function czysteId(v: unknown): string[] {
  const surowe = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  return [...new Set(surowe.map((x) => String(x).trim().toLowerCase()).filter((x) => UUID.test(x)))].slice(0, MAKS_WYBRANYCH);
}

export async function zakupPoSesji(sesja: string): Promise<Zakup | null> {
  const { data } = await supabaseAdmin.from("praca_zakupy_kontaktow").select(POLA).eq("sesja", sesja).maybeSingle();
  return (data as Zakup | null) ?? null;
}

/** Zapis zakupu. Druga próba z tą samą sesją niczego nie zmienia i zwraca istniejący wiersz. */
export async function zapiszZakup(z: { sesja: string; email: string | null; pakiet: number; kwotaGr: number; wybrani: string[]; test?: boolean }): Promise<{ zakup: Zakup | null; nowy: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("praca_zakupy_kontaktow")
    .upsert({ sesja: z.sesja, email: z.email, pakiet: z.pakiet, kwota_gr: z.kwotaGr, wybrani: z.wybrani, test: !!z.test }, { onConflict: "sesja", ignoreDuplicates: true })
    .select(POLA);
  if (error) console.error("[praca kontakty] zakup", error.message);
  if (data?.length) return { zakup: data[0] as Zakup, nowy: true };
  return { zakup: await zakupPoSesji(z.sesja), nowy: false };
}

/** Opłacona sesja Stripe Checkout z /api/bruno/praca/kontakty → zakup w bazie (+ mail do USER_001 przy pierwszym zapisie). */
export async function zakupZeStripe(s: Stripe.Checkout.Session): Promise<Zakup | null> {
  const m = s.metadata ?? {};
  if (m.produkt !== "praca" || m.rodzaj !== "kontakty" || s.payment_status !== "paid") return null;
  const pakiet = pakietPoLiczbie(m.pakiet);
  if (!pakiet) return null;
  const email = s.customer_details?.email ?? s.customer_email ?? null;
  const { zakup, nowy } = await zapiszZakup({ sesja: s.id, email, pakiet: pakiet.ile, kwotaGr: s.amount_total ?? 0, wybrani: czysteId(m.wybrani) });
  if (zakup && nowy) {
    try {
      await wyslij({
        do: SKRZYNKA_JAKUBA,
        rodzaj: "inny",
        temat: `Praca: firma kupiła kontakty do handlowców (${pakiet.ile}): ${email ?? "?"}`,
        html: `<p>Płatność za kontakty do handlowców na salesbruno.pl/praca/handlowcy.</p><p><b>E-mail:</b> ${email ?? "-"}<br/><b>Pakiet:</b> ${pakiet.ile}<br/><b>Kwota:</b> ${((s.amount_total ?? 0) / 100).toFixed(0)} ${(s.currency ?? "").toUpperCase()}<br/><b>Wybrani od razu:</b> ${zakup.wybrani.length}</p>`,
      });
    } catch (e) {
      console.error("[praca kontakty] mail", e);
    }
  }
  if (zakup && !zakup.konto_id && UUID.test(m.konto ?? "")) await przypiszZakup(zakup, m.konto!);
  return zakup;
}

/** Odblokowuje kontakty z puli na koncie pracodawcy. Pomija osoby już odblokowane i profile niewidoczne. */
export async function odblokuj(kontoId: string, ids: string[], zakupId?: string): Promise<{ odblokowane: number; zostalo: number }> {
  const { data: k } = await supabaseAdmin.from("praca_konta").select("kontakty").eq("id", kontoId).eq("typ", "pracodawca").maybeSingle();
  const pula = (k?.kontakty as number | undefined) ?? 0;
  const mam = new Set(await odblokowaneId(kontoId));
  const nowe = (await widoczneId(ids.filter((id) => !mam.has(id)))).slice(0, pula);
  if (!k || !nowe.length) return { odblokowane: 0, zostalo: pula };
  const { data: wstawione, error } = await supabaseAdmin
    .from("praca_odblokowania")
    .upsert(nowe.map((id) => ({ konto_id: kontoId, handlowiec_id: id, zakup_id: zakupId ?? null })), { onConflict: "konto_id,handlowiec_id", ignoreDuplicates: true })
    .select("handlowiec_id");
  if (error) {
    console.error("[praca kontakty] odblokuj", error.message);
    return { odblokowane: 0, zostalo: pula };
  }
  const ile = wstawione?.length ?? 0;
  if (ile) await supabaseAdmin.from("praca_konta").update({ kontakty: pula - ile }).eq("id", kontoId);
  return { odblokowane: ile, zostalo: pula - ile };
}

/** Przypina zakup do konta pracodawcy (raz), dopisuje pakiet do puli i odblokowuje osoby wybrane przy zakupie. */
export async function przypiszZakup(zakup: Zakup, kontoId: string): Promise<{ ok: boolean; odblokowane: number }> {
  const { data: moj } = await supabaseAdmin
    .from("praca_zakupy_kontaktow")
    .update({ konto_id: kontoId, przypisany_at: new Date().toISOString() })
    .eq("id", zakup.id)
    .is("konto_id", null)
    .select("id");
  // Zakup przypięty wcześniej: do tego samego konta = w porządku (odświeżenie strony), do innego = odmowa.
  if (!moj?.length) return { ok: (await zakupPoSesji(zakup.sesja))?.konto_id === kontoId, odblokowane: 0 };
  const { data: k } = await supabaseAdmin.from("praca_konta").select("kontakty").eq("id", kontoId).maybeSingle();
  await supabaseAdmin.from("praca_konta").update({ kontakty: ((k?.kontakty as number | undefined) ?? 0) + zakup.pakiet }).eq("id", kontoId);
  const w = await odblokuj(kontoId, zakup.wybrani, zakup.id);
  return { ok: true, odblokowane: w.odblokowane };
}
