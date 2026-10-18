import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { BLOKADA_MS, LIMIT_PROB, WAZNOSC_SESJI_S, emailZTokenu, kodPasuje, nowyToken, zaszyfrujKod } from "@/lib/bruno/auth";

// 17.10 (USER_001): konta portalu /praca, KANDYDAT i PRACODAWCA (tabela praca_konta, lib/bruno/sql/2026-10-17-praca-konta.sql).
// Hasła i podpis sesji = te same funkcje co panel Bruno (scrypt, HMAC), ale osobne ciasteczko i osobna tabela.
// Token sesji podpisuje „typ:e-mail”, więc sesja Bruno nie otwiera panelu pracodawcy i odwrotnie.

export type TypKonta = "kandydat" | "pracodawca";
export const CIASTECZKO_PRACA = "praca_sesja";

export type KontoPraca = {
  id: string;
  email: string;
  typ: TypKonta;
  imie: string | null;
  telefon: string | null;
  firma: string | null;
  nip: string | null;
  linkedin: string | null;
  cv_sciezka: string | null;
  cv_nazwa: string | null;
  created_at: string;
  // 17.10 v2 (wzór RocketJobs): profil firmy, dane do faktury, klauzule RODO.
  logo_url: string | null;
  nazwa_wyswietlana: string | null;
  o_firmie: string | null;
  www: string | null;
  fv_nazwa: string | null;
  fv_kraj: string | null;
  fv_adres: string | null;
  fv_miasto: string | null;
  fv_kod: string | null;
  klauzula_rodo: string | null;
  klauzula_przyszle: string | null;
  klauzula_przyszle_domyslnie: boolean;
  // 18.10: kandydat (wzór RocketJobs): profil, preferencje pracy, zgody.
  miasto: string | null;
  tytul: string | null;
  o_mnie: string | null;
  pref_stanowisko: string | null;
  pref_miasto: string | null;
  pref_branza: string | null;
  pref_tryb: string | null;
  pref_pensja: number | null;
  zgoda_oferty: boolean;
  zgoda_marketing: boolean;
  // 18.10: ile ogłoszeń (po 30 dni) firma ma opłaconych do wystawienia; promocja 50 zł raz na konto.
  kredyty: number;
  promo_uzyta: boolean;
};
const POLA =
  "id,email,typ,imie,telefon,firma,nip,linkedin,cv_sciezka,cv_nazwa,created_at,logo_url,nazwa_wyswietlana,o_firmie,www,fv_nazwa,fv_kraj,fv_adres,fv_miasto,fv_kod,klauzula_rodo,klauzula_przyszle,klauzula_przyszle_domyslnie,miasto,tytul,o_mnie,pref_stanowisko,pref_miasto,pref_branza,pref_tryb,pref_pensja,zgoda_oferty,zgoda_marketing,kredyty,promo_uzyta";

export { nazwaFirmy, wzorKlauzuli, WZOR_PRZYSZLE } from "./klauzule";

export function typKonta(t: unknown): TypKonta | null {
  return t === "kandydat" || t === "pracodawca" ? t : null;
}

export function tokenSesji(typ: TypKonta, email: string) {
  return nowyToken(`${typ}:${email}`);
}
export const OPCJE_CIASTECZKA = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: WAZNOSC_SESJI_S };

/** Zalogowane konto portalu albo null (server components i route handlers). */
export async function zalogowanePraca(): Promise<KontoPraca | null> {
  const c = await cookies();
  const surowy = emailZTokenu(c.get(CIASTECZKO_PRACA)?.value);
  if (!surowy) return null;
  const [typ, ...reszta] = surowy.split(":");
  const t = typKonta(typ);
  if (!t) return null;
  const { data } = await supabaseAdmin.from("praca_konta").select(POLA).eq("email", reszta.join(":")).eq("typ", t).maybeSingle();
  return (data as KontoPraca | null) ?? null;
}

