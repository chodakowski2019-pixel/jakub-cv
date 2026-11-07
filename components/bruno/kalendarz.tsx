"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 11.10 (USER_001, E32): zakładka „Kalendarz”. Miesiąc z rozmowami (liczba, średnia ocena) i fiszkami
// w każdym dniu, dzisiaj, i do kiedy trwa dostęp (koniec testu albo opłaconego Bruno Pro).
// 6.11 (USER_001: „każda zakładka nowoczesna”): nowy system zakładek (panel-2.css, p-* / pc-*):
// nagłówek + nawigacja miesiąca z prawej, 4 kafelki, kratki jak mapa aktywności (sekwencja jednego odcienia:
// im więcej rozmów w dniu, tym ciemniej; liczba zawsze w pastylce, kolor nie jest jedynym nośnikiem),
// dziś = czarne kółko, dni z dostępem = limonka, koniec dostępu = czarna ramka. Klik w dzień z rozmową = feedback.

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
  const najlepszyDzien = wMiesiacu.filter(([, v]) => v.srednia !== null).sort((a, b) => (b[1].srednia as number) - (a[1].srednia as number))[0] ?? null;
  const dzienKrotki = (k: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${k}T12:00:00`));

  return (
    <div className="p-strona">
      <header className="p-naglowek">
        <div className="p-naglowek-lewo">
          <div className="min-w-0">
            <h1>{t("Calendar", "Kalendarz")}</h1>
            {koniec && opisKonca ? (
              <p>
                {opisKonca} <b style={{ color: "var(--p-ink)", fontWeight: 500 }}>{dataKonca}</b>
                {dniZostalo !== null && <span> · {dniZostalo === 1 ? t("1 day left", "został 1 dzień") : t(`${dniZostalo} days left`, `${dniZostalo} ${dniZostalo >= 2 && dniZostalo <= 4 ? "dni zostały" : "dni zostało"}`)}</span>}
              </p>
            ) : (
              <p>{t("Calls and flashcards day by day.", "Rozmowy i fiszki dzień po dniu.")}</p>
            )}
          </div>
        </div>
        <div className="p-naglowek-prawo">
          <div className="pc-nav">
            <button type="button" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() - 1, 1))} aria-label={t("Previous month", "Poprzedni miesiąc")}>‹</button>
            <b>{tytul}</b>
            <button type="button" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() + 1, 1))} aria-label={t("Next month", "Następny miesiąc")}>›</button>
            {!toMiesiacDzis && <button type="button" className="pc-dzis-btn" onClick={() => setMiesiac(new Date(dzis.getFullYear(), dzis.getMonth(), 1))}>{t("Today", "Dziś")}</button>}
          </div>
        </div>
      </header>

      <div className="p-kafle">
        <div className="p-kafel"><div className="p-kafel-et"><span>{t("Calls", "Rozmowy")}</span></div><div className="p-kafel-wart">{rozmowWMiesiacu}</div><div className="p-kafel-dol">{t("this month", "w tym miesiącu")}</div></div>
        <div className="p-kafel"><div className="p-kafel-et"><span>{t("Average score", "Średnia ocena")}</span></div><div className="p-kafel-wart">{sredniaMiesiaca === null ? "–" : liczba(sredniaMiesiaca)}<small>/ 10</small></div><div className="p-kafel-dol">{najlepszyDzien ? `${t("best day", "najlepszy dzień")}: ${dzienKrotki(najlepszyDzien[0])} · ${liczba(najlepszyDzien[1].srednia as number)}` : t("no scored calls", "brak ocenionych rozmów")}</div></div>
        <div className="p-kafel"><div className="p-kafel-et"><span>{t("Flashcards", "Fiszki")}</span></div><div className="p-kafel-wart">{fiszekWMiesiacu}</div><div className="p-kafel-dol">{t("answered", "odpowiedzianych")}</div></div>
        <div className="p-kafel"><div className="p-kafel-et"><span>{t("Active days", "Dni z treningiem")}</span></div><div className="p-kafel-wart">{dniAktywnych}</div><div className="p-kafel-dol"><span>{t("calls or flashcards", "rozmowy albo fiszki")}</span><span className="p-miernik-tor" style={{ width: 60, height: 4 }}><i data-k="lim" style={{ width: `${Math.min(100, (100 * dniAktywnych) / new Date(miesiac.getFullYear(), miesiac.getMonth() + 1, 0).getDate())}%` }} /></span></div></div>
      </div>

      <section className="p-karta p-karta-p">
        <div className="pc-siatka" role="grid">
          {nazwyDni.map((d) => <div key={d} className="pc-dzien-nazwa" role="columnheader">{d}</div>)}
          {komorki.map((d, i) => {
            const k = klucz(d);
            const dane = dni[k];
            const inny = d.getMonth() !== miesiac.getMonth();
            const toDzis = k === kluczDzis;
            const toKoniec = k === kluczKonca;
            // Dni z dostępem: od dziś do dnia końca włącznie. Po końcu: przygaszone.
            const zDostepem = !!kluczKonca && k >= kluczDzis && k <= kluczKonca;
            const poKoncu = !!kluczKonca && k > kluczKonca;
            const intensywnosc = dane?.rozmowy ? Math.min(4, dane.rozmowy) : 0;
            const klasa = ["pc-kratka", inny ? "inny" : "", toDzis ? "dzis" : "", toKoniec ? "koniec" : "", zDostepem && !intensywnosc ? "z-dostepem" : "", poKoncu && !intensywnosc ? "po" : ""].filter(Boolean).join(" ");
            const tresc = (
              <>
                <span className="pc-numer">{d.getDate()}</span>
                {dane?.rozmowy ? (
                  <span className="pc-pig" title={t("calls · average score", "rozmowy · średnia ocena")}>
                    <b>{dane.rozmowy}</b> {mnoga(dane.rozmowy, ["call", "calls"], ["rozmowa", "rozmowy", "rozmów"])}{dane.srednia !== null ? ` · ${liczba(dane.srednia)}` : ""}
                  </span>
                ) : null}
                {dane?.fiszki ? <span className="pc-pig pc-pig-fiszki"><b>{dane.fiszki}</b> {mnoga(dane.fiszki, ["flashcard", "flashcards"], ["fiszka", "fiszki", "fiszek"])}</span> : null}
                {toKoniec ? <span className="pc-pig pc-pig-koniec">{t("access ends", "koniec dostępu")}</span> : null}
              </>
            );
            const styl = { animationDelay: `${Math.min(i, 30) * 12}ms` };
            return dane?.rozmowaId ? (
              <Link key={k} href={`/bruno/feedback/${dane.rozmowaId}`} className={`${klasa} p-zjaw`} data-i={intensywnosc || undefined} role="gridcell" title={t("Open feedback", "Otwórz feedback")} style={styl}>{tresc}</Link>
            ) : (
              <div key={k} className={`${klasa} p-zjaw`} data-i={intensywnosc || undefined} role="gridcell" style={styl}>{tresc}</div>
            );
          })}
        </div>
        <div className="p-legenda" style={{ marginTop: 14 }}>
          <span className="pc-skala" aria-hidden>
            {t("fewer calls", "mniej rozmów")} <i style={{ background: "#fff" }} /><i style={{ background: "var(--p-s1)" }} /><i style={{ background: "var(--p-s2)" }} /><i style={{ background: "var(--p-s3)" }} /><i style={{ background: "var(--p-s4)" }} /> {t("more", "więcej")}
          </span>
          {koniec && <span><i style={{ background: "var(--p-lim-j)", border: "1px solid #eef2b4" }} /> {t("days with access", "dni z dostępem")}</span>}
          <span><i style={{ background: "var(--p-ink)", borderRadius: "50%" }} /> {t("today", "dziś")}</span>
          <span style={{ color: "var(--p-ink-3)" }}>{t("Click a day with a call to open its feedback.", "Kliknij dzień z rozmową, żeby otworzyć feedback.")}</span>
        </div>
      </section>
    </div>
  );
}
