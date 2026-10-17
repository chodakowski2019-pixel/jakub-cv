import { NextResponse } from "next/server";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { ofertaPoId } from "@/lib/bruno/praca/oferty";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/aplikuj (17.10): kandydat aplikuje na ofertę na naszej stronie (bez wychodzenia na zewnątrz).
// Na razie mail do USER_001 + log. Dalej: przekazanie firmie (aktywna oferta) albo hak „masz kandydata, aktywuj ogłoszenie”.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  // 17.10 v2: multipart (formularz + plik CV). Limit Vercela na ciało zapytania = 4,5 MB, więc plik do 4 MB.
  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ ok: false, blad: "Nie udało się odczytać formularza." }, { status: 400 });
  const g = (k: string) => String(f.get(k) ?? "").trim();
  if (g("www")) return NextResponse.json({ ok: true }); // pułapka na boty
  const oferta = ofertaPoId(g("id").slice(0, 160));
  if (!oferta) return NextResponse.json({ ok: false, blad: "Ta oferta jest już nieaktualna." }, { status: 404 });
  const imie = g("imie").slice(0, 120);
  const email = g("email").toLowerCase().slice(0, 160);
  const telefon = g("telefon").slice(0, 40);
  const cv = g("cv").slice(0, 300);
  const wiadomosc = g("wiadomosc").slice(0, 1500);
  if (imie.length < 3) return NextResponse.json({ ok: false, blad: "Wpisz imię i nazwisko." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail." }, { status: 400 });
  if (telefon.replace(/\D/g, "").length < 9) return NextResponse.json({ ok: false, blad: "Wpisz numer telefonu." }, { status: 400 });
  if (!f.get("zgoda")) return NextResponse.json({ ok: false, blad: "Zaznacz zgodę na przekazanie danych pracodawcy." }, { status: 400 });
  const plik = f.get("plik");
  let zalacznik: { filename: string; content: Buffer } | null = null;
  if (plik instanceof File && plik.size > 0) {
    if (!/\.(pdf|docx?|odt|rtf)$/i.test(plik.name)) return NextResponse.json({ ok: false, blad: "CV w formacie PDF, DOC albo DOCX." }, { status: 400 });
    if (plik.size > 4 * 1024 * 1024) return NextResponse.json({ ok: false, blad: "Plik może mieć najwyżej 4 MB." }, { status: 400 });
    zalacznik = { filename: plik.name.replace(/[^\w.\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]/g, "_").slice(0, 120), content: Buffer.from(await plik.arrayBuffer()) };
  }

  console.log("[bruno praca aplikuj]", JSON.stringify({ id: oferta.id, firma: oferta.firma, status: oferta.status, imie, email, telefon, cv, plik: zalacznik ? `${zalacznik.filename} (${zalacznik.content.length} B)` : null, kiedy: new Date().toISOString() }));
  const wiersz = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6b6b6b;vertical-align:top">${k}</td><td style="padding:6px 0;color:#0b0b0b"><b>${esc(v || "-")}</b></td></tr>`;
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      ...(zalacznik ? { zalaczniki: [zalacznik] } : {}),
      temat: `Praca: KANDYDAT na ${oferta.stanowisko}, ${oferta.firma} (${oferta.status})`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Nowe zgłoszenie z salesbruno.com/praca. Oferta: <b>${esc(oferta.status)}</b>.</p><table>${wiersz("Stanowisko", oferta.stanowisko)}${wiersz("Firma", oferta.firma)}${wiersz("Id", oferta.id)}${wiersz("Kandydat", imie)}${wiersz("E-mail", email)}${wiersz("Telefon", telefon)}${wiersz("Plik CV", zalacznik ? `${zalacznik.filename} (w załączniku)` : "")}${wiersz("LinkedIn", cv)}${wiersz("O sobie", wiadomosc)}</table></div>`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno praca aplikuj]", e);
    if (process.env.NODE_ENV !== "production") return NextResponse.json({ ok: true, lokalnie: true });
    return NextResponse.json({ ok: false, blad: "Nie udało się wysłać. Spróbuj ponownie." }, { status: 500 });
  }
}
// odświeżenie 17.10
