"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 11.10 (USER_001, E32): zakładka „Kalendarz”. Miesiąc z rozmowami (liczba, średnia ocena) i fiszkami
// w każdym dniu, dzisiaj, i do kiedy trwa dostęp (koniec testu albo opłaconego Bruno Pro).
// 28.10 (USER_001: „czytelniej”): nowy układ w stylu Rinesk (CSS .bk-* w motyw-rinesk.css): nagłówek z lewej,
// miesiąc i strzałki z prawej, 3 kafelki z liczbami, kratki z pastylkami „2 rozmowy · 8,0” i „11 fiszek”
// zamiast emoji, dziś = czarne kółko z numerem, dni z dostępem = delikatna limonka, koniec dostępu = ramka.

export type DzienKalendarza = { rozmowy: number; srednia: number | null; fiszki: number; rozmowaId: string | null };

const klucz = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type RozmowaKal = { id: string; start: string; ocena: number | null; zakonczona: boolean };

export default function Kalendarz({ rozmowy, fiszki, koniecDostepu, opisKonca }: { rozmowy: RozmowaKal[]; fiszki: string[]; koniecDostepu: string | null; opisKonca: string | null }) {
  const { t, locale, jezyk, mnoga } = useT();
  // Dni liczone w strefie czasowej przeglądarki (handlowiec w UK, USA albo w Polsce widzi swoje dni).
  const dni = useMemo(() => {
    const m: Record<string, DzienKalendarza & { suma: number; ocen: number }> = {};
    const dzien = (iso: string) => {
      const k = klucz(new Date(iso));
      return (m[k] ??= { rozmowy: 0, srednia: null, fiszki: 0, rozmowaId: null, suma: 0, ocen: 0 });
    };
    for (const r of rozmowy) {
      if (!r.zakonczona) continue;
      const d = dzien(r.start);
      d.rozmowy++;
      d.rozmowaId ??= r.id;
      if (r.ocena !== null) {
        d.suma += r.ocena;
        d.ocen++;
        d.srednia = Math.round((d.suma / d.ocen) * 10) / 10;
      }
    }
    for (const f of fiszki) dzien(f).fiszki++;
    return m as Record<string, DzienKalendarza>;
  }, [rozmowy, fiszki]);
  const dzis = new Date();
  const kluczDzis = klucz(dzis);
  const [miesiac, setMiesiac] = useState(new Date(dzis.getFullYear(), dzis.getMonth(), 1));
  const koniec = koniecDostepu ? new Date(koniecDostepu) : null;
  const kluczKonca = koniec ? klucz(koniec) : null;
  const dniZostalo = koniec ? Math.max(0, Math.ceil((koniec.getTime() - dzis.getTime()) / 86_400_000)) : null;

  const komorki = useMemo(() => {
    const pierwszy = new Date(miesiac.getFullYear(), miesiac.getMonth(), 1);
    // Tydzień od poniedziałku (PL i UK); USA też czyta to bez problemu.
    const przesuniecie = (pierwszy.getDay() + 6) % 7;
    const start = new Date(pierwszy);
    start.setDate(1 - przesuniecie);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [miesiac]);

  const nazwyDni = jezyk === "pl" ? ["pn", "wt", "śr", "cz", "pt", "sb", "nd"] : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const tytul = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(miesiac);
  const dataKonca = koniec ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(koniec) : null;
  const wMiesiacu = Object.entries(dni).filter(([k]) => k.startsWith(klucz(miesiac).slice(0, 7)));
  const rozmowWMiesiacu = wMiesiacu.reduce((a, [, v]) => a + v.rozmowy, 0);
  const fiszekWMiesiacu = wMiesiacu.reduce((a, [, v]) => a + v.fiszki, 0);
  const dniAktywnych = wMiesiacu.filter(([, v]) => v.rozmowy + v.fiszki > 0).length;
  const ocenyMiesiaca = wMiesiacu.flatMap(([, v]) => (v.srednia !== null ? [v.srednia] : []));
  const sredniaMiesiaca = ocenyMiesiaca.length ? Math.round((ocenyMiesiaca.reduce((a, b) => a + b, 0) / ocenyMiesiaca.length) * 10) / 10 : null;
  const liczba = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const toMiesiacDzis = miesiac.getFullYear() === dzis.getFullYear() && miesiac.getMonth() === dzis.getMonth();

  return (
    <div className="flex flex-col gap-5 bk">
      <div className="bk-naglowek">
        <div>
          <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]"><span className="bruno-gradient-tekst">{t("Calendar", "Kalendarz")}</span></h1>
          {koniec && opisKonca && (
            <p className="bk-dostep">
              {opisKonca} <b>{dataKonca}</b>
              {dniZostalo !== null && <span> · {dniZostalo === 1 ? t("1 day left", "został 1 dzień") : t(`${dniZostalo} days left`, `${dniZostalo} ${dniZostalo >= 2 && dniZostalo <= 4 ? "dni zostały" : "dni zostało"}`)}</span>}
            </p>
          )}
        </div>
        <div className="bk-nav">
          <button type="button" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() - 1, 1))} aria-label={t("Previous month", "Poprzedni miesiąc")}>‹</button>
          <b className="capitalize">{tytul}</b>
          <button type="button" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() + 1, 1))} aria-label={t("Next month", "Następny miesiąc")}>›</button>
          {!toMiesiacDzis && <button type="button" className="bk-dzis" onClick={() => setMiesiac(new Date(dzis.getFullYear(), dzis.getMonth(), 1))}>{t("Today", "Dziś")}</button>}
        </div>
      </div>

      <div className="bk-kafelki">
        <div className="bk-kafelek"><b>{rozmowWMiesiacu}</b><span>{mnoga(rozmowWMiesiacu, ["call", "calls"], ["rozmowa", "rozmowy", "rozmów"])}</span><small>{t("this month", "w tym miesiącu")}</small></div>
        <div className="bk-kafelek"><b>{sredniaMiesiaca === null ? "–" : liczba(sredniaMiesiaca)}</b><span>{t("average score", "średnia ocena")}</span><small>{t("out of 10", "na 10")}</small></div>
        <div className="bk-kafelek"><b>{fiszekWMiesiacu}</b><span>{mnoga(fiszekWMiesiacu, ["flashcard", "flashcards"], ["fiszka", "fiszki", "fiszek"])}</span><small>{t("answered", "odpowiedzianych")}</small></div>
        <div className="bk-kafelek"><b>{dniAktywnych}</b><span>{t("active days", "dni z treningiem")}</span><small>{t("calls or flashcards", "rozmowy albo fiszki")}</small></div>
      </div>

      <section className="bk-siatka-karta">
        <div className="bk-siatka" role="grid">
          {nazwyDni.map((d) => <div key={d} className="bk-dzien-nazwa">{d}</div>)}
          {komorki.map((d) => {
            const k = klucz(d);
            const dane = dni[k];
            const inny = d.getMonth() !== miesiac.getMonth();
            const toDzis = k === kluczDzis;
            const toKoniec = k === kluczKonca;
            // Dni z dostępem: od dziś do dnia końca włącznie. Po końcu: przygaszone.
            const zDostepem = !!kluczKonca && k >= kluczDzis && k <= kluczKonca;
            const poKoncu = !!kluczKonca && k > kluczKonca;
            const maDane = !!dane && dane.rozmowy + dane.fiszki > 0;
            const klasa = ["bk-kratka", inny ? "bk-inny" : "", toDzis ? "bk-dzis-kratka" : "", toKoniec ? "bk-koniec" : "", zDostepem ? "bk-z-dostepem" : "", poKoncu ? "bk-po" : "", maDane ? "bk-ma" : ""].filter(Boolean).join(" ");
            const tresc = (
              <>
                <span className="bk-numer">{d.getDate()}</span>
                {dane?.rozmowy ? (
                  <span className="bk-pig bk-pig-rozmowy" title={t("calls · average score", "rozmowy · średnia ocena")}>
                    {dane.rozmowy} {mnoga(dane.rozmowy, ["call", "calls"], ["rozmowa", "rozmowy", "rozmów"])}{dane.srednia !== null ? ` · ${liczba(dane.srednia)}` : ""}
                  </span>
                ) : null}
                {dane?.fiszki ? <span className="bk-pig bk-pig-fiszki">{dane.fiszki} {mnoga(dane.fiszki, ["flashcard", "flashcards"], ["fiszka", "fiszki", "fiszek"])}</span> : null}
                {toKoniec ? <span className="bk-pig bk-pig-koniec">{t("access ends", "koniec dostępu")}</span> : null}
              </>
            );
            return dane?.rozmowaId ? (
              <Link key={k} href={`/bruno/feedback/${dane.rozmowaId}`} className={klasa} role="gridcell" title={t("Open feedback", "Otwórz feedback")}>{tresc}</Link>
            ) : (
              <div key={k} className={klasa} role="gridcell">{tresc}</div>
            );
          })}
        </div>
        <div className="bk-legenda">
          <span><i className="bk-pig bk-pig-rozmowy" /> {t("calls · average score", "rozmowy · średnia ocena")}</span>
          <span><i className="bk-pig bk-pig-fiszki" /> {t("flashcards", "fiszki")}</span>
          {koniec && <span><i className="bk-leg-dostep" /> {t("days with access", "dni z dostępem")}</span>}
          <span className="bk-leg-info">{t("Click a day with a call to open its feedback.", "Kliknij dzień z rozmową, żeby otworzyć feedback.")}</span>
        </div>
      </section>
    </div>
  );
}
