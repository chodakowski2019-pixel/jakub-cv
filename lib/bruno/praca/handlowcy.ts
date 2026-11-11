import { supabaseAdmin } from "@/lib/supabase";
import { linkCV, type KontoPraca } from "./konta";
import { KROKI, LINKI_PROFILU, miastoZWielkiej, telefonGrupami, type Odpowiedzi } from "./profil-handlowca";

// 11.11 (USER_001): giełda handlowców, strona firm. Wyszukiwanie w bazie profili (praca_profile_handlowcow),
// karta bez danych kontaktowych dla każdego, pełny profil dopiero po odblokowaniu (praca_odblokowania).
// Baza jest mała, więc filtrowanie robi serwer w pamięci.

/** Lokalnie pokazujemy też profile „w weryfikacji”, żeby było na czym pracować. Na produkcji tylko zatwierdzone. */
const LOKALNIE = process.env.NODE_ENV !== "production";
const WIDOCZNE = LOKALNIE ? ["zatwierdzony", "weryfikacja"] : ["zatwierdzony"];

const opcje = (klucz: string): string[] => {
  const p = KROKI.flatMap((k) => k.pytania).find((x) => x.klucz === klucz);
  return p && "opcje" in p ? p.opcje.map((o) => o.v) : [];
};

export const BRANZE = opcje("branze").filter((b) => b !== "Inna");
export const TRYBY = opcje("tryb");
export const RYNKI = ["Firmom", "Klientom indywidualnym"];
const LATA = opcje("lata");
/** Minimalne doświadczenie w filtrze: etykieta → od której pozycji listy „lata” profil pasuje. */
export const DOSWIADCZENIE: { v: string; l: string; od: number }[] = [
  { v: "1", l: "Od 1 roku", od: 1 },
  { v: "3", l: "Od 3 lat", od: 2 },
  { v: "5", l: "Od 5 lat", od: 3 },
];

export type Filtry = { branze: string[]; miasto: string; lata: string; rynek: string; tryb: string[] };

const lista = (v: unknown): string[] => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []).map(String);
const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").trim();

/** Filtry z adresu strony (formularz GET) albo z treści żądania. Nieznane wartości odpadają. */
export function czytajFiltry(q: Record<string, unknown>): Filtry {
  return {
    branze: lista(q.branza).filter((b) => BRANZE.includes(b)),
    miasto: String(lista(q.miasto)[0] ?? "").trim().slice(0, 80),
    lata: DOSWIADCZENIE.some((d) => d.v === q.lata) ? String(q.lata) : "",
    rynek: RYNKI.includes(String(q.rynek)) ? String(q.rynek) : "",
    tryb: lista(q.tryb).filter((t) => TRYBY.includes(t)),
  };
}

/** Karta w wynikach: bez nazwiska, telefonu, e-maila, zdjęcia i opisu sukcesu (tam bywają nazwy firm). */
export type KartaHandlowca = {
  id: string;
  imie: string;
  stanowisko: string;
  miasto: string;
  /** „Tak” / „Nie” / "" (starsze profile bez odpowiedzi): czy bierze pod uwagę zmianę miasta zamieszkania. */
  przeprowadzka: string;
  lata: string;
  sytuacja: string;
  rynek: string;
  branze: string[];
  kanaly: string[];
  mocne: string[];
  plan: string;
  transakcja: string;
  tryb: string[];
  umowa: string[];
  pensja: number | null;
  start: string;
  sprawdzony: boolean;
  maCV: boolean;
  /** 12.11: % dopasowania do wyszukiwania; null = wyszukiwanie bez kryteriów albo widok poza wyszukiwarką. */
  dopasowanie?: number | null;
};

export type PelnyHandlowiec = KartaHandlowca & {
  email: string;
  telefon: string;
  linkedin: string | null;
  /** 11.11: pozostałe linki z profilu (strona, Facebook, Instagram) jako [etykieta, adres]. */
  linki: [string, string][];
  opis: string;
  sukces: string;
  zdjecie: string | null;
  cv: string | null;
  odblokowano: string;
};

