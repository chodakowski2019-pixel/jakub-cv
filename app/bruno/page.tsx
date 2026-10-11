import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import LogowanieForm from "@/components/podglad/aurora/logowanie-form";
import { googleSkonfigurowany } from "@/lib/bruno/google";
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
  if (await zalogowanyEmail()) redirect(src ? `/bruno/panel?src=${encodeURIComponent(String(src))}` : "/bruno/panel");
  // 9.10 (USER_001): logowanie w wyglądzie Aurora, EN domyślnie, PL z ?pl. 11.10: PL też na salesbruno.pl.
  const { jezyk, naDomenie } = await stronaBruno(searchParams);
  return <LogowanieForm google={googleSkonfigurowany()} jezykStart={jezyk} naDomenieStart={naDomenie} />;
}
