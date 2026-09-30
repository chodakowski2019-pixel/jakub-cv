import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Logowanie do panelu Bruno AI.
//
// Od 30.09 (USER_001): e-mail + STAŁY 6-cyfrowy kod przypisany do konta,
// nie kod jednorazowy z maila. Kod nadaje USER_001 przy zakładaniu konta,
// tester dostaje go mailem i może go zmienić w panelu.
//
// W bazie trzymamy wyłącznie skrót scrypt (sól:skrót), bo za kodem stoją
// nagrania rozmów handlowych. Sesja to podpisany token w ciasteczku httpOnly,
// bez tabeli sesji.

export const CIASTECZKO = "bruno_sesja";
export const WAZNOSC_SESJI_S = 30 * 24 * 60 * 60; // 30 dni

/** Ile nieudanych prób, zanim zamkniemy logowanie. */
export const LIMIT_PROB = 5;
/** Na jak długo blokujemy po przekroczeniu limitu. */
export const BLOKADA_MS = 15 * 60 * 1000;

const DLUGOSC_SOLI = 16;
const DLUGOSC_SKROTU = 32;

function sekret(): string {
  // Osobny sekret jest lepszy; bez niego pochodna klucza serwisowego, żeby
  // panel działał od pierwszego deployu. Skrót, nie sam klucz: gdyby token
  // kiedyś wyciekł razem z sekretem, nie wycieka klucz do bazy.
  const s = process.env.BRUNO_AUTH_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Brak BRUNO_AUTH_SECRET w env.");
  return createHash("sha256").update(`bruno:${s}`).digest("hex");
}

function podpisz(dane: string) {
  return createHmac("sha256", sekret()).update(dane).digest("hex");
}

function rowne(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Losowy kod startowy dla nowego konta. */
export function nowyKod(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function poprawnyKod(surowy: unknown): string | null {
  const kod = String(surowy ?? "").replace(/\D/g, "");
  return kod.length === 6 ? kod : null;
}

export function zaszyfrujKod(kod: string): string {
  const sol = randomBytes(DLUGOSC_SOLI).toString("hex");
  const skrot = scryptSync(kod, sol, DLUGOSC_SKROTU).toString("hex");
  return `${sol}:${skrot}`;
}

export function kodPasuje(kod: string, zapisany: string | null | undefined): boolean {
  if (!zapisany) return false;
  const [sol, skrot] = zapisany.split(":");
  if (!sol || !skrot) return false;
  try {
    return rowne(scryptSync(kod, sol, DLUGOSC_SKROTU).toString("hex"), skrot);
  } catch {
    return false;
  }
}

export function nowyToken(email: string): string {
  const wygasa = Date.now() + WAZNOSC_SESJI_S * 1000;
  const tresc = `${Buffer.from(email).toString("base64url")}.${wygasa}`;
  return `${tresc}.${podpisz(tresc)}`;
}

export function emailZTokenu(token: string | null | undefined): string | null {
  if (!token) return null;
  const czesci = token.split(".");
  if (czesci.length !== 3) return null;
  const [emailB64, wygasa, hmac] = czesci;
  if (Number(wygasa) < Date.now()) return null;
  try {
    if (!rowne(hmac, podpisz(`${emailB64}.${wygasa}`))) return null;
    return Buffer.from(emailB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/** Kto jest zalogowany (server components i route handlers). */
export async function zalogowanyEmail(): Promise<string | null> {
  const c = await cookies();
  return emailZTokenu(c.get(CIASTECZKO)?.value);
}

export function normalizujEmail(surowy: unknown): string | null {
  const email = String(surowy ?? "").trim().toLowerCase().slice(0, 160);
  return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) ? email : null;
}
