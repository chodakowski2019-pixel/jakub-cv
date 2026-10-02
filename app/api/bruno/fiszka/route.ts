import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { FISZEK_DZIENNIE, pobierzKonfig, pobierzKonto, poczatekDniaPL, stanDostepu, type Karta } from "@/lib/bruno/db";
import { ocenFiszke } from "@/lib/bruno/fiszka";
import { ocenKarte, ocenaObiekcjiNaGrade } from "@/lib/bruno/fsrs";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST /api/bruno/fiszka { karta_id, odpowiedz }
// Fiszka z „Trening": trener (Haiku) ocenia odpowiedź na obiekcję, FSRS
// planuje powrót karty, wpis do bruno_fiszki (seria dni, statystyki).
export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!konto || !stanDostepu(konto).aktywny) return NextResponse.json({ ok: false, blad: "Dostęp testowy wygasł." }, { status: 403 });

  // Twardy limit dzienny po stronie serwera (USER_001 2.10): konto testowe ma FISZEK_DZIENNIE fiszek, nie nieskończoność.
  const { count } = await supabaseAdmin.from("bruno_fiszki").select("id", { count: "exact", head: true }).eq("email", email).gte("utworzono", poczatekDniaPL());
  if ((count ?? 0) >= FISZEK_DZIENNIE) {
    return NextResponse.json({ ok: false, blad: `Limit ${FISZEK_DZIENNIE} fiszek na dziś wykorzystany. Wróć jutro.`, kod: "limit" }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const kartaId = String(b.karta_id ?? "");
  const odpowiedz = String(b.odpowiedz ?? "").trim().slice(0, 1500);
  if (!kartaId) return NextResponse.json({ ok: false, blad: "Brak karty." }, { status: 400 });
  if (odpowiedz.split(/\s+/).filter(Boolean).length < 3) return NextResponse.json({ ok: false, blad: "Odpowiedz chociaż jednym zdaniem." }, { status: 400 });

  const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).eq("id", kartaId).maybeSingle();
  const karta = (data as Karta | null) ?? null;
  if (!karta || karta.typ !== "obiekcja") return NextResponse.json({ ok: false, blad: "Nie ma takiej karty." }, { status: 404 });

  try {
    const konfig = await pobierzKonfig(email);
    const w = await ocenFiszke({ obiekcja: karta.tresc, odpowiedz, konfig });
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
    return NextResponse.json({ ok: false, blad: "Trener nie odpowiedział. Spróbuj jeszcze raz.", szczegol: `${err?.status ?? ""} ${String(err?.message ?? e).slice(0, 200)}`.trim() }, { status: 502 });
  }
}
