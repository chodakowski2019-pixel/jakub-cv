import type { Metadata } from "next";
import BrunoLp from "@/components/podglad/bruno-lp/bruno-lp";
import { metadaneBruno, stronaBruno } from "@/components/podglad/bruno-lp/serwer";

// 9.10 (USER_001, wariant A): LP Bruno, wersja „business”. Ten sam szablon co druga podstrona, inne teksty.
// 9.10: LIVE i w indeksie (USER_001 „opublikuj jako podstronę live”).
// 11.10: salesbruno.com/ (EN) i salesbruno.pl/ (PL). Metadane i język z domeny.
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return metadaneBruno("firmy", searchParams, { index: true, follow: true });
}

export default async function Page({ searchParams }: Props) {
  const { jezyk, naDomenie } = await stronaBruno(searchParams);
  return <BrunoLp wersja="business" jezykStart={jezyk} naDomenieStart={naDomenie} />;
}
