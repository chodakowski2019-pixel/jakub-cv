import type { Konto } from "./db";
import type { Firma } from "./firmy";

// 4.11.2026 (USER_001): BRUNO POD CRM. Czytamy lejek sprzedaży firmy z Pipedrive (etapy + deale,
// otwarte / wygrane / przegrane), przypisujemy deale do handlowców Bruno przez pole „Handlowiec Bruno”
// (e-mail konta) i liczymy, na którym etapie kto traci deale. Ten sam moduł daje kokpitowi (czat)
// narzędzia do ZAPISU: notatka, zmiana etapu, zadanie, nowy deal, wygrany / przegrany.
// NA RAZIE TYLKO FIRMA DEMO (USER_001 4.11: „na razie tylko na naszym koncie demo wprowadzaj zmiany”).
// Token: bruno_firmy.pipedrive_token. Tylko serwer.

const API = "https://api.pipedrive.com/v1";
export const POLE_HANDLOWCA = "Handlowiec Bruno";

type Odp<T> = { success: boolean; data: T; error?: string; additional_data?: { pagination?: { more_items_in_collection?: boolean; next_start?: number } } };

async function pd<T>(token: string, sciezka: string, init?: RequestInit): Promise<{ data: T; wiecej: boolean; nastepny: number }> {
  const sep = sciezka.includes("?") ? "&" : "?";
  const r = await fetch(`${API}${sciezka}${sep}api_token=${encodeURIComponent(token)}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const j = (await r.json().catch(() => null)) as Odp<T> | null;
  if (!r.ok || !j?.success) throw new Error(`Pipedrive ${sciezka.split("?")[0]}: ${r.status} ${j?.error ?? ""}`.trim());
  const p = j.additional_data?.pagination;
  return { data: j.data, wiecej: Boolean(p?.more_items_in_collection), nastepny: p?.next_start ?? 0 };
}

/** Czy lejek z CRM jest włączony dla firmy. 4.11: tylko firma DEMO z tokenem. */
export function crmWlaczony(firma: Pick<Firma, "demo" | "pipedrive_token"> | null | undefined): boolean {
  return Boolean(firma?.demo && firma?.pipedrive_token);
}

export type Etap = { id: number; nazwa: string; kolejnosc: number; pipeline_id: number };
export type Deal = {
  id: number;
  tytul: string;
  etap_id: number;
  status: "open" | "won" | "lost" | string;
  wartosc: number;
  waluta: string;
  handlowiec: string | null;
  osoba: string | null;
  organizacja: string | null;
  aktualizacja: string | null;
  powod_przegranej: string | null;
  nastepna_aktywnosc: string | null;
  /** 4.11 (zakładka Klienci): temat następnego zadania, data ostatniego kontaktu, data założenia. */
  nastepna_aktywnosc_temat: string | null;
  ostatni_kontakt: string | null;
  dodano: string | null;
};
export type Lejek = { pipeline: { id: number; nazwa: string }; etapy: Etap[]; deale: Deal[]; pole_handlowca: string | null };

const kluczePol = new Map<string, string | null>();

/** Klucz pola „Handlowiec Bruno” w dealach (pole własne). Brak = null (deale bez przypisania). */
export async function klucPolaHandlowca(token: string): Promise<string | null> {
  const z = kluczePol.get(token);
  if (z !== undefined) return z;
  const { data } = await pd<{ key: string; name: string }[]>(token, "/dealFields?limit=500");
  const k = (data ?? []).find((f) => f.name === POLE_HANDLOWCA)?.key ?? null;
  kluczePol.set(token, k);
  return k;
}

/** Zakłada pole „Handlowiec Bruno” (varchar), jeśli go nie ma. Zwraca klucz. */
export async function zalozPoleHandlowca(token: string): Promise<string> {
  const jest = await klucPolaHandlowca(token);
  if (jest) return jest;
  const { data } = await pd<{ key: string }>(token, "/dealFields", { method: "POST", body: JSON.stringify({ name: POLE_HANDLOWCA, field_type: "varchar" }) });
  kluczePol.set(token, data.key);
  return data.key;
}

type DealPd = Record<string, unknown> & {
  id: number;
  title: string;
  stage_id: number;
  status: string;
  value: number | null;
  currency: string | null;
  person_name: string | null;
  org_name: string | null;
  update_time: string | null;
  lost_reason: string | null;
  next_activity_date: string | null;
  next_activity_subject?: string | null;
  last_activity_date?: string | null;
  add_time?: string | null;
  pipeline_id: number;
};

/** 4.11 (USER_001): panel nie pokazuje prefiksów „[Bruno demo] ” / „[Przykład] ” (zostają w Pipedrive, reset seeda po nich usuwa). */
/** 4.11 (USER_001 „skróć te teksty, żeby to nagłówki były”): temat zadania do listy = część przed dwukropkiem, max 60 znaków. */
export const naglowekZadania = (temat: string | null | undefined): string => {
  const t = bezPrefiksu(temat);
  const krotki = t.split(/[:—–]/)[0].trim();
  const n = krotki.length >= 6 ? krotki : t;
  return n.length > 60 ? `${n.slice(0, 57).trimEnd()}…` : n;
};
export const bezPrefiksu = (s: string | null | undefined): string => String(s ?? "").replace(/\[(Bruno demo|Przykład|Sample)\]\s*/gi, "").trim();

function mapujDeal(d: DealPd, pole: string | null): Deal {
  return {
    id: d.id,
    tytul: bezPrefiksu(d.title) || d.title,
    etap_id: d.stage_id,
    status: d.status,
    wartosc: Number(d.value ?? 0),
    waluta: d.currency ?? "PLN",
    handlowiec: pole ? (String(d[pole] ?? "").trim().toLowerCase() || null) : null,
    osoba: d.person_name ? bezPrefiksu(d.person_name) : null,
    organizacja: d.org_name ? bezPrefiksu(d.org_name) : null,
    aktualizacja: d.update_time ?? null,
    powod_przegranej: d.lost_reason ?? null,
    nastepna_aktywnosc: d.next_activity_date ?? null,
    nastepna_aktywnosc_temat: d.next_activity_subject ? bezPrefiksu(d.next_activity_subject) : null,
    ostatni_kontakt: d.last_activity_date ?? null,
    dodano: d.add_time ?? null,
  };
}

/** Cały lejek firmy: pierwszy pipeline (najniższe id) albo podany, jego etapy i wszystkie deale (otwarte, wygrane, przegrane). */
export async function pobierzLejek(token: string, pipelineId?: number | null): Promise<Lejek> {
  const [{ data: pipelines }, { data: etapyAll }, pole] = await Promise.all([
    pd<{ id: number; name: string }[]>(token, "/pipelines"),
    pd<{ id: number; name: string; order_nr: number; pipeline_id: number }[]>(token, "/stages"),
    klucPolaHandlowca(token),
  ]);
  const lista = (pipelines ?? []).sort((a, b) => a.id - b.id);
  const pipeline = lista.find((p) => p.id === pipelineId) ?? lista[0];
  if (!pipeline) throw new Error("Pipedrive: brak lejka (pipeline).");
  const etapy: Etap[] = (etapyAll ?? [])
    .filter((s) => s.pipeline_id === pipeline.id)
    .sort((a, b) => a.order_nr - b.order_nr)
    .map((s) => ({ id: s.id, nazwa: s.name, kolejnosc: s.order_nr, pipeline_id: s.pipeline_id }));
  const deale: Deal[] = [];
  let start = 0;
  for (let i = 0; i < 10; i++) {
    const r = await pd<DealPd[] | null>(token, `/deals?status=all_not_deleted&limit=500&start=${start}`);
    for (const d of r.data ?? []) if (d.pipeline_id === pipeline.id) deale.push(mapujDeal(d, pole));
    if (!r.wiecej) break;
    start = r.nastepny;
  }
  return { pipeline: { id: pipeline.id, nazwa: pipeline.name }, etapy, deale, pole_handlowca: pole };
}

/** Deale, które widzi konto: handlowiec = swoje (pole = e-mail), szef = wszystkie. */
export function dealeKonta(lejek: Lejek, konto: Pick<Konto, "email" | "rola">, szef: boolean): Deal[] {
  if (szef) return lejek.deale;
  const e = konto.email.toLowerCase();
  return lejek.deale.filter((d) => d.handlowiec === e);
}

export type EtapStat = { etap: Etap; otwarte: number; wartosc: number; wygrane: number; przegrane: number; wartosc_przegrane: number };
export type AnalizaHandlowca = {
  email: string;
  etapy: EtapStat[];
  otwarte: number;
  wygrane: number;
  przegrane: number;
  wartosc_otwarte: number;
  /** Etap, na którym ten handlowiec traci najwięcej deali (po liczbie, potem po wartości). Null = nic nie przegrał. */
  najslabszy: Etap | null;
  /** Skuteczność: wygrane / (wygrane + przegrane), 0-100. Null = brak zamkniętych. */
  skutecznosc: number | null;
};

export function analizaEtapow(etapy: Etap[], deale: Deal[]): EtapStat[] {
  return etapy.map((etap) => {
    const w = deale.filter((d) => d.etap_id === etap.id);
    const otw = w.filter((d) => d.status === "open");
    const prz = w.filter((d) => d.status === "lost");
    return {
      etap,
      otwarte: otw.length,
      wartosc: otw.reduce((s, d) => s + d.wartosc, 0),
      wygrane: w.filter((d) => d.status === "won").length,
      przegrane: prz.length,
      wartosc_przegrane: prz.reduce((s, d) => s + d.wartosc, 0),
    };
  });
}

export function analizaHandlowca(email: string, lejek: Lejek): AnalizaHandlowca {
  const e = email.toLowerCase();
  const moje = lejek.deale.filter((d) => d.handlowiec === e);
  return analizaZDeali(e, lejek.etapy, moje);
}

export function analizaZDeali(email: string, etapy: Etap[], deale: Deal[]): AnalizaHandlowca {
  const st = analizaEtapow(etapy, deale);
  const wygrane = deale.filter((d) => d.status === "won").length;
  const przegrane = deale.filter((d) => d.status === "lost").length;
  const naj = [...st].filter((s) => s.przegrane > 0).sort((a, b) => b.przegrane - a.przegrane || b.wartosc_przegrane - a.wartosc_przegrane)[0] ?? null;
  return {
    email,
    etapy: st,
    otwarte: deale.filter((d) => d.status === "open").length,
    wygrane,
    przegrane,
    wartosc_otwarte: deale.filter((d) => d.status === "open").reduce((s, d) => s + d.wartosc, 0),
    najslabszy: naj?.etap ?? null,
    skutecznosc: wygrane + przegrane ? Math.round((100 * wygrane) / (wygrane + przegrane)) : null,
  };
}

export function formatKwota(n: number, waluta: string, jezyk: "pl" | "en" | string | null | undefined): string {
  const loc = jezyk === "pl" ? "pl-PL" : "en-US";
  try {
    return new Intl.NumberFormat(loc, { style: "currency", currency: waluta, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n).toLocaleString(loc)} ${waluta}`;
  }
}

