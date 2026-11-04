import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, pobierzRozmowy } from "@/lib/bruno/db";
import { czySzef, handlowcyFirmy, pobierzFirme } from "@/lib/bruno/firmy";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { analizaZDeali, crmWlaczony, dealeBezRuchu, domenaPipedrive, formatKwota, notatkiDeala, pobierzLejek, zadaniaFirmy } from "@/lib/bruno/lejek";
import { dobierzTrening } from "@/lib/bruno/dobor-treningu";
import Kokpit, { type Powitanie } from "@/components/bruno/kokpit";

export const dynamic = "force-dynamic";

// 4.11 (USER_001): KOKPIT jak ChatGPT. Handlowiec pisze albo mówi („byłem u Kowalskiego, chce ofertę do piątku”),
// AI sam dopisuje notatki do deali, przesuwa etapy, zakłada zadania i deale w CRM (Pipedrive).
// Argument sprzedażowy: „CRM, z którego handlowcy CHCĄ korzystać”. Tylko firma demo z tokenem.
// 4.11 wieczór (USER_001, pkt 1): zakładka nazywa się CZAT i jest PIERWSZYM EKRANEM po zalogowaniu. Bruno wita,
// podsumowuje dzisiejsze zadania z CRM, deale bez ruchu > 7 dni i proponuje 1 trening (pkt 5: dobór automatyczny).

export default async function BrunoKokpitPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma?.pipedrive_token) redirect("/bruno/panel");
  const { jezyk } = await tSerwer();
  const token = firma.pipedrive_token;
  const szef = czySzef(konto);
  const ja = email.toLowerCase();
  const dzis = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

  let powitanie: Powitanie | null = null;
  try {
    const [lejek, zadania, domena, handlowcy, rozmowy] = await Promise.all([
      pobierzLejek(token),
      zadaniaFirmy(token, { do: dzis }),
      domenaPipedrive(token),
      szef ? handlowcyFirmy(firma.id) : Promise.resolve([konto]),
      pobierzRozmowy(email, 20),
    ]);
    const znane = new Set(handlowcy.map((h) => h.email.toLowerCase()));
    const moje = szef ? lejek.deale : lejek.deale.filter((d) => d.handlowiec === ja);
    const mojeId = new Set(moje.map((d) => d.id));
    const imie = (e: string | null) => handlowcy.find((h) => h.email.toLowerCase() === e)?.imie ?? null;
    const kwota = (n: number, w: string) => formatKwota(n, w, jezyk);
    const naDzis = zadania
      .filter((z) => z.deal_id && mojeId.has(z.deal_id))
      .sort((a, b) => (a.data + (a.godzina ?? "")).localeCompare(b.data + (b.godzina ?? "")))
      .slice(0, 8)
      .map((z) => {
        const d = moje.find((x) => x.id === z.deal_id);
        return { id: z.id, temat: z.temat, data: z.data, godzina: z.godzina, zalegle: z.data < dzis, deal: d?.tytul ?? z.organizacja ?? "", dealId: z.deal_id, kto: szef ? imie(d?.handlowiec ?? null) : null };
      });
    const bezRuchu = dealeBezRuchu(moje, 7)
      .slice(0, 6)
      .map((d) => ({ id: d.id, tytul: d.tytul, etap: lejek.etapy.find((e) => e.id === d.etap_id)?.nazwa ?? "", wartosc: kwota(d.wartosc, d.waluta), dni: Math.floor((Date.now() - new Date(d.aktualizacja!).getTime()) / 86_400_000), kto: szef ? imie(d.handlowiec) : null }));
    // Trening (pkt 5): handlowiec = jego lejek; szef = najsłabszy handlowiec zespołu (po skuteczności).
    let trening: Powitanie["trening"] = null;
    if (!szef) {
      const analiza = analizaZDeali(ja, lejek.etapy, moje);
      const dealNaj = analiza.najslabszy ? moje.filter((d) => d.status === "open" && d.etap_id === analiza.najslabszy!.id).sort((a, b) => b.wartosc - a.wartosc)[0] : null;
      const notatki = dealNaj ? (await notatkiDeala(token, dealNaj.id, 5).catch(() => [])).map((n) => n.tresc) : [];
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
  const domena = powitanie?.domena ?? (await domenaPipedrive(token));
  return <Kokpit jezyk={jezyk} imie={konto.imie ?? email} szef={szef} firma={firma.nazwa} domenaCrm={domena} powitanie={powitanie} />;
}
