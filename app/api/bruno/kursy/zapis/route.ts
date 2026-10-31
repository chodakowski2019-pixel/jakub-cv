import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { CENA, kursPoSlugu } from "@/lib/bruno/kursy";

export const dynamic = "force-dynamic";

// POST /api/bruno/kursy/zapis (30.10, USER_001): zapis na kurs ze strony /kursy/<slug>.
// Zapis do `bruno_kursy_zapisy` (SQL: lib/bruno/sql/2026-10-30-kursy-zapisy.sql) + mail do USER_001, który oddzwania
// i wysyła link do płatności Stripe. Brak tabeli nie blokuje maila.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const kurs = kursPoSlugu(String(b.kurs ?? ""));
  const imie = String(b.imie ?? "").trim().slice(0, 100);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 200);
  const telefon = String(b.telefon ?? "").trim().slice(0, 40);
  const plan = b.plan === "z-gory" ? "z-gory" : "miesiac";
  const zrodlo = String(b.zrodlo ?? "").slice(0, 100) || null;
  if (!kurs) return NextResponse.json({ ok: false, blad: "Nie ma takiego kursu." }, { status: 400 });
  if (!imie || !/^\S+@\S+\.\S+$/.test(email) || telefon.replace(/\D/g, "").length < 9)
    return NextResponse.json({ ok: false, blad: "Wpisz imię, e-mail i numer telefonu." }, { status: 400 });

  const { error } = await supabaseAdmin.from("bruno_kursy_zapisy").insert({ kurs: kurs.slug, imie, email, telefon, plan, zrodlo });
  if (error) console.error("bruno_kursy_zapisy", error.code, error.message);

  const kwota = plan === "z-gory" ? `${CENA.zGory} zł z góry` : `${CENA.miesiac} zł / mies.`;
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Kurs: ZAPIS ${imie}, ${kurs.tytul} (${kwota})`,
      html: `<p><b>${esc(imie)}</b> zapisuje się na <b>${esc(kurs.tytul)}</b>.</p><p>Plan: ${kwota}<br>E-mail: ${esc(email)}<br>Telefon: ${esc(telefon)}<br>Źródło: ${esc(zrodlo ?? "brak")}</p><p>Zadzwoń w 24 h i wyślij link do płatności.</p>`,
    });
  } catch (e) {
    console.error("[bruno kursy zapis] mail", e);
    if (error) return NextResponse.json({ ok: false, blad: "Nie udało się zapisać. Spróbuj ponownie." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
