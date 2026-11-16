import { supabaseAdmin } from "@/lib/supabase";
import type { Feedback, Konfig } from "@/lib/bruno/db";
import { audioRozmowyEl } from "@/lib/bruno/elevenlabs";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import type { CelId, PostacId, PoziomId, TrybId } from "@/lib/bruno/postacie";

// 16.11 (USER_001): zakładka „Nagraj rozmowę” w panelu handlowca giełdy. 3 rozmowy sprzedażowe z Bruno po 3 minuty,
// te same 3 scenariusze dla każdego handlowca, żeby firma mogła porównać dwie osoby. Nagranie i ocena trafiają do firm,
// które odblokowały kontakt. Tabela praca_rozmowy_testowe (lib/bruno/sql/2026-11-16-praca-rozmowy-testowe.sql).
// Koszt: 0,10 $ / min głosu (rachunek ElevenLabs 6.10) → 3 × 3 min = 0,90 $ na handlowca + ocena trenera.

export const ROZMOW_TESTOWYCH = 3;
/** 16.11 (USER_001: „dodaj tę zakładkę tylko u mnie, tam dopracuję”): zakładka widoczna tylko dla tych kont, każdego typu. */
const KONTA_NAGRAJ = ["chodak.job72@gmail.com"];
export const mozeNagrywac = (email: string | null | undefined) => KONTA_NAGRAJ.includes((email ?? "").toLowerCase());
/** Twarda długość rozmowy testowej. Bez dogrywki: firma dostaje 3 nagrania tej samej długości. */
export const SEKUND_TESTU = 180;
/** Sufit czasu po stronie serwera (opóźnienie rozłączenia). */
export const SEKUND_TESTU_MAX = SEKUND_TESTU + 15;
/** Ile razy handlowiec może w ogóle wystartować rozmowę (3 + 2 zapasowe na kłopoty z mikrofonem) = sufit kosztu 15 min. */
export const STARTOW_MAX = 5;

/** To samo dla każdego handlowca: produkt i klient z karty zadania. Zmiana = te dwa teksty. */
export const PRODUKT_TESTU = "Program do faktur i magazynu dla małych firm. Abonament 149 zł netto za miesiąc, bez umowy na czas określony, wdrożenie w 1 dzień, 30 dni na zwrot pieniędzy.";
export const KLIENT_TESTU = "Właściciel hurtowni budowlanej, 8 pracowników. Faktury wystawia w starym programie, magazyn liczy w Excelu.";

export type ScenariuszTestu = { nr: number; tytul: string; zadanie: string; tryb: TrybId; cel: CelId; postac: PostacId; poziom: PoziomId; obiekcja: string };

export const SCENARIUSZE_TESTU: ScenariuszTestu[] = [
  { nr: 1, tytul: "Pierwszy telefon", zadanie: "Dzwonisz pierwszy raz do właściciela hurtowni. Nie zna Cię. Umów 20 minut spotkania.", tryb: "cold", cel: "spotkanie", postac: "czerwony", poziom: "sredni", obiekcja: "Nie mam czasu, proszę wysłać ofertę mailem" },
  { nr: 2, tytul: "Za drogo", zadanie: "Spotkanie na żywo. Klient zna ofertę i mówi, że jest za droga. Doprowadź do sprzedaży.", tryb: "zywo", cel: "sprzedaz", postac: "niebieski", poziom: "sredni", obiekcja: "Za drogo, konkurencja ma to samo za 89 zł" },
  { nr: 3, tytul: "Muszę się zastanowić", zadanie: "Spotkanie online po prezentacji. Klient odkłada decyzję. Uzyskaj decyzję albo następny krok z datą.", tryb: "online", cel: "decyzja", postac: "zielony", poziom: "sredni", obiekcja: "Muszę się zastanowić i porozmawiać ze wspólnikiem" },
];

/** Konfiguracja Bruno na rozmowę testową (handlowiec giełdy nie ma własnego „Dostosuj Bruno”). */
export function konfigTestu(s: ScenariuszTestu): Konfig {
  return { email: "", produkt: PRODUKT_TESTU, klient: KLIENT_TESTU, obiekcje: SCENARIUSZE_TESTU.map((x) => x.obiekcja).join("\n"), udana_rozmowa: "", skrypt: "", postac: s.postac, godzina_przypomnienia: 0, etap: s.tryb === "cold" ? "cold" : "oferta", rejestr: "pan", glos: "m", segment: "b2b" };
}

