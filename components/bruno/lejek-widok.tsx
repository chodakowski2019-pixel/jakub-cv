import Link from "next/link";
import { Blad, Chip, Kafel, Miernik, NaglowekP, Pusto, Twarz } from "@/components/bruno/panel-ui";
import LejekWykres, { type EtapWykresu } from "@/components/bruno/lejek-wykres";
import { MapaUtknietych, Prognoza, PrzeplywDeali, type DealMapy, type EtapPrognozy } from "@/components/bruno/lejek-wizualizacje";

// 7.11 (USER_001 „GO”): PROGNOZA DO CELU. Szansa na etap (od 1. do 6.) i domyślny cel miesiąca; firma może nadpisać
// w `demo_dane.cel_miesiaca` i `demo_dane.szanse` (tablica %). Zmiana = 1 linia.
const SZANSE_ETAPOW = [10, 25, 40, 60, 80, 100];
const CEL_MIESIACA_DOMYSLNY = 650_000;
import type { Firma } from "@/lib/bruno/firmy";
import { tDla, type Jezyk } from "@/lib/bruno/i18n";
import { formatKwota, type AnalizaHandlowca, type Deal, type Etap, type EtapStat } from "@/lib/bruno/lejek";
import { zJako } from "@/lib/bruno/jako";
import { zdjecieKlienta } from "@/lib/bruno/twarze";

