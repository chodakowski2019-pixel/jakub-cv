import Link from "next/link";
import type { Feedback, ZamkniecieTechniki } from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";

// Widok feedbacku trenera (układ USER_001 2.10). Ten sam po rozmowie i w Feedbacku.
// Kolejność: badge OCENA ROZMOWY + ocena w kółku → MINUSY | PLUSY (punkty)
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

function OcenaKolo({ ocena }: { ocena: number }) {
  const r = 44;
  const obwod = 2 * Math.PI * r;
  const udzial = Math.min(1, Math.max(0, ocena / 10));
  return (
    <svg viewBox="0 0 104 104" width="128" height="128" role="img" aria-label={`Ocena ${ocena} na 10`}>
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
function Techniki({ t }: { t: ZamkniecieTechniki }) {
  const POMYSLEC: Record<ZamkniecieTechniki["musze_pomyslec"], [boolean | null, string]> = {
    nie_padlo: [null, "klient nie unikał"],
    poddal_sie: [false, "poddałeś się po „muszę pomyśleć”"],
    czekal: [false, "„muszę pomyśleć” zostało bez odpowiedzi"],
    pytanie: [true, "zapytałeś, co konkretnie chce przemyśleć"],
    warunek: [true, "postawiłeś warunek „jeśli X, to podpisujemy?”"],
  };
  const DRUGIE: Record<ZamkniecieTechniki["drugie_zamkniecie"], [boolean | null, string]> = {
    nie_dotyczy: [null, "obiekcji przy zamknięciu nie było"],
    brak: [false, "po obiekcji nie poprosiłeś o decyzję drugi raz"],
    bylo: [true, "po obiekcji poprosiłeś o decyzję drugi raz"],
  };
  const SYGNAL: Record<ZamkniecieTechniki["sygnal_kupna"], [boolean | null, string]> = {
    nie_bylo: [null, "klient nie dał sygnału kupna"],
    wykorzystany: [true, "sygnał kupna wykorzystany od razu"],
    zmarnowany: [false, "sygnał kupna zmarnowany, mówiłeś dalej"],
  };
  const wiersze: [string, boolean | null, string][] = [
    ["Próba zamknięcia", t.proba_zamkniecia, t.proba_zamkniecia ? "„jak to brzmi?” padło" : "brak próbnego „jak to brzmi?”"],
    ["Pytanie o decyzję", t.pytanie_o_decyzje, t.pytanie_o_decyzje ? "zapytałeś wprost" : "nie zapytałeś wprost „podpisujemy?”"],
    ["Następny krok z datą", t.nastepny_krok_z_data, t.nastepny_krok_z_data ? "termin zaproponowany" : "bez konkretnego terminu"],
    ["„Muszę pomyśleć”", ...POMYSLEC[t.musze_pomyslec]],
    ["Drugie zamknięcie", ...DRUGIE[t.drugie_zamkniecie]],
    ["Sygnał kupna", ...SYGNAL[t.sygnal_kupna]],
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
function plusyMinusy(f: Feedback): { plusy: string[]; minusy: string[] } {
  const plusy = f.plusy?.length ? f.plusy : [f.wygrana, ...f.kryteria.filter((k) => k.ocena >= 7).map((k) => `${NAZWY[k.nazwa]}: ${k.komentarz}`)].filter(Boolean);
  const minusy = f.minusy?.length ? f.minusy : f.kryteria.filter((k) => k.ocena <= 5).map((k) => `${NAZWY[k.nazwa]}: ${k.komentarz}`);
  return { plusy: plusy.slice(0, 5), minusy: minusy.slice(0, 5) };
}

export default function FeedbackWidok({ feedback, dalej }: { feedback: Feedback; dalej?: boolean }) {
  const { plusy, minusy } = plusyMinusy(feedback);
  return (
    <div className="flex flex-col gap-5">
      <div className="bruno-szklo rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-3">
        <Badge ton="cyjan">Ocena rozmowy</Badge>
        <OcenaKolo ocena={feedback.ocena} />
        <p className="text-slate-700 text-[15px]">{feedback.liczba_z_audio}</p>
      </div>

      {/* MINUSY | PLUSY jako punkty w tabeli */}
      <div className="grid sm:grid-cols-2 gap-4">
        <section className="bruno-szklo rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Kolko znak="minus" kolor="#dc2626" />
            <Badge>Minusy</Badge>
          </div>
          {minusy.length === 0 ? (
            <p className="text-sm text-slate-500">Brak.</p>
          ) : (
            <table className="w-full text-[14px]">
              <tbody>
                {minusy.map((m, i) => (
                  <tr key={i} className="align-top">
                    <td className="w-6 pt-2 pb-2 text-red-600 font-bold">–</td>
                    <td className="pt-2 pb-2 text-slate-800 border-b border-slate-200/60 last:border-0">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="bruno-szklo rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Kolko znak="plus" kolor="#16a34a" />
            <Badge>Plusy</Badge>
          </div>
          {plusy.length === 0 ? (
            <p className="text-sm text-slate-500">Brak.</p>
          ) : (
            <table className="w-full text-[14px]">
              <tbody>
                {plusy.map((p, i) => (
                  <tr key={i} className="align-top">
                    <td className="w-6 pt-2 pb-2 text-green-600 font-bold">+</td>
                    <td className="pt-2 pb-2 text-slate-800 border-b border-slate-200/60 last:border-0">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <ul className="flex flex-col gap-3">
        {feedback.kryteria.map((k) => (
          <li key={k.nazwa} className={`bruno-szklo rounded-2xl p-5 ${k.nazwa === feedback.najslabsze ? "border-amber-300/80" : ""}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bruno-h2 text-base flex items-center gap-2">
                {NAZWY[k.nazwa]}
                {k.nazwa === feedback.najslabsze && <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">najsłabsze</span>}
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
            {k.nazwa === "zamkniecie" && feedback.zamkniecie_techniki && <Techniki t={feedback.zamkniecie_techniki} />}
          </li>
        ))}
      </ul>

      {feedback.obiekcje_ocena && feedback.obiekcje_ocena.length > 0 && (
        <div className="bruno-szklo rounded-2xl p-5">
          <div className="mb-2"><Badge>Obiekcje, które padły</Badge></div>
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

      <div className="bruno-szklo rounded-2xl p-5 border-cyan-700/30">
        <div className="flex items-center gap-2 mb-2">
          <Kolko znak="strzalka" kolor="#d4af5a" />
          <Badge ton="cyjan">Następnym razem</Badge>
        </div>
        <p className="text-[15px] text-slate-900 font-medium leading-relaxed">{feedback.poprawka || "Brak."}</p>
      </div>

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
