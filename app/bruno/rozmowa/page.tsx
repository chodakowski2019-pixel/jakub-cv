import StronaRozmowy from "@/components/bruno/strona-rozmowy";

export const dynamic = "force-dynamic";

// 25.10: treść strony w components/bruno/strona-rozmowy.tsx (wspólna z zakładką /bruno/jutro).
export default async function BrunoRozmowaPage({ searchParams }: { searchParams: Promise<{ karta?: string }> }) {
  return <StronaRozmowy searchParams={searchParams} jutro={false} />;
}
