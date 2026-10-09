"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { firmowyEmail } from "@/lib/firmowy-email";
import s from "./bruno-lp.module.css";

// Formularz EN (9.10). Te same pola, walidacja firmowego e-maila, endpoint /api/aisaleskontakt
// i zdarzenie salesai_lead co /aisaleskontakt. Wartości ról po EN trafiają do kolumny `zawod`.

const ZAWODY = ["Sales Director / Head of Sales", "Sales Team Lead", "Business Owner / CEO", "Sales Rep", "Other"];

export default function Formularz({ onWstecz }: { onWstecz: () => void }) {
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

  const emailPrywatny = form.email.includes("@") && !firmowyEmail(form.email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    if (!firmowyEmail(form.email)) {
      setBlad("Please use your work email (not Gmail, Yahoo, Outlook.com, etc.).");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/aisaleskontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, handlowcy: Number(form.handlowcy) }),
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

  return (
    <section className={s.formView}>
      <div className={s.miniRing} aria-hidden />

      {status === "ok" ? (
        <div className={s.formCard} style={{ marginTop: 40 }}>
          <div className={s.okIcon}>
            <svg viewBox="0 0 48 48" fill="none" stroke="#0b0b0b" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <circle cx="24" cy="24" r="17" />
              <path d="M24 13v11l7 5" />
            </svg>
          </div>
          <div className={s.formHead} style={{ marginBottom: 18 }}>
            <h1>We are checking your request</h1>
          </div>
          <p className={s.okText}>
            This takes up to <b>24 hours</b>.
          </p>
          <p className={s.okText}>
            Then we send your free 7-day access to Bruno AI to <b>{form.email}</b>.
          </p>
        </div>
      ) : (
        <>
          <div className={s.formHead}>
            <div className={s.eyebrow}>Bruno AI</div>
            <h1>
              <span className={s.g}>Fill in the form</span>
              <br />
              to get free access
            </h1>
          </div>
          <div className={s.formCard}>
            <form onSubmit={submit} className={s.form}>
              <div>
                <label className={s.fLabel} htmlFor="blp-imie">
                  First name *
                </label>
                <input
                  id="blp-imie"
                  required
                  autoComplete="given-name"
                  className={s.input}
                  placeholder="James"
                  value={form.imie}
                  onChange={set("imie")}
                />
              </div>

              <div>
                <label className={s.fLabel} htmlFor="blp-email">
                  Work email *
                </label>
                <input
                  id="blp-email"
                  required
                  type="email"
                  autoComplete="email"
                  aria-invalid={emailPrywatny}
                  className={`${s.input} ${emailPrywatny ? s.inputWarn : ""}`}
                  placeholder="james@yourcompany.com"
                  value={form.email}
                  onChange={set("email")}
                />
                {emailPrywatny && (
                  <p className={s.warn}>Use an email on your company domain. Personal mailboxes do not pass the check.</p>
                )}
              </div>

              <div>
                <label className={s.fLabel} htmlFor="blp-telefon">
                  Phone <em>(optional)</em>
                </label>
                <input
                  id="blp-telefon"
                  type="tel"
                  autoComplete="tel"
                  className={s.input}
                  placeholder="+44 7700 900000"
                  value={form.telefon}
                  onChange={set("telefon")}
                />
              </div>

              <fieldset className={s.fieldset}>
                <legend className={s.fLabel}>Your role *</legend>
                <div className={s.chips}>
                  {ZAWODY.map((z) => {
                    const wybrany = form.zawod === z;
                    return (
                      <button
                        key={z}
                        type="button"
                        aria-pressed={wybrany}
                        onClick={() => setForm((f) => ({ ...f, zawod: z }))}
                        className={`${s.chip} ${wybrany ? s.chipOn : ""}`}
                      >
                        {z}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label className={s.fLabel} htmlFor="blp-handlowcy">
                  How many sales reps do you have? *
                </label>
                <input
                  id="blp-handlowcy"
                  required
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={9999}
                  step={1}
                  className={s.input}
                  placeholder="e.g. 12"
                  value={form.handlowcy}
                  onChange={set("handlowcy")}
                />
              </div>

              <div>
                <label className={s.fLabel} htmlFor="blp-produkt">
                  What do you sell? *
                </label>
                <input
                  id="blp-produkt"
                  required
                  maxLength={200}
                  className={s.input}
                  placeholder="e.g. recruitment services for tech companies"
                  value={form.produkt}
                  onChange={set("produkt")}
                />
              </div>

              <label className={s.consent}>
                <input
                  type="checkbox"
                  required
                  checked={form.zgoda}
                  onChange={(e) => setForm((f) => ({ ...f, zgoda: e.target.checked }))}
                />
                <span>
                  I agree to be contacted by email and phone about the trial. Data controller: Jakub Chodakowski,
                  Poland, VAT ID PL6711845485. You can withdraw consent at any time.
                </span>
              </label>

              {(blad || status === "error") && (
                <p className={s.err}>{blad ?? "Something went wrong. Email hello@jakubchodakowski.com"}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !form.zawod || emailPrywatny}
                className={`${s.btnDark} ${s.btnBig} ${s.submit}`}
              >
                {status === "sending" ? "Sending..." : "Send →"}
              </button>
            </form>
          </div>
          <button type="button" className={s.back} onClick={onWstecz}>
            ← Back to Bruno AI
          </button>
        </>
      )}
    </section>
  );
}
