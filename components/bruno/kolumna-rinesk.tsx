"use client";

import Link from "next/link";
import { Ikona } from "@/components/podglad/panel/wspolne";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 27.10 (USER_001: „po prawej chcę taki pasek” = prawa kolumna Alexatel z /podglad/bruno-panel-vaulto-jasny):
// „Rozmowa z Bruno” + „+ Start” i lawendowa karta (zdjęcie / inicjał, „Bruno · klient X”, słuchawka),
// „Wiadomości” (prawdziwe: szef = ostatnia oceniona rozmowa każdego handlowca, handlowiec = ostatnie oceny Bruno
// z poprawką), „Zapytaj Bruno” (wysyła wiadomość tym samym API co dymek czatu), „Trenuj z” (żetony = typy klienta).
// Dane liczy app/bruno/layout.tsx (serwer). Widoczna na /bruno/panel i /bruno/szef, CSS chowa ją na telefonie.

export type Wiadomosc = { imie: string; zdjecie: string | null; tekst: string; href: string };
export type Zeton = { nazwa: string; kolor: string; href: string };
export type DaneKolumny = { postac: string; zdjecie: string | null; inicjal: string; wiadomosci: Wiadomosc[]; zetony: Zeton[] };

export default function KolumnaRinesk({ dane }: { dane: DaneKolumny }) {
  const { t } = useT();
  return (
    <aside className="brr" aria-label={t("Talk to Bruno", "Rozmowa z Bruno")}>
      <div className="brr-hd"><h3>{t("Talk to Bruno", "Rozmowa z Bruno")}</h3><Link href="/bruno/rozmowa" className="brr-plus">+ {t("Start", "Start")}</Link></div>
      <Link href="/bruno/rozmowa" className="brr-operator">
        {dane.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dane.zdjecie} alt="" />
        ) : (
          <span className="brr-aw">{dane.inicjal}</span>
        )}
        <b>Bruno · {dane.postac}</b>
        <Ikona nazwa="test" rozmiar={17} grubosc={1.8} />
        <i>⋮</i>
      </Link>

      <h3>{t("Messages", "Wiadomości")}</h3>
      {dane.wiadomosci.length ? (
        <ul className="brr-wiad">
          {dane.wiadomosci.map((w, i) => (
            <li key={i}>
              <Link href={w.href}>
                {w.zdjecie ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.zdjecie} alt="" />
                ) : (
                  <span className="brr-aw brr-aw-sz">{w.imie[0]}</span>
                )}
                <div><b>{w.imie}</b><small>{w.tekst}</small></div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="brr-pusto">{t("After the first scored call Bruno writes here what to fix.", "Po pierwszej ocenionej rozmowie Bruno napisze tu, co poprawić.")}</p>
      )}

      {/* 27.10 (USER_001): „Zapytaj Bruno” i „Trenuj z” usunięte (pytania idą przez dymek czatu w rogu). */}
    </aside>
  );
}
