import Anthropic from "@anthropic-ai/sdk";

export type Analysis = {
  shortSummary: string; // 2-3 zdania
  keyPoints: string[]; // najważniejsze punkty
  explanation: string; // dłuższe wyjaśnienie o czym jest film
};

const PROMPT = (title: string, transcript: string) => `Jesteś analitykiem treści wideo. Na podstawie transkrypcji filmu z YouTube przygotuj analizę PO POLSKU (niezależnie od języka filmu).

Tytuł filmu: ${title}

Transkrypcja:
"""
${transcript}
"""

Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez komentarzy) w formacie:
{
  "shortSummary": "2-3 zdania o czym jest film",
  "keyPoints": ["punkt 1", "punkt 2", "..."],
  "explanation": "dłuższe wyjaśnienie (3-6 akapitów) o czym jest film, jakie są główne tezy, wnioski i dla kogo jest wartościowy"
}

Wymagania:
- keyPoints: od 5 do 10 najważniejszych punktów, każdy konkretny
- całość po polsku, prosto i zrozumiale
- jeśli transkrypcja jest pusta lub bez sensu, zwróć puste pola`;

function safeParse(text: string): Analysis {
  let raw = text.trim();
  // usuń ewentualne ```json ... ```
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
  const parsed = JSON.parse(raw);
  return {
    shortSummary: String(parsed.shortSummary ?? ""),
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
    explanation: String(parsed.explanation ?? ""),
  };
}

export async function analyzeTranscript(transcript: string, title: string): Promise<Analysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  const anthropic = new Anthropic({ apiKey });

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: PROMPT(title, transcript.slice(0, 120000)) }],
  });

  const textPart = msg.content.find((c) => c.type === "text");
  const text = textPart && "text" in textPart ? textPart.text : "";
  return safeParse(text);
}