type Wiersz = {
  konto_id: string;
  odpowiedzi: Odpowiedzi;
  status: string;
  zdjecie_sciezka: string | null;
  konto: Pick<KontoPraca, "id" | "email" | "imie" | "telefon" | "linkedin" | "cv_sciezka"> | null;
};

const t = (v: unknown) => (typeof v === "string" ? v : "");
const l = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

function doKarty(w: Wiersz): KartaHandlowca {
  const o = w.odpowiedzi ?? {};
  const [imie, ...reszta] = t(o.imie).trim().split(/\s+/);
  const nazwisko = reszta[reszta.length - 1];
  return {
    id: w.konto_id,
    imie: `${imie || "Handlowiec"}${nazwisko ? ` ${nazwisko[0].toUpperCase()}.` : ""}`,
    stanowisko: t(o.stanowisko),
    // Starsze profile mają miasto tak, jak je wpisano („warszawa”), stąd poprawka także przy odczycie.
    miasto: miastoZWielkiej(t(o.miasto)),
    przeprowadzka: t(o.przeprowadzka),
    lata: t(o.lata),
    sytuacja: t(o.status),
    rynek: t(o.rynek),
    branze: l(o.branze),
    kanaly: l(o.kanaly),
    mocne: l(o.mocne),
    plan: t(o.plan),
    transakcja: t(o.transakcja),
    tryb: l(o.tryb),
    umowa: l(o.umowa),
    pensja: Number(t(o.pensja)) || null,
    start: t(o.start),
    sprawdzony: w.status === "zatwierdzony",
    maCV: !!w.konto?.cv_sciezka,
  };
}

async function wiersze(ids?: string[]): Promise<Wiersz[]> {
  let q = supabaseAdmin
    .from("praca_profile_handlowcow")
    .select("konto_id,odpowiedzi,status,zdjecie_sciezka,konto:praca_konta(id,email,imie,telefon,linkedin,cv_sciezka)")
    .eq("zgoda_pracodawcy", true)
    .in("status", WIDOCZNE);
  if (ids) q = q.in("konto_id", ids);
  const { data, error } = await q.order("updated_at", { ascending: false }).limit(2000);
  if (error) console.error("[praca handlowcy]", error.message);
  return (data ?? []) as unknown as Wiersz[];
}

// 12.11 (USER_001: „procent, na ile handlowiec jest dopasowany do tego, czego ktoś szuka”): zamiast twardego odsiewu
// każdy profil dostaje punkty za kryteria z wyszukiwania. Liczą się tylko kryteria, które firma podała (waga), wynik w %.
// Częściowe punkty: miasto inne, ale praca zdalna albo gotowość do przeprowadzki = 70 %; staż o jeden próg niższy = 50 %.
const WAGI = { branze: 35, miasto: 25, lata: 20, rynek: 10, tryb: 10 };
/** Poniżej tego progu profil nie trafia do wyników (lepiej mniej, ale trafnie). */
export const PROG_DOPASOWANIA = 50;

function dopasowanie(k: KartaHandlowca, f: Filtry): number | null {
  const czesci: [number, number][] = [];
  if (f.branze.length) czesci.push([WAGI.branze, f.branze.some((b) => k.branze.includes(b)) ? 1 : 0]);
  if (f.miasto) {
    const to = norm(k.miasto).includes(norm(f.miasto));
    czesci.push([WAGI.miasto, to ? 1 : k.tryb.includes("Zdalnie") || k.przeprowadzka === "Tak" ? 0.7 : 0]);
  }
  if (f.lata) {
    const od = DOSWIADCZENIE.find((d) => d.v === f.lata)?.od ?? 0;
    const ma = LATA.indexOf(k.lata);
    czesci.push([WAGI.lata, ma >= od ? 1 : ma === od - 1 ? 0.5 : 0]);
  }
  if (f.rynek) czesci.push([WAGI.rynek, k.rynek === f.rynek || k.rynek === "Jednym i drugim" ? 1 : 0]);
  if (f.tryb.length) czesci.push([WAGI.tryb, f.tryb.some((x) => k.tryb.includes(x)) ? 1 : 0]);
  if (!czesci.length) return null;
  const suma = czesci.reduce((s, [w]) => s + w, 0);
  return Math.round((czesci.reduce((s, [w, p]) => s + w * p, 0) / suma) * 100);
}

