import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Job = {
  status: string;
  amount: number | null;
  created_at: string;
  email?: string | null;
  error_message?: string | null;
  url?: string | null;
};
type Ev = { type: string; created_at: string };

function zl(grosze: number): string {
  return (grosze / 100).toFixed(2).replace(".", ",") + " zł";
}
function pct(a: number, b: number): string {
  return b ? `${((a / b) * 100).toFixed(1)}%` : "—";
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.STATS_KEY;
  if (!expected || key !== expected) notFound();

  const [jobsRes, evRes] = await Promise.all([
    supabaseAdmin
      .from("transkrypcje_jobs")
      .select("status, amount, created_at, email, error_message, url")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("transkrypcje_events").select("type, created_at"),
  ]);
  const jobs: Job[] = jobsRes.data ?? [];
  const events: Ev[] = evRes.data ?? [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const isPaid = (s: string) => s !== "pending";

  const agg = (since: Date | null) => {
    const j = since ? jobs.filter((r) => new Date(r.created_at) >= since) : jobs;
    const e = since ? events.filter((r) => new Date(r.created_at) >= since) : events;
    const views = e.filter((x) => x.type === "page_view").length;
    const genClicks = e.filter((x) => x.type === "generate_click").length;
    const payClicks = e.filter((x) => x.type === "pay_click").length;
    const paid = j.filter((r) => isPaid(r.status)).length;
    const delivered = j.filter((r) => r.status === "done").length;
    const failed = j.filter((r) => r.status === "error").length;
    const revenue = j.filter((r) => isPaid(r.status)).reduce((s, r) => s + (r.amount ?? 0), 0);
    return { views, genClicks, payClicks, paid, delivered, failed, revenue };
  };

  const Card = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.05]">
      <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );

  const Section = ({ title, a }: { title: string; a: ReturnType<typeof agg> }) => (
    <div className="mb-12">
      <h2 className="text-sm uppercase tracking-widest text-cyan-400 mb-4">{title}</h2>
      <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Lejek kliknięć</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card label="Wejścia" value={String(a.views)} sub="otworzyli stronę" />
        <Card label='Klik „Zamień film"' value={String(a.genClicks)} sub={`${pct(a.genClicks, a.views)} z wejść`} />
        <Card label='Klik „Chcę streszczenie"' value={String(a.payClicks)} sub={`${pct(a.payClicks, a.genClicks)} z generujących`} />
        <Card label="Zapłacili" value={String(a.paid)} sub={`${pct(a.paid, a.payClicks)} z klikających zapłać`} />
      </div>
      <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Realizacja</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
          Pełny lejek: wejście → klik „Zamień film" → klik „Chcę streszczenie" → zapłata.
        </p>
        <Section title="Dziś" a={agg(startOfToday)} />
        <Section title="Ostatnie 7 dni" a={agg(weekAgo)} />
        <Section title="Łącznie (cały czas)" a={agg(null)} />

        <div className="mb-12">
          <h2 className="text-sm uppercase tracking-widest text-cyan-400 mb-4">Ostatnie zlecenia</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm text-left">
              <thead className="text-neutral-400 text-xs uppercase">
                <tr className="border-b border-white/[0.08]">
                  <th className="px-3 py-2">Kiedy</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">E-mail</th>
                  <th className="px-3 py-2">Błąd</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 20).map((j, i) => (
                  <tr key={i} className="border-b border-white/[0.05] text-neutral-200">
                    <td className="px-3 py-2 whitespace-nowrap text-neutral-400">
                      {new Date(j.created_at).toLocaleString("pl-PL")}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          j.status === "done"
                            ? "text-emerald-400"
                            : j.status === "error"
                              ? "text-rose-400"
                              : j.status === "processing"
                                ? "text-amber-400"
                                : "text-neutral-500"
                        }
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-neutral-400">{j.email || "—"}</td>
                    <td className="px-3 py-2 text-rose-300 max-w-xs truncate" title={j.error_message || ""}>
                      {j.error_message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
