import { createHmac, timingSafeEqual } from "node:crypto";
import dane from "./oferty.json";
import { doOferty, ofertyFirmAktywne, wierszOferty } from "./oferty-firm";
import loga from "./loga.json";

// 17.10 (USER_001): portal ofert pracy dla handlowców w Polsce, salesbruno.com/praca.
// Oferty z innych portali wchodzą jako NIEAKTYWNE (niewidoczne). Publicznie widać tylko aktywne (50 zł/mc).
// Firma widzi swoją nieaktywną ofertę pod prywatnym linkiem /praca/<id>?k=<token>.
// Na razie plik JSON (scripts/bruno-praca-import.mjs), docelowo tabela w Supabase.

export type StatusOferty = "nieaktywna" | "aktywna" | "usunieta";

type OfertaPelna = {
  id: string;
  klucz: string;
  status: StatusOferty;
  stanowisko: string;
  firma: string;
  miasto: string;
  wojewodztwo: string;
  b2b: boolean;
  pensjaMin: number | null;
  pensjaMax: number | null;
  adzunaCzas: string | null;
  adzunaTyp?: string | null;
  opis: string;
  dodano: string;
  zrodlo: string;
  zrodloUrl: string;
  email: string | null;
  // 17.10: cechy do filtrów i pigułek (lib/bruno/praca/cechy.mjs). null = brak informacji w ofercie.
  poziom: string;
  umowa: string | null;
  wymiar: string;
  tryb: string;
  branza: string;
  odZaraz: boolean;
  umiejetnosci: string[];
  wazneDo: string;
  // Sekcje jak na Pracuj.pl, wypełnia firma po aktywacji.
  obowiazki: string[];
  wymagania: string[];
  mileWidziane: string[];
  oferujemy: string[];
  oFirmie: string;
  aplikuj: string | null;
};

/** Oferta bez tokenu i kontaktu: tylko to może trafić do przeglądarki. */
export type Oferta = Omit<OfertaPelna, "klucz" | "email" | "adzunaCzas" | "adzunaTyp"> & { logo: string | null; zFirmy?: boolean };

/** Lekka wersja do listy (4 600 ofert): bez opisu, sekcji i źródła. */
export type OfertaLista = Pick<
  Oferta,
  "id" | "stanowisko" | "firma" | "logo" | "miasto" | "wojewodztwo" | "b2b" | "pensjaMin" | "pensjaMax" | "dodano" | "wazneDo" | "poziom" | "umowa" | "wymiar" | "tryb" | "branza" | "umiejetnosci"
>;
export function doListy(o: Oferta): OfertaLista {
  const { id, stanowisko, firma, logo, miasto, wojewodztwo, b2b, pensjaMin, pensjaMax, dodano, wazneDo, poziom, umowa, wymiar, tryb, branza, umiejetnosci } = o;
  return { id, stanowisko, firma, logo, miasto, wojewodztwo, b2b, pensjaMin, pensjaMax, dodano, wazneDo, poziom, umowa, wymiar, tryb, branza, umiejetnosci };
}

/** Oferta po id (bez usuniętych), do formularza „Aplikuj”. */
export function ofertaPoId(id: string): Oferta | null {
  const o = wszystkie.find((x) => x.id === id);
  return o && o.status !== "usunieta" ? publiczna(o) : null;
}

export const CENA_MIESIAC = 50;

const wszystkie = dane as OfertaPelna[];

/**
 * 17.10: token z linku dla firmy (/praca/<id>?k=...) liczony z sekretu serwera, NIE trzymany w oferty.json
 * (repo na GitHubie jest publiczne). Ten sam wzór w scripts/bruno-praca-linki.mjs.
 */
export function tokenOferty(klucz: string): string {
  // Klucz Supabase jest i lokalnie, i na Vercelu (BRUNO_AUTH_SECRET jest tylko na Vercelu), więc linki z skryptu pasują do produkcji.
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Brak SUPABASE_SERVICE_ROLE_KEY w env.");
  return createHmac("sha256", `praca:${s}`).update(klucz).digest("hex").slice(0, 24);
}
function tokenOk(o: OfertaPelna, k: unknown): boolean {
  if (typeof k !== "string" || k.length !== 24) return false;
  const a = Buffer.from(k);
  const b = Buffer.from(tokenOferty(o.klucz));
  return a.length === b.length && timingSafeEqual(a, b);
}

// 17.10: logo firmy (scripts/bruno-praca-loga.mjs), ścieżka na naszej domenie. Brak = inicjały.
const LOGA = loga as Record<string, { logo: string } | null>;

