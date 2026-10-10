import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ROZMOWA_SEKUND, kartyDoPowtorki, limitDzienny, planFree, rozmowyDzis, stanDostepu, stanFree, type Konto } from "@/lib/bruno/db";
import { htmlNieZalogowany, htmlPrzypomnienie, htmlPrzypomnienieFree, wyslij } from "@/lib/bruno/mail";
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
  const free: string[] = [];
  for (const konto of (konta ?? []) as Konto[]) {
    const stan = stanDostepu(konto);
    if (!stan.aktywny) continue;
    // 10.10 (USER_001): konto free = jedno przypomnienie DZIENNIE, dopóki nie skończy 3 bezpłatnych rozmów.
    // Po trzeciej cisza (paywall jest w panelu). Niezależnie od pierwszego logowania.
    if (planFree(konto)) {
      const f = await stanFree(konto);
      if (f.zablokowane) continue;
      try {
        await wyslij({
          do: konto.email,
          rodzaj: "przypomnienie",
          temat: f.zuzyte === 0 ? "Bruno AI: Your first call is waiting" : `Bruno AI: you have ${f.zostalo} free ${f.zostalo === 1 ? "call" : "calls"} left`,
          html: htmlPrzypomnienieFree({ imie: konto.imie, zuzyte: f.zuzyte, zostalo: f.zostalo, zalogowany: Boolean(konto.start_dostepu) }),
          replyTo: "hello@jakubchodakowski.com",
        });
        free.push(konto.email);
      } catch (e) {
        console.error("[bruno przypomnienia] free", konto.email, e);
      }
      continue;
    }
    // Bez pierwszego logowania (6.10: dj_qb nie dostawał nic). Trzy razy: 1., 3. i 6. dzień po założeniu konta, potem cisza.
    if (!konto.start_dostepu) {
      const dniOdZalozenia = Math.round((Date.now() - new Date(konto.utworzono).getTime()) / 86_400_000);
      if (!DNI_PRZYPOMNIEN_BEZ_LOGOWANIA.includes(dniOdZalozenia)) continue;
      try {
        await wyslij({
          do: konto.email,
          rodzaj: "niezalogowany",
          temat: "Bruno AI: Your first call is waiting",
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
        temat: dzis === 0 ? `Bruno is waiting: ${dziennie} ${dziennie === 1 ? "call" : "calls"}, ${ROZMOWA_SEKUND / 60} ${ROZMOWA_SEKUND / 60 === 1 ? "minute" : "minutes"} each` : `Bruno is waiting: ${dziennie - dzis} ${dziennie - dzis === 1 ? "call" : "calls"} left`,
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

  return NextResponse.json({ ok: true, godzinaPL, wyslane, niezalogowani, free, nagrania });
}
