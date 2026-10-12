import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ROZMOWA_SEKUND, kartyDoPowtorki, limitDzienny, planFree, rozmowyDzis, stanDostepu, stanFree, type Konto } from "@/lib/bruno/db";
import { htmlNieZalogowany, htmlPrzypomnienie, htmlPrzypomnienieFree, wyslij } from "@/lib/bruno/mail";
import { dociagnijNagraniaEl } from "@/lib/bruno/nagrania";
import { mnoga, tDla } from "@/lib/bruno/i18n";
import { wylaczPro } from "@/lib/bruno/stripe";

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

  // 11.10: roczny Bruno Pro jest płatnością jednorazową (bez subskrypcji), więc po 365 dniach wygaszamy go tu.
  // Tylko konta z `pro_do` i bez subskrypcji Stripe: firmy B2B (pro_do puste) i subskrypcje (Stripe pilnuje sam) bez zmian.
  const wygasle: string[] = [];
  {
    const { data: doWygaszenia } = await supabaseAdmin
      .from("bruno_konta")
      .select("email")
      .eq("plan", "pelny")
      .is("stripe_subscription_id", null)
      .not("pro_do", "is", null)
      .lt("pro_do", new Date().toISOString());
    for (const k of doWygaszenia ?? []) {
      try {
        await wylaczPro(k.email as string);
        wygasle.push(k.email as string);
      } catch (e) {
        console.error("[bruno przypomnienia] wygaszenie Pro", k.email, e);
      }
    }
  }

  const { data: konta } = await supabaseAdmin.from("bruno_konta").select("*").eq("aktywne", true);
  const { data: konfigi } = await supabaseAdmin.from("bruno_konfig").select("email, godzina_przypomnienia");
  const godziny = new Map((konfigi ?? []).map((k) => [k.email, k.godzina_przypomnienia as number]));

  const wyslane: string[] = [];
  const niezalogowani: string[] = [];
  const free: string[] = [];
  for (const konto of (konta ?? []) as Konto[]) {
    const stan = stanDostepu(konto);
    if (!stan.aktywny) continue;
    // 11.10: temat i treść maila w języku konta.
    const t = tDla(konto.jezyk);
    // 10.10 (USER_001): konto free = jedno przypomnienie DZIENNIE, dopóki nie skończy 3 bezpłatnych rozmów.
    // Po trzeciej cisza (paywall jest w panelu). Niezależnie od pierwszego logowania.
    if (planFree(konto)) {
      const f = await stanFree(konto);
      if (f.zablokowane) continue;
      try {
        await wyslij({
          do: konto.email,
          rodzaj: "przypomnienie",
          temat:
            f.zuzyte === 0
              ? t("Bruno AI: Your first call is waiting", "Bruno AI: Twoja pierwsza rozmowa czeka")
              : t(
                  `Bruno AI: you have ${f.zostalo} free ${f.zostalo === 1 ? "call" : "calls"} left`,
                  `Bruno AI: ${f.zostalo === 1 ? "została" : mnoga("pl", f.zostalo, ["", ""], ["", "zostały", "zostało"])} Ci ${f.zostalo} ${mnoga("pl", f.zostalo, ["", ""], ["bezpłatna rozmowa", "bezpłatne rozmowy", "bezpłatnych rozmów"])}`,
                ),
          html: htmlPrzypomnienieFree({ imie: konto.imie, jezyk: konto.jezyk, zuzyte: f.zuzyte, zostalo: f.zostalo, zalogowany: Boolean(konto.start_dostepu) }),
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
          temat: t("Bruno AI: Your first call is waiting", "Bruno AI: Twoja pierwsza rozmowa czeka"),
          html: htmlNieZalogowany({ imie: konto.imie, jezyk: konto.jezyk, dni: konto.dni }),
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
    const karty = await kartyDoPowtorki(konto.email, 50, konto.jezyk);
    try {
      await wyslij({
        do: konto.email,
        rodzaj: "przypomnienie",
        temat:
          dzis === 0
            ? t(
                `Bruno is waiting: ${dziennie} ${dziennie === 1 ? "call" : "calls"}, ${ROZMOWA_SEKUND / 60} ${ROZMOWA_SEKUND / 60 === 1 ? "minute" : "minutes"} each`,
                `Bruno czeka: ${dziennie} ${mnoga("pl", dziennie, ["", ""], ["rozmowa", "rozmowy", "rozmów"])} po ${ROZMOWA_SEKUND / 60} ${mnoga("pl", ROZMOWA_SEKUND / 60, ["", ""], ["minutę", "minuty", "minut"])}`,
              )
            : t(
                `Bruno is waiting: ${dziennie - dzis} ${dziennie - dzis === 1 ? "call" : "calls"} left`,
                `Bruno czeka: ${dziennie - dzis === 1 ? "została" : mnoga("pl", dziennie - dzis, ["", ""], ["", "zostały", "zostało"])} ${dziennie - dzis} ${mnoga("pl", dziennie - dzis, ["", ""], ["rozmowa", "rozmowy", "rozmów"])}`,
              ),
        html: htmlPrzypomnienie({ imie: konto.imie, jezyk: konto.jezyk, kart: karty.length, rozmowyDzis: dzis, dniZostalo: stan.dniZostalo, dziennie }),
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

  return NextResponse.json({ ok: true, godzinaPL, wyslane, niezalogowani, free, wygasle, nagrania });
}
