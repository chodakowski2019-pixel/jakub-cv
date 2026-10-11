import Link from "next/link";
import type { Feedback, ZamkniecieTechniki } from "@/lib/bruno/db";
import { etykiety } from "@/lib/bruno/etykiety";
import { tDla, type Jezyk, type T } from "@/lib/bruno/i18n";

// Widok feedbacku trenera (układ USER_001 2.10). Ten sam po rozmowie i w Feedbacku.
// Kolejność: badge OCENA ROZMOWY + ocena w kółku → PLUSY | MINUSY (tabelka, 11.10)
// → 5 kryteriów z cytatem → obiekcje, które padły → NASTĘPNYM RAZEM na końcu.
// Bez wypisywania reguł twardych (zostają w danych, nie na ekranie).

function Pasek({ ocena }: { ocena: number }) {
  return (
    <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden" aria-hidden>
      <div className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-teal-700" style={{ width: `${ocena * 10}%` }} />
    </div>
  );
}

function Badge({ children, ton = "szary" }: { children: React.ReactNode; ton?: "szary" | "cyjan" }) {
  return (
    <span className={`inline-flex items-center rounded-full text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 ${ton === "cyjan" ? "bg-cyan-700/10 text-cyan-800" : "bg-slate-200/70 text-slate-600"}`}>
      {children}
    </span>
  );
}

function Kolko({ znak, kolor }: { znak: "plus" | "minus" | "ptaszek" | "strzalka"; kolor: string }) {
  return (
    <span className="inline-grid place-items-center size-5 rounded-full text-white shrink-0" style={{ background: kolor }} aria-hidden>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {znak === "plus" && <path d="M12 6v12M6 12h12" />}
        {znak === "minus" && <path d="M6 12h12" />}
        {znak === "ptaszek" && <path d="M5 12l4.5 4.5L19 7" />}
        {znak === "strzalka" && <path d="M5 12h14M13 6l6 6-6 6" />}
      </svg>
    </span>
  );
}

function OcenaKolo({ ocena, tr }: { ocena: number; tr: T }) {
  const r = 44;
  const obwod = 2 * Math.PI * r;
  const udzial = Math.min(1, Math.max(0, ocena / 10));
  return (
    <svg viewBox="0 0 104 104" width="128" height="128" role="img" aria-label={tr(`Score ${ocena} out of 10`, `Ocena ${ocena} na 10`)}>
      <circle cx="52" cy="52" r={r} fill="none" stroke="rgba(212,175,90,0.12)" strokeWidth="9" />
      <circle cx="52" cy="52" r={r} fill="none" stroke="url(#bruno-ocena-kolo)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${obwod * udzial} ${obwod}`} transform="rotate(-90 52 52)" className="bruno-pierscien-wypelnienie" />
      <defs>
        <linearGradient id="bruno-ocena-kolo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4af5a" />
          <stop offset="1" stopColor="#a8822f" />
        </linearGradient>
      </defs>
      <text x="52" y="58" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 30, fontWeight: 800, fontFamily: "var(--font-poppins)" }}>
        {ocena}
      </text>
      <text x="52" y="74" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11, fontWeight: 600 }}>
        / 10
      </text>
    </svg>
  );
}

