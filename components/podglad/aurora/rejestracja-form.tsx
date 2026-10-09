"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import AuroraShell from "./aurora-shell";
import s from "./aurora.module.css";
import { useJezyk } from "./jezyk";
import GooglePrzycisk from "./google-przycisk";

// Zgłoszenie o dostęp do Bruno w wyglądzie Aurora. Logika 1:1 z app/aisaleskontakt/page.tsx:
// te same pola, ta sama walidacja (lib/firmowy-email.ts), ten sam POST /api/aisaleskontakt,
// ten sam ekran „Trwa weryfikacja” po wysłaniu.

// 9.10 (USER_001): EN domyślnie, PL z ?pl.
const T = {
  en: {
    tytul: "Get access",
    panel: "Steps to join Bruno AI",
    kroki: ["Fill in the form", "Log in", "Practice with Bruno"],
    okH: "Check your inbox",
    ok1: "We sent a code to",
    ok2: "Enter it when you log in and start your first call.",
    h2: "Sign up",
    lead: "Fill in the form",
    imie: "First name",
    imiePh: "Adam",
    email: "Email",
    emailPh: "adam@gmail.com",
    tel: "Phone number",
    telPh: "+1 555 000 0000",
    opt: "(optional)",
    rola: "Choose your role",
    zawody: ["Sales Director", "Sales Team Lead", "Business Owner", "Sales Rep", "Other"],
    handl: "How many sales reps work at your company?",
    handlPh: "e.g. 8",
    produkt: "What do you sell?",
    produktPh: "e.g. life insurance for businesses",
    zgoda: "I accept the",
    polityka: "Privacy Policy",
    blad: "Something went wrong. Email hello@jakubchodakowski.com",
    wysylam: "Sending...",
    wyslij: "Send →",
  },
  pl: {
    tytul: "Otrzymaj dostęp",
    panel: "Kroki zgłoszenia do Bruno AI",
    kroki: ["Wypełnij formularz", "Zaloguj się", "Trenuj z Bruno"],
    okH: "Sprawdź skrzynkę",
    ok1: "Wysłaliśmy kod na",
    ok2: "Wpisz go przy logowaniu i zacznij pierwszą rozmowę.",
    h2: "Zarejestruj się",
    lead: "Wypełnij formularz",
    imie: "Imię",
    imiePh: "Adam",
    email: "Adres e-mail",
    emailPh: "adam@gmail.com",
    tel: "Numer telefonu",
    telPh: "+48 600 000 000",
    opt: "(opcjonalnie)",
    rola: "Wybierz swoją rolę",
    zawody: ["Dyrektor sprzedaży", "Kierownik zespołu sprzedaży", "Właściciel firmy", "Handlowiec", "Inne"],
    handl: "Ilu handlowców jest w Twojej firmie?",
    handlPh: "np. 8",
    produkt: "Jaki produkt sprzedajecie?",
    produktPh: "np. ubezpieczenia na życie dla firm",
    zgoda: "Akceptuję",
    polityka: "Politykę prywatności",
    blad: "Coś poszło nie tak. Napisz na hello@jakubchodakowski.com",
    wysylam: "Wysyłam...",
    wyslij: "Wyślij →",
  },
} as const;

