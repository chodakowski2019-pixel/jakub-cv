import { supabaseAdmin } from "@/lib/supabase";

// Log wejść do Bruno (9.10, E18): każde logowanie i każde wejście z linku w mailu
// (`?src=mail-<rodzaj>`). Odpowiada na pytanie USER_001 „czy Aleksandra wchodzi
// z naszych maili i czy przypomnienia działają". Błąd zapisu nie przerywa niczego.

export type RodzajWejscia = "logowanie" | "wejscie";

/** Źródło z adresu: tylko bezpieczny, krótki token (`mail-przypomnienie`, `mail-dostep`, …). */
export function zrodloZParametru(src: string | string[] | undefined | null): string | null {
  const s = Array.isArray(src) ? src[0] : src;
  if (!s) return null;
  const czyste = s.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return czyste || null;
}

export async function zapiszWejscie(w: { email: string; rodzaj: RodzajWejscia; zrodlo?: string | null; agent?: string | null }) {
  try {
    const { error } = await supabaseAdmin.from("bruno_wejscia").insert({
      email: w.email,
      rodzaj: w.rodzaj,
      zrodlo: w.zrodlo ?? null,
      agent: w.agent ? w.agent.slice(0, 160) : null,
    });
    if (error) console.error("[bruno wejscia]", error.message);
  } catch (e) {
    console.error("[bruno wejscia]", e);
  }
}
