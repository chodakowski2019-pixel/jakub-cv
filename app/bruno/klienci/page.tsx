import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { widokKonta } from "@/lib/bruno/jako";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { crmWlaczony, lejekFirmy } from "@/lib/bruno/lejek";
import KlienciLista from "@/components/bruno/klienci-widok";
import PrzelacznikHandlowca from "@/components/bruno/przelacznik-handlowca";

export const dynamic = "force-dynamic";

// 4.11 (USER_001, pkt 2): ZAKŁADKA KLIENCI. Lista z CRM (Pipedrive przez lib/bruno/lejek.ts): nazwa, firma, etap,
// wartość, ostatni kontakt, następne zadanie. Szef widzi wszystkich, handlowiec swoich (szef z ?jako= = jednego handlowca).

export default async function BrunoKlienciPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; jako?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma) redirect("/bruno/panel");
  const { jezyk } = await tSerwer();
  const { q, status, jako } = await searchParams;
  const w = await widokKonta(konto, firma, jako);
  const szef = w.szef;

  let blad: string | null = null;
  try {
    const lejek = await lejekFirmy(firma);
    const osoby = w.handlowcy.map((h) => ({ email: h.email.toLowerCase(), imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null }));
    const widoczne = szef ? lejek.deale : lejek.deale.filter((d) => d.handlowiec === w.konto.email.toLowerCase());
    return (
      <>
        {w.jakoHandlowiec && <PrzelacznikHandlowca sciezka="/bruno/klienci" jezyk={jezyk} handlowcy={w.handlowcy} wybrany={w.konto.email} />}
        <KlienciLista firma={firma} jezyk={jezyk} szef={szef} etapy={lejek.etapy} deale={widoczne} osoby={osoby} q={typeof q === "string" ? q.slice(0, 80) : ""} status={status === "won" || status === "lost" || status === "all" ? status : "open"} jako={w.jako} imie={w.jakoHandlowiec ? (w.konto.imie ?? w.konto.email) : null} />
      </>
    );
  } catch (e) {
    blad = String((e as Error)?.message ?? e);
  }
  return <KlienciLista firma={firma} jezyk={jezyk} szef={szef} etapy={[]} deale={[]} osoby={[]} q="" status="open" blad={blad} jako={w.jako} imie={null} />;
}
