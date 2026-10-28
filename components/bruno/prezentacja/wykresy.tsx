"use client";

// Klocki wizualizacji danych dla prezentacji inwestorskiej Bruno AI
// (/materialy). Kopia z decku Gabi. Zasady (standard data-viz 2026):
//  - słupek max 24 px, zaokrąglony 4 px od strony danych, prosty przy podstawie,
//  - przerwy w kolorze tła zamiast obrysów, linie bazowe włoskowe,
//  - tekst ZAWSZE w kolorach tekstu (nigdy w kolorze serii),
//  - każda wartość etykietowana bezpośrednio przy znaku (żadnego zgadywania),
//  - jedna oś, zero ozdób, dane są jedynym głośnym elementem.
// Para serii czerń #141416 + limonka #c9d400 (motyw Rinesk). Limonka <3:1 na
// bieli => obowiązkowe etykiety, które i tak są wszędzie.

import { SZKLO } from "./ui";

export const SERIA_A = "#141416"; // czerń (nasz akcent)
export const SERIA_B = "#c9d400"; // limonka (druga miara)
const NEUTRALNY = "#a3aab6"; // de-emfaza (konkurencja)
const TOR = "rgba(20, 20, 22, 0.10)";
const BAZA = "rgba(22, 26, 34, 0.16)";
const DOBRY = "#006300";
const ZLY = "#c03434";

/* Kafelek statystyki: etykieta u góry, duża wartość, opcjonalna zmiana
   (zielona pastylka) i przypis. */
export function Statka({
  wartosc,
  opis,
  delta,
  przypis,
}: {
  wartosc: string;
  opis: string;
  delta?: string;
  przypis?: string;
}) {
  return (
    <div className={`${SZKLO} flex h-full flex-col overflow-hidden`}>
      <div className="border-b border-[var(--ramka)] bg-[rgba(20,20,22,0.05)] px-5 py-2.5 text-[13px] font-medium leading-snug text-[var(--tekst-cichy)]">
        {opis}
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-2 px-5 py-3">
        <span className="text-3xl font-bold tracking-tight text-[var(--tekst)] sm:text-4xl">
          {wartosc}
        </span>
        {delta ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ color: DOBRY, background: "rgba(0,99,0,0.08)" }}
          >
            ▲ {delta}
          </span>
        ) : null}
      </div>
      {przypis ? (
        <div className="border-t border-[var(--ramka)] px-5 py-2 text-xs text-[var(--tekst-cichy)]">
          {przypis}
        </div>
      ) : null}
    </div>
  );
}

