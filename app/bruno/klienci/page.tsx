import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, handlowcyFirmy, pobierzFirme } from "@/lib/bruno/firmy";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { crmWlaczony, pobierzLejek } from "@/lib/bruno/lejek";
import KlienciLista from "@/components/bruno/klienci-widok";

export const dynamic = "force-dynamic";

// 4.11 (USER_001, pkt 2): ZAKŁADKA KLIENCI. Lista z CRM (Pipedrive przez lib/bruno/lejek.ts): nazwa, firma, etap,
// wartość, ostatni kontakt, następne zadanie. Szef widzi wszystkich, handlowiec swoich. Klik = karta klienta.

export default async function BrunoKlienciPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma?.pipedrive_token) redirect("/bruno/panel");
  const szef = czySzef(konto);
  const { jezyk } = await tSerwer();
  const { q, status } = await searchParams;

  let blad: string | null = null;
  try {
    const [lejek, handlowcy] = await Promise.all([pobierzLejek(firma.pipedrive_token), szef ? handlowcyFirmy(firma.id) : Promise.resolve([konto])]);
    const osoby = handlowcy.map((h) => ({ email: h.email.toLowerCase(), imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null }));
    const widoczne = szef ? lejek.deale : lejek.deale.filter((d) => d.handlowiec === email.toLowerCase());
    return <KlienciLista firma={firma} jezyk={jezyk} szef={szef} etapy={lejek.etapy} deale={widoczne} osoby={osoby} q={typeof q === "string" ? q.slice(0, 80) : ""} status={status === "won" || status === "lost" || status === "all" ? status : "open"} />;
  } catch (e) {
    blad = String((e as Error)?.message ?? e);
  }
  return <KlienciLista firma={firma} jezyk={jezyk} szef={szef} etapy={[]} deale={[]} osoby={[]} q="" status="open" blad={blad} />;
}
