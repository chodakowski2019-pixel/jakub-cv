"use client";

import { useEffect, useRef, useState } from "react";
import s from "./bruno-lp.module.css";

// Kraje (USER_001 9.10): USA (domyślnie), Polska, UK na górze, reszta alfabetycznie.
// Flagi = pliki SVG w /public/flags (z country-flag-icons, 3x2), ładowane jako <img>,
// żeby nie wciągać do strony wszystkich flag jako kodu.
// max = maks. liczba cyfr numeru bez kierunkowego. wzor = jak wyświetlać (# = cyfra),
// null = grupy po 3 cyfry.
type Kraj = { kod: string; nazwa: string; prefiks: string; max: number; wzor: string | null };

export const KRAJE: Kraj[] = [
  { kod: "US", nazwa: "United States", prefiks: "+1", max: 10, wzor: "(###) ###-####" },
  { kod: "PL", nazwa: "Poland", prefiks: "+48", max: 9, wzor: "### ### ###" },
  { kod: "GB", nazwa: "United Kingdom", prefiks: "+44", max: 10, wzor: "#### ######" },
  { kod: "AR", nazwa: "Argentina", prefiks: "+54", max: 10, wzor: null },
  { kod: "AU", nazwa: "Australia", prefiks: "+61", max: 9, wzor: "### ### ###" },
  { kod: "AT", nazwa: "Austria", prefiks: "+43", max: 11, wzor: null },
  { kod: "BE", nazwa: "Belgium", prefiks: "+32", max: 9, wzor: "### ## ## ##" },
  { kod: "BR", nazwa: "Brazil", prefiks: "+55", max: 11, wzor: "(##) #####-####" },
  { kod: "BG", nazwa: "Bulgaria", prefiks: "+359", max: 9, wzor: null },
  { kod: "CA", nazwa: "Canada", prefiks: "+1", max: 10, wzor: "(###) ###-####" },
  { kod: "CL", nazwa: "Chile", prefiks: "+56", max: 9, wzor: null },
  { kod: "CN", nazwa: "China", prefiks: "+86", max: 11, wzor: "### #### ####" },
  { kod: "CO", nazwa: "Colombia", prefiks: "+57", max: 10, wzor: null },
  { kod: "HR", nazwa: "Croatia", prefiks: "+385", max: 9, wzor: null },
  { kod: "CY", nazwa: "Cyprus", prefiks: "+357", max: 8, wzor: null },
  { kod: "CZ", nazwa: "Czech Republic", prefiks: "+420", max: 9, wzor: "### ### ###" },
  { kod: "DK", nazwa: "Denmark", prefiks: "+45", max: 8, wzor: "## ## ## ##" },
  { kod: "EG", nazwa: "Egypt", prefiks: "+20", max: 10, wzor: null },
  { kod: "EE", nazwa: "Estonia", prefiks: "+372", max: 8, wzor: null },
  { kod: "FI", nazwa: "Finland", prefiks: "+358", max: 10, wzor: null },
  { kod: "FR", nazwa: "France", prefiks: "+33", max: 9, wzor: "# ## ## ## ##" },
  { kod: "DE", nazwa: "Germany", prefiks: "+49", max: 11, wzor: null },
  { kod: "GR", nazwa: "Greece", prefiks: "+30", max: 10, wzor: null },
  { kod: "HK", nazwa: "Hong Kong", prefiks: "+852", max: 8, wzor: "#### ####" },
  { kod: "HU", nazwa: "Hungary", prefiks: "+36", max: 9, wzor: null },
  { kod: "IS", nazwa: "Iceland", prefiks: "+354", max: 7, wzor: null },
  { kod: "IN", nazwa: "India", prefiks: "+91", max: 10, wzor: "##### #####" },
  { kod: "ID", nazwa: "Indonesia", prefiks: "+62", max: 11, wzor: null },
  { kod: "IE", nazwa: "Ireland", prefiks: "+353", max: 9, wzor: "## ### ####" },
  { kod: "IL", nazwa: "Israel", prefiks: "+972", max: 9, wzor: null },
  { kod: "IT", nazwa: "Italy", prefiks: "+39", max: 10, wzor: "### ### ####" },
  { kod: "JP", nazwa: "Japan", prefiks: "+81", max: 10, wzor: null },
  { kod: "KE", nazwa: "Kenya", prefiks: "+254", max: 9, wzor: null },
  { kod: "LV", nazwa: "Latvia", prefiks: "+371", max: 8, wzor: null },
  { kod: "LT", nazwa: "Lithuania", prefiks: "+370", max: 8, wzor: null },
  { kod: "LU", nazwa: "Luxembourg", prefiks: "+352", max: 9, wzor: null },
  { kod: "MY", nazwa: "Malaysia", prefiks: "+60", max: 10, wzor: null },
  { kod: "MT", nazwa: "Malta", prefiks: "+356", max: 8, wzor: null },
  { kod: "MX", nazwa: "Mexico", prefiks: "+52", max: 10, wzor: null },
  { kod: "MA", nazwa: "Morocco", prefiks: "+212", max: 9, wzor: null },
  { kod: "NL", nazwa: "Netherlands", prefiks: "+31", max: 9, wzor: "# ## ## ## ##" },
  { kod: "NZ", nazwa: "New Zealand", prefiks: "+64", max: 9, wzor: null },
  { kod: "NG", nazwa: "Nigeria", prefiks: "+234", max: 10, wzor: null },
  { kod: "NO", nazwa: "Norway", prefiks: "+47", max: 8, wzor: "### ## ###" },
  { kod: "PK", nazwa: "Pakistan", prefiks: "+92", max: 10, wzor: null },
  { kod: "PH", nazwa: "Philippines", prefiks: "+63", max: 10, wzor: null },
  { kod: "PT", nazwa: "Portugal", prefiks: "+351", max: 9, wzor: "### ### ###" },
  { kod: "QA", nazwa: "Qatar", prefiks: "+974", max: 8, wzor: null },
  { kod: "RO", nazwa: "Romania", prefiks: "+40", max: 9, wzor: null },
  { kod: "SA", nazwa: "Saudi Arabia", prefiks: "+966", max: 9, wzor: null },
  { kod: "RS", nazwa: "Serbia", prefiks: "+381", max: 9, wzor: null },
  { kod: "SG", nazwa: "Singapore", prefiks: "+65", max: 8, wzor: "#### ####" },
  { kod: "SK", nazwa: "Slovakia", prefiks: "+421", max: 9, wzor: "### ### ###" },
  { kod: "SI", nazwa: "Slovenia", prefiks: "+386", max: 8, wzor: null },
  { kod: "ZA", nazwa: "South Africa", prefiks: "+27", max: 9, wzor: "## ### ####" },
  { kod: "KR", nazwa: "South Korea", prefiks: "+82", max: 10, wzor: null },
  { kod: "ES", nazwa: "Spain", prefiks: "+34", max: 9, wzor: "### ### ###" },
  { kod: "SE", nazwa: "Sweden", prefiks: "+46", max: 9, wzor: "## ### ## ##" },
  { kod: "CH", nazwa: "Switzerland", prefiks: "+41", max: 9, wzor: "## ### ## ##" },
  { kod: "TW", nazwa: "Taiwan", prefiks: "+886", max: 9, wzor: null },
  { kod: "TH", nazwa: "Thailand", prefiks: "+66", max: 9, wzor: null },
  { kod: "TR", nazwa: "Turkey", prefiks: "+90", max: 10, wzor: "### ### ## ##" },
  { kod: "UA", nazwa: "Ukraine", prefiks: "+380", max: 9, wzor: "## ### ## ##" },
  { kod: "AE", nazwa: "United Arab Emirates", prefiks: "+971", max: 9, wzor: "## ### ####" },
  { kod: "VN", nazwa: "Vietnam", prefiks: "+84", max: 10, wzor: null },
];

