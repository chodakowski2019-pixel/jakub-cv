import type { Metadata } from "next";
import RejestracjaForm from "@/components/podglad/aurora/rejestracja-form";
import { googleSkonfigurowany } from "@/lib/bruno/google";
import { metadaneBruno, stronaBruno } from "@/components/podglad/bruno-lp/serwer";

export const dynamic = "force-dynamic";

// 9.10 (USER_001): rejestracja B2C dla handlowca (3 bezpłatne rozmowy).
// B2B się nie rejestruje: konta firm zakładamy i wysyłamy sami.
// noindex do czasu podpięcia zakładania konta i maila z kodem.
// 11.10: salesbruno.com/signup (EN) i salesbruno.pl/rejestracja (PL).
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return metadaneBruno("rejestracja", searchParams, { index: false, follow: false });
}

export default async function Page({ searchParams }: Props) {
  const { jezyk, naDomenie } = await stronaBruno(searchParams);
  return <RejestracjaForm google={googleSkonfigurowany()} jezykStart={jezyk} naDomenieStart={naDomenie} />;
}
