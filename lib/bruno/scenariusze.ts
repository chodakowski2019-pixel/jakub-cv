import { supabaseAdmin } from "@/lib/supabase";
import { CELE, POSTACIE, TRYBY, celLubDomyslny, postacLubDomyslna, trybLubDomyslny, type CelId, type PostacId, type TrybId } from "./postacie";

// SCENARIUSZE (2.10). Problem: ta sama konfiguracja kreatora dawała co rozmowę
// inny przebieg, więc ocen z dwóch rozmów nie można było porównać, a produkt
// sprzedaje POSTĘP handlowca. Scenariusz = powtarzalny egzamin: tryb + typ
// klienta + cel + obiekcje. Powstaje SAM z wyborów w kreatorze (podpis), więc
// nie ma nowego ekranu do wypełniania. Rozmowa wskazuje scenariusz, a
// Statystyki pokazują „ten sam egzamin: pierwsza ocena → ostatnia".

export type Scenariusz = {
  id: string;
  email: string;
  podpis: string;
  nazwa: string;
  tryb: string;
  postac: string;
  cel: string;
  cel_wlasny: string | null;
  obiekcje: string[];
  utworzono: string;
};

export type DaneScenariusza = {
  tryb: TrybId;
  postac: PostacId;
  cel: CelId;
  celWlasny?: string | null;
  obiekcje: string[];
};

/** Podpis = tożsamość scenariusza. Kolejność obiekcji i wielkość liter nie tworzą nowego egzaminu. */
export function podpisScenariusza(d: DaneScenariusza): string {
  const obiekcje = [...d.obiekcje].map((o) => o.trim().toLowerCase()).filter(Boolean).sort();
  const cel = d.cel === "wlasny" ? `wlasny:${(d.celWlasny ?? "").trim().toLowerCase()}` : d.cel;
  return [d.tryb, d.postac, cel, obiekcje.join("|")].join("::");
}

/** Nazwa dla człowieka, widoczna w Statystykach. */
export function nazwaScenariusza(d: DaneScenariusza): string {
  const cel = d.cel === "wlasny" && d.celWlasny?.trim() ? d.celWlasny.trim() : CELE[d.cel].nazwa.toLowerCase();
  const czesci = [TRYBY[d.tryb].nazwa, `klient ${POSTACIE[d.postac].krotko}`, cel];
  if (d.obiekcje.length) czesci.push(d.obiekcje.length === 1 ? `obiekcja: „${d.obiekcje[0]}”` : `${d.obiekcje.length} obiekcje`);
  return czesci.join(" · ");
}

/** Znajduje scenariusz o tym podpisie albo zakłada nowy. Zwraca id albo null, gdy zapis padnie (rozmowa i tak ma się odbyć). */
export async function zapewnijScenariusz(email: string, d: DaneScenariusza): Promise<string | null> {
  const podpis = podpisScenariusza(d);
  try {
    const { data: istnieje } = await supabaseAdmin
      .from("bruno_scenariusze")
      .select("id")
      .eq("email", email)
      .eq("podpis", podpis)
      .maybeSingle();
    if (istnieje?.id) return istnieje.id as string;

    const { data, error } = await supabaseAdmin
      .from("bruno_scenariusze")
      .insert({
        email,
        podpis,
        nazwa: nazwaScenariusza(d),
        tryb: d.tryb,
        postac: d.postac,
        cel: d.cel,
        cel_wlasny: d.celWlasny ?? null,
        obiekcje: d.obiekcje,
      })
      .select("id")
      .single();
    // Wyścig dwóch rozmów naraz: unikalny indeks (email, podpis) wygrywa, więc dociągamy istniejący.
    if (error) {
      const { data: po } = await supabaseAdmin.from("bruno_scenariusze").select("id").eq("email", email).eq("podpis", podpis).maybeSingle();
      return (po?.id as string) ?? null;
    }
    return (data?.id as string) ?? null;
  } catch (e) {
    console.error("[bruno scenariusz]", e);
    return null;
  }
}

export type PostepScenariusza = {
  id: string;
  nazwa: string;
  tryb: string;
  postac: string;
  proby: number;
  pierwsza: number;
  ostatnia: number;
  najlepsza: number;
  zmiana: number;
};

/**
 * Postęp per scenariusz: tylko ocenione rozmowy, tylko scenariusze z co najmniej
 * dwiema próbami (jedna próba nie pokazuje postępu, pokazuje wynik).
 */
export async function postepScenariuszy(email: string): Promise<PostepScenariusza[]> {
  const { data: rozmowy } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("scenariusz_id, ocena, start")
    .eq("email", email)
    .eq("status", "zakonczona")
    .not("scenariusz_id", "is", null)
    .not("ocena", "is", null)
    .order("start", { ascending: true });
  if (!rozmowy?.length) return [];

  const { data: scenariusze } = await supabaseAdmin.from("bruno_scenariusze").select("*").eq("email", email);
  const wg = new Map((scenariusze ?? []).map((s) => [s.id as string, s as Scenariusz]));

  const grupy = new Map<string, number[]>();
  for (const r of rozmowy) {
    const id = r.scenariusz_id as string;
    if (!grupy.has(id)) grupy.set(id, []);
    grupy.get(id)!.push(Number(r.ocena));
  }

  const wynik: PostepScenariusza[] = [];
  for (const [id, oceny] of grupy) {
    if (oceny.length < 2) continue;
    const s = wg.get(id);
    const pierwsza = oceny[0];
    const ostatnia = oceny[oceny.length - 1];
    wynik.push({
      id,
      nazwa: s?.nazwa ?? "scenariusz",
      tryb: s?.tryb ?? "",
      postac: s?.postac ?? "",
      proby: oceny.length,
      pierwsza,
      ostatnia,
      najlepsza: Math.max(...oceny),
      zmiana: ostatnia - pierwsza,
    });
  }
  return wynik.sort((a, b) => b.proby - a.proby);
}

/** Pomocnik dla widoków: scenariusz rozmowy bez drugiego zapytania w pętli. */
export function zbierzDane(r: { tryb?: string | null; postac?: string | null; cel?: string | null; cel_wlasny?: string | null; obiekcja?: string | null }): DaneScenariusza {
  return {
    tryb: trybLubDomyslny(r.tryb),
    postac: postacLubDomyslna(r.postac),
    cel: celLubDomyslny(r.cel),
    celWlasny: r.cel_wlasny ?? null,
    obiekcje: r.obiekcja ? r.obiekcja.split(" · ").map((o) => o.trim()).filter(Boolean) : [],
  };
}
