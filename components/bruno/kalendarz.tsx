"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 11.10 (USER_001, E32): zakładka „Kalendarz”. Miesiąc z rozmowami (liczba, średnia ocena) i fiszkami
// w każdym dniu, dzisiaj, i do kiedy trwa dostęp (koniec testu albo opłaconego Bruno Pro).
// 12.10 (USER_001): dni z dostępem (od dziś do końca) lekko podświetlone złotem, dzień końca wyraźny,
// większe liczby i ikony, mocniejsze ramki. Dni po końcu dostępu przygaszone.

export type DzienKalendarza = { rozmowy: number; srednia: number | null; fiszki: number; rozmowaId: string | null };

const klucz = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type RozmowaKal = { id: string; start: string; ocena: number | null; zakonczona: boolean };

// 25.10: kolory przez zmienne CSS, motyw Asset (app/bruno/motyw-asset.css) podmienia je na fiolet.
const ZLOTO = "var(--k-zloto, #d4af5a)";
const ZLOTO_JASNE = "var(--k-zloto-jasne, #f3dc9c)";
const TEKST = "var(--k-tekst, #f5f2ea)";
const zl = (a: number) => `color-mix(in srgb, ${ZLOTO} ${a * 100}%, transparent)`;
const tx = (a: number) => `color-mix(in srgb, ${TEKST} ${a * 100}%, transparent)`;
const bl = (a: number) => `color-mix(in srgb, var(--k-jasny, #fff) ${a * 100}%, transparent)`;

