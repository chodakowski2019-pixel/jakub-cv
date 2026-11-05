"use client";

import { useState } from "react";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import o from "@/app/brunooferta/oferta.module.css";
import e from "./ewatex.module.css";
import { KLIENT, LINK_PLATNOSC_1, policz, zl, type Nagrania, type Platnosc, type Wariant } from "./dane";

// 4.11: podpis umowy Ewatex na stronie. 5.11 (USER_001): 1 umowa w PDF, 1 zgoda (umowa + polityka + powierzenie) zamiast 3. Pola: imię i nazwisko jako podpis, e-mail, telefon. E-mail 3. handlowczyni dosyła mailem.
// POST /api/bruno/ewatex → zapis + mail do obu stron. Wariant zawsze "oba" (USER_001 4.11: Ewa chce CRM, opcja „sam Bruno” wycięta).

type Stan = {
  wariant: Wariant;
  platnosc: Platnosc;
  nagrania: Nagrania;
  podpis: string;
  email: string;
  telefon: string;
  umowa: boolean;
};

const MAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UmowaForm() {
  const [f, setF] = useState<Stan>({
    wariant: "oba",
    platnosc: "zgory",
    nagrania: "standard",
    podpis: KLIENT.reprezentant,
    email: KLIENT.email,
    telefon: KLIENT.telefon,
    umowa: false,
  });
  const [wysylam, setWysylam] = useState(false);
  const [blad, setBlad] = useState("");
  const [gotowe, setGotowe] = useState<{ id: number | null } | null>(null);

  const set = <K extends keyof Stan>(k: K, v: Stan[K]) => setF((x) => ({ ...x, [k]: v }));
  const k = policz();

  async function wyslij(ev: React.FormEvent) {
    ev.preventDefault();
    setBlad("");
    if (f.podpis.trim().split(/\s+/).length < 2) return setBlad("Wpisz imię i nazwisko jako podpis.");
    if (!MAIL_OK.test(f.email.trim())) return setBlad("E-mail niepoprawny.");
    if (!f.umowa) return setBlad("Zaznacz akceptację umowy.");
    setWysylam(true);
    try {
      const r = await fetch("/api/bruno/ewatex", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; id?: number | null; blad?: string };
      if (!r.ok || !d.ok) throw new Error(d.blad || "Nie udało się zapisać. Spróbuj jeszcze raz albo napisz SMS.");
      setGotowe({ id: d.id ?? null });
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
          <h2 className={o.h2}>Dziękuję. Umowa podpisana.</h2>
          <p className={o.pod}>Potwierdzenie z umową (PDF) zostanie wysłane na {f.email.trim()}</p>
          <p className={e.zaplacWiersz}>
            <a className={`${s.btnDark} ${s.btnBig} ${e.zaplac}`} href={LINK_PLATNOSC_1} target="_blank" rel="noreferrer">
              Zapłać {zl(k.start)}
            </a>
          </p>
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
              <a href="/pdf/umowa-ewatex.pdf" target="_blank" rel="noreferrer">
                umowę współpracy Bruno AI + CRM
              </a>{" "}
              w imieniu {KLIENT.nazwa}, {" "}
              <a href="/polityka-prywatnosci" target="_blank" rel="noreferrer">
                politykę prywatności
              </a>{" "}
              i powierzenie danych (art. 28 RODO). <b>Wymagane.</b>
            </span>
          </label>
        </div>

        <aside className={`${o.podsumowanie} ${e.pods}`}>
          <div className={o.znaczek}>Do zapłaty</div>
          <div className={o.podsTytul}>Bruno + CRM</div>
          <dl className={o.podsLista}>
            <dt className={o.podsSuma}>Dziś: zaliczka CRM 50 %</dt>
            <dd className={o.podsSuma}>{zl(k.start)}</dd>
            <dt>Po odbiorze CRM: 2. rata {zl(k.crm / 2)} + Bruno {zl(k.bruno)}</dt>
            <dd>{zl(k.drugaRata)}</dd>
            <dt>CRM, utrzymanie od miesiąca po odbiorze</dt>
            <dd>{zl(k.utrzymanie)} / mies.</dd>
          </dl>
          <p className={o.podsInfo}>Po podpisie: link do pierwszej płatności (przelew, karta, BLIK), faktura mailem. Nagrania rozmów zostają (umowa, § 10). Kwoty końcowe, zwolnienie z VAT.</p>
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
