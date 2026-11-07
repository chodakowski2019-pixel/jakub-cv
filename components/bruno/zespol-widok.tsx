import Link from "next/link";
import Licz from "@/components/podglad/panel/licz";
import { Chip, Delta, Kafel, NaglowekP, Pierscien, Pusto, Twarz } from "@/components/bruno/panel-ui";
import { etykiety } from "@/lib/bruno/etykiety";
import { locale, tDla, type Jezyk } from "@/lib/bruno/i18n";
import type { Firma } from "@/lib/bruno/firmy";
import { DNI_BEZ_TRENINGU_ALARM, KRYTERIA, type PunktDnia, type StatHandlowca, type StatZespolu } from "@/lib/bruno/zespol";
import { MapaKryteriow, MiniWykres, TrendZespolu } from "@/components/bruno/zespol-wykresy";

// 25.10 (USER_001): PANEL SZEFA, ekran nr 1 demo. 6.11: nowy system zakładek (panel-2.css): nagłówek p-naglowek,
// 4 kafelki (handlowców, rozmów 7 dni, średnia, nie ćwiczy), trend zespołu (zespol-wykresy), tabela p-tabela
// (pierścień oceny, mini-wykres + delta, ostatnia rozmowa z alarmem), mapa kryteriów. Klik w wiersz = profil handlowca.
// Kafelek / Trend / OcenaKolko / Naglowek zostają eksportowane (profil handlowca i /tydzien), w nowym stylu.

export function Kafelek({ liczba, dec = 0, po = "", opis, uwaga, opoznienie = 0 }: { liczba: number | null; dec?: number; po?: string; opis: string; uwaga?: string; opoznienie?: number }) {
  return (
    <div className="p-kafel">
      <div className="p-kafel-et"><span>{opis}</span></div>
      <div className="p-kafel-wart">{liczba === null ? "–" : <Licz do={liczba} dec={dec} po={po} opoznienie={opoznienie} />}</div>
      {uwaga && <div className="p-kafel-dol">{uwaga}</div>}
    </div>
  );
}

export function Trend({ v, jezyk }: { v: number | null; jezyk: Jezyk }) {
  return <Delta v={v} locale={locale(jezyk)} />;
}

export function OcenaKolko({ ocena, rozmiar = 44 }: { ocena: number | null; rozmiar?: number }) {
  return <Pierscien v={ocena} prog={5} rozmiar={rozmiar} />;
}

export function Naglowek({ firma, tytul, akcent, podtytul, zdjecie }: { firma: Firma | null; tytul: string; akcent: string; podtytul?: string; /** 25.10: twarz zamiast logo (profil handlowca). */ zdjecie?: string | null }) {
  // 6.11: logo firmy w nagłówku zakładki nie jest już pokazywane (jest w pasku), twarz handlowca tak.
  void firma;
  return <NaglowekP tytul={tytul} akcent={akcent} podtytul={podtytul} obraz={zdjecie} imie={zdjecie ? tytul : undefined} />;
}

