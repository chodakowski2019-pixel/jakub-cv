// 8.11 (USER_001: „dodałem mp4 i go nie odczytał: Plik ponad 25 MB”). Tylko przeglądarka.
// Whisper przyjmuje max 25 MB na plik. Film albo duże nagranie: przeglądarka wyciąga sam dźwięk,
// robi z niego mono 16 kHz (tyle potrzebuje Whisper) i tnie na kawałki WAV po 10 min (ok. 19 MB każdy).
// Każdy kawałek idzie osobno przez /api/bruno/kokpit/plik, teksty skleja czat.

const CZESTOTLIWOSC = 16000;
const MINUT_NA_KAWALEK = 10;
export const LIMIT_WHISPER = 24 * 1024 * 1024;

/** Czy plik trzeba przerobić w przeglądarce: każdy film i każde audio ponad 24 MB. */
export function trzebaPrzerobic(f: File): boolean {
  const wideo = /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(f.name);
  const audio = /^audio\//.test(f.type) || /\.(mp3|m4a|wav|ogg|aac|flac|opus)$/i.test(f.name);
  return wideo || (audio && f.size > LIMIT_WHISPER);
}

function wav(probki: Float32Array, czest: number): Blob {
  const bufor = new ArrayBuffer(44 + probki.length * 2);
  const v = new DataView(bufor);
  const pisz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  pisz(0, "RIFF");
  v.setUint32(4, 36 + probki.length * 2, true);
  pisz(8, "WAVE");
  pisz(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, czest, true);
  v.setUint32(28, czest * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  pisz(36, "data");
  v.setUint32(40, probki.length * 2, true);
  for (let i = 0; i < probki.length; i++) {
    const s = Math.max(-1, Math.min(1, probki[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([bufor], { type: "audio/wav" });
}

/** Film / duże audio → lista plików WAV (mono 16 kHz, po 10 min). Rzuca błąd, gdy przeglądarka nie umie odczytać dźwięku. */
export async function naKawalkiAudio(f: File): Promise<File[]> {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const AC = w.AudioContext || w.webkitAudioContext;
  if (!AC) throw new Error("przeglądarka nie obsługuje dźwięku, wgraj mp3");
  let ac: AudioContext;
  try {
    ac = new AC({ sampleRate: CZESTOTLIWOSC });
  } catch {
    ac = new AC();
  }
  let dzwiek: AudioBuffer;
  try {
    dzwiek = await ac.decodeAudioData(await f.arrayBuffer());
  } catch {
    throw new Error("nie da się wyciągnąć dźwięku z tego pliku, wgraj mp3 albo m4a");
  } finally {
    void ac.close().catch(() => null);
  }
  // Mono = średnia kanałów.
  const kanaly = Array.from({ length: dzwiek.numberOfChannels }, (_, i) => dzwiek.getChannelData(i));
  let mono = new Float32Array(dzwiek.length);
  for (const k of kanaly) for (let i = 0; i < k.length; i++) mono[i] += k[i] / kanaly.length;
  // Gdy przeglądarka zignorowała sampleRate (stare Safari), zmniejsz próbkowanie ręcznie.
  let czest = dzwiek.sampleRate;
  if (czest > CZESTOTLIWOSC * 1.5) {
    const krok = Math.round(czest / CZESTOTLIWOSC);
    const mniej = new Float32Array(Math.floor(mono.length / krok));
    for (let i = 0; i < mniej.length; i++) {
      let s = 0;
      for (let j = 0; j < krok; j++) s += mono[i * krok + j];
      mniej[i] = s / krok;
    }
    mono = mniej;
    czest = Math.round(czest / krok);
  }
  const naKawalek = czest * 60 * MINUT_NA_KAWALEK;
  const baza = f.name.replace(/\.[^.]+$/, "");
  const pliki: File[] = [];
  for (let i = 0, n = 1; i < mono.length; i += naKawalek, n++) {
    pliki.push(new File([wav(mono.subarray(i, i + naKawalek), czest)], `${baza}-${n}.wav`, { type: "audio/wav" }));
  }
  if (!pliki.length) throw new Error("plik nie ma dźwięku");
  return pliki;
}
