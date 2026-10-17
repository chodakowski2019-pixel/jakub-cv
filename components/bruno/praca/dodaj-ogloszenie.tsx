"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import KontoForm from "./konto-form";
import s from "./praca.module.css";

// 17.10 (USER_001): „Dodaj ogłoszenie” = okno z zakładaniem konta pracodawcy, po nim panel (zakładka „Dodaj ogłoszenie”).
// Zalogowany pracodawca idzie od razu do panelu.
export default function DodajOgloszenie({ className, zalogowanyPracodawca }: { className?: string; zalogowanyPracodawca?: boolean }) {
  const [otwarte, setOtwarte] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    document.body.style.overflow = otwarte ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    if (otwarte) document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", esc);
    };
  }, [otwarte]);

  if (zalogowanyPracodawca)
    return (
      <a className={className} href="/praca/panel?z=dodaj">
        Dodaj ogłoszenie
      </a>
    );
  return (
    <>
      <button type="button" ref={ref} className={className} onClick={() => setOtwarte(true)}>
        Dodaj ogłoszenie
      </button>
      {otwarte &&
        createPortal(
          <div className={s.tlo} onClick={(e) => e.target === e.currentTarget && setOtwarte(false)} role="dialog" aria-modal="true" aria-label="Załóż konto firmy">
            <div className={`${s.okno} ${s.oknoAplikuj}`}>
              <button type="button" className={s.zamknijX} onClick={() => setOtwarte(false)} aria-label="Zamknij">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <KontoForm typ="pracodawca" tryb="rejestracja" jedenTyp dalej="/praca/panel?z=dodaj" />
            </div>
          </div>,
          (ref.current?.closest(`.${s.root}`) as HTMLElement | null) ?? document.body,
        )}
    </>
  );
}
