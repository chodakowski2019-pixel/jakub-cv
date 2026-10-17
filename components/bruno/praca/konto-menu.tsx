"use client";

import { useEffect, useRef, useState } from "react";
import s from "./praca.module.css";

// 17.10 (USER_001, wzór RocketJobs): „Moje konto” po zalogowaniu: imię + e-mail, skróty do panelu, wyloguj.
export default function KontoMenu({ imie, email, typ, logo }: { imie: string; email: string; typ: "kandydat" | "pracodawca"; logo?: string | null }) {
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
  const inicjaly = (imie || email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const pozycje: [string, string, string][] =
    typ === "pracodawca"
      ? [
          ["/praca/panel", "Moje ogłoszenia", "M4 8h16v12H4ZM9 8V5h6v3"],
          ["/praca/panel?z=kandydaci", "Kandydaci", "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.8-3.4 3.3-5.5 6.5-5.5s5.7 2.1 6.5 5.5"],
          ["/praca/panel?z=firma", "Dane firmy", "M5 21V4h10v17M15 9h4v12M8 8h1M11 8h1M8 12h1M11 12h1"],
          ["/praca/panel?z=konto", "Moje konto", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1-4 4-6 8-6s7 2 8 6"],
        ]
      : [
          ["/praca/panel", "Moje zgłoszenia", "M7 3h7l4 4v14H7ZM14 3v4h4"],
          ["/praca/panel?z=zapisane", "Zapisane oferty", "M12 20s-7.5-4.6-9.2-9.4C1.6 7.1 4 4 7.2 4c2 0 3.6 1.1 4.8 2.7C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7.1 21.2 10.6 19.5 15.4 12 20 12 20Z"],
          ["/praca/panel?z=profil", "Profil i CV", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1-4 4-6 8-6s7 2 8 6"],
        ];
  return (
    <div className={s.zaloguj} ref={ref}>
      <button type="button" className={s.kontoBtn} onClick={() => setOtwarte(!otwarte)} aria-expanded={otwarte}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className={s.kontoAvatar} />
        ) : (
          <span className={s.kontoAvatar}>{inicjaly}</span>
        )}
        <span className={s.kontoBtnTekst}>Moje konto</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={otwarte ? s.strzalkaGora : ""}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {otwarte && (
        <div className={`${s.menu} ${s.kontoMenu}`} role="menu">
          <div className={s.kontoMenuGlowa}>
            <b>{imie || "Twoje konto"}</b>
            <span>{email}</span>
          </div>
          <div className={s.kontoMenuLista}>
            {pozycje.map(([h, n, d]) => (
              <a role="menuitem" href={h} key={h}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={d} />
                </svg>
                {n}
              </a>
            ))}
          </div>
          <button
            type="button"
            role="menuitem"
            className={s.kontoWyloguj}
            onClick={async () => {
              await fetch("/api/bruno/praca/konto/wyloguj", { method: "POST" });
              location.href = "/praca";
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
            </svg>
            Wyloguj się
          </button>
        </div>
      )}
    </div>
  );
}
