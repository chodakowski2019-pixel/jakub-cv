import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, pobierzFirme } from "@/lib/bruno/firmy";
import { edytujKlientaCrm, etapyFirmy, przesunEtapCrm, przywrocCrm, zamknijCrm } from "@/lib/bruno/crm";
import { zapiszProfil } from "@/lib/bruno/klienci";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 8.11 (USER_001): EDYCJA LEADA (karta klienta → „Edytuj”). Handlowiec zmienia swoich klientów, szef wszystkich.

const tekst = (v: unknown, max: number) => (v === undefined ? undefined : typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ blad: "401" }, { status: 401 });
  const konto = await pobierzKonto(email);
  const firma = await pobierzFirme(konto?.firma_id);
  if (!konto || !firma) return NextResponse.json({ blad: "403" }, { status: 403 });
  const id = Number((await params).id);
  const { data: k } = await supabaseAdmin.from("bruno_klienci").select("handlowiec, etap_id").eq("id", id).eq("firma_id", firma.id).maybeSingle();
  if (!k) return NextResponse.json({ blad: "404" }, { status: 404 });
  if (!czySzef(konto) && String(k.handlowiec ?? "").toLowerCase() !== email.toLowerCase()) return NextResponse.json({ blad: "To nie jest Twój klient." }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // 9.11 (USER_001): szybkie akcje z wiersza listy: strzałka = następny etap, x = usuń (przegrany, na dół listy), cofnięcie.
  // 14.11 (USER_001): na karcie klienta klik w etap = przeniesienie na ten etap.
  if (b.akcja === "dalej" || b.akcja === "usun" || b.akcja === "przywroc" || b.akcja === "etap") {
    try {
      const autor = email.toLowerCase();
      if (b.akcja === "usun") await zamknijCrm(firma.id, id, "lost", "Usunięty z listy", autor);
      else if (b.akcja === "przywroc") await przywrocCrm(firma.id, id, autor);
      else if (b.akcja === "etap") {
        if (Number(b.etap_id) === Number(k.etap_id)) return NextResponse.json({ ok: true });
        await przesunEtapCrm(firma.id, id, Number(b.etap_id), autor);
      }
      else {
        const etapy = await etapyFirmy(firma.id);
        const nast = etapy[etapy.findIndex((e) => e.id === Number(k.etap_id)) + 1];
        if (!nast) return NextResponse.json({ blad: "To już ostatni etap." }, { status: 400 });
        await przesunEtapCrm(firma.id, id, nast.id, autor);
      }
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ blad: String((e as Error)?.message ?? e).slice(0, 300) }, { status: 500 });
    }
  }
  const imie = tekst(b.imie_nazwisko, 160);
  if (imie === null) return NextResponse.json({ blad: "Podaj imię i nazwisko." }, { status: 400 });
  const mail = tekst(b.email, 160);
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return NextResponse.json({ blad: "Zły adres e-mail." }, { status: 400 });
  const w = b.wartosc === undefined ? undefined : Number(String(b.wartosc).replace(/\s/g, "").replace(",", "."));
  try {
    await edytujKlientaCrm(
      firma.id,
      id,
      { imie_nazwisko: imie, firma: tekst(b.firma, 160), telefon: tekst(b.telefon, 40), email: mail, etap_id: Number(b.etap_id) || null, wartosc: w === undefined ? undefined : Number.isFinite(w) && w > 0 ? Math.round(w) : 0 },
      email.toLowerCase(),
    );
    if (b.plec === "m" || b.plec === "k") await zapiszProfil(firma.id, id, { plec: b.plec });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ blad: String((e as Error)?.message ?? e).slice(0, 300) }, { status: 500 });
  }
}
