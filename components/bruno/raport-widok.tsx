import Link from "next/link";
import { Blad, Chip, Delta, Kafel, Miernik, NaglowekP, Pierscien, Pusto, Twarz } from "@/components/bruno/panel-ui";
import RaportPrzycisk from "@/components/bruno/raport-przycisk";

// 7.11 (USER_001: „ukryj to na razie, albo daj, że raport zostanie stworzony”): treść raportu od Bruno i przycisk
// „Wygeneruj teraz” ukryte, zamiast nich zdanie z datą 1. dnia następnego miesiąca. false = pokaż z powrotem.
const RAPORT_UKRYTY = true;
import type { Firma } from "@/lib/bruno/firmy";
import { locale, tDla, type Jezyk } from "@/lib/bruno/i18n";
import { formatKwota } from "@/lib/bruno/lejek";
import type { RaportWiersz, WierszZespolu } from "@/lib/bruno/raport";

// 4.11 (USER_001, pkt 3): widok /bruno/raport (szef): tabela zespołu (CRM + treningi + mental) i raporty miesięczne.
// 6.11: nowy system zakładek (panel-2.css): 6 kafelków, tabela z miernikami (skuteczność, aktywność), pierścień oceny
// z deltą, pigułki etapu / kryterium, raport od Bruno w 3 blokach (poprawa / traci / zalecenia).

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
  const skutecznosc = razem.wygrane + razem.przegrane ? Math.round((100 * razem.wygrane) / (razem.wygrane + razem.przegrane)) : null;
  const maxAkt = Math.max(1, ...wiersze.map((w) => w.aktywnosci30));
  const maxTren = Math.max(1, ...wiersze.map((w) => w.rozmow30));
  const srZespolu = wiersze.filter((w) => w.srednia !== null).length ? wiersze.filter((w) => w.srednia !== null).reduce((s, w) => s + (w.srednia as number), 0) / wiersze.filter((w) => w.srednia !== null).length : null;

  return (
    <div className="p-strona">
      <NaglowekP
        tytul={t("Monthly report", "Raport miesięczny")}
        akcent={firma?.naglowek?.trim() || firma?.nazwa || ""}
        podtytul={od ? t(`Last 30 days: ${od} to ${doDnia}. CRM + Bruno trainings + mental check.`, `Ostatnie 30 dni: ${od} do ${doDnia}. CRM + treningi Bruno + sprawdzian mentalny.`) : undefined}
        prawo={RAPORT_UKRYTY ? undefined : <RaportPrzycisk />}
      />

      {blad && <Blad tytul={t("Couldn't read the CRM.", "Nie udało się odczytać CRM.")} tekst={blad} />}

      {!blad && (
        <div className="p-kafle">
          <Kafel wartosc={razem.otwarte} etykieta={t("Open deals", "Otwarte deale")} dol={<span>{wiersze.length} {t("reps", "handlowców")}</span>} />
          <Kafel wartosc={kwota(razem.wartosc)} etykieta={t("In the pipeline", "W lejku")} dol={<span>{t("open deals value", "wartość otwartych")}</span>} />
          <Kafel wartosc={razem.wygrane} etykieta={t("Won", "Wygrane")} kropka="#17a05e" dol={<Miernik proc={skutecznosc} k={skutecznosc !== null && skutecznosc < 40 ? "zle" : "ok"} tekst={skutecznosc === null ? "–" : `${skutecznosc} %`} />} />
          <Kafel wartosc={razem.przegrane} etykieta={t("Lost", "Przegrane")} kropka="#e5484d" zle={razem.przegrane > razem.wygrane} dol={<span>{t("30 days + older", "30 dni i starsze")}</span>} />
          <Kafel wartosc={razem.treningi} etykieta={t("Trainings, 30 d", "Treningi, 30 dni")} dol={<span>{srZespolu === null ? t("no scores", "brak ocen") : `${t("team avg", "śr. zespołu")} ${srZespolu.toLocaleString(locale(jezyk), { maximumFractionDigits: 1 })}`}</span>} />
          <Kafel wartosc={razem.zalegle} etykieta={t("Overdue tasks", "Zaległe zadania")} zle={razem.zalegle > 0} kropka={razem.zalegle > 0 ? "#e5484d" : undefined} dol={<span>{t("in the CRM today", "w CRM na dziś")}</span>} />
        </div>
      )}

      {!blad && (
        <section className="p-karta">
          <div className="p-karta-hd">
            <div>
              <h2>{t("Every rep", "Każdy handlowiec")}</h2>
              <p>{t("CRM activity · trainings · scores · weakest stage · mental check. Sorted by win rate, lowest first.", "Aktywność w CRM · treningi · oceny · najsłabszy etap · sprawdzian mentalny. Od najniższej skuteczności.")}</p>
            </div>
          </div>
          <div className="p-tabela-wrap" style={{ marginTop: 12 }}>
            <table className="p-tabela p-tabela-gesta">
              <thead>
                <tr>
                  <th>{t("Rep", "Handlowiec")}</th>
                  <th className="p-num">{t("Open", "Otwarte")}</th>
                  <th>{t("Win rate", "Skuteczność")}</th>
                  <th>{t("Loses at", "Traci na")}</th>
                  <th>{t("CRM activity 30 d", "Aktywność CRM 30 dni")}</th>
                  <th className="p-num">{t("Overdue", "Zaległe")}</th>
                  <th>{t("Trainings 30 d", "Treningi 30 dni")}</th>
                  <th>{t("Avg score", "Śr. ocena")}</th>
                  <th>{t("Weakest skill", "Najsłabsze")}</th>
                  <th className="p-num">{t("Mental", "Mental")}</th>
                </tr>
              </thead>
              <tbody>
                {wiersze
                  .slice()
                  .sort((a, b) => (a.skutecznosc ?? 101) - (b.skutecznosc ?? 101))
                  .map((w, i) => (
                    <tr key={w.email} style={{ animationDelay: `${i * 40}ms` }}>
                      <td>
                        <Link href={`/bruno/szef/${encodeURIComponent(w.email)}`} className="p-osoba">
                          <Twarz src={w.zdjecie} imie={w.imie} rozmiar={36} />
                          <span className="min-w-0">
                            <b>{w.imie}</b>
                            <small>{kwota(w.wartosc_otwarte)}</small>
                          </span>
                        </Link>
                      </td>
                      <td className="p-num">{w.otwarte}</td>
                      <td><Miernik proc={w.skutecznosc} k={w.skutecznosc !== null && w.skutecznosc < 40 ? "zle" : ""} /></td>
                      <td>{w.najslabszy_etap ? <Chip k="uwaga">{w.najslabszy_etap}</Chip> : <span className="p-cichy">–</span>}</td>
                      <td><Miernik proc={Math.round((100 * w.aktywnosci30) / maxAkt)} k={w.aktywnosci30 === 0 ? "zle" : ""} tekst={String(w.aktywnosci30)} /></td>
                      <td className="p-num">{w.zalegle > 0 ? <span className="p-zle-t">{w.zalegle}</span> : <span className="p-cichy">0</span>}</td>
                      <td>
                        <span className="p-miernik">
                          <span className="p-miernik-tor"><i data-k={w.dni_bez_treningu !== null && w.dni_bez_treningu >= 3 ? "zle" : "lim"} style={{ width: `${(100 * w.rozmow30) / maxTren}%` }} /></span>
                          <b>{w.rozmow30}</b>
                        </span>
                        {w.dni_bez_treningu !== null && w.dni_bez_treningu >= 3 && <small className="p-zle-t" style={{ display: "block", fontSize: 11, marginTop: 2 }}>{t(`${w.dni_bez_treningu} d without`, `${w.dni_bez_treningu} dni bez`)}</small>}
                      </td>
                      <td>
                        <span className="pr-ocena">
                          <Pierscien v={w.srednia} prog={5} />
                          <Delta v={w.trend} locale={locale(jezyk)} />
                        </span>
                      </td>
                      <td>{w.najslabsze_kryterium ? <Chip>{w.najslabsze_kryterium}</Chip> : <span className="p-cichy">–</span>}</td>
                      <td className="p-num">{w.mental === null ? <span className="p-cichy" title={t("No check yet", "Brak sprawdzianu")}>–</span> : <Pierscien v={w.mental} max={100} prog={50} tekst={String(w.mental)} />}</td>
                    </tr>
                  ))}
                {wiersze.length === 0 && (
                  <tr>
                    <td colSpan={10}><Pusto tytul={t("No reps yet", "Brak handlowców")} opis={t("No reps in this company yet.", "W tej firmie nie ma jeszcze handlowców.")} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="p-karta p-karta-p">
        <div className="p-karta-hd">
          <div>
            <h2>{t("Monthly report from Bruno", "Raport miesięczny od Bruno")}</h2>
            <p>{t("What improved, who, where deals are lost, 3 recommendations. Sent by e-mail on the 1st of each month.", "Co się poprawiło, kto, gdzie uciekają deale, 3 zalecenia. Mail 1. dnia każdego miesiąca.")}</p>
          </div>
          {!RAPORT_UKRYTY && ostatni && <span className="p-karta-hd-meta"><Chip k="ciemny">{ostatni.tresc.miesiac}</Chip> <span>{data(ostatni.utworzono)}</span></span>}
        </div>

        {RAPORT_UKRYTY ? (
          <div className="pr-raport">
            <p className="pr-raport-lead">
              {t("The report will be created on ", "Raport zostanie stworzony ")}
              <b>{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString(locale(jezyk), { day: "numeric", month: "long", year: "numeric" })}</b>
              {t(" and sent by e-mail.", " i przyjdzie mailem.")}
            </p>
          </div>
        ) : ostatni ? (
          <article className="pr-raport">
            <p className="pr-raport-lead">{ostatni.tresc.podsumowanie}</p>
            <div className="pr-raport-siatka">
              <div className="pr-raport-blok">
                <h3><i style={{ background: "var(--p-ok)" }} /> {t("Improved", "Poprawa")}</h3>
                <ul>{ostatni.tresc.poprawa.map((p, i) => <li key={i}><b>{p.kto}</b>: {p.co}</li>)}{ostatni.tresc.poprawa.length === 0 && <li className="p-cichy">–</li>}</ul>
              </div>
              <div className="pr-raport-blok">
                <h3><i style={{ background: "var(--p-zle)" }} /> {t("Loses deals", "Traci deale")}</h3>
                <ul>{ostatni.tresc.traci.map((p, i) => <li key={i}><b>{p.kto}</b>: {p.gdzie}, {p.ile}</li>)}{ostatni.tresc.traci.length === 0 && <li className="p-cichy">–</li>}</ul>
              </div>
              <div className="pr-raport-blok" style={{ background: "var(--p-lim-j)", borderColor: "#e6ec9e" }}>
                <h3><i style={{ background: "var(--p-lim-c)" }} /> {t("3 recommendations", "3 zalecenia")}</h3>
                <ol>{ostatni.tresc.zalecenia.map((z, i) => <li key={i}>{z}</li>)}</ol>
              </div>
            </div>
          </article>
        ) : (
          <div className="pr-raport">
            <p className="pr-raport-lead">{t("No report yet. Click “Generate now”: Bruno reads the CRM and trainings and writes the first one.", "Jeszcze nie ma raportu. Kliknij „Wygeneruj teraz”: Bruno odczyta CRM i treningi i napisze pierwszy.")}</p>
            <div className="pr-raport-siatka pr-szkic" aria-hidden>
              <div className="pr-raport-blok"><h3><i style={{ background: "var(--p-ok)" }} /> {t("Improved", "Poprawa")}</h3><ul><li><b>Marta</b>: {t("win rate 60 % → 75 %", "skuteczność 60 % → 75 %")}</li></ul></div>
              <div className="pr-raport-blok"><h3><i style={{ background: "var(--p-zle)" }} /> {t("Loses deals", "Traci deale")}</h3><ul><li><b>Kasia</b>: {t("Proposal sent, 4 lost", "Złożono ofertę, 4 przegrane")}</li></ul></div>
              <div className="pr-raport-blok"><h3><i style={{ background: "var(--p-lim-c)" }} /> {t("3 recommendations", "3 zalecenia")}</h3><ol><li>…</li><li>…</li><li>…</li></ol></div>
            </div>
          </div>
        )}
        {!RAPORT_UKRYTY && raporty.length > 1 && (
          <details className="pr-wczesniejsze">
            <summary>{t(`Earlier reports (${raporty.length - 1})`, `Wcześniejsze raporty (${raporty.length - 1})`)}</summary>
            <ul>{raporty.slice(1).map((r) => <li key={r.id}><b>{r.tresc.miesiac}</b> · {data(r.utworzono)}: {r.tresc.podsumowanie.slice(0, 140)}…</li>)}</ul>
          </details>
        )}
      </section>
    </div>
  );
}
