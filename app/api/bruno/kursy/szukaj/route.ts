import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { KURSY, dopasujBezAI, kursPoSlugu, type Poziom } from "@/lib/bruno/kursy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

// POST /api/bruno/kursy/szukaj (30.10, USER_001): ktoś wpisuje, jakiego szkolenia szuka → AI wybiera do 3 kursów
// z bazy `lib/bruno/kursy.ts` i krótko mówi dlaczego. Bez klucza albo przy błędzie modelu: dopasowanie po słowach.
// Wejście: { zapytanie, poziom: "start" | "pro" | null }. Wyjście: { wyniki: [{ slug, tytul, dlaczego }] }.

type Wynik = { slug: string; tytul: string; dlaczego: string };

const KATALOG = KURSY.map((k) => `${k.slug} | ${k.tytul} | ${k.branza} | poziom ${k.poziom} | ${k.obietnica}`).join("\n");

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const zapytanie = String(b.zapytanie ?? "").trim().slice(0, 1000);
  const poziom: Poziom | null = b.poziom === "start" || b.poziom === "pro" ? b.poziom : null;
  if (zapytanie.length < 3) return NextResponse.json({ ok: false, blad: "Napisz kilka słów, czego szukasz." }, { status: 400 });

  const zapas = (): Wynik[] => dopasujBezAI(zapytanie, poziom).map((k) => ({ slug: k.slug, tytul: k.tytul, dlaczego: k.obietnica }));

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ ok: true, wyniki: zapas(), ai: false });

  try {
    const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const odp = await klient.messages.create({
      model: process.env.BRUNO_KURSY_MODEL ?? "claude-haiku-5-5",
      max_tokens: 600,
      system:
        "Dobierasz kurs sprzedaży z katalogu do osoby, która opisała, czego szuka. Wybierz od 1 do 3 kursów TYLKO z katalogu, najlepszy pierwszy. " +
        "Poziom „start” = bez doświadczenia w sprzedaży, „pro” = ma doświadczenie. Do każdego jedno krótkie zdanie po polsku, na „Ty”, dlaczego pasuje do jej słów. " +
        "Bez myślników, prosto, jak do kumpla. Gdy nic nie pasuje do branży, daj „podstawy-sprzedazy” (start) albo „zamykanie-pro” (pro).\n\nKATALOG (slug | tytuł | branża | poziom | obietnica):\n" +
        KATALOG,
      tools: [
        {
          name: "wyniki",
          description: "Dobrane kursy",
          input_schema: {
            type: "object",
            properties: {
              wyniki: {
                type: "array",
                maxItems: 3,
                items: { type: "object", properties: { slug: { type: "string" }, dlaczego: { type: "string" } }, required: ["slug", "dlaczego"] },
              },
            },
            required: ["wyniki"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "wyniki" },
      messages: [{ role: "user", content: `Poziom: ${poziom ?? "nie podał"}\nCzego szuka: ${zapytanie}` }],
    });
    const blok = odp.content.find((c) => c.type === "tool_use");
    const surowe = (blok && blok.type === "tool_use" ? (blok.input as { wyniki?: { slug?: string; dlaczego?: string }[] }).wyniki : null) ?? [];
    const wyniki: Wynik[] = [];
    for (const w of surowe) {
      const k = kursPoSlugu(String(w.slug ?? ""));
      if (k && !wyniki.some((x) => x.slug === k.slug)) wyniki.push({ slug: k.slug, tytul: k.tytul, dlaczego: String(w.dlaczego ?? k.obietnica).slice(0, 300) });
    }
    return NextResponse.json({ ok: true, wyniki: wyniki.length ? wyniki : zapas(), ai: wyniki.length > 0 });
  } catch (e) {
    console.error("[bruno kursy szukaj]", e);
    return NextResponse.json({ ok: true, wyniki: zapas(), ai: false });
  }
}
