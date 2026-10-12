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
/** Godzina PL (czas polski), o której raz dziennie biegnie konserwacja: wygaszanie Pro i dociąganie nagrań. */
const GODZINA_KONSERWACJI = 6;
/** Domyślna godzina przypomnienia, gdy konto nie ma wiersza w bruno_konfig (to samo co domyślna konfiguracja w db.ts). */
const DOMYSLNA_GODZINA = 8;
/** Rodzaje maili z tego crona: po jednym dziennie na konto, pilnuje tego zapis w bruno_maile. */
const RODZAJE_CRONA = ["przypomnienie", "niezalogowany"];

/** Północ czasu polskiego (jako chwila UTC) dla danej chwili. */
function poczatekDniaPL(teraz = new Date()): Date {
  const c = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(teraz).map((p) => [p.type, p.value]),
  );
  const zgrubnie = new Date(Date.UTC(Number(c.year), Number(c.month) - 1, Number(c.day), 0, 0, 0));
  const f = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Warsaw", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const w = Object.fromEntries(f.formatToParts(zgrubnie).map((p) => [p.type, p.value]));
  const jakoUtc = Date.UTC(Number(w.year), Number(w.month) - 1, Number(w.day), Number(w.hour), Number(w.minute));
  return new Date(zgrubnie.getTime() - (jakoUtc - zgrubnie.getTime()));
}

// GET /api/bruno/przypomnienia
// 12.10 (K1): biegnie CO GODZINĘ o :00 czasu polskiego z cron-job.org (0 zł; plan Hobby Vercela
// dopuszcza tylko 1 cron dziennie). Bez `?wymus=1` wysyła tylko kontom, których
// `bruno_konfig.godzina_przypomnienia` (5-22, czas PL) = bieżąca godzina PL, i tylko raz dziennie
// na konto (sprawdza zapis w `bruno_maile`: rodzaj + wyslano od północy PL). `?wymus=1` pomija
// godzinę, ale „raz dziennie” zostaje. Konserwacja (wygaszanie Pro, dociąganie nagrań) = raz
// dziennie: o GODZINA_KONSERWACJI PL, z `?wymus=1` albo z `?konserwacja=1` (cron Vercela, zapas).
// Dostęp: nagłówek `Authorization: Bearer CRON_SECRET` (Vercel) albo `?k=CRON_SECRET` (cron-job.org).
export async function GET(req: Request) {
  const sekret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const params = new URL(req.url).searchParams;
  const k = params.get("k");
  if (sekret && auth !== `Bearer ${sekret}` && k !== sekret) return NextResponse.json({ ok: false }, { status: 401 });

  const teraz = new Date();
  const godzinaPL = Number(teraz.toLocaleString("en-US", { timeZone: "Europe/Warsaw", hour: "numeric", hour12: false })) % 24;
  const wymus = params.get("wymus") === "1";
  const konserwacja = wymus || params.get("konserwacja") === "1" || godzinaPL === GODZINA_KONSERWACJI;

  // 11.10: roczny Bruno Pro jest płatnością jednorazową (bez subskrypcji), więc po 365 dniach wygaszamy go tu.
  // Tylko konta z `pro_do` i bez subskrypcji Stripe: firmy B2B (pro_do puste) i subskrypcje (Stripe pilnuje sam) bez zmian.
  const wygasle: string[] = [];
  if (konserwacja) {
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

  // 12.10 (K1): komu dziś (czas PL) już poszło przypomnienie z tego crona. „pominiety” liczy się
  // jak wysłany (dev bez RESEND_API_KEY), „blad” nie: następna godzina spróbuje jeszcze raz.
  const { data: dzisiejsze } = await supabaseAdmin
    .from("bruno_maile")
    .select("email")
    .in("rodzaj", RODZAJE_CRONA)
    .in("wynik", ["wyslany", "pominiety"])
    .gte("wyslano", poczatekDniaPL(teraz).toISOString());
  const juzDzis = new Set((dzisiejsze ?? []).map((m) => m.email as string));

  const wyslane: string[] = [];
  const niezalogowani: string[] = [];
  const free: string[] = [];
  const pominiete = { juzDzis: 0, innaGodzina: 0 };
  for (const konto of (konta ?? []) as Konto[]) {
    const stan = stanDostepu(konto);
    if (!stan.aktywny) continue;
    // 12.10 (K1): każdy rodzaj przypomnienia (free, niezalogowany, Pro) idzie o godzinie z konfiguracji konta i raz dziennie.
    if (juzDzis.has(konto.email)) {
      pominiete.juzDzis++;
      continue;
    }
    const godzina = godziny.get(konto.email) ?? DOMYSLNA_GODZINA;
    if (!wymus && godzina !== godzinaPL) {
      pominiete.innaGodzina++;
      continue;
    }
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
  // Raz dziennie (konserwacja): dobieramy nagrania rozmów, które zostały na koncie
  // ElevenLabs (gdy ściąganie po rozmowie się nie udało).
  let nagrania: { sprawdzone: number; sciagniete: string[] } = { sprawdzone: 0, sciagniete: [] };
  if (konserwacja) {
    try {
      nagrania = await dociagnijNagraniaEl(25);
    } catch (e) {
      console.error("[bruno przypomnienia] nagrania", e);
    }
  }

  return NextResponse.json({ ok: true, godzinaPL, wymus, konserwacja, wyslane, niezalogowani, free, pominiete, wygasle, nagrania });
}