export default function Kalendarz({ rozmowy, fiszki, koniecDostepu, opisKonca }: { rozmowy: RozmowaKal[]; fiszki: string[]; koniecDostepu: string | null; opisKonca: string | null }) {
  const { t, locale, jezyk } = useT();
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

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          <span className="bruno-gradient-tekst">{t("Calendar", "Kalendarz")}</span>
        </h1>
        {koniec && opisKonca && (
          <div
            className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-3 px-5 py-2.5 rounded-full text-sm sm:text-base"
            style={{ background: zl(0.1), border: `1px solid ${zl(0.45)}`, color: TEKST, boxShadow: `0 0 32px -8px ${zl(0.45)}` }}
          >
            <span style={{ color: tx(0.8) }}>{opisKonca}</span>
            <b style={{ color: ZLOTO_JASNE }}>{dataKonca}</b>
            {dniZostalo !== null && (
              <span className="text-xs sm:text-sm" style={{ color: tx(0.6) }}>
                · {dniZostalo === 1 ? t("1 day left", "został 1 dzień") : t(`${dniZostalo} days left`, `${dniZostalo} ${dniZostalo >= 2 && dniZostalo <= 4 ? "dni zostały" : "dni zostało"}`)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xl w-full mx-auto">
        {[
          [rozmowWMiesiacu, t("calls", "rozmów")],
          [fiszekWMiesiacu, t("flashcards", "fiszek")],
          [dniAktywnych, t("active days", "dni z treningiem")],
        ].map(([n, opis]) => (
          <div key={String(opis)} className="bruno-szklo rounded-2xl px-3 py-4 text-center">
            <div className="bruno-h2 text-3xl sm:text-4xl leading-none" style={{ color: n ? ZLOTO_JASNE : TEKST }}>{n}</div>
            <div className="text-xs sm:text-sm mt-1.5" style={{ color: tx(0.72) }}>{opis}</div>
          </div>
        ))}
      </div>

      <section className="bruno-szklo rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <button type="button" className="bruno-przycisk-2 px-4 py-2 text-base" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() - 1, 1))} aria-label={t("Previous month", "Poprzedni miesiąc")}>←</button>
          <div className="bruno-h2 text-xl sm:text-2xl capitalize" style={{ color: TEKST }}>{tytul}</div>
          <button type="button" className="bruno-przycisk-2 px-4 py-2 text-base" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() + 1, 1))} aria-label={t("Next month", "Następny miesiąc")}>→</button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {nazwyDni.map((d) => (
            <div key={d} className="text-xs sm:text-sm font-medium uppercase tracking-wide pb-1" style={{ color: tx(0.72) }}>{d}</div>
          ))}
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

            const styl: React.CSSProperties = {
              borderColor: toKoniec ? ZLOTO : zDostepem ? zl(0.4) : inny ? "transparent" : bl(0.16),
              background: toKoniec
                ? zl(0.2)
                : zDostepem
                  ? zl(0.08)
                  : maDane
                    ? bl(0.05)
                    : "transparent",
              boxShadow: toKoniec
                ? `0 0 0 2px ${zl(0.35)}, 0 0 28px -4px ${zl(0.55)}`
                : toDzis
                  ? `0 0 0 2px ${ZLOTO}`
                  : undefined,
              opacity: inny ? 0.3 : poKoncu ? 0.55 : 1,
              color: TEKST,
            };

            const tresc = (
              <>
                <div className="flex items-baseline gap-1">
                  <span className={`text-base sm:text-lg leading-none ${toDzis || toKoniec ? "font-bold" : "font-medium"}`} style={{ color: toDzis || toKoniec ? ZLOTO_JASNE : TEKST }}>
                    {d.getDate()}
                  </span>
                  {/* 16.10 (USER_001): na telefonie bez „dziś” (słabo widać w małej kratce), dzień wyróżnia ramka. */}
                  {toDzis && <span className="max-[860px]:hidden text-[10px] uppercase tracking-wide" style={{ color: ZLOTO }}>{t("today", "dziś")}</span>}
                </div>
                {/* 14.10 (USER_001, telefon): w wąskiej kratce tylko liczby „rozmowy · fiszki”, bez ikon i średniej (jest w Feedbacku). */}
                {maDane ? (
                  <div className="sm:hidden text-[11px] font-semibold leading-none mt-1.5 flex items-center gap-1">
                    {dane.rozmowy ? <span style={{ color: ZLOTO_JASNE }}>{dane.rozmowy}</span> : null}
                    {dane.rozmowy && dane.fiszki ? <span style={{ color: tx(0.4) }}>·</span> : null}
                    {dane.fiszki ? <span style={{ color: tx(0.75) }}>{dane.fiszki}</span> : null}
                  </div>
                ) : null}
                {dane?.rozmowy ? (
                  <div className="hidden sm:block text-sm font-semibold leading-tight mt-1" style={{ color: ZLOTO_JASNE }}>
                    📞 {dane.rozmowy}
                    {dane.srednia !== null ? ` · ${dane.srednia}/10` : ""}
                  </div>
                ) : null}
                {dane?.fiszki ? (
                  <div className="hidden sm:block text-sm font-medium leading-tight mt-0.5" style={{ color: tx(0.85) }}>
                    🃏 {dane.fiszki}
                  </div>
                ) : null}
                {toKoniec ? (
                  <div className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide leading-tight mt-auto pt-1" style={{ color: ZLOTO_JASNE }}>
                    <span className="sm:hidden">{t("end", "koniec")}</span>
                    <span className="hidden sm:inline">{t("access ends", "koniec dostępu")}</span>
                  </div>
                ) : null}
              </>
            );
            const klasa = "min-h-[54px] sm:min-h-[92px] rounded-lg sm:rounded-xl p-1 sm:p-2 flex flex-col items-center border transition-colors";
            return dane?.rozmowaId ? (
              <Link key={k} href={`/bruno/feedback/${dane.rozmowaId}`} className={`${klasa} hover:border-[#d4af5a]`} style={styl} title={t("Open feedback", "Otwórz feedback")}>
                {tresc}
              </Link>
            ) : (
              <div key={k} className={klasa} style={styl}>{tresc}</div>
            );
          })}
        </div>
        <div className="bruno-opis flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm mt-5" style={{ color: tx(0.72) }}>
          <span>📞 {t("calls · average score", "rozmowy · średnia ocena")}</span>
          <span>🃏 {t("flashcards", "fiszki")}</span>
          {koniec && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 rounded" style={{ background: zl(0.2), border: `1px solid ${zl(0.6)}` }} />
              {t("days with access", "dni z dostępem")}
            </span>
          )}
          <span>{t("Click a day with a call to open its feedback.", "Kliknij dzień z rozmową, żeby otworzyć feedback.")}</span>
        </div>
      </section>
    </div>
  );
}
