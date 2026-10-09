"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { firmowyEmail } from "@/lib/firmowy-email";
import s from "./bruno-lp.module.css";

// Zapis na 30-minutową rozmowę z demo (USER_001 9.10), wersja dla firm (/brunobusiness).
// Wygląd = formularz LP (te same klasy). Kroki na jednym ekranie: dzień → godzina → dane.
// Godziny pokazane w strefie odwiedzającego, z dopiskiem czasu UK.

const ROLE = ["Sales Director / Head of Sales", "Sales Team Lead", "Business Owner / CEO", "Other"];
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
    lead: "First I ask about your team. Then I show you Bruno live, playing your own customer. At the end we decide together if it makes sense.",
    dzien: "Day *",
    godzina: "Time *",
    strefa: "Times in your time zone",
    brak: "No free times left this month. Email hello@jakubchodakowski.com and I will suggest one.",
    laduje: "Loading free times...",
    imie: "First name *",
    email: "Work email *",
    warn: "Use an email on your company domain.",
    tel: "Phone *",
    rola: "Your role *",
    ilu: "How many sales reps do you have? *",
    np: "e.g. 12",
    zgoda: "I agree to be contacted by email and phone about this call. Data controller: Jakub Chodakowski, Poland, VAT ID PL6711845485. You can withdraw consent at any time.",
    wyslij: "Book the call →",
    wysylam: "Booking...",
    wroc: "← Back to Bruno AI",
    okH: "Your call is booked",
    okA: "We talk on",
    okB: "The calendar invite is on its way to",
    blad: "Something went wrong. Email hello@jakubchodakowski.com",
    locale: "en-GB",
  },
  pl: {
    h1a: "Umów 30-minutową rozmowę",
    h1b: "i zobacz, jak Bruno gra Twojego klienta",
    lead: "Najpierw pytam o Twój zespół. Potem pokazuję Bruno na żywo, jak gra Waszego klienta. Na końcu razem decydujemy, czy to ma sens.",
    dzien: "Dzień *",
    godzina: "Godzina *",
    strefa: "Godziny w Twojej strefie czasowej",
    brak: "W tym miesiącu nie ma już wolnych terminów. Napisz na hello@jakubchodakowski.com, zaproponuję godzinę.",
    laduje: "Wczytuję wolne terminy...",
    imie: "Imię *",
    email: "Firmowy e-mail *",
    warn: "Podaj e-mail w domenie firmy.",
    tel: "Telefon *",
    rola: "Stanowisko *",
    ilu: "Ilu handlowców masz w zespole? *",
    np: "np. 12",
    zgoda: "Zgadzam się na kontakt mailowy i telefoniczny w sprawie tej rozmowy. Administrator danych: Jakub Chodakowski, Polska, NIP 6711845485. Zgodę możesz wycofać w każdej chwili.",
    wyslij: "Umawiam rozmowę →",
    wysylam: "Umawiam...",
    wroc: "← Wróć do Bruno AI",
    okH: "Rozmowa umówiona",
    okA: "Rozmawiamy",
    okB: "Zaproszenie do kalendarza wysłaliśmy na",
    blad: "Coś poszło nie tak. Napisz na hello@jakubchodakowski.com",
    locale: "pl-PL",
  },
} as const;

