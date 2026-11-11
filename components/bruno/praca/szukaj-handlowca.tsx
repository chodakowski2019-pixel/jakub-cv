"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import KulaLimonka from "@/components/bruno/kula-limonka";
import g from "./gielda.module.css";

// 12.11 (USER_001: „jak w CRM ten kokpit, wyszukiwarka z kulą Bruno, opisz jakiego handlowca szukasz”):
// ekran startowy panelu firmy. Kula, powitanie, pole jak w czacie Bruno (klasy bcz-*), przykłady pod spodem.
// Wysłanie = <adres><opis> (panel: /praca/panel?z=szukaj&q=, strona publiczna: /wyszukiwarka?q=); serwer zamienia opis na filtry
// (lib/bruno/praca/opis-szukania.ts).
export const ADRES_PANELU = "/praca/panel?z=szukaj&q=";

const PRZYKLADY = ["Handlowiec OZE z Warszawy, min. 3 lata, B2B", "Doradca kredytowy w Krakowie, praca w terenie", "Przedstawiciel medyczny, Poznań, od zaraz"];

export function PoleSzukania({ start = "", male = false, adres = ADRES_PANELU }: { start?: string; /** Nad wynikiem: pole bez kuli i powitania. */ male?: boolean; adres?: string }) {
  const router = useRouter();
  const [tekst, setTekst] = useState(start);
  const [wysylam, setWysylam] = useState(false);
  const szukaj = (opis: string) => {
    const q = opis.trim();
    if (q.length < 2) return;
    setWysylam(true);
    router.push(`${adres}${encodeURIComponent(q)}`);
  };
  return (
    <form
      className={`bcz-pole ${male ? "" : g.poleSzukania}`}
      onSubmit={(e) => {
        e.preventDefault();
        szukaj(tekst);
      }}
    >
      <textarea
        className="bcz-textarea"
        rows={1}
        placeholder="Opisz, jakiego handlowca szukasz…"
        value={tekst}
        onChange={(e) => {
          setTekst(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(160, e.target.scrollHeight)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            szukaj(tekst);
          }
        }}
        maxLength={600}
        disabled={wysylam}
        aria-label="Opisz, jakiego handlowca szukasz"
      />
      <button type="submit" disabled={wysylam || tekst.trim().length < 2} className="bcz-wyslij" aria-label="Szukaj" title="Szukaj">
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </form>
  );
}

export default function SzukajHandlowca({ imie, adres = ADRES_PANELU }: { /** Pusty = powitanie bez imienia (strona publiczna). */ imie: string; adres?: string }) {
  const router = useRouter();
  return (
    <div className={`bcz bcz-start ${g.start}`}>
      <div className="bcz-kula-wrap" aria-hidden>
        <div className="bcz-kula"><KulaLimonka tempo="czeka" /></div>
      </div>
      <div className="bcz-powitanie">
        <h1 className="bcz-hej">
          {/* 12.11 (USER_001): strona publiczna = samo „Znajdź handlowca.” */}
          {imie ? (
            <>
              Cześć {imie}! <span className="bcz-hej-2">Opisz, jakiego handlowca szukasz.</span>
            </>
          ) : (
            "Znajdź handlowca."
          )}
        </h1>
        <div className={g.szukajSrodek}>
          <PoleSzukania adres={adres} />
          <div className="bcz-pigulki">
            {PRZYKLADY.map((p) => (
              <button key={p} type="button" className="bcz-pigulka" onClick={() => router.push(`${adres}${encodeURIComponent(p)}`)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
