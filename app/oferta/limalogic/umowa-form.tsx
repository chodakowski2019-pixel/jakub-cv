"use client";

import { useState } from "react";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import o from "@/app/brunooferta/oferta.module.css";
import e from "@/app/oferta/ewatex/ewatex.module.css";
import { ANALIZA, KLIENT, LINK_PLATNOSC, zl } from "./dane";

// 5.11: podpis umowy Limalogic na stronie (forma dokumentowa). 1 zgoda = umowa (PDF) + polityka + powierzenie danych.
// POST /api/bruno/limalogic → zapis + mail TYLKO do Jakuba. Do klienta nic z automatu.

type Stan = { podpis: string; email: string; telefon: string; umowa: boolean };

const MAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UmowaForm() {
  const [f, setF] = useState<Stan>({ podpis: KLIENT.reprezentant, email: KLIENT.email, telefon: KLIENT.telefon, umowa: false });
  const [wysylam, setWysylam] = useState(false);
  const [blad, setBlad] = useState("");
  const [gotowe, setGotowe] = useState(false);

  const set = <K extends keyof Stan>(k: K, v: Stan[K]) => setF((x) => ({ ...x, [k]: v }));

  async function wyslij(ev: React.FormEvent) {
    ev.preventDefault();
    setBlad("");
    if (f.podpis.trim().split(/\s+/).length < 2) return setBlad("Wpisz imię i nazwisko jako podpis.");
    if (!MAIL_OK.test(f.email.trim())) return setBlad("E-mail niepoprawny.");
    if (!f.umowa) return setBlad("Zaznacz akceptację umowy.");
    setWysylam(true);
    try {
      const r = await fetch("/api/bruno/limalogic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string };
      if (!r.ok || !d.ok) throw new Error(d.blad || "Nie udało się zapisać. Spróbuj jeszcze raz albo napisz do mnie.");
      setGotowe(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setBlad(err instanceof Error ? err.message : String(err));
    } finally {
      setWysylam(false);
    }
  }

  if (gotowe) {
    return (
      <section className={`${o.sekcja} ${e.sekcja}`} id="podpis">
        <div className={`${o.gotowe} ${e.gotowe}`}>
          <h2 className={o.h2}>Dziękuję, Łukasz. Mam Twój podpis.</h2>
          <p className={o.pod}>Potwierdzenie z umową (PDF) i fakturę wyślę na {f.email.trim()}</p>
          {LINK_PLATNOSC && (
            <p className={e.zaplacWiersz}>
              <a className={`${s.btnDark} ${s.btnBig} ${e.zaplac}`} href={LINK_PLATNOSC} target="_blank" rel="noreferrer">
                Zapłać {zl(ANALIZA.cena)}
              </a>
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="podpis" id="podpis">
      <form onSubmit={wyslij} className={`${o.form} ${e.formJedna}`} noValidate>
        <div className={o.formKol}>
          <h2 id="podpis-h" className={o.h2}>
            <span className={o.nr}>05</span> Podpis
          </h2>

          <p className={o.pod}>Dane do podpisu</p>
          <div className={o.dwa}>
            <label className={o.pole}>
              <span>Imię i nazwisko (podpis)</span>
              <input type="text" value={f.podpis} onChange={(ev) => set("podpis", ev.target.value)} required autoComplete="name" />
            </label>
            <label className={o.pole}>
              <span>E-mail do faktury i potwierdzenia</span>
              <input type="email" value={f.email} onChange={(ev) => set("email", ev.target.value)} required autoComplete="email" />
            </label>
            <label className={o.pole}>
              <span>Telefon</span>
              <input type="tel" value={f.telefon} onChange={(ev) => set("telefon", ev.target.value)} autoComplete="tel" />
            </label>
          </div>
          <p className={e.male}>
            Spółka: {KLIENT.nazwa}, {KLIENT.adres}, NIP {KLIENT.nip}, KRS {KLIENT.krs}. Reprezentuje: {KLIENT.reprezentant}, {KLIENT.funkcja}.
          </p>

          <p className={o.pod} style={{ marginTop: 28 }}>
            Zgoda
          </p>
          <label className={o.check}>
            <input type="checkbox" checked={f.umowa} onChange={(ev) => set("umowa", ev.target.checked)} required />
            <span>
              Akceptuję{" "}
              <a href="/pdf/umowa-limalogic.pdf" target="_blank" rel="noreferrer">
                umowę: analiza sprzedaży
              </a>{" "}
              w imieniu {KLIENT.nazwa},{" "}
              <a href="/polityka-prywatnosci" target="_blank" rel="noreferrer">
                politykę prywatności
              </a>{" "}
              i powierzenie danych (art. 28 RODO). <b>Wymagane.</b>
            </span>
          </label>
        </div>

        <aside className={`${o.podsumowanie} ${e.pods}`}>
          <div className={o.znaczek}>Do zapłaty</div>
          <div className={o.podsTytul}>Analiza sprzedaży</div>
          <dl className={o.podsLista}>
            <dt className={o.podsSuma}>Dziś: 100%</dt>
            <dd className={o.podsSuma}>{zl(ANALIZA.cena)}</dd>
          </dl>
          {blad && (
            <p className={o.blad} role="alert">
              {blad}
            </p>
          )}
          <button type="submit" className={`${s.btnDark} ${s.btnBig} ${o.btnPelny}`} disabled={wysylam}>
            {wysylam ? "Zapisuję…" : "Podpisuję i akceptuję"}
          </button>
        </aside>
      </form>
    </section>
  );
}
