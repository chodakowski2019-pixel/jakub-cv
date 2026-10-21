import { supabaseAdmin } from "@/lib/supabase";
import { ANKIETA_DNI, OBSZARY_WYNIK, policz, type Odpowiedzi } from "./ankieta";

// 21.10 (USER_001): zapis i odczyt ankiety Mazura (tabela bruno_ankiety, SQL: sql/2026-10-21-ankieta-mazur.sql).

export type AnkietaWiersz = {
  id: number;
  utworzono: string;
  email: string;
  jezyk: string;
  odpowiedzi: Odpowiedzi;
  wynik: number;
  obszary: Record<(typeof OBSZARY_WYNIK)[number], number>;
};

/** Ostatnie wypełnienia konta, najnowsze pierwsze. */
export async function ankietyKonta(email: string, ile = 2): Promise<AnkietaWiersz[]> {
  const { data, error } = await supabaseAdmin.from("bruno_ankiety").select("*").eq("email", email).order("utworzono", { ascending: false }).limit(ile);
  if (error) {
    console.error("[bruno ankieta] odczyt", error.message);
    return [];
  }
  return (data ?? []) as AnkietaWiersz[];
}

/**
 * Czy panel ma najpierw pokazać ankietę: brak wypełnienia albo ostatnie starsze niż 30 dni.
 * Konto demo (B2B, 1 rozmowa) = szef firmy testuje Bruno, nie handlowiec: bez ankiety.
 * Błąd bazy (np. brak tabeli) = nie blokujemy panelu.
 */
export async function ankietaWymagana(email: string, demo: boolean): Promise<boolean> {
  if (demo) return false;
  const { data, error } = await supabaseAdmin.from("bruno_ankiety").select("utworzono").eq("email", email).order("utworzono", { ascending: false }).limit(1);
  if (error) {
    console.error("[bruno ankieta] blokada", error.message);
    return false;
  }
  const ost = data?.[0]?.utworzono as string | undefined;
  if (!ost) return true;
  return Date.now() - new Date(ost).getTime() > ANKIETA_DNI * 24 * 3600 * 1000;
}

export async function zapiszAnkiete(email: string, jezyk: string, odpowiedzi: Odpowiedzi): Promise<{ ok: true } | { ok: false; blad: string }> {
  const { wynik, obszary } = policz(odpowiedzi);
  const { error } = await supabaseAdmin.from("bruno_ankiety").insert({ email, jezyk, odpowiedzi, wynik, obszary });
  if (error) {
    console.error("[bruno ankieta] zapis", error.message);
    return { ok: false, blad: error.message };
  }
  return { ok: true };
}
