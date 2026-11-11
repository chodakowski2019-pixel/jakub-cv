import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { zalogowanePraca, zapiszCV } from "@/lib/bruno/praca/konta";
import { CV_MAKS_B, FOTO_MAKS_B, KROKI, sprawdz } from "@/lib/bruno/praca/profil-handlowca";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/profil-handlowca (11.11): kandydat wysyła formularz do bazy handlowców (multipart).
// Pola: odpowiedzi (JSON), zgoda, cv (PDF, nieobowiązkowe), zdjecie (JPEG zmniejszony w przeglądarce, nieobowiązkowe).
// Zapis w praca_profile_handlowcow ze statusem „weryfikacja” + kopia danych kontaktowych w praca_konta + mail do USER_001.
// Pliki w prywatnym magazynie praca-cv (kandydaci/<id konta>/), pobieranie tylko podpisanym linkiem z serwera.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const zaczynaSie = (b: Buffer, bajty: number[]) => bajty.every((x, i) => b[i] === x);

export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || konto.typ !== "kandydat") return NextResponse.json({ ok: false, blad: "Zaloguj się na konto kandydata." }, { status: 401 });
  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ ok: false, blad: "Nie udało się odczytać formularza." }, { status: 400 });
  if (f.get("zgoda") !== "tak") return NextResponse.json({ ok: false, blad: "Zaznacz zgodę na pokazanie profilu pracodawcom." }, { status: 400 });
  let surowe: unknown = null;
  try {
    surowe = JSON.parse(String(f.get("odpowiedzi") ?? ""));
  } catch {}
  const w = sprawdz(surowe);
  if (!w.ok) return NextResponse.json({ ok: false, blad: w.blad, krok: w.krok, klucz: w.klucz }, { status: 400 });
  const d = w.odpowiedzi;
  const ostatni = KROKI.length - 1;

  // CV: tylko PDF (rozszerzenie + nagłówek pliku).
  const cv = f.get("cv");
  let cvPlik: { nazwa: string; dane: Buffer; typ: string } | null = null;
  if (cv instanceof File && cv.size > 0) {
    if (cv.size > CV_MAKS_B) return NextResponse.json({ ok: false, blad: "CV może mieć najwyżej 3 MB.", krok: ostatni }, { status: 400 });
    const dane = Buffer.from(await cv.arrayBuffer());
    if (!/\.pdf$/i.test(cv.name) || !zaczynaSie(dane, [0x25, 0x50, 0x44, 0x46])) return NextResponse.json({ ok: false, blad: "CV tylko w formacie PDF.", krok: ostatni }, { status: 400 });
    cvPlik = { nazwa: cv.name.replace(/[^\w.\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]/g, "_").slice(0, 120), dane, typ: "application/pdf" };
  }
  // Zdjęcie: JPEG przygotowany przez formularz.
  const foto = f.get("zdjecie");
  let fotoDane: Buffer | null = null;
  if (foto instanceof File && foto.size > 0) {
    if (foto.size > FOTO_MAKS_B) return NextResponse.json({ ok: false, blad: "Zdjęcie jest za duże. Wybierz je jeszcze raz.", krok: ostatni }, { status: 400 });
    fotoDane = Buffer.from(await foto.arrayBuffer());
    if (!zaczynaSie(fotoDane, [0xff, 0xd8, 0xff])) return NextResponse.json({ ok: false, blad: "Zdjęcie w formacie JPG, PNG albo WEBP.", krok: ostatni }, { status: 400 });
  }

  const zmianyKonta: Record<string, unknown> = { imie: d.imie, telefon: d.telefon, miasto: d.miasto, tytul: d.stanowisko, linkedin: d.linkedin ?? konto.linkedin, pref_pensja: Number(d.pensja) };
  if (cvPlik) {
    const sciezka = await zapiszCV(`kandydaci/${konto.id}`, cvPlik);
    if (!sciezka) return NextResponse.json({ ok: false, blad: "Nie udało się zapisać CV. Spróbuj ponownie.", krok: ostatni }, { status: 500 });
    Object.assign(zmianyKonta, { cv_sciezka: sciezka, cv_nazwa: cvPlik.nazwa });
  }
  const profil: Record<string, unknown> = { konto_id: konto.id, odpowiedzi: d, status: "weryfikacja", zgoda_pracodawcy: true, updated_at: new Date().toISOString() };
  if (fotoDane) {
    const sciezka = `kandydaci/${konto.id}/zdjecie-${Date.now()}.jpg`;
    const { error } = await supabaseAdmin.storage.from("praca-cv").upload(sciezka, fotoDane, { contentType: "image/jpeg", upsert: false });
    if (error) {
      console.error("[praca profil handlowca] zdjecie", error.message);
      return NextResponse.json({ ok: false, blad: "Nie udało się zapisać zdjęcia. Spróbuj ponownie.", krok: ostatni }, { status: 500 });
    }
    profil.zdjecie_sciezka = sciezka;
  }

  const { error } = await supabaseAdmin.from("praca_profile_handlowcow").upsert(profil, { onConflict: "konto_id" });
  if (error) {
    console.error("[praca profil handlowca]", error);
    return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  }
  await supabaseAdmin.from("praca_konta").update(zmianyKonta).eq("id", konto.id);

  try {
    const wiersze = KROKI.flatMap((k) => k.pytania)
      .map((p) => `<b>${esc(p.pytanie)}:</b> ${esc([d[p.klucz] ?? "-"].flat().join(", "))}`)
      .join("<br/>");
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: konto.email,
      rodzaj: "inny",
      temat: `Praca: profil handlowca do weryfikacji: ${d.imie}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Nowy profil w bazie handlowców. Czeka na weryfikację (do 7 dni).</p><p><b>E-mail:</b> ${esc(konto.email)}<br/>${wiersze}<br/><b>CV:</b> ${cvPlik ? esc(cvPlik.nazwa) : "brak"}<br/><b>Zdjęcie:</b> ${fotoDane ? "jest" : "brak"}</p></div>`,
    });
  } catch (e) {
    console.error("[praca profil handlowca] mail", e);
  }
  return NextResponse.json({ ok: true });
}
