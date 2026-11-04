import Link from "next/link";
import { Naglowek } from "@/components/bruno/zespol-widok";
import type { Firma } from "@/lib/bruno/firmy";
import { tDla, type Jezyk } from "@/lib/bruno/i18n";
import { formatKwota, type AnalizaHandlowca, type Deal, type Etap, type EtapStat } from "@/lib/bruno/lejek";
import { zJako } from "@/lib/bruno/jako";
import { zdjecieKlienta } from "@/lib/bruno/twarze";

// 4.11 (USER_001): WIZUALIZACJA LEJKA z CRM. Góra: etapy jako słupki (otwarte deale + wartość, przegrane na czerwono).
// Szef: tabela handlowiec × etap (liczba przegranych), najsłabszy etap podświetlony, „Bruno trenuje: <etap>”.
// Handlowiec: swoje deale per etap + „Tracisz najwięcej na: X → Trenuj ten etap” (link do rozmowy z sytuacją).
// Styl: czarno-złote szkło (bruno-szklo, bsz-*), własne klasy blj-* w bruno.css.

type Osoba = { email: string; imie: string; zdjecie: string | null };

export default function LejekWidok({
  firma,
  jezyk,
  szef,
  pipeline,
  etapy,
  zespol,
  osoby,
  analizy,
  deale,
  bezHandlowca,
  ja,
  blad = null,
  jako = null,
  imie = null,
}: {
  firma: Firma | null;
  jezyk: Jezyk;
  szef: boolean;
  pipeline: { id: number; nazwa: string } | null;
  etapy: Etap[];
  zespol: EtapStat[];
  osoby: Osoba[];
  analizy: AnalizaHandlowca[];
  deale: Deal[];
  bezHandlowca: number;
  ja: string;
  blad?: string | null;
  /** 4.11: szef w widoku handlowca (?jako=), imię do nagłówka. */
  jako?: string | null;
  imie?: string | null;
}) {
  const t = tDla(jezyk);
  const waluta = deale[0]?.waluta ?? "PLN";
  const kwota = (n: number) => formatKwota(n, waluta, jezyk);
  const doszloMax = zespol.reduce((a, x) => a + x.otwarte + x.wygrane + x.przegrane, 0);
  const przegraneRazem = zespol.reduce((s, x) => s + x.przegrane, 0);
  const najslabszyZespolu = [...zespol].filter((s) => s.przegrane > 0).sort((a, b) => b.przegrane - a.przegrane || b.wartosc_przegrane - a.wartosc_przegrane)[0] ?? null;
  const moja = analizy.find((a) => a.email.toLowerCase() === ja) ?? null;
  const osoba = (email: string) => osoby.find((o) => o.email.toLowerCase() === email.toLowerCase());

  const sytuacjaTreningu = (etap: Etap, d?: Deal | null) => {
    const kto = d ? `${d.tytul}${d.osoba ? `, ${d.osoba}` : ""}${d.organizacja ? ` (${d.organizacja})` : ""}, ${kwota(d.wartosc)}` : "";
    return jezyk === "pl"
      ? `Etap lejka: ${etap.nazwa}. ${kto ? `Deal: ${kto}. ` : ""}Na tym etapie tracę najwięcej deali. Zagraj klienta dokładnie w tym momencie procesu i naciskaj tam, gdzie zwykle odpadam.`
      : `Pipeline stage: ${etap.nazwa}. ${kto ? `Deal: ${kto}. ` : ""}This is where I lose the most deals. Play the customer at exactly this point of the process and push where I usually fall off.`;
  };
  const linkTreningu = (etap: Etap, d?: Deal | null) => `/bruno/rozmowa?sytuacja=${encodeURIComponent(sytuacjaTreningu(etap, d))}`;

  if (blad) {
    return (
      <div className="flex flex-col gap-6 bsz">
        <Naglowek firma={firma} tytul={t("Pipeline", "Lejek")} akcent={firma?.nazwa ?? "CRM"} />
        <section className="bruno-szklo rounded-2xl p-6">
          <p className="text-rose-800 font-medium">{t("Couldn't read the CRM.", "Nie udało się odczytać CRM.")}</p>
          <p className="text-slate-500 text-sm mt-1 break-words">{blad}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bsz blj">
      <Naglowek firma={firma} tytul={t("Pipeline", "Lejek")} akcent={firma?.naglowek?.trim() || firma?.nazwa || "CRM"} podtytul={`${imie ? `${imie} · ` : ""}${pipeline?.nazwa ? `${pipeline.nazwa} · ` : ""}${t("Live from Pipedrive. Red = deals lost at this stage.", "Na żywo z Pipedrive. Czerwone = deale przegrane na tym etapie.")}`} />

      {/* Etapy jako słupki */}
      <section className="bruno-szklo rounded-2xl p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
          <h2 className="bruno-h2 text-lg">{szef ? t("Team funnel", "Lejek zespołu") : t("Your funnel", "Twój lejek")}</h2>
          <span className="text-sm text-slate-500">
            {t("Open", "Otwarte")}: <b className="text-slate-800">{zespol.reduce((s, x) => s + x.otwarte, 0)}</b> · {t("Won", "Wygrane")}: <b className="text-slate-800">{zespol.reduce((s, x) => s + x.wygrane, 0)}</b> · {t("Lost", "Przegrane")}:{" "}
            <b className="text-rose-800">{przegraneRazem}</b>
          </span>
        </div>
        {/* 4.11 (USER_001 „popraw wizualnie”): prawdziwy kształt lejka. Szerokość paska = ile deali DOSZŁO do etapu
            (otwarte tu + przegrane tu + wszystko dalej), więc lejek się zwęża. Segmenty: otwarte / wygrane / przegrane tutaj. */}
        <ol className="blj-lejek">
          {zespol.map((s, i) => {
            const doszlo = zespol.slice(i).reduce((a, x) => a + x.otwarte + x.wygrane + x.przegrane, 0);
            const dalej = zespol.slice(i + 1).reduce((a, x) => a + x.otwarte + x.wygrane + x.przegrane, 0) + s.wygrane;
            const szer = Math.max(14, Math.round((100 * doszlo) / Math.max(1, doszloMax)));
            const proc = doszlo ? Math.round((100 * dalej) / doszlo) : null;
            const seg = (n: number) => (doszlo ? `${(100 * n) / doszlo}%` : "0%");
            const naj = najslabszyZespolu?.etap.id === s.etap.id;
            const ostatni = i === zespol.length - 1;
            return (
              <li key={s.etap.id} className={`blj-rzad ${naj ? "blj-naj" : ""}`} style={{ animationDelay: `${i * 70}ms` }}>
                <div className="blj-rzad-lewo">
                  <span className="blj-rzad-nr">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="blj-rzad-nazwa">{s.etap.nazwa}</span>
                    <span className="blj-rzad-pod tabular-nums">{s.otwarte} {t("open", "otw.")} · {kwota(s.wartosc)}</span>
                  </span>
                </div>
                <div className="blj-rzad-pasek-wrap">
                  <div className="blj-rzad-pasek" style={{ width: `${szer}%` }} title={`${doszlo} ${t("deals reached this stage", "deali doszło do tego etapu")}`}>
                    {s.otwarte > 0 && <span className="blj-seg blj-seg-otwarte" style={{ width: seg(s.otwarte) }}>{s.otwarte}</span>}
                    {s.wygrane > 0 && <span className="blj-seg blj-seg-wygrane" style={{ width: seg(s.wygrane) }}>{s.wygrane}</span>}
                    {s.przegrane > 0 && <span className="blj-seg blj-seg-przegrane" style={{ width: seg(s.przegrane) }}>{s.przegrane}</span>}
                    {dalej > 0 && !ostatni && <span className="blj-seg blj-seg-dalej" style={{ width: seg(dalej - s.wygrane) }} />}
                  </div>
                </div>
                <div className="blj-rzad-prawo tabular-nums">
                  {s.przegrane > 0 ? <span className="blj-strata">−{s.przegrane} {t("lost", "przegr.")}{s.wartosc_przegrane ? ` · ${kwota(s.wartosc_przegrane)}` : ""}</span> : <span className="text-slate-300">{t("no losses", "bez strat")}</span>}
                  {naj && <span className="bsz-pigulka blj-naj-pigulka">{t("Weakest stage", "Najsłabszy etap")}</span>}
                </div>
                {!ostatni && proc !== null && (
                  <div className="blj-przejscie" aria-label={t(`${proc}% move on`, `${proc} % przechodzi dalej`)}>
                    <i /><b className={proc < 50 ? "text-rose-700" : ""}>{proc} %</b><span>{t("move on", "przechodzi dalej")}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="flex gap-4 text-[11px] text-slate-500 mt-3 flex-wrap">
          <span><i className="blj-kropka blj-k-otwarte" /> {t("open here", "otwarte tutaj")}</span>
          <span><i className="blj-kropka blj-k-wygrane" /> {t("won", "wygrane")}</span>
          <span><i className="blj-kropka blj-k-przegrane" /> {t("lost here", "przegrane tutaj")}</span>
          <span><i className="blj-kropka blj-k-dalej" /> {t("moved to later stages", "poszły dalej")}</span>
        </div>
      </section>

      {/* Handlowiec: gdzie tracę + trening */}
      {!szef && moja && (
        <section className="bruno-szklo rounded-2xl p-5 sm:p-6 blj-alarm">
          {moja.najslabszy ? (
            <>
              <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{t("Where you lose deals", "Gdzie tracisz deale")}</div>
              <h2 className="bruno-h1 text-[1.6rem] sm:text-[2rem] leading-tight mt-1">
                <span className="bruno-gradient-tekst">{moja.najslabszy.nazwa}</span>
              </h2>
              <p className="text-slate-600 text-sm mt-2">
                {t(`${moja.przegrane} lost deals total, most at this stage. Win rate ${moja.skutecznosc ?? 0}%.`, `${moja.przegrane} przegranych deali, najwięcej na tym etapie. Skuteczność ${moja.skutecznosc ?? 0} %.`)}
              </p>
              <Link href={linkTreningu(moja.najslabszy, deale.find((d) => d.status === "open" && d.etap_id === moja.najslabszy!.id) ?? null)} className="bruno-przycisk inline-flex mt-4 px-6 py-3 text-base">
                {t("Train this stage with Bruno →", "Trenuj ten etap z Bruno →")}
              </Link>
            </>
          ) : (
            <p className="text-slate-600">{t("No lost deals yet. Bruno will pick a stage as soon as you lose one.", "Brak przegranych deali. Bruno wybierze etap, gdy jakiś przegrasz.")}</p>
          )}
        </section>
      )}

      {/* Szef: handlowiec × etap */}
      {szef && (
        <section className="bruno-szklo rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-2 flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="bruno-h2 text-lg">{t("Who loses where", "Kto gdzie traci")}</h2>
            <span className="text-[11px] text-slate-500">{t("Number of lost deals per stage. Gold = this rep's weakest stage.", "Liczba przegranych deali na etapie. Złote = najsłabszy etap handlowca.")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="blj-tabela">
              <thead>
                <tr>
                  <th>{t("Rep", "Handlowiec")}</th>
                  {etapy.map((e) => (
                    <th key={e.id}>{e.nazwa}</th>
                  ))}
                  <th>{t("Win rate", "Skuteczność")}</th>
                  <th>{t("Bruno trains", "Bruno trenuje")}</th>
                </tr>
              </thead>
              <tbody>
                {analizy
                  .slice()
                  .sort((a, b) => b.przegrane - a.przegrane)
                  .map((a) => {
                    const o = osoba(a.email);
                    return (
                      <tr key={a.email}>
                        <td>
                          <Link href={`/bruno/szef/${encodeURIComponent(a.email)}`} className="flex items-center gap-2.5 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {o?.zdjecie ? <img src={o.zdjecie} alt="" className="bsz-inicjal bsz-zdjecie" style={{ width: 30, height: 30 }} /> : <span className="bsz-inicjal" style={{ width: 30, height: 30, fontSize: 13 }}>{(o?.imie ?? a.email)[0]?.toUpperCase()}</span>}
                            <span className="min-w-0">
                              <span className="block font-semibold text-slate-900 truncate">{o?.imie ?? a.email}</span>
                              <span className="block text-[11px] text-slate-400 tabular-nums">{a.otwarte} {t("open", "otwartych")} · {kwota(a.wartosc_otwarte)}</span>
                            </span>
                          </Link>
                        </td>
                        {a.etapy.map((s) => {
                          const naj = a.najslabszy?.id === s.etap.id;
                          return (
                            <td key={s.etap.id} className={`tabular-nums text-center ${naj ? "blj-cela-naj" : ""}`}>
                              <span className={s.przegrane ? "text-rose-800 font-semibold" : "text-slate-300"}>{s.przegrane || "·"}</span>
                              {s.otwarte > 0 && <span className="block text-[10px] text-slate-400">{s.otwarte} {t("open", "otw.")}</span>}
                            </td>
                          );
                        })}
                        <td className="tabular-nums text-center">{a.skutecznosc === null ? <span className="text-slate-300">–</span> : <span className={a.skutecznosc < 40 ? "text-rose-800 font-semibold" : "text-slate-800 font-semibold"}>{a.skutecznosc} %</span>}</td>
                        <td>
                          {a.najslabszy ? (
                            <span className="bsz-pigulka">{a.najslabszy.nazwa}</span>
                          ) : (
                            <span className="text-slate-300">–</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {bezHandlowca > 0 && <p className="px-5 py-3 text-[11px] text-slate-400">{t(`${bezHandlowca} deals without a rep assigned (field „Handlowiec Bruno” empty).`, `${bezHandlowca} deali bez przypisanego handlowca (puste pole „Handlowiec Bruno”).`)}</p>}
          {analizy.length === 0 && <p className="p-6 text-slate-600 text-sm">{t("No reps in this company yet.", "W tej firmie nie ma jeszcze handlowców.")}</p>}
        </section>
      )}

      {/* Lista deali */}
      <section className="bruno-szklo rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-2 flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="bruno-h2 text-lg">{szef ? t("Open deals", "Otwarte deale") : t("Your open deals", "Twoje otwarte deale")}</h2>
          <Link href={zJako("/bruno/kokpit", jako)} className="text-sm text-amber-800 underline underline-offset-2">{t("Update in chat →", "Zaktualizuj w czacie →")}</Link>
        </div>
        <ul className="bsz-lista">
          {deale
            .filter((d) => d.status === "open")
            .sort((a, b) => b.wartosc - a.wartosc)
            .slice(0, 60)
            .map((d, i) => {
              const etap = etapy.find((e) => e.id === d.etap_id);
              const o = d.handlowiec ? osoba(d.handlowiec) : null;
              return (
                <li key={d.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="bsz-rozmowa">
                    <span className="min-w-0 flex-1">
                      <Link href={zJako(`/bruno/klienci/${d.id}`, jako)} className="flex items-center gap-2 font-semibold text-slate-900 truncate hover:underline underline-offset-2">{/* eslint-disable-next-line @next/next/no-img-element */}{zdjecieKlienta(d.osoba) && <img src={zdjecieKlienta(d.osoba)!} alt="" className="bsz-inicjal bsz-zdjecie" style={{ width: 26, height: 26 }} />}{d.tytul}</Link>
                      <span className="block text-[11px] text-slate-400 truncate">
                        {[d.osoba, d.organizacja].filter(Boolean).join(" · ")}
                        {szef && o ? ` · ${o.imie}` : ""}
                        {d.nastepna_aktywnosc ? ` · ${t("next", "następne")}: ${d.nastepna_aktywnosc}` : ""}
                      </span>
                    </span>
                    <span className="bsz-pigulka">{etap?.nazwa ?? d.etap_id}</span>
                    <span className="tabular-nums font-semibold text-slate-800 w-28 text-right">{kwota(d.wartosc)}</span>
                  </div>
                </li>
              );
            })}
          {deale.filter((d) => d.status === "open").length === 0 && <li className="p-6 text-slate-600 text-sm">{t("No open deals.", "Brak otwartych deali.")}</li>}
        </ul>
      </section>
    </div>
  );
}
