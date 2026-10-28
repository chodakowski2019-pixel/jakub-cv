"use client";

// Wspólne części prezentacji inwestorskiej Bruno AI: paleta, klocki treści
// i szkielet pokazu slajdów za bramką z hasłem. Kopia silnika z decku Gabi
// (zwiazki-lp/src/components/prezentacja-ui.tsx, 28.10.2026), przemalowana
// na motyw Rinesk: biel #f2f3f5, czerń #141416, limonka #e9f542.
//
// Bramka jest kliencka (hasło siedzi w bundlu JS), więc chroni przed
// przypadkowym gościem, nie przed zdeterminowanym konkurentem. Do tego celu
// wystarcza: adres nigdzie nie jest podlinkowany, strona ma noindex i nie ma
// jej w sitemapie.

import { useCallback, useEffect, useState, type CSSProperties } from "react";

export const PALETA: Record<string, string> = {
  "--akcent": "#141416",
  "--akcent-ciemny": "#000000",
  "--akcent-cien": "rgba(20, 20, 22, 0.25)",
  "--akcent-mgla": "rgba(233, 245, 66, 0.35)",
  "--tekst": "#141416",
  "--tekst-cichy": "#5f6168",
  "--ramka": "rgba(20, 20, 22, 0.09)",
  "--tlo": "#f2f3f5",
};

export const SZKLO =
  "rounded-[18px] border border-[var(--ramka)] bg-white shadow-[0_10px_36px_rgba(20,20,22,0.07)]";

// Wyróżnione słowo w tytule: limonkowy zakreślacz pod czarnym tekstem
// (limonka jako kolor tekstu na bieli jest nieczytelna).
export const METAL: CSSProperties = {
  backgroundImage: "linear-gradient(transparent 58%, #e9f542 58%, #e9f542 92%, transparent 92%)",
  color: "var(--tekst)",
  padding: "0 0.08em",
};

// `kompakt` zmniejsza klocek o jeden stopień (gęste slajdy z tabelą,
// kaflami i źródłami naraz). Domyślne rozmiary bez zmian, więc prezka VC
// wygląda tak samo jak dotąd.
export function Naglowek({
  nad,
  children,
  kompakt,
}: {
  nad?: string;
  children: React.ReactNode;
  kompakt?: boolean;
}) {
  return (
    <div className={`${kompakt ? "mb-6" : "mb-8"} text-center`}>
      {nad ? (
        <p
          className={`${kompakt ? "mb-2 text-xs" : "mb-3 text-sm"} font-semibold uppercase tracking-[0.2em] text-[var(--akcent)]`}
        >
          {nad}
        </p>
      ) : null}
      <h2
        className={`font-bold tracking-tight text-[var(--tekst)] ${
          kompakt ? "text-2xl sm:text-4xl" : "text-3xl sm:text-5xl"
        }`}
      >
        {children}
      </h2>
    </div>
  );
}

export function Kafel({
  liczba,
  opis,
  przypis,
  kompakt,
}: {
  liczba: string;
  opis: string;
  przypis?: string;
  kompakt?: boolean;
}) {
  return (
    <div
      className={`${SZKLO} flex flex-col items-center text-center ${
        kompakt ? "px-5 py-5" : "px-6 py-7"
      }`}
    >
      <div
        className={`font-bold tracking-tight text-[var(--akcent)] ${
          kompakt ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"
        }`}
      >
        {liczba}
      </div>
      <div
        className={`mt-2 font-medium text-[var(--tekst)] ${
          kompakt ? "text-sm" : "text-base"
        }`}
      >
        {opis}
      </div>
      {przypis ? (
        <div
          className={`mt-1 text-[var(--tekst-cichy)] ${
            kompakt ? "text-xs" : "text-sm"
          }`}
        >
          {przypis}
        </div>
      ) : null}
    </div>
  );
}

