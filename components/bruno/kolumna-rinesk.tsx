"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [tekst, setTekst] = useState("");
  const [stan, setStan] = useState<"idle" | "wysylanie" | "ok" | "blad">("idle");
  const wyslij = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tekst.trim().length < 2) return;
    setStan("wysylanie");
    const res = await fetch("/api/bruno/wiadomosc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tekst: `[${t("Ask Bruno", "Zapytaj Bruno")}] ${tekst}` }) });
    setStan(res.ok ? "ok" : "blad");
    if (res.ok) setTekst("");
  };
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

      <h3>{t("Ask Bruno", "Zapytaj Bruno")}</h3>
      <form className="brr-wpis" onSubmit={wyslij}>
        <input value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder={stan === "ok" ? t("Sent. We'll reply by email.", "Wysłane. Odpowiemy mailem.") : t("How do I handle “too expensive”?", "Jak zbić „za drogo”?")} aria-label={t("Ask Bruno", "Zapytaj Bruno")} maxLength={500} />
        <button type="submit" aria-label={t("Send", "Wyślij")} disabled={stan === "wysylanie"}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" /></svg></button>
      </form>
      {stan === "blad" && <small className="brr-blad">{t("Couldn't send. Try again.", "Nie wysłano. Spróbuj jeszcze raz.")}</small>}

      <h3>{t("Train with", "Trenuj z")}</h3>
      <div className="brr-zetony">
        {dane.zetony.map((z) => (
          <Link key={z.href} href={z.href}><i style={{ background: z.kolor }} />{z.nazwa}</Link>
        ))}
      </div>
    </aside>
  );
}
