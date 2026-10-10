"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ikona, linkiDla, useWyloguj } from "@/components/podglad/panel/wspolne";

// 10.10 (USER_001: „cały ten Bruno się zmienia”): pasek czarno-złoty dla wszystkich ekranów panelu
// poza /bruno/panel (tam pasek rysuje sam panel). Ten sam wygląd: kółko z inicjałem na górze,
// ikony z prawdziwego menu, „Ogień” tylko przy pełnym dostępie, „Statystyki” nie dla free (10.10),
// wyloguj na dole. Na telefonie: górna belka + zakładki poziomo.
// Konto free: zamiast „Odblokuj pełen dostęp” jest licznik „Bezpłatne rozmowy X / 3” → Bruno Pro.

export default function PasekZloty({ dostep, inicjal, free }: { dostep: { ogien: boolean; statystyki: boolean }; inicjal: string; free?: { zuzyte: number; zostalo: number } | null }) {
  const sciezka = usePathname() ?? "";
  const wyloguj = useWyloguj();
  const linki = linkiDla(dostep);
  const aktywny = (href: string) => sciezka === href || sciezka.startsWith(`${href}/`);

  return (
    <>
      <aside className="bz-pasek" aria-label="Main menu">
        <Link href="/bruno/panel" className="bz-ja" title="Home" aria-label="Home">{inicjal}</Link>
        {linki.map((l) => (
          <span key={l.href} style={{ display: "contents" }}>
            {l.ikona === "dostosuj" && <div className="bz-sep" />}
            <Link href={l.href} className={`bz-nav ${aktywny(l.href) ? "bz-on" : ""}`} aria-label={l.nazwa} title={l.nazwa} aria-current={aktywny(l.href) ? "page" : undefined}>
              <Ikona nazwa={l.ikona} />
            </Link>
          </span>
        ))}
        <div className="bz-rosnie" />
        <button type="button" className="bz-nav" aria-label="Log out" title="Log out" onClick={wyloguj}><Ikona nazwa="wyjscie" /></button>
      </aside>

      <header className="bz-gora">
        <Link href="/bruno/panel" className="bz-ja bz-ja-tel" aria-label="Home">{inicjal}</Link>
        <Link href="/bruno/odblokuj" className="bz-odblokuj" aria-current={aktywny("/bruno/odblokuj") ? "page" : undefined}>
          <Ikona nazwa="klodka" rozmiar={15} grubosc={2} />
          {free ? (
            <>
              <span className="bz-dlugi">Free calls: {free.zuzyte} / {free.zuzyte + free.zostalo} · Bruno Pro</span>
              <span className="bz-krotki">{free.zuzyte} / {free.zuzyte + free.zostalo} · Pro</span>
            </>
          ) : (
            <>
              <span className="bz-dlugi">Unlock full access</span>
              <span className="bz-krotki">Unlock</span>
            </>
          )}
        </Link>
        <button type="button" className="bz-wyl" onClick={wyloguj} aria-label="Log out"><Ikona nazwa="wyjscie" rozmiar={18} /></button>
        <nav className="bz-zakladki" aria-label="Main menu">
          {linki.map((l) => (
            <Link key={l.href} href={l.href} className={aktywny(l.href) ? "bz-on" : ""} aria-current={aktywny(l.href) ? "page" : undefined}>{l.nazwa}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}
