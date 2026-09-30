import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Logowanie do panelu Bruno AI. Wzór: zwiazki-lp/src/lib/app-auth.ts (gabi).
//
// E-mail + 6-cyfrowy kod z maila zamiast hasła. Kod żyje 15 minut w tabeli
// bruno_kody, sesja to podpisany token w ciasteczku httpOnly, bez tabeli sesji.
// Konta zakłada USER_001 ręcznie po weryfikacji leada (decyzja 30.09), więc
// logowanie nie jest rejestracją: nieznany adres dostaje tę samą odpowiedź.

export const CIASTECZKO = "bruno_sesja";
export const WAZNOSC_SESJI_S = 30 * 24 * 60 * 60; // 30 dni
const WAZNOSC_KODU_MS = 15 * 60 * 1000;

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

export function nowyKod(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function wygasniecieKodu(): string {
  return new Date(Date.now() + WAZNOSC_KODU_MS).toISOString();
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
