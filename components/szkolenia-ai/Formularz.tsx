"use client";

import { useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { FORMULARZ, KONTAKT } from "./dane";

// Formularz zapytania o szkolenie. Błędy pokazują się przy polu, po wyjściu z pola
// (nie dopiero po wysłaniu). Po wysłaniu formularz zamienia się w potwierdzenie.

type Pola = { imie: string; firma: string; email: string; telefon: string; osoby: string; wiadomosc: string; zgoda: boolean; www: string };
type Bledy = Partial<Record<keyof Pola, string>>;

const PUSTE: Pola = { imie: "", firma: "", email: "", telefon: "", osoby: "", wiadomosc: "", zgoda: false, www: "" };

function sprawdz(p: Pola): Bledy {
  const b: Bledy = {};
  if (p.imie.trim().length < 2) b.imie = "Imię i nazwisko jest potrzebne.";
  if (p.firma.trim().length < 2) b.firma = "Nazwa firmy jest potrzebna.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email.trim())) b.email = "Adres e-mail wygląda na niepełny.";
  if (!p.osoby) b.osoby = "Liczba osób jest potrzebna do wyceny.";
  if (!p.zgoda) b.zgoda = "Bez zgody nie można odpowiedzieć na zapytanie.";
  return b;
}

export default function Formularz() {
  const [p, setP] = useState<Pola>(PUSTE);
  const [dotkniete, setDotkniete] = useState<Partial<Record<keyof Pola, boolean>>>({});
  const [stan, setStan] = useState<"pusty" | "wysylam" | "ok" | "blad">("pusty");
  const okRef = useRef<HTMLDivElement>(null);

  const bledy = sprawdz(p);
  const blad = (k: keyof Pola) => (dotkniete[k] ? bledy[k] : undefined);
  const ustaw = <K extends keyof Pola>(k: K, v: Pola[K]) => setP((x) => ({ ...x, [k]: v }));
  const dotknij = (k: keyof Pola) => setDotkniete((x) => ({ ...x, [k]: true }));

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    if (stan === "wysylam") return;
    const b = sprawdz(p);
    if (Object.keys(b).length) {
      setDotkniete({ imie: true, firma: true, email: true, osoby: true, zgoda: true });
      const pierwsze = Object.keys(b)[0];
      document.getElementById(`sza-${pierwsze}`)?.focus();
      return;
    }
    setStan("wysylam");
    try {
      const r = await fetch("/api/szkolenia-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      const j = await r.json().catch(() => ({ ok: false }));
      if (!r.ok || !j.ok) throw new Error("blad");
      setStan("ok");
      track("szkolenia_ai_zapytanie", { osoby: p.osoby });
      requestAnimationFrame(() => okRef.current?.focus());
    } catch {
      setStan("blad");
    }
  }

  if (stan === "ok") {
    return (
      <div className="form ok" ref={okRef} tabIndex={-1} role="status">
        <h3>{FORMULARZ.ok.tytul}</h3>
        <p>{FORMULARZ.ok.tekst}</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={wyslij} noValidate>
      <div className={`pole${blad("imie") ? " zle" : ""}`}>
        <label htmlFor="sza-imie">Imię i nazwisko</label>
        <input id="sza-imie" name="imie" autoComplete="name" value={p.imie} onChange={(e) => ustaw("imie", e.target.value)} onBlur={() => dotknij("imie")} aria-invalid={!!blad("imie")} aria-describedby={blad("imie") ? "sza-imie-b" : undefined} />
        {blad("imie") && <p className="b" id="sza-imie-b">{blad("imie")}</p>}
      </div>

      <div className={`pole${blad("firma") ? " zle" : ""}`}>
        <label htmlFor="sza-firma">Firma</label>
        <input id="sza-firma" name="firma" autoComplete="organization" placeholder={FORMULARZ.przyklady.firma} value={p.firma} onChange={(e) => ustaw("firma", e.target.value)} onBlur={() => dotknij("firma")} aria-invalid={!!blad("firma")} aria-describedby={blad("firma") ? "sza-firma-b" : undefined} />
        {blad("firma") && <p className="b" id="sza-firma-b">{blad("firma")}</p>}
      </div>

      <div className={`pole${blad("email") ? " zle" : ""}`}>
        <label htmlFor="sza-email">E-mail</label>
        <input id="sza-email" name="email" type="email" inputMode="email" autoComplete="email" value={p.email} onChange={(e) => ustaw("email", e.target.value)} onBlur={() => dotknij("email")} aria-invalid={!!blad("email")} aria-describedby={blad("email") ? "sza-email-b" : undefined} />
        {blad("email") && <p className="b" id="sza-email-b">{blad("email")}</p>}
      </div>

      <div className="pole">
        <label htmlFor="sza-telefon">Telefon <em>opcjonalnie</em></label>
        <input id="sza-telefon" name="telefon" type="tel" inputMode="tel" autoComplete="tel" value={p.telefon} onChange={(e) => ustaw("telefon", e.target.value)} />
      </div>

      <fieldset className={`pole szer${blad("osoby") ? " zle" : ""}`}>
        <legend>Liczba osób do przeszkolenia</legend>
        <div className="wybor">
          {FORMULARZ.osoby.map((o, i) => (
            <label key={o} className={p.osoby === o ? "wybrane" : undefined}>
              <input id={i === 0 ? "sza-osoby" : undefined} type="radio" name="osoby" value={o} checked={p.osoby === o} onChange={() => { ustaw("osoby", o); dotknij("osoby"); }} />
              <span>{o}</span>
            </label>
          ))}
        </div>
        {blad("osoby") && <p className="b">{blad("osoby")}</p>}
      </fieldset>

      <div className="pole szer">
        <label htmlFor="sza-wiadomosc">Czym zajmuje się zespół <em>opcjonalnie</em></label>
        <textarea id="sza-wiadomosc" name="wiadomosc" rows={3} placeholder={FORMULARZ.przyklady.wiadomosc} value={p.wiadomosc} onChange={(e) => ustaw("wiadomosc", e.target.value)} />
      </div>

      {/* Pole-pułapka na boty: niewidoczne, poza kolejnością tabulatora. */}
      <div className="pulapka" aria-hidden="true">
        <label htmlFor="sza-www">Strona www</label>
        <input id="sza-www" name="www" tabIndex={-1} autoComplete="off" value={p.www} onChange={(e) => ustaw("www", e.target.value)} />
      </div>

      <div className={`pole szer zgoda${blad("zgoda") ? " zle" : ""}`}>
        <label>
          <input id="sza-zgoda" type="checkbox" checked={p.zgoda} onChange={(e) => { ustaw("zgoda", e.target.checked); dotknij("zgoda"); }} aria-invalid={!!blad("zgoda")} />
          <span>
            {FORMULARZ.zgoda} Administratorem danych jest Jakub Chodakowski. Szczegóły: <a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer">polityka prywatności</a>.
          </span>
        </label>
        {blad("zgoda") && <p className="b">{blad("zgoda")}</p>}
      </div>

      <div className="pole szer">
        <button type="submit" className="btn duzy" disabled={stan === "wysylam"}>
          {stan === "wysylam" ? "Wysyłanie…" : FORMULARZ.przycisk}
        </button>
        {stan === "blad" && (
          <p className="b" role="alert">
            Nie udało się wysłać. Proszę spróbować ponownie albo napisać na <a href={`mailto:${KONTAKT.email}`}>{KONTAKT.email}</a>.
          </p>
        )}
      </div>
    </form>
  );
}
