"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import AuroraShell from "./aurora-shell";
import s from "./aurora.module.css";

// Zgłoszenie o dostęp do Bruno w wyglądzie Aurora. Logika 1:1 z app/aisaleskontakt/page.tsx:
// te same pola, ta sama walidacja (lib/firmowy-email.ts), ten sam POST /api/aisaleskontakt,
// ten sam ekran „Trwa weryfikacja” po wysłaniu.

const ZAWODY = ["Dyrektor sprzedaży", "Kierownik zespołu sprzedaży", "Właściciel firmy", "Handlowiec", "Inne"];

export default function RejestracjaForm() {
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
      const res = await fetch("/api/aisaleskontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, typ: "handlowiec", handlowcy: Number(form.handlowcy) || 1 }),
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
      tytul="Otrzymaj dostęp"
      etykietaPanelu="Kroki zgłoszenia do Bruno AI"
      aktywny={wyslane ? 1 : 0}
      kroki={[
        { etykieta: "Wypełnij formularz" },
        { etykieta: "Zaloguj się" },
        { etykieta: "Trenuj z Bruno" },
      ]}
    >
      {wyslane ? (
        <div key="ok" className={`${s.pane} ${s.enter} ${s.done2}`}>
          <div className={s.orb} aria-hidden>
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="7" y="12" width="34" height="24" rx="4" />
              <path d="M8 14l16 12 16-12" />
            </svg>
          </div>
          <h2>Sprawdź skrzynkę</h2>
          <p className={s.txt}>
            Wysłaliśmy kod na <b>{form.email}</b>.
          </p>
          <p className={s.txt} style={{ marginTop: 6 }}>
            Wpisz go przy logowaniu i zacznij pierwszą rozmowę.
          </p>
        </div>
      ) : (
        <form key="form" onSubmit={submit} className={`${s.pane} ${s.enter}`}>
          <h2>Zarejestruj się</h2>
          <p className={s.lead}>Wypełnij formularz</p>

          <div className={s.f}>
            <label htmlFor="imie">Imię *</label>
            <div className={s.in}>
              <input id="imie" required autoComplete="given-name" placeholder="Adam" value={form.imie} onChange={set("imie")} />
            </div>
          </div>

          <div className={s.f}>
            <label htmlFor="email">Adres e-mail *</label>
            <div className={s.in}>
              <input
                id="email"
                required
                type="email"
                autoComplete="email"
                placeholder="adam@gmail.com"
                value={form.email}
                onChange={set("email")}
              />
            </div>
          </div>

          <div className={s.f}>
            <label htmlFor="telefon">
              Numer telefonu <span className={s.opt}>(opcjonalnie)</span>
            </label>
            <div className={s.in}>
              <input id="telefon" type="tel" autoComplete="tel" placeholder="+48 600 000 000" value={form.telefon} onChange={set("telefon")} />
            </div>
          </div>

          <fieldset className={s.f}>
            <legend>Wybierz swoją rolę *</legend>
            <div className={s.chips}>
              {ZAWODY.map((z) => (
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
            <label htmlFor="handlowcy">Ilu handlowców jest w Twojej firmie? <span className={s.opt}>(opcjonalnie)</span></label>
            <div className={s.in}>
              <input
                id="handlowcy"
                type="number"
                inputMode="numeric"
                min={1}
                max={9999}
                step={1}
                placeholder="np. 8"
                value={form.handlowcy}
                onChange={set("handlowcy")}
              />
            </div>
          </div>

          <div className={s.f}>
            <label htmlFor="produkt">Jaki produkt sprzedajecie? *</label>
            <div className={s.in}>
              <input
                id="produkt"
                required
                maxLength={200}
                placeholder="np. ubezpieczenia na życie dla firm"
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
              Akceptuję{" "}
              <a href="/polityka-prywatnosci" target="_blank" rel="noopener">
                Politykę prywatności
              </a>
            </span>
          </label>

          {(blad || status === "error") && (
            <p className={s.err} role="alert">
              {blad ?? "Coś poszło nie tak. Napisz na hello@jakubchodakowski.com"}
            </p>
          )}

          <button type="submit" disabled={status === "sending" || !form.zawod} className={s.btnW}>
            {status === "sending" ? "Wysyłam..." : "Wyślij →"}
          </button>
        </form>
      )}
    </AuroraShell>
  );
}
