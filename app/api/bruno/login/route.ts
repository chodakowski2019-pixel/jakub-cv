import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { CIASTECZKO, WAZNOSC_SESJI_S, normalizujEmail, nowyToken } from "@/lib/bruno/auth";
import { pobierzKonto, pobierzKonfig, stanDostepu } from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";

export const dynamic = "force-dynamic";

// POST /api/bruno/login: e-mail + kod → ciasteczko sesji.
// Pierwsze udane logowanie uruchamia 7-dniowy licznik dostępu (USER_001 30.09).
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = normalizujEmail(b.email);
    const kod = String(b.kod ?? "").replace(/\D/g, "");
    if (!email || kod.length !== 6) return NextResponse.json({ ok: false, blad: "Podaj adres i 6-cyfrowy kod." }, { status: 400 });

    const { data: wpis } = await supabaseAdmin
      .from("bruno_kody")
      .select("id, wygasa")
      .eq("email", email)
      .eq("kod", kod)
      .gt("wygasa", new Date().toISOString())
      .order("utworzono", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!wpis) return NextResponse.json({ ok: false, blad: "Kod jest zły albo wygasł." }, { status: 401 });

    const konto = await pobierzKonto(email);
    const stan = stanDostepu(konto);
    if (!konto || !stan.aktywny) return NextResponse.json({ ok: false, blad: "Dostęp wygasł albo konto nie istnieje." }, { status: 403 });

    // Kod jednorazowy: kasujemy wszystkie kody tego adresu.
    await supabaseAdmin.from("bruno_kody").delete().eq("email", email);

    if (!konto.start_dostepu) {
      await supabaseAdmin.from("bruno_konta").update({ start_dostepu: new Date().toISOString() }).eq("email", email);
    }
    // Karty powtórek od pierwszego dnia, żeby panel od razu miał co pokazać.
    await zapewnijKarty(email, await pobierzKonfig(email));

    const c = await cookies();
    c.set(CIASTECZKO, nowyToken(email), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: WAZNOSC_SESJI_S,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno login]", e);
    return NextResponse.json({ ok: false, blad: "Nie udało się zalogować." }, { status: 500 });
  }
}
