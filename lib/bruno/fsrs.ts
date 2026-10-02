import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";
import { supabaseAdmin } from "@/lib/supabase";
import type { Feedback, Karta, Konfig, Kryterium } from "./db";
import { listaObiekcji } from "./db";
import { WIEDZA } from "./wiedza";

// Harmonogram powtórek (decyzja 26.09: FSRS, ten sam algorytm co Anki od 2023).
// Karta = jedna obiekcja z „Dostosuj Bruno" albo jedno z 5 kryteriów rubryki.
// Po każdej rozmowie ocena kryterium (1-10) i obiekcji (1-4) zamienia się na
// ocenę FSRS: znowu / trudno / dobrze / łatwo. FSRS mówi, kiedy karta wraca.

const f = fsrs({ enable_fuzz: false });

export const KRYTERIA: Kryterium["nazwa"][] = ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"];

function naKarteFsrs(k: Karta): Card {
  return {
    due: new Date(k.due),
    stability: k.stability,
    difficulty: k.difficulty,
    elapsed_days: k.elapsed_days,
    scheduled_days: k.scheduled_days,
    reps: k.reps,
    lapses: k.lapses,
    state: k.state,
    learning_steps: k.learning_steps ?? 0,
    last_review: k.last_review ? new Date(k.last_review) : undefined,
  };
}

function naWiersz(c: Card) {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    learning_steps: c.learning_steps ?? 0,
    last_review: c.last_review ? c.last_review.toISOString() : null,
  };
}

/** 1-10 (kryterium) → ocena FSRS. */
export function ocenaKryteriumNaGrade(ocena: number): Grade {
  if (ocena <= 3) return Rating.Again;
  if (ocena <= 5) return Rating.Hard;
  if (ocena <= 8) return Rating.Good;
  return Rating.Easy;
}

/** 1-4 (obiekcja) → ocena FSRS. */
export function ocenaObiekcjiNaGrade(ocena: number): Grade {
  return ([Rating.Again, Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Grade[])[Math.min(4, Math.max(1, ocena))];
}

/**
 * Dba, żeby każda obiekcja z konfiguracji i każde kryterium miały kartę.
 * Wołane przy zapisie „Dostosuj Bruno" i przed każdą rozmową.
 */
export async function zapewnijKarty(email: string, konfig: Konfig): Promise<void> {
  const { data } = await supabaseAdmin.from("bruno_karty").select("typ, tresc").eq("email", email);
  const istnieja = new Set((data ?? []).map((k) => `${k.typ}:${k.tresc}`));
  const nowe: { email: string; typ: string; tresc: string; pytanie?: string; wzor?: string; kategoria?: string }[] = [];
  for (const k of KRYTERIA) if (!istnieja.has(`kryterium:${k}`)) nowe.push({ email, typ: "kryterium", tresc: k });
  for (const o of listaObiekcji(konfig.obiekcje)) if (!istnieja.has(`obiekcja:${o}`)) nowe.push({ email, typ: "obiekcja", tresc: o });
  // Stała talia wiedzy (2.10): typy klientów + techniki. Dokładana każdemu kontu raz.
  for (const w of WIEDZA) if (!istnieja.has(`wiedza:${w.tresc}`)) nowe.push({ email, typ: "wiedza", tresc: w.tresc, pytanie: w.pytanie, wzor: w.wzor, kategoria: w.kategoria });
  if (nowe.length) {
    const pusta = naWiersz(createEmptyCard(new Date()));
    const { error } = await supabaseAdmin.from("bruno_karty").insert(nowe.map((n) => ({ ...n, ...pusta })));
    if (error) console.error("bruno_karty insert", error.code, error.message);
  }
}

/**
 * Karty „do poprawy" z feedbacku po rozmowie (USER_001 2.10): każdy minus =
 * fiszka z sytuacją z TEJ rozmowy i wzorem od trenera. Max 3 na rozmowę, bez duplikatów treści.
 */
export async function dodajKartyPoprawek(email: string, karty: { tresc: string; pytanie: string; wzor: string }[], zrodlo: string): Promise<number> {
  if (!karty.length) return 0;
  const { data } = await supabaseAdmin.from("bruno_karty").select("tresc").eq("email", email).eq("typ", "poprawka");
  const istnieja = new Set((data ?? []).map((k) => k.tresc.toLowerCase()));
  const pusta = naWiersz(createEmptyCard(new Date()));
  const nowe = karty
    .filter((k) => k.tresc.trim() && k.pytanie.trim() && k.wzor.trim() && !istnieja.has(k.tresc.trim().toLowerCase()))
    .slice(0, 3)
    .map((k) => ({ email, typ: "poprawka", tresc: k.tresc.trim().slice(0, 80), pytanie: k.pytanie.trim().slice(0, 500), wzor: k.wzor.trim().slice(0, 600), kategoria: "rozmowa", zrodlo, ...pusta }));
  if (!nowe.length) return 0;
  const { error } = await supabaseAdmin.from("bruno_karty").insert(nowe);
  if (error) {
    console.error("bruno_karty poprawki", error.code, error.message);
    return 0;
  }
  return nowe.length;
}

/** Jedna karta, jedna ocena FSRS (fiszki w „Trening", 2.10). Zwraca nową datę powrotu albo null. */
export async function ocenKarte(email: string, kartaId: string, grade: Grade): Promise<Date | null> {
  const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).eq("id", kartaId).maybeSingle();
  if (!data) return null;
  const wynik = f.next(naKarteFsrs(data as Karta), new Date(), grade);
  const { error } = await supabaseAdmin.from("bruno_karty").update(naWiersz(wynik.card)).eq("id", kartaId);
  if (error) {
    console.error("bruno_karty update", error.code, error.message);
    return null;
  }
  return wynik.card.due;
}

/** Po feedbacku: ocenia karty kryteriów i obiekcji, które padły. Zwraca liczbę zaktualizowanych. */
export async function zaktualizujKarty(email: string, feedback: Feedback): Promise<number> {
  const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email);
  const karty = (data as Karta[]) ?? [];
  const teraz = new Date();
  let n = 0;

  const ocen = async (k: Karta, grade: Grade) => {
    const wynik = f.next(naKarteFsrs(k), teraz, grade);
    const { error } = await supabaseAdmin.from("bruno_karty").update(naWiersz(wynik.card)).eq("id", k.id);
    if (error) console.error("bruno_karty update", error.code, error.message);
    else n++;
  };

  for (const kr of feedback.kryteria) {
    const k = karty.find((x) => x.typ === "kryterium" && x.tresc === kr.nazwa);
    if (k) await ocen(k, ocenaKryteriumNaGrade(kr.ocena));
  }
  for (const o of feedback.obiekcje_ocena ?? []) {
    const cel = o.obiekcja.trim().toLowerCase();
    const k = karty.find(
      (x) => x.typ === "obiekcja" && (x.tresc.toLowerCase() === cel || x.tresc.toLowerCase().includes(cel) || cel.includes(x.tresc.toLowerCase())),
    );
    if (k) await ocen(k, ocenaObiekcjiNaGrade(o.ocena));
  }
  return n;
}