/** 10.10 (E12): techniki zamykania jako lista z ✓ / ✗, pod kryterium „Zamknięcie". */
function Techniki({ t, tr }: { t: ZamkniecieTechniki; tr: T }) {
  const POMYSLEC: Record<ZamkniecieTechniki["musze_pomyslec"], [boolean | null, string]> = {
    nie_padlo: [null, tr("the customer didn't stall", "klient nie unikał")],
    poddal_sie: [false, tr("you gave up after “I need to think about it”", "poddałeś się po „muszę pomyśleć”")],
    czekal: [false, tr("“I need to think about it” got no answer", "„muszę pomyśleć” zostało bez odpowiedzi")],
    pytanie: [true, tr("you asked what exactly they need to think about", "zapytałeś, co konkretnie chce przemyśleć")],
    warunek: [true, tr("you set a condition: “if X, do we sign?”", "postawiłeś warunek „jeśli X, to podpisujemy?”")],
  };
  const DRUGIE: Record<ZamkniecieTechniki["drugie_zamkniecie"], [boolean | null, string]> = {
    nie_dotyczy: [null, tr("no objection at the close", "obiekcji przy zamknięciu nie było")],
    brak: [false, tr("after the objection, you didn't ask for a decision again", "po obiekcji nie poprosiłeś o decyzję drugi raz")],
    bylo: [true, tr("after the objection, you asked for a decision again", "po obiekcji poprosiłeś o decyzję drugi raz")],
  };
  const SYGNAL: Record<ZamkniecieTechniki["sygnal_kupna"], [boolean | null, string]> = {
    nie_bylo: [null, tr("the customer gave no buying signal", "klient nie dał sygnału kupna")],
    wykorzystany: [true, tr("you used the buying signal right away", "sygnał kupna wykorzystany od razu")],
    zmarnowany: [false, tr("buying signal missed, you kept talking", "sygnał kupna zmarnowany, mówiłeś dalej")],
  };
  const wiersze: [string, boolean | null, string][] = [
    [tr("Trial close", "Próba zamknięcia"), t.proba_zamkniecia, t.proba_zamkniecia ? tr("you asked “how does that sound?”", "„jak to brzmi?” padło") : tr("no trial “how does that sound?”", "brak próbnego „jak to brzmi?”")],
    [tr("Ask for a decision", "Pytanie o decyzję"), t.pytanie_o_decyzje, t.pytanie_o_decyzje ? tr("you asked straight out", "zapytałeś wprost") : tr("you didn't ask straight out: “shall we sign?”", "nie zapytałeś wprost „podpisujemy?”")],
    [tr("Dated next step", "Następny krok z datą"), t.nastepny_krok_z_data, t.nastepny_krok_z_data ? tr("you suggested a date", "termin zaproponowany") : tr("no specific date", "bez konkretnego terminu")],
    [tr("“I need to think about it”", "„Muszę pomyśleć”"), ...POMYSLEC[t.musze_pomyslec]],
    [tr("Second close", "Drugie zamknięcie"), ...DRUGIE[t.drugie_zamkniecie]],
    [tr("Buying signal", "Sygnał kupna"), ...SYGNAL[t.sygnal_kupna]],
  ];
  return (
    <ul className="mt-3 flex flex-col gap-1 text-sm">
      {wiersze.map(([nazwa, ok, opis]) => (
        <li key={nazwa} className="flex items-start gap-2">
          <span className={`shrink-0 w-5 text-center font-semibold ${ok === true ? "text-emerald-600" : ok === false ? "text-rose-600" : "text-slate-400"}`}>{ok === true ? "✓" : ok === false ? "✗" : "–"}</span>
          <span className="text-slate-900 font-medium">{nazwa}</span>
          <span className="text-slate-500">{opis}</span>
        </li>
      ))}
    </ul>
  );
}

/** Starsze feedbacki nie mają list plusy/minusy: liczymy je z kryteriów. */
function plusyMinusy(f: Feedback, NAZWY: Record<string, string>): { plusy: string[]; minusy: string[] } {
  const plusy = f.plusy?.length ? f.plusy : [f.wygrana, ...f.kryteria.filter((k) => k.ocena >= 7).map((k) => `${NAZWY[k.nazwa]}: ${k.komentarz}`)].filter(Boolean);
  const minusy = f.minusy?.length ? f.minusy : f.kryteria.filter((k) => k.ocena <= 5).map((k) => `${NAZWY[k.nazwa]}: ${k.komentarz}`);
  return { plusy: plusy.slice(0, 5), minusy: minusy.slice(0, 5) };
}

