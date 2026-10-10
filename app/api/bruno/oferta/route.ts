import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { dostepKonta, pobierzKonto } from "@/lib/bruno/db";

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
    throw new Error("That website address doesn't look right.");
  }
  if (!/^https?:$/.test(u.protocol)) throw new Error("The address must start with https://");
  const odp = await fetch(u.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BrunoAI/1.0; +https://jakubchodakowski.com/bruno)", Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!odp.ok) throw new Error(`The website responded with ${odp.status}.`);
  const html = await odp.text();
  const tekst = htmlDoTekstu(html).slice(0, MAX_TEKST);
  if (tekst.length < 200) throw new Error("This page has almost no text (it may load with a script). Upload a PDF instead.");
  return tekst;
}

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: "Log in." }, { status: 401 });
  const konto = await pobierzKonto(email);
  // 10.10: także konto free (USER_001: darmowy użytkownik konfiguruje Bruno pod siebie, z linkiem do strony).
  if (!dostepKonta(konto).oferta) return NextResponse.json({ ok: false, blad: "Loading your offer is part of full access." }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ ok: false, blad: "The model key is missing on the server." }, { status: 500 });

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, blad: "Wrong request format." }, { status: 400 });
  }
  const url = String(fd.get("url") ?? "").trim();
  const plik = fd.get("plik");
  const pdf = plik instanceof File && plik.size > 0 ? plik : null;
  if (!url && !pdf) return NextResponse.json({ ok: false, blad: "Enter a website address or upload a PDF." }, { status: 400 });
  if (pdf && pdf.size > MAX_PDF) return NextResponse.json({ ok: false, blad: "The PDF is too big (max 8 MB)." }, { status: 400 });
  if (pdf && !/pdf/i.test(pdf.type) && !/\.pdf$/i.test(pdf.name)) return NextResponse.json({ ok: false, blad: "The file must be a PDF." }, { status: 400 });

  const zrodla: string[] = [];
  const tresc: Anthropic.Messages.ContentBlockParam[] = [];
  try {
    if (url) {
      const t = await tekstZeStrony(url);
      zrodla.push(new URL(url.startsWith("http") ? url : `https://${url}`).hostname);
      tresc.push({ type: "text", text: `TEXT FROM THE WEBSITE ${url}:\n\n${t}` });
    }
    if (pdf) {
      const b64 = Buffer.from(await pdf.arrayBuffer()).toString("base64");
      zrodla.push(pdf.name);
      tresc.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, blad: e instanceof Error ? e.message : "Couldn't load the materials." }, { status: 400 });
  }
  tresc.push({
    type: "text",
    text: "Using the company materials above, fill in the setup fields for a sales training tool. Write in plain American English, be specific, no marketing adjectives. Copy numbers and prices exactly if they are there. If something is not in the materials, keep that field short and don't make anything up.",
  });

  try {
    const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const odp = await klient.messages.create({
      model: process.env.BRUNO_TRENER_MODEL ?? "claude-sonnet-5",
      max_tokens: 1500,
      system:
        "You are an assistant that turns company materials (website, PDF offer) into input for an AI that plays the CUSTOMER in sales training. We need FACTS about the offer (product, prices, terms, what the customer gets), a profile of the typical customer (who buys, what they fear, who makes the decision), and the objections this customer really raises, each with one sentence explaining what they mean. Collect the sales points separately as bullet points for a script. Write in plain American English.",
      messages: [{ role: "user", content: tresc }],
      tools: [
        {
          name: "konfiguracja_bruno",
          description: "Suggested “Customize Bruno” fields based on the company materials.",
          input_schema: {
            type: "object",
            properties: {
              produkt: { type: "string", description: "What the company sells, to whom, how much it costs, what the customer pays for. 2-5 sentences, only facts from the materials." },
              klient: { type: "string", description: "Who the typical customer is: their situation, what they fear, who makes the decision. 2-4 sentences." },
              obiekcje: { type: "array", items: { type: "object", properties: { obiekcja: { type: "string" }, wyjasnienie: { type: "string" } }, required: ["obiekcja", "wyjasnienie"] }, description: "4-8 objections in the customer's own words + what they mean." },
              argumenty: { type: "array", items: { type: "string" }, description: "3-8 sales points/proof from the materials (numbers, guarantees, references) for the script." },
            },
            required: ["produkt", "klient", "obiekcje"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "konfiguracja_bruno" },
    });
    const blok = odp.content.find((c) => c.type === "tool_use");
    if (!blok || blok.type !== "tool_use") throw new Error("The model didn't return a suggestion.");
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
        skrypt: skrypt ? `Points from your offer:\n${skrypt}`.slice(0, 4000) : "",
        zrodlo: zrodla.join(", "),
      },
    });
  } catch (e) {
    console.error("[bruno oferta]", e);
    return NextResponse.json({ ok: false, blad: "Couldn't read your offer. Try a different file or address." }, { status: 502 });
  }
}