/** Wynik wyszukiwania: karty bez kontaktu z % dopasowania, od najlepiej dopasowanych; przy remisie dłuższy staż.
 * Bez żadnego kryterium = wszyscy, bez procentu. */
export async function szukajHandlowcow(f: Filtry): Promise<KartaHandlowca[]> {
  const karty = (await wiersze()).map(doKarty).map((k) => ({ ...k, dopasowanie: dopasowanie(k, f) }));
  return karty
    .filter((k) => k.dopasowanie === null || k.dopasowanie >= PROG_DOPASOWANIA)
    .sort((a, b) => (b.dopasowanie ?? 0) - (a.dopasowanie ?? 0) || LATA.indexOf(b.lata) - LATA.indexOf(a.lata));
}

/** Z podanych id zostają tylko profile, które wolno teraz sprzedać (widoczne, ze zgodą). */
export async function widoczneId(ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const mam = new Set((await wiersze(ids)).map((w) => w.konto_id));
  return ids.filter((id) => mam.has(id));
}

/** Id handlowców, których kontakt to konto pracodawcy już ma. */
export async function odblokowaneId(kontoId: string): Promise<string[]> {
  const { data } = await supabaseAdmin.from("praca_odblokowania").select("handlowiec_id").eq("konto_id", kontoId);
  return (data ?? []).map((x) => x.handlowiec_id as string);
}

/** Pełne profile odblokowane przez pracodawcę: kontakt, opis sukcesu, zdjęcie i CV (linki podpisane na godzinę). */
export async function odblokowaniHandlowcy(kontoId: string): Promise<PelnyHandlowiec[]> {
  const { data } = await supabaseAdmin.from("praca_odblokowania").select("handlowiec_id,created_at").eq("konto_id", kontoId).order("created_at", { ascending: false });
  const kiedy = new Map((data ?? []).map((x) => [x.handlowiec_id as string, x.created_at as string]));
  if (!kiedy.size) return [];
  // Odblokowany kontakt zostaje u firmy także wtedy, gdy profil wrócił do weryfikacji, stąd zapytanie bez filtra statusu.
  const { data: w } = await supabaseAdmin
    .from("praca_profile_handlowcow")
    .select("konto_id,odpowiedzi,status,zdjecie_sciezka,konto:praca_konta(id,email,imie,telefon,linkedin,cv_sciezka)")
    .in("konto_id", [...kiedy.keys()]);
  const pelne = await Promise.all(
    ((w ?? []) as unknown as Wiersz[]).map(async (x) => {
      const o = x.odpowiedzi ?? {};
      const zdjecie = x.zdjecie_sciezka ? (await supabaseAdmin.storage.from("praca-cv").createSignedUrl(x.zdjecie_sciezka, 3600)).data?.signedUrl ?? null : null;
      return {
        ...doKarty(x),
        imie: t(o.imie) || x.konto?.imie || "Handlowiec",
        email: x.konto?.email ?? "",
        telefon: telefonGrupami(t(o.telefon) || x.konto?.telefon || ""),
        linkedin: t(o.linkedin) || x.konto?.linkedin || null,
        linki: LINKI_PROFILU.filter(([k]) => k !== "linkedin" && t(o[k])).map(([k, nazwa]) => [nazwa, t(o[k])] as [string, string]),
        opis: t(o.opis),
        sukces: t(o.sukces),
        zdjecie,
        cv: x.konto?.cv_sciezka ? await linkCV(x.konto.cv_sciezka, 3600) : null,
        odblokowano: kiedy.get(x.konto_id) ?? "",
      };
    }),
  );
  return pelne.sort((a, b) => b.odblokowano.localeCompare(a.odblokowano));
}

