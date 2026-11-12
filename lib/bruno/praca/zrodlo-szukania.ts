import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import Anthropic from "@anthropic-ai/sdk";
import { BRANZE, TRYBY } from "./handlowcy";

// 12.11 (USER_001): wyszukiwarka handlowców przyjmuje 3 źródła: link do strony z ofertą, PDF z ofertą albo opis.
// Link i PDF model (Haiku) streszcza do jednej linii w stylu „Handlowiec OZE, Warszawa, min. 3 lata, B2B, w terenie”,
// a tę linię czyta ten sam odczyt co zwykły opis (opis-szukania.ts). Dzięki temu wynik, zapis wyszukiwania i zlecenia
// działają na jednym krótkim opisie, niezależnie od źródła.

export const PDF_MAKS_B = 4 * 1024 * 1024;
const TEKST_MAKS = 12_000;
const CZAS_MS = 8_000;

const SYSTEM = `Dostajesz ofertę pracy dla handlowca (tekst strony albo PDF). Streść w JEDNEJ linii po polsku, kogo firma szuka, do 300 znaków, same fakty z oferty, po przecinku:
stanowisko, branża, miasto, minimalne doświadczenie w latach, komu sprzedaje (B2B albo B2C), tryb pracy.
Branżę nazwij jednym z: ${BRANZE.join("; ")}. Tryb pracy jednym z: ${TRYBY.join("; ")}. Miasto w mianowniku.
Czego w ofercie nie ma, to pomiń. Niczego nie zgaduj. Bez nazwy firmy, bez danych osób, bez wstępu i bez cudzysłowów.
Doradca, konsultant, przedstawiciel, opiekun klienta, account manager to też sprzedaż. Tylko gdy w treści w ogóle nie ma oferty pracy ani opisu stanowiska (np. strona logowania, błąd, lista wielu ofert), odpowiedz samym słowem: BRAK.`;

export type Zrodlo = { ok: true; opis: string } | { ok: false; blad: string };

const BLAD_LINKU = "Nie udało się otworzyć tej strony. Wgraj ofertę jako PDF albo opisz, kogo szukasz.";

/** Adres prywatny albo lokalny = odmowa (serwer nie może pobierać stron z własnej sieci). */
function prywatny(ip: string): boolean {
  if (ip.includes(":")) {
    const a = ip.toLowerCase();
    return a === "::1" || a === "::" || a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80") || a.startsWith("::ffff:");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function bezpiecznyAdres(surowy: string): Promise<URL | null> {
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(surowy) ? surowy : `https://${surowy}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password || (u.port && u.port !== "80" && u.port !== "443")) return null;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!host.includes(".") && !isIP(host)) return null;
  try {
    const adresy = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (!adresy.length || adresy.some((x) => prywatny(x.address))) return null;
  } catch {
    return null;
  }
  return u;
}

const ENCJE: Record<string, string> = { amp: "&", quot: "\"", apos: "'", lt: "<", gt: ">", nbsp: " ", oacute: "ó", Oacute: "Ó", ndash: "-", mdash: "-", hellip: "…" };

function tekstZHtml(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(x?)([0-9a-f]+);/gi, (_, x, n) => String.fromCodePoint(parseInt(n, x ? 16 : 10) || 32))
    .replace(/&([a-z]+);/gi, (_, n) => ENCJE[n] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pobiera stronę z ofertą. Przekierowania sprawdzane po kolei (każdy adres musi być publiczny), najwyżej 3. */
async function tekstStrony(link: string): Promise<string | null> {
  let u = await bezpiecznyAdres(link);
  for (let i = 0; u && i < 4; i++) {
    const odp = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(CZAS_MS), headers: { "User-Agent": "Mozilla/5.0 (compatible; SalesBrunoBot/1.0; +https://salesbruno.pl)", Accept: "text/html" } }).catch(() => null);
    if (!odp) return null;
    if (odp.status >= 300 && odp.status < 400) {
      const dalej = odp.headers.get("location");
      u = dalej ? await bezpiecznyAdres(new URL(dalej, u).toString()) : null;
      continue;
    }
    if (!odp.ok || !(odp.headers.get("content-type") ?? "").includes("html")) return null;
    return tekstZHtml((await odp.text()).slice(0, 600_000)).slice(0, TEKST_MAKS);
  }
  return null;
}

/** Opis z modelu; "BRAK" = to nie jest oferta pracy w sprzedaży; null = model nie odpowiedział (brak klucza, błąd). */
async function strescOferte(tresc: Anthropic.ContentBlockParam[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const odp = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: process.env.BRUNO_FISZKA_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM,
      messages: [{ role: "user", content: tresc }],
    });
    const t = odp.content.map((b) => (b.type === "text" ? b.text : "")).join(" ").replace(/\s+/g, " ").trim();
    return !t || /^BRAK\b/i.test(t) ? "BRAK" : t.slice(0, 600);
  } catch (e) {
    console.error("[praca zrodlo] model", e);
    return null;
  }
}

export async function opisZLinku(link: string): Promise<Zrodlo> {
  const tekst = await tekstStrony(link.trim().slice(0, 600));
  if (!tekst || tekst.length < 80) return { ok: false, blad: BLAD_LINKU };
  // Treść strony jest daną od obcej strony, nie poleceniem: model dostaje ją w znacznikach i ma tylko streścić ofertę.
  const opis = await strescOferte([{ type: "text", text: `<oferta>\n${tekst}\n</oferta>` }]);
  if (opis === "BRAK") return { ok: false, blad: "Na tej stronie nie widzimy oferty pracy dla handlowca. Wgraj ofertę jako PDF albo opisz, kogo szukasz." };
  // Model nie odpowiedział: zostaje początek strony, odczyt po słowach kluczowych i tak wyłapie branżę i miasto.
  return { ok: true, opis: opis ?? tekst.slice(0, 600) };
}

export async function opisZPdf(dane: Buffer): Promise<Zrodlo> {
  if (dane.length > PDF_MAKS_B) return { ok: false, blad: "Plik jest za duży. Najwyżej 4 MB." };
  if (dane.subarray(0, 5).toString("latin1") !== "%PDF-") return { ok: false, blad: "To nie jest plik PDF." };
  const opis = await strescOferte([
    { type: "document", source: { type: "base64", media_type: "application/pdf", data: dane.toString("base64") } },
    { type: "text", text: "Streść tę ofertę." },
  ]);
  return opis && opis !== "BRAK" ? { ok: true, opis } : { ok: false, blad: "Nie udało się odczytać oferty z tego pliku. Opisz, kogo szukasz." };
}
