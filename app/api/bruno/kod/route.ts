import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizujEmail, nowyKod, wygasniecieKodu } from "@/lib/bruno/auth";
import { pobierzKonto, stanDostepu } from "@/lib/bruno/db";
import { htmlKodLogowania, wyslij } from "@/lib/bruno/mail";

export const dynamic = "force-dynamic";

// POST /api/bruno/kod: wysyła 6-cyfrowy kod logowania na maila.
// Odpowiedź jest taka sama dla znanego i nieznanego adresu, żeby formularz
// nie był sprawdzarką, kto ma dostęp.
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = normalizujEmail(b.email);
    if (!email) return NextResponse.json({ ok: false, blad: "Podaj prawidłowy adres." }, { status: 400 });

    const konto = await pobierzKonto(email);
    const stan = stanDostepu(konto);
    if (konto && stan.aktywny) {
      const kod = nowyKod();
      const { error } = await supabaseAdmin.from("bruno_kody").insert({ email, kod, wygasa: wygasniecieKodu() });
      if (error) throw error;
      if (process.env.NODE_ENV === "development") console.log(`[bruno] kod dla ${email}: ${kod}`);
      await wyslij({ do: email, temat: `${kod} to Twój kod do Bruno AI`, html: htmlKodLogowania(kod) });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bruno kod]", e);
    return NextResponse.json({ ok: false, blad: "Nie udało się wysłać kodu." }, { status: 500 });
  }
}
