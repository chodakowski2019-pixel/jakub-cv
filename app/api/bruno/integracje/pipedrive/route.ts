import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, pobierzFirme } from "@/lib/bruno/firmy";
import { importujPipedrive } from "@/lib/bruno/integracje/pipedrive";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// 8.11 (USER_001): INTEGRACJA PIPEDRIVE dla firmy (tylko szef). Token API z Pipedrive → zapis w firmie → import
// etapów, klientów, notatek i zadań do CRM Bruno. Ponowne wywołanie bez tokenu = ponowny import (aktualizacja).

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ blad: "401" }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!konto || !czySzef(konto)) return NextResponse.json({ blad: "Tylko właściciel albo dyrektor sprzedaży." }, { status: 403 });
  const firma = await pobierzFirme(konto.firma_id);
  if (!firma) return NextResponse.json({ blad: "403" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { token?: string };
  const token = typeof b.token === "string" && b.token.trim() ? b.token.trim() : firma.pipedrive_token;
  if (!token || !/^[a-f0-9]{30,64}$/i.test(token)) return NextResponse.json({ blad: "Wklej token API z Pipedrive (Ustawienia osobiste → API)." }, { status: 400 });
  try {
    const wynik = await importujPipedrive({ ...firma, pipedrive_token: token });
    if (token !== firma.pipedrive_token) await supabaseAdmin.from("bruno_firmy").update({ pipedrive_token: token }).eq("id", firma.id);
    return NextResponse.json({ ok: true, ...wynik });
  } catch (e) {
    const m = String((e as Error)?.message ?? e);
    return NextResponse.json({ blad: /401|unauthor/i.test(m) ? "Pipedrive odrzucił token. Sprawdź, czy jest skopiowany w całości." : m.slice(0, 300) }, { status: 502 });
  }
}