export function Tabela({
  naglowki,
  wiersze,
  wyroznionaKolumna,
  wyroznionyWiersz,
  kompakt,
}: {
  naglowki: string[];
  wiersze: string[][];
  wyroznionaKolumna?: number;
  wyroznionyWiersz?: number;
  kompakt?: boolean;
}) {
  return (
    <div className={`${SZKLO} overflow-x-auto`}>
      <table
        className={`w-full text-left ${
          kompakt ? "min-w-[520px] text-sm" : "min-w-[560px] text-base"
        }`}
      >
        <thead>
          <tr className="border-b border-[var(--ramka)]">
            {naglowki.map((n, i) => (
              <th
                key={n}
                className={`${kompakt ? "px-4 py-3" : "px-5 py-4"} font-semibold ${
                  i === wyroznionaKolumna
                    ? "text-[var(--akcent)]"
                    : "text-[var(--tekst-cichy)]"
                }`}
              >
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {wiersze.map((w, ri) => (
            <tr
              key={ri}
              className={
                ri === wyroznionyWiersz
                  ? "bg-[var(--akcent-mgla)]"
                  : ri % 2 === 1
                    ? "bg-[rgba(20,20,22,0.05)]"
                    : ""
              }
            >
              {w.map((k, ki) => (
                <td
                  key={ki}
                  className={`${kompakt ? "px-4 py-2.5" : "px-5 py-3.5"} ${
                    ki === 0
                      ? "font-medium text-[var(--tekst)]"
                      : ki === wyroznionaKolumna || ri === wyroznionyWiersz
                        ? "font-semibold text-[var(--akcent)]"
                        : "text-[var(--tekst-cichy)]"
                  }`}
                >
                  {k}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Szkielet pokazu: bramka z hasłem, strzałki, kropki                   */
/* ------------------------------------------------------------------ */

export function PokazSlajdow({
  haslo,
  kluczSesji,
  slajdy,
}: {
  haslo: string;
  kluczSesji: string;
  slajdy: (() => React.ReactElement)[];
}) {
  const [odblokowana, setOdblokowana] = useState(false);
  const [proba, setProba] = useState("");
  const [blad, setBlad] = useState(false);
  const [slajd, setSlajd] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(kluczSesji) === "tak") setOdblokowana(true);
    } catch {
      /* prywatne okno itp. */
    }
  }, [kluczSesji]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slajd]);

  const dalej = useCallback(
    () => setSlajd((s) => Math.min(s + 1, slajdy.length - 1)),
    [slajdy.length],
  );
  const wstecz = useCallback(() => setSlajd((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    if (!odblokowana) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") dalej();
      if (e.key === "ArrowLeft" || e.key === "PageUp") wstecz();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [odblokowana, dalej, wstecz]);

  const sprawdz = (e: React.FormEvent) => {
    e.preventDefault();
    if (proba.trim().toLowerCase() === haslo) {
      setOdblokowana(true);
      setBlad(false);
      try {
        sessionStorage.setItem(kluczSesji, "tak");
      } catch {
        /* nie szkodzi */
      }
    } else {
      setBlad(true);
    }
  };

  const tlo = (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[860px] -translate-x-1/2 rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(233,245,66,0.30), rgba(217,224,0,0.12), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(217,224,0,0.22), transparent)",
        }}
      />
    </>
  );

  if (!odblokowana) {
    return (
      <main
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--tlo)] px-6"
        style={PALETA as CSSProperties}
      >
        {tlo}
        <form
          onSubmit={sprawdz}
          className={`${SZKLO} w-full max-w-sm px-8 py-9 text-center`}
        >
          <img
            src="/bruno/ikona-96.png"
            alt="Bruno AI"
            className="mx-auto mb-6 h-14 w-14 rounded-2xl"
          />
          {/* Bez nagłówka i bez zdania wyjaśniającego (USER_001 03.09):
              samo pole na hasło. Nazwa pola siedzi w aria-label, żeby
              czytnik ekranu wiedział, co to za input. */}
          <input
            type="password"
            value={proba}
            onChange={(e) => setProba(e.target.value)}
            placeholder="Hasło"
            aria-label="Hasło"
            autoFocus
            className="w-full rounded-xl border border-[var(--ramka)] bg-white px-4 py-3 text-center text-base text-[var(--tekst)] outline-none focus:border-[var(--akcent)]"
          />
          {blad ? (
            <p className="mt-2 text-sm font-medium text-red-500">
              Nieprawidłowe hasło.
            </p>
          ) : null}
          <button
            type="submit"
            className="mt-4 w-full rounded-full bg-[var(--akcent)] px-6 py-3 text-base font-semibold text-white shadow-[0_8px_24px_var(--akcent-cien)] transition hover:bg-[var(--akcent-ciemny)]"
          >
            Wejdź
          </button>
        </form>
      </main>
    );
  }

  const Aktualny = slajdy[slajd];

  return (
    <main
      className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--tlo)]"
      style={PALETA as CSSProperties}
    >
      {tlo}
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
        <Aktualny />
      </div>

      <div className="relative z-10 flex items-center justify-center gap-6 pb-8">
        <button
          onClick={wstecz}
          disabled={slajd === 0}
          aria-label="Poprzedni slajd"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ramka)] bg-white text-lg text-[var(--tekst)] shadow-sm transition hover:border-[var(--akcent)] disabled:opacity-30"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          {slajdy.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlajd(i)}
              aria-label={`Slajd ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === slajd
                  ? "w-7 bg-[var(--akcent)]"
                  : "w-2.5 bg-[rgba(20,20,22,0.28)] hover:bg-[rgba(20,20,22,0.55)]"
              }`}
            />
          ))}
        </div>
        <button
          onClick={dalej}
          disabled={slajd === slajdy.length - 1}
          aria-label="Następny slajd"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ramka)] bg-white text-lg text-[var(--tekst)] shadow-sm transition hover:border-[var(--akcent)] disabled:opacity-30"
        >
          →
        </button>
      </div>
    </main>
  );
}