/* ---------- ZAPIS (kokpit) ---------- */

export async function dodajNotatke(token: string, dealId: number, tresc: string): Promise<{ id: number }> {
  const { data } = await pd<{ id: number }>(token, "/notes", { method: "POST", body: JSON.stringify({ deal_id: dealId, content: tresc }) });
  return { id: data.id };
}

export async function przesunEtap(token: string, dealId: number, etapId: number): Promise<{ id: number; stage_id: number }> {
  const { data } = await pd<{ id: number; stage_id: number }>(token, `/deals/${dealId}`, { method: "PUT", body: JSON.stringify({ stage_id: etapId }) });
  return { id: data.id, stage_id: data.stage_id };
}

export async function zamknijDeal(token: string, dealId: number, status: "won" | "lost", powod?: string | null): Promise<{ id: number; status: string }> {
  const body: Record<string, unknown> = { status };
  if (status === "lost" && powod) body.lost_reason = powod.slice(0, 250);
  const { data } = await pd<{ id: number; status: string }>(token, `/deals/${dealId}`, { method: "PUT", body: JSON.stringify(body) });
  return { id: data.id, status: data.status };
}

export async function zmienWartosc(token: string, dealId: number, wartosc: number): Promise<{ id: number; value: number }> {
  const { data } = await pd<{ id: number; value: number }>(token, `/deals/${dealId}`, { method: "PUT", body: JSON.stringify({ value: wartosc }) });
  return { id: data.id, value: data.value };
}

