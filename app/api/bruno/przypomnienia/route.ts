import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ROZMOW_DZIENNIE, kartyDoPowtorki, rozmowyDzis, stanDostepu, type Konto } from "@/lib/bruno/db";
import { htmlPrzypomnienie, wyslij } from "@/lib/bruno/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/bruno/przypomnienia: cron z vercel.json. Plan Hobby Vercela
// dopuszcza cron raz dziennie, więc biegnie o 6:00 UTC (8:00 PL latem, 7:00
// zimą) z ?wymus=1 i pomija godzinę z konfiguracji. Godzinowe wysyłanie
// wróci razem z planem Pro. Wysyła każdemu z aktywnym dostępem, kto nie
// zrobił jeszcze planu dnia. Zero zadań z głowy USER_001: biegnie samo.
export async function GET(req: Request) {
  const sekret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const k = new URL(req.url).searchParams.get("k");
  if (sekret && auth !== `Bearer ${sekret}` && k !== sekret) return NextResponse.json({ ok: false }, { status: 401 });

  const godzinaPL = Number(new Date().toLocaleString("en-US", { timeZone: "Europe/Warsaw", hour: "numeric", hour12: false }));
  const wymus = new URL(req.url).searchParams.get("wymus") === "1";

  const { data: konta } = await supabaseAdmin.from("bruno_konta").select("*").eq("aktywne", true);
  const { data: konfigi } = await supabaseAdmin.from("bruno_konfig").select("email, godzina_przypomnienia");
  const godziny = new Map((konfigi ?? []).map((k) => [k.email, k.godzina_przypomnienia as number]));

  const wyslane: string[] = [];
  for (const konto of (konta ?? []) as Konto[]) {
    const stan = stanDostepu(konto);
    if (!stan.aktywny || !konto.start_dostepu) continue;
    const godzina = godziny.get(konto.email) ?? 8;
    if (!wymus && godzina !== godzinaPL) continue;
    const dzis = await rozmowyDzis(konto.email);
    if (dzis >= ROZMOW_DZIENNIE) continue;
    const karty = await kartyDoPowtorki(konto.email, 50);
    try {
      await wyslij({
        do: konto.email,
        temat: dzis === 0 ? "Bruno czeka: 3 rozmowy po 5 minut" : `Bruno czeka: zostały ${ROZMOW_DZIENNIE - dzis} rozmowy`,
        html: htmlPrzypomnienie({ imie: konto.imie, kart: karty.length, rozmowyDzis: dzis, dniZostalo: stan.dniZostalo }),
      });
      wyslane.push(konto.email);
    } catch (e) {
      console.error("[bruno przypomnienia]", konto.email, e);
    }
  }
  return NextResponse.json({ ok: true, godzinaPL, wyslane });
}