export default function RejestracjaForm({ google = false }: { google?: boolean }) {
  const jezyk = useJezyk();
  const x = T[jezyk];
  const [form, setForm] = useState({
    imie: "",
    email: "",
    telefon: "",
    zawod: "",
    handlowcy: "",
    produkt: "",
    zgoda: false,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [blad, setBlad] = useState<string | null>(null);

  const set =
    (k: "imie" | "email" | "telefon" | "handlowcy" | "produkt") => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/bruno/rejestracja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, jezyk, typ: "handlowiec", handlowcy: Number(form.handlowcy) || 1 }),
      });
      if (res.ok) {
        setStatus("ok");
        track("salesai_lead", { zawod: form.zawod, handlowcy: Number(form.handlowcy) });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const body = (await res.json().catch(() => null)) as { blad?: string } | null;
        setBlad(body?.blad ?? null);
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const wyslane = status === "ok";

  return (
    <AuroraShell
      tytul={x.tytul}
      etykietaPanelu={x.panel}
      aktywny={wyslane ? 1 : 0}
      kroki={x.kroki.map((etykieta) => ({ etykieta }))}
    >
      {wyslane ? (
        <div key="ok" className={`${s.pane} ${s.enter} ${s.done2}`}>
          <div className={s.orb} aria-hidden>
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="7" y="12" width="34" height="24" rx="4" />
              <path d="M8 14l16 12 16-12" />
            </svg>
          </div>
          <h2>{x.okH}</h2>
          <p className={s.txt}>
            {x.ok1} <b>{form.email}</b>.
          </p>
          <p className={s.txt} style={{ marginTop: 6 }}>
            {x.ok2}
          </p>
        </div>
      ) : (
        <form key="form" onSubmit={submit} className={`${s.pane} ${s.enter}`}>
          <h2>{x.h2}</h2>
          <p className={s.lead}>{x.lead}</p>
          {google && <GooglePrzycisk jezyk={jezyk} />}

          <div className={s.f}>
            <label htmlFor="imie">{x.imie} *</label>
            <div className={s.in}>
              <input id="imie" required autoComplete="given-name" placeholder={x.imiePh} value={form.imie} onChange={set("imie")} />
            </div>
          </div>

          <div className={s.f}>
            <label htmlFor="email">{x.email} *</label>
            <div className={s.in}>
              <input
                id="email"
                required
                type="email"
                autoComplete="email"
                placeholder={x.emailPh}
                value={form.email}
                onChange={set("email")}
              />
            </div>
          </div>

          <div className={s.f}>
            <label htmlFor="telefon">
              {x.tel} <span className={s.opt}>{x.opt}</span>
            </label>
            <div className={s.in}>
              <input id="telefon" type="tel" autoComplete="tel" placeholder={x.telPh} value={form.telefon} onChange={set("telefon")} />
            </div>
          </div>

          <fieldset className={s.f}>
            <legend>{x.rola} *</legend>
            <div className={s.chips}>
              {x.zawody.map((z) => (
                <button
                  key={z}
                  type="button"
                  aria-pressed={form.zawod === z}
                  onClick={() => setForm((f) => ({ ...f, zawod: z }))}
                  className={s.chip}
                >
                  {z}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={s.f}>
            <label htmlFor="handlowcy">{x.handl} <span className={s.opt}>{x.opt}</span></label>
            <div className={s.in}>
              <input
                id="handlowcy"
                type="number"
                inputMode="numeric"
                min={1}
                max={9999}
                step={1}
                placeholder={x.handlPh}
                value={form.handlowcy}
                onChange={set("handlowcy")}
              />
            </div>
          </div>

          <div className={s.f}>
            <label htmlFor="produkt">{x.produkt} *</label>
            <div className={s.in}>
              <input
                id="produkt"
                required
                maxLength={200}
                placeholder={x.produktPh}
                value={form.produkt}
                onChange={set("produkt")}
              />
            </div>
          </div>

          <label className={s.zgoda}>
            <input
              type="checkbox"
              required
              checked={form.zgoda}
              onChange={(e) => setForm((f) => ({ ...f, zgoda: e.target.checked }))}
            />
            <span>
              {x.zgoda}{" "}
              <a href="/polityka-prywatnosci" target="_blank" rel="noopener">
                {x.polityka}
              </a>
            </span>
          </label>

          {(blad || status === "error") && (
            <p className={s.err} role="alert">
              {blad ?? x.blad}
            </p>
          )}

          <button type="submit" disabled={status === "sending" || !form.zawod} className={s.btnW}>
            {status === "sending" ? x.wysylam : x.wyslij}
          </button>
        </form>
      )}
    </AuroraShell>
  );
}
