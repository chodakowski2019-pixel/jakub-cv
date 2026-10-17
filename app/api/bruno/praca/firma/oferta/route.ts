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

  const id = noweIdOferty(stanowisko, dane.firma);
  const { error } = await supabaseAdmin.from("praca_oferty_firm").insert({ id, konto_id: konto.id, ...dane });
  if (error) {
    console.error("[praca firma oferta]", error.message);
    return NextResponse.json({ ok: false, blad: "Nie udało się dodać ogłoszenia." }, { status: 500 });
  }
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: konto.email,
      rodzaj: "inny",
      temat: `Praca: NOWE OGŁOSZENIE do aktywacji (50 zł/mc), ${dane.firma}: ${stanowisko}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Pracodawca dodał ogłoszenie w panelu. Status: <b>oczekuje</b>. Wyślij link do płatności, potem zmień status na „aktywna” w tabeli praca_oferty_firm.</p><p><b>Firma:</b> ${esc(dane.firma)}<br/><b>Konto:</b> ${esc(konto.email)}, ${esc(konto.telefon ?? "-")}<br/><b>Stanowisko:</b> ${esc(stanowisko)}<br/><b>Miasto:</b> ${esc(dane.miasto ?? "-")}<br/><b>Id:</b> ${id}</p></div>`,
    });
  } catch (e) {
    console.error("[praca firma oferta] mail", e);
  }
  return NextResponse.json({ ok: true, id });
}