/** jezyk: komponent bez "use client" (strona serwerowa i rozmowa.tsx), więc język przychodzi propsem. */
export default function FeedbackWidok({ feedback, dalej, jezyk = "en" }: { feedback: Feedback; dalej?: boolean; jezyk?: Jezyk }) {
  const tr = tDla(jezyk);
  const { NAZWY } = etykiety(jezyk);
  const { plusy, minusy } = plusyMinusy(feedback, NAZWY);
  return (
    <div className="flex flex-col gap-5">
      <div className="bruno-szklo rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-3">
        <Badge ton="cyjan">{tr("Call score", "Ocena rozmowy")}</Badge>
        <OcenaKolo ocena={feedback.ocena} tr={tr} />
        <p className="text-slate-700 text-[15px]">{feedback.liczba_z_audio}</p>
      </div>

      {/* 11.10 (USER_001): PLUSY po lewej, MINUSY po prawej, w jednej tabelce (wiersze obok siebie). */}
      <section className="bruno-szklo rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-[14px] table-fixed border-collapse">
          <thead>
            <tr>
              <th className="w-1/2 text-left pb-3 pr-4 font-normal">
                <span className="flex items-center gap-2"><Kolko znak="plus" kolor="#16a34a" /><Badge>{tr("Pluses", "Plusy")}</Badge></span>
              </th>
              <th className="w-1/2 text-left pb-3 pl-4 font-normal border-l border-slate-200/60">
                <span className="flex items-center gap-2"><Kolko znak="minus" kolor="#dc2626" /><Badge>{tr("Minuses", "Minusy")}</Badge></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(plusy.length, minusy.length, 1) }, (_, i) => (
              <tr key={i} className="align-top border-t border-slate-200/60">
                <td className="py-2.5 pr-4 text-slate-800">
                  {plusy[i] ? (<span className="flex gap-2"><span className="text-green-600 font-bold shrink-0">+</span><span>{plusy[i]}</span></span>) : i === 0 ? <span className="text-slate-500">{tr("None.", "Brak.")}</span> : null}
                </td>
                <td className="py-2.5 pl-4 text-slate-800 border-l border-slate-200/60">
                  {minusy[i] ? (<span className="flex gap-2"><span className="text-red-600 font-bold shrink-0">–</span><span>{minusy[i]}</span></span>) : i === 0 ? <span className="text-slate-500">{tr("None.", "Brak.")}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ul className="flex flex-col gap-3">
        {feedback.kryteria.map((k) => (
          <li key={k.nazwa} className={`bruno-szklo rounded-2xl p-5 ${k.nazwa === feedback.najslabsze ? "border-amber-300/80" : ""}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bruno-h2 text-base flex items-center gap-2">
                {NAZWY[k.nazwa]}
                {k.nazwa === feedback.najslabsze && <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{tr("weakest", "najsłabsze")}</span>}
              </div>
              <div className="font-semibold text-slate-900">{k.ocena}/10</div>
            </div>
            <Pasek ocena={k.ocena} />
            {k.cytat && (
              <blockquote className="mt-3 text-sm text-slate-600 border-l-2 border-slate-300 pl-3 italic">
                {jezyk === "pl" ? `„${k.cytat}”` : `“${k.cytat}”`} {k.czas && <span className="not-italic text-slate-400">[{k.czas}]</span>}
              </blockquote>
            )}
            <p className="mt-2 text-sm text-slate-800">{k.komentarz}</p>
            {k.nazwa === "zamkniecie" && feedback.zamkniecie_techniki && <Techniki t={feedback.zamkniecie_techniki} tr={tr} />}
          </li>
        ))}
      </ul>

      {feedback.obiekcje_ocena && feedback.obiekcje_ocena.length > 0 && (
        <div className="bruno-szklo rounded-2xl p-5">
          <div className="mb-2"><Badge>{tr("Objections that came up", "Obiekcje, które padły")}</Badge></div>
          <ul className="text-sm text-slate-800 flex flex-col gap-1">
            {feedback.obiekcje_ocena.map((o, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">{o.obiekcja}</span>
                <span className="text-slate-500 shrink-0">{(jezyk === "pl" ? ["", "poległeś", "słabo", "dobrze", "wzorowo"] : ["", "missed", "weak", "good", "textbook"])[o.ocena]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bruno-szklo rounded-2xl p-5 border-cyan-700/30">
        <div className="flex items-center gap-2 mb-2">
          <Kolko znak="strzalka" kolor="#d4af5a" />
          <Badge ton="cyjan">{tr("Next time", "Następnym razem")}</Badge>
        </div>
        <p className="text-[15px] text-slate-900 font-medium leading-relaxed">{feedback.poprawka || tr("None.", "Brak.")}</p>
      </div>

      {dalej && (
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/bruno/panel" className="bruno-przycisk">{tr("Back to Home", "Wróć do panelu")}</Link>
          <Link href="/bruno/trening" className="bruno-przycisk-2">{tr("Practice objections in Drills", "Przećwicz obiekcje w Treningu")}</Link>
          <Link href="/bruno/rozmowa" className="bruno-przycisk-2">{tr("One more Live Call", "Jeszcze jeden test")}</Link>
        </div>
      )}
    </div>
  );
}
