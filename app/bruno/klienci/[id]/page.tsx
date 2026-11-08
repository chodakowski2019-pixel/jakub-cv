import { notFound, redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import { widokKonta } from "@/lib/bruno/jako";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { crmWlaczony, lejekFirmy } from "@/lib/bruno/lejek";
import { historiaKlienta, notatkiKlienta, zadaniaKlienta } from "@/lib/bruno/crm";
import { profileFirmy } from "@/lib/bruno/klienci";

// 8.11: nazwy typów zadań w CRM Bruno.
const TYPY: Record<string, [string, string]> = { call: ["Call", "Telefon"], meeting: ["Meeting", "Spotkanie"], email: ["E-mail", "E-mail"], task: ["Task", "Zadanie"], trening: ["Bruno training", "Trening Bruno"] };
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
  if (!crmWlaczony(firma) || !firma) redirect("/bruno/klienci");
  const { jezyk } = await tSerwer();
  const { id } = await params;
  const { jako } = await searchParams;
  const dealId = Number(id);
  if (!Number.isFinite(dealId)) notFound();
  const w = await widokKonta(konto, firma, jako);

  const lejek = await lejekFirmy(firma);
  const deal = lejek.deale.find((d) => d.id === dealId);
  if (!deal || (!w.szef && deal.handlowiec !== w.konto.email.toLowerCase())) notFound();
  // 8.11: historia = jedna oś czasu z CRM Bruno (notatki, zadania, zmiany etapu / statusu / wartości), wpisy Bruno oznaczone.
  const [notatki, aktywnosci, historia, profile] = await Promise.all([notatkiKlienta(firma.id, dealId, 30), zadaniaKlienta(firma.id, dealId, 50), historiaKlienta(firma.id, dealId), profileFirmy(firma.id).catch(() => new Map())]);
  const typ = (k: string | null) => (k ? (TYPY[k]?.[jezyk === "pl" ? 1 : 0] ?? k) : null);
  const osoby = w.handlowcy.map((h) => ({ email: h.email.toLowerCase(), imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null }));
  return (
    <KlientKarta
      firma={firma}
      jezyk={jezyk}
      szef={w.szef}
      deal={deal}
      etapy={lejek.etapy}
      notatki={notatki}
      aktywnosci={aktywnosci.map((a) => ({ ...a, typNazwa: typ(a.typ) ?? a.typ }))}
      historia={historia.map((h) => (h.typKlucz ? { ...h, pod: [typ(h.typKlucz), h.pod].filter(Boolean).join(" · ") } : h))}
      handlowiec={osoby.find((o) => o.email === deal.handlowiec) ?? null}
      linkCrm={null}
      plec={profile.get(dealId)?.plec ?? null}
      zdjecie={profile.get(dealId)?.zdjecie ?? null}
      jako={w.jako}
    />
  );
}
