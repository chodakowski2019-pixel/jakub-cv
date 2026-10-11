import type { Metadata } from "next";
import BrunoLp from "@/components/podglad/bruno-lp/bruno-lp";
import { metadaneBruno, stronaBruno } from "@/components/podglad/bruno-lp/serwer";

// 9.10 (USER_001, wariant A): LP Bruno, wersja „reps”. Ten sam szablon co druga podstrona, inne teksty.
// noindex do czasu akceptacji tekstów i wyglądu przez USER_001.
// 11.10: salesbruno.com/reps (EN) i salesbruno.pl/handlowcy (PL).
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return metadaneBruno("handlowcy", searchParams, { index: false, follow: false });
}

export default async function Page({ searchParams }: Props) {
  const { jezyk, naDomenie } = await stronaBruno(searchParams);
  return <BrunoLp wersja="reps" jezykStart={jezyk} naDomenieStart={naDomenie} />;
}
