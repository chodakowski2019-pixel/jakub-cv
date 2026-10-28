import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FormularzFirmy from "@/components/bruno/formularz-firmy";
import { FIRMY, pytaniaDla } from "@/lib/bruno/formularz-firmy";

// 28.10 (USER_001): /formularz/<firma> = formularz potrzeb dla szefa po demo (Ewatex). Bez indeksowania.
export const metadata: Metadata = { title: "Formularz | Bruno AI", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ firma: string }> }) {
  const { firma } = await params;
  const f = FIRMY[firma];
  if (!f) notFound();
  return <FormularzFirmy firma={f} rola="szef" pytania={pytaniaDla("szef")} />;
}
