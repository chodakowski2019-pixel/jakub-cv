import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, handlowcyFirmy, pobierzFirme } from "@/lib/bruno/firmy";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { analizaEtapow, analizaZDeali, crmWlaczony, pobierzLejek } from "@/lib/bruno/lejek";
import LejekWidok from "@/components/bruno/lejek-widok";

export const dynamic = "force-dynamic";

// 4.11 (USER_001): BRUNO POD CRM. Lejek sprzedaży firmy z Pipedrive: szef widzi cały zespół (kto na którym
// etapie traci deale), handlowiec widzi swoje deale i etap, na którym traci najwięcej → „Trenuj ten etap”.
// Tylko firma demo z tokenem (crmWlaczony); reszta → panel.

export default async function BrunoLejekPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const firma = await pobierzFirme(konto.firma_id);
  if (!crmWlaczony(firma) || !firma?.pipedrive_token) redirect("/bruno/panel");
  const szef = czySzef(konto);
  const { jezyk } = await tSerwer();

  let blad: string | null = null;
  try {
    const [lejek, handlowcy] = await Promise.all([pobierzLejek(firma.pipedrive_token), szef ? handlowcyFirmy(firma.id) : Promise.resolve([konto])]);
    const osoby = handlowcy.map((h) => ({ email: h.email, imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null }));
    const znane = new Set(osoby.map((o) => o.email.toLowerCase()));
    const widoczne = szef ? lejek.deale : lejek.deale.filter((d) => d.handlowiec === email.toLowerCase());
    const analizy = osoby.map((o) => analizaZDeali(o.email, lejek.etapy, lejek.deale.filter((d) => d.handlowiec === o.email.toLowerCase())));
    const bezHandlowca = szef ? lejek.deale.filter((d) => !d.handlowiec || !znane.has(d.handlowiec)) : [];
    return (
      <LejekWidok
        firma={firma}
        jezyk={jezyk}
        szef={szef}
        pipeline={lejek.pipeline}
        etapy={lejek.etapy}
        zespol={analizaEtapow(lejek.etapy, widoczne)}
        osoby={osoby}
        analizy={analizy}
        deale={widoczne}
        bezHandlowca={bezHandlowca.length}
        ja={email.toLowerCase()}
      />
    );
  } catch (e) {
    blad = String((e as Error)?.message ?? e);
  }
  return <LejekWidok firma={firma} jezyk={jezyk} szef={szef} pipeline={null} etapy={[]} zespol={[]} osoby={[]} analizy={[]} deale={[]} bezHandlowca={0} ja={email} blad={blad} />;
}
