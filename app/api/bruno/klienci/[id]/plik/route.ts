import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, pobierzFirme } from "@/lib/bruno/firmy";
import { crmWlaczony } from "@/lib/bruno/lejek";
import { tDla } from "@/lib/bruno/i18n";
import { dodajNotatkeCrm, dodajPlikCrm, sciezkaPlikuCrm } from "@/lib/bruno/crm";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import { AUDIO, MAX_BAJTOW, PDF, audioDoTekstu, pdfDoTekstu } from "@/lib/bruno/plik-tekst";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// 14.11 (USER_001: „przy każdym leadzie możliwość dodawania notatek, plików PDF i głosówek”). Karta klienta:
//   GET  ?nazwa=&typ=  → podpisany adres do wgrania prosto do kubełka (bruno-nagrania/crm/<firma>/<klient>/…)
//   GET  ?z=<id>       → pobranie / odsłuch pliku (podpisany adres na 1 h)
//   POST {notatka}     → notatka handlowca w historii
//   POST {sciezka, nazwa, typ} → PDF (Claude) albo audio (Whisper) → tekst; plik ZOSTAJE w kubełku, wpis „plik” w historii.
// Handlowiec tylko swoi klienci, szef wszyscy.

async function autoryzuj(idSurowe: string) {
  const email = await zalogowanyEmail();
  if (!email) return { blad: NextResponse.json({ blad: "401" }, { status: 401 }) };
  const konto = await pobierzKonto(email);
  const firma = await pobierzFirme(konto?.firma_id);
  const t = tDla(konto?.jezyk);
  if (!konto || !firma || !crmWlaczony(firma)) return { blad: NextResponse.json({ blad: t("CRM not connected.", "CRM nie jest podpięty.") }, { status: 403 }) };
  const id = Number(idSurowe);
  const { data: k } = await supabaseAdmin.from("bruno_klienci").select("handlowiec").eq("id", id).eq("firma_id", firma.id).maybeSingle();
  if (!k) return { blad: NextResponse.json({ blad: "404" }, { status: 404 }) };
  if (!czySzef(konto) && String(k.handlowiec ?? "").toLowerCase() !== email.toLowerCase()) return { blad: NextResponse.json({ blad: t("Not your client.", "To nie jest Twój klient.") }, { status: 403 }) };
  return { email: email.toLowerCase(), konto, firma, id, t, katalog: `crm/${firma.id.replace(/[^\w-]+/g, "_")}/${id}/` };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await autoryzuj((await params).id);
  if ("blad" in a) return a.blad;
  const u = new URL(req.url);
  const z = Number(u.searchParams.get("z"));
  if (z > 0) {
    const p = await sciezkaPlikuCrm(a.firma.id, a.id, z);
    if (!p) return NextResponse.json({ blad: "404" }, { status: 404 });
    const { data, error } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUrl(p.sciezka, 3600, u.searchParams.has("pobierz") ? { download: p.nazwa } : undefined);
    if (error || !data) return NextResponse.json({ blad: error?.message ?? "plik" }, { status: 500 });
    return NextResponse.redirect(data.signedUrl);
  }
  const nazwa = (u.searchParams.get("nazwa") ?? "plik").replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const typ = u.searchParams.get("typ") ?? "";
  if (!AUDIO.test(typ) && !AUDIO.test(nazwa) && !PDF.test(typ) && !PDF.test(nazwa)) return NextResponse.json({ blad: a.t("Only PDF and audio files.", "Tylko PDF i pliki audio.") }, { status: 400 });
  const sciezka = `${a.katalog}${Date.now()}-${nazwa}`;
  const r = await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUploadUrl(sciezka);
  if (r.error || !r.data) return NextResponse.json({ blad: r.error?.message ?? "upload" }, { status: 500 });
  return NextResponse.json({ sciezka, url: r.data.signedUrl });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await autoryzuj((await params).id);
  if ("blad" in a) return a.blad;
  const jezyk = a.konto.jezyk === "pl" ? "pl" : "en";
  const b = (await req.json().catch(() => ({}))) as { notatka?: string; sciezka?: string; nazwa?: string; typ?: string };
  try {
    if (typeof b.notatka === "string") {
      const tresc = b.notatka.trim();
      if (!tresc) return NextResponse.json({ blad: a.t("Write a note.", "Wpisz notatkę.") }, { status: 400 });
      await dodajNotatkeCrm(a.firma.id, a.id, tresc, a.email, false);
      return NextResponse.json({ ok: true });
    }
    if (!b.sciezka || !b.sciezka.startsWith(a.katalog)) return NextResponse.json({ blad: a.t("Bad path.", "Zła ścieżka.") }, { status: 400 });
    const nazwa = b.nazwa ?? b.sciezka.split("/").pop() ?? "plik";
    const typ = b.typ ?? "";
    const rodzaj = PDF.test(typ) || PDF.test(nazwa) ? "pdf" : AUDIO.test(typ) || AUDIO.test(nazwa) ? "audio" : null;
    if (!rodzaj) return NextResponse.json({ blad: a.t("Only PDF and audio files.", "Tylko PDF i pliki audio.") }, { status: 400 });
    const { data, error } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).download(b.sciezka);
    if (error || !data) throw new Error(error?.message ?? "download");
    const bajty = await data.arrayBuffer();
    if (bajty.byteLength > MAX_BAJTOW) {
      void supabaseAdmin.storage.from(KUBELEK_BRUNO).remove([b.sciezka]).catch(() => null);
      return NextResponse.json({ blad: a.t("File over 25 MB.", "Plik ponad 25 MB.") }, { status: 413 });
    }
    const tekst = rodzaj === "pdf" ? await pdfDoTekstu(bajty, jezyk) : await audioDoTekstu(bajty, nazwa, typ, jezyk);
    await dodajPlikCrm(a.firma.id, a.id, { sciezka: b.sciezka, nazwa, rodzaj, tekst: tekst || "–" }, a.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno klient plik]", e);
    return NextResponse.json({ blad: String((e as Error)?.message ?? e).slice(0, 300) }, { status: 500 });
  }
}
