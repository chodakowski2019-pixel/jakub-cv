import Anthropic from "@anthropic-ai/sdk";

export type SummarySection = {
  heading: string; // krótki tytuł wątku
  detail: string; // 3-5 zdań konkretnej treści tego wątku
};

export type Analysis = {
  shortSummary: string; // 2-3 zdania w pigułce
  sections: SummarySection[]; // szczegółowe streszczenie treści, wątek po wątku
  takeaways: string[]; // krótkie praktyczne wnioski
};

const PROMPT = (title: string, transcript: string) => `Jesteś analitykiem treści wideo. Na podstawie transkrypcji filmu z YouTube przygotuj SZCZEGÓŁOWE STRESZCZENIE PO POLSKU (niezależnie od języka filmu).

Cel: osoba, która NIE obejrzała filmu, po przeczytaniu zna całą jego treść i najważniejsze myśli — bez oglądania. To ma być streszczenie TREŚCI filmu, nie wyrywki tekstu.

Tytuł filmu: ${title}

Transkrypcja:
"""
${transcript}
"""

Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez komentarzy) w formacie:
{
  "shortSummary": "2-3 zdania: o czym jest film w pigułce",
  "sections": [
    { "heading": "krótki tytuł wątku/punktu", "detail": "3-5 zdań KONKRETNEJ treści: co dokładnie autor mówi w tym wątku, jakie podaje argumenty, przykłady, liczby, wnioski" }
  ],
  "takeaways": ["praktyczny wniosek lub rada z filmu", "..."]
}

Wymagania:
- sections: od 6 do 14 wątków, w KOLEJNOŚCI filmu. Razem mają oddać CAŁY film szczegółowo, krok po kroku. Każdy wątek to realna porcja treści, nie ogólnik.
- detail: konkrety z filmu (tezy, przykłady, nazwy, liczby), własnymi słowami. Bez lania wody, bez cytowania surowego tekstu.
- takeaways: od 3 do 6 krótkich, praktycznych wniosków/rad płynących z filmu.
- całość po polsku, prosto i zrozumiale.
- jeśli transkrypcja jest pusta lub bez sensu, zwróć puste pola.`;

export function parseAnalysis(text: string): Analysis {
  let raw = text.trim();
  // usuń ewentualne ```json ... ```
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
  const parsed = JSON.parse(raw);
  const sections = Array.isArray(parsed.sections)
    ? parsed.sections
        .map((s: unknown) => {
          const o = (s ?? {}) as Record<string, unknown>;
          return { heading: String(o.heading ?? ""), detail: String(o.detail ?? "") };
        })
        .filter((s: SummarySection) => s.heading || s.detail)
    : [];
  return {
    shortSummary: String(parsed.shortSummary ?? ""),
    sections,
    takeaways: Array.isArray(parsed.takeaways) ? parsed.takeaways.map(String) : [],
  };
}

export async function analyzeTranscript(transcript: string, title: string): Promise<Analysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  const anthropic = new Anthropic({ apiKey });

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    messages: [{ role: "user", content: PROMPT(title, transcript.slice(0, 120000)) }],
  });

  const textPart = msg.content.find((c) => c.type === "text");
  const text = textPart && "text" in textPart ? textPart.text : "";
  return parseAnalysis(text);
}
