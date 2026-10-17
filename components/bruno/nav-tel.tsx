"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Ikona, linkiDla, useWyloguj } from "@/components/podglad/panel/wspolne";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 14.10 (USER_001: „na telefonie nie może być jak na laptopkach”): panel na telefonie jak aplikacja.
// Górna belka: inicjał + mała złota pigułka (Bruno Pro / licznik free). Dolny pasek: 4 główne zakładki
// + „Więcej” (arkusz z resztą: Ogień, Statystyki, Kalendarz, Dostosuj, Ustawienia, Wyloguj).
// Widoczne tylko do 860 px (CSS w app/bruno/bruno.css, klasy bt-*). Na komputerze bez zmian.

const GLOWNE = ["/bruno/panel", "/bruno/rozmowa", "/bruno/trening", "/bruno/feedback"];

export default function NavTel({ dostep, inicjal, free }: { dostep: { ogien: boolean; statystyki: boolean }; inicjal: string; free?: { zuzyte: number; zostalo: number } | null }) {
  const sciezka = usePathname() ?? "";
  const wyloguj = useWyloguj();
  const { t, jezyk } = useT();
  const [wiecej, setWiecej] = useState(false);
  const linki = linkiDla(dostep, jezyk);
  const glowne = GLOWNE.map((h) => linki.find((l) => l.href === h)).filter((l): l is (typeof linki)[number] => Boolean(l));
  const reszta = linki.filter((l) => !GLOWNE.includes(l.href));
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
        <Link href="/bruno/panel" className="bt-ja" aria-label={t("Home", "Panel")}>{inicjal}</Link>
        <Link href="/bruno/odblokuj" className="bt-pro" aria-current={aktywny("/bruno/odblokuj") ? "page" : undefined}>
          <Ikona nazwa="klodka" rozmiar={14} grubosc={2} />
          {/* 17.10: Bruno tylko B2B, zamiast „Bruno Pro” = „Zespół” (strona Bruno dla zespołu + kalendarz). */}
          {free ? `${free.zuzyte} / ${free.zuzyte + free.zostalo} · ${t("Team", "Zespół")}` : t("Unlock", "Odblokuj")}
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
