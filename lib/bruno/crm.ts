import { supabaseAdmin } from "@/lib/supabase";
import type { Aktywnosc, Deal, Etap, Lejek, Zdarzenie } from "./lejek";

// 8.11 (USER_001: „dla wszystkich musimy mieć domyślny CRM i dopiero do niego możemy podłączyć Pipedrive, Excel…
// integrację robimy sami”). CRM BRUNO = jedyne źródło danych dla czatu, Klientów, Lejka, Raportu i treningu.
// Integracje (lib/bruno/integracje/*) tylko WCIĄGAJĄ dane do tych tabel. SQL: lib/bruno/sql/2026-11-08-crm-bruno.sql.
// Tabele: bruno_crm_etapy (etapy firmy), bruno_klienci (klient = deal), bruno_crm_zdarzenia (notatki, zadania, zmiany).
// Tylko serwer.

export const ETAPY_DOMYSLNE = ["Nowy kontakt", "Pierwsza rozmowa", "Spotkanie", "Oferta", "Negocjacje", "Decyzja"];
export const NAZWA_LEJKA = "Sprzedaż";

type WierszKlienta = {
  id: number;
  handlowiec: string | null;
  imie_nazwisko: string;
  firma: string | null;
  telefon: string | null;
  email: string | null;
  etap_id: number;
  status: string;
  wartosc: number | string;
  waluta: string;
  utworzono: string;
  aktualizacja: string;
  powod_przegranej: string | null;
};
type WierszZdarzenia = {
  id: number;
  klient_id: number | null;
  typ: Zdarzenie["typ"];
  tekst: string;
  pod: string | null;
  typ_zadania: string | null;
  data: string | null;
  godzina: string | null;
  zrobione: boolean | null;
  zrobione_at: string | null;
  autor: string | null;
  bruno: boolean;
  utworzono: string;
};

const sb = () => supabaseAdmin;
const teraz = () => new Date().toISOString();

/** Etapy firmy. Firma bez etapów dostaje 6 domyślnych (zapis przy pierwszym odczycie). */
export async function etapyFirmy(firmaId: string): Promise<Etap[]> {
  const czytaj = async () => {
    const { data, error } = await sb().from("bruno_crm_etapy").select("id, nazwa, kolejnosc").eq("firma_id", firmaId).order("kolejnosc");
    if (error) throw new Error(`etapy: ${error.message}`);
    return (data ?? []).map((e) => ({ id: Number(e.id), nazwa: String(e.nazwa), kolejnosc: Number(e.kolejnosc), pipeline_id: 0 }));
  };
  let etapy = await czytaj();
  if (!etapy.length) {
    await sb().from("bruno_crm_etapy").insert(ETAPY_DOMYSLNE.map((nazwa, i) => ({ firma_id: firmaId, nazwa, kolejnosc: i + 1 })));
    etapy = await czytaj();
  }
  return etapy;
}

async function zdarzeniaFirmy(firmaId: string, filtr?: { klientId?: number; typ?: Zdarzenie["typ"]; limit?: number }): Promise<WierszZdarzenia[]> {
  let q = sb().from("bruno_crm_zdarzenia").select("*").eq("firma_id", firmaId);
  if (filtr?.klientId) q = q.eq("klient_id", filtr.klientId);
  if (filtr?.typ) q = q.eq("typ", filtr.typ);
  const { data, error } = await q.order("utworzono", { ascending: false }).limit(filtr?.limit ?? 5000);
  if (error) throw new Error(`zdarzenia: ${error.message}`);
  return (data ?? []) as WierszZdarzenia[];
}

