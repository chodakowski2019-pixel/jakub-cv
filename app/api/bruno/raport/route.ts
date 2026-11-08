import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, pobierzFirme } from "@/lib/bruno/firmy";
import { crmWlaczony } from "@/lib/bruno/lejek";
import { generujRaport, zbierzDaneZespolu } from "@/lib/bruno/raport";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 4.11 (USER_001, pkt 3): „Wygeneruj teraz” = raport miesięczny z Claude dla szefa firmy z CRM. Zapis w bruno_raporty.

export async function POST() {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ blad: "401" }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!konto || !czySzef(konto)) return NextResponse.json({ blad: "403" }, { status: 403 });
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma) return NextResponse.json({ blad: "CRM nie jest podpięty." }, { status: 403 });
  const jezyk = konto.jezyk === "pl" ? "pl" : "en";
  try {
    const dane = await zbierzDaneZespolu(firma, jezyk);
    const raport = await generujRaport(dane, jezyk, email);
    return NextResponse.json({ ok: true, raport });
  } catch (e) {
    const m = String((e as Error)?.message ?? e);
    console.error("[bruno raport]", m);
    return NextResponse.json({ blad: m }, { status: m.includes("ANTHROPIC_API_KEY") ? 500 : 502 });
  }
}
