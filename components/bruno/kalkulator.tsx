"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 25.10 (USER_001): KALKULATOR SPRZEDAŻOWY w kółku obok dymka czatu, na demo. Szef wpisuje swoje liczby,
// na żywo widzi: ile zespół sprzedaje dziś, ile dokłada +X % skuteczności (= koszt każdego miesiąca zwłoki),
// ile kosztuje Bruno, po ilu miesiącach się zwraca, i ile kosztuje odejście jednego handlowca.
// Założenia widoczne i edytowalne (nic nie jest ukryte). Wpisy pamiętane w przeglądarce (localStorage).

// 26.10 (USER_001): sekcja „Porównanie z trenerem”. Cenę Bruno porównujemy z wartością i alternatywami
// (trener na etacie), nie z kosztem narzędzia. „trener” to osobne pole, NIE „pensja” (rotacja).

type Pola = {
  handlowcy: number;
  deali: number;
  wartosc: number;
  wzrost: number;
  cena: number;
  pensja: number;
  trener: number;
};
const KLUCZ = "bruno_kalkulator";

const DOMYSLNE: Record<"pl" | "en", Pola> = {
  // Cennik PL (26.10): progi 399/379/359/339 zł (pole „cena” w PL nieużywane, liczone z PROGI_PL)
  pl: { handlowcy: 10, deali: 4, wartosc: 5000, wzrost: 10, cena: 399, pensja: 90_000, trener: 15_000 },
  en: { handlowcy: 10, deali: 4, wartosc: 2000, wzrost: 10, cena: 79, pensja: 60_000, trener: 7000 },
};

// Progi PL netto za handlowca / mies. Cena progu obowiązuje dla każdego handlowca w zespole.
const PROGI_PL = [
  { do: 5, cena: 399, opis: "1-5" },
  { do: 10, cena: 379, opis: "6-10" },
  { do: 20, cena: 359, opis: "11-20" },
  { do: Infinity, cena: 339, opis: "21+" },
];
const progPL = (handlowcy: number) => PROGI_PL.find((x) => handlowcy <= x.do) ?? PROGI_PL[PROGI_PL.length - 1];

// Rozmowy treningowe z Bruno: 100 na handlowca / mies.
const ROZMOWY_MIES = 100;

