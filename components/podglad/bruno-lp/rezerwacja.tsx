"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { firmowyEmail } from "@/lib/firmowy-email";
import s from "./bruno-lp.module.css";
import TelefonFlaga, { KRAJE } from "./telefon-flaga";

// Zapis na 30-minutową rozmowę z demo (USER_001 9.10), wersja dla firm (/brunobusiness).
// Kreator 3 kroki jak w Gabi, kolejność USER_001: 1 dane → 2 dzień (kalendarz miesiąca) → 3 godzina.
// Po kroku 1 lead jest zapisany od razu (POST), krok 3 rezerwuje termin (PATCH).
// Godziny w strefie odwiedzającego. Wygląd = klasy LP.

const ROLE = ["Business Owner / CEO", "Sales Director / Head of Sales", "Sales Team Lead", "Other"];
const ROLE_PL: Record<string, string> = {
  "Sales Director / Head of Sales": "Dyrektor sprzedaży",
  "Sales Team Lead": "Kierownik zespołu sprzedaży",
  "Business Owner / CEO": "Właściciel / prezes",
  Other: "Inna rola",
};

const T = {
  en: {
    h1a: "Book a 30-minute call",
    h1b: "and see Bruno play your customer",
    lead: "Fill in the form below",
    kroki: ["About you", "Day", "Time"],
    strefa: "Times in your time zone",
    brak: "No free times left this month. Email hello@jakubchodakowski.com and I will suggest one.",
    laduje: "Loading free times...",
    pustyDzien: "This day is full. Pick another one.",
    imie: "Name *",
    email: "Work email *",
    warn: "Use an email on your company domain.",
    tel: "Phone *",
    rola: "Your role *",
    ilu: "How many sales reps do you have? *",
    np: "e.g. 12",
    zgoda: "I agree to be contacted by email and phone about this call. Details in the",
    polityka: "privacy policy",
    dalej: "Next",
    book: "Book",
    linkedin: "Connect with me on LinkedIn",
    zapisuje: "Saving...",
    wroc: "← Back to Bruno AI",
    okH: "Your call is booked",
    okA: "We talk on",
    okB: "The calendar invite is on its way to",
    blad: "Something went wrong. Email hello@jakubchodakowski.com",
    dniTyg: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    locale: "en-GB",
  },
  pl: {
    h1a: "Umów 30-minutową rozmowę",
    h1b: "i zobacz, jak Bruno gra Twojego klienta",
    lead: "Uzupełnij formularz poniżej",
    kroki: ["O Tobie", "Dzień", "Godzina"],
    strefa: "Godziny w Twojej strefie czasowej",
    brak: "W tym miesiącu nie ma już wolnych terminów. Napisz na hello@jakubchodakowski.com, zaproponuję godzinę.",
    laduje: "Wczytuję wolne terminy...",
    pustyDzien: "Ten dzień już się zapełnił. Wybierz inny.",
    imie: "Imię *",
    email: "Firmowy e-mail *",
    warn: "Podaj e-mail w domenie firmy.",
    tel: "Telefon *",
    rola: "Stanowisko *",
    ilu: "Ilu handlowców masz w zespole? *",
    np: "np. 12",
    zgoda: "Zgadzam się na kontakt mailowy i telefoniczny w sprawie tej rozmowy. Szczegóły w",
    polityka: "polityce prywatności",
    dalej: "Dalej",
    book: "Umawiam",
    linkedin: "Połączmy się na LinkedInie",
    zapisuje: "Zapisuję...",
    wroc: "← Wróć do Bruno AI",
    okH: "Rozmowa umówiona",
    okA: "Rozmawiamy",
    okB: "Zaproszenie do kalendarza wysłaliśmy na",
    blad: "Coś poszło nie tak. Napisz na hello@jakubchodakowski.com",
    dniTyg: ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"],
    locale: "pl-PL",
  },
} as const;

