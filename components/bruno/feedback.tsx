import Link from "next/link";
import type { Feedback } from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";

// Widok feedbacku trenera. Ten sam po rozmowie i w historii.
// Kolejność wg rubryki: ocena, jedna liczba z audio, wygrana, poprawka, 5 kryteriów z cytatem.

function Pasek({ ocena }: { ocena: number }) {
  return (
    <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden" aria-hidden>
      <div className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-teal-700" style={{ width: `${ocena * 10}%` }} />
    </div>
  );
}

export default function FeedbackWidok({ feedback, dalej }: { feedback: Feedback; dalej?: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bruno-szklo rounded-3xl p-6 sm:p-8 text-center">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ocena rozmowy</div>
        <div className="bruno-h1 text-[4rem] leading-none bruno-gradient-tekst">{feedback.ocena}<span className="text-2xl text-slate-400">/10</span></div>
        <p className="text-slate-700 mt-4 text-[15px]">{feedback.liczba_z_audio}</p>
        {feedback.reguly && feedback.reguly.length > 0 && (
          <p className="text-[11px] text-slate-400 mt-2">Reguły: {feedback.reguly.join(", ")}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bruno-szklo rounded-2xl p-5">
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1.5">Co zagrało</div>
          <p className="text-[15px] text-slate-800 leading-relaxed">{feedback.wygrana || "Brak."}</p>
        </div>
        <div className="bruno-szklo rounded-2xl p-5 border-cyan-700/30">
          <div className="text-xs font-semibold text-cyan-800 uppercase tracking-wide mb-1.5">Następnym razem</div>
          <p className="text-[15px] text-slate-900 font-medium leading-relaxed">{feedback.poprawka || "Brak."}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {feedback.kryteria.map((k) => (
          <li key={k.nazwa} className={`bruno-szklo rounded-2xl p-5 ${k.nazwa === feedback.najslabsze ? "border-amber-300/80" : ""}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bruno-h2 text-base">
                {NAZWY[k.nazwa]}
                {k.nazwa === feedback.najslabsze && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">najsłabsze</span>}
              </div>
              <div className="font-semibold text-slate-900">{k.ocena}/10</div>
            </div>
            <Pasek ocena={k.ocena} />
            {k.cytat && (
              <blockquote className="mt-3 text-sm text-slate-600 border-l-2 border-slate-300 pl-3 italic">
                „{k.cytat}” {k.czas && <span className="not-italic text-slate-400">[{k.czas}]</span>}
              </blockquote>
            )}
            <p className="mt-2 text-sm text-slate-800">{k.komentarz}</p>
          </li>
        ))}
      </ul>

      {feedback.obiekcje_ocena && feedback.obiekcje_ocena.length > 0 && (
        <div className="bruno-szklo rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Obiekcje, które padły</div>
          <ul className="text-sm text-slate-800 flex flex-col gap-1">
            {feedback.obiekcje_ocena.map((o, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">{o.obiekcja}</span>
                <span className="text-slate-500 shrink-0">{["", "poległeś", "słabo", "dobrze", "wzorowo"][o.ocena]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dalej && (
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/bruno/panel" className="bruno-przycisk">Wróć do panelu</Link>
          <Link href="/bruno/trening" className="bruno-przycisk-2">Przećwicz obiekcje w Treningu</Link>
          <Link href="/bruno/rozmowa" className="bruno-przycisk-2">Jeszcze jeden test</Link>
        </div>
      )}
    </div>
  );
}
