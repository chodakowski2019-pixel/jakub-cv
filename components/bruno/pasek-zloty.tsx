"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ikona, linkiDla, useWyloguj } from "@/components/podglad/panel/wspolne";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 10.10 (USER_001: „cały ten Bruno się zmienia”): pasek czarno-złoty dla wszystkich ekranów panelu
// poza /bruno/panel (tam pasek rysuje sam panel). Ten sam wygląd: kółko z inicjałem na górze,
// ikony z prawdziwego menu, „Ogień” tylko przy pełnym dostępie, „Statystyki” nie dla free (10.10),
// wyloguj na dole. Na telefonie: górna belka + zakładki poziomo.
// Konto free: zamiast „Odblokuj pełen dostęp” jest licznik „Bezpłatne rozmowy X / 3” → Bruno Pro.

export default function PasekZloty({ dostep, inicjal, free }: { dostep: { ogien: boolean; statystyki: boolean }; inicjal: string; free?: { zuzyte: number; zostalo: number } | null }) {
  const sciezka = usePathname() ?? "";
  const wyloguj = useWyloguj();
  const { t, jezyk } = useT();
  const linki = linkiDla(dostep, jezyk);
  const aktywny = (href: string) => sciezka === href || sciezka.startsWith(`${href}/`);

  return (
    <>
      <aside className="bz-pasek" aria-label={t("Main menu", "Panel")}>
        <Link href="/bruno/panel" className="bz-ja" title={t("Home", "Panel")} aria-label={t("Home", "Panel")}>{inicjal}</Link>
        {linki.map((l) => (
          <span key={l.href} style={{ display: "contents" }}>
            {l.ikona === "dostosuj" && <div className="bz-sep" />}
            <Link href={l.href} className={`bz-nav ${aktywny(l.href) ? "bz-on" : ""}`} aria-label={l.nazwa} title={l.nazwa} aria-current={aktywny(l.href) ? "page" : undefined}>
              <Ikona nazwa={l.ikona} />
            </Link>
          </span>
        ))}
        <div className="bz-rosnie" />
        <button type="button" className="bz-nav" aria-label={t("Log out", "Wyloguj")} title={t("Log out", "Wyloguj")} onClick={wyloguj}><Ikona nazwa="wyjscie" /></button>
      </aside>

      <header className="bz-gora">
        <Link href="/bruno/panel" className="bz-ja bz-ja-tel" aria-label={t("Home", "Panel")}>{inicjal}</Link>
        <Link href="/bruno/odblokuj" className="bz-odblokuj" aria-current={aktywny("/bruno/odblokuj") ? "page" : undefined}>
          <Ikona nazwa="klodka" rozmiar={15} grubosc={2} />
          {free ? (
            <>
              {/* 17.10 (USER_001): Bruno tylko B2B, zamiast Bruno Pro = „Bruno dla zespołu” (rozmowa z Jakubem). */}
              {/* 18.10 (USER_001): konto demo = sam napis „Bruno dla zespołu”, bez licznika. */}
              {free.zuzyte + free.zostalo === 1 ? (
                <span>{t("Bruno for your team", "Bruno dla zespołu")}</span>
              ) : (
                <>
                  <span className="bz-dlugi">{t("Free calls", "Bezpłatne rozmowy")}: {free.zuzyte} / {free.zuzyte + free.zostalo} · {t("Bruno for your team", "Bruno dla zespołu")}</span>
                  <span className="bz-krotki">{free.zuzyte} / {free.zuzyte + free.zostalo} · {t("Team", "Zespół")}</span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="bz-dlugi">{t("Unlock full access", "Odblokuj pełen dostęp")}</span>
              <span className="bz-krotki">{t("Unlock", "Odblokuj")}</span>
            </>
          )}
        </Link>
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
