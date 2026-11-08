import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, pobierzRozmowy } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { widokKonta } from "@/lib/bruno/jako";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { analizaZDeali, crmWlaczony, dealeBezRuchu, formatKwota, lejekFirmy, naglowekZadania } from "@/lib/bruno/lejek";
import { notatkiKlienta, zadaniaFirmyCrm } from "@/lib/bruno/crm";
import { linkTreningu, planNaDzis } from "@/lib/bruno/plan-treningu";
import { dobierzTrening } from "@/lib/bruno/dobor-treningu";
import { zdjecieKlienta } from "@/lib/bruno/twarze";
import Kokpit, { type Powitanie } from "@/components/bruno/kokpit";
import PrzelacznikHandlowca from "@/components/bruno/przelacznik-handlowca";

export const dynamic = "force-dynamic";

// 4.11 (USER_001): CZAT z Bruno = kula z płynem na środku + UX jak ChatGPT (kokpit.tsx). Handlowiec pisze albo mówi,
// AI sam zapisuje w CRM (Pipedrive). Pierwszy ekran po zalogowaniu. Powitanie liczone z CRM: zadania na dziś,
// deale bez ruchu > 7 dni, 1 trening (pkt 5). Szef: „Bruno właściciela” (zespół) albo z ?jako= „Bruno handlowca”.

export default async function BrunoKokpitPage({ searchParams }: { searchParams: Promise<{ jako?: string; deal?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma) redirect("/bruno/panel");
  const { jezyk } = await tSerwer();
  const { jako } = await searchParams;
  const w = await widokKonta(konto, firma, jako);
  // 8.11: wszystko z CRM Bruno (Pipedrive tylko importuje).
  const szef = w.szef;
  const ja = w.konto.email.toLowerCase();
  const handlowcy = szef ? w.handlowcy : [w.konto];
  const dzis = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

  let powitanie: Powitanie | null = null;
  try {
    const [lejek, zadania, domena, rozmowy] = await Promise.all([lejekFirmy(firma), zadaniaFirmyCrm(firma.id, { do: dzis }), Promise.resolve(null), pobierzRozmowy(w.konto.email, 20)]);
    const znane = new Set(w.handlowcy.map((h) => h.email.toLowerCase()));
    const moje = szef ? lejek.deale : lejek.deale.filter((d) => d.handlowiec === ja);
    const mojeId = new Set(moje.map((d) => d.id));
    const imie = (e: string | null) => w.handlowcy.find((h) => h.email.toLowerCase() === e)?.imie ?? null;
    const kwota = (n: number, wal: string) => formatKwota(n, wal, jezyk);
    const naDzis = zadania
      .filter((z) => z.deal_id && mojeId.has(z.deal_id))
      .sort((a, b) => (a.data + (a.godzina ?? "")).localeCompare(b.data + (b.godzina ?? "")))
      .slice(0, 8)
      .map((z) => {
        const d = moje.find((x) => x.id === z.deal_id);
        return { id: z.id, temat: naglowekZadania(z.temat), data: z.data, godzina: z.godzina, zalegle: z.data < dzis, deal: d?.tytul ?? z.organizacja ?? "", dealId: z.deal_id, osoba: d?.osoba ?? z.osoba ?? null, zdjecie: zdjecieKlienta(d?.osoba ?? z.osoba), kto: szef ? imie(d?.handlowiec ?? null) : null };
      });
    const bezRuchu = dealeBezRuchu(moje, 7)
      .slice(0, 6)
      .map((d) => ({ id: d.id, tytul: d.tytul, etap: lejek.etapy.find((e) => e.id === d.etap_id)?.nazwa ?? "", wartosc: kwota(d.wartosc, d.waluta), dni: Math.floor((Date.now() - new Date(d.aktualizacja!).getTime()) / 86_400_000), osoba: d.osoba, zdjecie: zdjecieKlienta(d.osoba), kto: szef ? imie(d.handlowiec) : null }));
    let trening: Powitanie["trening"] = null;
    if (!szef) {
      const analiza = analizaZDeali(ja, lejek.etapy, moje);
      const dealNaj = analiza.najslabszy ? moje.filter((d) => d.status === "open" && d.etap_id === analiza.najslabszy!.id).sort((a, b) => b.wartosc - a.wartosc)[0] : null;
      const notatki = dealNaj ? (await notatkiKlienta(firma.id, dealNaj.id, 5).catch(() => [])).map((n) => n.tresc) : [];
      const p = dobierzTrening({ jezyk, analiza, deale: moje, rozmowy, notatki });
      trening = { etap: p.etap?.nazwa ?? null, kryterium: p.kryteriumNazwa, obiekcja: p.obiekcja, dlaczego: p.dlaczego, link: p.link, deal: p.deal?.tytul ?? null };
    } else {
      const analizy = handlowcy.map((h) => analizaZDeali(h.email.toLowerCase(), lejek.etapy, lejek.deale.filter((d) => d.handlowiec === h.email.toLowerCase()))).filter((a) => a.przegrane > 0);
      const naj = analizy.sort((a, b) => (a.skutecznosc ?? 100) - (b.skutecznosc ?? 100))[0] ?? null;
      if (naj?.najslabszy) {
        trening = { etap: naj.najslabszy.nazwa, kryterium: null, obiekcja: null, dlaczego: jezyk === "pl" ? `${imie(naj.email) ?? naj.email} ma ${naj.skutecznosc ?? 0} % skuteczności i traci najwięcej na etapie „${naj.najslabszy.nazwa}”.` : `${imie(naj.email) ?? naj.email} has a ${naj.skutecznosc ?? 0}% win rate and loses the most at “${naj.najslabszy.nazwa}”.`, link: `/bruno/szef/${encodeURIComponent(naj.email)}`, deal: imie(naj.email) };
      }
    }
    powitanie = {
      dzis,
      naDzis,
      zaleglych: zadania.filter((z) => z.deal_id && mojeId.has(z.deal_id) && z.data < dzis).length,
      bezRuchu,
      otwarte: moje.filter((d) => d.status === "open").length,
      wartoscOtwarte: kwota(moje.filter((d) => d.status === "open").reduce((s, d) => s + d.wartosc, 0), moje[0]?.waluta ?? "PLN"),
      trening,
      domena,
      bezHandlowca: szef ? lejek.deale.filter((d) => d.status === "open" && (!d.handlowiec || !znane.has(d.handlowiec))).length : 0,
    };
  } catch (e) {
    console.error("[kokpit powitanie]", e);
  }
  const domena = null;
  // 8.11 (algorytm treningu): plan dnia Bruno (5 treningów) do pigułki w czacie i komendy „trenuj”.
  try {
    const plan = await planNaDzis(w.konto, firma, szef && !w.jakoHandlowiec);
    if (powitanie) powitanie.plan = { zrobione: plan.zrobione, pozycje: plan.pozycje.map((p) => ({ nr: p.nr, tytul: p.tytul, dlaczego: p.dlaczego, zrobione: p.zrobione, ocena: p.ocena, link: linkTreningu(plan.dzien, p.nr) })) };
  } catch (e) {
    console.error("[kokpit plan]", e);
  }
  return (
    <>
      {w.jakoHandlowiec && <PrzelacznikHandlowca sciezka="/bruno/kokpit" jezyk={jezyk} handlowcy={w.handlowcy} wybrany={w.konto.email} />}
      <Kokpit jezyk={jezyk} imie={w.konto.imie ?? w.konto.email} szef={szef} firma={firma.nazwa} domenaCrm={domena} powitanie={powitanie} jako={w.jako} />
    </>
  );
}
