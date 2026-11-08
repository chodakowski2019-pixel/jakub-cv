import { supabaseAdmin } from "@/lib/supabase";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import type { Firma } from "./firmy";
import type { Deal } from "./lejek";
import { nowyKlientCrm } from "./crm";

// 8.11 (USER_001): ZAKŁADKA KLIENCI v2. (1) Domyślny CRM Bruno dla firm bez Pipedrive: tabela bruno_klienci
// (imię i nazwisko, firma, telefon, e-mail, etap, wartość). (2) Profil klienta (płeć do sylwetki + zdjęcie) dla
// KAŻDEGO deala, także z Pipedrive: tabela bruno_klient_profil, zdjęcia w prywatnym kubełku (podpisane adresy).
// SQL: lib/bruno/sql/2026-11-08-klienci.sql. Tylko serwer.

import type { Plec } from "./plec";
export type { Plec };
export type Profil = { plec: Plec | null; zdjecie: string | null };

type Wiersz = { id: number; handlowiec: string | null; imie_nazwisko: string; firma: string | null; telefon: string | null; email: string | null; etap_id: number; status: string; wartosc: number | string; waluta: string; utworzono: string; aktualizacja: string };

function mapuj(w: Wiersz): Deal {
  return {
    id: w.id,
    tytul: w.firma || w.imie_nazwisko,
    etap_id: w.etap_id,
    status: w.status,
    wartosc: Number(w.wartosc ?? 0),
    waluta: w.waluta || "PLN",
    handlowiec: w.handlowiec?.toLowerCase() ?? null,
    osoba: w.imie_nazwisko,
    organizacja: w.firma,
    aktualizacja: w.aktualizacja,
    powod_przegranej: null,
    nastepna_aktywnosc: null,
    nastepna_aktywnosc_temat: null,
    ostatni_kontakt: null,
    dodano: w.utworzono,
    telefon: w.telefon,
    email: w.email,
  };
}

export async function klienciFirmy(firmaId: string): Promise<Deal[]> {
  const { data, error } = await supabaseAdmin.from("bruno_klienci").select("*").eq("firma_id", firmaId).order("utworzono", { ascending: false }).limit(2000);
  if (error) throw new Error(`bruno_klienci: ${error.message}`);
  return ((data ?? []) as Wiersz[]).map(mapuj);
}

export { plecZImienia } from "./plec";

/** Profile (płeć + podpisany adres zdjęcia, 6 h) dla deali firmy. */
export async function profileFirmy(firmaId: string): Promise<Map<number, Profil>> {
  const out = new Map<number, Profil>();
  const { data } = await supabaseAdmin.from("bruno_klient_profil").select("deal_id, plec, zdjecie_sciezka").eq("firma_id", firmaId);
  const wiersze = (data ?? []) as { deal_id: number; plec: Plec | null; zdjecie_sciezka: string | null }[];
  const sciezki = wiersze.map((w) => w.zdjecie_sciezka).filter((x): x is string => Boolean(x));
  const adresy = new Map<string, string>();
  if (sciezki.length) {
    const { data: s } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUrls(sciezki, 6 * 3600);
    for (const x of s ?? []) if (x.path && x.signedUrl) adresy.set(x.path, x.signedUrl);
  }
  for (const w of wiersze) out.set(Number(w.deal_id), { plec: w.plec, zdjecie: w.zdjecie_sciezka ? adresy.get(w.zdjecie_sciezka) ?? null : null });
  return out;
}

export async function zapiszProfil(firmaId: string, dealId: number, zmiana: { plec?: Plec | null; zdjecie_sciezka?: string | null }) {
  const { error } = await supabaseAdmin.from("bruno_klient_profil").upsert({ firma_id: firmaId, deal_id: dealId, ...zmiana, zaktualizowano: new Date().toISOString() }, { onConflict: "firma_id,deal_id" });
  if (error) throw new Error(error.message);
}

/** Czy klient należy do firmy (ochrona przy zapisie zdjęcia / płci). */
export async function dealFirmy(firma: Pick<Firma, "id">, dealId: number): Promise<boolean> {
  const { data } = await supabaseAdmin.from("bruno_klienci").select("id").eq("firma_id", firma.id).eq("id", dealId).maybeSingle();
  return Boolean(data);
}

export type NowyKlient = { imie_nazwisko: string; firma: string | null; telefon: string | null; email: string | null; etap_id: number | null; wartosc: number; plec: Plec | null };

/** „+ Dodaj klienta”: zawsze do CRM Bruno (8.11: Pipedrive to tylko import). */
export async function dodajKlienta(firma: Pick<Firma, "id">, handlowiec: string, k: NowyKlient): Promise<{ id: number }> {
  const { id } = await nowyKlientCrm(firma.id, handlowiec, k);
  if (k.plec) await zapiszProfil(firma.id, id, { plec: k.plec });
  return { id };
}
