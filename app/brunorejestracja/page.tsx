import { redirect } from "next/navigation";
import { stronaBruno } from "@/components/podglad/bruno-lp/serwer";
import { SCIEZKI } from "@/lib/bruno/domeny";

export const dynamic = "force-dynamic";

// 9.10 (USER_001): rejestracja B2C dla handlowca (3 bezpłatne rozmowy).
// 11.10: salesbruno.com/signup (EN) i salesbruno.pl/rejestracja (PL).
// 25.10 (USER_001: „dezaktywuj tą stronę”): rejestracja WYŁĄCZONA. Konta zakłada USER_001 po spotkaniu
// (Admin / „Demo pod firmę”), więc adres prowadzi na kalendarz spotkania online. Formularz
// (components/podglad/aurora/rejestracja-form.tsx) zostaje w repo, API rejestracji zwraca 410.
// Adres liczony tu, nie przez adresStrony z aurora/jezyk.ts: tamten moduł jest „use client” (na serwerze = 500).
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const { jezyk, naDomenie } = await stronaBruno(searchParams);
  redirect(naDomenie ? SCIEZKI[jezyk].demo : `/brunodemo${jezyk === "pl" ? "?pl" : ""}`);
}
