import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { dodajKlienta, type Plec } from "@/lib/bruno/klienci";
import { tDla } from "@/lib/bruno/i18n";

export const dynamic = "force-dynamic";

// 8.11 (USER_001): „+ Dodaj klienta” w zakładce Klienci. Pipedrive albo domyślny CRM Bruno (lib/bruno/klienci.ts).
// Klient przypisany do zalogowanego konta (handlowiec = jego e-mail).

const tekst = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ blad: "401" }, { status: 401 });
  const konto = await pobierzKonto(email);
  const t = tDla(konto?.jezyk);
  const firma = await pobierzFirme(konto?.firma_id);
  if (!konto || !firma) return NextResponse.json({ blad: t("No company on this account.", "Konto nie ma firmy.") }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const imie = tekst(b.imie_nazwisko, 160);
  if (!imie) return NextResponse.json({ blad: t("Name is required.", "Podaj imię i nazwisko.") }, { status: 400 });
  const mail = tekst(b.email, 160);
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return NextResponse.json({ blad: t("Bad e-mail.", "Zły adres e-mail.") }, { status: 400 });
  const wartosc = Number(String(b.wartosc ?? "0").replace(/\s/g, "").replace(",", "."));
  const plec: Plec | null = b.plec === "m" || b.plec === "k" ? b.plec : null;
  try {
    const r = await dodajKlienta(firma, email.toLowerCase(), {
      imie_nazwisko: imie,
      firma: tekst(b.firma, 160),
      telefon: tekst(b.telefon, 40),
      email: mail,
      etap_id: Number.isFinite(Number(b.etap_id)) ? Number(b.etap_id) : null,
      wartosc: Number.isFinite(wartosc) && wartosc > 0 ? Math.round(wartosc) : 0,
      plec,
    });
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e) {
    console.error("[bruno klienci dodaj]", e);
    return NextResponse.json({ blad: String((e as Error)?.message ?? e).slice(0, 300) }, { status: 500 });
  }
}
