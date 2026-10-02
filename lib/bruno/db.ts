import { supabaseAdmin } from "@/lib/supabase";
import { listaObiekcji } from "./obiekcje";

export { listaObiekcji };

// Dostęp do tabel bruno_* (Supabase jakubchodakowski-com, założone 30.09).

/** Jedna rozmowa treningowa: 3 minuty (USER_001 1.10, 5 min to za dużo), twarde odcięcie w przeglądarce i na serwerze. */
export const ROZMOWA_SEKUND = 180;
/** Zapas na łączenie i pożegnanie: powyżej tego serwer i tak liczy tylko tyle. */
export const ROZMOWA_SEKUND_MAX = ROZMOWA_SEKUND + 30;
/** Plan dnia: 3 rozmowy (USER_001 30.09). Per konto nadpisuje to `bruno_konta.rozmow_dziennie`. */
export const ROZMOW_DZIENNIE = 3;
export function limitDzienny(konto: Pick<Konto, "rozmow_dziennie"> | null | undefined): number {
  const n = Number(konto?.rozmow_dziennie);
  return Number.isFinite(n) && n > 0 ? n : ROZMOW_DZIENNIE;
}
/** Fiszki w Treningu: 5 dziennie, twardy limit na serwerze (USER_001 2.10). */
export const FISZEK_DZIENNIE = 5;
export function limitFiszek(konto: Pick<Konto, "fiszek_dziennie"> | null | undefined): number {
  const n = Number(konto?.fiszek_dziennie);
  return Number.isFinite(n) && n > 0 ? n : FISZEK_DZIENNIE;
}

export type Konto = {
  email: string;
  imie: string | null;
  firma: string | null;
  start_dostepu: string | null;
  dni: number;
  limit_sekund: number;
  aktywne: boolean;
  /** Limit rozmów dziennie per konto (2.10). Domyślnie ROZMOW_DZIENNIE = 3; USER_001 ma 30. */
  rozmow_dziennie?: number | null;
  /** Limit fiszek dziennie per konto (2.10). Domyślnie FISZEK_DZIENNIE = 5; USER_001 ma 50. */
  fiszek_dziennie?: number | null;
  /** Film oprowadzający obejrzany/pominięty (2.10). Puste = pokaż popup na panelu. */
  tour_obejrzany_at?: string | null;
  /** Skrót scrypt stałego kodu logowania (sól:skrót). Nigdy nie wychodzi poza serwer. */
  kod_hash: string | null;
  nieudane: number | null;
  blokada_do: string | null;
};

export type Konfig = {
  email: string;
  produkt: string;
  klient: string;
  obiekcje: string;
  udana_rozmowa: string;
  skrypt: string;
  postac: string;
  godzina_przypomnienia: number;
};

export type Wypowiedz = { rola: "handlowiec" | "klient"; tekst: string; t: number };

export type Kryterium = {
  nazwa: "otwarcie" | "pytania" | "obiekcje" | "zamkniecie" | "pewnosc";
  ocena: number;
  cytat: string;
  czas: string;
  komentarz: string;
};

export type Feedback = {
  ocena: number;
  kryteria: Kryterium[];
  liczba_z_audio: string;
  wygrana: string;
  poprawka: string;
  najslabsze: Kryterium["nazwa"];
  obiekcje_ocena?: { obiekcja: string; ocena: number }[];
  reguly?: string[];
  /** Od 2.10: punkty do widoku PLUSY / MINUSY. Starsze feedbacki ich nie mają (widok liczy je z kryteriów). */
  plusy?: string[];
  minusy?: string[];
};

export type Rozmowa = {
  id: string;
  email: string;
  postac: string | null;
  karta_id: string | null;
  start: string;
  koniec: string | null;
  sekundy: number | null;
  transkrypcja: Wypowiedz[] | null;
  metryki: Record<string, unknown> | null;
  feedback: Feedback | null;
  ocena: number | null;
  nagranie_sciezka: string | null;
  status: "trwa" | "zakonczona" | "przerwana";
  /** Od 2.10: tryb (cold/zywo/online), cel, własny cel, obiekcja wybrana przed rozmową. */
  tryb?: string | null;
  cel?: string | null;
  cel_wlasny?: string | null;
  obiekcja?: string | null;
  /** Od 2.10: powtarzalny egzamin (patrz lib/bruno/scenariusze.ts). Łączy rozmowy o tym samym wsadzie z kreatora. */
  scenariusz_id?: string | null;
};

export type Karta = {
  id: string;
  email: string;
  /** kryterium = umiejętność (do Testu), obiekcja / poprawka / wiedza = fiszki w Treningu (2.10). */
  typ: "kryterium" | "obiekcja" | "poprawka" | "wiedza";
  tresc: string;
  pytanie?: string | null;
  wzor?: string | null;
  kategoria?: string | null;
  zrodlo?: string | null;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  learning_steps: number;
  last_review: string | null;
};

