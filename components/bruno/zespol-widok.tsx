import Link from "next/link";
import Licz from "@/components/podglad/panel/licz";
import { etykiety } from "@/lib/bruno/etykiety";
import { locale, tDla, type Jezyk } from "@/lib/bruno/i18n";
import type { Firma } from "@/lib/bruno/firmy";
import { DNI_BEZ_TRENINGU_ALARM, KRYTERIA, type PunktDnia, type StatHandlowca, type StatZespolu } from "@/lib/bruno/zespol";
import { MapaKryteriow, MiniWykres, TrendZespolu } from "@/components/bruno/zespol-wykresy";

// 25.10 (USER_001): PANEL SZEFA, ekran nr 1 demo. Logo firmy + „Zespół [Firma]”, 4 kafelki z liczbami,
// które dobiegają (Licz), tabela handlowców: średnia, trend,
// ostatnia, „nie ćwiczy od X dni”. Klik w wiersz = profil handlowca. Styl: czarno-złote szkło, klasy bsz-*.

export function Kafelek({ liczba, dec = 0, po = "", opis, uwaga, opoznienie = 0 }: { liczba: number | null; dec?: number; po?: string; opis: string; uwaga?: string; opoznienie?: number }) {
  return (
    <div className="bruno-szklo rounded-2xl p-4 sm:p-5 bsz-kafelek">
      <div className="bruno-h2 text-[1.9rem] leading-none bruno-gradient-tekst tabular-nums">{liczba === null ? "–" : <Licz do={liczba} dec={dec} po={po} opoznienie={opoznienie} />}</div>
      <div className="text-sm font-semibold text-slate-800 mt-2 leading-tight">{opis}</div>
      {uwaga && <div className="text-[11px] text-slate-400 mt-0.5">{uwaga}</div>}
    </div>
  );
}

