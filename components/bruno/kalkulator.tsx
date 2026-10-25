"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 25.10 (USER_001): KALKULATOR SPRZEDAŻOWY w kółku obok dymka czatu, na demo. Szef wpisuje swoje liczby,
// na żywo widzi: ile zespół sprzedaje dziś, ile dokłada +X % skuteczności (= koszt każdego miesiąca zwłoki),
// ile kosztuje Bruno, po ilu miesiącach się zwraca, i ile kosztuje odejście jednego handlowca.
// Założenia widoczne i edytowalne (nic nie jest ukryte). Wpisy pamiętane w przeglądarce (localStorage).

type Pola = { handlowcy: number; deali: number; wartosc: number; wzrost: number; cena: number; pensja: number };
const KLUCZ = "bruno_kalkulator";

const DOMYSLNE: Record<"pl" | "en", Pola> = {
  // Pilot PL (25.10): 250 zł / stanowisko / mies.
  pl: { handlowcy: 10, deali: 4, wartosc: 5000, wzrost: 10, cena: 250, pensja: 90_000 },
  en: { handlowcy: 10, deali: 4, wartosc: 2000, wzrost: 10, cena: 79, pensja: 60_000 },
};

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

  const w = useMemo(() => {
    const przychod = p.handlowcy * p.deali * p.wartosc;
    const dodatkowy = (przychod * p.wzrost) / 100;
    const koszt = p.handlowcy * p.cena;
    const zwrot = koszt > 0 ? dodatkowy / koszt : 0;
    // Koszt odejścia handlowca: 150 % rocznego wynagrodzenia (PL 2026, PLAN.md „Grupa docelowa”).
    const rotacja = p.pensja * 1.5;
    return { przychod, dodatkowy, koszt, zwrot, rotacja, kwartal: dodatkowy * 3 };
  }, [p]);

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
              {pole("cena", t("Bruno per seat / month", "Bruno za stanowisko / mies."), waluta)}
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
