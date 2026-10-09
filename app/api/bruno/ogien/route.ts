import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pelnyDostep, pobierzKonto } from "@/lib/bruno/db";

export const dynamic = "force-dynamic";

// „Ogień przed rozmową" (9.10): zapis rytuału przed prawdziwym telefonem.
// POST  { dane }                → nowy wpis, zwraca id
// PATCH { id, po_rozmowie }     → wynik po rozmowie (cel, obiekcje, następny krok)
// Wszystko w Bruno, nic na kartkach (USER_001).

const MAX = 6000;
const przytnij = (v: unknown) => JSON.parse(JSON.stringify(v ?? {}).slice(0, MAX));

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  if (!pelnyDostep(await pobierzKonto(email))) return NextResponse.json({ ok: false, blad: "Ogień jest w pełnym dostępie." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  let dane: unknown;
  try {
    dane = przytnij(b.dane);
  } catch {
    return NextResponse.json({ ok: false, blad: "Zły format." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from("bruno_ogien").insert({ email, dane }).select("id").single();
  if (error || !data) return NextResponse.json({ ok: false, blad: error?.message ?? "Nie zapisano." }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  if (!pelnyDostep(await pobierzKonto(email))) return NextResponse.json({ ok: false, blad: "Ogień jest w pełnym dostępie." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ ok: false, blad: "Brak id." }, { status: 400 });
  let po: unknown;
  try {
    po = przytnij(b.po_rozmowie);
  } catch {
    return NextResponse.json({ ok: false, blad: "Zły format." }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("bruno_ogien").update({ po_rozmowie: po, zakonczono: new Date().toISOString() }).eq("id", id).eq("email", email);
  if (error) return NextResponse.json({ ok: false, blad: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
