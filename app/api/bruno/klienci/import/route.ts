import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { etapyFirmy } from "@/lib/bruno/crm";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 8.11 (USER_001: „do CRM Bruno podłączamy Pipedrive, Excel itd.”): IMPORT Z PLIKU (Excel / CSV).
// Przeglądarka czyta plik i dopasowuje kolumny; tu przychodzą gotowe wiersze. Etap po nazwie (bez wielkości liter),
// nieznany = pierwszy etap firmy. Klienci przypisani do importującego. Max 2 000 wierszy na raz.

type Wiersz = { imie_nazwisko?: string; firma?: string; telefon?: string; email?: string; etap?: string; wartosc?: string | number };
const txt = (v: unknown, max: number) => (v === null || v === undefined ? null : String(v).trim().slice(0, max) || null);

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ blad: "401" }, { status: 401 });
  const konto = await pobierzKonto(email);
  const firma = await pobierzFirme(konto?.firma_id);
  if (!konto || !firma) return NextResponse.json({ blad: "403" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { wiersze?: Wiersz[] };
  const wiersze = Array.isArray(b.wiersze) ? b.wiersze.slice(0, 2000) : [];
  const etapy = await etapyFirmy(firma.id);
  const etap = (n: unknown) => etapy.find((e) => e.nazwa.toLowerCase() === String(n ?? "").trim().toLowerCase())?.id ?? etapy[0].id;
  const doZapisu = wiersze
    .map((w) => {
      const imie = txt(w.imie_nazwisko, 160) ?? txt(w.firma, 160);
      if (!imie) return null;
      const war = Number(String(w.wartosc ?? "0").replace(/[^\d,.-]/g, "").replace(",", "."));
      const mail = txt(w.email, 160);
      return {
        firma_id: firma.id,
        handlowiec: email.toLowerCase(),
        imie_nazwisko: imie,
        firma: txt(w.firma, 160),
        telefon: txt(w.telefon, 40),
        email: mail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? mail : null,
        etap_id: etap(w.etap),
        wartosc: Number.isFinite(war) && war > 0 ? Math.round(war) : 0,
        zrodlo: "excel",
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  if (!doZapisu.length) return NextResponse.json({ blad: "Brak wierszy z imieniem i nazwiskiem albo firmą." }, { status: 400 });
  for (let i = 0; i < doZapisu.length; i += 500) {
    const { error } = await supabaseAdmin.from("bruno_klienci").insert(doZapisu.slice(i, i + 500));
    if (error) return NextResponse.json({ blad: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, dodano: doZapisu.length, pominieto: wiersze.length - doZapisu.length });
}