export async function zalozKonto(a: {
  typ: TypKonta;
  email: string;
  haslo: string;
  imie?: string | null;
  telefon?: string | null;
  firma?: string | null;
  nip?: string | null;
}): Promise<{ ok: true; konto: KontoPraca } | { ok: false; blad: string; istnieje?: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("praca_konta")
    .insert({
      email: a.email,
      typ: a.typ,
      haslo_hash: zaszyfrujKod(a.haslo),
      imie: a.imie || null,
      telefon: a.telefon || null,
      firma: a.firma || null,
      nip: a.nip || null,
    })
    .select(POLA)
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, istnieje: true, blad: "Konto z tym e-mailem już istnieje. Zaloguj się." };
    console.error("[praca konto]", error);
    return { ok: false, blad: "Nie udało się założyć konta. Spróbuj ponownie." };
  }
  return { ok: true, konto: data as KontoPraca };
}

export async function zaloguj(typ: TypKonta, email: string, haslo: string): Promise<{ ok: true; konto: KontoPraca } | { ok: false; blad: string; status: number }> {
  const ZLE = "Zły e-mail albo hasło.";
  const { data } = await supabaseAdmin.from("praca_konta").select(`${POLA},haslo_hash,nieudane,blokada_do`).eq("email", email).eq("typ", typ).maybeSingle();
  if (!data) return { ok: false, blad: ZLE, status: 401 };
  const k = data as KontoPraca & { haslo_hash: string; nieudane: number; blokada_do: string | null };
  if (k.blokada_do && new Date(k.blokada_do).getTime() > Date.now()) {
    const minut = Math.ceil((new Date(k.blokada_do).getTime() - Date.now()) / 60_000);
    return { ok: false, blad: `Za dużo prób. Spróbuj za ${minut} min.`, status: 429 };
  }
  if (!kodPasuje(haslo, k.haslo_hash)) {
    const nieudane = (k.nieudane ?? 0) + 1;
    await supabaseAdmin
      .from("praca_konta")
      .update({ nieudane, blokada_do: nieudane >= LIMIT_PROB ? new Date(Date.now() + BLOKADA_MS).toISOString() : null })
      .eq("id", k.id);
    return { ok: false, blad: ZLE, status: 401 };
  }
  await supabaseAdmin.from("praca_konta").update({ nieudane: 0, blokada_do: null }).eq("id", k.id);
  const { haslo_hash: _h, nieudane: _n, blokada_do: _b, ...konto } = k;
  return { ok: true, konto };
}

// --- CV w prywatnym magazynie (bucket praca-cv) ---
export const CV_MAKS_B = 4 * 1024 * 1024;
export const CV_TYPY = /\.(pdf|docx?|odt|rtf)$/i;
const MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  odt: "application/vnd.oasis.opendocument.text",
  rtf: "application/rtf",
};

/** Sprawdza plik CV z formularza. null = brak pliku, string = błąd, obiekt = OK. */
export async function plikCV(plik: FormDataEntryValue | null): Promise<null | string | { nazwa: string; dane: Buffer; typ: string }> {
  if (!(plik instanceof File) || plik.size === 0) return null;
  if (!CV_TYPY.test(plik.name)) return "CV w formacie PDF, DOC albo DOCX.";
  if (plik.size > CV_MAKS_B) return "Plik może mieć najwyżej 4 MB.";
  const roz = plik.name.split(".").pop()!.toLowerCase();
  return { nazwa: plik.name.replace(/[^\w.\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]/g, "_").slice(0, 120), dane: Buffer.from(await plik.arrayBuffer()), typ: MIME[roz] ?? "application/octet-stream" };
}

export async function zapiszCV(folder: string, cv: { nazwa: string; dane: Buffer; typ: string }): Promise<string | null> {
  const sciezka = `${folder}/${Date.now()}-${randomBytes(4).toString("hex")}-${cv.nazwa.replace(/\s+/g, "_")}`;
  const { error } = await supabaseAdmin.storage.from("praca-cv").upload(sciezka, cv.dane, { contentType: cv.typ, upsert: false });
  if (error) {
    console.error("[praca cv]", error.message);
    return null;
  }
  return sciezka;
}

export async function linkCV(sciezka: string, sekund = 300): Promise<string | null> {
  const { data } = await supabaseAdmin.storage.from("praca-cv").createSignedUrl(sciezka, sekund);
  return data?.signedUrl ?? null;
}
