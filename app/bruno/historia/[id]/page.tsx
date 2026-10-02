import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzRozmowe } from "@/lib/bruno/db";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import { POSTACIE, TRYBY, postacLubDomyslna, trybLubDomyslny } from "@/lib/bruno/postacie";
import FeedbackWidok from "@/components/bruno/feedback";

export const dynamic = "force-dynamic";

function czas(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default async function BrunoRozmowaSzczegoly({ params }: { params: Promise<{ id: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const { id } = await params;
  const r = await pobierzRozmowe(email, id);
  if (!r) notFound();

  let nagranieUrl: string | null = null;
  if (r.nagranie_sciezka) {
    const { data } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUrl(r.nagranie_sciezka, 60 * 60);
    nagranieUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/bruno/historia" className="text-sm text-slate-500 hover:text-slate-900">← Historia</Link>
        <h1 className="bruno-h1 text-[1.7rem] sm:text-[2.2rem] mt-2">
          {r.tryb ? TRYBY[trybLubDomyslny(r.tryb)].nazwa : "Rozmowa"}, klient <span className="bruno-gradient-tekst">{POSTACIE[postacLubDomyslna(r.postac)].nazwa.toLowerCase()}</span>
        </h1>
        {r.obiekcja && <p className="text-sm text-cyan-800 mt-1">Trenowana obiekcja: „{r.obiekcja}”</p>}
        <p className="text-sm text-slate-500">
          {new Date(r.start).toLocaleString("pl-PL", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
          {r.sekundy ? `, ${czas(r.sekundy)}` : ""}
        </p>
      </div>

      {r.feedback ? <FeedbackWidok feedback={r.feedback} /> : <div className="bruno-szklo rounded-2xl p-5 text-slate-600">Trener nie zostawił jeszcze oceny.</div>}

      {nagranieUrl && (
        <section className="bruno-szklo rounded-2xl p-5">
          <h2 className="bruno-h2 text-base mb-3">Nagranie</h2>
          <audio controls preload="none" src={nagranieUrl} className="w-full" />
        </section>
      )}

      {r.transkrypcja && r.transkrypcja.length > 0 && (
        <section className="bruno-szklo rounded-2xl p-5">
          <h2 className="bruno-h2 text-base mb-3">Transkrypcja</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {r.transkrypcja.map((w, i) => (
              <li key={i} className={w.rola === "klient" ? "text-slate-800" : "text-cyan-900"}>
                <span className="text-[11px] text-slate-400 tabular-nums mr-2">[{czas(w.t)}]</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mr-2">{w.rola === "klient" ? "Bruno" : "Ty"}</span>
                {w.tekst}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
