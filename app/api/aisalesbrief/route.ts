import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

// Ankieta wdrożeniowa SalesAI (/aisalesbrief). Wzór: /api/aisaleskontakt.
//
// To jest wsad do narzędzia, nie lead. Mail idzie w całości, bo na jego
// podstawie ustawiam scenariusz rozmowy. Kopia w Supabase (tabela
// salesai_briefy) jest best-effort: jeśli tabeli nie ma, mail i tak pójdzie.

const WYMAGANE = [
  "firma",
  "osoba",
  "email",
  "coSprzedajecie",
  "wartosc",
  "zespol",
  "ktoDecyduje",
  "branzaKlienta",
  "ileOsobDecyzja",
  "kanal",
  "przebieg",
  "obiekcje",
  "sukces",
  "powodPrzegranej",
] as const;

// Treść ankiety trafia do maila, więc każdy znak od klienta musi być
// zneutralizowany, zanim wyląduje w HTML.
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Pola wieloliniowe (przebieg rozmowy, obiekcje) tracą sens bez łamań.
const blok = (v: unknown) => esc(v).replace(/\n/g, "<br>");

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const d = await req.json();

  const brak = WYMAGANE.filter((k) => !d[k]);
  const zachowania: string[] = Array.isArray(d.zachowania) ? d.zachowania : [];
  const etapy: string[] = Array.isArray(d.etapy) ? d.etapy : [];
  if (brak.length || zachowania.length === 0 || etapy.length === 0) {
    return NextResponse.json({ ok: false, blad: "Brak wymaganych pól" }, { status: 400 });
  }

  try {
    await supabaseAdmin.from("salesai_briefy").insert({
      firma: d.firma,
      osoba: d.osoba,
      email: d.email,
      co_sprzedajecie: d.coSprzedajecie,
      wartosc: d.wartosc,
      zespol: d.zespol,
      kto_decyduje: d.ktoDecyduje,
      branza_klienta: d.branzaKlienta,
      ile_osob_decyzja: d.ileOsobDecyzja,
      zachowania,
      kanal: d.kanal,
      etapy,
      przebieg: d.przebieg,
      obiekcje: d.obiekcje,
      sukces: d.sukces,
      powod_przegranej: d.powodPrzegranej,
      konkurencja: d.konkurencja || null,
      zargon: d.zargon || null,
      zakazy: d.zakazy || null,
      nagranie: d.nagranie || null,
    });
  } catch (err) {
    console.error("supabase insert failed", err);
  }

  const html = `
    <h2>Ankieta wdrożeniowa SalesAI — ${esc(d.firma)}</h2>

    <h3>1. Firma i produkt</h3>
    <p><b>Firma:</b> ${esc(d.firma)}</p>
    <p><b>Osoba:</b> ${esc(d.osoba)} &lt;${esc(d.email)}&gt;</p>
    <p><b>Co sprzedają:</b><br>${blok(d.coSprzedajecie)}</p>
    <p><b>Wartość transakcji:</b> ${esc(d.wartosc)}</p>
    <p><b>Zespół:</b> ${esc(d.zespol)}</p>

    <h3>2. Klient (w tę osobę wciela się AI)</h3>
    <p><b>Kto decyduje:</b> ${esc(d.ktoDecyduje)}</p>
    <p><b>Branża i wielkość:</b> ${esc(d.branzaKlienta)}</p>
    <p><b>Ile osób w decyzji:</b> ${esc(d.ileOsobDecyzja)}</p>
    <p><b>Zachowanie w rozmowie:</b> ${zachowania.map(esc).join(", ")}</p>

    <h3>3. Rozmowa</h3>
    <p><b>Kanał:</b> ${esc(d.kanal)}</p>
    <p><b>Etapy do trenowania:</b> ${etapy.map(esc).join(", ")}</p>
    <p><b>Przebieg krok po kroku:</b><br>${blok(d.przebieg)}</p>
    <p><b>Obiekcje:</b><br>${blok(d.obiekcje)}</p>
    <p><b>Udana rozmowa =</b> ${esc(d.sukces)}</p>
    <p><b>Najczęstszy powód przegranej:</b><br>${blok(d.powodPrzegranej)}</p>

    <h3>Opcjonalne</h3>
    <p><b>Konkurencja:</b> ${esc(d.konkurencja) || "nie podano"}</p>
    <p><b>Żargon:</b><br>${blok(d.zargon) || "nie podano"}</p>
    <p><b>Zakazy:</b><br>${blok(d.zakazy) || "nie podano"}</p>
    <p><b>Nagranie:</b> ${esc(d.nagranie) || "nie podano"}</p>
  `;

  try {
    await resend.emails.send({
      from: "SalesAI <hello@jakubchodakowski.com>",
      to: "chodakowski2019@gmail.com",
      replyTo: d.email,
      subject: `Ankieta SalesAI — ${d.firma} (${d.osoba})`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
