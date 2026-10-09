import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pelnyDostep, pobierzKonto } from "@/lib/bruno/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/bruno/oferta (9.10, MODUŁ PŁATNY: tylko konta `plan = pelny`).
// Wejście: multipart z `url` (strona firmy) i/lub `plik` (PDF z ofertą, do 8 MB).
// Wyjście: propozycja pól „Dostosuj Bruno" (produkt, klient, obiekcje z wyjaśnieniem,
// argumenty do skryptu). Nic nie zapisuje: handlowiec akceptuje w formularzu.
// Dlaczego: Bruno zmyślał ofertę (8.10, Aleksandra: „pompa ciepła" zamiast kotła),
// bo znał tylko trzy zdania z konfiguracji.

const MAX_PDF = 8 * 1024 * 1024;
const MAX_TEKST = 60_000;

function htmlDoTekstu(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

async function tekstZeStrony(url: string): Promise<string> {
  let u: URL;
  try {
    u = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    throw new Error("Zły adres strony.");
  }
  if (!/^https?:$/.test(u.protocol)) throw new Error("Adres musi zaczynać się od https://");
  const odp = await fetch(u.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BrunoAI/1.0; +https://jakubchodakowski.com/bruno)", Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!odp.ok) throw new Error(`Strona odpowiedziała ${odp.status}.`);
  const html = await odp.text();
  const tekst = htmlDoTekstu(html).slice(0, MAX_TEKST);
  if (tekst.length < 200) throw new Error("Na tej stronie prawie nie ma tekstu (może ładuje się skryptem). Wgraj PDF.");
  return tekst;
}

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: "Zaloguj się." }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!pelnyDostep(konto)) return NextResponse.json({ ok: false, blad: "Wczytywanie oferty jest w pełnym dostępie." }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ ok: false, blad: "Brak klucza modelu na serwerze." }, { status: 500 });

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, blad: "Zły format żądania." }, { status: 400 });
  }
  const url = String(fd.get("url") ?? "").trim();
  const plik = fd.get("plik");
  const pdf = plik instanceof File && plik.size > 0 ? plik : null;
  if (!url && !pdf) return NextResponse.json({ ok: false, blad: "Podaj adres strony albo PDF." }, { status: 400 });
  if (pdf && pdf.size > MAX_PDF) return NextResponse.json({ ok: false, blad: "PDF jest za duży (max 8 MB)." }, { status: 400 });
  if (pdf && !/pdf/i.test(pdf.type) && !/\.pdf$/i.test(pdf.name)) return NextResponse.json({ ok: false, blad: "Plik musi być PDF-em." }, { status: 400 });

  const zrodla: string[] = [];
  const tresc: Anthropic.Messages.ContentBlockParam[] = [];
  try {
    if (url) {
      const t = await tekstZeStrony(url);
      zrodla.push(new URL(url.startsWith("http") ? url : `https://${url}`).hostname);
      tresc.push({ type: "text", text: `TEKST ZE STRONY ${url}:\n\n${t}` });
    }
    if (pdf) {
      const b64 = Buffer.from(await pdf.arrayBuffer()).toString("base64");
      zrodla.push(pdf.name);
      tresc.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, blad: e instanceof Error ? e.message : "Nie udało się pobrać materiałów." }, { status: 400 });
  }
  tresc.push({
    type: "text",
    text: "Z powyższych materiałów firmy wypełnij pola konfiguracji trenażera sprzedaży. Pisz po polsku, konkretnie, bez marketingowych przymiotników. Liczby i ceny przepisuj dokładnie, jeśli są. Jeśli czegoś nie ma w materiałach, zostaw pole krótkie i nie zmyślaj.",
  });

  try {
    const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const odp = await klient.messages.create({
      model: process.env.BRUNO_TRENER_MODEL ?? "claude-sonnet-5",
      max_tokens: 1500,
      system:
        "Jesteś asystentem, który z materiałów firmy (strona, oferta PDF) przygotowuje wsad dla AI grającego KLIENTA w treningu sprzedaży. Potrzebne są FAKTY o ofercie (produkt, ceny, warunki, co klient dostaje), portret typowego klienta (kto kupuje, czego się boi, kto decyduje) i obiekcje, jakie taki klient realnie podnosi, każda z jednym zdaniem wyjaśnienia, co ma na myśli. Argumenty handlowe zbierz osobno jako punkty do skryptu.",
      messages: [{ role: "user", content: tresc }],
      tools: [
        {
          name: "konfiguracja_bruno",
          description: "Propozycja pól „Dostosuj Bruno” z materiałów firmy.",
          input_schema: {
            type: "object",
            properties: {
              produkt: { type: "string", description: "Co firma sprzedaje, dla kogo, ile kosztuje, za co klient płaci. 2-5 zdań, same fakty z materiałów." },
              klient: { type: "string", description: "Kim jest typowy klient: sytuacja, czego się boi, kto decyduje. 2-4 zdania." },
              obiekcje: { type: "array", items: { type: "object", properties: { obiekcja: { type: "string" }, wyjasnienie: { type: "string" } }, required: ["obiekcja", "wyjasnienie"] }, description: "4-8 obiekcji słowami klienta + co ma na myśli." },
              argumenty: { type: "array", items: { type: "string" }, description: "3-8 argumentów/dowodów z materiałów (liczby, gwarancje, referencje) do skryptu." },
            },
            required: ["produkt", "klient", "obiekcje"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "konfiguracja_bruno" },
    });
    const blok = odp.content.find((c) => c.type === "tool_use");
    if (!blok || blok.type !== "tool_use") throw new Error("Model nie zwrócił propozycji.");
    const r = blok.input as { produkt?: string; klient?: string; obiekcje?: { obiekcja: string; wyjasnienie?: string }[]; argumenty?: string[] };
    const obiekcje = (r.obiekcje ?? [])
      .filter((o) => o && typeof o.obiekcja === "string" && o.obiekcja.trim().length >= 3)
      .slice(0, 10)
      .map((o) => (o.wyjasnienie?.trim() ? `${o.obiekcja.trim()} | ${o.wyjasnienie.trim()}` : o.obiekcja.trim()))
      .join("\n");
    const skrypt = (r.argumenty ?? []).filter((a) => typeof a === "string" && a.trim()).slice(0, 10).map((a) => `- ${a.trim()}`).join("\n");
    return NextResponse.json({
      ok: true,
      propozycja: {
        produkt: String(r.produkt ?? "").slice(0, 1500),
        klient: String(r.klient ?? "").slice(0, 2000),
        obiekcje: obiekcje.slice(0, 3000),
        skrypt: skrypt ? `Argumenty z oferty:\n${skrypt}`.slice(0, 4000) : "",
        zrodlo: zrodla.join(", "),
      },
    });
  } catch (e) {
    console.error("[bruno oferta]", e);
    return NextResponse.json({ ok: false, blad: "Nie udało się odczytać oferty. Spróbuj z innym plikiem albo adresem." }, { status: 502 });
  }
}
