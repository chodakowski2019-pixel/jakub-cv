import { supabaseAdmin } from "@/lib/supabase";
import { listaObiekcji } from "./obiekcje";
import { WIEDZA } from "./wiedza";

export { listaObiekcji };

// Dostęp do tabel bruno_* (Supabase jakubchodakowski-com, założone 30.09).

/** Jedna rozmowa treningowa: 3 minuty (USER_001 1.10, 5 min to za dużo), twarde odcięcie w przeglądarce i na serwerze. */
export const ROZMOWA_SEKUND = 180;
/**
 * Dogrywka po limicie (6.10): rozmowa nie urywa się w pół zamknięcia. Bruno dostaje sygnał
 * „czas minął", handlowiec ma jeszcze tyle sekund na prośbę o decyzję. Potem twarde odcięcie.
 */
export const DOGRYWKA_SEKUND = 45;
/** Zapas na łączenie i pożegnanie: powyżej tego serwer i tak liczy tylko tyle. */
export const ROZMOWA_SEKUND_MAX = ROZMOWA_SEKUND + DOGRYWKA_SEKUND + 30;
/** Plan dnia: 3 rozmowy (USER_001 30.09). Per konto nadpisuje to `bruno_konta.rozmow_dziennie`. */
export const ROZMOW_DZIENNIE = 3;
/** 9.10 (USER_001): konto z rejestracji B2C (plan „free”) = 3 bezpłatne rozmowy łącznie. */
export const ROZMOW_ZA_DARMO = 3;
export const PLAN_FREE = "free";
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
  /** Data założenia konta (domyślna kolumny). Liczymy od niej przypomnienia przed 1. logowaniem. */
  utworzono: string;
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
  /**
   * 9.10: „trial" (darmowy test firmy), „pelny" (płacąca firma albo Bruno Pro), „free" (rejestracja B2C, 3 rozmowy).
   * 10.10 (USER_001): B2B = plan „pelny" zakładany ręcznie po dealu; B2C = „free" → zakup Bruno Pro przez Stripe → „pelny".
   */
  plan?: "trial" | "pelny" | "free" | string | null;
  /** 10.10 (Stripe, Bruno Pro): klient i subskrypcja w Stripe, koniec opłaconego okresu. */
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  pro_do?: string | null;
};

/** Czy konto ma moduły płatne (9.10, USER_001: tester w trialu ich nie widzi). */
export function pelnyDostep(konto: Pick<Konto, "plan"> | null | undefined): boolean {
  return konto?.plan === "pelny";
}

/** Konto z rejestracji B2C: 3 bezpłatne rozmowy łącznie (9.10). */
export function planFree(konto: Pick<Konto, "plan"> | null | undefined): boolean {
  return konto?.plan === PLAN_FREE;
}

/**
 * 10.10 (USER_001): co widzi dane konto. FREE = Test (3 rozmowy), Feedback, Trening (fiszki),
 * Dostosuj Bruno razem z „wczytaj ofertę ze strony / PDF". Reszta (Statystyki, Ogień,
 * „Rozmowa, którą masz jutro") = po zakupie Bruno Pro. TRIAL (stare konta firm) jak dotąd.
 */
export type Dostep = { pelny: boolean; free: boolean; oferta: boolean; sytuacja: boolean; ogien: boolean; statystyki: boolean };
export function dostepKonta(konto: Pick<Konto, "plan"> | null | undefined): Dostep {
  const pelny = pelnyDostep(konto);
  const free = planFree(konto);
  return { pelny, free, oferta: pelny || free, sytuacja: pelny, ogien: pelny, statystyki: !free };
}

/**
 * Rozmowy zużyte z puli darmowych: zakończone albo przerwane po ≥ 60 s
 * (3-sekundowe rozłączenia nie zjadają puli, ale ciągłe urywanie przed końcem też nie jest darmowe).
 */
export async function rozmowyFreeZuzyte(email: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .or("status.eq.zakonczona,sekundy.gte.60");
  return count ?? 0;
}

export type StanFree = { zuzyte: number; zostalo: number; zablokowane: boolean };
/** Stan puli darmowych rozmów. Dla konta spoza planu free: nic nie blokuje. */
export async function stanFree(konto: Konto | null | undefined): Promise<StanFree> {
  if (!konto || !planFree(konto)) return { zuzyte: 0, zostalo: ROZMOW_ZA_DARMO, zablokowane: false };
  const zuzyte = await rozmowyFreeZuzyte(konto.email);
  return { zuzyte, zostalo: Math.max(0, ROZMOW_ZA_DARMO - zuzyte), zablokowane: zuzyte >= ROZMOW_ZA_DARMO };
}

