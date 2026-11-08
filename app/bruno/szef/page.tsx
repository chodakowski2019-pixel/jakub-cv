import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, handlowcyFirmy, pobierzFirme, rozmowyZespolu } from "@/lib/bruno/firmy";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { ocenyHandlowca, seriaTygodniowa, statystykiHandlowca, statystykiZespolu } from "@/lib/bruno/zespol";
import ZespolWidok from "@/components/bruno/zespol-widok";
import PlanZespolu from "@/components/bruno/plan-zespolu";
import { planNaDzis } from "@/lib/bruno/plan-treningu";

export const dynamic = "force-dynamic";

// 25.10 (USER_001): PANEL SZEFA. Widzi go konto z rolą właściciel / dyrektor / manager i przypiętą firmą.
// Handlowiec (rep) albo konto bez firmy → własny panel.

export default async function BrunoSzefPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto || !czySzef(konto)) redirect("/bruno/panel");
  const [firma, handlowcy, { jezyk }] = await Promise.all([pobierzFirme(konto.firma_id), handlowcyFirmy(konto.firma_id!), tSerwer()]);
  const [rozmowy, historia] = await Promise.all([rozmowyZespolu(handlowcy.map((h) => h.email), 30), rozmowyZespolu(handlowcy.map((h) => h.email), 92)]);
  const stat = handlowcy.map((h) => statystykiHandlowca(h, rozmowy));
  const oceny = Object.fromEntries(handlowcy.map((h) => [h.email, ocenyHandlowca(h.email, rozmowy)]));
  // 8.11 (algorytm treningu, pkt 9): plan dnia każdego handlowca (bez szefa).
  const zespol = handlowcy.filter((h) => h.email.toLowerCase() !== email.toLowerCase());
  const plany = await Promise.all(zespol.map((h) => planNaDzis(h, firma, false).catch(() => null)));
  return (
    <>
      <ZespolWidok firma={firma} stat={stat} zespol={statystykiZespolu(stat)} jezyk={jezyk} seria={seriaTygodniowa(historia, 13)} oceny={oceny} />
      <div className="p-strona" style={{ paddingTop: 0 }}>
        <PlanZespolu jezyk={jezyk} wiersze={zespol.map((h, i) => ({ email: h.email, imie: h.imie ?? h.email, zdjecie: h.zdjecie_url ?? null, plan: plany[i] }))} />
      </div>
    </>
  );
}