/** Cały lejek firmy z CRM Bruno: etapy + klienci (deale) z następnym zadaniem i ostatnim kontaktem. */
export async function lejekCrm(firmaId: string): Promise<Lejek> {
  const [etapy, kl, zd] = await Promise.all([
    etapyFirmy(firmaId),
    sb().from("bruno_klienci").select("*").eq("firma_id", firmaId).order("utworzono", { ascending: false }).limit(5000),
    zdarzeniaFirmy(firmaId),
  ]);
  if (kl.error) throw new Error(`klienci: ${kl.error.message}`);
  const nastepne = new Map<number, WierszZdarzenia>();
  const ostatni = new Map<number, string>();
  for (const z of zd) {
    if (!z.klient_id) continue;
    if (z.typ === "zadanie" && !z.zrobione && z.data) {
      const b = nastepne.get(z.klient_id);
      if (!b || (z.data + (z.godzina ?? "")) < (b.data! + (b.godzina ?? ""))) nastepne.set(z.klient_id, z);
    }
    const kontakt = z.typ === "notatka" ? z.utworzono : z.typ === "zadanie" && z.zrobione && z.typ_zadania !== "trening" ? (z.zrobione_at ?? z.data ?? z.utworzono) : null;
    if (kontakt && (!ostatni.has(z.klient_id) || kontakt > ostatni.get(z.klient_id)!)) ostatni.set(z.klient_id, kontakt);
  }
  const pierwszy = etapy[0]?.id ?? 0;
  const deale: Deal[] = ((kl.data ?? []) as WierszKlienta[]).map((w) => {
    const n = nastepne.get(w.id);
    return {
      id: Number(w.id),
      tytul: w.firma || w.imie_nazwisko,
      etap_id: etapy.some((e) => e.id === Number(w.etap_id)) ? Number(w.etap_id) : pierwszy,
      status: w.status,
      wartosc: Number(w.wartosc ?? 0),
      waluta: w.waluta || "PLN",
      handlowiec: w.handlowiec?.toLowerCase() ?? null,
      osoba: w.imie_nazwisko,
      organizacja: w.firma,
      aktualizacja: w.aktualizacja,
      powod_przegranej: w.powod_przegranej,
      nastepna_aktywnosc: n?.data ?? null,
      nastepna_aktywnosc_temat: n?.tekst ?? null,
      ostatni_kontakt: ostatni.get(Number(w.id)) ?? null,
      dodano: w.utworzono,
      telefon: w.telefon,
      email: w.email,
    };
  });
  return { pipeline: { id: 0, nazwa: NAZWA_LEJKA }, etapy, deale, pole_handlowca: null };
}

const naAktywnosc = (z: WierszZdarzenia, d?: Deal): Aktywnosc => ({
  id: z.id,
  temat: z.tekst,
  data: z.data ?? z.utworzono.slice(0, 10),
  godzina: z.godzina,
  zrobione: Boolean(z.zrobione),
  typ: z.typ_zadania ?? "task",
  notatka: z.pod,
  deal_id: z.klient_id,
  osoba: d?.osoba ?? null,
  organizacja: d?.organizacja ?? null,
});

/** Zadania firmy (otwarte albo zrobione) w przedziale dat. */
export async function zadaniaFirmyCrm(firmaId: string, w: { od?: string; do?: string; zrobione?: boolean }): Promise<Aktywnosc[]> {
  let q = sb().from("bruno_crm_zdarzenia").select("*").eq("firma_id", firmaId).eq("typ", "zadanie").eq("zrobione", Boolean(w.zrobione));
  if (w.od) q = q.gte("data", w.od);
  if (w.do) q = q.lte("data", w.do);
  const { data, error } = await q.order("data").limit(2000);
  if (error) throw new Error(`zadania: ${error.message}`);
  return ((data ?? []) as WierszZdarzenia[]).filter((z) => z.typ_zadania !== "trening").map((z) => naAktywnosc(z));
}

export async function notatkiKlienta(firmaId: string, klientId: number, limit = 10): Promise<{ id: number; tresc: string; kiedy: string }[]> {
  return (await zdarzeniaFirmy(firmaId, { klientId, typ: "notatka", limit })).map((z) => ({ id: z.id, tresc: z.tekst, kiedy: z.utworzono }));
}

export async function zadaniaKlienta(firmaId: string, klientId: number, limit = 20): Promise<Aktywnosc[]> {
  return (await zdarzeniaFirmy(firmaId, { klientId, typ: "zadanie", limit })).map((z) => naAktywnosc(z));
}

/** Oś czasu klienta (karta klienta): notatki, zadania, zmiany etapu / statusu / wartości. */
export async function historiaKlienta(firmaId: string, klientId: number): Promise<Zdarzenie[]> {
  return (await zdarzeniaFirmy(firmaId, { klientId, limit: 120 })).map((z) => ({
    id: `z${z.id}`,
    kiedy: z.typ === "zadanie" && z.zrobione ? (z.zrobione_at ?? z.utworzono) : z.utworzono,
    typ: z.typ,
    tekst: z.tekst,
    pod: z.pod,
    bruno: z.bruno,
    zrobione: z.typ === "zadanie" ? Boolean(z.zrobione) : null,
    data: z.data,
    typKlucz: z.typ_zadania,
  }));
}

