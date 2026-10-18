import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { noweIdOferty, wierszOferty, type StatusFirmy } from "@/lib/bruno/praca/oferty-firm";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/firma/oferta (17.10): pracodawca dodaje / edytuje ogłoszenie w panelu.
// Nowe = status „oczekuje” (widoczne po aktywacji 50 zł/mc, na razie aktywuje USER_001) + powiadomienie USER_001.
// { akcja: "status", id, status: "wstrzymana" | "usunieta" | "oczekuje" } = wstrzymanie / usunięcie / wznowienie.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const lista = (v: unknown) =>
  String(v ?? "")
    .split("\n")
    .map((x) => x.replace(/^[-•*\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((x) => x.slice(0, 300));
const kwota = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return n > 0 && n < 1_000_000 ? n : null;
};

export async function POST(req: Request) {
  const konto = await zalogowanePraca();
  if (!konto || konto.typ !== "pracodawca") return NextResponse.json({ ok: false, blad: "Zaloguj się jako pracodawca." }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  // 18.10 (USER_001): aktywacja / przedłużenie ogłoszenia = 1 opłacony kredyt, +30 dni.
  if (b.akcja === "aktywuj") {
    const w = await wierszOferty(String(b.id ?? ""));
    if (!w || w.konto_id !== konto.id) return NextResponse.json({ ok: false, blad: "Nie ma takiego ogłoszenia." }, { status: 404 });
    if (!(await zuzyjKredyt(konto.id))) return NextResponse.json({ ok: false, blad: "Brak opłaconych ogłoszeń. Najpierw opłać ogłoszenie." }, { status: 402 });
    const od = w.status === "aktywna" && Date.parse(w.wazne_do) > Date.now() ? Date.parse(w.wazne_do) : Date.now();
    await supabaseAdmin.from("praca_oferty_firm").update({ status: "aktywna", oplacone_od: new Date().toISOString(), wazne_do: new Date(od + 30 * 86_400_000).toISOString() }).eq("id", w.id);
    return NextResponse.json({ ok: true });
  }

  if (b.akcja === "status") {
    const w = await wierszOferty(String(b.id ?? ""));
    if (!w || w.konto_id !== konto.id) return NextResponse.json({ ok: false, blad: "Nie ma takiego ogłoszenia." }, { status: 404 });
    const nowy = b.status as StatusFirmy;
    if (!["wstrzymana", "usunieta", "oczekuje"].includes(nowy)) return NextResponse.json({ ok: false }, { status: 400 });
    // Wznowienie wstrzymanej aktywnej oferty wraca do „aktywna” tylko przez USER_001 (płatność), więc „oczekuje”.
    await supabaseAdmin.from("praca_oferty_firm").update({ status: nowy }).eq("id", w.id);
    return NextResponse.json({ ok: true });
  }

  const stanowisko = String(b.stanowisko ?? "").trim().slice(0, 160);
  if (stanowisko.length < 3) return NextResponse.json({ ok: false, blad: "Wpisz stanowisko." }, { status: 400 });
  const opis = String(b.opis ?? "").trim().slice(0, 4000);
  const dane = {
    stanowisko,
    firma: konto.firma ?? "Firma",
    miasto: String(b.miasto ?? "").trim().slice(0, 80) || null,
    wojewodztwo: String(b.wojewodztwo ?? "").trim().slice(0, 40) || null,
    poziom: String(b.poziom ?? "").slice(0, 60) || null,
    umowa: String(b.umowa ?? "").slice(0, 60) || null,
    wymiar: String(b.wymiar ?? "").slice(0, 60) || null,
    tryb: String(b.tryb ?? "").slice(0, 60) || null,
    branza: String(b.branza ?? "").slice(0, 60) || null,
    pensja_min: kwota(b.pensjaMin),
    pensja_max: kwota(b.pensjaMax),
    opis,
    obowiazki: lista(b.obowiazki),
    wymagania: lista(b.wymagania),
    mile_widziane: lista(b.mileWidziane),
    oferujemy: lista(b.oferujemy),
  };

  if (b.id) {
    const w = await wierszOferty(String(b.id));
    if (!w || w.konto_id !== konto.id) return NextResponse.json({ ok: false, blad: "Nie ma takiego ogłoszenia." }, { status: 404 });
    const { error } = await supabaseAdmin.from("praca_oferty_firm").update(dane).eq("id", w.id);
    if (error) return NextResponse.json({ ok: false, blad: "Nie udało się zapisać." }, { status: 500 });
    return NextResponse.json({ ok: true, id: w.id });
  }

  // 18.10 (USER_001): najpierw płatność, potem ogłoszenie. Nowe ogłoszenie zużywa 1 kredyt i jest od razu aktywne na 30 dni.
  if (!(await zuzyjKredyt(konto.id))) return NextResponse.json({ ok: false, blad: "Najpierw opłać ogłoszenie, potem je dodasz.", brakKredytu: true }, { status: 402 });
  const id = noweIdOferty(stanowisko, dane.firma);
  const { error } = await supabaseAdmin
    .from("praca_oferty_firm")
    .insert({ id, konto_id: konto.id, ...dane, status: "aktywna", oplacone_od: new Date().toISOString(), wazne_do: new Date(Date.now() + 30 * 86_400_000).toISOString() });
  if (error) {
    console.error("[praca firma oferta]", error.message);
    await zwrocKredyt(konto.id);
    return NextResponse.json({ ok: false, blad: "Nie udało się dodać ogłoszenia." }, { status: 500 });
  }
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: konto.email,
      rodzaj: "inny",
      temat: `Praca: NOWE OGŁOSZENIE (opłacone, aktywne 30 dni), ${dane.firma}: ${stanowisko}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Pracodawca dodał opłacone ogłoszenie w panelu. Jest aktywne od razu na 30 dni.</p><p><b>Firma:</b> ${esc(dane.firma)}<br/><b>Konto:</b> ${esc(konto.email)}, ${esc(konto.telefon ?? "-")}<br/><b>Stanowisko:</b> ${esc(stanowisko)}<br/><b>Miasto:</b> ${esc(dane.miasto ?? "-")}<br/><b>Id:</b> ${id}</p></div>`,
    });
  } catch (e) {
    console.error("[praca firma oferta] mail", e);
  }
  return NextResponse.json({ ok: true, id });
}

/** Zdejmuje 1 kredyt (warunkowo, żeby dwa kliknięcia naraz nie zużyły jednego kredytu dwa razy). */
async function zuzyjKredyt(kontoId: string): Promise<boolean> {
  for (let i = 0; i < 3; i++) {
    const { data } = await supabaseAdmin.from("praca_konta").select("kredyty").eq("id", kontoId).single();
    const n = data?.kredyty ?? 0;
    if (n <= 0) return false;
    const { data: z } = await supabaseAdmin.from("praca_konta").update({ kredyty: n - 1 }).eq("id", kontoId).eq("kredyty", n).select("id");
    if (z?.length) return true;
  }
  return false;
}
async function zwrocKredyt(kontoId: string) {
  const { data } = await supabaseAdmin.from("praca_konta").select("kredyty").eq("id", kontoId).single();
  await supabaseAdmin.from("praca_konta").update({ kredyty: (data?.kredyty ?? 0) + 1 }).eq("id", kontoId);
}
