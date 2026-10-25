"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type DostepLinkow, Ikona, linkiDla, useWyloguj } from "@/components/podglad/panel/wspolne";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 10.10 (USER_001: „cały ten Bruno się zmienia”): pasek czarno-złoty dla wszystkich ekranów panelu
// poza /bruno/panel (tam pasek rysuje sam panel). Ten sam wygląd: kółko z inicjałem na górze,
// ikony z prawdziwego menu, „Ogień” tylko przy pełnym dostępie, „Statystyki” nie dla free (10.10),
// wyloguj na dole. Na telefonie: górna belka + zakładki poziomo.
// 25.10 (USER_001): bez „Odblokuj pełen dostęp”. W jego miejscu szef ma przełącznik widoku szef ↔ handlowiec.
// Konto z firmą: w kółku logo firmy zamiast inicjału.

export type Logo = { url: string | null; nazwa: string } | null;

export function Inicjal({ inicjal, logo, className }: { inicjal: string; logo?: Logo; className: string }) {
  return (
    <>
      {logo?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.url} alt={logo.nazwa} className={`${className} bz-logo`} />
      ) : (
        <span className={className}>{inicjal}</span>
      )}
    </>
  );
}

export default function PasekZloty({ dostep, inicjal, logo = null }: { dostep: DostepLinkow; inicjal: string; free?: { zuzyte: number; zostalo: number } | null; logo?: Logo }) {
  const sciezka = usePathname() ?? "";
  const wyloguj = useWyloguj();
  const { t, jezyk } = useT();
  const linki = linkiDla(dostep, jezyk);
  const aktywny = (href: string) => sciezka === href || sciezka.startsWith(`${href}/`);
  const dom = dostep.szef ? "/bruno/szef" : "/bruno/panel";

  return (
    <>
      <aside className="bz-pasek" aria-label={t("Main menu", "Panel")}>
        <Link href={dom} className="bz-ja-link" title={logo?.nazwa ?? t("Home", "Panel")} aria-label={logo?.nazwa ?? t("Home", "Panel")}>
          <Inicjal inicjal={inicjal} logo={logo} className="bz-ja" />
        </Link>
        {linki.map((l) => (
          <span key={l.href} style={{ display: "contents" }}>
            {l.ikona === "ustawienia" && <div className="bz-sep" />}
            <Link href={l.href} className={`bz-nav ${aktywny(l.href) ? "bz-on" : ""}`} aria-label={l.nazwa} title={l.nazwa} aria-current={aktywny(l.href) ? "page" : undefined}>
              <Ikona nazwa={l.ikona} />
            </Link>
          </span>
        ))}
        <div className="bz-rosnie" />
        <button type="button" className="bz-nav" aria-label={t("Log out", "Wyloguj")} title={t("Log out", "Wyloguj")} onClick={wyloguj}><Ikona nazwa="wyjscie" /></button>
      </aside>

      <header className="bz-gora">
        <Link href={dom} className="bz-ja-link bz-ja-tel-link" aria-label={t("Home", "Panel")}>
          <Inicjal inicjal={inicjal} logo={logo} className="bz-ja bz-ja-tel" />
        </Link>
        {/* 25.10 (USER_001): bez przycisku „Widok handlowca / Widok szefa”. */}
        <span className="bz-rosnie" />
        <button type="button" className="bz-wyl" onClick={wyloguj} aria-label={t("Log out", "Wyloguj")}><Ikona nazwa="wyjscie" rozmiar={18} /></button>
        <nav className="bz-zakladki" aria-label={t("Main menu", "Panel")}>
          {linki.map((l) => (
            <Link key={l.href} href={l.href} className={aktywny(l.href) ? "bz-on" : ""} aria-current={aktywny(l.href) ? "page" : undefined}>{l.nazwa}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}
