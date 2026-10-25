import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { pobierzFirme } from "@/lib/bruno/firmy";
import PrzygotujForm from "@/components/bruno/przygotuj-form";

export const dynamic = "force-dynamic";

// 25.10 (USER_001): konto spotkań. 1) logowanie, 2) imię rozmówcy + strona firmy, 3) panel pod spotkanie.
export default async function BrunoPrzygotujPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto?.spotkania) redirect("/bruno/panel");
  const firma = await pobierzFirme(konto.firma_id);
  return <PrzygotujForm obecna={firma ? { nazwa: firma.nazwa, imie: konto.imie, logo: firma.logo_url } : null} />;
}
