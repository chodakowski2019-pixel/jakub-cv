import type { Metadata } from "next";
import DemoStrona from "@/components/podglad/bruno-lp/demo-strona";
import { metadaneBruno, stronaBruno } from "@/components/podglad/bruno-lp/serwer";

// 21.10 (USER_001): salesbruno.pl/demo i salesbruno.com/demo = kalendarz spotkania online z USER_001.
// Lokalnie /brunodemo (proxy robi rewrite tylko na domenach Bruno).
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return metadaneBruno("demo", searchParams, { index: true, follow: true });
}

export default async function Page({ searchParams }: Props) {
  const { jezyk, naDomenie } = await stronaBruno(searchParams);
  return <DemoStrona jezykStart={jezyk} naDomenieStart={naDomenie} />;
}
