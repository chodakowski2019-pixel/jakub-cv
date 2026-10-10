import Link from "next/link";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzRozmowy } from "@/lib/bruno/db";

export const dynamic = "force-dynamic";

// „Feedback" (USER_001 2.10, dawniej „Historia"): każda rozmowa = mały kafelek
// TYLKO z datą i oceną w kółku. Reszta (tryb, klient, obiekcja, plusy/minusy,
// transkrypcja) dopiero po kliknięciu. Bez odtwarzacza nagrania.

/** Ocena w kółku (pierścień). Bez oceny = szare kółko z kreską. */
function OcenaKolko({ ocena }: { ocena: number | null }) {
  const r = 26;
  const obwod = 2 * Math.PI * r;
  const udzial = ocena ? Math.min(1, Math.max(0, ocena / 10)) : 0;
  return (
    <svg viewBox="0 0 64 64" width="72" height="72" role="img" aria-label={ocena ? `Score ${ocena} out of 10` : "No score"}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(212,175,90,0.12)" strokeWidth="6" />
      {ocena ? (
        <circle cx="32" cy="32" r={r} fill="none" stroke="#d4af5a" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${obwod * udzial} ${obwod}`} transform="rotate(-90 32 32)" />
      ) : null}
      <text x="32" y="37" textAnchor="middle" className={ocena ? "fill-slate-900" : "fill-slate-400"} style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-poppins)" }}>
        {ocena ?? "–"}
      </text>
    </svg>
  );
}

export default async function BrunoFeedbackPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const rozmowy = (await pobierzRozmowy(email, 100)).filter((r) => r.status !== "trwa");
  const ocenione = rozmowy.filter((r) => r.ocena);
  const srednia = ocenione.length ? Math.round((ocenione.reduce((s, r) => s + (r.ocena ?? 0), 0) / ocenione.length) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          Your <span className="bruno-gradient-tekst">feedback</span>
        </h1>
        <p className="text-slate-600 mt-2">
          {srednia !== null ? (
            <>
              Average <b className="text-slate-900">{srednia}/10</b> from {ocenione.length} scored {ocenione.length === 1 ? "call" : "calls"}. Click a call to see what to fix.
            </>
          ) : (
            "After every Live Call, Bruno the coach leaves a score, quotes, and one thing to fix here."
          )}
        </p>
      </div>

      {rozmowy.length === 0 ? (
        <div className="bruno-szklo rounded-3xl p-8 text-center text-slate-600">
          Nothing yet. <Link href="/bruno/rozmowa" className="underline">Do your first Live Call with Bruno</Link>.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {rozmowy.map((r) => {
            const ocena = r.status === "zakonczona" ? r.ocena : null;
            const data = new Date(r.start);
            const tresc = (
              <>
                <div className="text-sm font-semibold text-slate-800">{data.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
                <div className="text-[11px] text-slate-400 mb-3">{data.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                <OcenaKolko ocena={ocena} />
              </>
            );
            return (
              <li key={r.id}>
                {r.status === "zakonczona" && ocena ? (
                  <Link href={`/bruno/feedback/${r.id}`} className="bruno-szklo rounded-2xl p-5 h-full flex flex-col items-center text-center transition-[border-color] duration-100 hover:border-cyan-700/40">
                    {tresc}
                  </Link>
                ) : (
                  <div className="bruno-szklo rounded-2xl p-5 h-full flex flex-col items-center text-center opacity-60">{tresc}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