/* Poziome słupki wielkości: jedna seria, wartość na końcu słupka. */
export function PaskiWielkosci({
  tytul,
  wiersze,
}: {
  tytul?: string;
  wiersze: { nazwa: string; wartosc: number; etykieta: string; przypis?: string }[];
}) {
  const max = Math.max(...wiersze.map((w) => w.wartosc));
  return (
    <div className={`${SZKLO} px-6 py-5`}>
      {tytul ? (
        <div className="mb-4 text-sm font-semibold text-[var(--tekst)]">{tytul}</div>
      ) : null}
      <div className="flex flex-col divide-y divide-[var(--ramka)]">
        {wiersze.map((w) => (
          <div key={w.nazwa} className="py-3 first:pt-0 last:pb-0">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-[var(--tekst)]">
                {w.nazwa}
                {w.przypis ? (
                  <span className="ml-2 text-xs font-normal text-[var(--tekst-cichy)]">{w.przypis}</span>
                ) : null}
              </span>
              <span className="whitespace-nowrap text-sm font-bold text-[var(--tekst)]">{w.etykieta}</span>
            </div>
            <div className="h-5 w-full rounded-r-[4px]" style={{ background: TOR }}>
              <div
                className="h-5 rounded-r-[4px]"
                style={{ width: `${Math.max((w.wartosc / max) * 100, 2)}%`, background: SERIA_A }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Poziome paski zakresów cen (od-do), konkurencja szara, wyróżniony akcent. */
export function PaskiZakresu({
  wiersze,
  max,
  osie,
}: {
  wiersze: { nazwa: string; opis: string; od: number; do_: number; etykieta: string; akcent?: boolean }[];
  max: number;
  osie: { wartosc: number; etykieta: string }[];
}) {
  return (
    <div className={`${SZKLO} px-6 py-5`}>
      <div className="flex flex-col divide-y divide-[var(--ramka)]">
        {wiersze.map((w) => {
          const lewo = (w.od / max) * 100;
          const szer = Math.max(((w.do_ - w.od) / max) * 100, 1.5);
          return (
            <div key={w.nazwa} className="grid items-center gap-3 py-3 first:pt-0 sm:grid-cols-[190px_1fr_235px]">
              <div>
                <div className="text-sm font-semibold text-[var(--tekst)]">{w.nazwa}</div>
                <div className="text-xs text-[var(--tekst-cichy)]">{w.opis}</div>
              </div>
              <div className="relative h-5">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ background: BAZA }} />
                <div
                  className="absolute top-1/2 h-4 -translate-y-1/2 rounded-[4px]"
                  style={{
                    left: `${lewo}%`,
                    width: `${szer}%`,
                    background: w.akcent ? SERIA_A : NEUTRALNY,
                  }}
                />
              </div>
              <div className="text-right text-[13px] font-semibold text-[var(--tekst)] sm:text-left">
                {w.etykieta}
              </div>
            </div>
          );
        })}
        {/* oś: te same kolumny, podziałka pod paskami */}
        <div className="grid gap-3 pt-2 sm:grid-cols-[190px_1fr_235px]">
          <div />
          <div className="relative h-4">
            {osie.map((o) => (
              <span
                key={o.wartosc}
                className={`absolute whitespace-nowrap text-[11px] text-[var(--tekst-cichy)] ${
                  o.wartosc === 0 ? "" : o.wartosc === max ? "" : "-translate-x-1/2"
                }`}
                style={
                  o.wartosc === max
                    ? { right: 0 }
                    : { left: `${(o.wartosc / max) * 100}%` }
                }
              >
                {o.etykieta}
              </span>
            ))}
          </div>
          <div />
        </div>
      </div>
    </div>
  );
}

/* Pionowe kolumny, jedna seria: wartość na czapce, podpisy pod osią. */
export function Kolumny({
  dane,
  wysokosc = 190,
}: {
  dane: { wartosc: number; etykieta: string; podpisy: string[] }[];
  wysokosc?: number;
}) {
  const max = Math.max(...dane.map((d) => d.wartosc));
  return (
    <div className={`${SZKLO} px-4 py-5 sm:px-6`}>
      <div className="flex items-end justify-between gap-2">
        {dane.map((d) => (
          <div key={d.podpisy[0]} className="flex flex-1 flex-col items-center">
            <div className="mb-1 text-[13px] font-bold text-[var(--tekst)]">{d.etykieta}</div>
            <div
              className="w-6 rounded-t-[4px]"
              style={{
                height: `${Math.max((d.wartosc / max) * wysokosc, 5)}px`,
                background: SERIA_A,
              }}
            />
          </div>
        ))}
      </div>
      <div className="h-px w-full" style={{ background: BAZA }} />
      <div className="mt-2 flex divide-x divide-[var(--ramka)]">
        {dane.map((d) => (
          <div key={d.podpisy[0]} className="flex-1 px-1 text-center">
            <div className="text-xs font-semibold text-[var(--tekst)]">{d.podpisy[0]}</div>
            {d.podpisy.slice(1).map((p) => (
              <div key={p} className="mt-1 border-t border-[var(--ramka)] pt-1 text-[11px] leading-tight text-[var(--tekst-cichy)]">{p}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Kolumny grupowane po dwie serie (np. przychód vs koszty) + legenda
   + kolorowany wiersz wyniku pod każdą grupą. */
export function KolumnyGrupowane({
  grupy,
  legenda,
  wysokosc = 180,
}: {
  grupy: {
    tytul: string;
    a: { wartosc: number; etykieta: string };
    b: { wartosc: number; etykieta: string };
    wynik: { tekst: string; ton: "dobry" | "zly" | "neutralny" };
    podpisy: string[];
  }[];
  legenda: { a: string; b: string };
  wysokosc?: number;
}) {
  const max = Math.max(...grupy.flatMap((g) => [g.a.wartosc, g.b.wartosc]));
  const tony = { dobry: DOBRY, zly: ZLY, neutralny: "var(--tekst)" } as const;
  return (
    <div className={`${SZKLO} px-4 py-5 sm:px-6`}>
      <div className="mb-4 flex justify-center gap-5 text-xs font-medium text-[var(--tekst)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIA_A }} />
          {legenda.a}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIA_B }} />
          {legenda.b}
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        {grupy.map((g) => (
          <div key={g.tytul} className="flex flex-1 flex-col items-center">
            <div className="flex items-end gap-[2px]">
              <div className="flex flex-col items-center">
                <div className="mb-1 text-xs font-bold text-[var(--tekst)]">{g.a.etykieta}</div>
                <div
                  className="w-6 rounded-t-[4px]"
                  style={{ height: `${Math.max((g.a.wartosc / max) * wysokosc, 4)}px`, background: SERIA_A }}
                />
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-1 text-xs font-bold text-[var(--tekst)]">{g.b.etykieta}</div>
                <div
                  className="w-6 rounded-t-[4px]"
                  style={{ height: `${Math.max((g.b.wartosc / max) * wysokosc, 4)}px`, background: SERIA_B }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-px w-full" style={{ background: BAZA }} />
      <div className="mt-2 flex divide-x divide-[var(--ramka)]">
        {grupy.map((g) => (
          <div key={g.tytul} className="flex-1 px-1 text-center">
            <div className="text-sm font-semibold text-[var(--tekst)]">{g.tytul}</div>
            <div className="mt-0.5 text-xs font-bold" style={{ color: tony[g.wynik.ton] }}>
              {g.wynik.tekst}
            </div>
            {g.podpisy.map((p) => (
              <div key={p} className="mt-1 border-t border-[var(--ramka)] pt-1 text-[11px] leading-tight text-[var(--tekst-cichy)]">{p}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Macierz porównania funkcji: ✅ jako niebieska pastylka, — jako wyciszona
   kreska, kolumna wyróżniona delikatnym tłem. Komórki przyjmują te same
   teksty co stara tabela ("✅ AI, 24/7", "— (20% wizyty)", "dodatek..."). */
export function MacierzPorownania({
  kolumny,
  wyrozniona,
  wiersze,
}: {
  kolumny: string[];
  wyrozniona: number;
  wiersze: string[][];
}) {
  const komorka = (tekst: string, wyroz: boolean) => {
    if (tekst.startsWith("✅")) {
      const reszta = tekst.slice(1).trim();
      return (
        <span className="inline-flex flex-col items-center gap-0.5">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: wyroz ? SERIA_A : NEUTRALNY }}
          >
            ✓
          </span>
          {reszta ? <span className="text-[11px] leading-tight text-[var(--tekst-cichy)]">{reszta}</span> : null}
        </span>
      );
    }
    if (tekst.startsWith("—")) {
      const reszta = tekst.slice(1).trim();
      return (
        <span className="inline-flex flex-col items-center gap-0.5">
          <span className="text-base leading-none text-[rgba(22,26,34,0.25)]">—</span>
          {reszta ? <span className="text-[11px] leading-tight text-[var(--tekst-cichy)]">{reszta}</span> : null}
        </span>
      );
    }
    return <span className="text-[11px] leading-tight text-[var(--tekst-cichy)]">{tekst}</span>;
  };

  return (
    <div className={`${SZKLO} overflow-x-auto`}>
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-[var(--ramka)]">
            {kolumny.map((k, i) => (
              <th
                key={k || "cecha"}
                className={`px-4 py-3 text-center text-[13px] font-semibold first:text-left ${
                  i === wyrozniona ? "text-[var(--akcent)]" : "text-[var(--tekst-cichy)]"
                }`}
                style={i === wyrozniona ? { background: TOR } : undefined}
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {wiersze.map((w, ri) => (
            <tr
              key={w[0]}
              className={`border-b border-[var(--ramka)] last:border-b-0 ${ri % 2 === 1 ? "bg-[rgba(20,20,22,0.04)]" : ""}`}
            >
              {w.map((k, ki) => (
                <td
                  key={ki}
                  className={`px-4 py-2.5 text-center align-middle first:text-left ${
                    ki === 0 ? "text-[13px] font-medium text-[var(--tekst)]" : ""
                  }`}
                  style={ki === wyrozniona ? { background: TOR } : undefined}
                >
                  {ki === 0 ? k : komorka(k, ki === wyrozniona)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