/** Zapis wyszukiwania do lejka firm (kokpit: krok „Wyszukiwanie handlowca”). Błąd zapisu nie psuje strony. */
export async function zapiszWyszukiwanie(f: Filtry, wynik: number, kontoId: string | null) {
  const { error } = await supabaseAdmin.from("praca_wyszukiwania").insert({ filtry: f, wynik, konto_id: kontoId });
  if (error) console.error("[praca wyszukiwanie]", error.message);
}

// --- 11.11: panel handlowca (układ giełdy): własny profil w bazie i firmy, które mają jego kontakt ---

export type MojProfil = {
  status: "weryfikacja" | "zatwierdzony" | "odrzucony";
  karta: KartaHandlowca;
  /** Surowe odpowiedzi z formularza: wypełniają pola w „Edycji profilu”. */
  odpowiedzi: Odpowiedzi;
  opis: string;
  sukces: string;
  telefon: string;
  /** [etykieta, adres] tylko dla podanych linków. */
  linki: [string, string][];
  wyslano: string;
  /** Zdjęcie z formularza profilu (link podpisany na godzinę) albo null. */
  zdjecie: string | null;
};

/** Profil zalogowanego handlowca w bazie albo null, gdy jeszcze nie wypełnił formularza. */
export async function mojProfil(kontoId: string): Promise<MojProfil | null> {
  const { data } = await supabaseAdmin.from("praca_profile_handlowcow").select("konto_id,odpowiedzi,status,zdjecie_sciezka,updated_at").eq("konto_id", kontoId).maybeSingle();
  if (!data) return null;
  const w = { ...data, konto: null } as unknown as Wiersz & { updated_at: string };
  const o = w.odpowiedzi ?? {};
  const zdjecie = w.zdjecie_sciezka ? (await supabaseAdmin.storage.from("praca-cv").createSignedUrl(w.zdjecie_sciezka, 3600)).data?.signedUrl ?? null : null;
  return {
    status: w.status as MojProfil["status"],
    karta: { ...doKarty(w), imie: t(o.imie) || "Handlowiec" },
    odpowiedzi: o,
    opis: t(o.opis),
    sukces: t(o.sukces),
    telefon: telefonGrupami(t(o.telefon)),
    linki: LINKI_PROFILU.filter(([k]) => t(o[k])).map(([k, nazwa]) => [nazwa, t(o[k])]),
    wyslano: w.updated_at,
    zdjecie,
  };
}

export type FirmaZKontaktem = { nazwa: string; www: string | null; logo: string | null; kiedy: string };

/** Firmy, które odblokowały kontakt do tego handlowca. */
export async function firmyZKontaktem(handlowiecId: string): Promise<FirmaZKontaktem[]> {
  const { data, error } = await supabaseAdmin
    .from("praca_odblokowania")
    .select("created_at,firma:praca_konta!praca_odblokowania_konto_id_fkey(firma,nazwa_wyswietlana,www,logo_url)")
    .eq("handlowiec_id", handlowiecId)
    .order("created_at", { ascending: false });
  if (error) console.error("[praca firmy z kontaktem]", error.message);
  type W = { created_at: string; firma: { firma: string | null; nazwa_wyswietlana: string | null; www: string | null; logo_url: string | null } | null };
  return ((data ?? []) as unknown as W[]).map((x) => ({ nazwa: x.firma?.nazwa_wyswietlana || x.firma?.firma || "Firma", www: x.firma?.www ?? null, logo: x.firma?.logo_url ?? null, kiedy: x.created_at }));
}
