"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 11.10 (USER_001, E32): zakładka „Kalendarz”. Miesiąc z rozmowami (liczba, średnia ocena) i fiszkami
// w każdym dniu, dzisiaj, i do kiedy trwa dostęp (koniec testu albo opłaconego Bruno Pro).

export type DzienKalendarza = { rozmowy: number; srednia: number | null; fiszki: number; rozmowaId: string | null };

const klucz = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type RozmowaKal = { id: string; start: string; ocena: number | null; zakonczona: boolean };

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
  const [miesiac, setMiesiac] = useState(new Date(dzis.getFullYear(), dzis.getMonth(), 1));
  const koniec = koniecDostepu ? new Date(koniecDostepu) : null;

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
          <p className="text-slate-600 mt-2">
            {opisKonca} <b className="text-slate-900">{new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(koniec)}</b>
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xl w-full mx-auto">
        {[
          [rozmowWMiesiacu, t("calls", "rozmów")],
          [fiszekWMiesiacu, t("flashcards", "fiszek")],
          [dniAktywnych, t("active days", "dni z treningiem")],
        ].map(([n, opis]) => (
          <div key={String(opis)} className="bruno-szklo rounded-2xl p-3 text-center">
            <div className="bruno-h2 text-xl leading-none">{n}</div>
            <div className="text-[11px] text-slate-500 mt-1">{opis}</div>
          </div>
        ))}
      </div>

      <section className="bruno-szklo rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <button type="button" className="bruno-przycisk-2 px-3 py-1.5 text-sm" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() - 1, 1))} aria-label={t("Previous month", "Poprzedni miesiąc")}>←</button>
          <div className="bruno-h2 text-lg capitalize">{tytul}</div>
          <button type="button" className="bruno-przycisk-2 px-3 py-1.5 text-sm" onClick={() => setMiesiac(new Date(miesiac.getFullYear(), miesiac.getMonth() + 1, 1))} aria-label={t("Next month", "Następny miesiąc")}>→</button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {nazwyDni.map((d) => (
            <div key={d} className="text-[11px] uppercase tracking-wide text-slate-500 pb-1">{d}</div>
          ))}
          {komorki.map((d) => {
            const k = klucz(d);
            const dane = dni[k];
            const inny = d.getMonth() !== miesiac.getMonth();
            const toDzis = k === klucz(dzis);
            const toKoniec = koniec && k === klucz(koniec);
            const tresc = (
              <>
                <div className={`text-sm ${toDzis ? "font-bold" : ""}`}>{d.getDate()}</div>
                {dane?.rozmowy ? (
                  <div className="text-[10px] leading-tight mt-0.5" style={{ color: "#d4af5a" }}>
                    📞 {dane.rozmowy}
                    {dane.srednia !== null ? ` · ${dane.srednia}/10` : ""}
                  </div>
                ) : null}
                {dane?.fiszki ? <div className="text-[10px] leading-tight text-slate-500">🃏 {dane.fiszki}</div> : null}
                {toKoniec ? <div className="text-[10px] leading-tight text-red-500 font-semibold">{t("end", "koniec")}</div> : null}
              </>
            );
            const klasa = `min-h-[64px] sm:min-h-[76px] rounded-xl p-1.5 flex flex-col items-center border ${inny ? "opacity-35 border-transparent" : "border-slate-200/40"} ${toDzis ? "ring-2 ring-[#d4af5a]" : ""} ${toKoniec ? "border-red-500/70" : ""}`;
            return dane?.rozmowaId ? (
              <Link key={k} href={`/bruno/feedback/${dane.rozmowaId}`} className={`${klasa} hover:bg-white/5`} title={t("Open feedback", "Otwórz feedback")}>
                {tresc}
              </Link>
            ) : (
              <div key={k} className={klasa}>{tresc}</div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 mt-4">
          {t("📞 calls · average score   🃏 flashcards   Click a day with a call to open its feedback.", "📞 rozmowy · średnia ocena   🃏 fiszki   Kliknij dzień z rozmową, żeby otworzyć feedback.")}
        </p>
      </section>
    </div>
  );
}
