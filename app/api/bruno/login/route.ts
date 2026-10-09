import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { zapiszWejscie, zrodloZParametru } from "@/lib/bruno/wejscia";
import {
  BLOKADA_MS,
  CIASTECZKO,
  LIMIT_PROB,
  WAZNOSC_SESJI_S,
  kodPasuje,
  normalizujEmail,
  nowyToken,
  poprawnyKod,
} from "@/lib/bruno/auth";
import { pobierzKonto, pobierzKonfig, stanDostepu } from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";

export const dynamic = "force-dynamic";

// POST /api/bruno/login: e-mail + stały 6-cyfrowy kod konta → ciasteczko sesji.
// Pierwsze udane logowanie uruchamia 7-dniowy licznik dostępu (USER_001 30.09).
//
// Komunikat o błędzie jest jeden dla złego adresu i złego kodu: formularz nie
// może być sprawdzarką, kto ma dostęp do testu.
const ZLE = "Zły adres albo kod.";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = normalizujEmail(b.email);
    const kod = poprawnyKod(b.kod);
    if (!email || !kod) return NextResponse.json({ ok: false, blad: "Podaj adres i 6-cyfrowy kod." }, { status: 400 });

    const konto = await pobierzKonto(email);
    if (!konto || !konto.kod_hash) return NextResponse.json({ ok: false, blad: ZLE }, { status: 401 });

    if (konto.blokada_do && new Date(konto.blokada_do).getTime() > Date.now()) {
      const minut = Math.ceil((new Date(konto.blokada_do).getTime() - Date.now()) / 60_000);
      return NextResponse.json({ ok: false, blad: `Za dużo prób. Spróbuj za ${minut} min.` }, { status: 429 });
    }

    if (!kodPasuje(kod, konto.kod_hash)) {
      const nieudane = (konto.nieudane ?? 0) + 1;
      await supabaseAdmin
        .from("bruno_konta")
        .update({
          nieudane,
          blokada_do: nieudane >= LIMIT_PROB ? new Date(Date.now() + BLOKADA_MS).toISOString() : null,
        })
        .eq("email", email);
      return NextResponse.json({ ok: false, blad: ZLE }, { status: 401 });
    }

    const stan = stanDostepu(konto);
    if (!stan.aktywny) return NextResponse.json({ ok: false, blad: "Dostęp testowy wygasł." }, { status: 403 });

    await supabaseAdmin
      .from("bruno_konta")
      .update({
        nieudane: 0,
        blokada_do: null,
        ...(konto.start_dostepu ? {} : { start_dostepu: new Date().toISOString() }),
      })
      .eq("email", email);

    // Karty powtórek od pierwszego dnia, żeby panel od razu miał co pokazać.
    await zapewnijKarty(email, await pobierzKonfig(email));
    // 9.10 (E18): log logowania ze źródłem (`?src=` z linku w mailu, przekazane przez formularz).
    await zapiszWejscie({ email, rodzaj: "logowanie", zrodlo: zrodloZParametru(typeof b.src === "string" ? b.src : null), agent: req.headers.get("user-agent") });

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
