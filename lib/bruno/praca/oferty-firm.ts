import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import type { Oferta } from "./oferty";

// 17.10 (USER_001): ogłoszenia dodane przez pracodawców w panelu (tabela praca_oferty_firm).
// Publicznie widać tylko status „aktywna” (po płatności 50 zł/mc, na razie aktywuje USER_001).
// Ten sam kształt co oferty z Adzuna (typ Oferta), żeby lista, karta i strona oferty działały bez zmian.

export type StatusFirmy = "oczekuje" | "aktywna" | "wstrzymana" | "usunieta";
export type OfertaFirmyWiersz = {
  id: string;
  konto_id: string;
  firma: string;
  stanowisko: string;
  miasto: string | null;
  wojewodztwo: string | null;
  poziom: string | null;
  umowa: string | null;
  wymiar: string | null;
  tryb: string | null;
  branza: string | null;
  pensja_min: number | null;
  pensja_max: number | null;
  opis: string | null;
  obowiazki: string[];
  wymagania: string[];
  mile_widziane: string[];
  oferujemy: string[];
  status: StatusFirmy;
  created_at: string;
  wazne_do: string;
  // 17.10: profil firmy z praca_konta (join).
  praca_konta?: {
    logo_url: string | null;
    nazwa_wyswietlana: string | null;
    firma: string | null;
    o_firmie: string | null;
    www: string | null;
    klauzula_rodo: string | null;
    klauzula_przyszle: string | null;
    klauzula_przyszle_domyslnie: boolean;
  } | null;
};
const Z_PROFILEM = "*, praca_konta(logo_url,nazwa_wyswietlana,firma,o_firmie,www,klauzula_rodo,klauzula_przyszle,klauzula_przyszle_domyslnie)";

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
    .replace(/-$/, "");

export function noweIdOferty(stanowisko: string, firma: string) {
  return `${slug(stanowisko.split(/\s*\/\s*/)[0])}-${slug(firma).slice(0, 24).replace(/-$/, "")}-${randomBytes(3).toString("hex").slice(0, 5)}`;
}

export function doOferty(w: OfertaFirmyWiersz): Oferta {
  const tekst = `${w.stanowisko} ${w.opis ?? ""}`;
  return {
    id: w.id,
    status: w.status === "aktywna" ? "aktywna" : w.status === "usunieta" ? "usunieta" : "nieaktywna",
    stanowisko: w.stanowisko,
    firma: w.praca_konta?.nazwa_wyswietlana || w.praca_konta?.firma || w.firma,
    miasto: w.miasto ?? "",
    wojewodztwo: w.wojewodztwo ?? "",
    b2b: /b2b/i.test(tekst),
    pensjaMin: w.pensja_min,
    pensjaMax: w.pensja_max,
    opis: w.opis ?? "",
    dodano: w.created_at,
    zrodlo: "SalesBruno.pl",
    zrodloUrl: "",
    poziom: w.poziom ?? "Specjalista (mid / regular)",
    umowa: w.umowa,
    wymiar: w.wymiar ?? "Pełny etat",
    tryb: w.tryb ?? "Praca stacjonarna",
    branza: w.branza ?? "Inne",
    odZaraz: /od zaraz/i.test(tekst),
    umiejetnosci: [],
    wazneDo: w.wazne_do,
    obowiazki: w.obowiazki ?? [],
    wymagania: w.wymagania ?? [],
    mileWidziane: w.mile_widziane ?? [],
    oferujemy: w.oferujemy ?? [],
    oFirmie: w.praca_konta?.o_firmie ?? "",
    aplikuj: null,
    logo: w.praca_konta?.logo_url ?? null,
    zFirmy: true,
    www: w.praca_konta?.www ?? null,
    klauzula: w.praca_konta?.klauzula_rodo ?? null,
    klauzulaPrzyszle: w.praca_konta?.klauzula_przyszle ?? null,
    klauzulaPrzyszleDomyslnie: w.praca_konta?.klauzula_przyszle_domyslnie ?? false,
  };
}

export async function ofertyFirmAktywne(): Promise<Oferta[]> {
  const { data, error } = await supabaseAdmin.from("praca_oferty_firm").select(Z_PROFILEM).eq("status", "aktywna").gt("wazne_do", new Date().toISOString()).order("created_at", { ascending: false });
  if (error) console.error("[praca oferty firm]", error.message);
  return ((data ?? []) as OfertaFirmyWiersz[]).map(doOferty);
}

export async function wierszOferty(id: string): Promise<OfertaFirmyWiersz | null> {
  const { data } = await supabaseAdmin.from("praca_oferty_firm").select(Z_PROFILEM).eq("id", id).maybeSingle();
  return (data as OfertaFirmyWiersz | null) ?? null;
}

export async function ofertyKonta(kontoId: string): Promise<OfertaFirmyWiersz[]> {
  const { data } = await supabaseAdmin.from("praca_oferty_firm").select("*").eq("konto_id", kontoId).neq("status", "usunieta").order("created_at", { ascending: false });
  return (data ?? []) as OfertaFirmyWiersz[];
}
