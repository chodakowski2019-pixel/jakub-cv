import { supabaseAdmin } from "@/lib/supabase";
import type { Firma } from "../firmy";
import { notatkiDeala, pobierzLejek, zadaniaFirmy } from "../lejek";

// 8.11 (USER_001): INTEGRACJA PIPEDRIVE → CRM BRUNO. Pipedrive to tylko źródło: import etapów, deali (z osobą, telefonem,
// e-mailem, firmą), notatek i aktywności do tabel CRM Bruno (lib/bruno/crm.ts). Ponowny import = aktualizacja po zewn_id.
// Zapis zwrotny do Pipedrive: na razie NIE (USER_001 8.11: integracje robimy sami, krok po kroku).

const ZRODLO = "pipedrive";

export async function importujPipedrive(firma: Pick<Firma, "id" | "pipedrive_token" | "pipedrive_typ">): Promise<{ etapy: number; klienci: number; notatki: number; zadania: number }> {
  const token = firma.pipedrive_token;
  if (!token) throw new Error("Firma bez tokenu Pipedrive.");
  const sb = supabaseAdmin;
  const lejek = await pobierzLejek(token);

  // 1. Etapy: Pipedrive zastępuje domyślne etapy firmy (domyślne bez klientów są kasowane).
  const { data: stare } = await sb.from("bruno_crm_etapy").select("id, zrodlo").eq("firma_id", firma.id);
  const domyslne = (stare ?? []).filter((e) => e.zrodlo !== ZRODLO).map((e) => Number(e.id));
  if (domyslne.length) {
    const { count } = await sb.from("bruno_klienci").select("id", { count: "exact", head: true }).eq("firma_id", firma.id).in("etap_id", domyslne);
    if (!count) await sb.from("bruno_crm_etapy").delete().in("id", domyslne);
  }
  const { error: eE } = await sb.from("bruno_crm_etapy").upsert(lejek.etapy.map((e, i) => ({ firma_id: firma.id, nazwa: e.nazwa, kolejnosc: i + 1, zrodlo: ZRODLO, zewn_id: String(e.id) })), { onConflict: "firma_id,zrodlo,zewn_id" });
  if (eE) throw new Error(`etapy: ${eE.message}`);
  const { data: etapyB } = await sb.from("bruno_crm_etapy").select("id, zewn_id").eq("firma_id", firma.id).eq("zrodlo", ZRODLO);
  const mapaEtapow = new Map((etapyB ?? []).map((e) => [String(e.zewn_id), Number(e.id)]));

  // 2. Klienci = deale.
  const wiersze = lejek.deale.map((d) => ({
    firma_id: firma.id,
    zrodlo: ZRODLO,
    zewn_id: String(d.id),
    handlowiec: d.handlowiec,
    imie_nazwisko: d.osoba ?? d.tytul,
    firma: d.organizacja ?? (d.osoba ? d.tytul : null),
    telefon: d.telefon ?? null,
    email: d.email ?? null,
    etap_id: mapaEtapow.get(String(d.etap_id)) ?? null,
    status: d.status,
    wartosc: d.wartosc,
    waluta: d.waluta,
    powod_przegranej: d.powod_przegranej,
    utworzono: d.dodano ?? new Date().toISOString(),
    aktualizacja: d.aktualizacja ?? new Date().toISOString(),
  }));
  for (let i = 0; i < wiersze.length; i += 500) {
    const { error } = await sb.from("bruno_klienci").upsert(wiersze.slice(i, i + 500), { onConflict: "firma_id,zrodlo,zewn_id" });
    if (error) throw new Error(`klienci: ${error.message}`);
  }
  const { data: kl } = await sb.from("bruno_klienci").select("id, zewn_id").eq("firma_id", firma.id).eq("zrodlo", ZRODLO);
  const mapaKlientow = new Map((kl ?? []).map((k) => [String(k.zewn_id), Number(k.id)]));

  // 3. Notatki (po 10 ostatnich na deal) i aktywności (otwarte + zrobione).
  const zdarzenia: Record<string, unknown>[] = [];
  let notatki = 0;
  for (const d of lejek.deale) {
    const kid = mapaKlientow.get(String(d.id));
    if (!kid) continue;
    for (const n of await notatkiDeala(token, d.id, 10).catch(() => [])) {
      const bruno = /(przez|via) Bruno\.?$/i.test(n.tresc);
      zdarzenia.push({ firma_id: firma.id, klient_id: kid, typ: "notatka", tekst: n.tresc.replace(/\s*\S[^.]*?(przez|via) Bruno\.?$/i, "").trim() || n.tresc, bruno, utworzono: n.kiedy, zrodlo: ZRODLO, zewn_id: `n${n.id}` });
      notatki++;
    }
  }
  const [otwarte, zrobione] = await Promise.all([zadaniaFirmy(token, { zrobione: false }), zadaniaFirmy(token, { zrobione: true })]);
  let zadania = 0;
  for (const a of [...otwarte, ...zrobione]) {
    const kid = a.deal_id ? mapaKlientow.get(String(a.deal_id)) : undefined;
    if (!kid) continue;
    const trening = Boolean(firma.pipedrive_typ && a.typ === firma.pipedrive_typ);
    zdarzenia.push({ firma_id: firma.id, klient_id: kid, typ: "zadanie", tekst: a.temat, pod: a.notatka, typ_zadania: trening ? "trening" : a.typ, data: a.data, godzina: a.godzina, zrobione: a.zrobione, zrobione_at: a.zrobione ? `${a.data}T${a.godzina ?? "12:00"}:00Z` : null, bruno: trening, utworzono: `${a.data}T${a.godzina ?? "09:00"}:00Z`, zrodlo: ZRODLO, zewn_id: `a${a.id}` });
    zadania++;
  }
  for (let i = 0; i < zdarzenia.length; i += 500) {
    const { error } = await sb.from("bruno_crm_zdarzenia").upsert(zdarzenia.slice(i, i + 500), { onConflict: "firma_id,zrodlo,zewn_id" });
    if (error) throw new Error(`zdarzenia: ${error.message}`);
  }
  return { etapy: lejek.etapy.length, klienci: wiersze.length, notatki, zadania };
}
