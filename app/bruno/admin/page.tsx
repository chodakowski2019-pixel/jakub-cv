import AdminForm from "@/components/bruno/admin-form";

export const dynamic = "force-dynamic";

// Panel USER_001: zakładanie kont testerów + wstępna konfiguracja z ankiety.
// Klucz STATS_KEY w adresie: /bruno/admin?k=... (ten sam co /youtube/stats).
export default async function BrunoAdminPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="bruno-h1 text-[1.9rem]">Admin: konta testerów</h1>
      <AdminForm klucz={k ?? ""} />
    </div>
  );
}
