import Link from "next/link";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzRozmowy } from "@/lib/bruno/db";
import { POSTACIE, TRYBY, postacLubDomyslna, trybLubDomyslny } from "@/lib/bruno/postacie";

export const dynamic = "force-dynamic";

export default async function BrunoHistoriaPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const rozmowy = (await pobierzRozmowy(email, 100)).filter((r) => r.status !== "trwa");
  const ocenione = rozmowy.filter((r) => r.ocena);
  const srednia = ocenione.length ? Math.round((ocenione.reduce((s, r) => s + (r.ocena ?? 0), 0) / ocenione.length) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">Historia</h1>
        {srednia !== null && (
          <div className="text-right">
            <div className="bruno-h2 text-2xl bruno-gradient-tekst">{srednia}/10</div>
            <div className="text-xs text-slate-500">średnia z {ocenione.length} {ocenione.length === 1 ? "rozmowy" : "rozmów"}</div>
          </div>
        )}
      </div>
      {rozmowy.length === 0 ? (
        <div className="bruno-szklo rounded-3xl p-8 text-center text-slate-600">
          Jeszcze nic. <Link href="/bruno/rozmowa" className="underline">Zadzwoń do Bruno</Link>.
        </div>
      ) : (
        <ul className="bruno-szklo rounded-3xl divide-y divide-slate-200/70 overflow-hidden">
          {rozmowy.map((r) => (
            <li key={r.id}>
              {r.status === "zakonczona" ? (
                <Link href={`/bruno/historia/${r.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/60 transition-colors">
                  <span className="text-sm text-slate-500 w-32 shrink-0">{new Date(r.start).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="flex-1 text-sm text-slate-800 truncate">
                    {r.tryb ? `${TRYBY[trybLubDomyslny(r.tryb)].nazwa}, ` : ""}klient {POSTACIE[postacLubDomyslna(r.postac)].nazwa.toLowerCase()}
                    {r.sekundy ? `, ${Math.floor(r.sekundy / 60)}:${String(r.sekundy % 60).padStart(2, "0")}` : ""}
                    {r.obiekcja && <span className="block text-xs text-cyan-800 truncate">obiekcja: „{r.obiekcja}”</span>}
                    {r.feedback?.poprawka && <span className="block text-xs text-slate-500 truncate">{r.feedback.poprawka}</span>}
                  </span>
                  <span className="bruno-h2 text-lg bruno-gradient-tekst">{r.ocena ?? "–"}<span className="text-xs text-slate-400">/10</span></span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-5 py-3.5 text-slate-400">
                  <span className="text-sm w-32 shrink-0">{new Date(r.start).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="flex-1 text-sm">przerwana, za krótka do oceny</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
