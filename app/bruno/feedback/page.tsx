import Link from "next/link";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzRozmowy } from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";
import { POSTACIE, TRYBY, postacLubDomyslna, trybLubDomyslny } from "@/lib/bruno/postacie";

export const dynamic = "force-dynamic";

// „Feedback" (USER_001 2.10, dawniej „Historia"): każda rozmowa = kafelek
// z oceną, trybem, kolorem klienta, trenowaną obiekcją i poprawką. Klik
// prowadzi do szczegółów: pełny feedback, nagranie, transkrypcja.

function czas(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
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
          Twój <span className="bruno-gradient-tekst">feedback</span>
        </h1>
        <p className="text-slate-600 mt-2">
          {srednia !== null ? (
            <>
              Średnia <b className="text-slate-900">{srednia}/10</b> z {ocenione.length} {ocenione.length === 1 ? "ocenionej rozmowy" : ocenione.length < 5 ? "ocenionych rozmów" : "ocenionych rozmów"}. Kliknij rozmowę, żeby zobaczyć, co poprawić.
            </>
          ) : (
            "Po każdej rozmowie testowej Bruno-trener zostawia tu ocenę, cytaty i jedną rzecz do poprawy."
          )}
        </p>
      </div>

      {rozmowy.length === 0 ? (
        <div className="bruno-szklo rounded-3xl p-8 text-center text-slate-600">
          Jeszcze nic. <Link href="/bruno/rozmowa" className="underline">Zrób pierwszy test z Bruno</Link>.
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {rozmowy.map((r) => {
            const p = POSTACIE[postacLubDomyslna(r.postac)];
            const ocena = r.status === "zakonczona" ? r.ocena : null;
            const tresc = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">
                      {new Date(r.start).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      {r.sekundy ? ` · ${czas(r.sekundy)}` : ""}
                    </div>
                    <div className="bruno-h2 text-base mt-1 flex items-center gap-2">
                      <span className="size-3 rounded-full shrink-0" style={{ background: p.kolor }} aria-hidden />
                      <span className="truncate">{r.tryb ? TRYBY[trybLubDomyslny(r.tryb)].nazwa : "Rozmowa"}, klient {p.nazwa.toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {ocena ? (
                      <div className="bruno-h2 text-2xl leading-none bruno-gradient-tekst">{ocena}<span className="text-xs text-slate-400">/10</span></div>
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">{r.status === "zakonczona" ? "bez oceny" : "przerwana"}</span>
                    )}
                  </div>
                </div>
                {r.obiekcja && <div className="mt-2 text-xs text-cyan-800 truncate">obiekcja: „{r.obiekcja}”</div>}
                {r.feedback?.poprawka ? (
                  <div className="mt-3 text-sm text-slate-800 line-clamp-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-800 mr-1.5">Następnym razem</span>
                    {r.feedback.poprawka}
                  </div>
                ) : r.status === "przerwana" ? (
                  <div className="mt-3 text-sm text-slate-500">Za krótka do oceny (poniżej 20 s albo prawie bez słów).</div>
                ) : null}
                {r.feedback?.najslabsze && (
                  <div className="mt-2 text-[11px] text-slate-400">najsłabsze: {NAZWY[r.feedback.najslabsze]}</div>
                )}
              </>
            );
            return (
              <li key={r.id}>
                {r.status === "zakonczona" ? (
                  <Link href={`/bruno/feedback/${r.id}`} className="block bruno-szklo rounded-2xl p-5 h-full transition-[transform,border-color] duration-100 hover:border-cyan-700/40 active:scale-[0.99]">
                    {tresc}
                  </Link>
                ) : (
                  <div className="bruno-szklo rounded-2xl p-5 h-full opacity-70">{tresc}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
