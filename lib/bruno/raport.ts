import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";
import type { Konto } from "./db";
import { ankietyKonta } from "./ankieta-db";
import { etykiety } from "./etykiety";
import { handlowcyFirmy, rozmowyZespolu, type Firma } from "./firmy";
import { analizaZDeali, lejekFirmy, type Lejek } from "./lejek";
import { zadaniaFirmyCrm } from "./crm";
import { statystykiHandlowca, type StatHandlowca } from "./zespol";

// 4.11 (USER_001, pkt 3): KOKPIT SZEFA = statystyki każdego handlowca (CRM + treningi + sprawdzian mentalny)
// i RAPORT MIESIĘCZNY z Claude (co się poprawiło, kto, gdzie traci, 3 zalecenia). Tabela bruno_raporty
// (SQL: sql/2026-11-04-crm-kokpit.sql). Ten sam moduł dla strony /bruno/raport, API „Wygeneruj teraz”
// i (później) crona 1. dnia miesiąca z mailem (lib/bruno/szablon-mail.mjs). Tylko serwer.

export type WierszZespolu = {
  email: string;
  imie: string;
  zdjecie: string | null;
  /** CRM */
  otwarte: number;
  wartosc_otwarte: number;
  wygrane: number;
  przegrane: number;
  skutecznosc: number | null;
  najslabszy_etap: string | null;
  aktywnosci30: number;
  zalegle: number;
  /** Treningi (bruno_rozmowy) */
  rozmow30: number;
  srednia: number | null;
  trend: number | null;
  najslabsze_kryterium: string | null;
  dni_bez_treningu: number | null;
  /** Sprawdzian mentalny (ankieta Mazura), 0-100 */
  mental: number | null;
  mental_kiedy: string | null;
};

export type DaneRaportu = { firma: Firma; lejek: Lejek; wiersze: WierszZespolu[]; waluta: string; od: string; do: string };