export default function ZespolWidok({ firma, stat, zespol, jezyk, seria, oceny }: { firma: Firma | null; stat: StatHandlowca[]; zespol: StatZespolu; jezyk: Jezyk; seria: PunktDnia[]; oceny: Record<string, number[]> }) {
  const t = tDla(jezyk);
  const { NAZWY } = etykiety(jezyk);
  const dniTemu = (d: number | null) => (d === null ? t("never", "nigdy") : d === 0 ? t("today", "dziś") : d === 1 ? t("yesterday", "wczoraj") : t(`${d} days ago`, `${d} dni temu`));
  const posortowani = [...stat].sort((a, b) => (b.srednia ?? 0) - (a.srednia ?? 0));
  const rozmow30 = stat.reduce((s, x) => s + x.rozmow30, 0);

  return (
    <div className="p-strona">
      <NaglowekP
        tytul={t("Team", "Zespół")}
        akcent={firma?.naglowek?.trim() || firma?.nazwa || "Bruno"}
        podtytul={t("Trainings with Bruno: scores, trend, who needs coaching. Last 30 days.", "Treningi z Bruno: oceny, trend, kto potrzebuje treningu. Ostatnie 30 dni.")}
        prawo={zespol.nieCwicza > 0 ? <Chip k="zle">{zespol.nieCwicza} {t("not practicing", "nie ćwiczy")}</Chip> : <Chip k="ok">{t("Everyone practicing", "Wszyscy ćwiczą")}</Chip>}
      />

      <div className="p-kafle">
        <Kafel wartosc={zespol.handlowcow} etykieta={t("Reps", "Handlowców")} dol={<span>{t("in the team", "w zespole")}</span>} />
        <Kafel wartosc={zespol.rozmow7} etykieta={t("Calls, 7 days", "Rozmów, 7 dni")} dol={<span>{rozmow30} {t("in 30 days", "w 30 dni")}</span>} />
        <Kafel wartosc={zespol.srednia} dec={1} etykieta={t("Team average", "Średnia zespołu")} dol={<span>{t("scale 1-10", "skala 1-10")}{zespol.najslabsze ? ` · ${t("weakest", "najsłabsze")}: ${NAZWY[zespol.najslabsze]}` : ""}</span>} opoznienie={80} />
        <Kafel wartosc={zespol.nieCwicza} etykieta={t("Not practicing", "Nie ćwiczy")} zle={zespol.nieCwicza > 0} kropka={zespol.nieCwicza > 0 ? "#e5484d" : "#17a05e"} dol={<span>{t(`${DNI_BEZ_TRENINGU_ALARM}+ days without a call`, `${DNI_BEZ_TRENINGU_ALARM}+ dni bez rozmowy`)}</span>} opoznienie={160} />
      </div>

      {/* 25.10 (USER_001: „lepsza wizualizacja”): trend zespołu (zespol-wykresy.tsx). */}
      <TrendZespolu seria={seria} jezyk={jezyk} />

      {/* 28.10 (USER_001): tabela zespołu NAD „Kto w czym potrzebuje treningu”. */}
      <section className="p-karta">
        <div className="p-karta-hd">
          <div>
            <h2>{t("Every rep", "Każdy handlowiec")}</h2>
            <p>{t("Sorted by average score. Click a row to open the profile.", "Od najwyższej średniej. Kliknij wiersz, żeby otworzyć profil.")}</p>
          </div>
        </div>
        <div className="p-tabela-wrap" style={{ marginTop: 12 }}>
          <table className="p-tabela">
            <thead>
              <tr>
                <th>{t("Rep", "Handlowiec")}</th>
                <th>{t("Average", "Średnia")}</th>
                <th>{t("Trend", "Trend")}</th>
                <th className="p-num">{t("Calls 30 d", "Rozmów 30 dni")}</th>
                <th>{t("Weakest", "Najsłabsze")}</th>
                <th>{t("Last call", "Ostatnia rozmowa")}</th>
              </tr>
            </thead>
            <tbody>
              {posortowani.map((s, i) => {
                const alarm = s.dniBezTreningu === null || s.dniBezTreningu >= DNI_BEZ_TRENINGU_ALARM;
                return (
                  <tr key={s.email} style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <Link href={`/bruno/szef/${encodeURIComponent(s.email)}`} className="p-osoba">
                        <Twarz src={s.zdjecie} imie={s.imie} rozmiar={36} />
                        <span className="min-w-0">
                          <b>{s.imie}</b>
                          <small>{t("Sales rep", "Handlowiec")}{s.najlepsza !== null ? ` · ${t("best", "najlepsza")} ${s.najlepsza}` : ""}</small>
                        </span>
                      </Link>
                    </td>
                    <td><Pierscien v={s.srednia} prog={5} rozmiar={40} /></td>
                    <td>
                      <span className="pz-trend">
                        <MiniWykres oceny={oceny[s.email] ?? []} />
                        <Delta v={s.trend} locale={locale(jezyk)} />
                      </span>
                    </td>
                    <td className="p-num">{s.rozmow30}</td>
                    <td>{s.najslabsze ? <Chip k="uwaga">{NAZWY[s.najslabsze]}</Chip> : <span className="p-cichy">–</span>}</td>
                    <td className={`pz-ostatnia ${alarm ? "alarm" : ""}`}>
                      {alarm && s.dniBezTreningu !== null ? t(`Not practicing for ${s.dniBezTreningu} days`, `Nie ćwiczy od ${s.dniBezTreningu} dni`) : dniTemu(s.dniBezTreningu)}
                    </td>
                  </tr>
                );
              })}
              {stat.length === 0 && (
                <tr>
                  <td colSpan={6}><Pusto tytul={t("No reps yet", "Brak handlowców")} opis={t("No reps in this company yet.", "W tej firmie nie ma jeszcze handlowców.")} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <MapaKryteriow
        wiersze={posortowani.map((s) => ({ email: s.email, imie: s.imie, zdjecie: s.zdjecie, kryteria: s.kryteria, najslabsze: s.najslabsze, href: `/bruno/szef/${encodeURIComponent(s.email)}` }))}
        zespol={zespol.kryteria}
        nazwy={NAZWY}
        kolejnosc={KRYTERIA}
        jezyk={jezyk}
      />
    </div>
  );
}
