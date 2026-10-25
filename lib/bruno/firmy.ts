import { supabaseAdmin } from "@/lib/supabase";
import type { Konto, Rozmowa } from "./db";

// 25.10 (USER_001): DEMO = produkt sprzedażowy. Firma spina konto szefa i konta handlowców (bruno_firmy,
// bruno_konta.firma_id). Szef widzi /bruno/szef: tabelę zespołu i profil każdego handlowca.
// Tylko serwer (Supabase).

export type Firma = {
  id: string;
  nazwa: string;
  www: string | null;
  logo_url: string | null;
  jezyk: string;
  demo: boolean;
  demo_dane: unknown | null;
  /** 25.10: nagłówek panelu szefa po „Zespół” (np. „Jakuba”). Puste = nazwa firmy. */
  naglowek?: string | null;
  utworzono: string;
};

/** Role z profilu (/bruno/start), które widzą panel szefa. Handlowiec (rep) widzi tylko swój trening. */
export const ROLE_SZEFA = new Set(["owner", "sales_director", "team_lead"]);

export function czySzef(konto: Pick<Konto, "rola" | "firma_id"> | null | undefined): boolean {
  return Boolean(konto?.firma_id) && ROLE_SZEFA.has(String(konto?.rola ?? ""));
}

export async function pobierzFirme(id: string | null | undefined): Promise<Firma | null> {
  if (!id) return null;
  const { data } = await supabaseAdmin.from("bruno_firmy").select("*").eq("id", id).maybeSingle();
  return (data as Firma | null) ?? null;
}

/** Logo i nazwa firmy do paska bocznego (zamiast inicjału), plus czy konto jest szefem. */
export type KontekstFirmy = { firma: Firma | null; szef: boolean; logo: { url: string | null; nazwa: string } | null };
export async function kontekstFirmy(konto: Konto | null | undefined): Promise<KontekstFirmy> {
  const firma = await pobierzFirme(konto?.firma_id);
  return { firma, szef: czySzef(konto), logo: firma ? { url: firma.logo_url, nazwa: firma.nazwa } : null };
}

/** Handlowcy firmy (rola rep, konto aktywne), alfabetycznie po imieniu. */
export async function handlowcyFirmy(firmaId: string): Promise<Konto[]> {
  const { data } = await supabaseAdmin.from("bruno_konta").select("*").eq("firma_id", firmaId).eq("rola", "rep").eq("aktywne", true).order("imie");
  return (data as Konto[]) ?? [];
}

export async function handlowiecFirmy(firmaId: string, email: string): Promise<Konto | null> {
  const { data } = await supabaseAdmin.from("bruno_konta").select("*").eq("firma_id", firmaId).eq("rola", "rep").eq("email", email).maybeSingle();
  return (data as Konto | null) ?? null;
}

/** Zakończone rozmowy zespołu z ostatnich `dni` dni, najnowsze pierwsze. Bez transkrypcji (ciężka), feedback jest. */
export async function rozmowyZespolu(emails: string[], dni = 30): Promise<Rozmowa[]> {
  if (emails.length === 0) return [];
  const od = new Date(Date.now() - dni * 86_400_000).toISOString();
  const { data } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("id, email, postac, karta_id, start, koniec, sekundy, ocena, status, feedback, nagranie_sciezka, tryb, cel, cel_wlasny, obiekcja, poziom")
    .in("email", emails)
    .eq("status", "zakonczona")
    .gte("start", od)
    .order("start", { ascending: false });
  return (data as Rozmowa[]) ?? [];
}
