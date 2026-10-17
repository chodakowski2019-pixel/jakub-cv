import { redirect } from "next/navigation";

// 9.10 (USER_001, wariant A): LP Bruno, wersja „reps” (handlowcy, B2C).
// 14.10 (USER_001): strona główna salesbruno.com/ i salesbruno.pl/, w indeksie.
// 17.10 (USER_001): Bruno TYLKO B2B. LP dla handlowców wyłączona, adres prowadzi na LP firm.
// Komponent `BrunoLp wersja="reps"` zostaje w kodzie (nic nie kasujemy bez „tak”).
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  redirect(`/brunobusiness${"pl" in sp ? "?pl" : ""}`);
}
