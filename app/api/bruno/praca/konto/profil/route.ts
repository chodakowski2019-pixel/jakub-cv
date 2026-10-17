import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { kodPasuje, poprawneHaslo, zaszyfrujKod } from "@/lib/bruno/auth";
import { plikCV, zalogowanePraca, zapiszCV } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/konto/profil (17.10): multipart, „sekcja” mówi, co zapisać.
// kandydat: dane (imie, telefon, linkedin, plik CV) · pracodawca: konto | firma (+ logo) | faktura | klauzule · obaj: haslo.
const TEKST = (f: FormData, k: string, n = 160) => String(f.get(k) ?? "").trim().slice(0, n) || null;

export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto) return NextResponse.json({ ok: false, blad: "Zaloguj się ponownie." }, { status: 401 });
  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ ok: false, blad: "Nie udało się odczytać formularza." }, { status: 400 });
  const sekcja = String(f.get("sekcja") ?? (konto.typ === "kandydat" ? "dane" : "konto"));
  const zmiany: Record<string, unknown> = {};

  if (sekcja === "haslo") {
    const { data } = await supabaseAdmin.from("praca_konta").select("haslo_hash").eq("id", konto.id).single();
    if (!kodPasuje(String(f.get("stare") ?? ""), data?.haslo_hash)) return NextResponse.json({ ok: false, blad: "Obecne hasło jest złe." }, { status: 400 });
    const nowe = poprawneHaslo(f.get("nowe"));
    if (!nowe) return NextResponse.json({ ok: false, blad: "Nowe hasło: co najmniej 8 znaków." }, { status: 400 });
    zmiany.haslo_hash = zaszyfrujKod(nowe);
  } else if (konto.typ === "kandydat" && sekcja === "osobowe") {
    Object.assign(zmiany, { imie: TEKST(f, "imie", 120), telefon: TEKST(f, "telefon", 40), miasto: TEKST(f, "miasto", 80) });
  } else if (konto.typ === "kandydat" && sekcja === "zawodowy") {
    Object.assign(zmiany, { tytul: TEKST(f, "tytul", 120), linkedin: TEKST(f, "linkedin", 300), o_mnie: TEKST(f, "o_mnie", 2000) });
  } else if (konto.typ === "kandydat" && sekcja === "preferencje") {
    const p = Number(String(f.get("pref_pensja") ?? "").replace(/\D/g, ""));
    Object.assign(zmiany, {
      pref_stanowisko: TEKST(f, "pref_stanowisko", 120),
      pref_miasto: TEKST(f, "pref_miasto", 80),
      pref_branza: TEKST(f, "pref_branza", 60),
      pref_tryb: TEKST(f, "pref_tryb", 60),
      pref_pensja: p > 0 && p < 1_000_000 ? p : null,
    });
  } else if (konto.typ === "kandydat" && sekcja === "zgody") {
    Object.assign(zmiany, { zgoda_oferty: f.get("zgoda_oferty") === "on", zgoda_marketing: f.get("zgoda_marketing") === "on" });
  } else if (konto.typ === "kandydat") {
    // „cv” = tylko plik; stary formularz (bez sekcji „dane”) = imię, telefon, LinkedIn + plik.
    if (sekcja !== "cv") Object.assign(zmiany, { imie: TEKST(f, "imie", 120), telefon: TEKST(f, "telefon", 40), linkedin: TEKST(f, "linkedin", 300) });
    const cv = await plikCV(f.get("plik"));
    if (typeof cv === "string") return NextResponse.json({ ok: false, blad: cv }, { status: 400 });
    if (cv) {
      const sciezka = await zapiszCV(`kandydaci/${konto.id}`, cv);
      if (!sciezka) return NextResponse.json({ ok: false, blad: "Nie udało się zapisać CV. Spróbuj ponownie." }, { status: 500 });
      Object.assign(zmiany, { cv_sciezka: sciezka, cv_nazwa: cv.nazwa });
    }
  } else if (sekcja === "konto") {
    Object.assign(zmiany, { imie: TEKST(f, "imie", 120), telefon: TEKST(f, "telefon", 40) });
  } else if (sekcja === "firma") {
    Object.assign(zmiany, {
      nazwa_wyswietlana: TEKST(f, "nazwa_wyswietlana"),
      o_firmie: TEKST(f, "o_firmie", 2000),
      www: TEKST(f, "www", 200),
    });
    const logo = f.get("logo");
    if (logo instanceof File && logo.size > 0) {
      if (!/\.(png|jpe?g|webp|svg)$/i.test(logo.name)) return NextResponse.json({ ok: false, blad: "Logo: PNG, JPG, WEBP albo SVG." }, { status: 400 });
      if (logo.size > 4 * 1024 * 1024) return NextResponse.json({ ok: false, blad: "Logo może mieć najwyżej 4 MB." }, { status: 400 });
      const roz = logo.name.split(".").pop()!.toLowerCase();
      const sciezka = `${konto.id}/${Date.now()}-${randomBytes(3).toString("hex")}.${roz}`;
      const { error } = await supabaseAdmin.storage.from("praca-loga").upload(sciezka, Buffer.from(await logo.arrayBuffer()), { contentType: logo.type || `image/${roz}`, upsert: false });
      if (error) return NextResponse.json({ ok: false, blad: "Nie udało się wgrać logo." }, { status: 500 });
      zmiany.logo_url = supabaseAdmin.storage.from("praca-loga").getPublicUrl(sciezka).data.publicUrl;
    }
    if (f.get("usun_logo")) zmiany.logo_url = null;
  } else if (sekcja === "faktura") {
    Object.assign(zmiany, {
      nip: String(f.get("nip") ?? "").replace(/\D/g, "").slice(0, 10) || null,
      fv_nazwa: TEKST(f, "fv_nazwa", 200),
      fv_kraj: TEKST(f, "fv_kraj", 60),
      fv_adres: TEKST(f, "fv_adres", 200),
      fv_miasto: TEKST(f, "fv_miasto", 80),
      fv_kod: TEKST(f, "fv_kod", 10),
    });
    if (zmiany.fv_nazwa) zmiany.firma = zmiany.fv_nazwa;
  } else if (sekcja === "klauzule") {
    Object.assign(zmiany, {
      klauzula_rodo: TEKST(f, "klauzula_rodo", 5000),
      klauzula_przyszle: TEKST(f, "klauzula_przyszle", 1000),
      klauzula_przyszle_domyslnie: f.get("klauzula_przyszle_domyslnie") === "on",
    });
  } else return NextResponse.json({ ok: false }, { status: 400 });

  const { error } = await supabaseAdmin.from("praca_konta").update(zmiany).eq("id", konto.id);
  if (error) return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  return NextResponse.json({ ok: true, logo_url: zmiany.logo_url });
}
