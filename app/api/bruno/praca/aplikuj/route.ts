import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { ofertaDoAplikacji } from "@/lib/bruno/praca/oferty";
import { linkCV, plikCV, zalogowanePraca, zapiszCV } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/aplikuj (17.10): kandydat aplikuje na ofertę na naszej stronie (bez wychodzenia na zewnątrz).
// v3 (konta i panele): zgłoszenie w bazie (praca_zgloszenia), CV w prywatnym magazynie (praca-cv),
// zalogowany kandydat = zgłoszenie w jego panelu, bez pliku bierze CV z profilu.
// Mail do USER_001 zawsze (z CV w załączniku). Oferta z panelu pracodawcy = mail też do firmy (zgłoszenie w jej panelu).
// Multipart: limit Vercela na ciało zapytania = 4,5 MB, więc plik do 4 MB.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ ok: false, blad: "Nie udało się odczytać formularza." }, { status: 400 });
  const g = (k: string) => String(f.get(k) ?? "").trim();
  if (g("www")) return NextResponse.json({ ok: true }); // pułapka na boty
  const cel = await ofertaDoAplikacji(g("id").slice(0, 160));
  if (!cel) return NextResponse.json({ ok: false, blad: "Ta oferta jest już nieaktualna." }, { status: 404 });
  const { oferta, kontoFirmyId } = cel;
  const imie = g("imie").slice(0, 120);
  const email = g("email").toLowerCase().slice(0, 160);
  const telefon = g("telefon").slice(0, 40);
  const linkedin = g("cv").slice(0, 300);
  const wiadomosc = g("wiadomosc").slice(0, 1500);
  if (imie.length < 3) return NextResponse.json({ ok: false, blad: "Wpisz imię i nazwisko." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail." }, { status: 400 });
  if (telefon.replace(/\D/g, "").length < 9) return NextResponse.json({ ok: false, blad: "Wpisz numer telefonu." }, { status: 400 });
  if (!f.get("zgoda")) return NextResponse.json({ ok: false, blad: "Zaznacz zgodę na przekazanie danych pracodawcy." }, { status: 400 });

  const kandydat = await zalogowanePraca().then((k) => (k?.typ === "kandydat" ? k : null));
  const cv = await plikCV(f.get("plik"));
  if (typeof cv === "string") return NextResponse.json({ ok: false, blad: cv }, { status: 400 });

  // CV: nowy plik → magazyn; bez pliku zalogowany kandydat dostaje CV z profilu.
  let cvSciezka: string | null = null;
  let cvNazwa: string | null = null;
  if (cv) {
    cvSciezka = await zapiszCV(`zgloszenia/${oferta.id}`, cv);
    cvNazwa = cv.nazwa;
  } else if (kandydat?.cv_sciezka) {
    cvSciezka = kandydat.cv_sciezka;
    cvNazwa = kandydat.cv_nazwa;
  }

  const { data: zgl, error } = await supabaseAdmin
    .from("praca_zgloszenia")
    .insert({ oferta_id: oferta.id, kandydat_id: kandydat?.id ?? null, imie, email, telefon, linkedin: linkedin || null, wiadomosc: wiadomosc || null, cv_sciezka: cvSciezka, cv_nazwa: cvNazwa, zgoda_przyszle: !!f.get("zgoda_przyszle") })
    .select("id")
    .single();
  if (error) console.error("[bruno praca aplikuj] baza", error.message);
  console.log("[bruno praca aplikuj]", JSON.stringify({ id: oferta.id, firma: oferta.firma, status: oferta.status, zFirmy: !!kontoFirmyId, imie, email, cv: cvNazwa, zgloszenie: zgl?.id ?? null, kiedy: new Date().toISOString() }));

  const wiersz = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6b6b6b;vertical-align:top">${k}</td><td style="padding:6px 0;color:#0b0b0b"><b>${esc(v || "-")}</b></td></tr>`;
  const tabela = `<table>${wiersz("Stanowisko", oferta.stanowisko)}${wiersz("Kandydat", imie)}${wiersz("E-mail", email)}${wiersz("Telefon", telefon)}${wiersz("Plik CV", cvNazwa ? `${cvNazwa} (w załączniku)` : "")}${wiersz("LinkedIn", linkedin)}${wiersz("O sobie", wiadomosc)}</table>`;
  const zalaczniki = cv ? [{ filename: cv.nazwa, content: cv.dane }] : [];
  // CV z profilu: pobierz z magazynu do załącznika.
  if (!cv && cvSciezka) {
    const l = await linkCV(cvSciezka, 60);
    const r = l ? await fetch(l).catch(() => null) : null;
    if (r?.ok) zalaczniki.push({ filename: cvNazwa ?? "CV.pdf", content: Buffer.from(await r.arrayBuffer()) });
  }
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      ...(zalaczniki.length ? { zalaczniki } : {}),
      temat: `Praca: KANDYDAT na ${oferta.stanowisko}, ${oferta.firma} (${kontoFirmyId ? "panel firmy" : oferta.status})`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Nowe zgłoszenie z salesbruno.com/praca. Firma: <b>${esc(oferta.firma)}</b>, id: ${esc(oferta.id)}.</p>${tabela}</div>`,
    });
    if (kontoFirmyId) {
      const { data: firma } = await supabaseAdmin.from("praca_konta").select("email").eq("id", kontoFirmyId).maybeSingle();
      if (firma?.email)
        await wyslij({
          do: firma.email,
          replyTo: email,
          ...(zalaczniki.length ? { zalaczniki } : {}),
          temat: `Nowy kandydat: ${oferta.stanowisko}`,
          html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Dzień dobry,</p><p>na Państwa ogłoszenie na SalesBruno.pl aplikował nowy kandydat.</p>${tabela}<p>Wszystkie zgłoszenia są w panelu: <a href="https://salesbruno.com/praca/panel">salesbruno.com/praca/panel</a></p><p>Pozdrawiam<br/>Jakub Chodakowski<br/>SalesBruno.pl</p></div>`,
        });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno praca aplikuj]", e);
    // Zgłoszenie i tak jest w bazie, więc kandydat nie widzi błędu, jeśli zapis się udał.
    if (zgl || process.env.NODE_ENV !== "production") return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: false, blad: "Nie udało się wysłać. Spróbuj ponownie." }, { status: 500 });
  }
}
