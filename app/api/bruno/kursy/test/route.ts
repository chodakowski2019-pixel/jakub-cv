import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { PYTANIA, STYLE, policzWynik } from "@/lib/bruno/test-predyspozycji";
import { WEBINAR } from "@/lib/bruno/webinar";

export const dynamic = "force-dynamic";

// POST /api/bruno/kursy/test (30.10, USER_001): wynik testu predyspozycji. Zapis do `bruno_kursy_testy`
// (SQL: lib/bruno/sql/2026-10-30-kursy-zapisy.sql) + mail do USER_001 = lead B2C. Brak tabeli nie blokuje wyniku.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  let imie = String(b.imie ?? "").trim().slice(0, 100);
  let email = String(b.email ?? "").trim().toLowerCase().slice(0, 200);
  const odpowiedzi = Array.isArray(b.odpowiedzi) ? b.odpowiedzi.slice(0, PYTANIA.length).map((x: unknown) => Number(x) | 0) : [];
  let zrodlo = String(b.zrodlo ?? "").slice(0, 100) || null;
  // 31.10: test po potwierdzeniu miejsca na webinar. Token z linku potwierdzającego → imię i e-mail z zapisu.
  const token = String(b.token ?? "").trim();
  if (token) {
    if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.json({ ok: false, blad: "Zły link. Otwórz go jeszcze raz z maila." }, { status: 400 });
    const { data: z } = await supabaseAdmin.from("bruno_webinar_zapisy").select("imie, email").eq("webinar", WEBINAR.klucz).eq("token", token).maybeSingle();
    if (!z) return NextResponse.json({ ok: false, blad: "Nie znalazłem Twojego zapisu. Otwórz link jeszcze raz z maila." }, { status: 404 });
    imie = z.imie;
    email = z.email;
    zrodlo = `webinar:${WEBINAR.klucz}`;
  }
  if (!imie || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ ok: false, blad: "Wpisz imię i e-mail." }, { status: 400 });
  if (odpowiedzi.length !== PYTANIA.length) return NextResponse.json({ ok: false, blad: "Odpowiedz na wszystkie pytania." }, { status: 400 });

  const w = policzWynik(odpowiedzi);
  const { error } = await supabaseAdmin.from("bruno_kursy_testy").insert({ imie, email, odpowiedzi, styl: w.styl, kurs: w.kurs.slug, zrodlo });
  if (error) console.error("bruno_kursy_testy", error.code, error.message);

  const lista = PYTANIA.map((p, i) => `<li>${esc(p.tekst)} <b>${esc(p.opcje[odpowiedzi[i]]?.tekst ?? "?")}</b></li>`).join("");
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email,
      temat: `Kurs: TEST ${imie}, ${STYLE[w.styl].nazwa} → ${w.kurs.tytul}`,
      html: `<p><b>${esc(imie)}</b> (${esc(email)}) zrobił test. Styl: <b>${STYLE[w.styl].nazwa}</b>, kurs: <b>${esc(w.kurs.tytul)}</b>. Źródło: ${esc(zrodlo ?? "brak")}</p><ul>${lista}</ul>`,
    });
  } catch (e) {
    console.error("[bruno kursy test] mail", e);
  }
  return NextResponse.json({ ok: true });
}