export default function Kalkulator({ handlowcy }: { handlowcy?: number | null }) {
  const { t, jezyk } = useT();
  const j = jezyk === "pl" ? "pl" : "en";
  const [otwarty, setOtwarty] = useState(false);
  const [p, setP] = useState<Pola>({ ...DOMYSLNE[j], ...(handlowcy && handlowcy > 0 ? { handlowcy } : {}) });

  useEffect(() => {
    try {
      const z = localStorage.getItem(`${KLUCZ}:${j}`);
      if (z) setP((x) => ({ ...x, ...JSON.parse(z) }));
    } catch {}
  }, [j]);
  const ustaw = (k: keyof Pola) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(0, Number(e.target.value.replace(/\s/g, "")) || 0);
    setP((x) => {
      const n = { ...x, [k]: v };
      try {
        localStorage.setItem(`${KLUCZ}:${j}`, JSON.stringify(n));
      } catch {}
      return n;
    });
  };

  const prog = progPL(p.handlowcy);
  const cena = j === "pl" ? prog.cena : p.cena;

  const w = useMemo(() => {
    const przychod = p.handlowcy * p.deali * p.wartosc;
    const dodatkowy = (przychod * p.wzrost) / 100;
    const koszt = p.handlowcy * cena;
    const zwrot = koszt > 0 ? dodatkowy / koszt : 0;
    // Koszt odejścia handlowca: 150 % rocznego wynagrodzenia (PL 2026, PLAN.md „Grupa docelowa”).
    const rotacja = p.pensja * 1.5;
    // Porównanie miesięczne (USER_001 26.10): Bruno vs trener na etacie (1 na zespół). Szkoleń nie
    // porównujemy: Bruno to trener, nie szkolenie.
    const brunoMies = koszt;
    const trenerMies = p.trener;
    const procentTrenera = trenerMies > 0 ? (brunoMies / trenerMies) * 100 : 0;
    const rozmowyMies = p.handlowcy * ROZMOWY_MIES;
    return { przychod, dodatkowy, koszt, zwrot, rotacja, kwartal: dodatkowy * 3, brunoMies, trenerMies, procentTrenera, rozmowyMies };
  }, [p, cena]);

  const waluta = j === "pl" ? "zł" : "$";
  const kwota = (v: number) => `${Math.round(v).toLocaleString(j === "pl" ? "pl-PL" : "en-US")} ${waluta}`;

  const pole = (k: keyof Pola, etykieta: string, sufiks?: string) => (
    <label className="flex flex-col gap-1 text-[12px] text-slate-500">
      <span>{etykieta}</span>
      <span className="flex items-center gap-1.5">
        <input className="bruno-pole !py-1.5 !px-2.5 !text-[14px] tabular-nums" inputMode="numeric" value={p[k].toLocaleString(j === "pl" ? "pl-PL" : "en-US")} onChange={ustaw(k)} />
        {sufiks && <span className="text-slate-400 shrink-0">{sufiks}</span>}
      </span>
    </label>
  );

  return (
    <div className="bruno-czat bruno-kalk fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-20 flex flex-col items-end gap-3">
      {otwarty && (
        <div className="bruno-szklo rounded-3xl overflow-hidden w-[calc(100vw-2.5rem)] max-w-md shadow-[0_24px_60px_rgba(212,175,90,0.22)]" role="dialog" aria-label={t("Calculator", "Kalkulator")}>
          <div className="px-5 py-4 bg-gradient-to-r from-cyan-700 to-teal-700 text-white flex items-center gap-3">
            <span className="size-9 rounded-full bg-white/15 grid place-items-center bruno-h2 text-sm">%</span>
            <div className="min-w-0 flex-1">
              <div className="bruno-h2 text-[15px] leading-tight">{t("What does waiting cost?", "Ile kosztuje zwłoka?")}</div>
            </div>
            <button type="button" onClick={() => setOtwarty(false)} aria-label={t("Close", "Zamknij")} className="text-white/80 hover:text-white text-2xl leading-none px-1">×</button>
          </div>
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {pole("handlowcy", t("Reps", "Handlowców"))}
              {pole("deali", t("Deals per rep / month", "Deali na handlowca / mies."))}
              {pole("wartosc", t("Average deal", "Średni deal"), waluta)}
              {pole("wzrost", t("Win rate lift", "Wzrost skuteczności"), "%")}
              {j === "pl" ? (
                // PL: cena z progu, bez wpisywania (zmienia się sama z liczbą handlowców)
                <div className="flex flex-col gap-1 text-[12px] text-slate-500">
                  <span>Bruno za handlowca / mies.</span>
                  <span className="py-1.5 text-[14px] text-slate-800 tabular-nums">
                    {prog.cena} zł / handlowca <span className="text-slate-400">(próg {prog.opis})</span>
                  </span>
                </div>
              ) : (
                pole("cena", "Bruno per seat / month", waluta)
              )}
              {pole("pensja", t("Rep's yearly pay", "Roczna pensja handlowca"), waluta)}
            </div>
            <dl className="bruno-kalk-wyniki grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">{t("Team revenue / month", "Przychód zespołu / mies.")}</dt>
                <dd className="tabular-nums text-slate-800 font-medium">{kwota(w.przychod)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">{t("Bruno / month", "Bruno / mies.")}</dt>
                <dd className="tabular-nums text-slate-800 font-medium">{kwota(w.koszt)}</dd>
              </div>
              <div className="col-span-2 rounded-2xl p-3 bruno-kalk-glowny">
                <dt className="text-[11px] uppercase tracking-wide">{t(`Each month without Bruno costs (+${p.wzrost}% win rate)`, `Każdy miesiąc bez Bruno kosztuje (+${p.wzrost} % skuteczności)`)}</dt>
                <dd className="bruno-h2 text-[1.7rem] leading-none mt-1 tabular-nums">{kwota(w.dodatkowy)}</dd>
                <dd className="text-[12px] mt-1 opacity-80">{t("A quarter:", "Kwartał:")} {kwota(w.kwartal)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">{t("Return on Bruno", "Zwrot z Bruno")}</dt>
                <dd className="tabular-nums text-slate-800 font-medium">{w.zwrot >= 1 ? `${Math.round(w.zwrot)}×` : `${Math.round(w.zwrot * 100)} %`}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">{t("One rep leaving", "Odejście 1 handlowca")}</dt>
                <dd className="tabular-nums text-slate-800 font-medium" title={t("150% of yearly pay (PL 2026)", "150 % rocznej pensji (PL 2026)")}>{kwota(w.rotacja)}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-4">
              <div className="bruno-h2 text-[14px] text-slate-800">{t("Compared to a sales coach", "Porównanie z trenerem")}</div>
              <div className="grid grid-cols-1 gap-3">
                {pole("trener", t("Coach cost / month", "Koszt trenera / mies."), waluta)}
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex items-baseline justify-between gap-3 rounded-2xl p-3 bruno-kalk-glowny">
                  <dt>
                    <div className="font-medium">Bruno</div>
                    <div className="text-[12px] opacity-80">{t(`Every rep, ${ROZMOWY_MIES} practice calls a month`, `Każdy handlowiec, ${ROZMOWY_MIES} rozmów w miesiącu`)}</div>
                  </dt>
                  <dd className="tabular-nums font-medium shrink-0">{kwota(w.brunoMies)} / {t("mo", "mies.")}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 px-3">
                  <dt>
                    <div className="text-slate-800 font-medium">{t("Full-time sales coach", "Trener sprzedaży na etacie")}</div>
                    <div className="text-[12px] text-slate-500">{t("1 coach for the whole team, a few role plays a day", "1 trener na cały zespół, kilka scenek dziennie")}</div>
                  </dt>
                  <dd className="tabular-nums text-slate-800 font-medium shrink-0">{kwota(w.trenerMies)} / {t("mo", "mies.")}</dd>
                </div>
              </dl>
              <p className="text-[12px] text-slate-600">
                {t(
                  `Bruno = ${Math.round(w.procentTrenera)}% of a coach's cost, with ${w.rozmowyMies.toLocaleString("en-US")} practice calls a month.`,
                  `Bruno = ${Math.round(w.procentTrenera)} % kosztu trenera, a daje ${w.rozmowyMies.toLocaleString("pl-PL")} rozmów treningowych w miesiącu.`,
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOtwarty((o) => !o)} aria-label={otwarty ? t("Close calculator", "Zamknij kalkulator") : t("Calculator", "Kalkulator")} aria-expanded={otwarty} className={`bruno-dymek bruno-dymek-kalk ${otwarty ? "bruno-dymek-otwarty" : ""}`}>
        {otwarty ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M19 5L5 19" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg>
        )}
      </button>
    </div>
  );
}
