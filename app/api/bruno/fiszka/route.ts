import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { limitFiszek, pobierzKonfig, pobierzKonto, poczatekDniaPL, stanDostepu, type Karta } from "@/lib/bruno/db";
import { ocenFiszke } from "@/lib/bruno/fiszka";
import { ocenKarte, ocenaObiekcjiNaGrade } from "@/lib/bruno/fsrs";
import { jezykLubDomyslny } from "@/lib/bruno/domeny";
import { tDla } from "@/lib/bruno/i18n";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST /api/bruno/fiszka { karta_id, odpowiedz }
// Fiszka z „Trening": trener (Haiku) ocenia odpowiedź na obiekcję, FSRS
// planuje powrót karty, wpis do bruno_fiszki (seria dni, statystyki).
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const konto = await pobierzKonto(email);
  // 11.10: werdykt trenera i komunikaty w języku konta.
  const jezyk = jezykLubDomyslny(konto?.jezyk);
  const t = tDla(jezyk);
  if (!konto || !stanDostepu(konto).aktywny) return NextResponse.json({ ok: false, blad: t("Your trial access has expired.", "Twój dostęp testowy wygasł.") }, { status: 403 });

  // Twardy limit dzienny po stronie serwera (USER_001 2.10): konto testowe ma FISZEK_DZIENNIE fiszek, nie nieskończoność.
  const { count } = await supabaseAdmin.from("bruno_fiszki").select("id", { count: "exact", head: true }).eq("email", email).gte("utworzono", poczatekDniaPL());
  const limit = limitFiszek(konto);
  if ((count ?? 0) >= limit) {
    return NextResponse.json({ ok: false, blad: t(`You've hit today's limit of ${limit} flashcards. Come back tomorrow.`, `Dzisiejszy limit fiszek (${limit}) wyczerpany. Wróć jutro.`), kod: "limit" }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const kartaId = String(b.karta_id ?? "");
  const odpowiedz = String(b.odpowiedz ?? "").trim().slice(0, 1500);
  if (!kartaId) return NextResponse.json({ ok: false, blad: t("Missing flashcard.", "Brak fiszki.") }, { status: 400 });
  if (odpowiedz.split(/\s+/).filter(Boolean).length < 3) return NextResponse.json({ ok: false, blad: t("Answer with at least one full sentence.", "Odpowiedz co najmniej jednym pełnym zdaniem.") }, { status: 400 });

  const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).eq("id", kartaId).maybeSingle();
  const karta = (data as Karta | null) ?? null;
  if (!karta || karta.typ === "kryterium") return NextResponse.json({ ok: false, blad: t("Flashcard not found.", "Nie znaleziono fiszki.") }, { status: 404 });

  try {
    const konfig = await pobierzKonfig(email);
    const w = await ocenFiszke({ obiekcja: karta.tresc, odpowiedz, konfig, typ: karta.typ as "obiekcja" | "poprawka" | "wiedza", pytanie: karta.pytanie, wzor: karta.wzor, jezyk });
    const due = await ocenKarte(email, karta.id, ocenaObiekcjiNaGrade(w.werdykt));
    const { error } = await supabaseAdmin.from("bruno_fiszki").insert({
      email,
      karta_id: karta.id,
      obiekcja: karta.tresc,
      odpowiedz,
      werdykt: w.werdykt,
      komentarz: w.komentarz,
      wzor: w.wzor,
      technika: w.technika,
    });
    if (error) console.error("bruno_fiszki insert", error.code, error.message);
    return NextResponse.json({ ok: true, ...w, due: due?.toISOString() ?? null });
  } catch (e) {
    console.error("[bruno fiszka]", e);
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ ok: false, blad: t("The coach didn't respond. Try again.", "Trener nie odpowiedział. Spróbuj ponownie."), szczegol: `${err?.status ?? ""} ${String(err?.message ?? e).slice(0, 200)}`.trim() }, { status: 502 });
  }
}
