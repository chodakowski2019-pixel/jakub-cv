import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KursLp from "@/components/bruno/kurs-lp";
import { KURSY, kursPoSlugu } from "@/lib/bruno/kursy";

// 30.10 (USER_001): JEDNA strona sprzedażowa dla każdego kursu (components/bruno/kurs-lp.tsx). Treść z lib/bruno/kursy.ts.
// Warunki gwarancji (USER_001 30.10): certyfikat od 80 %, oferta pracy w 30 dni albo zwrot, odmowa = kolejny miesiąc, 3 szanse.
// Za pomoc w znalezieniu pracy kursant płaci 0 zł (zakaz opłat od kandydata, agencja zatrudnienia).
type Props = { params: Promise<{ kurs: string }> };

export function generateStaticParams() {
  return KURSY.map((k) => ({ kurs: k.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const k = kursPoSlugu((await params).kurs);
  if (!k) return {};
  return {
    title: `${k.tytul} w 3 miesiące, z gwarancją pracy | Bruno AI`,
    description: k.obietnica,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: Props) {
  const k = kursPoSlugu((await params).kurs);
  if (!k) notFound();
  return <KursLp slug={k.slug} />;
}
