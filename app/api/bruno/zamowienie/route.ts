import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { MINIMUM_KONT, PAKIETY, WERSJA_OFERTY, koszt } from "@/lib/bruno/oferta-pakiety";

export const dynamic = "force-dynamic";

// 4.11 (USER_001, pkt 6): zapis zamówienia pakietu (bruno_zamowienia) z akceptacją regulaminu (data + IP + wersja oferty).
// Mail potwierdzający i faktura Stripe = po decyzji USER_001 (dziś tylko zapis; USER_001 widzi wiersz w bazie).

const nip10 = (s: string) => s.replace(/[^0-9]/g, "");
const nipOk = (c: string) => c.length === 10 && [6, 5, 7, 2, 3, 4, 5, 6, 7].reduce((a, x, i) => a + x * Number(c[i]), 0) % 11 === Number(c[9]);

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pakiet = Number(b.pakiet);
  const p = PAKIETY.find((x) => x.nr === pakiet && x.nr !== 3);
  if (!p) return NextResponse.json({ blad: "Pakiet 1 albo 2. Pakiet 3 = umowa, napisz." }, { status: 400 });
  const konta = Math.floor(Number(b.konta));
  if (!Number.isFinite(konta) || konta < MINIMUM_KONT || konta > 500) return NextResponse.json({ blad: `Minimum ${MINIMUM_KONT} konta.` }, { status: 400 });
  const firma = String(b.firma ?? "").trim().slice(0, 200);
  const nip = nip10(String(b.nip ?? ""));
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 200);
  const telefon = String(b.telefon ?? "").trim().slice(0, 40) || null;
  const uwagi = String(b.uwagi ?? "").trim().slice(0, 2000) || null;
  const osoby = (Array.isArray(b.osoby) ? b.osoby : []).map((x) => String(x).trim().toLowerCase()).filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)).slice(0, 500);
  if (!firma) return NextResponse.json({ blad: "Podaj nazwę firmy." }, { status: 400 });
  if (!nipOk(nip)) return NextResponse.json({ blad: "NIP niepoprawny." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ blad: "E-mail niepoprawny." }, { status: 400 });
  if (b.regulamin !== true) return NextResponse.json({ blad: "Brak akceptacji regulaminu." }, { status: 400 });
  if (b.polityka !== true) return NextResponse.json({ blad: "Brak akceptacji polityki prywatności." }, { status: 400 });

  const teraz = new Date().toISOString();
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const k = koszt(p, konta);
  const { data, error } = await supabaseAdmin
    .from("bruno_zamowienia")
    .insert({ pakiet: p.nr, konta, firma, nip, email, telefon, osoby, uwagi, kwota_start: k.start, kwota_miesiac: k.miesiac, wersja_oferty: WERSJA_OFERTY, regulamin_at: teraz, polityka_at: teraz, ip, agent: (req.headers.get("user-agent") ?? "").slice(0, 300) })
    .select("id")
    .single();
  if (error) {
    console.error("[bruno zamowienie]", error.message);
    return NextResponse.json({ blad: `Zapis nie powiódł się: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