export async function zbierzDaneZespolu(firma: Firma, jezyk: "pl" | "en"): Promise<DaneRaportu> {
  // 8.11: wszystko z CRM Bruno.
  const dzis = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const od = new Date(Date.now() - 30 * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const handlowcy = await handlowcyFirmy(firma.id);
  const emails = handlowcy.map((h) => h.email);
  const [lejek, zrobione, zalegle, rozmowy, ankiety] = await Promise.all([
    lejekFirmy(firma),
    zadaniaFirmyCrm(firma.id, { od, do: dzis, zrobione: true }),
    zadaniaFirmyCrm(firma.id, { do: dzis, zrobione: false }),
    rozmowyZespolu(emails, 30),
    Promise.all(handlowcy.map((h) => ankietyKonta(h.email, 1).catch(() => []))),
  ]);
  const { NAZWY } = etykiety(jezyk);
  const wiersze: WierszZespolu[] = handlowcy.map((h, i) => {
    const e = h.email.toLowerCase();
    const moje = lejek.deale.filter((d) => d.handlowiec === e);
    const mojeId = new Set(moje.map((d) => d.id));
    const a = analizaZDeali(e, lejek.etapy, moje);
    const s: StatHandlowca = statystykiHandlowca(h as Pick<Konto, "email" | "imie" | "zdjecie_url">, rozmowy.filter((r) => r.email === h.email));
    const ank = ankiety[i]?.[0] ?? null;
    return {
      email: h.email,
      imie: h.imie ?? h.email,
      zdjecie: h.zdjecie_url ?? null,
      otwarte: a.otwarte,
      wartosc_otwarte: a.wartosc_otwarte,
      wygrane: a.wygrane,
      przegrane: a.przegrane,
      skutecznosc: a.skutecznosc,
      najslabszy_etap: a.najslabszy?.nazwa ?? null,
      aktywnosci30: zrobione.filter((z) => z.deal_id && mojeId.has(z.deal_id)).length,
      zalegle: zalegle.filter((z) => z.deal_id && mojeId.has(z.deal_id) && z.data < dzis).length,
      rozmow30: s.rozmow30,
      srednia: s.srednia,
      trend: s.trend,
      najslabsze_kryterium: s.najslabsze ? NAZWY[s.najslabsze] : null,
      dni_bez_treningu: s.dniBezTreningu,
      mental: ank ? Math.round(ank.wynik) : null,
      mental_kiedy: ank?.utworzono ?? null,
    };
  });
  return { firma, lejek, wiersze, waluta: lejek.deale[0]?.waluta ?? "PLN", od, do: dzis };
}

export type Raport = {
  miesiac: string;
  podsumowanie: string;
  poprawa: { kto: string; co: string }[];
  traci: { kto: string; gdzie: string; ile: string }[];
  zalecenia: string[];
};

export type RaportWiersz = { id: number; firma_id: string; miesiac: string; utworzono: string; tresc: Raport; model: string | null; autor_email: string | null };

export async function raportyFirmy(firmaId: string, ile = 6): Promise<RaportWiersz[]> {
  const { data, error } = await supabaseAdmin.from("bruno_raporty").select("*").eq("firma_id", firmaId).order("utworzono", { ascending: false }).limit(ile);
  if (error) {
    console.error("[bruno raport] odczyt", error.message);
    return [];
  }
  return (data ?? []) as RaportWiersz[];
}

const MODEL = process.env.BRUNO_RAPORT_MODEL ?? "claude-opus-5-5";

/** Raport miesięczny z Claude na podstawie danych zespołu. Zapisuje do bruno_raporty. */
export async function generujRaport(dane: DaneRaportu, jezyk: "pl" | "en", autor: string | null): Promise<RaportWiersz> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Brak ANTHROPIC_API_KEY.");
  const pl = jezyk === "pl";
  const miesiac = dane.do.slice(0, 7);
  const tabela = dane.wiersze
    .map(
      (w) =>
        `${w.imie}: otwarte ${w.otwarte} (${Math.round(w.wartosc_otwarte)} ${dane.waluta}), wygrane ${w.wygrane}, przegrane ${w.przegrane}, skuteczność ${w.skutecznosc ?? "-"}%, najsłabszy etap: ${w.najslabszy_etap ?? "-"}, aktywności w CRM 30 dni: ${w.aktywnosci30}, zaległe zadania: ${w.zalegle}, treningi 30 dni: ${w.rozmow30}, średnia ocen: ${w.srednia ?? "-"}/10, trend: ${w.trend ?? "-"}, najsłabsze kryterium: ${w.najslabsze_kryterium ?? "-"}, dni bez treningu: ${w.dni_bez_treningu ?? "-"}, sprawdzian mentalny: ${w.mental ?? "-"}/100`,
    )
    .join("\n");
  const etapy = dane.lejek.etapy.map((e) => e.nazwa).join(" → ");
  const przegranePoEtapie = dane.lejek.etapy
    .map((e) => `${e.nazwa}: ${dane.lejek.deale.filter((d) => d.status === "lost" && d.etap_id === e.id).length}`)
    .join(", ");
  const system = pl
    ? "Jesteś Bruno, trenerem sprzedaży AI. Piszesz krótki raport miesięczny dla szefa sprzedaży. Prosto, konkretnie, liczby zamiast przymiotników, bez żargonu. Odpowiadasz WYŁĄCZNIE poprawnym JSON."
    : "You are Bruno, an AI sales coach. You write a short monthly report for a sales manager. Plain, concrete, numbers over adjectives, no jargon. Reply ONLY with valid JSON.";
  const user = [
    pl ? `Firma: ${dane.firma.nazwa}. Okres: ${dane.od} do ${dane.do}. Etapy lejka: ${etapy}. Przegrane deale zespołu per etap: ${przegranePoEtapie}.` : `Company: ${dane.firma.nazwa}. Period: ${dane.od} to ${dane.do}. Pipeline stages: ${etapy}. Team lost deals per stage: ${przegranePoEtapie}.`,
    pl ? `Handlowcy:\n${tabela}` : `Reps:\n${tabela}`,
    pl
      ? `Zwróć JSON: {"podsumowanie": "2-3 zdania o zespole", "poprawa": [{"kto": "imię", "co": "co się poprawiło, z liczbą"}], "traci": [{"kto": "imię", "gdzie": "etap", "ile": "liczba przegranych i wartość"}], "zalecenia": ["3 konkretne zalecenia dla szefa, każde zaczyna się od czasownika"]}. Maks. 4 pozycje w poprawa i traci, dokładnie 3 zalecenia.`
      : `Return JSON: {"podsumowanie": "2-3 sentences about the team", "poprawa": [{"kto": "name", "co": "what improved, with a number"}], "traci": [{"kto": "name", "gdzie": "stage", "ile": "lost count and value"}], "zalecenia": ["3 concrete recommendations for the manager, each starting with a verb"]}. Max 4 items in poprawa and traci, exactly 3 zalecenia.`,
  ].join("\n\n");
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // 4.11: pierwszy test na produkcji uciął JSON przy 1500 tokenach → 4000 + jedna ponowna próba przy złym JSON.
  let r: Omit<Raport, "miesiac"> | null = null;
  let ostatniBlad = "";
  for (let proba = 0; proba < 2 && !r; proba++) {
    const odp = await klient.messages.create({ model: MODEL, max_tokens: 4000, system, messages: [{ role: "user", content: proba ? `${user}\n\nPoprzednia odpowiedź nie była poprawnym JSON (${ostatniBlad}). Odpowiedz krócej, samym JSON.` : user }] });
    const tekst = odp.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
    const json = tekst.slice(tekst.indexOf("{"), tekst.lastIndexOf("}") + 1);
    try {
      r = JSON.parse(json) as Omit<Raport, "miesiac">;
    } catch (e) {
      ostatniBlad = String((e as Error)?.message ?? e).slice(0, 120);
      console.error("[bruno raport] zły JSON", ostatniBlad, odp.stop_reason);
    }
  }
  if (!r) throw new Error(`Raport: model nie zwrócił poprawnego JSON (${ostatniBlad}).`);
  const tresc: Raport = { miesiac, podsumowanie: String(r.podsumowanie ?? ""), poprawa: (r.poprawa ?? []).slice(0, 4), traci: (r.traci ?? []).slice(0, 4), zalecenia: (r.zalecenia ?? []).slice(0, 3) };
  const { data, error } = await supabaseAdmin.from("bruno_raporty").insert({ firma_id: dane.firma.id, miesiac, tresc, model: MODEL, autor_email: autor }).select("*").single();
  if (error) throw new Error(`bruno_raporty: ${error.message}`);
  return data as RaportWiersz;
}