export default function Rezerwacja({ onWstecz, jezyk = "en" }: { onWstecz: () => void; jezyk?: "en" | "pl" }) {
  const x = T[jezyk];
  const [sloty, setSloty] = useState<string[] | null>(null);
  const [dzien, setDzien] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [f, setF] = useState({ imie: "", email: "", telefon: "", stanowisko: "", handlowcy: "", zgoda: false, www: "" });
  const [stan, setStan] = useState<"idle" | "sending" | "ok" | "error">("idle");
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

  const kluczDnia = (iso: string) => new Date(iso).toLocaleDateString("sv-SE");
  const dni = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const t of sloty ?? []) {
      const k = kluczDnia(t);
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return [...m.entries()];
  }, [sloty]);
  useEffect(() => {
    if (!dzien && dni.length) setDzien(dni[0][0]);
  }, [dni, dzien]);

  const nazwaDnia = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString(x.locale, { weekday: "short", day: "numeric", month: "short" });
  const godz = (iso: string) => new Date(iso).toLocaleTimeString(x.locale, { hour: "2-digit", minute: "2-digit" });
  const pelna = (iso: string) =>
    `${new Date(iso).toLocaleDateString(x.locale, { weekday: "long", day: "numeric", month: "long" })}, ${godz(iso)}`;
  const emailZly = f.email.includes("@") && !firmowyEmail(f.email);
  const pole = (k: "imie" | "email" | "telefon" | "handlowcy" | "www") => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  const wyslij = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start) return;
    setBlad(null);
    setStan("sending");
    try {
      const r = await fetch("/api/bruno/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, handlowcy: Number(f.handlowcy), start, jezyk, zrodlo: "brunobusiness" }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        setStan("ok");
        track("bruno_demo", { handlowcy: Number(f.handlowcy), jezyk });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setBlad(d.blad ?? null);
        setStan("error");
        if (r.status === 409) {
          setStart(null);
          void wczytaj();
        }
      }
    } catch {
      setStan("error");
    }
  };

  if (stan === "ok" && start) {
    return (
      <section className={s.formView}>
        <div className={s.miniRing} aria-hidden />
        <div className={s.formCard} style={{ marginTop: 40 }}>
          <div className={s.formHead} style={{ marginBottom: 18 }}>
            <h1>{x.okH}</h1>
          </div>
          <p className={s.okText}>
            {x.okA} <b>{pelna(start)}</b>.
          </p>
          <p className={s.okText}>
            {x.okB} <b>{f.email}</b>.
          </p>
        </div>
        <button type="button" className={s.back} onClick={onWstecz}>
          {x.wroc}
        </button>
      </section>
    );
  }

  const godzinyDnia = dni.find(([k]) => k === dzien)?.[1] ?? [];

  return (
    <section className={s.formView}>
      <div className={s.miniRing} aria-hidden />
      <div className={s.formHead}>
        <div className={s.eyebrow}>Bruno AI</div>
        <h1>
          <span className={s.g}>{x.h1a}</span>
          <br />
          {x.h1b}
        </h1>
        <p className={s.okText} style={{ marginTop: 14 }}>{x.lead}</p>
      </div>
      <div className={s.formCard}>
        <form onSubmit={wyslij} className={s.form}>
          <fieldset className={s.fieldset}>
            <legend className={s.fLabel}>{x.dzien}</legend>
            {sloty === null ? (
              <p className={s.okText}>{x.laduje}</p>
            ) : dni.length === 0 ? (
              <p className={s.warn}>{x.brak}</p>
            ) : (
              <div className={s.chips}>
                {dni.map(([k]) => (
                  <button key={k} type="button" aria-pressed={dzien === k} onClick={() => { setDzien(k); setStart(null); }} className={`${s.chip} ${dzien === k ? s.chipOn : ""}`}>
                    {nazwaDnia(k)}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          {godzinyDnia.length > 0 && (
            <fieldset className={s.fieldset}>
              <legend className={s.fLabel}>
                {x.godzina} <em>({x.strefa})</em>
              </legend>
              <div className={s.chips}>
                {godzinyDnia.map((t) => (
                  <button key={t} type="button" aria-pressed={start === t} onClick={() => setStart(t)} className={`${s.chip} ${start === t ? s.chipOn : ""}`}>
                    {godz(t)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

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
            <input id="demo-tel" required type="tel" autoComplete="tel" className={s.input} placeholder="+44 7700 900000" value={f.telefon} onChange={pole("telefon")} />
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
          {/* Pułapka na boty: niewidoczne pole. */}
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.www} onChange={pole("www")} style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
          <label className={s.consent}>
            <input type="checkbox" required checked={f.zgoda} onChange={(e) => setF((v) => ({ ...v, zgoda: e.target.checked }))} />
            <span>{x.zgoda}</span>
          </label>
          {(blad || stan === "error") && <p className={s.err}>{blad ?? x.blad}</p>}
          <button type="submit" disabled={stan === "sending" || !start || !f.stanowisko || emailZly} className={`${s.btnDark} ${s.btnBig} ${s.submit}`}>
            {stan === "sending" ? x.wysylam : x.wyslij}
          </button>
        </form>
      </div>
      <button type="button" className={s.back} onClick={onWstecz}>
        {x.wroc}
      </button>
    </section>
  );
}
