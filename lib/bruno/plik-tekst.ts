import Anthropic from "@anthropic-ai/sdk";

// 5.11: plik → tekst (PDF czyta Claude Haiku, audio → OpenAI Whisper). 14.11: wspólne dla czatu (/api/bruno/kokpit/plik)
// i karty klienta (/api/bruno/klienci/[id]/plik). Tylko serwer.

export const MAX_BAJTOW = 25 * 1024 * 1024; // limit Whispera
export const AUDIO = /^audio\/|\.(mp3|m4a|wav|webm|ogg|mp4|mpeg|mpga)$/i;
export const PDF = /^application\/pdf$|\.pdf$/i;

export async function pdfDoTekstu(bajty: ArrayBuffer, jezyk: "pl" | "en"): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Brak ANTHROPIC_API_KEY.");
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await klient.messages.create({
    model: process.env.BRUNO_PLIK_MODEL ?? "claude-haiku-5-5",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: Buffer.from(bajty).toString("base64") } },
          { type: "text", text: jezyk === "pl" ? "Przepisz treść tego dokumentu jako zwykły tekst: wszystkie fakty, nazwy, osoby, kwoty, daty, warunki. Bez komentarza, bez wstępu. Jeśli dokument jest długi, streść sekcje, ale kwoty i daty zostaw co do jednej. Max 6000 znaków." : "Transcribe this document as plain text: every fact, name, person, amount, date, term. No commentary, no intro. If long, summarize sections but keep every amount and date. Max 6000 characters." },
        ],
      },
    ],
  });
  return res.content.filter((c): c is Anthropic.TextBlock => c.type === "text").map((c) => c.text).join("\n").trim();
}

export async function audioDoTekstu(bajty: ArrayBuffer, nazwa: string, typ: string, jezyk: "pl" | "en"): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error("Brak OPENAI_API_KEY (transkrypcja).");
  const fd = new FormData();
  fd.append("file", new Blob([bajty], { type: typ || "audio/mpeg" }), nazwa);
  fd.append("model", process.env.BRUNO_WHISPER_MODEL ?? "whisper-1");
  fd.append("language", jezyk);
  fd.append("response_format", "text");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: fd });
  const tekst = await r.text();
  if (!r.ok) throw new Error(`Whisper ${r.status}: ${tekst.slice(0, 200)}`);
  return tekst.trim();
}
