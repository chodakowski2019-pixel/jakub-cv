"use client";

import { useEffect, useRef, useState } from "react";
import s from "./praca.module.css";

// 17.10 (USER_001, wzór RocketJobs): „Zaloguj się” = menu Kandydat / Pracodawca.
// Kandydat = konto Bruno (panel PL na salesbruno.pl). Pracodawca = strona /praca/pracodawca (panelu firm jeszcze nie ma).
// Na telefonie przycisk prowadzi do strony wyboru /praca/zaloguj (dwie duże karty).
export const LINKI = {
  kandydatLogin: "https://salesbruno.pl/login?src=praca",
  kandydatRejestracja: "https://salesbruno.pl/rejestracja?src=praca",
  pracodawcaLogin: "/praca/pracodawca",
  pracodawcaRejestracja: "/praca/pracodawca#dodaj",
};

export const IKONA_KANDYDAT = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6.5 18.5c1.2-2.3 3.2-3.5 5.5-3.5s4.3 1.2 5.5 3.5";
export const IKONA_PRACODAWCA = "M3 5h18v11H3ZM8 20h8M12 16v4";

const Ikona = ({ d }: { d: string }) => (
  <span className={s.menuIkona}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  </span>
);

export default function ZalogujMenu() {
  const [otwarte, setOtwarte] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!otwarte) return;
    const zamknij = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOtwarte(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    document.addEventListener("mousedown", zamknij);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", zamknij);
      document.removeEventListener("keydown", esc);
    };
  }, [otwarte]);

  return (
    <div className={s.zaloguj} ref={ref}>
      <a
        className={s.navCta}
        href="/praca/zaloguj"
        aria-expanded={otwarte}
        onClick={(e) => {
          // Na komputerze menu, na telefonie strona wyboru.
          if (window.matchMedia("(min-width: 601px)").matches) {
            e.preventDefault();
            setOtwarte(!otwarte);
          }
        }}
      >
        Zaloguj się
      </a>
      {otwarte && (
        <div className={s.menu} role="menu">
          <div className={s.menuGrupa}>
            <p className={s.menuH}>
              <Ikona d={IKONA_KANDYDAT} />
              Kandydat
            </p>
            <a role="menuitem" href={LINKI.kandydatLogin}>Zaloguj się jako kandydat</a>
            <a role="menuitem" href={LINKI.kandydatRejestracja}>Zarejestruj się jako kandydat</a>
          </div>
          <div className={s.menuGrupa}>
            <p className={s.menuH}>
              <Ikona d={IKONA_PRACODAWCA} />
              Pracodawca
            </p>
            <a role="menuitem" href={LINKI.pracodawcaLogin}>Zaloguj się jako pracodawca</a>
            <a role="menuitem" href={LINKI.pracodawcaRejestracja}>Zarejestruj się jako pracodawca</a>
          </div>
        </div>
      )}
    </div>
  );
}
