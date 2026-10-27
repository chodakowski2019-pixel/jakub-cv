import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, pobierzRozmowe, type Rozmowa } from "@/lib/bruno/db";
import { czySzef, handlowiecFirmy } from "@/lib/bruno/firmy";
import { jezykLubDomyslny } from "@/lib/bruno/domeny";
import { etykiety } from "@/lib/bruno/etykiety";
import { postacLubDomyslna } from "@/lib/bruno/postacie";

export const dynamic = "force-dynamic";

// 27.10 (aplikacja mobilna): jedna rozmowa = ocena trenera + transkrypcja.
// GET ?id=<rozmowa>            → moja rozmowa
// GET ?id=<rozmowa>&kto=<email> → rozmowa handlowca z mojej firmy (tylko szef)
export async function GET(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false, blad: "Zaloguj się." }, { status: 401 });
  const u = new URL(req.url);
  const id = u.searchParams.get("id") ?? "";
  const kto = u.searchParams.get("kto")?.toLowerCase() ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, blad: "Złe id." }, { status: 400 });

  const konto = await pobierzKonto(email);
  const jezyk = jezykLubDomyslny(konto?.jezyk);
  let wlasciciel = email;
  if (kto && kto !== email) {
    // Szef czyta tylko handlowców swojej firmy.
    if (!konto || !czySzef(konto) || !(await handlowiecFirmy(konto.firma_id!, kto))) {
      return NextResponse.json({ ok: false, blad: "Brak dostępu." }, { status: 403 });
    }
    wlasciciel = kto;
  }
  const r: Rozmowa | null = await pobierzRozmowe(wlasciciel, id);
  if (!r) return NextResponse.json({ ok: false, blad: "Nie ma takiej rozmowy." }, { status: 404 });
  const E = etykiety(jezyk);

  return NextResponse.json({
    ok: true,
    rozmowa: {
      id: r.id,
      start: r.start,
      sekundy: r.sekundy,
      status: r.status,
      ocena: r.ocena,
      postac: E.POSTACIE[postacLubDomyslna(r.postac)].nazwa,
      obiekcja: r.obiekcja ? r.obiekcja.split(" | ")[0] : null,
      feedback: r.feedback
        ? {
            ocena: r.feedback.ocena,
            wygrana: r.feedback.wygrana,
            poprawka: r.feedback.poprawka,
            plusy: r.feedback.plusy ?? [],
            minusy: r.feedback.minusy ?? [],
            kryteria: (r.feedback.kryteria ?? []).map((k) => ({
              nazwa: E.NAZWY[k.nazwa] ?? k.nazwa,
              ocena: k.ocena,
              komentarz: k.komentarz,
              cytat: k.cytat,
            })),
          }
        : null,
      transkrypcja: (r.transkrypcja ?? []).map((w) => ({ rola: w.rola, tekst: w.tekst, t: w.t })),
    },
  });
}