// 4.11 (USER_001): WIZUALIZACJA LEJKA z CRM. 6.11: nowy system zakładek (panel-2.css, klasy p-* / pl-*):
// kafelki (otwarte, w lejku, wygrane, przegrane, skuteczność), lejek SVG (lejek-wykres.tsx), alarm handlowca,
// mapa handlowiec × etap (sekwencja czerwieni = ile przegranych, ramka = najsłabszy etap), lista deali.

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
  const otwarte = zespol.reduce((s, x) => s + x.otwarte, 0);
  const wygrane = zespol.reduce((s, x) => s + x.wygrane, 0);
  const przegrane = zespol.reduce((s, x) => s + x.przegrane, 0);
  const wLejku = zespol.reduce((s, x) => s + x.wartosc, 0);
  const skutecznosc = wygrane + przegrane ? Math.round((100 * wygrane) / (wygrane + przegrane)) : null;
  const najslabszy = [...zespol].filter((s) => s.przegrane > 0).sort((a, b) => b.przegrane - a.przegrane || b.wartosc_przegrane - a.wartosc_przegrane)[0] ?? null;
  const moja = analizy.find((a) => a.email.toLowerCase() === ja) ?? null;
  const osoba = (email: string) => osoby.find((o) => o.email.toLowerCase() === email.toLowerCase());
  const tytul = szef ? t("Team funnel", "Lejek zespołu") : t("Your funnel", "Twój lejek");
  const akcent = imie ?? firma?.naglowek?.trim() ?? firma?.nazwa ?? "";

  const sytuacjaTreningu = (etap: Etap, d?: Deal | null) => {
    const kto = d ? `${d.tytul}${d.osoba ? `, ${d.osoba}` : ""}${d.organizacja ? ` (${d.organizacja})` : ""}, ${kwota(d.wartosc)}` : "";
    return jezyk === "pl"
      ? `Etap lejka: ${etap.nazwa}. ${kto ? `Deal: ${kto}. ` : ""}Na tym etapie tracę najwięcej deali. Zagraj klienta dokładnie w tym momencie procesu i naciskaj tam, gdzie zwykle odpadam.`
      : `Pipeline stage: ${etap.nazwa}. ${kto ? `Deal: ${kto}. ` : ""}This is where I lose the most deals. Play the customer at exactly this point of the process and push where I usually fall off.`;
  };
  const linkTreningu = (etap: Etap, d?: Deal | null) => `/bruno/rozmowa?sytuacja=${encodeURIComponent(sytuacjaTreningu(etap, d))}`;

  if (blad) {
    return (
      <div className="p-strona">
        <NaglowekP tytul={t("Pipeline", "Lejek")} akcent={akcent} />
        <Blad tytul={t("Couldn't read the CRM.", "Nie udało się odczytać CRM.")} tekst={blad} />
      </div>
    );
  }

  const wykres: EtapWykresu[] = zespol.map((s, i) => {
    const doszlo = zespol.slice(i).reduce((a, x) => a + x.otwarte + x.wygrane + x.przegrane, 0);
    const dalej = zespol.slice(i + 1).reduce((a, x) => a + x.otwarte + x.wygrane + x.przegrane, 0) + s.wygrane;
    return {
      id: s.etap.id,
      nr: i + 1,
      nazwa: s.etap.nazwa,
      otwarte: s.otwarte,
      wygrane: s.wygrane,
      przegrane: s.przegrane,
      doszlo,
      dalej,
      proc: i < zespol.length - 1 && doszlo ? Math.round((100 * dalej) / doszlo) : null,
      wartoscTekst: kwota(s.wartosc),
      strataTekst: s.wartosc_przegrane ? kwota(s.wartosc_przegrane) : null,
      naj: najslabszy?.etap.id === s.etap.id,
    };
  });
  const maxPrzegranych = Math.max(1, ...analizy.flatMap((a) => a.etapy.map((s) => s.przegrane)));
  const stopien = (n: number) => (n === 0 ? 0 : Math.max(1, Math.min(5, Math.ceil((5 * n) / maxPrzegranych))));
  const otwarteDeale = deale.filter((d) => d.status === "open").sort((a, b) => b.wartosc - a.wartosc);
  const maxDeal = Math.max(1, ...otwarteDeale.map((d) => d.wartosc));

  // 7.11: prognoza do celu + mapa utkniętych
  const dd = (firma?.demo_dane ?? null) as { cel_miesiaca?: number; szanse?: number[] } | null;
  const cel = typeof dd?.cel_miesiaca === "number" ? dd.cel_miesiaca : CEL_MIESIACA_DOMYSLNY;
  const szanse = Array.isArray(dd?.szanse) && dd.szanse.length === etapy.length ? dd.szanse : SZANSE_ETAPOW;
  const szansa = (idx: number) => szanse[Math.min(idx, szanse.length - 1)] ?? 0;
  const mcKlucz = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" }).slice(0, 7);
  const nazwaMiesiaca = new Date().toLocaleDateString(jezyk === "pl" ? "pl-PL" : "en-US", { month: "long", year: "numeric", timeZone: "Europe/Warsaw" });
  const wygraneMc = deale.filter((d) => d.status === "won" && (d.aktualizacja ?? "").startsWith(mcKlucz)).reduce((s, d) => s + d.wartosc, 0);
  const prognoza: EtapPrognozy[] = etapy.map((e, i) => {
    const w = otwarteDeale.filter((d) => d.etap_id === e.id);
    const wartosc = w.reduce((s, d) => s + d.wartosc, 0);
    const wazone = Math.round((wartosc * szansa(i)) / 100);
    return { nazwa: e.nazwa, otwarte: w.length, wartosc, wartoscTekst: kwota(wartosc), szansa: szansa(i), wazone, wazoneTekst: kwota(wazone) };
  });
  const wazoneRazem = prognoza.reduce((s, e) => s + e.wazone, 0);
  const dzisMs = Date.now();
  const utkniete: DealMapy[] = otwarteDeale.map((d) => {
    const ost = d.ostatni_kontakt ?? d.aktualizacja;
    const o = d.handlowiec ? osoba(d.handlowiec) : null;
    return { id: d.id, tytul: d.tytul, osoba: d.osoba, organizacja: d.organizacja, etapIdx: Math.max(0, etapy.findIndex((e) => e.id === d.etap_id)), wartosc: d.wartosc, wartoscTekst: kwota(d.wartosc), dni: ost ? Math.max(0, Math.floor((dzisMs - new Date(ost).getTime()) / 86_400_000)) : 0, handlowiec: szef ? o?.imie ?? null : null, href: zJako(`/bruno/klienci/${d.id}`, jako) };
  });

  return (
    <div className="p-strona">
      <NaglowekP
        tytul={t("Pipeline", "Lejek")}
        akcent={akcent}
        podtytul={`${pipeline?.nazwa ? `${pipeline.nazwa} · ` : ""}${pipeline && pipeline.id === 0 ? t("Default pipeline. Deals appear once a CRM is connected.", "Domyślny lejek. Deale pojawią się po podpięciu CRM.") : t("Live from Pipedrive.", "Na żywo z Pipedrive.")}`}
        prawo={
          <>
            <Chip k="ciemny">{otwarte} {t("open", "otwartych")}</Chip>
            <Chip k="ok">{wygrane} {t("won", "wygranych")}</Chip>
            <Chip k="zle">{przegrane} {t("lost", "przegranych")}</Chip>
          </>
        }
      />

      <div className="p-kafle">
        <Kafel wartosc={otwarte} etykieta={t("Open deals", "Otwarte deale")} dol={<span>{zespol.length} {t("stages", "etapów")}</span>} />
        <Kafel wartosc={kwota(wLejku)} etykieta={t("In the pipeline", "W lejku")} dol={<span>{t("open deals value", "wartość otwartych")}</span>} />
        <Kafel wartosc={wygrane} etykieta={t("Won", "Wygrane")} kropka="#17a05e" dol={<span>{t("all time", "łącznie")}</span>} />
        <Kafel wartosc={przegrane} etykieta={t("Lost", "Przegrane")} kropka="#e5484d" zle={przegrane > wygrane} dol={<span>{najslabszy ? `${t("most at", "najwięcej na")}: ${najslabszy.etap.nazwa}` : t("none", "brak")}</span>} />
        <Kafel wartosc={skutecznosc} po=" %" etykieta={t("Win rate", "Skuteczność")} zle={skutecznosc !== null && skutecznosc < 40} dol={<Miernik proc={skutecznosc} k={skutecznosc !== null && skutecznosc < 40 ? "zle" : "ok"} tekst=" " />} opoznienie={120} />
      </div>

      {/* 7.11: PROGNOZA DO CELU */}
      <section className="p-karta p-karta-p">
        <div className="p-karta-hd">
          <div>
            <h2>{t("Forecast to goal", "Prognoza do celu")}</h2>
            <p>{t("Won this month + open deals × chance of their stage. Goal and chances: 1 line in code or company settings.", "Wygrane w tym miesiącu + otwarte deale × szansa ich etapu. Cel i szanse: 1 linia w kodzie albo ustawienia firmy.")}</p>
          </div>
        </div>
        <Prognoza etapy={prognoza} wygraneMc={wygraneMc} cel={cel} miesiac={nazwaMiesiaca} teksty={{ wygrane: kwota(wygraneMc), wazone: kwota(wazoneRazem), spodziewane: kwota(wygraneMc + wazoneRazem), cel: kwota(cel), brak: kwota(Math.max(0, cel - wygraneMc - wazoneRazem)), nad: kwota(Math.max(0, wygraneMc + wazoneRazem - cel)) }} jezyk={jezyk} />
      </section>

      {/* 7.11: PRZEPŁYW DEALI (Sankey); na telefonie lista z lejek-wykres */}
      <section className="p-karta">
        <div className="p-karta-hd">
          <div>
            <h2>{szef ? t("Deal flow", "Przepływ deali") : t("Your deal flow", "Twój przepływ deali")}</h2>
            <p>{t("Column height = deals that reached the stage. Ribbons: moved on, open now, lost (red), won (green). Hover for numbers.", "Wysokość kolumny = ile deali doszło do etapu. Wstęgi: poszły dalej, otwarte teraz, przegrane (czerwone), wygrane (zielone). Najedź po liczby.")}</p>
          </div>
          <div className="p-legenda" aria-hidden>
            <span><i style={{ background: "#141416", opacity: 0.35 }} /> {t("moved on", "poszły dalej")}</span>
            <span><i style={{ background: "#a9abb5" }} /> {t("open now", "otwarte teraz")}</span>
            <span><i style={{ background: "#e5484d" }} /> {t("lost", "przegrane")}</span>
            <span><i style={{ background: "#17a05e" }} /> {t("won", "wygrane")}</span>
          </div>
        </div>
        <div className="p-karta-p" style={{ paddingTop: 10 }}>
          {/* 8.11: bez deali (domyślny lejek) pusty Sankey zajmował pół ekranu → komunikat. */}
          {zespol.length && deale.length ? (
            <>
              <PrzeplywDeali etapy={wykres} jezyk={jezyk} />
              <div className="pl-tylko-tel"><LejekWykres etapy={wykres} jezyk={jezyk} max={doszloMax} /></div>
            </>
          ) : (
            <Pusto tytul={zespol.length ? t("No deals yet", "Brak deali") : t("No stages", "Brak etapów")} opis={zespol.length ? t("The flow appears after the first deals.", "Przepływ pojawi się po pierwszych dealach.") : t("The pipeline in Pipedrive is empty.", "Lejek w Pipedrive jest pusty.")} />
          )}
        </div>
      </section>

      {/* 7.11: MAPA UTKNIĘTYCH DEALI */}
      <section className="p-karta">
        <div className="p-karta-hd">
          <div>
            <h2>{t("Where deals are stuck", "Gdzie utknęły deale")}</h2>
            <p>{t("Every open deal as a circle: the further right, the longer without contact. Red = rescue today. Click = client card.", "Każdy otwarty deal jako kółko: im dalej w prawo, tym dłużej bez kontaktu. Czerwone = ratować dziś. Klik = karta klienta.")}</p>
          </div>
          <span className="p-karta-hd-meta"><b className={utkniete.filter((d) => d.dni > 7).length ? "p-zle-t" : ""}>{utkniete.filter((d) => d.dni > 7).length}</b> {t("deals over 7 days", "deali ponad 7 dni")}</span>
        </div>
        <div className="p-karta-p" style={{ paddingTop: 10 }}>
          {utkniete.length ? <MapaUtknietych deale={utkniete} etapy={etapy.map((e) => e.nazwa)} jezyk={jezyk} /> : <Pusto tytul={t("No open deals", "Brak otwartych deali")} />}
        </div>
      </section>

      {/* Handlowiec: gdzie tracę + trening */}
      {!szef && moja && (
        <section className="p-karta p-karta-ciemna p-karta-p pl-alarm">
          {moja.najslabszy ? (
            <>
              <div>
                <div className="pl-alarm-et" style={{ color: "rgba(255,255,255,0.55)" }}>{t("Where you lose deals", "Gdzie tracisz deale")}</div>
                <h2>{moja.najslabszy.nazwa}</h2>
                <p style={{ color: "rgba(255,255,255,0.7)" }}>{t(`${moja.przegrane} lost deals total, most at this stage. Win rate ${moja.skutecznosc ?? 0}%.`, `${moja.przegrane} przegranych deali, najwięcej na tym etapie. Skuteczność ${moja.skutecznosc ?? 0} %.`)}</p>
              </div>
              <Link href={linkTreningu(moja.najslabszy, otwarteDeale.find((d) => d.etap_id === moja.najslabszy!.id) ?? null)} className="p-btn">
                {t("Train this stage with Bruno", "Trenuj ten etap z Bruno")} →
              </Link>
            </>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.7)" }}>{t("No lost deals yet. Bruno will pick a stage as soon as you lose one.", "Brak przegranych deali. Bruno wybierze etap, gdy jakiś przegrasz.")}</p>
          )}
        </section>
      )}

      {/* Szef: handlowiec × etap */}
      {szef && (
        <section className="p-karta">
          <div className="p-karta-hd">
            <div>
              <h2>{t("Who loses where", "Kto gdzie traci")}</h2>
              <p>{t("Lost deals per stage. Darker = more. Ring = this rep's weakest stage.", "Przegrane deale na etapie. Ciemniej = więcej. Obwódka = najsłabszy etap handlowca.")}</p>
            </div>
            <span className="pl-skala" aria-hidden>
              0 <i style={{ background: "var(--p-r1)" }} /><i style={{ background: "var(--p-r2)" }} /><i style={{ background: "var(--p-r3)" }} /><i style={{ background: "var(--p-r4)" }} /><i style={{ background: "var(--p-r5)" }} /> {maxPrzegranych}
            </span>
          </div>
          <div className="p-tabela-wrap" style={{ marginTop: 12 }}>
            <table className="p-tabela">
              <thead>
                <tr>
                  <th>{t("Rep", "Handlowiec")}</th>
                  {etapy.map((e, i) => (
                    <th key={e.id} className="p-srodek" title={e.nazwa}>{i + 1}. {e.nazwa.length > 14 ? `${e.nazwa.slice(0, 13)}…` : e.nazwa}</th>
                  ))}
                  <th>{t("Win rate", "Skuteczność")}</th>
                  <th>{t("Bruno trains", "Bruno trenuje")}</th>
                </tr>
              </thead>
              <tbody>
                {analizy
                  .slice()
                  .sort((a, b) => b.przegrane - a.przegrane)
                  .map((a, i) => {
                    const o = osoba(a.email);
                    return (
                      <tr key={a.email} style={{ animationDelay: `${i * 40}ms` }}>
                        <td>
                          <Link href={`/bruno/szef/${encodeURIComponent(a.email)}`} className="p-osoba">
                            <Twarz src={o?.zdjecie} imie={o?.imie ?? a.email} rozmiar={32} />
                            <span className="min-w-0">
                              <b>{o?.imie ?? a.email}</b>
                              <small>{a.otwarte} {t("open", "otw.")} · {kwota(a.wartosc_otwarte)}</small>
                            </span>
                          </Link>
                        </td>
                        {a.etapy.map((s) => (
                          <td key={s.etap.id} className="p-srodek">
                            <span className={`pl-mapa-kratka ${a.najslabszy?.id === s.etap.id ? "pl-mapa-naj" : ""}`} data-s={stopien(s.przegrane)} title={`${o?.imie ?? a.email} · ${s.etap.nazwa}: ${s.przegrane} ${t("lost", "przegr.")}, ${s.otwarte} ${t("open", "otw.")}`}>
                              {s.przegrane || "·"}
                              {s.otwarte > 0 && <small>{s.otwarte} {t("open", "otw.")}</small>}
                            </span>
                          </td>
                        ))}
                        <td><Miernik proc={a.skutecznosc} k={a.skutecznosc !== null && a.skutecznosc < 40 ? "zle" : ""} /></td>
                        <td>{a.najslabszy ? <Link href={linkTreningu(a.najslabszy)}><Chip k="lim">{a.najslabszy.nazwa}</Chip></Link> : <span className="p-cichy">–</span>}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {bezHandlowca > 0 && <p className="p-pusto" style={{ padding: "10px 22px 14px", textAlign: "left", fontSize: 12 }}>{t(`${bezHandlowca} deals without a rep assigned (field „Handlowiec Bruno” empty).`, `${bezHandlowca} deali bez przypisanego handlowca (puste pole „Handlowiec Bruno”).`)}</p>}
          {analizy.length === 0 && <Pusto tytul={t("No reps yet", "Brak handlowców")} opis={t("No reps in this company yet.", "W tej firmie nie ma jeszcze handlowców.")} />}
        </section>
      )}

      {/* Lista deali */}
      <section className="p-karta">
        <div className="p-karta-hd" style={{ paddingBottom: 10 }}>
          <div>
            <h2>{szef ? t("Open deals", "Otwarte deale") : t("Your open deals", "Twoje otwarte deale")}</h2>
            <p>{otwarteDeale.length} · {kwota(otwarteDeale.reduce((s, d) => s + d.wartosc, 0))}</p>
          </div>
          <Link href={zJako("/bruno/kokpit", jako)} className="p-btn p-btn-2 p-btn-s">{t("Update in chat", "Zaktualizuj w czacie")} →</Link>
        </div>
        <ul className="pl-deale">
          {otwarteDeale.slice(0, 60).map((d, i) => {
            const etap = etapy.find((e) => e.id === d.etap_id);
            const idx = etapy.findIndex((e) => e.id === d.etap_id);
            const o = d.handlowiec ? osoba(d.handlowiec) : null;
            return (
              <li key={d.id} className="pl-deal" style={{ animationDelay: `${i * 25}ms` }}>
                <span className="p-osoba">
                  <Twarz src={zdjecieKlienta(d.osoba)} imie={d.osoba ?? d.tytul} rozmiar={32} />
                  <span className="min-w-0">
                    <Link href={zJako(`/bruno/klienci/${d.id}`, jako)}><b>{d.tytul}</b></Link>
                    <small>
                      {[d.osoba, d.organizacja].filter(Boolean).join(" · ")}
                      {szef && o ? ` · ${o.imie}` : ""}
                      {d.nastepna_aktywnosc ? ` · ${t("next", "następne")}: ${d.nastepna_aktywnosc}` : ""}
                    </small>
                  </span>
                </span>
                <Chip>{etap?.nazwa ?? d.etap_id}</Chip>
                <span className="pk-etapy-kropki" aria-hidden>
                  {etapy.map((e, k) => <i key={e.id} className={k < idx ? "on" : k === idx ? "teraz" : ""} />)}
                </span>
                <span className="pl-deal-kwota">
                  {kwota(d.wartosc)}
                  <span className="p-miernik-tor" style={{ display: "block", width: 72, height: 4, marginTop: 5, marginLeft: "auto" }}><i style={{ width: `${(100 * d.wartosc) / maxDeal}%` }} /></span>
                </span>
              </li>
            );
          })}
          {otwarteDeale.length === 0 && <li><Pusto tytul={t("No open deals", "Brak otwartych deali")} /></li>}
        </ul>
      </section>
    </div>
  );
}