export function Trend({ v, jezyk }: { v: number | null; jezyk: Jezyk }) {
  if (v === null) return <span className="text-slate-400 text-xs">–</span>;
  const kierunek = v > 0.2 ? "gora" : v < -0.2 ? "dol" : "zero";
  return (
    <span className="bruno-zmiana tabular-nums" data-kierunek={kierunek}>
      {v > 0 ? "+" : ""}
      {v.toLocaleString(locale(jezyk), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
    </span>
  );
}

export function OcenaKolko({ ocena, rozmiar = 44 }: { ocena: number | null; rozmiar?: number }) {
  const r = 17;
  const obwod = 2 * Math.PI * r;
  const udzial = ocena ? Math.min(1, Math.max(0, ocena / 10)) : 0;
  return (
    <svg viewBox="0 0 44 44" width={rozmiar} height={rozmiar} role="img" aria-label={ocena ? `${ocena}/10` : "–"} className="shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(212,175,90,0.14)" strokeWidth="4" />
      {ocena ? <circle cx="22" cy="22" r={r} fill="none" stroke="#d4af5a" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${obwod * udzial} ${obwod}`} transform="rotate(-90 22 22)" className="bruno-pierscien-wypelnienie" /> : null}
      <text x="22" y="26" textAnchor="middle" className={ocena ? "fill-slate-900" : "fill-slate-400"} style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-outfit), var(--font-poppins)" }}>
        {ocena === null ? "–" : ocena.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}
      </text>
    </svg>
  );
}

export function Naglowek({ firma, tytul, akcent, podtytul, zdjecie }: { firma: Firma | null; tytul: string; akcent: string; podtytul?: string; /** 25.10: twarz zamiast logo (profil handlowca). */ zdjecie?: string | null }) {
  const obraz = zdjecie ?? firma?.logo_url ?? null;
  // Zdjęcie (plik .jpg w public/bruno/demo albo twarz handlowca) wypełnia kółko; logo firmy zostaje na białym z marginesem.
  const twarz = Boolean(zdjecie) || Boolean(obraz?.startsWith("/bruno/demo/"));
  return (
    <div className="flex items-center gap-4">
      {obraz ? (
        <span className={`bsz-logo bruno-szklo ${twarz ? "bsz-twarz" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={obraz} alt={zdjecie ? tytul : (firma?.nazwa ?? "")} />
        </span>
      ) : null}
      <div className="min-w-0">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem] leading-tight">
          {tytul} <span className="bruno-gradient-tekst">{akcent}</span>
        </h1>
        {podtytul && <p className="text-slate-500 text-sm mt-1">{podtytul}</p>}
      </div>
    </div>
  );
}

export default function ZespolWidok({ firma, stat, zespol, jezyk, seria, oceny }: { firma: Firma | null; stat: StatHandlowca[]; zespol: StatZespolu; jezyk: Jezyk; seria: PunktDnia[]; oceny: Record<string, number[]> }) {
  const t = tDla(jezyk);
  const { NAZWY } = etykiety(jezyk);
  const dniTemu = (d: number | null) => (d === null ? t("never", "nigdy") : d === 0 ? t("today", "dziś") : d === 1 ? t("yesterday", "wczoraj") : t(`${d} days ago`, `${d} dni temu`));
  const posortowani = [...stat].sort((a, b) => (b.srednia ?? 0) - (a.srednia ?? 0));

  return (
    <div className="flex flex-col gap-6 bsz">
      <Naglowek firma={firma} tytul={t("Team", "Zespół")} akcent={firma?.naglowek?.trim() || firma?.nazwa || "Bruno"} />

      {/* 25.10 (USER_001): wszystkie kafelki z liczbami usunięte; średnia zespołu jest na wykresie poniżej. */}

      {/* 25.10 (USER_001: „lepsza wizualizacja”): trend zespołu, mapa kryteriów (zespol-wykresy.tsx). Moduł „Trening w ostatnich 14 dniach” usunięty. */}
      <TrendZespolu seria={seria} jezyk={jezyk} />

      <div className="flex flex-col gap-4">
        <MapaKryteriow
          wiersze={posortowani.map((s) => ({ email: s.email, imie: s.imie, zdjecie: s.zdjecie, kryteria: s.kryteria, najslabsze: s.najslabsze, href: `/bruno/szef/${encodeURIComponent(s.email)}` }))}
          zespol={zespol.kryteria}
          nazwy={NAZWY}
          kolejnosc={KRYTERIA}
          jezyk={jezyk}
        />
      </div>

      <section className="bruno-szklo rounded-2xl overflow-hidden">
        <div className="bsz-tabela" role="table" aria-label={t("Team", "Zespół")}>
          {/* 25.10 (USER_001): kolumny „7 dni” i „Najsłabsze” usunięte. */}
          <div className="bsz-wiersz bsz-naglowek" role="row">
            <span role="columnheader">{t("Rep", "Handlowiec")}</span>
            <span role="columnheader">{t("Average", "Średnia")}</span>
            <span role="columnheader">{t("Trend", "Trend")}</span>
            <span role="columnheader">{t("Last call", "Ostatnia")}</span>
          </div>
          {posortowani.map((s, i) => {
            const alarm = s.dniBezTreningu === null || s.dniBezTreningu >= DNI_BEZ_TRENINGU_ALARM;
            return (
              <Link key={s.email} href={`/bruno/szef/${encodeURIComponent(s.email)}`} className="bsz-wiersz" role="row" style={{ animationDelay: `${80 + i * 60}ms` }}>
                <span role="cell" className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.zdjecie ? <img src={s.zdjecie} alt="" className="bsz-inicjal bsz-zdjecie" /> : <span className="bsz-inicjal">{s.imie[0]?.toUpperCase()}</span>}
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900 truncate">{s.imie}</span>
                    {/* 25.10 (USER_001): pod imieniem rola zamiast poprawki z ostatniej rozmowy. */}
                    <span className="block text-[11px] text-slate-400 truncate">{t("Sales rep", "Handlowiec")}</span>
                  </span>
                </span>
                <span role="cell"><OcenaKolko ocena={s.srednia} /></span>
                <span role="cell" className="flex items-center gap-2"><MiniWykres oceny={oceny[s.email] ?? []} /><Trend v={s.trend} jezyk={jezyk} /></span>
                <span role="cell" className={alarm ? "text-rose-800 font-medium" : "text-slate-600"}>
                  {alarm && s.dniBezTreningu !== null ? t(`Not practicing for ${s.dniBezTreningu} days`, `Nie ćwiczy od ${s.dniBezTreningu} dni`) : dniTemu(s.dniBezTreningu)}
                </span>
              </Link>
            );
          })}
          {stat.length === 0 && <p className="p-6 text-slate-600 text-sm">{t("No reps in this company yet.", "W tej firmie nie ma jeszcze handlowców.")}</p>}
        </div>
      </section>
    </div>
  );
}
