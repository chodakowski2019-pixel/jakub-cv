"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type DostepLinkow, Ikona, linkiDla, useWyloguj } from "@/components/podglad/panel/wspolne";
import { useT } from "@/components/bruno/jezyk-kontekst";
import { Inicjal, type Logo } from "@/components/bruno/pasek-zloty";

// 14.10 (USER_001: „na telefonie nie może być jak na laptopkach”): panel na telefonie jak aplikacja.
// Górna belka: inicjał + mała złota pigułka. Dolny pasek: 4 główne zakładki
// + „Więcej” (arkusz z resztą: Ogień, Statystyki, Kalendarz, Dostosuj, Ustawienia, Wyloguj).
// Widoczne tylko do 860 px (CSS w app/bruno/bruno.css, klasy bt-*). Na komputerze bez zmian.
// 25.10 (USER_001): pigułka = przełącznik widoku szefa (bez „Odblokuj”). Szef ma „Zespół” w dolnym pasku.

const GLOWNE = ["/bruno/panel", "/bruno/rozmowa", "/bruno/trening", "/bruno/feedback"];
const GLOWNE_SZEFA = ["/bruno/szef", "/bruno/panel", "/bruno/rozmowa", "/bruno/feedback"];

export default function NavTel({ dostep, inicjal, logo = null }: { dostep: DostepLinkow; inicjal: string; free?: { zuzyte: number; zostalo: number } | null; logo?: Logo }) {
  const sciezka = usePathname() ?? "";
  const wyloguj = useWyloguj();
  const { t, jezyk } = useT();
  const [wiecej, setWiecej] = useState(false);
  const linki = linkiDla(dostep, jezyk);
  const glowneHref = dostep.szef ? GLOWNE_SZEFA : GLOWNE;
  const glowne = glowneHref.map((h) => linki.find((l) => l.href === h)).filter((l): l is (typeof linki)[number] => Boolean(l));
  const reszta = linki.filter((l) => !glowneHref.includes(l.href));
  const aktywny = (href: string) => sciezka === href || sciezka.startsWith(`${href}/`);
  const wReszcie = reszta.some((l) => aktywny(l.href));

  // Arkusz zamyka się przy zmianie adresu i na Escape; pod spodem strona się nie przewija.
  useEffect(() => setWiecej(false), [sciezka]);
  useEffect(() => {
    if (!wiecej) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setWiecej(false);
    window.addEventListener("keydown", esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = overflow;
    };
  }, [wiecej]);

  return (
    <>
      <header className="bt-gora">
        <Link href={dostep.szef ? "/bruno/szef" : "/bruno/panel"} className="bt-ja-link" aria-label={t("Home", "Panel")}>
          <Inicjal inicjal={inicjal} logo={logo} className="bt-ja" />
        </Link>
      </header>

      <nav className="bt-dol" aria-label={t("Main menu", "Panel")}>
        {glowne.map((l) => (
          <Link key={l.href} href={l.href} className={aktywny(l.href) ? "bt-on" : ""} aria-current={aktywny(l.href) ? "page" : undefined}>
            <Ikona nazwa={l.ikona} rozmiar={22} />
            <span>{l.nazwa}</span>
          </Link>
        ))}
        <button type="button" className={wiecej || wReszcie ? "bt-on" : ""} onClick={() => setWiecej((v) => !v)} aria-expanded={wiecej} aria-controls="bt-arkusz">
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          <span>{t("More", "Więcej")}</span>
        </button>
      </nav>

      {wiecej && (
        <>
          <div className="bt-arkusz-tlo" onClick={() => setWiecej(false)} role="presentation" />
          <div className="bt-arkusz" id="bt-arkusz" role="dialog" aria-modal="true" aria-label={t("More", "Więcej")}>
            <div className="bt-uchwyt" aria-hidden />
            {reszta.map((l) => (
              <Link key={l.href} href={l.href} className={aktywny(l.href) ? "bt-on" : ""} aria-current={aktywny(l.href) ? "page" : undefined}>
                <Ikona nazwa={l.ikona} rozmiar={22} />
                <span>{l.nazwa}</span>
              </Link>
            ))}
            <button type="button" onClick={wyloguj}>
              <Ikona nazwa="wyjscie" rozmiar={22} />
              <span>{t("Log out", "Wyloguj")}</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
