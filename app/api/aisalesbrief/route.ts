import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { KUBELEK_NAGRANIA } from "@/lib/salesai";

// Ankieta wdrożeniowa SalesAI (/aisalesbrief). Wzór: /api/aisaleskontakt.
//
// To jest wsad do narzędzia, nie lead. Mail idzie w całości, bo na jego
// podstawie ustawiam scenariusz rozmowy. Kopia w Supabase (tabela
// salesai_briefy) jest best-effort: jeśli tabeli nie ma, mail i tak pójdzie.

const WYMAGANE = [
  "firma",
  "coSprzedajesz",
  "ktoDecyduje",
  "ileOsobDecyzja",
  "przebieg",
  "obiekcje",
  "sukces",
  "powodPrzegranej",
] as const;

// Podpis nagrania ważny rok: ankieta ma sens tak długo, jak trwa współpraca,
// a link leży w skrzynce, nie w publicznym miejscu.
const WAZNOSC_LINKU = 60 * 60 * 24 * 365;

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
  const kanaly: string[] = Array.isArray(d.kanaly) ? d.kanaly : [];
  const nagrania: string[] = Array.isArray(d.nagrania) ? d.nagrania.filter((x: unknown) => typeof x === "string") : [];
  if (brak.length || zachowania.length === 0 || etapy.length === 0 || kanaly.length === 0) {
    return NextResponse.json({ ok: false, blad: "Brak wymaganych pól" }, { status: 400 });
  }

  // Pole "Inne" bez opisu nie niesie żadnej informacji.
  if (zachowania.includes("Inne") && !d.zachowaniaInne) {
    return NextResponse.json({ ok: false, blad: "Opisz zachowanie klienta" }, { status: 400 });
  }

  try {
    await supabaseAdmin.from("salesai_briefy").insert({
      firma: d.firma,
      co_sprzedajesz: d.coSprzedajesz,
      kto_decyduje: d.ktoDecyduje,
      ile_osob_decyzja: d.ileOsobDecyzja,
      zachowania,
      zachowania_inne: d.zachowaniaInne || null,
      kanaly,
      etapy,
      przebieg: d.przebieg,
      obiekcje: d.obiekcje,
      sukces: d.sukces,
      powod_przegranej: d.powodPrzegranej,
      uwagi: d.uwagi || null,
      nagrania,
    });
  } catch (err) {
    console.error("supabase insert failed", err);
  }

  // Kubełek jest prywatny, więc do maila trzeba podpisać każdy plik osobno.
  const linki: string[] = [];
  for (const sciezka of nagrania) {
    try {
      const { data } = await supabaseAdmin.storage.from(KUBELEK_NAGRANIA).createSignedUrl(sciezka, WAZNOSC_LINKU);
      linki.push(data?.signedUrl ? `<a href="${esc(data.signedUrl)}">${esc(sciezka)}</a>` : esc(sciezka));
    } catch {
      linki.push(esc(sciezka));
    }
  }

  const zachowaniaTekst = zachowania
    .map((z) => (z === "Inne" ? `Inne: ${esc(d.zachowaniaInne)}` : esc(z)))
    .join(", ");

  const html = `
    <h2>Ankieta wdrożeniowa SalesAI — ${esc(d.firma)}</h2>

    <h3>1. Firma i produkt</h3>
    <p><b>Firma:</b> ${esc(d.firma)}</p>
    <p><b>Co sprzedaje:</b><br>${blok(d.coSprzedajesz)}</p>

    <h3>2. Klient (w tę osobę wciela się AI)</h3>
    <p><b>Kto decyduje:</b> ${esc(d.ktoDecyduje)}</p>
    <p><b>Ile osób w decyzji:</b> ${esc(d.ileOsobDecyzja)}</p>
    <p><b>Zachowanie w rozmowie:</b> ${zachowaniaTekst}</p>

    <h3>3. Rozmowa</h3>
    <p><b>Kanały:</b> ${kanaly.map(esc).join(", ")}</p>
    <p><b>Etapy do trenowania:</b> ${etapy.map(esc).join(", ")}</p>
    <p><b>Przebieg krok po kroku:</b><br>${blok(d.przebieg)}</p>
    <p><b>Obiekcje:</b><br>${blok(d.obiekcje)}</p>
    <p><b>Udana rozmowa =</b> ${esc(d.sukces)}</p>
    <p><b>Najczęstszy powód przegranej:</b><br>${blok(d.powodPrzegranej)}</p>

    <h3>Nagrania</h3>
    <p>${linki.length ? linki.join("<br>") : "brak"}</p>

    <h3>Od siebie</h3>
    <p>${blok(d.uwagi) || "nic nie dopisał"}</p>
  `;

  try {
    await resend.emails.send({
      from: "SalesAI <hello@jakubchodakowski.com>",
      to: "chodakowski2019@gmail.com",
      subject: `Ankieta SalesAI — ${d.firma}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
