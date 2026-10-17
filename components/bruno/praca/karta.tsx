"use client";

import { useEffect, useState } from "react";
import type { OfertaLista as Oferta } from "@/lib/bruno/praca/oferty";
import s from "./praca.module.css";
import { Inicjaly, krotkaFirma, pensja } from "./wspolne";

// 17.10 v3 (wzór RocketJobs): karta oferty. Firma · miasto · tryb nad tytułem, „Nowa” / „Wygasa za N dni”,
// wynagrodzenie albo „Wynagrodzenie nieujawnione”, tagi umiejętności, na dole poziom • umowa • wymiar, serce = zapisz.
const KLUCZ = "bruno_praca_zapisane";
const ZDARZENIE = "bruno-praca-zapisane";

export function czytajZapisane(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KLUCZ) ?? "[]");
  } catch {
    return [];
  }
}

/** Zapisane oferty (w tej przeglądarce), zsynchronizowane między kartami na stronie. */
export function useZapisane(): [string[], (id: string) => void] {
  const [lista, setLista] = useState<string[]>([]);
  useEffect(() => {
    const odswiez = () => setLista(czytajZapisane());
    odswiez();
    window.addEventListener(ZDARZENIE, odswiez);
    window.addEventListener("storage", odswiez);
    return () => {
      window.removeEventListener(ZDARZENIE, odswiez);
      window.removeEventListener("storage", odswiez);
    };
  }, []);
  const przelacz = (id: string) => {
    const l = czytajZapisane();
    const nowa = l.includes(id) ? l.filter((x) => x !== id) : [...l, id];
    try {
      localStorage.setItem(KLUCZ, JSON.stringify(nowa));
    } catch {}
    window.dispatchEvent(new Event(ZDARZENIE));
    // 17.10: zalogowany kandydat ma zapisane też na koncie (bez konta API zwraca 401, nic się nie dzieje).
    fetch("/api/bruno/praca/zapisane", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, on: nowa.includes(id) }) }).catch(() => {});
  };
  return [lista, przelacz];
}

export function Serce({ id, z }: { id: string; z?: boolean }) {
  const [lista, przelacz] = useZapisane();
  const on = lista.includes(id);
  return (
    <button
      type="button"
      className={`${s.serce} ${on ? s.serceOn : ""}`}
      aria-label={on ? "Usuń z zapisanych" : "Zapisz ofertę"}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        przelacz(id);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.1 4 4 7.2 4c2 0 3.6 1.1 4.8 2.7C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7.1 21.2 10.6 19.5 15.4 12 20 12 20Z" />
      </svg>
      {z && <span>{on ? "Zapisana" : "Zapisz"}</span>}
    </button>
  );
}

const IKONA_MIEJSCE = "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z";
const IKONA_FIRMA = "M4 21V5l8-2v18M12 8h8v13M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01";
const IKONA_TRYB = "M3 21h18M5 21V8l7-5 7 5v13M10 21v-5h4v5";

export function Meta({ d, children }: { d: string; children: React.ReactNode }) {
  return (
    <span className={s.meta}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={d} />
      </svg>
      <span className={s.metaTekst}>{children}</span>
    </span>
  );
}

const TRYB_KROTKO: Record<string, string> = {
  "Praca stacjonarna": "Stacjonarnie",
  "Praca hybrydowa": "Hybrydowo",
  "Praca zdalna": "Zdalnie",
  "Praca mobilna": "Mobilnie",
};
const POZIOM_KROTKO: Record<string, string> = {
  "Praktykant / stażysta": "Stażysta",
  "Młodszy specjalista (junior)": "Junior",
  "Specjalista (mid / regular)": "Mid",
  "Starszy specjalista (senior)": "Senior",
  "Kierownik / koordynator": "Kierownik",
};

export default function Karta({ o, href, teraz, wyrozniona }: { o: Oferta; href: string; teraz: number; wyrozniona?: boolean }) {
  const dni = Math.floor((teraz - Date.parse(o.dodano)) / 86_400_000);
  const doKonca = Math.ceil((Date.parse(o.wazneDo) - teraz) / 86_400_000);
  const zl = pensja(o.pensjaMin, o.pensjaMax);
  const dol = [POZIOM_KROTKO[o.poziom] ?? o.poziom, o.umowa, o.wymiar === "Pełny etat" ? "Pełny wymiar" : o.wymiar].filter(Boolean);
  return (
    <a className={`${s.karta} ${wyrozniona ? s.kartaWyrozniona : ""}`} href={href}>
      <div className={s.kartaGlowa}>
        <span className={s.logoBox}>
          <Inicjaly firma={o.firma} logo={o.logo} />
        </span>
        <div className={s.kartaTresc}>
          <div className={s.metaRzad}>
            <Meta d={IKONA_FIRMA}>{krotkaFirma(o.firma)}</Meta>
            <Meta d={IKONA_MIEJSCE}>{o.miasto || o.wojewodztwo || "Cała Polska"}</Meta>
            <Meta d={IKONA_TRYB}>{TRYB_KROTKO[o.tryb] ?? o.tryb}</Meta>
          </div>
          <h2 className={s.stanowisko}>
            {o.stanowisko}
            {dni <= 2 ? (
              <span className={s.znaczekNowa}>Nowa</span>
            ) : doKonca > 0 && doKonca <= 14 ? (
              <span className={s.znaczekWygasa}>Wygasa za {doKonca} dni</span>
            ) : null}
          </h2>
          {zl ? <p className={s.kwota}>{zl}<small> PLN/mies.</small></p> : <p className={s.kwotaBrak}>Wynagrodzenie nieujawnione</p>}
        </div>
        <Serce id={o.id} />
      </div>
      {o.umiejetnosci.length > 0 && (
        <div className={s.tagi}>
          {o.umiejetnosci.map((u) => (
            <span className={s.tag} key={u}>
              {u}
            </span>
          ))}
        </div>
      )}
      <div className={s.kartaDol}>
        {dol.map((d, i) => (
          <span key={d}>
            {i > 0 && <i className={s.kropkaSzara} />}
            {d}
          </span>
        ))}
      </div>
    </a>
  );
}