/** Data lokalna → "YYYY-MM-DD". */
const klucz = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Rezerwacja({ onWstecz, jezyk = "en" }: { onWstecz: () => void; jezyk?: "en" | "pl" }) {
  const x = T[jezyk];
  const [krok, setKrok] = useState<1 | 2 | 3>(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [sloty, setSloty] = useState<string[] | null>(null);
  const [dzien, setDzien] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [gotowe, setGotowe] = useState<string | null>(null);
  // 9.10: następny miesiąc widoczny, gdy API odda jego terminy (7 dni przed końcem miesiąca).
  const [przesuniecie, setPrzesuniecie] = useState(0);
  const [f, setF] = useState({ imie: "", email: "", telefon: "", kraj: "US", stanowisko: "", handlowcy: "", zgoda: false, www: "" });
  const [wysylam, setWysylam] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  const wczytaj = async () => {
    try {
      const r = await fetch("/api/bruno/demo", { cache: "no-store" });
      const d = await r.json();
      setSloty(Array.isArray(d.sloty) ? d.sloty : []);
    } catch {
      setSloty([]);
    }
  };
  useEffect(() => {
    void wczytaj();
  }, []);
  // Tylko lokalnie (dev): podgląd kroku 2 i 3 bez wysyłania danych, np. /brunobusiness#demo-krok2.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const h = window.location.hash;
    if (h === "#demo-krok2") setKrok(2);
    if (h === "#demo-krok3") setKrok(3);
  }, []);

  const poDniach = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const t of sloty ?? []) {
      const k = klucz(new Date(t));
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return m;
  }, [sloty]);

  const godz = (iso: string) => new Date(iso).toLocaleTimeString(x.locale, { hour: "2-digit", minute: "2-digit" });
  const krotkaData = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString(x.locale, { day: "numeric", month: "short" });
  const pelna = (iso: string) => `${new Date(iso).toLocaleDateString(x.locale, { weekday: "long", day: "numeric", month: "long" })}, ${godz(iso)}`;
  const emailZly = f.email.includes("@") && !firmowyEmail(f.email);
  const pole = (k: "imie" | "email" | "telefon" | "handlowcy" | "www") => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  // Krok 1: dane → lead zapisany od razu.
  const zapiszDane = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    if (leadId) {
      setKrok(2);
      return;
    }
    setWysylam(true);
    try {
      const r = await fetch("/api/bruno/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, telefon: `${KRAJE.find((k) => k.kod === f.kraj)?.prefiks ?? ""} ${f.telefon}`.trim(), handlowcy: Number(f.handlowcy), jezyk, zrodlo: "brunobusiness" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setBlad(d.blad ?? x.blad);
        return;
      }
      setLeadId(d.id);
      track("bruno_demo_lead", { handlowcy: Number(f.handlowcy), jezyk });
      setKrok(2);
    } catch {
      setBlad(x.blad);
    } finally {
      setWysylam(false);
    }
  };

  // Krok 3: godzina → rezerwacja.
  const zarezerwuj = async (t: string) => {
    if (!leadId || wysylam) return;
    setStart(t);
    setBlad(null);
    setWysylam(true);
    try {
      const r = await fetch("/api/bruno/demo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, start: t, jezyk }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        setGotowe(t);
        track("bruno_demo", { handlowcy: Number(f.handlowcy), jezyk });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setBlad(d.blad ?? x.blad);
        setStart(null);
        if (r.status === 409) void wczytaj();
      }
    } catch {
      setBlad(x.blad);
      setStart(null);
    } finally {
      setWysylam(false);
    }
  };

  if (gotowe) {
    return (
      <section className={s.formView}>
        <div className={s.formCard} style={{ marginTop: 40 }}>
          {/* 9.10 (USER_001): zdjęcie Jakuba + sama data, podkreślona. */}
          <div className={s.okZdjecie}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jakub.jpg" alt="Jakub Chodakowski" width={112} height={112} />
          </div>
          <div className={s.formHead} style={{ marginBottom: 14 }}>
            <h1>{x.okH}</h1>
          </div>
          <p className={`${s.okText} ${s.okData}`}>
            {/* 9.10 (USER_001): czarno-biała ikona kalendarza zamiast kolorowego emoji. */}
            <svg className={s.okIkona} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
            </svg>
            {pelna(gotowe)}
          </p>
          <p className={s.okText} style={{ marginTop: 22 }}>
            {x.okB} <b>{f.email}</b>
          </p>
        </div>
        {/* 9.10 (USER_001): zamiast „Back to Bruno AI” przycisk do LinkedIna. */}
        <a className={s.linkedin} href="https://www.linkedin.com/in/jakub-chodakowski" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3V9.75zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.04c0-1.2-.02-2.75-1.68-2.75-1.68 0-1.94 1.31-1.94 2.66V21h-4V9.75z" />
          </svg>
          {x.linkedin}
        </a>
      </section>
    );
  }

  // Siatka miesiąca od poniedziałku. Bieżący albo następny (jeśli ma terminy).
  const dzis = new Date();
  const maNastepny = [...poDniach.keys()].some((k) => Number(k.slice(5, 7)) - 1 !== dzis.getMonth());
  const pierwszy = new Date(dzis.getFullYear(), dzis.getMonth() + przesuniecie, 1);
  const poczatek = new Date(pierwszy);
  poczatek.setDate(1 - ((pierwszy.getDay() + 6) % 7));
  const pola = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(poczatek);
    d.setDate(poczatek.getDate() + i);
    return d;
  });
  const ostatniaKolumna = pola.findLastIndex((d) => d.getMonth() === pierwszy.getMonth());
  const widocznePola = pola.slice(0, Math.ceil((ostatniaKolumna + 1) / 7) * 7);
  const nazwaMiesiaca = pierwszy.toLocaleDateString(x.locale, { month: "long", year: "numeric" });
  const godzinyDnia = dzien ? (poDniach.get(dzien) ?? []) : [];


  return (
    <section className={s.formView}>
      <div className={s.formHead}>
        {/* 9.10 (USER_001): bez nagłówka nad krokami. */}
      </div>

      {/* Pasek kroków: zrobione klikalne (cofanie), bieżący wyróżniony. */}
      <ol className={s.kroki3} aria-label={jezyk === "pl" ? "Kroki" : "Steps"}>
        {x.kroki.map((tytul, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const zrobiony = n < krok;
          const biezacy = n === krok;
          return (
            // 9.10 (USER_001): na kroku 1 kroki 2 i 3 blisko siebie po prawej; od kroku 2 krok 2 na środku.
            <li key={tytul} className={`${s.krok3} ${i === 0 || (i === 1 && krok >= 2) ? s.krok3Rozciagniety : ""}`}>
              <button type="button" disabled={!zrobiony} onClick={() => setKrok(n)} className={s.krok3Btn}>
                <span className={`${s.krok3Nr} ${biezacy ? s.krok3Teraz : zrobiony ? s.krok3Zrob : ""}`}>{zrobiony ? "✓" : n}</span>
                {/* 9.10 (USER_001): nazwa widoczna tylko przy bieżącym kroku. */}
                {biezacy && (
                  <span className={s.krok3Txt}>
                    <span className={s.krok3TytulTeraz}>{tytul}</span>
                  </span>
                )}
              </button>
              {i < 2 && <span className={s.krok3Linia} aria-hidden />}
            </li>
          );
        })}
      </ol>

      <div className={s.formCard}>
        {krok === 1 && (
          <form onSubmit={zapiszDane} className={s.form}>
            <div>
              <label className={s.fLabel} htmlFor="demo-imie">{x.imie}</label>
              <input id="demo-imie" required autoComplete="given-name" className={s.input} placeholder="James" value={f.imie} onChange={pole("imie")} />
            </div>
            <div>
              <label className={s.fLabel} htmlFor="demo-email">{x.email}</label>
              <input id="demo-email" required type="email" autoComplete="email" aria-invalid={emailZly} className={`${s.input} ${emailZly ? s.inputWarn : ""}`} placeholder="james@yourcompany.com" value={f.email} onChange={pole("email")} />
              {emailZly && <p className={s.warn}>{x.warn}</p>}
            </div>
            <div>
              <label className={s.fLabel} htmlFor="demo-tel">{x.tel}</label>
              <TelefonFlaga id="demo-tel" kraj={f.kraj} numer={f.telefon} onKraj={(k) => setF((v) => ({ ...v, kraj: k }))} onNumer={(n) => setF((v) => ({ ...v, telefon: n }))} placeholder={f.kraj === "US" || f.kraj === "CA" ? "(201) 555-0123" : f.kraj === "GB" ? "7700 900000" : f.kraj === "PL" ? "600 100 200" : "123 456 789"} />
            </div>
            <fieldset className={s.fieldset}>
              <legend className={s.fLabel}>{x.rola}</legend>
              <div className={s.chips}>
                {ROLE.map((r) => (
                  <button key={r} type="button" aria-pressed={f.stanowisko === r} onClick={() => setF((v) => ({ ...v, stanowisko: r }))} className={`${s.chip} ${f.stanowisko === r ? s.chipOn : ""}`}>
                    {jezyk === "pl" ? ROLE_PL[r] : r}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label className={s.fLabel} htmlFor="demo-handlowcy">{x.ilu}</label>
              <input id="demo-handlowcy" required type="number" inputMode="numeric" min={1} max={100000} step={1} className={s.input} placeholder={x.np} value={f.handlowcy} onChange={pole("handlowcy")} />
            </div>
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.www} onChange={pole("www")} style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
            <label className={s.consent}>
              <input type="checkbox" required checked={f.zgoda} onChange={(e) => setF((v) => ({ ...v, zgoda: e.target.checked }))} />
              <span>
                {x.zgoda}{" "}
                <a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>{x.polityka}</a>.
              </span>
            </label>
            {blad && <p className={s.err}>{blad}</p>}
            <button type="submit" disabled={wysylam || !f.stanowisko || emailZly || !f.zgoda} className={`${s.btnDark} ${s.btnBig} ${s.submit}`}>
              {wysylam ? x.zapisuje : x.dalej}
            </button>
          </form>
        )}

        {krok === 2 && (
          <div className={s.form}>
            {sloty === null ? (
              <p className={s.okText}>{x.laduje}</p>
            ) : poDniach.size === 0 ? (
              <p className={s.warn}>{x.brak}</p>
            ) : (
              <div className={s.kal}>
                <div className={s.kalNaglowek}>
                  {maNastepny && (
                    <button type="button" className={s.kalNav} disabled={przesuniecie === 0} onClick={() => setPrzesuniecie(0)} aria-label={jezyk === "pl" ? "Poprzedni miesiąc" : "Previous month"}>‹</button>
                  )}
                  <p className={s.kalMiesiac}>{nazwaMiesiaca}</p>
                  {maNastepny && (
                    <button type="button" className={s.kalNav} disabled={przesuniecie === 1} onClick={() => setPrzesuniecie(1)} aria-label={jezyk === "pl" ? "Następny miesiąc" : "Next month"}>›</button>
                  )}
                </div>
                <div className={s.kalSiatka}>
                  {x.dniTyg.map((d) => (
                    <span key={d} className={s.kalTyg}>{d}</span>
                  ))}
                  {widocznePola.map((d) => {
                    const k = klucz(d);
                    const wolny = poDniach.has(k);
                    const wMiesiacu = d.getMonth() === pierwszy.getMonth();
                    const toDzis = k === klucz(dzis);
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={!wolny}
                        onClick={() => {
                          setDzien(k);
                          setStart(null);
                          setKrok(3);
                        }}
                        className={`${s.kalDzien} ${wolny ? s.kalWolny : ""} ${dzien === k ? s.kalWybrany : ""} ${toDzis ? s.kalDzis : ""} ${wMiesiacu ? "" : s.kalPoza}`}
                        aria-label={d.toLocaleDateString(x.locale, { weekday: "long", day: "numeric", month: "long" })}
                      >
                        <span>{d.getDate()}</span>
                        {wolny && <i className={s.kalKropka} aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {krok === 3 && (
          <div className={s.form}>
            <div className={`${s.kalNaglowek} ${s.kalNaglowekKolumna}`}>
              <p className={s.kalMiesiac}>{dzien && new Date(`${dzien}T12:00:00`).toLocaleDateString(x.locale, { weekday: "long", day: "numeric", month: "long" })}</p>
              <span className={s.kalInfo}>{x.strefa}</span>
            </div>
            {godzinyDnia.length === 0 ? (
              <p className={s.warn}>{x.pustyDzien}</p>
            ) : (
              <div className={s.kalGodziny}>
                {godzinyDnia.map((t) => (
                  <button key={t} type="button" disabled={wysylam} onClick={() => setStart(t)} aria-pressed={start === t} className={`${s.kalGodzina} ${start === t ? s.kalGodzinaOn : ""}`}>
                    {godz(t)}
                  </button>
                ))}
              </div>
            )}
            {blad && <p className={s.err}>{blad}</p>}
            {/* 9.10 (USER_001): wybór godziny zaznacza, „Book” rezerwuje; okrągły przycisk powrotu do dni. */}
            <div className={s.kalAkcje}>
              <button type="button" className={s.kalWstecz} onClick={() => { setStart(null); setKrok(2); }} aria-label={jezyk === "pl" ? "Wróć do wyboru dnia" : "Back to days"}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
              </button>
              <button type="button" className={`${s.btnDark} ${s.btnBig} ${s.kalBook}`} disabled={!start || wysylam} onClick={() => start && zarezerwuj(start)}>
                {wysylam ? x.zapisuje : x.book}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
