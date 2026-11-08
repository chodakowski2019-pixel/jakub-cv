import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, pobierzFirme } from "@/lib/bruno/firmy";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { crmWlaczony } from "@/lib/bruno/lejek";
import { raportyFirmy, zbierzDaneZespolu } from "@/lib/bruno/raport";
import RaportWidok from "@/components/bruno/raport-widok";

export const dynamic = "force-dynamic";

// 4.11 (USER_001, pkt 3): KOKPIT SZEFA: statystyki każdego handlowca (aktywność w CRM, treningi, oceny, najsłabszy etap,
// sprawdzian mentalny) + RAPORT MIESIĘCZNY z Claude („Wygeneruj teraz”; cron 1. dnia miesiąca z mailem = później).

export default async function BrunoRaportPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto || !czySzef(konto)) redirect("/bruno/panel");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma) redirect("/bruno/szef");
  const { jezyk } = await tSerwer();
  let blad: string | null = null;
  try {
    const [dane, raporty] = await Promise.all([zbierzDaneZespolu(firma, jezyk), raportyFirmy(firma.id)]);
    return <RaportWidok firma={firma} jezyk={jezyk} wiersze={dane.wiersze} waluta={dane.waluta} od={dane.od} do={dane.do} raporty={raporty} />;
  } catch (e) {
    blad = String((e as Error)?.message ?? e);
  }
  return <RaportWidok firma={firma} jezyk={jezyk} wiersze={[]} waluta="PLN" od="" do="" raporty={[]} blad={blad} />;
}
