import { supabaseAdmin } from "@/lib/supabase";
import type { Feedback, Konto } from "./db";

// 2.11.2026: podpięcie Bruno do Pipedrive (poziom 1 z PLAN-100K: wynik rozmowy → CRM).
// Po każdej ocenionej rozmowie w Pipedrive firmy powstaje ZROBIONA aktywność „Trening Bruno”
// przy handlowcu (dopasowanie po e-mailu konta; brak = właściciel tokenu), z oceną,
// plusami, minusami i jedną poprawką. Szef widzi trening w tym samym miejscu, co telefony.
// Token firmy: bruno_firmy.pipedrive_token. Tylko serwer.

const API = "https://api.pipedrive.com/v1";
const NAZWA_TYPU = "Trening Bruno";

type Odp<T> = { success: boolean; data: T; error?: string };

async function pd<T>(token: string, sciezka: string, init?: RequestInit): Promise<T> {
  const sep = sciezka.includes("?") ? "&" : "?";
  const r = await fetch(`${API}${sciezka}${sep}api_token=${encodeURIComponent(token)}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const j = (await r.json().catch(() => null)) as Odp<T> | null;
  if (!r.ok || !j?.success) throw new Error(`Pipedrive ${sciezka.split("?")[0]}: ${r.status} ${j?.error ?? ""}`.trim());
  return j.data;
}

/** Użytkownik Pipedrive po e-mailu konta Bruno. Brak = null (aktywność idzie na właściciela tokenu). */
export async function uzytkownikPoEmailu(token: string, email: string): Promise<number | null> {
  const d = await pd<{ id: number; email: string }[] | null>(token, `/users/find?term=${encodeURIComponent(email)}&search_by_email=1`);
  const u = (d ?? []).find((x) => String(x.email).toLowerCase() === email.toLowerCase());
  return u?.id ?? null;
}

/** Typ aktywności „Trening Bruno”: znajdź albo załóż. Zwraca key_string. */
export async function typAktywnosci(token: string): Promise<string> {
  const typy = await pd<{ key_string: string; name: string; active_flag: boolean }[]>(token, "/activityTypes");
  const jest = typy.find((t) => t.name === NAZWA_TYPU && t.active_flag);
  if (jest) return jest.key_string;
  const nowy = await pd<{ key_string: string }>(token, "/activityTypes", {
    method: "POST",
    body: JSON.stringify({ name: NAZWA_TYPU, icon_key: "call", color: "6C5CE7" }),
  });
  return nowy.key_string;
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

/** Treść notatki w Pipedrive (HTML, bo pole `note` je przyjmuje). */
export function notatkaZFeedbacku(f: Feedback, jezyk: "pl" | "en" = "pl"): string {
  const pl = jezyk === "pl";
  const plusy = f.plusy ?? f.kryteria.filter((k) => k.ocena >= 7).map((k) => k.komentarz);
  const minusy = f.minusy ?? f.kryteria.filter((k) => k.ocena < 5).map((k) => k.komentarz);
  const lista = (t: string[]) => (t.length ? `<ul>${t.slice(0, 4).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p>-</p>");
  return [
    `<p><b>${pl ? "Ocena" : "Score"}: ${f.ocena}/10</b></p>`,
    `<p><b>${pl ? "Plusy" : "Wins"}</b></p>${lista(plusy)}`,
    `<p><b>${pl ? "Minusy" : "Misses"}</b></p>${lista(minusy)}`,
    f.poprawka ? `<p><b>${pl ? "Jedna poprawka" : "One fix"}:</b> ${esc(f.poprawka)}</p>` : "",
    `<p>${pl ? "Kryteria" : "Criteria"}: ${f.kryteria.map((k) => `${k.nazwa} ${k.ocena}`).join(", ")}</p>`,
  ].join("");
}

export type WynikDoCrm = {
  token: string;
  typ?: string | null;
  email: string;
  imie?: string | null;
  jezyk?: "pl" | "en";
  rozmowa: { id: string; start: string; sekundy: number | null; obiekcja?: string | null; postac?: string | null; poziom?: string | null };
  feedback: Feedback;
};

/** Wysyła jedną rozmowę jako zrobioną aktywność. Zwraca id aktywności i użyty key typu. */
export async function wyslijWynik(w: WynikDoCrm): Promise<{ activity_id: number; typ: string; user_id: number | null }> {
  const typ = w.typ || (await typAktywnosci(w.token));
  const user_id = await uzytkownikPoEmailu(w.token, w.email);
  const pl = (w.jezyk ?? "pl") === "pl";
  const start = new Date(w.rozmowa.start);
  const due_date = start.toISOString().slice(0, 10);
  const due_time = start.toISOString().slice(11, 16);
  const minuty = Math.max(1, Math.round((w.rozmowa.sekundy ?? 0) / 60));
  const kto = w.imie ? `${w.imie}: ` : "";
  const temat = `${kto}Bruno ${w.feedback.ocena}/10` + (w.rozmowa.obiekcja ? ` · ${w.rozmowa.obiekcja}` : "") + (w.rozmowa.poziom ? ` · ${w.rozmowa.poziom}` : "");
  const d = await pd<{ id: number }>(w.token, "/activities", {
    method: "POST",
    body: JSON.stringify({
      subject: temat.slice(0, 250),
      type: typ,
      done: 1,
      due_date,
      due_time,
      duration: `${String(Math.floor(minuty / 60)).padStart(2, "0")}:${String(minuty % 60).padStart(2, "0")}`,
      ...(user_id ? { user_id } : {}),
      note: notatkaZFeedbacku(w.feedback, pl ? "pl" : "en"),
      public_description: pl ? `Trening z Bruno AI, rozmowa ${w.rozmowa.id}` : `Bruno AI practice call ${w.rozmowa.id}`,
    }),
  });
  return { activity_id: d.id, typ, user_id };
}

/** 8.11: treść notatki treningu w CRM Bruno (zwykły tekst). */
export function notatkaTekst(f: Feedback, jezyk: "pl" | "en" = "pl"): string {
  const pl = jezyk === "pl";
  const plusy = f.plusy ?? f.kryteria.filter((k) => k.ocena >= 7).map((k) => k.komentarz);
  const minusy = f.minusy ?? f.kryteria.filter((k) => k.ocena < 5).map((k) => k.komentarz);
  return [
    `${pl ? "Ocena" : "Score"}: ${f.ocena}/10`,
    plusy.length ? `${pl ? "Plusy" : "Wins"}: ${plusy.slice(0, 4).join("; ")}` : "",
    minusy.length ? `${pl ? "Minusy" : "Misses"}: ${minusy.slice(0, 4).join("; ")}` : "",
    f.poprawka ? `${pl ? "Jedna poprawka" : "One fix"}: ${f.poprawka}` : "",
    `${pl ? "Kryteria" : "Criteria"}: ${f.kryteria.map((k) => `${k.nazwa} ${k.ocena}`).join(", ")}`,
  ].filter(Boolean).join("\n");
}

/**
 * Hak po ocenie rozmowy (`/api/bruno/rozmowa/koniec`). 8.11 (USER_001: CRM Bruno = główna baza): wynik idzie jako
 * zrobione zadanie „trening” do CRM Bruno (przy kliencie, jeśli trening był z klienta). Do Pipedrive już NIE
 * (Pipedrive = tylko import). Nigdy nie rzuca: błąd trafia do metryk rozmowy (`crm_blad`).
 */
export async function wyslijWynikDoCrm(konto: Konto | null, rozmowa: WynikDoCrm["rozmowa"] & { klient_id?: number | null }, feedback: Feedback): Promise<void> {
  if (!konto?.firma_id) return;
  const { data: firma } = await supabaseAdmin.from("bruno_firmy").select("id, jezyk").eq("id", konto.firma_id).maybeSingle();
  if (!firma) return;
  const metryki = async (zmiana: Record<string, unknown>) => {
    const { data: r } = await supabaseAdmin.from("bruno_rozmowy").select("metryki").eq("id", rozmowa.id).maybeSingle();
    await supabaseAdmin.from("bruno_rozmowy").update({ metryki: { ...((r?.metryki as Record<string, unknown>) ?? {}), ...zmiana } }).eq("id", rozmowa.id);
  };
  try {
    const { zapiszTreningCrm } = await import("./crm");
    const kto = konto.imie ? `${konto.imie}: ` : "";
    const temat = `${kto}Bruno ${feedback.ocena}/10` + (rozmowa.obiekcja ? ` · ${rozmowa.obiekcja}` : "") + (rozmowa.poziom ? ` · ${rozmowa.poziom}` : "");
    const z = await zapiszTreningCrm(firma.id, rozmowa.klient_id ?? null, { temat, notatka: notatkaTekst(feedback, firma.jezyk === "en" ? "en" : "pl"), autor: konto.email, kiedy: rozmowa.start });
    await metryki({ crm: { bruno_zdarzenie_id: z.id, klient_id: rozmowa.klient_id ?? null, kiedy: new Date().toISOString() } });
  } catch (e) {
    console.error("[bruno crm trening]", e);
    await metryki({ crm_blad: String((e as Error)?.message ?? e).slice(0, 300) });
  }
}
