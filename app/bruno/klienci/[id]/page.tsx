import { notFound, redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, handlowcyFirmy, pobierzFirme } from "@/lib/bruno/firmy";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { crmWlaczony, domenaPipedrive, notatkiDeala, pobierzLejek, typyAktywnosci, zadaniaDeala } from "@/lib/bruno/lejek";
import { KlientKarta } from "@/components/bruno/klienci-widok";

export const dynamic = "force-dynamic";

// 4.11 (USER_001, pkt 2): KARTA KLIENTA: dane deala, notatki, historia aktywności (w tym „Trening Bruno”),
// przycisk „Przećwicz rozmowę z tym klientem” (postać z danych deala → /bruno/rozmowa?sytuacja=), „Zaktualizuj w czacie”.

export default async function BrunoKlientPage({ params }: { params: Promise<{ id: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma?.pipedrive_token) redirect("/bruno/panel");
  const szef = czySzef(konto);
  const { jezyk } = await tSerwer();
  const { id } = await params;
  const dealId = Number(id);
  if (!Number.isFinite(dealId)) notFound();
  const token = firma.pipedrive_token;

  const [lejek, handlowcy] = await Promise.all([pobierzLejek(token), szef ? handlowcyFirmy(firma.id) : Promise.resolve([konto])]);
  const deal = lejek.deale.find((d) => d.id === dealId);
  if (!deal || (!szef && deal.handlowiec !== email.toLowerCase())) notFound();
  const [notatki, aktywnosci, typy, domena] = await Promise.all([notatkiDeala(token, dealId, 30), zadaniaDeala(token, dealId, 50), typyAktywnosci(token), domenaPipedrive(token)]);
  const osoby = handlowcy.map((h) => ({ email: h.email.toLowerCase(), imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null }));
  return (
    <KlientKarta
      firma={firma}
      jezyk={jezyk}
      szef={szef}
      deal={deal}
      etapy={lejek.etapy}
      notatki={notatki}
      aktywnosci={aktywnosci.map((a) => ({ ...a, typNazwa: typy.get(a.typ) ?? a.typ }))}
      handlowiec={osoby.find((o) => o.email === deal.handlowiec) ?? null}
      linkCrm={domena ? `${domena}/deal/${deal.id}` : null}
    />
  );
}
