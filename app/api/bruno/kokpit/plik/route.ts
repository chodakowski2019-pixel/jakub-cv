import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { crmWlaczony } from "@/lib/bruno/lejek";
import { tDla } from "@/lib/bruno/i18n";
import { supabaseAdmin } from "@/lib/supabase";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import { AUDIO, MAX_BAJTOW, PDF, audioDoTekstu, pdfDoTekstu } from "@/lib/bruno/plik-tekst";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// 5.11 (USER_001, pkt 3: „do Bruno ma być możliwość dodawania plików PDF i mp3”). Plik → TEKST, który czat dokleja
// do wiadomości użytkownika. Vercel przyjmuje w żądaniu max 4,5 MB, więc duże pliki idą w 2 krokach:
//   GET  ?nazwa=&typ=  → podpisany adres do wgrania prosto do prywatnego kubełka Supabase (bruno-nagrania/kokpit/…)
//   POST {sciezka, nazwa, typ} → serwer ściąga z kubełka, PDF czyta Claude (Haiku, blok document), audio → OpenAI Whisper.
// Małe pliki (< 4 MB) można wysłać od razu jako multipart POST (pole `plik`). Wynik: { nazwa, typ, tekst }.

const MAX_TEKST = 20000; // 8.11: 10 min nagrania = ok. 10 000 znaków

async function autoryzuj() {
  const email = await zalogowanyEmail();
  if (!email) return { blad: NextResponse.json({ blad: "401" }, { status: 401 }) };
  const konto = await pobierzKonto(email);
  const firma = await pobierzFirme(konto?.firma_id);
  const t = tDla(konto?.jezyk);
  if (!konto || !crmWlaczony(firma)) return { blad: NextResponse.json({ blad: t("CRM not connected.", "CRM nie jest podpięty.") }, { status: 403 }) };
  return { email, konto, t };
}

export async function GET(req: Request) {
  const a = await autoryzuj();
  if ("blad" in a) return a.blad;
  const u = new URL(req.url);
  const nazwa = (u.searchParams.get("nazwa") ?? "plik").replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const typ = u.searchParams.get("typ") ?? "";
  if (!AUDIO.test(typ) && !AUDIO.test(nazwa) && !PDF.test(typ) && !PDF.test(nazwa)) return NextResponse.json({ blad: a.t("Only PDF and audio files.", "Tylko PDF i pliki audio.") }, { status: 400 });
  const sciezka = `kokpit/${a.email.replace(/[^\w.@-]+/g, "_")}/${Date.now()}-${nazwa}`;
  const m = supabaseAdmin.storage;
  let r = await m.from(KUBELEK_BRUNO).createSignedUploadUrl(sciezka);
  if (r.error && /not found|does not exist/i.test(r.error.message)) {
    await m.createBucket(KUBELEK_BRUNO, { public: false, fileSizeLimit: 50 * 1024 * 1024 }).catch(() => null);
    r = await m.from(KUBELEK_BRUNO).createSignedUploadUrl(sciezka);
  }
  if (r.error || !r.data) return NextResponse.json({ blad: r.error?.message ?? "upload" }, { status: 500 });
  return NextResponse.json({ sciezka, url: r.data.signedUrl, token: r.data.token });
}

export async function POST(req: Request) {
  const a = await autoryzuj();
  if ("blad" in a) return a.blad;
  const jezyk = a.konto.jezyk === "pl" ? "pl" : "en";
  let bajty: ArrayBuffer;
  let nazwa = "plik";
  let typ = "";
  let sciezka: string | null = null;
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const p = fd.get("plik");
      if (!(p instanceof File)) return NextResponse.json({ blad: a.t("No file.", "Brak pliku.") }, { status: 400 });
      nazwa = p.name;
      typ = p.type;
      bajty = await p.arrayBuffer();
    } else {
      const b = (await req.json().catch(() => ({}))) as { sciezka?: string; nazwa?: string; typ?: string };
      if (!b.sciezka || !b.sciezka.startsWith(`kokpit/${a.email.replace(/[^\w.@-]+/g, "_")}/`)) return NextResponse.json({ blad: a.t("Bad path.", "Zła ścieżka.") }, { status: 400 });
      sciezka = b.sciezka;
      nazwa = b.nazwa ?? b.sciezka.split("/").pop() ?? "plik";
      typ = b.typ ?? "";
      const { data, error } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).download(b.sciezka);
      if (error || !data) throw new Error(error?.message ?? "download");
      bajty = await data.arrayBuffer();
    }
    if (bajty.byteLength > MAX_BAJTOW) return NextResponse.json({ blad: a.t("File over 25 MB.", "Plik ponad 25 MB.") }, { status: 413 });
    let tekst: string;
    let rodzaj: "pdf" | "audio";
    if (PDF.test(typ) || PDF.test(nazwa)) {
      rodzaj = "pdf";
      tekst = await pdfDoTekstu(bajty, jezyk);
    } else if (AUDIO.test(typ) || AUDIO.test(nazwa)) {
      rodzaj = "audio";
      tekst = await audioDoTekstu(bajty, nazwa, typ, jezyk);
    } else {
      return NextResponse.json({ blad: a.t("Only PDF and audio files.", "Tylko PDF i pliki audio.") }, { status: 400 });
    }
    return NextResponse.json({ nazwa, typ: rodzaj, tekst: tekst.slice(0, MAX_TEKST) });
  } catch (e) {
    console.error("[bruno kokpit plik]", e);
    return NextResponse.json({ blad: String((e as Error)?.message ?? e).slice(0, 300) }, { status: 500 });
  } finally {
    if (sciezka) void supabaseAdmin.storage.from(KUBELEK_BRUNO).remove([sciezka]).catch(() => null);
  }
}
