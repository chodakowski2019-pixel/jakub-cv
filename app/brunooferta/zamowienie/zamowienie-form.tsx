"use client";

import { useMemo, useState } from "react";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import o from "../oferta.module.css";
import { MINIMUM_KONT, PAKIETY, WERSJA_OFERTY, koszt, zl } from "@/lib/bruno/oferta-pakiety";

// 4.11 (USER_001, pkt 6): formularz zamówienia. Pakiet 1 albo 2 (3 = umowa → /spotkanie), liczba kont (min. 3),
// dane firmy, NIP, e-maile osób, checkbox regulaminu (wymagany) + polityki (wymagany). Podsumowanie liczy koszt na żywo.

type Stan = { pakiet: 1 | 2; konta: number; firma: string; nip: string; email: string; telefon: string; osoby: string; uwagi: string; regulamin: boolean; polityka: boolean };

const NIP_OK = (nip: string) => {
  const c = nip.replace(/[^0-9]/g, "");
  if (c.length !== 10) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const suma = w.reduce((a, x, i) => a + x * Number(c[i]), 0);
  return suma % 11 === Number(c[9]);
};

export default function ZamowienieForm() {
  const [f, setF] = useState<Stan>({ pakiet: 2, konta: 6, firma: "", nip: "", email: "", telefon: "", osoby: "", uwagi: "", regulamin: false, polityka: false });
  const [wysylam, setWysylam] = useState(false);
  const [blad, setBlad] = useState("");
  const [gotowe, setGotowe] = useState<{ id: number } | null>(null);
  const p = PAKIETY.find((x) => x.nr === f.pakiet)!;
  const k = useMemo(() => koszt(p, Math.max(MINIMUM_KONT, f.konta || 0)), [p, f.konta]);
  const osoby = f.osoby.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  const set = <K extends keyof Stan>(k: K, v: Stan[K]) => setF((x) => ({ ...x, [k]: v }));

  const wyslij = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad("");
    if (f.konta < MINIMUM_KONT) return setBlad(`Minimum ${MINIMUM_KONT} konta.`);
    if (!f.firma.trim()) return setBlad("Podaj nazwę firmy.");
    if (!NIP_OK(f.nip)) return setBlad("NIP ma 10 cyfr i musi się zgadzać.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return setBlad("Podaj poprawny e-mail do faktury.");
    if (!f.regulamin) return setBlad("Zaznacz akceptację regulaminu.");
    if (!f.polityka) return setBlad("Zaznacz akceptację polityki prywatności.");
    setWysylam(true);
    try {
      const r = await fetch("/api/bruno/zamowienie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, osoby }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; id?: number; blad?: string };
      if (!r.ok || !j.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      setGotowe({ id: j.id! });
    } catch (err) {
      setBlad(String((err as Error)?.message ?? err));
    } finally {
      setWysylam(false);
    }
  };

  if (gotowe) {
    return (
      <section className={o.sekcja}>
        <div className={o.gotowe}>
          <span className={o.znaczek}>Zamówienie nr {gotowe.id}</span>
          <h2 className={o.h2} style={{ marginTop: 12 }}>Dziękuję. Mam Twoje zamówienie.</h2>
          <ol className={o.kroki}>
            <li>Na <b>{f.email}</b> wysyłam potwierdzenie i fakturę: {zl(k.pierwszy)} brutto (start {zl(k.start)} + pierwszy miesiąc {zl(k.miesiac)}).</li>
            <li>Po opłaceniu zakładam {Math.max(MINIMUM_KONT, f.konta)} kont i wysyłam kody logowania osobom z listy.</li>
            <li>{f.pakiet === 2 ? "Umawiamy spotkanie startowe (audyt lejka, 50 min) w ciągu 5 dni roboczych." : "Instrukcja + 30 min online w 1 dzień roboczy."}</li>
          </ol>
          <a className={`${s.btnDark} ${s.btnBig}`} href="/oferta">Wróć do oferty</a>
        </div>
      </section>
    );
  }

  return (
    <section className={o.sekcja} aria-labelledby="zamowienie">
      <form onSubmit={wyslij} className={o.form} noValidate>
        <div className={o.formKol}>
          <h2 id="zamowienie" className={o.h2}><span className={o.nr}>01</span> Pakiet</h2>
          <div className={o.pakiety} role="radiogroup" aria-label="Pakiet">
            {PAKIETY.filter((x) => x.nr !== 3).map((x) => (
              <label key={x.nr} className={`${o.pakietKarta} ${f.pakiet === x.nr ? o.pakietOn : ""}`}>
                <input type="radio" name="pakiet" value={x.nr} checked={f.pakiet === x.nr} onChange={() => set("pakiet", x.nr as 1 | 2)} />
                <span className={o.pakietNr}>Pakiet {x.nr}{x.rekomendowany ? " · rekomendowany" : ""}</span>
                <span className={o.pakietNazwa}>{x.nazwa}</span>
                <span className={o.pakietCena}>{x.start ? `${zl(x.start)} start + ` : ""}{zl(x.abonament)} / konto / mies.</span>
                <span className={o.pakietOpis}>{x.wdrozenie}</span>
              </label>
            ))}
            <div className={`${o.pakietKarta} ${o.pakietUmowa}`}>
              <span className={o.pakietNr}>Pakiet 3</span>
              <span className={o.pakietNazwa}>Bruno System</span>
              <span className={o.pakietOpis}>Umowa indywidualna. <a href="/spotkanie">Napisz, umówimy rozmowę →</a></span>
            </div>
          </div>

          <h2 className={o.h2} style={{ marginTop: 36 }}><span className={o.nr}>02</span> Konta</h2>
          <label className={o.pole}>
            <span>Liczba kont (handlowcy + zarządzający), minimum {MINIMUM_KONT}</span>
            <input type="number" min={MINIMUM_KONT} max={500} value={f.konta} onChange={(e) => set("konta", Number(e.target.value))} required />
          </label>
          <label className={o.pole}>
            <span>E-maile osób, które dostaną konta (po jednym w linii; można uzupełnić później)</span>
            <textarea rows={4} value={f.osoby} onChange={(e) => set("osoby", e.target.value)} placeholder={"anna@firma.pl\npiotr@firma.pl"} />
            {osoby.length > 0 && <small>{osoby.length} {osoby.length === 1 ? "osoba" : osoby.length < 5 ? "osoby" : "osób"}</small>}
          </label>

          <h2 className={o.h2} style={{ marginTop: 36 }}><span className={o.nr}>03</span> Dane do faktury</h2>
          <div className={o.dwa}>
            <label className={o.pole}><span>Nazwa firmy</span><input type="text" value={f.firma} onChange={(e) => set("firma", e.target.value)} required autoComplete="organization" /></label>
            <label className={o.pole}><span>NIP</span><input type="text" inputMode="numeric" value={f.nip} onChange={(e) => set("nip", e.target.value)} required placeholder="1234567890" /></label>
            <label className={o.pole}><span>E-mail do faktury i kontaktu</span><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required autoComplete="email" /></label>
            <label className={o.pole}><span>Telefon (opcjonalnie)</span><input type="tel" value={f.telefon} onChange={(e) => set("telefon", e.target.value)} autoComplete="tel" /></label>
          </div>
          <label className={o.pole}><span>Uwagi (opcjonalnie)</span><textarea rows={2} value={f.uwagi} onChange={(e) => set("uwagi", e.target.value)} /></label>

          <h2 className={o.h2} style={{ marginTop: 36 }}><span className={o.nr}>04</span> Zgody</h2>
          <label className={o.check}>
            <input type="checkbox" checked={f.regulamin} onChange={(e) => set("regulamin", e.target.checked)} required />
            <span>Akceptuję <a href="/regulamin" target="_blank" rel="noreferrer">regulamin Bruno AI dla firm</a> (opłata startowa, minimum {MINIMUM_KONT} konta, okres rozliczeniowy, zasady wypowiedzenia). <b>Wymagane.</b></span>
          </label>
          <label className={o.check}>
            <input type="checkbox" checked={f.polityka} onChange={(e) => set("polityka", e.target.checked)} required />
            <span>Akceptuję <a href="/polityka-prywatnosci" target="_blank" rel="noreferrer">politykę prywatności</a> i powierzenie danych (art. 28 RODO). <b>Wymagane.</b></span>
          </label>
        </div>

        <aside className={o.podsumowanie}>
          <div className={o.znaczek}>Podsumowanie</div>
          <div className={o.podsTytul}>Pakiet {p.nr}: {p.nazwa}</div>
          <dl className={o.podsLista}>
            <dt>Opłata startowa</dt><dd>{zl(k.start)}</dd>
            <dt>{Math.max(MINIMUM_KONT, f.konta || 0)} kont × {zl(p.abonament)}</dt><dd>{zl(k.miesiac)} / mies.</dd>
            <dt className={o.podsSuma}>Razem na start (brutto)</dt><dd className={o.podsSuma}>{zl(k.pierwszy)}</dd>
            <dt>Każdy kolejny miesiąc</dt><dd>{zl(k.kolejne)}</dd>
          </dl>
          <p className={o.podsInfo}>Faktura przyjdzie na e-mail w 1 dzień roboczy. Płatność przelewem albo kartą (Stripe). Ceny brutto, z VAT.</p>
          {blad && <p className={o.blad} role="alert">{blad}</p>}
          <button type="submit" className={`${s.btnDark} ${s.btnBig} ${o.btnPelny}`} disabled={wysylam}>
            {wysylam ? "Wysyłam…" : "Zamawiam i akceptuję regulamin"}
          </button>
          <small className={o.podsMale}>Wersja oferty {WERSJA_OFERTY}. Zamówienie trafia do nas od razu, konta zakładamy po płatności.</small>
        </aside>
      </form>
    </section>
  );
}
