import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, pobierzRozmowy, stanDostepu } from "@/lib/bruno/db";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import Kalendarz from "@/components/bruno/kalendarz";

export const dynamic = "force-dynamic";

// 11.10 (USER_001, E32): zakładka „Kalendarz”: kiedy były rozmowy i fiszki, do kiedy trwa dostęp.

export default async function BrunoKalendarzPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const { t } = await tSerwer();
  const [rozmowy, { data: fiszki }] = await Promise.all([
    pobierzRozmowy(email, 1000),
    supabaseAdmin.from("bruno_fiszki").select("utworzono").eq("email", email).order("utworzono", { ascending: false }).limit(2000),
  ]);

  // Koniec dostępu: opłacony Bruno Pro (pro_do) albo test firmy (trial). Free liczy rozmowy, nie dni; firmy B2B bez daty.
  let koniec: string | null = null;
  let opis: string | null = null;
  if (konto.plan === "pelny" && konto.pro_do) {
    koniec = konto.pro_do;
    opis = t("Bruno Pro is active until", "Bruno Pro aktywne do");
  } else if (konto.plan === "trial") {
    const s = stanDostepu(konto);
    if (s.koniec) {
      koniec = s.koniec.toISOString();
      opis = t("Your trial lasts until", "Dostęp testowy do");
    }
  }

  return (
    <Kalendarz
      rozmowy={rozmowy.map((r) => ({ id: r.id, start: r.start, ocena: r.ocena, zakonczona: r.status === "zakonczona" }))}
      fiszki={(fiszki ?? []).map((f) => f.utworzono as string)}
      koniecDostepu={koniec}
      opisKonca={opis}
    />
  );
}
