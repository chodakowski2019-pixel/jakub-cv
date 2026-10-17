import { NextResponse } from "next/server";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { CENA_MIESIAC, sprawdzToken } from "@/lib/bruno/praca/oferty";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca (17.10): firma z linku w mailu aktywuje (50 zł/mc) albo usuwa swoje ogłoszenie.
// Na razie TYLKO powiadomienie do USER_001 (status zmienia się ręcznie w lib/bruno/praca/oferty.json).
// Docelowo: aktywuj = Stripe Checkout 50 zł/mc, status w Supabase.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? "").slice(0, 120);
  const oferta = sprawdzToken(id, b.k);
  if (!oferta) return NextResponse.json({ ok: false, blad: "Ten link jest nieaktualny. Napisz do nas: jakub@salesbruno.com" }, { status: 404 });
  const akcja = b.akcja === "aktywuj" ? "aktywuj" : b.akcja === "usun" ? "usun" : null;
  if (!akcja) return NextResponse.json({ ok: false }, { status: 400 });

  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  const aplikuj = String(b.aplikuj ?? "").trim().slice(0, 300);
  const nip = String(b.nip ?? "").replace(/\D/g, "").slice(0, 10);
  if (akcja === "aktywuj") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz poprawny e-mail." }, { status: 400 });
    if (aplikuj.length < 5) return NextResponse.json({ ok: false, blad: "Wpisz, gdzie kandydaci mają aplikować." }, { status: 400 });
  }

  console.log("[bruno praca]", JSON.stringify({ akcja, id, firma: oferta.firma, email, aplikuj, nip, kiedy: new Date().toISOString() }));
  const wiersz = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6b6b6b">${k}</td><td style="padding:6px 0;color:#0b0b0b"><b>${esc(v || "-")}</b></td></tr>`;
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      ...(email ? { replyTo: email } : {}),
      temat: akcja === "aktywuj" ? `Praca: AKTYWACJA ${CENA_MIESIAC} zł/mc (promocja, normalnie 200 zł), ${oferta.firma}` : `Praca: USUNĄĆ ogłoszenie, ${oferta.firma}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>${
        akcja === "aktywuj"
          ? `Firma chce aktywować ogłoszenie (${CENA_MIESIAC} zł/mc). Wyślij link do płatności i zmień status na „aktywna”.`
          : "Firma prosi o usunięcie ogłoszenia. Zmień status na „usunieta” i wypisz z kampanii."
      }</p><table>${wiersz("Firma", oferta.firma)}${wiersz("Stanowisko", oferta.stanowisko)}${wiersz("Id", id)}${
        akcja === "aktywuj" ? wiersz("E-mail", email) + wiersz("Aplikacje", aplikuj) + wiersz("NIP", nip) : ""
      }</table></div>`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno praca]", e);
    // Lokalnie bez klucza do maili: zgłoszenie jest w logu, firma nie widzi błędu.
    if (process.env.NODE_ENV !== "production") return NextResponse.json({ ok: true, lokalnie: true });
    return NextResponse.json({ ok: false, blad: "Nie udało się wysłać. Spróbuj ponownie." }, { status: 500 });
  }
}