export async function dodajZadanie(
  token: string,
  w: { dealId: number; temat: string; data: string; godzina?: string | null; typ?: string | null; notatka?: string | null },
): Promise<{ id: number }> {
  const { data } = await pd<{ id: number }>(token, "/activities", {
    method: "POST",
    body: JSON.stringify({
      deal_id: w.dealId,
      subject: w.temat.slice(0, 250),
      type: w.typ || "task",
      due_date: w.data,
      ...(w.godzina ? { due_time: w.godzina } : {}),
      ...(w.notatka ? { note: w.notatka } : {}),
      done: 0,
    }),
  });
  return { id: data.id };
}

export async function nowyDeal(
  token: string,
  w: { tytul: string; wartosc?: number | null; waluta?: string | null; etapId?: number | null; osoba?: string | null; organizacja?: string | null; handlowiec: string; poleHandlowca: string | null },
): Promise<{ id: number }> {
  let person_id: number | undefined;
  let org_id: number | undefined;
  if (w.organizacja) {
    const { data } = await pd<{ id: number }>(token, "/organizations", { method: "POST", body: JSON.stringify({ name: w.organizacja.slice(0, 200) }) });
    org_id = data.id;
  }
  if (w.osoba) {
    const { data } = await pd<{ id: number }>(token, "/persons", { method: "POST", body: JSON.stringify({ name: w.osoba.slice(0, 200), ...(org_id ? { org_id } : {}) }) });
    person_id = data.id;
  }
  const body: Record<string, unknown> = { title: w.tytul.slice(0, 250), value: w.wartosc ?? 0, currency: w.waluta ?? "PLN" };
  if (w.etapId) body.stage_id = w.etapId;
  if (person_id) body.person_id = person_id;
  if (org_id) body.org_id = org_id;
  if (w.poleHandlowca) body[w.poleHandlowca] = w.handlowiec;
  const { data } = await pd<{ id: number }>(token, "/deals", { method: "POST", body: JSON.stringify(body) });
  return { id: data.id };
}

