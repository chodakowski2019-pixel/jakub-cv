import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ROZMOWA_SEKUND, kartyDoPowtorki, limitDzienny, rozmowyDzis, stanDostepu, type Konto } from "@/lib/bruno/db";
import { htmlNieZalogowany, htmlPrzypomnienie, wyslij } from "@/lib/bruno/mail";
import { dociagnijNagraniaEl } from "@/lib/bruno/nagrania";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DNI_PRZYPOMNIEN_BEZ_LOGOWANIA = [1, 3, 6];

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
  const niezalogowani: string[] = [];
  for (const konto of (konta ?? []) as Konto[]) {
    const stan = stanDostepu(konto);
    if (!stan.aktywny) continue;
    // Bez pierwszego logowania (6.10: dj_qb nie dostawał nic). Trzy razy: 1., 3. i 6. dzień po założeniu konta, potem cisza.
    if (!konto.start_dostepu) {
      const dniOdZalozenia = Math.round((Date.now() - new Date(konto.utworzono).getTime()) / 86_400_000);
      if (!DNI_PRZYPOMNIEN_BEZ_LOGOWANIA.includes(dniOdZalozenia)) continue;
      try {
        await wyslij({
          do: konto.email,
          rodzaj: "niezalogowany",
          temat: "Bruno AI: Twoja pierwsza rozmowa czeka",
          html: htmlNieZalogowany({ imie: konto.imie, dni: konto.dni }),
          replyTo: "hello@jakubchodakowski.com",
        });
        niezalogowani.push(konto.email);
      } catch (e) {
        console.error("[bruno przypomnienia] niezalogowany", konto.email, e);
      }
      continue;
    }
    const godzina = godziny.get(konto.email) ?? 8;
    if (!wymus && godzina !== godzinaPL) continue;
    const dzis = await rozmowyDzis(konto.email);
    const dziennie = limitDzienny(konto);
    if (dzis >= dziennie) continue;
    const karty = await kartyDoPowtorki(konto.email, 50);
    try {
      await wyslij({
        do: konto.email,
        rodzaj: "przypomnienie",
        temat: dzis === 0 ? `Bruno czeka: ${dziennie} rozmowy po ${ROZMOWA_SEKUND / 60} minuty` : `Bruno czeka: zostały ${dziennie - dzis} rozmowy`,
        html: htmlPrzypomnienie({ imie: konto.imie, kart: karty.length, rozmowyDzis: dzis, dniZostalo: stan.dniZostalo, dziennie }),
      });
      wyslane.push(konto.email);
    } catch (e) {
      console.error("[bruno przypomnienia]", konto.email, e);
    }
  }
  // Przy okazji jednego dziennego przejazdu: dobieramy nagrania rozmów, które
  // zostały na koncie ElevenLabs (gdy ściąganie po rozmowie się nie udało).
  let nagrania: { sprawdzone: number; sciagniete: string[] } = { sprawdzone: 0, sciagniete: [] };
  try {
    nagrania = await dociagnijNagraniaEl(25);
  } catch (e) {
    console.error("[bruno przypomnienia] nagrania", e);
  }

  return NextResponse.json({ ok: true, godzinaPL, wyslane, niezalogowani, nagrania });
}