export { ETAPY, REJESTRY, etapLubDomyslny, rejestrLubDomyslny, type EtapId, type RejestrId } from "./etapy";

export type Konfig = {
  email: string;
  produkt: string;
  klient: string;
  obiekcje: string;
  udana_rozmowa: string;
  skrypt: string;
  postac: string;
  godzina_przypomnienia: number;
  /** 9.10: etap relacji z klientem (patrz ETAPY). Brak = cold. */
  etap?: string | null;
  /** 9.10: pan/pani albo na ty. Brak = pan. */
  rejestr?: string | null;
};

export type Wypowiedz = { rola: "handlowiec" | "klient"; tekst: string; t: number };

export type Kryterium = {
  nazwa: "otwarcie" | "pytania" | "obiekcje" | "zamkniecie" | "pewnosc";
  ocena: number;
  cytat: string;
  czas: string;
  komentarz: string;
};

/**
 * 10.10 (E12): zamknięcie rozbite na techniki. Każda = osobny punkt na liście,
 * a ocena kryterium „zamkniecie" liczy się z nich w kodzie (patrz `policzZamkniecie`).
 */
export type ZamkniecieTechniki = {
  /** Próbne zamknięcie: „jak to brzmi?", „co pan o tym sądzi?" */
  proba_zamkniecia: boolean;
  /** Pytanie o decyzję wprost: „podpisujemy?", „wchodzimy w to?" */
  pytanie_o_decyzje: boolean;
  /** Następny krok z datą zaproponowany przez handlowca. */
  nastepny_krok_z_data: boolean;
  /** Obsługa „muszę pomyśleć" / „prześlę szefowi" / „zapytam wspólnika". */
  musze_pomyslec: "nie_padlo" | "poddal_sie" | "czekal" | "pytanie" | "warunek";
  /** Po obiekcji przy zamknięciu: czy padła druga prośba o decyzję. */
  drugie_zamkniecie: "nie_dotyczy" | "brak" | "bylo";
  /** Sygnał kupna klienta („co mam zrobić, żeby ruszyć?") i co handlowiec z nim zrobił. */
  sygnal_kupna: "nie_bylo" | "wykorzystany" | "zmarnowany";
};

export type Feedback = {
  ocena: number;
  kryteria: Kryterium[];
  /** 10.10: techniki zamykania (brak w starszych feedbackach). */
  zamkniecie_techniki?: ZamkniecieTechniki;
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
  /** Od 2.10: poziom trudności klienta (latwy/sredni/trudny). Brak = średni. */
  poziom?: string | null;
  /** 9.10 (moduł płatny): „Rozmowa, którą masz jutro": wklejona sytuacja z życia, nadrzędna wobec konfiguracji. */
  sytuacja?: string | null;
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
  if (!konto || !konto.aktywne) return { aktywny: false, koniec: null, dniZostalo: 0, powod: "no account" };
  if (!konto.start_dostepu) return { aktywny: true, koniec: null, dniZostalo: konto.dni };
  const koniec = new Date(new Date(konto.start_dostepu).getTime() + konto.dni * 86_400_000);
  const ms = koniec.getTime() - Date.now();
  return {
    aktywny: ms > 0,
    koniec,
    dniZostalo: Math.max(0, Math.ceil(ms / 86_400_000)),
    powod: ms > 0 ? undefined : "access expired",
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
      etap: "cold",
      rejestr: "pan",
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

/**
 * 10.10 (wariant A, tylko EN): karty wiedzy spoza obecnej talii (stare polskie tytuły) są ukryte,
 * nie kasowane (USER_001: nic nie usuwamy bez „tak”). Nowe EN dokłada zapewnijKarty.
 */
const TALIA_WIEDZY = new Set(WIEDZA.map((w) => w.tresc));
const aktualna = (k: Karta) => k.typ !== "wiedza" || TALIA_WIEDZY.has(k.tresc);

export async function kartyDoPowtorki(email: string, limit = 10): Promise<Karta[]> {
  const { data } = await supabaseAdmin
    .from("bruno_karty")
    .select("*")
    .eq("email", email)
    .lte("due", new Date().toISOString())
    .order("due", { ascending: true })
    .limit(limit + 40);
  return ((data as Karta[]) ?? []).filter(aktualna).slice(0, limit);
}

export async function wszystkieKarty(email: string): Promise<Karta[]> {
  const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).order("due");
  return ((data as Karta[]) ?? []).filter(aktualna);
}

