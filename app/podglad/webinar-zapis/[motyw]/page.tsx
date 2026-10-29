import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WebinarLpZapis, { type MotywZapisu } from "@/components/bruno/webinar-lp-zapis";

// 29.10 (USER_001): podgląd motywów kolorystycznych krótkiej strony zapisu: /podglad/webinar-zapis/limonka | noc | blekit.
const MOTYWY: MotywZapisu[] = ["pomarancz", "limonka", "noc", "blekit"];

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ motyw: string }> }) {
  const { motyw } = await params;
  if (!MOTYWY.includes(motyw as MotywZapisu)) notFound();
  return <WebinarLpZapis motyw={motyw as MotywZapisu} dziekiUrl="/podglad/webinar-zapis/dzieki" />;
}
