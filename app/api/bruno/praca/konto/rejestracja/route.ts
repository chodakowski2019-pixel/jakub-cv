import { NextResponse } from "next/server";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { normalizujEmail, poprawneHaslo } from "@/lib/bruno/auth";
import { CIASTECZKO_PRACA, OPCJE_CIASTECZKA, tokenSesji, typKonta, zalozKonto } from "@/lib/bruno/praca/konta";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/konto/rejestracja (17.10): konto kandydata albo pracodawcy na salesbruno.com/praca.
// Po założeniu od razu zalogowane (ciasteczko praca_sesja) + powiadomienie do USER_001.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.www) return NextResponse.json({ ok: true });
  const typ = typKonta(b.typ);
  const email = normalizujEmail(b.email);
  const haslo = poprawneHaslo(b.haslo);
  const imie = String(b.imie ?? "").trim().slice(0, 120);
  const telefon = String(b.telefon ?? "").trim().slice(0, 40);
  const firma = String(b.firma ?? "").trim().slice(0, 160);
  const nip = String(b.nip ?? "").replace(/\D/g, "").slice(0, 10);
  if (!typ) return NextResponse.json({ ok: false, blad: "Wybierz: kandydat albo pracodawca." }, { status: 400 });
  if (!email) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail." }, { status: 400 });
  if (!haslo) return NextResponse.json({ ok: false, blad: "Hasło: co najmniej 8 znaków." }, { status: 400 });
  if (imie.length < 2) return NextResponse.json({ ok: false, blad: "Wpisz imię." }, { status: 400 });
  if (typ === "pracodawca" && firma.length < 2) return NextResponse.json({ ok: false, blad: "Wpisz nazwę firmy." }, { status: 400 });
  if (!b.zgoda) return NextResponse.json({ ok: false, blad: "Zaakceptuj regulamin i politykę prywatności." }, { status: 400 });

  const w = await zalozKonto({ typ, email, haslo, imie, telefon, firma: typ === "pracodawca" ? firma : null, nip: typ === "pracodawca" ? nip : null });
  if (!w.ok) return NextResponse.json({ ok: false, blad: w.blad }, { status: w.istnieje ? 409 : 500 });

  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      rodzaj: "inny",
      temat: `Praca: nowe konto ${typ === "pracodawca" ? `PRACODAWCY, ${firma}` : "kandydata"}: ${email}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Nowe konto na salesbruno.com/praca.</p><p><b>Typ:</b> ${typ}<br/><b>E-mail:</b> ${esc(email)}<br/><b>Imię:</b> ${esc(imie)}<br/><b>Telefon:</b> ${esc(telefon || "-")}${typ === "pracodawca" ? `<br/><b>Firma:</b> ${esc(firma)}<br/><b>NIP:</b> ${esc(nip || "-")}` : ""}</p></div>`,
    });
  } catch (e) {
    console.error("[praca rejestracja] mail", e);
  }
  const odp = NextResponse.json({ ok: true, panel: "/praca/panel" });
  odp.cookies.set(CIASTECZKO_PRACA, tokenSesji(typ, email), OPCJE_CIASTECZKA);
  return odp;
}
