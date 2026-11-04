import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { widokKonta } from "@/lib/bruno/jako";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { analizaEtapow, analizaZDeali, crmWlaczony, pobierzLejek } from "@/lib/bruno/lejek";
import LejekWidok from "@/components/bruno/lejek-widok";
import PrzelacznikHandlowca from "@/components/bruno/przelacznik-handlowca";

export const dynamic = "force-dynamic";

// 4.11 (USER_001): BRUNO POD CRM. Lejek sprzedaży firmy z Pipedrive: szef widzi cały zespół (kto na którym
// etapie traci deale), handlowiec widzi swoje deale i etap, na którym traci najwięcej → „Trenuj ten etap”.
// Szef z ?jako= ogląda lejek jednego handlowca („Bruno handlowca”). Tylko firma demo z tokenem (crmWlaczony).

export default async function BrunoLejekPage({ searchParams }: { searchParams: Promise<{ jako?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma?.pipedrive_token) redirect("/bruno/panel");
  const { jezyk } = await tSerwer();
  const { jako } = await searchParams;
  const w = await widokKonta(konto, firma, jako);
  const szef = w.szef;
  const ja = w.konto.email.toLowerCase();

  let blad: string | null = null;
  try {
    const lejek = await pobierzLejek(firma.pipedrive_token);
    const handlowcy = szef ? w.handlowcy : [w.konto];
    const osoby = handlowcy.map((h) => ({ email: h.email, imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null }));
    const znane = new Set(osoby.map((o) => o.email.toLowerCase()));
    const widoczne = szef ? lejek.deale : lejek.deale.filter((d) => d.handlowiec === ja);
    const analizy = osoby.map((o) => analizaZDeali(o.email, lejek.etapy, lejek.deale.filter((d) => d.handlowiec === o.email.toLowerCase())));
    const bezHandlowca = szef ? lejek.deale.filter((d) => !d.handlowiec || !znane.has(d.handlowiec)) : [];
    return (
      <>
        {w.jakoHandlowiec && <PrzelacznikHandlowca sciezka="/bruno/lejek" jezyk={jezyk} handlowcy={w.handlowcy} wybrany={w.konto.email} />}
        <LejekWidok firma={firma} jezyk={jezyk} szef={szef} pipeline={lejek.pipeline} etapy={lejek.etapy} zespol={analizaEtapow(lejek.etapy, widoczne)} osoby={osoby} analizy={analizy} deale={widoczne} bezHandlowca={bezHandlowca.length} ja={ja} jako={w.jako} imie={w.jakoHandlowiec ? (w.konto.imie ?? w.konto.email) : null} />
      </>
    );
  } catch (e) {
    blad = String((e as Error)?.message ?? e);
  }
  return <LejekWidok firma={firma} jezyk={jezyk} szef={szef} pipeline={null} etapy={[]} zespol={[]} osoby={[]} analizy={[]} deale={[]} bezHandlowca={0} ja={ja} blad={blad} jako={w.jako} imie={null} />;
}
