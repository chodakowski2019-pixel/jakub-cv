import { notFound, redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { widokKonta } from "@/lib/bruno/jako";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { crmWlaczony, domenaPipedrive, notatkiDeala, pobierzLejek, typyAktywnosci, zadaniaDeala } from "@/lib/bruno/lejek";
import { KlientKarta } from "@/components/bruno/klienci-widok";

export const dynamic = "force-dynamic";

// 4.11 (USER_001, pkt 2): KARTA KLIENTA: dane deala, notatki, historia aktywności (w tym „Trening Bruno”),
// przycisk „Przećwicz rozmowę z tym klientem” (postać z danych deala → /bruno/rozmowa?sytuacja=), „Zaktualizuj w czacie”.

export default async function BrunoKlientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ jako?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma?.pipedrive_token) redirect("/bruno/panel");
  const { jezyk } = await tSerwer();
  const { id } = await params;
  const { jako } = await searchParams;
  const dealId = Number(id);
  if (!Number.isFinite(dealId)) notFound();
  const token = firma.pipedrive_token;
  const w = await widokKonta(konto, firma, jako);

  const lejek = await pobierzLejek(token);
  const deal = lejek.deale.find((d) => d.id === dealId);
  if (!deal || (!w.szef && deal.handlowiec !== w.konto.email.toLowerCase())) notFound();
  const [notatki, aktywnosci, typy, domena] = await Promise.all([notatkiDeala(token, dealId, 30), zadaniaDeala(token, dealId, 50), typyAktywnosci(token), domenaPipedrive(token)]);
  const osoby = w.handlowcy.map((h) => ({ email: h.email.toLowerCase(), imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null }));
  return (
    <KlientKarta
      firma={firma}
      jezyk={jezyk}
      szef={w.szef}
      deal={deal}
      etapy={lejek.etapy}
      notatki={notatki}
      aktywnosci={aktywnosci.map((a) => ({ ...a, typNazwa: typy.get(a.typ) ?? a.typ }))}
      handlowiec={osoby.find((o) => o.email === deal.handlowiec) ?? null}
      linkCrm={domena ? `${domena}/deal/${deal.id}` : null}
      jako={w.jako}
    />
  );
}
