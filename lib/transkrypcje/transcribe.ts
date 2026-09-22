import ytdl from "@distube/ytdl-core";

export function isValidYouTubeUrl(url: string): boolean {
  try {
    return ytdl.validateURL(url.trim());
  } catch {
    return false;
  }
}

export async function getVideoMeta(url: string): Promise<{ title: string; lengthSeconds: number }> {
  const info = await ytdl.getBasicInfo(url.trim());
  return {
    title: info.videoDetails.title,
    lengthSeconds: Number(info.videoDetails.lengthSeconds) || 0,
  };
}

// Pobiera tylko ścieżkę audio (najniższa jakość = najmniejszy plik) do bufora.
export async function downloadAudio(url: string): Promise<{ buffer: Buffer; title: string }> {
  const info = await ytdl.getInfo(url.trim());
  const title = info.videoDetails.title;
  const stream = ytdl.downloadFromInfo(info, {
    quality: "lowestaudio",
    filter: "audioonly",
  });
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return { buffer: Buffer.concat(chunks), title };
}

// Transkrypcja przez Groq (whisper-large-v3). Zwraca surowy tekst.
// UWAGA: Groq ma limit rozmiaru pliku (~25-40 MB). Dla bardzo długich wideo
// audio trzeba ciąć/przekodować — to robota dla osobnego workera (Railway).
export async function transcribeAudio(audio: Buffer): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)]), "audio.webm");
  form.append("model", "whisper-large-v3");
  form.append("response_format", "text");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq Whisper failed: ${res.status} ${detail}`);
  }
  return (await res.text()).trim();
}

// Pobranie audio + transkrypcja przez zewnętrznego workera (Railway, yt-dlp),
// bo YouTube blokuje pobieranie audio z IP Vercela.
export async function transcribeViaWorker(url: string): Promise<{ title: string; transcript: string }> {
  const base = process.env.TRANSCRIBE_WORKER_URL;
  if (!base) throw new Error("TRANSCRIBE_WORKER_URL missing");
  const res = await fetch(`${base.replace(/\/$/, "")}/transcribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TRANSCRIBE_WORKER_SECRET ?? ""}`,
    },
    body: JSON.stringify({ url: url.trim() }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Worker failed: ${res.status} ${detail}`);
  }
  const data = await res.json();
  return { title: String(data.title ?? ""), transcript: String(data.transcript ?? "") };
}
