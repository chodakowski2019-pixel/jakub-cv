import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Job = { status: string; amount: number | null; created_at: string };

function zl(grosze: number): string {
  return (grosze / 100).toFixed(2).replace(".", ",") + " zł";
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.STATS_KEY;
  if (!expected || key !== expected) notFound();

  const { data } = await supabaseAdmin
    .from("transkrypcje_jobs")
    .select("status, amount, created_at")
    .order("created_at", { ascending: false });

  const jobs: Job[] = data ?? [];

  const isPaid = (s: string) => s !== "pending";
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const agg = (rows: Job[]) => {
    const total = rows.length;
    const paid = rows.filter((r) => isPaid(r.status));
    const delivered = rows.filter((r) => r.status === "done").length;
    const failed = rows.filter((r) => r.status === "error").length;
    const revenue = paid.reduce((s, r) => s + (r.amount ?? 0), 0);
    const conv = total ? (paid.length / total) * 100 : 0;
    return { total, paid: paid.length, delivered, failed, revenue, conv };
  };

  const all = agg(jobs);
  const today = agg(jobs.filter((r) => new Date(r.created_at) >= startOfToday));
  const week = agg(jobs.filter((r) => new Date(r.created_at) >= weekAgo));

  const Card = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.05]">
      <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );

  const Section = ({ title, a }: { title: string; a: ReturnType<typeof agg> }) => (
    <div className="mb-10">
      <h2 className="text-sm uppercase tracking-widest text-cyan-400 mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card label="Uruchomili generowanie" value={String(a.total)} sub="dotarli do paywalla" />
        <Card label="Zapłacili" value={String(a.paid)} />
        <Card label="Konwersja" value={`${a.conv.toFixed(1)}%`} sub="zapłacili / uruchomili" />
        <Card label="Dostarczone (PDF)" value={String(a.delivered)} />
        <Card label="Błędy" value={String(a.failed)} sub="generowanie padło" />
        <Card label="Przychód" value={zl(a.revenue)} />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Statystyki — /youtube</h1>
        <p className="text-neutral-400 text-sm mb-10">
          Ruch (ile osób wchodzi) zobaczysz w Vercel → Analytics. Tu masz lejek od kliknięcia
          „Generuj" w dół.
        </p>
        <Section title="Dziś" a={today} />
        <Section title="Ostatnie 7 dni" a={week} />
        <Section title="Łącznie (cały czas)" a={all} />
      </div>
    </main>
  );
}
