import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { pakiet as pakietPoId } from "@/app/brunostart/dane";
import { CELE, DOSW, KANALY, KOMU, MINUT, PORY, ROZMOW } from "@/app/brunostart/formularz/opcje";

export const dynamic = "force-dynamic";

// POST /api/bruno/start (5.11, USER_001): rozbudowany formularz po płatności z LP B2C /start (adres /formularzbruno).
// Zapis do `bruno_start_zgloszenia` (SQL: lib/bruno/sql/2026-11-05-start-zgloszenia.sql) + mail do USER_001,
// który w 24 h zakłada konto, ustawia Bruno (Dostosuj) i wysyła dostęp. Do klienta z automatu nie idzie nic.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const tekst = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const zListy = (v: unknown, lista: readonly string[]) => (lista.includes(String(v)) ? String(v) : "");

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const p = pakietPoId(String(b.pakiet ?? ""));
  const imie = tekst(b.imie, 100);
  const email = tekst(b.email, 200).toLowerCase();
  const telefon = tekst(b.telefon, 40);
  const zwracanie = tekst(b.zwracanie, 60) || null;
  const cel = zListy(b.cel, CELE);
  const doswiadczenie = zListy(b.doswiadczenie, DOSW.map(([v]) => v));
  const praca = tekst(b.praca, 200);
  const rozmowTyg = zListy(b.rozmowTyg, ROZMOW);
  const kanaly = (Array.isArray(b.kanaly) ? b.kanaly : []).map(String).filter((k: string) => KANALY.includes(k));
  const komu = zListy(b.komu, KOMU);
  const coSprzedaje = tekst(b.coSprzedaje, 2000);
  const klient = tekst(b.klient, 2000) || null;
  const obiekcje = tekst(b.obiekcje, 2000) || null;
  const strona = tekst(b.strona, 300) || null;
  const skrypt = tekst(b.skrypt, 5000) || null;
  const cel30 = tekst(b.cel30, 1000);
  const trudnosc = tekst(b.trudnosc, 2000) || null;
  const pewnosc = Number(b.pewnosc);
  const pora = zListy(b.pora, PORY);
  const minut = zListy(b.minut, MINUT);
  const zrodlo = tekst(b.zrodlo, 100) || null;

  if (!p) return NextResponse.json({ ok: false, blad: "Brak pakietu w adresie. Wejdź z linku po płatności." }, { status: 400 });
  if (!imie || !/^\S+@\S+\.\S+$/.test(email) || telefon.replace(/\D/g, "").length < 9)
    return NextResponse.json({ ok: false, blad: "Wpisz imię, e-mail i numer telefonu." }, { status: 400 });
  if (!cel || !doswiadczenie || !praca || !rozmowTyg) return NextResponse.json({ ok: false, blad: "Uzupełnij część 2: Twoja sytuacja." }, { status: 400 });
  if (!komu || coSprzedaje.length < 3) return NextResponse.json({ ok: false, blad: "Uzupełnij część 3: co sprzedajesz." }, { status: 400 });
  if (!cel30 || !(pewnosc >= 1 && pewnosc <= 10) || !pora || !minut) return NextResponse.json({ ok: false, blad: "Uzupełnij część 4: cel na 30 dni." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const { error } = await supabaseAdmin.from("bruno_start_zgloszenia").insert({
    pakiet: p.id,
    imie,
    email,
    telefon,
    zwracanie,
    cel,
    doswiadczenie,
    praca,
    rozmow_tyg: rozmowTyg,
    kanaly,
    komu,
    co_sprzedaje: coSprzedaje,
    klient,
    obiekcje,
    strona,
    skrypt,
    cel_30: cel30,
    trudnosc,
    pewnosc,
    pora,
    minut: Number(minut),
    zrodlo,
    ip,
  });
  if (error) console.error("bruno_start_zgloszenia", error.code, error.message);

  const w = (k: string, v: string | null | undefined) => (v ? `<tr><th align="left" valign="top" style="padding:4px 10px 4px 0">${k}</th><td style="padding:4px 0">${esc(v).replace(/\n/g, "<br>")}</td></tr>` : "");
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `START: ${imie}, ${p.nazwa} (${p.cena} zł)`,
      html:
        `<p><b>${esc(imie)}</b> zapłacił(a) za <b>${esc(p.nazwa)}</b> (${p.cena} zł) i wypełnił(a) formularz.</p>` +
        `<table style="border-collapse:collapse;font-size:14px">` +
        w("E-mail", email) +
        w("Telefon", telefon) +
        w("Zwracać się", zwracanie) +
        w("Cel", cel) +
        w("Doświadczenie", doswiadczenie) +
        w("Zajmuje się", praca) +
        w("Rozmów / tydz.", rozmowTyg) +
        w("Kanały", kanaly.join(", ")) +
        w("Komu", komu) +
        w("Co sprzedaje", coSprzedaje) +
        w("Klient", klient) +
        w("Obiekcje", obiekcje) +
        w("Strona / oferta", strona) +
        w("Skrypt", skrypt) +
        w("Cel na 30 dni", cel30) +
        w("Najtrudniejszy moment", trudnosc) +
        w("Pewność siebie", `${pewnosc}/10`) +
        w("Pora treningu", pora) +
        w("Minut dziennie", minut) +
        w("Źródło", zrodlo) +
        `</table>` +
        `<p>Do zrobienia w 24 h: sprawdź wpłatę w Stripe, załóż konto (${p.rozmowDziennie} rozm./dzień, ${p.dni} dni), wklej powyższe w „Dostosuj Bruno”, wyślij dostęp na ${esc(email)}.</p>`,
    });
  } catch (e) {
    console.error("[bruno start] mail", e);
    if (error) return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