async function zapiszZdarzenie(firmaId: string, klientId: number | null, z: Partial<WierszZdarzenia> & { typ: Zdarzenie["typ"]; tekst: string }) {
  const { data, error } = await sb().from("bruno_crm_zdarzenia").insert({ firma_id: firmaId, klient_id: klientId, ...z }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "zdarzenie");
  if (klientId) await sb().from("bruno_klienci").update({ aktualizacja: teraz() }).eq("id", klientId).eq("firma_id", firmaId);
  return { id: Number(data.id) };
}

export async function dodajNotatkeCrm(firmaId: string, klientId: number, tresc: string, autor: string, bruno = true) {
  return zapiszZdarzenie(firmaId, klientId, { typ: "notatka", tekst: tresc.slice(0, 6000), autor, bruno });
}

export async function przesunEtapCrm(firmaId: string, klientId: number, etapId: number, autor: string) {
  const etapy = await etapyFirmy(firmaId);
  const e = etapy.find((x) => x.id === etapId);
  if (!e) throw new Error(`Nie ma etapu ${etapId}.`);
  const { error } = await sb().from("bruno_klienci").update({ etap_id: etapId, aktualizacja: teraz() }).eq("id", klientId).eq("firma_id", firmaId);
  if (error) throw new Error(error.message);
  await zapiszZdarzenie(firmaId, klientId, { typ: "etap", tekst: e.nazwa, autor, bruno: true });
  return { id: klientId, stage_id: etapId };
}

export async function zamknijCrm(firmaId: string, klientId: number, status: "won" | "lost", powod: string | null, autor: string) {
  const { error } = await sb().from("bruno_klienci").update({ status, powod_przegranej: status === "lost" ? powod : null, aktualizacja: teraz() }).eq("id", klientId).eq("firma_id", firmaId);
  if (error) throw new Error(error.message);
  await zapiszZdarzenie(firmaId, klientId, { typ: "status", tekst: status, pod: powod, autor, bruno: true });
  return { id: klientId, status };
}

export async function zmienWartoscCrm(firmaId: string, klientId: number, wartosc: number, autor: string) {
  const { error } = await sb().from("bruno_klienci").update({ wartosc, aktualizacja: teraz() }).eq("id", klientId).eq("firma_id", firmaId);
  if (error) throw new Error(error.message);
  await zapiszZdarzenie(firmaId, klientId, { typ: "wartosc", tekst: String(Math.round(wartosc)), autor, bruno: true });
  return { id: klientId, value: wartosc };
}

export async function dodajZadanieCrm(firmaId: string, klientId: number, w: { temat: string; typ: string; data: string; godzina?: string | null; notatka?: string | null }, autor: string) {
  return zapiszZdarzenie(firmaId, klientId, { typ: "zadanie", tekst: w.temat.slice(0, 300), typ_zadania: w.typ, data: w.data, godzina: w.godzina ?? null, pod: w.notatka ?? null, zrobione: false, autor, bruno: true });
}

export async function nowyKlientCrm(firmaId: string, handlowiec: string, k: { imie_nazwisko: string; firma: string | null; telefon: string | null; email: string | null; etap_id: number | null; wartosc: number }) {
  const etapy = await etapyFirmy(firmaId);
  const etap = etapy.find((e) => e.id === k.etap_id) ?? etapy[0];
  const { data, error } = await sb()
    .from("bruno_klienci")
    .insert({ firma_id: firmaId, handlowiec: handlowiec.toLowerCase(), imie_nazwisko: k.imie_nazwisko, firma: k.firma, telefon: k.telefon, email: k.email, etap_id: etap.id, wartosc: k.wartosc })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insert");
  return { id: Number(data.id) };
}

/** Po ocenionej rozmowie treningowej: zrobione zadanie typu „trening” (przy kliencie, jeśli trening był z klienta). */
export async function zapiszTreningCrm(firmaId: string, klientId: number | null, w: { temat: string; notatka: string; autor: string; kiedy: string }) {
  return zapiszZdarzenie(firmaId, klientId, { typ: "zadanie", typ_zadania: "trening", tekst: w.temat.slice(0, 300), pod: w.notatka.slice(0, 4000), zrobione: true, zrobione_at: w.kiedy, data: w.kiedy.slice(0, 10), autor: w.autor, bruno: true });
}