export async function pobierzKonto(email: string): Promise<Konto | null> {
  const { data } = await supabaseAdmin.from("bruno_konta").select("*").eq("email", email).maybeSingle();
  return (data as Konto | null) ?? null;
}

export type StanDostepu = { aktywny: boolean; koniec: Date | null; dniZostalo: number; powod?: string };

/** Dostęp = 7 dni od PIERWSZEGO logowania (USER_001 30.09). Przed logowaniem konto czeka. */
export function stanDostepu(konto: Konto | null): StanDostepu {
  if (!konto || !konto.aktywne) return { aktywny: false, koniec: null, dniZostalo: 0, powod: "brak konta" };
  if (!konto.start_dostepu) return { aktywny: true, koniec: null, dniZostalo: konto.dni };
  const koniec = new Date(new Date(konto.start_dostepu).getTime() + konto.dni * 86_400_000);
  const ms = koniec.getTime() - Date.now();
  return {
    aktywny: ms > 0,
    koniec,
    dniZostalo: Math.max(0, Math.ceil(ms / 86_400_000)),
    powod: ms > 0 ? undefined : "dostęp wygasł",
  };
}

/** Początek dzisiejszego dnia w Polsce, jako ISO. Plan dnia liczy się po polsku, nie po UTC. */
export function poczatekDniaPL(): string {
  const teraz = new Date();
  const pl = new Date(teraz.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
  const przesuniecie = teraz.getTime() - pl.getTime();
  pl.setHours(0, 0, 0, 0);
  return new Date(pl.getTime() + przesuniecie).toISOString();
}

/**
 * Zużyte sekundy w całym teście. Rozmowy w toku liczą się od startu do teraz,
 * z sufitem ROZMOWA_SEKUND_MAX, żeby przerwane połączenie nie zjadło limitu.
 */
export async function zuzyteSekundy(email: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("start, sekundy, status")
    .eq("email", email);
  let suma = 0;
  for (const r of data ?? []) {
    if (r.status === "trwa") {
      const trwa = (Date.now() - new Date(r.start).getTime()) / 1000;
      suma += Math.min(Math.max(0, trwa), ROZMOWA_SEKUND_MAX);
    } else {
      suma += Math.min(r.sekundy ?? 0, ROZMOWA_SEKUND_MAX);
    }
  }
  return Math.round(suma);
}

/**
 * Rozmowy „trwa" starsze niż 2× limit = porzucone (zamknięta karta, błąd przy
 * kończeniu). Oznaczamy „przerwana", żeby nie liczyły się do planu dnia
 * i nie wisiały w historii jako „w toku" (1.10).
 */
export async function zamknijPorzucone(email: string): Promise<void> {
  const granica = new Date(Date.now() - ROZMOWA_SEKUND_MAX * 2 * 1000).toISOString();
  await supabaseAdmin
    .from("bruno_rozmowy")
    .update({ status: "przerwana", koniec: new Date().toISOString() })
    .eq("email", email)
    .eq("status", "trwa")
    .lt("start", granica);
}

export async function rozmowyDzis(email: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("start", poczatekDniaPL())
    .neq("status", "przerwana");
  return count ?? 0;
}

export async function pobierzKonfig(email: string): Promise<Konfig> {
  const { data } = await supabaseAdmin.from("bruno_konfig").select("*").eq("email", email).maybeSingle();
  return (
    (data as Konfig | null) ?? {
      email,
      produkt: "",
      klient: "",
      obiekcje: "",
      udana_rozmowa: "",
      skrypt: "",
      postac: "czerwony",
      godzina_przypomnienia: 8,
    }
  );
}

export async function pobierzRozmowy(email: string, limit = 50): Promise<Rozmowa[]> {
  const { data } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("id, email, postac, karta_id, start, koniec, sekundy, ocena, status, feedback, nagranie_sciezka, tryb, cel, cel_wlasny, obiekcja")
    .eq("email", email)
    .order("start", { ascending: false })
    .limit(limit);
  return (data as Rozmowa[]) ?? [];
}

export async function pobierzRozmowe(email: string, id: string): Promise<Rozmowa | null> {
  const { data } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("*")
    .eq("email", email)
    .eq("id", id)
    .maybeSingle();
  return (data as Rozmowa | null) ?? null;
}

export async function kartyDoPowtorki(email: string, limit = 10): Promise<Karta[]> {
  const { data } = await supabaseAdmin
    .from("bruno_karty")
    .select("*")
    .eq("email", email)
    .lte("due", new Date().toISOString())
    .order("due", { ascending: true })
    .limit(limit);
  return (data as Karta[]) ?? [];
}

export async function wszystkieKarty(email: string): Promise<Karta[]> {
  const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).order("due");
  return (data as Karta[]) ?? [];
}