/** Numer z cyframi → wyświetlany wg wzoru kraju; urywa się na ostatniej wpisanej cyfrze. */
export function formatuj(cyfry: string, kraj: Kraj): string {
  if (!cyfry) return "";
  if (!kraj.wzor) return cyfry.replace(/(\d{3})(?=\d)/g, "$1 ");
  let wynik = "";
  let i = 0;
  for (const z of kraj.wzor) {
    if (i >= cyfry.length) break;
    if (z === "#") wynik += cyfry[i++];
    else wynik += z;
  }
  return wynik;
}

/** Wpis użytkownika → same cyfry, bez zera na początku (poza USA i Kanadą), przycięte do limitu. */
export function oczysc(wpis: string, kraj: Kraj): string {
  let c = wpis.replace(/\D/g, "");
  if (kraj.prefiks !== "+1" && c.startsWith("0")) c = c.slice(1);
  return c.slice(0, kraj.max);
}

export default function TelefonFlaga({
  id,
  kraj,
  numer,
  onKraj,
  onNumer,
  placeholder,
}: {
  id: string;
  kraj: string;
  numer: string;
  onKraj: (kod: string) => void;
  onNumer: (n: string) => void;
  placeholder?: string;
}) {
  const [otwarte, setOtwarte] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const wybrany = KRAJE.find((k) => k.kod === kraj) ?? KRAJE[0];

  useEffect(() => {
    if (!otwarte) return;
    const zamknij = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOtwarte(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    document.addEventListener("mousedown", zamknij);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", zamknij);
      window.removeEventListener("keydown", esc);
    };
  }, [otwarte]);

  return (
    <div className={s.tel} ref={ref}>
      <button type="button" className={s.telKraj} aria-haspopup="listbox" aria-expanded={otwarte} onClick={() => setOtwarte((o) => !o)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/flags/${wybrany.kod}.svg`} alt={wybrany.nazwa} className={s.telFlaga} width={24} height={16} />
        {/* 9.10 (USER_001): numer kierunkowy tylko na rozwiniętej liście, nie przy fladze. */}
        <span className={s.telStrzalka} aria-hidden>▾</span>
      </button>
      <input
        id={id}
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={s.telNumer}
        placeholder={placeholder}
        value={formatuj(numer, wybrany)}
        onChange={(e) => onNumer(oczysc(e.target.value, wybrany))}
        maxLength={(wybrany.wzor ?? "").length || wybrany.max + 4}
      />
      {otwarte && (
        <ul className={s.telLista} role="listbox" aria-label="Country">
          {KRAJE.map((k) => (
            <li key={k.kod}>
              <button
                type="button"
                role="option"
                aria-selected={k.kod === kraj}
                className={`${s.telOpcja} ${k.kod === kraj ? s.telOpcjaOn : ""}`}
                onClick={() => {
                  onKraj(k.kod);
                  onNumer(oczysc(numer, k));
                  setOtwarte(false);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/flags/${k.kod}.svg`} alt="" className={s.telFlaga} width={24} height={16} loading="lazy" />
                <span className={s.telNazwa}>{k.nazwa}</span>
                <span className={s.telPref}>{k.prefiks}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