export async function notatkiDeala(token: string, dealId: number, limit = 10): Promise<{ id: number; tresc: string; kiedy: string }[]> {
  const { data } = await pd<{ id: number; content: string; add_time: string }[] | null>(token, `/notes?deal_id=${dealId}&limit=${limit}&sort=add_time%20DESC`);
  return (data ?? []).map((n) => ({ id: n.id, tresc: bezPrefiksu(String(n.content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")), kiedy: n.add_time }));
}

export type Aktywnosc = { id: number; temat: string; data: string; godzina: string | null; zrobione: boolean; typ: string; notatka: string | null; deal_id: number | null; osoba: string | null; organizacja: string | null };

type AktywnoscPd = { id: number; subject: string; due_date: string; due_time?: string | null; done: boolean; type: string; note?: string | null; deal_id?: number | null; person_name?: string | null; org_name?: string | null };
const mapujAktywnosc = (a: AktywnoscPd): Aktywnosc => ({
  id: a.id,
  temat: bezPrefiksu(a.subject),
  data: a.due_date,
  godzina: a.due_time || null,
  zrobione: Boolean(a.done),
  typ: a.type,
  notatka: a.note ? bezPrefiksu(String(a.note).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")) : null,
  deal_id: a.deal_id ?? null,
  osoba: a.person_name ? bezPrefiksu(a.person_name) : null,
  organizacja: a.org_name ? bezPrefiksu(a.org_name) : null,
});

export async function zadaniaDeala(token: string, dealId: number, limit = 20): Promise<Aktywnosc[]> {
  const { data } = await pd<AktywnoscPd[] | null>(token, `/deals/${dealId}/activities?limit=${limit}`);
  return (data ?? []).map(mapujAktywnosc).sort((a, b) => (b.data + (b.godzina ?? "")).localeCompare(a.data + (a.godzina ?? "")));
}

/** 4.11 (Czat): zadania całej firmy (wszyscy użytkownicy Pipedrive) w przedziale dat; niezrobione domyślnie. */
export async function zadaniaFirmy(token: string, w: { od?: string; do?: string; zrobione?: boolean }): Promise<Aktywnosc[]> {
  const q = new URLSearchParams({ user_id: "0", limit: "500", done: w.zrobione ? "1" : "0" });
  if (w.od) q.set("start_date", w.od);
  if (w.do) q.set("end_date", w.do);
  const { data } = await pd<AktywnoscPd[] | null>(token, `/activities?${q.toString()}`);
  return (data ?? []).map(mapujAktywnosc);
}

/** Nazwy typów aktywności (key_string → nazwa), np. „Trening Bruno”. */
export async function typyAktywnosci(token: string): Promise<Map<string, string>> {
  const { data } = await pd<{ key_string: string; name: string }[] | null>(token, "/activityTypes");
  return new Map((data ?? []).map((t) => [t.key_string, t.name]));
}

/** 5.11 (USER_001, pkt 4: „leady mają mieć historię co tam Bruno dodał, notatki itd.”): jedna oś czasu deala
 *  z Pipedrive `/deals/{id}/flow`: notatki, zadania (zrobione i nie), zmiany etapu / statusu / wartości, pliki.
 *  `bruno` = wpis zrobiony przez Bruno (notatka ze stopką „przez Bruno”, aktywność „Trening Bruno”). */
export type Zdarzenie = { id: string; kiedy: string; typ: "notatka" | "zadanie" | "etap" | "status" | "wartosc" | "plik" | "mail" | "inne"; tekst: string; pod: string | null; bruno: boolean; zrobione: boolean | null; data: string | null; /** klucz typu aktywności Pipedrive (call, email, „Trening Bruno”…) */ typKlucz: string | null };

type FlowPd = { object: string; timestamp: string; data: Record<string, unknown> };
const czysty = (s: unknown) => bezPrefiksu(String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

export async function historiaDeala(token: string, dealId: number, etapy: Etap[], limit = 80): Promise<Zdarzenie[]> {
  const { data } = await pd<FlowPd[] | null>(token, `/deals/${dealId}/flow?limit=${limit}`);
  const out: Zdarzenie[] = [];
  for (const f of data ?? []) {
    const d = f.data ?? {};
    const dod = d.additional_data as Record<string, unknown> | unknown[] | undefined;
    const form = (k: string) => (dod && !Array.isArray(dod) && typeof dod[k] === "string" ? String(dod[k]) : null);
    if (f.object === "note") {
      const tresc = czysty(d.content);
      const bruno = /przez Bruno|via Bruno/i.test(tresc);
      out.push({ id: `n${d.id}`, kiedy: String(d.add_time ?? f.timestamp), typ: "notatka", tekst: tresc.replace(/\s*\S[^.]*?(przez|via) Bruno\.?$/i, "").trim(), pod: null, bruno, zrobione: null, data: null, typKlucz: null });
    } else if (f.object === "activity") {
      const typ = String(d.type ?? "");
      const trening = /trening|training/i.test(typ) || /trening bruno/i.test(String(d.subject ?? ""));
      out.push({ id: `a${d.id}`, kiedy: String(d.marked_as_done_time || d.add_time || f.timestamp), typ: "zadanie", tekst: bezPrefiksu(String(d.subject ?? "")), pod: d.note ? czysty(d.note).slice(0, 300) : null, bruno: trening, zrobione: Boolean(d.done), data: typeof d.due_date === "string" ? d.due_date : null, typKlucz: typ || null });
    } else if (f.object === "dealChange") {
      const pole = String(d.field_key ?? "");
      const kiedy = String(d.log_time ?? f.timestamp);
      if (pole === "stage_id") {
        const n = (v: unknown) => etapy.find((e) => String(e.id) === String(v))?.nazwa ?? String(v ?? "");
        out.push({ id: `c${kiedy}${pole}`, kiedy, typ: "etap", tekst: `${form("old_value_formatted") ?? n(d.old_value)} → ${form("new_value_formatted") ?? n(d.new_value)}`, pod: null, bruno: false, zrobione: null, data: null, typKlucz: null });
      } else if (pole === "status") {
        out.push({ id: `c${kiedy}${pole}`, kiedy, typ: "status", tekst: String(d.new_value ?? ""), pod: d.lost_reason ? String(d.lost_reason) : null, bruno: false, zrobione: null, data: null, typKlucz: null });
      } else if (pole === "value") {
        out.push({ id: `c${kiedy}${pole}`, kiedy, typ: "wartosc", tekst: `${d.old_value ?? 0} → ${d.new_value ?? 0}`, pod: null, bruno: false, zrobione: null, data: null, typKlucz: null });
      }
    } else if (f.object === "file") {
      out.push({ id: `f${d.id}`, kiedy: String(d.add_time ?? f.timestamp), typ: "plik", tekst: String(d.file_name ?? d.name ?? "plik"), pod: null, bruno: false, zrobione: null, data: null, typKlucz: null });
    } else if (f.object === "mailMessage") {
      const m = d as { subject?: string; from?: { email_address?: string }[] };
      out.push({ id: `m${d.id}`, kiedy: String(d.add_time ?? f.timestamp), typ: "mail", tekst: String(m.subject ?? "e-mail"), pod: m.from?.[0]?.email_address ?? null, bruno: false, zrobione: null, data: null, typKlucz: null });
    }
  }
  return out.sort((a, b) => b.kiedy.localeCompare(a.kiedy));
}

/** Deale otwarte bez ruchu dłużej niż `dni` (po dacie ostatniej zmiany w Pipedrive). */
export function dealeBezRuchu(deale: Deal[], dni = 7): Deal[] {
  const prog = Date.now() - dni * 86_400_000;
  return deale.filter((d) => d.status === "open" && d.aktualizacja && new Date(d.aktualizacja).getTime() < prog).sort((a, b) => (a.aktualizacja ?? "").localeCompare(b.aktualizacja ?? ""));
}

/** Adres deala w Pipedrive (do linków w kokpicie). */
export async function domenaPipedrive(token: string): Promise<string | null> {
  try {
    const { data } = await pd<{ company_domain?: string }>(token, "/users/me");
    return data?.company_domain ? `https://${data.company_domain}.pipedrive.com` : null;
  } catch {
    return null;
  }
}
