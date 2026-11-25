"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KodPrzycisk } from "./kod";

// Baner promocji Black Week na podstronie narzędzia (czarna tablica jak na /ai/black-week).
// Strona jest statyczna, więc po dacie `koniec` baner chowa przeglądarka.
export function PromoBaner(p: {
  rabatPrzed: string;
  rabatLiczba: number;
  opis: string;
  doTekst: string;
  koniec: string;
  kody: { etykieta: string; kod: string }[];
  link: string;
  reklama: boolean;
  sprawdzono: string;
  wszystkie: string;
}) {
  const [po, setPo] = useState(false);
  useEffect(() => setPo(Date.now() > new Date(p.koniec).getTime()), [p.koniec]);
  if (po) return null;
  return (
    <aside className="bai-promo" aria-label="Promocja Black Week">
      <div className="bai-promo-lewa">
        <p className="bai-tab-nad">Black Week 2026 · {p.doTekst ? `do ${p.doTekst}` : "bez daty końca"}</p>
        <p className="bai-promo-rabat">
          {p.rabatPrzed && <span>{p.rabatPrzed}</span>}
          <b>{p.rabatLiczba}%</b>
        </p>
        <p className="bai-promo-opis">{p.opis}</p>
        <p className="bai-promo-meta">Sprawdzone u producenta: {p.sprawdzono}</p>
      </div>
      <div className="bai-promo-prawa">
        {p.kody.map((x) => (
          <KodPrzycisk key={x.kod} etykieta={x.etykieta} kod={x.kod} />
        ))}
        <a href={p.link} target="_blank" rel={p.reklama ? "sponsored noopener noreferrer" : "noopener noreferrer"} className="bai-przycisk bai-przycisk-maly">
          Przejdź do oferty{p.reklama ? "*" : ""}
        </a>
        {p.reklama && <span className="bai-of-reklama">* Reklama: link partnerski</span>}
        <Link href={p.wszystkie} className="bai-promo-link">
          Wszystkie promocje
        </Link>
      </div>
    </aside>
  );
}
