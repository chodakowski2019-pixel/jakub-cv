"use client";

import AuroraCanvas from "./aurora-canvas";
import s from "./aurora.module.css";
import { inter } from "./font";

// Układ wzoru aurora-onboard.html: lewy panel z zorzą i krokami, prawa strona = formularz.

const CHECK = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export type Krok = { etykieta: string; onClick?: () => void };

export default function AuroraShell({
  tytul,
  podtytul,
  kroki,
  aktywny,
  etykietaPanelu,
  children,
}: {
  tytul: string;
  podtytul?: string;
  kroki: Krok[];
  /** Indeks od 0. Kroki przed nim są zrobione. */
  aktywny: number;
  etykietaPanelu: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${s.root} ${inter.variable}`}>
      <main className={s.wrap}>
        <section className={s.art} aria-label={etykietaPanelu}>
          <AuroraCanvas fallbackClass={s.artFallback} />
          <div className={s.grain} />
          <div className={s.artInner}>
            <div className={s.logo}>
              <i />
              Bruno AI
            </div>
            <h1>{tytul}</h1>
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
