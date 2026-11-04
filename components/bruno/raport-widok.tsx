import Link from "next/link";
import { Naglowek } from "@/components/bruno/zespol-widok";
import RaportPrzycisk from "@/components/bruno/raport-przycisk";
import type { Firma } from "@/lib/bruno/firmy";
import { locale, tDla, type Jezyk } from "@/lib/bruno/i18n";
import { formatKwota } from "@/lib/bruno/lejek";
import type { RaportWiersz, WierszZespolu } from "@/lib/bruno/raport";

// 4.11 (USER_001, pkt 3): widok /bruno/raport (szef): tabela zespołu (CRM + treningi + mental) i raporty miesięczne.

export default function RaportWidok({ firma, jezyk, wiersze, waluta, od, do: doDnia, raporty, blad = null }: { firma: Firma | null; jezyk: Jezyk; wiersze: WierszZespolu[]; waluta: string; od: string; do: string; raporty: RaportWiersz[]; blad?: string | null }) {
  const t = tDla(jezyk);
  const kwota = (n: number) => formatKwota(n, waluta, jezyk);
  const data = (iso: string) => new Date(iso).toLocaleDateString(locale(jezyk), { day: "numeric", month: "short", year: "numeric" });
  const ostatni = raporty[0] ?? null;
  const razem = {
    otwarte: wiersze.reduce((s, w) => s + w.otwarte, 0),
    wartosc: wiersze.reduce((s, w) => s + w.wartosc_otwarte, 0),
    wygrane: wiersze.reduce((s, w) => s + w.wygrane, 0),
    przegrane: wiersze.reduce((s, w) => s + w.przegrane, 0),
    treningi: wiersze.reduce((s, w) => s + w.rozmow30, 0),
    zalegle: wiersze.reduce((s, w) => s + w.zalegle, 0),
  };

  return (
    <div className="flex flex-col gap-6 bsz brp">
      <Naglowek firma={firma} tytul={t("Monthly report", "Raport miesięczny")} akcent={firma?.naglowek?.trim() || firma?.nazwa || ""} podtytul={od ? t(`Last 30 days: ${od} to ${doDnia}. CRM + Bruno trainings + mental check.`, `Ostatnie 30 dni: ${od} do ${doDnia}. CRM + treningi Bruno + sprawdzian mentalny.`) : undefined} />

      {blad && (
        <section className="bruno-szklo rounded-2xl p-6">
          <p className="text-rose-800 font-medium">{t("Couldn't read the CRM.", "Nie udało się odczytać CRM.")}</p>
          <p className="text-slate-500 text-sm mt-1 break-words">{blad}</p>
        </section>
      )}

      {!blad && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            [razem.otwarte, t("open deals", "otwartych deali")],
            [kwota(razem.wartosc), t("in the pipeline", "w lejku")],
            [razem.wygrane, t("won", "wygranych")],
            [razem.przegrane, t("lost", "przegranych")],
            [razem.treningi, t("trainings, 30 d", "treningów, 30 dni")],
            [razem.zalegle, t("overdue tasks", "zaległych zadań")],
          ].map(([l, o], i) => (
            <div key={i} className="bruno-szklo rounded-2xl p-4 bsz-kafelek">
              <div className={`bruno-h2 text-[1.5rem] leading-none tabular-nums ${i === 3 || i === 5 ? "text-rose-800" : "bruno-gradient-tekst"}`}>{l}</div>
              <div className="text-[12px] font-semibold text-slate-700 mt-2 leading-tight">{o}</div>
            </div>
          ))}
        </div>
      )}

      {!blad && (
        <section className="bruno-szklo rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-2 flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="bruno-h2 text-lg">{t("Every rep", "Każdy handlowiec")}</h2>
            <span className="text-[11px] text-slate-500">{t("CRM activity · trainings · scores · weakest stage · mental check", "aktywność w CRM · treningi · oceny · najsłabszy etap · sprawdzian mentalny")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="brp-tabela">
              <thead>
                <tr>
                  <th>{t("Rep", "Handlowiec")}</th>
                  <th className="text-center">{t("Open", "Otwarte")}</th>
                  <th className="text-center">{t("Win rate", "Skuteczność")}</th>
                  <th>{t("Loses at", "Traci na")}</th>
                  <th className="text-center">{t("CRM activity 30 d", "Aktywność CRM 30 dni")}</th>
                  <th className="text-center">{t("Overdue", "Zaległe")}</th>
                  <th className="text-center">{t("Trainings 30 d", "Treningi 30 dni")}</th>
                  <th className="text-center">{t("Avg score", "Śr. ocena")}</th>
                  <th>{t("Weakest skill", "Najsłabsze")}</th>
                  <th className="text-center">{t("Mental", "Mental")}</th>
                </tr>
              </thead>
              <tbody>
                {wiersze
                  .slice()
                  .sort((a, b) => (a.skutecznosc ?? 101) - (b.skutecznosc ?? 101))
                  .map((w) => (
                    <tr key={w.email}>
                      <td>
                        <Link href={`/bruno/szef/${encodeURIComponent(w.email)}`} className="flex items-center gap-2.5 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {w.zdjecie ? <img src={w.zdjecie} alt="" className="bsz-inicjal bsz-zdjecie" style={{ width: 30, height: 30 }} /> : <span className="bsz-inicjal" style={{ width: 30, height: 30, fontSize: 13 }}>{w.imie[0]?.toUpperCase()}</span>}
                          <span className="min-w-0">
                            <span className="block font-semibold text-slate-900 truncate">{w.imie}</span>
                            <span className="block text-[11px] text-slate-400 tabular-nums">{kwota(w.wartosc_otwarte)}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="text-center tabular-nums">{w.otwarte}</td>
                      <td className="text-center tabular-nums">{w.skutecznosc === null ? <span className="text-slate-300">–</span> : <b className={w.skutecznosc < 40 ? "text-rose-800" : "text-slate-800"}>{w.skutecznosc} %</b>}</td>
                      <td>{w.najslabszy_etap ? <span className="bsz-pigulka">{w.najslabszy_etap}</span> : <span className="text-slate-300">–</span>}</td>
                      <td className="text-center tabular-nums">{w.aktywnosci30 === 0 ? <span className="text-rose-800 font-semibold">0</span> : w.aktywnosci30}</td>
                      <td className="text-center tabular-nums">{w.zalegle > 0 ? <span className="text-rose-800 font-semibold">{w.zalegle}</span> : <span className="text-slate-300">0</span>}</td>
                      <td className="text-center tabular-nums">
                        {w.rozmow30}
                        {w.dni_bez_treningu !== null && w.dni_bez_treningu >= 3 && <span className="block text-[10px] text-rose-700">{t(`${w.dni_bez_treningu} d without`, `${w.dni_bez_treningu} dni bez`)}</span>}
                      </td>
                      <td className="text-center tabular-nums">
                        {w.srednia === null ? <span className="text-slate-300">–</span> : <b className={w.srednia < 5 ? "text-rose-800" : "text-slate-800"}>{w.srednia.toLocaleString(locale(jezyk))}</b>}
                        {w.trend !== null && <span className={`block text-[10px] ${w.trend > 0 ? "text-emerald-700" : w.trend < 0 ? "text-rose-700" : "text-slate-400"}`}>{w.trend > 0 ? "▲" : w.trend < 0 ? "▼" : "="} {Math.abs(w.trend).toLocaleString(locale(jezyk))}</span>}
                      </td>
                      <td>{w.najslabsze_kryterium ? <span className="bsz-pigulka">{w.najslabsze_kryterium}</span> : <span className="text-slate-300">–</span>}</td>
                      <td className="text-center tabular-nums">{w.mental === null ? <span className="text-slate-300" title={t("No check yet", "Brak sprawdzianu")}>–</span> : <b className={w.mental < 50 ? "text-rose-800" : "text-slate-800"}>{w.mental}</b>}</td>
                    </tr>
                  ))}
                {wiersze.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-6 text-slate-600 text-sm">{t("No reps in this company yet.", "W tej firmie nie ma jeszcze handlowców.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="bruno-szklo rounded-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="bruno-h2 text-lg">{t("Monthly report from Bruno", "Raport miesięczny od Bruno")}</h2>
            <p className="text-sm text-slate-500 mt-1">{t("What improved, who, where deals are lost, 3 recommendations. Sent by e-mail on the 1st of each month.", "Co się poprawiło, kto, gdzie uciekają deale, 3 zalecenia. Mail 1. dnia każdego miesiąca.")}</p>
          </div>
          <RaportPrzycisk />
        </div>

        {ostatni ? (
          <article className="brp-raport mt-5">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{ostatni.tresc.miesiac} · {data(ostatni.utworzono)}</div>
            <p className="text-slate-800 mt-2 leading-relaxed">{ostatni.tresc.podsumowanie}</p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-semibold text-emerald-800 text-sm mb-1.5">{t("Improved", "Poprawa")}</h3>
                <ul className="brp-lista">{ostatni.tresc.poprawa.map((p, i) => <li key={i}><b>{p.kto}</b>: {p.co}</li>)}{ostatni.tresc.poprawa.length === 0 && <li className="text-slate-400">–</li>}</ul>
              </div>
              <div>
                <h3 className="font-semibold text-rose-800 text-sm mb-1.5">{t("Loses deals", "Traci deale")}</h3>
                <ul className="brp-lista">{ostatni.tresc.traci.map((p, i) => <li key={i}><b>{p.kto}</b>: {p.gdzie}, {p.ile}</li>)}{ostatni.tresc.traci.length === 0 && <li className="text-slate-400">–</li>}</ul>
              </div>
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mt-4 mb-1.5">{t("3 recommendations", "3 zalecenia")}</h3>
            <ol className="brp-zalecenia">{ostatni.tresc.zalecenia.map((z, i) => <li key={i}>{z}</li>)}</ol>
          </article>
        ) : (
          <div className="brp-pusty mt-5">
            <p className="text-sm text-slate-600">{t("No report yet. Click “Generate now”: Bruno reads the CRM and trainings and writes the first one.", "Jeszcze nie ma raportu. Kliknij „Wygeneruj teraz”: Bruno odczyta CRM i treningi i napisze pierwszy.")}</p>
            <div className="brp-szkic mt-3" aria-hidden>
              <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{t("What it looks like", "Jak będzie wyglądał")}</div>
              <div className="grid md:grid-cols-2 gap-4 mt-2 text-sm text-slate-400">
                <div><b className="text-slate-500">{t("Improved", "Poprawa")}</b><br />Marta: {t("win rate 60 % → 75 %", "skuteczność 60 % → 75 %")}</div>
                <div><b className="text-slate-500">{t("Loses deals", "Traci deale")}</b><br />Kasia: {t("Proposal sent, 4 lost", "Złożono ofertę, 4 przegrane")}</div>
              </div>
              <div className="mt-2 text-sm text-slate-400"><b className="text-slate-500">{t("3 recommendations", "3 zalecenia")}</b><br />1. … 2. … 3. …</div>
            </div>
          </div>
        )}
        {raporty.length > 1 && (
          <details className="mt-4">
            <summary className="text-sm text-slate-500 cursor-pointer">{t(`Earlier reports (${raporty.length - 1})`, `Wcześniejsze raporty (${raporty.length - 1})`)}</summary>
            <ul className="mt-2 text-sm text-slate-600 flex flex-col gap-1">{raporty.slice(1).map((r) => <li key={r.id}>{r.tresc.miesiac} · {data(r.utworzono)}: {r.tresc.podsumowanie.slice(0, 140)}…</li>)}</ul>
          </details>
        )}
      </section>
    </div>
  );
}
