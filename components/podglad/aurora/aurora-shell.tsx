"use client";

import AuroraCanvas, { ZORZA_LIMONKA, ZORZA_POMARANCZ } from "./aurora-canvas";
import s from "./aurora.module.css";
import { inter } from "./font";

// Układ wzoru aurora-onboard.html: lewy panel z zorzą i krokami, prawa strona = formularz.

const CHECK = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export type Krok = { etykieta: string; onClick?: () => void };

// 11.11 (USER_001: logowanie „limonkowo-białe zamiast pomarańczowego”): zorza w barwach kuli Bruno z panelu,
// od czerni na dole przez limonkę do bieli u góry. Akcenty (ptaszki kroków, poświata przycisków) w aurora.module.css (.limonka).


export default function AuroraShell({
  tytul,
  podtytul,
  kroki,
  aktywny,
  etykietaPanelu,
  limonka = true,
  children,
}: {
  /** 11.11: pusty = bez nagłówka w lewym panelu (logowanie: samo logo i kroki). */
  tytul?: string;
  podtytul?: string;
  kroki: Krok[];
  /** Indeks od 0. Kroki przed nim są zrobione. */
  aktywny: number;
  etykietaPanelu: string;
  /** 11.11: limonkowo-biała zorza i akcenty zamiast pomarańczowych. Od 11.11 domyślnie (USER_001: limonka wszędzie). */
  limonka?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`bruno-tlo ${s.root} ${limonka ? s.limonka : ""} ${inter.variable}`}>
      <main className={s.wrap}>
        <section className={s.art} aria-label={etykietaPanelu}>
          <AuroraCanvas fallbackClass={s.artFallback} kolory={limonka ? ZORZA_LIMONKA : ZORZA_POMARANCZ} />
          <div className={s.grain} />
          <div className={s.artInner}>
            {/* 12.11 (USER_001): większy napis, biała kropka między „Sales” a „Bruno”. */}
            <div className={s.logo}>Sales<i aria-hidden="true" />Bruno</div>
            {tytul && <h1>{tytul}</h1>}
            {podtytul && <p className={s.sub}>{podtytul}</p>}
            <ol className={s.steps}>
              {kroki.map((k, i) => {
                const zrobiony = i < aktywny;
                const cls = `${s.step} ${i === aktywny ? s.active : ""} ${zrobiony ? s.done : ""}`;
                const tresc = (
                  <>
                    <span className={s.n}>{zrobiony ? CHECK : i + 1}</span>
                    <span>{k.etykieta}</span>
                  </>
                );
                return (
                  <li key={k.etykieta}>
                    {zrobiony && k.onClick ? (
                      <button type="button" className={cls} onClick={k.onClick}>
                        {tresc}
                      </button>
                    ) : (
                      <div className={cls} aria-current={i === aktywny ? "step" : undefined}>
                        {tresc}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className={s.side}>
          <div className={s.stage}>{children}</div>
        </section>
      </main>
    </div>
  );
}
