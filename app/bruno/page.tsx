import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { czySzef, pobierzFirme } from "@/lib/bruno/firmy";
import { crmWlaczony } from "@/lib/bruno/lejek";
import LogowanieForm from "@/components/podglad/aurora/logowanie-form";
import { metadaneBruno, stronaBruno } from "@/components/podglad/bruno-lp/serwer";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ src?: string } & Record<string, string | string[] | undefined>> };

// 11.10: salesbruno.com/login i salesbruno.pl/login. noindex zostaje z app/bruno/layout.tsx.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return metadaneBruno("logowanie", searchParams);
}

export default async function BrunoLoginPage({ searchParams }: Props) {
  const { src } = await searchParams;
  // Zalogowany z linku w mailu: źródło jedzie dalej do panelu, który je zapisze (E18).
  const email = await zalogowanyEmail();
  if (email) {
    // 25.10 (USER_001: „zaczynamy od widoku Zespół”): szef firmy ląduje w panelu szefa.
    const konto = await pobierzKonto(email);
    // 25.10 (USER_001): konto spotkań najpierw „Przygotuj spotkanie” (imię rozmówcy + strona firmy).
    if (!src && konto?.spotkania) redirect("/bruno/przygotuj");
    // 4.11 (USER_001, pkt 1): firma z CRM zaczyna od Czatu (Bruno wita, zadania z CRM, deale bez ruchu, trening).
    if (!src && crmWlaczony(await pobierzFirme(konto?.firma_id))) redirect("/bruno/kokpit");
    if (!src && czySzef(konto)) redirect("/bruno/szef");
    redirect(src ? `/bruno/panel?src=${encodeURIComponent(String(src))}` : "/bruno/panel");
  }
  // 9.10 (USER_001): logowanie w wyglądzie Aurora, EN domyślnie, PL z ?pl. 11.10: PL też na salesbruno.pl.
  const { jezyk } = await stronaBruno(searchParams);
  return <LogowanieForm jezykStart={jezyk} />;
}
