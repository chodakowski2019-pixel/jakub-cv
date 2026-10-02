import { supabaseAdmin } from "@/lib/supabase";
import { audioRozmowyEl } from "./elevenlabs";

// Kubełek na nagrania rozmów z Bruno. Stała siedzi w lib, bo Next nie pozwala
// eksportować z route.ts niczego poza handlerami.
export const KUBELEK_BRUNO = "bruno-nagrania";
export const MAX_NAGRANIE_BAJTOW = 50 * 1024 * 1024;

/** Wgranie pliku do prywatnego kubełka. Kubełek zakłada się sam przy pierwszym pliku. */
async function wgraj(sciezka: string, dane: ArrayBuffer | Blob, typ: string): Promise<void> {
  const magazyn = supabaseAdmin.storage;
  let { error } = await magazyn.from(KUBELEK_BRUNO).upload(sciezka, dane, { contentType: typ, upsert: true });
  if (error && /not found|does not exist/i.test(error.message)) {
    const { error: bk } = await magazyn.createBucket(KUBELEK_BRUNO, { public: false, fileSizeLimit: MAX_NAGRANIE_BAJTOW });
    if (bk && !/exist/i.test(bk.message)) throw new Error(bk.message);
    ({ error } = await magazyn.from(KUBELEK_BRUNO).upload(sciezka, dane, { contentType: typ, upsert: true }));
  }
  if (error) throw new Error(error.message);
}

/**
 * Ściąga nagranie rozmowy z konta ElevenLabs do naszego kubełka i zapisuje ścieżkę
 * przy rozmowie. Po co: ElevenLabs trzyma audio u siebie, więc koniec planu albo
 * ich retencja = utrata dowodu z dźwięku (transkrypcja i ocena były u nas zawsze).
 *
 * Plik bywa gotowy kilka sekund po rozłączeniu, dlatego kilka prób z odstępem.
 * Zwraca ścieżkę w kubełku albo null, gdy się nie udało (cron spróbuje później).
 */
export async function sciagnijNagranieEl(args: { email: string; rozmowaId: string; elId: string; proby?: number }): Promise<string | null> {
  const { email, rozmowaId, elId, proby = 1 } = args;
  for (let i = 0; i < proby; i += 1) {
    if (i > 0) await new Promise((r) => setTimeout(r, 4000));
    try {
      const audio = await audioRozmowyEl(elId);
      if (!audio) continue;
      const sciezka = `${email.replace(/[^\w.@-]+/g, "_")}/${rozmowaId}.mp3`;
      await wgraj(sciezka, audio.bajty, audio.typ);
      await supabaseAdmin.from("bruno_rozmowy").update({ nagranie_sciezka: sciezka }).eq("id", rozmowaId);
      return sciezka;
    } catch (e) {
      console.error("[bruno nagranie el]", rozmowaId, e);
    }
  }
  return null;
}

/**
 * Siatka bezpieczeństwa dla powyższego: rozmowy, które mają id rozmowy ElevenLabs,
 * ale nie mają jeszcze pliku u nas. Wołane z crona, żeby nic nie zostało po ich stronie.
 */
export async function dociagnijNagraniaEl(limit = 25): Promise<{ sprawdzone: number; sciagniete: string[] }> {
  const { data } = await supabaseAdmin
    .from("bruno_rozmowy")
    .select("id, email, el_conversation_id")
    .is("nagranie_sciezka", null)
    .not("el_conversation_id", "is", null)
    .order("start", { ascending: false })
    .limit(limit);
  const sciagniete: string[] = [];
  for (const r of data ?? []) {
    const sciezka = await sciagnijNagranieEl({ email: r.email as string, rozmowaId: r.id as string, elId: r.el_conversation_id as string });
    if (sciezka) sciagniete.push(r.id as string);
  }
  return { sprawdzone: (data ?? []).length, sciagniete };
}