type Wiersz = { id: string; konto_id: string; nr: number; status: string; start: string; sekundy: number | null; feedback: Feedback | null; ocena: number | null; nagranie_sciezka: string | null; el_conversation_id: string | null };
const POLA = "id,konto_id,nr,status,start,sekundy,feedback,ocena,nagranie_sciezka,el_conversation_id";

/** Stan handlowca: które rozmowy ma zaliczone i czy może wystartować kolejną. */
export async function stanTestu(kontoId: string): Promise<{ zaliczone: number[]; startow: number; nastepna: ScenariuszTestu | null }> {
  const { data } = await supabaseAdmin.from("praca_rozmowy_testowe").select("nr,status").eq("konto_id", kontoId);
  const zaliczone = [...new Set((data ?? []).filter((x) => x.status === "zakonczona").map((x) => x.nr as number))].sort();
  const startow = (data ?? []).length;
  const wolny = SCENARIUSZE_TESTU.find((s) => !zaliczone.includes(s.nr)) ?? null;
  return { zaliczone, startow, nastepna: startow >= STARTOW_MAX ? null : wolny };
}

/** Ściąga nagranie z konta ElevenLabs do naszego kubełka (plik bywa gotowy kilka sekund po rozłączeniu). */
export async function sciagnijNagranieTestu(a: { id: string; kontoId: string; elId: string; proby?: number }): Promise<string | null> {
  for (let i = 0; i < (a.proby ?? 1); i += 1) {
    if (i > 0) await new Promise((r) => setTimeout(r, 4000));
    try {
      const audio = await audioRozmowyEl(a.elId);
      if (!audio) continue;
      const sciezka = `gielda/${a.kontoId}/${a.id}.mp3`;
      const { error } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).upload(sciezka, audio.bajty, { contentType: audio.typ, upsert: true });
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("praca_rozmowy_testowe").update({ nagranie_sciezka: sciezka }).eq("id", a.id);
      return sciezka;
    } catch (e) {
      console.error("[praca rozmowa testowa] nagranie", a.id, e);
    }
  }
  return null;
}

export type RozmowaTestowa = { nr: number; tytul: string; zadanie: string; kiedy: string; sekundy: number; ocena: number | null; wygrana: string; poprawka: string; /** Link do mp3 podpisany na godzinę albo null, gdy pliku jeszcze nie ma. */ nagranie: string | null };

/** Zaliczone rozmowy testowe handlowców (ostatnia zaliczona na każdy scenariusz), z linkami do nagrań. id konta → lista. */
export async function rozmowyTestowe(kontoIds: string[]): Promise<Record<string, RozmowaTestowa[]>> {
  if (!kontoIds.length) return {};
  const { data, error } = await supabaseAdmin.from("praca_rozmowy_testowe").select(POLA).in("konto_id", kontoIds).eq("status", "zakonczona").order("start", { ascending: false });
  if (error) console.error("[praca rozmowy testowe]", error.message);
  const wynik: Record<string, RozmowaTestowa[]> = {};
  for (const w of (data ?? []) as Wiersz[]) {
    const lista = (wynik[w.konto_id] ??= []);
    const s = SCENARIUSZE_TESTU.find((x) => x.nr === w.nr);
    if (!s || lista.some((x) => x.nr === w.nr)) continue;
    // Siatka bezpieczeństwa: plik nie zdążył się ściągnąć po rozmowie → próba przy pierwszym wyświetleniu.
    const sciezka = w.nagranie_sciezka ?? (w.el_conversation_id ? await sciagnijNagranieTestu({ id: w.id, kontoId: w.konto_id, elId: w.el_conversation_id }) : null);
    const nagranie = sciezka ? (await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUrl(sciezka, 3600)).data?.signedUrl ?? null : null;
    lista.push({ nr: w.nr, tytul: s.tytul, zadanie: s.zadanie, kiedy: w.start, sekundy: w.sekundy ?? 0, ocena: w.ocena, wygrana: w.feedback?.wygrana ?? "", poprawka: w.feedback?.poprawka ?? "", nagranie });
  }
  for (const l of Object.values(wynik)) l.sort((a, b) => a.nr - b.nr);
  return wynik;
}