function publiczna({ klucz: _k, email: _e, adzunaCzas: _c, adzunaTyp: _y, ...o }: OfertaPelna): Oferta {
  return { ...o, logo: LOGA[o.firma]?.logo ?? null };
}

/** Lokalnie ?podglad=wszystkie pokazuje nieaktywne tak, jakby były aktywne (do dopracowania wyglądu). */
export function podgladWszystkich(podglad: unknown): boolean {
  return process.env.NODE_ENV !== "production" && podglad === "wszystkie";
}

// 17.10 (USER_001: „wszystkie widoczne”): publicznie widać każdą ofertę poza usuniętymi.
// „nieaktywna” = firma jeszcze jej nie przejęła (50 zł/mc: logo, opis, zgłoszenia prosto do niej).
export function ofertyWidoczne(_wszystkieTez = false): Oferta[] {
  return wszystkie.filter((o) => o.status !== "usunieta").map(publiczna);
}

export function liczbaNieaktywnych(): number {
  return wszystkie.filter((o) => o.status === "nieaktywna").length;
}

/**
 * Oferta pod /praca/<id>. Aktywna = dla każdego. Nieaktywna = tylko z poprawnym tokenem (link z maila do firmy)
 * albo w lokalnym podglądzie. `wlasciciel` = wejście z linku firmy (pokazuje pasek aktywacji).
 */
export function ofertaDoPokazania(id: string, k: unknown, wszystkieTez = false): { oferta: Oferta; wlasciciel: boolean } | null {
  const o = wszystkie.find((x) => x.id === id);
  if (!o || o.status === "usunieta") return null;
  const wlasciciel = tokenOk(o, k);
  void wszystkieTez;
  return { oferta: publiczna(o), wlasciciel };
}

export function sprawdzToken(id: string, k: unknown): Oferta | null {
  const o = wszystkie.find((x) => x.id === id);
  return o && o.status !== "usunieta" && tokenOk(o, k) ? publiczna(o) : null;
}

/** Ile dni temu dodano (do „Nowa” i „3 dni temu”). */
export function dniTemu(iso: string, teraz = Date.now()): number {
  return Math.max(0, Math.floor((teraz - Date.parse(iso)) / 86_400_000));
}

/** Podobne oferty: ta sama branża, potem to samo województwo. Tylko widoczne (aktywne albo podgląd lokalny). */
export function podobne(o: Oferta, wszystkieTez = false, ile = 4): Oferta[] {
  const pula = ofertyWidoczne(wszystkieTez).filter((x) => x.id !== o.id && x.firma !== o.firma);
  const punkty = (x: Oferta) => (x.branza === o.branza ? 2 : 0) + (x.wojewodztwo === o.wojewodztwo ? 1 : 0);
  return pula.sort((a, b) => punkty(b) - punkty(a)).slice(0, ile);
}

// --- 17.10: oferty z panelu pracodawcy (baza) + oferty z Adzuna (plik) razem ---

/** Publiczna lista: najpierw aktywne ogłoszenia firm z panelu, potem Adzuna. */
export async function ofertyPubliczne(): Promise<Oferta[]> {
  return [...(await ofertyFirmAktywne()), ...ofertyWidoczne()];
}

/** Oferta pod /praca/<id>: plik (Adzuna) albo baza (panel firmy, tylko aktywna albo podgląd właściciela). */
export async function ofertaPublicznaLubFirmy(id: string, k: unknown, kontoId?: string | null): Promise<{ oferta: Oferta; wlasciciel: boolean; wlascicielPanelu: boolean } | null> {
  const z = ofertaDoPokazania(id, k);
  if (z) return { ...z, wlascicielPanelu: false };
  const w = await wierszOferty(id);
  if (!w || w.status === "usunieta") return null;
  const wlascicielPanelu = !!kontoId && kontoId === w.konto_id;
  if (w.status !== "aktywna" && !wlascicielPanelu) return null;
  return { oferta: doOferty(w), wlasciciel: false, wlascicielPanelu };
}

/** Dla „Aplikuj”: oferta z pliku albo aktywna z bazy + e-mail firmy (zgłoszenia na jej skrzynkę). */
export async function ofertaDoAplikacji(id: string): Promise<{ oferta: Oferta; kontoFirmyId: string | null } | null> {
  const z = ofertaPoId(id);
  if (z) return { oferta: z, kontoFirmyId: null };
  const w = await wierszOferty(id);
  if (!w || w.status !== "aktywna") return null;
  return { oferta: doOferty(w), kontoFirmyId: w.konto_id };
}
