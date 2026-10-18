import { supabaseAdmin } from "@/lib/supabase";
import type { KontoPraca } from "./konta";
import { sprawdzToken } from "./oferty";
import { noweIdOferty } from "./oferty-firm";
import { strukturaOpisu } from "./opis";

// 18.10 (USER_001): przejęcie oferty z Adzuna. Link z maila → konto pracodawcy → kopia oferty w panelu (nieaktywna)
// → płatność (Payment Link) → webhook aktywuje. Aktywna kopia ukrywa oryginał na liście (zrodlo_id).

/** Kopiuje ofertę do panelu firmy. Zwraca id kopii (istniejącą, jeśli firma już ją przejęła). */
export async function przejmijOferte(konto: KontoPraca, id: string, k: unknown): Promise<{ ok: true; id: string; aktywna: boolean } | { ok: false; blad: string }> {
  const o = sprawdzToken(id, k);
  if (!o) return { ok: false, blad: "Ten link jest nieaktualny." };
  const { data: juz } = await supabaseAdmin.from("praca_oferty_firm").select("id,status").eq("konto_id", konto.id).eq("zrodlo_id", id).neq("status", "usunieta").maybeSingle();
  if (juz) return { ok: true, id: juz.id, aktywna: juz.status === "aktywna" };

  const st = strukturaOpisu(o.opis, o.stanowisko);
  const sekcja = (t: string) => st.sekcje.find((x) => x.tytul === t)?.punkty ?? [];
  const noweId = noweIdOferty(o.stanowisko, konto.firma ?? o.firma);
  const { error } = await supabaseAdmin.from("praca_oferty_firm").insert({
    id: noweId,
    konto_id: konto.id,
    zrodlo_id: id,
    firma: konto.firma ?? o.firma,
    stanowisko: o.stanowisko,
    miasto: o.miasto || null,
    wojewodztwo: o.wojewodztwo || null,
    poziom: o.poziom,
    umowa: o.umowa,
    wymiar: o.wymiar,
    tryb: o.tryb,
    branza: o.branza,
    pensja_min: o.pensjaMin,
    pensja_max: o.pensjaMax,
    opis: st.lead || (st.sekcje.length ? "" : o.opis),
    obowiazki: sekcja("Twój zakres obowiązków"),
    wymagania: sekcja("Nasze wymagania"),
    mile_widziane: sekcja("Mile widziane"),
    oferujemy: [...sekcja("To oferujemy"), ...sekcja("Benefity")],
    status: "oczekuje",
  });
  if (error) {
    console.error("[praca przejecie]", error.message);
    return { ok: false, blad: "Nie udało się przejąć ogłoszenia." };
  }
  // Ma już opłacone ogłoszenie = aktywujemy od razu.
  const aktywna = await aktywujKredytem(konto.id, noweId);
  return { ok: true, id: noweId, aktywna };
}

/** Zużywa 1 kredyt konta i aktywuje ogłoszenie na 30 dni. false = brak kredytu. */
export async function aktywujKredytem(kontoId: string, ofertaId: string): Promise<boolean> {
  for (let i = 0; i < 3; i++) {
    const { data } = await supabaseAdmin.from("praca_konta").select("kredyty").eq("id", kontoId).single();
    const n = data?.kredyty ?? 0;
    if (n <= 0) return false;
    const { data: z } = await supabaseAdmin.from("praca_konta").update({ kredyty: n - 1 }).eq("id", kontoId).eq("kredyty", n).select("id");
    if (!z?.length) continue;
    const { data: w } = await supabaseAdmin.from("praca_oferty_firm").select("status,wazne_do").eq("id", ofertaId).single();
    const od = w?.status === "aktywna" && w.wazne_do && Date.parse(w.wazne_do) > Date.now() ? Date.parse(w.wazne_do) : Date.now();
    await supabaseAdmin.from("praca_oferty_firm").update({ status: "aktywna", oplacone_od: new Date().toISOString(), wazne_do: new Date(od + 30 * 86_400_000).toISOString() }).eq("id", ofertaId);
    return true;
  }
  return false;
}

/** Id ofert z Adzuna przejętych i aktywnych (do ukrycia oryginału na liście). */
export async function przejeteAktywne(): Promise<Set<string>> {
  const { data } = await supabaseAdmin.from("praca_oferty_firm").select("zrodlo_id").not("zrodlo_id", "is", null).eq("status", "aktywna").gt("wazne_do", new Date().toISOString());
  return new Set((data ?? []).map((x) => x.zrodlo_id as string));
}
