"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { firmowyEmail } from "@/lib/firmowy-email";
import s from "./bruno-lp.module.css";

// Formularz EN (9.10). Te same pola, walidacja firmowego e-maila, endpoint /api/aisaleskontakt
// i zdarzenie salesai_lead co /aisaleskontakt. Wartości ról po EN trafiają do kolumny `zawod`.

const ZAWODY = ["Sales Director / Head of Sales", "Sales Team Lead", "Business Owner / CEO", "Sales Rep", "Other"];
// 9.10: podpisy ról po polsku (wartość wysyłana do bazy zostaje EN, żeby raporty się nie rozjechały).
const ZAWODY_PL: Record<string, string> = {
  "Sales Director / Head of Sales": "Dyrektor sprzedaży",
  "Sales Team Lead": "Kierownik zespołu sprzedaży",
  "Business Owner / CEO": "Właściciel / prezes",
  "Sales Rep": "Handlowiec",
  Other: "Inna rola",
};
const T = {
  en: { okH: "We are checking your request", okA: "This takes up to", okA2: "24 hours", okB: "Then we send your free 3-day access to Bruno AI to", okBFirma: "Then we email you to set up the start for your team at", h1a: "Fill in the form", h1b: "to get free access", h1bFirma: "to start with your team", imie: "First name *", emailFirma: "Work email *", email: "Email *", warn: "Use an email on your company domain. Personal mailboxes do not pass the check.", tel: "Phone", opc: "(optional)", rola: "Your role *", ilu: "How many sales reps do you have? *", np: "e.g. 12", co: "What do you sell? *", coNp: "e.g. recruitment services for tech companies", zgoda: "I agree to be contacted by email and phone about the trial. Data controller: Jakub Chodakowski, Poland, VAT ID PL6711845485. You can withdraw consent at any time.", blad: "Something went wrong. Email hello@jakubchodakowski.com", bladEmail: "Please use your work email (not Gmail, Yahoo, Outlook.com, etc.).", wysylam: "Sending...", wyslij: "Send →", wroc: "← Back to Bruno AI" },
  pl: { okH: "Sprawdzamy Twoje zgłoszenie", okA: "To trwa do", okA2: "24 godzin", okB: "Potem wysyłamy darmowy 3-dniowy dostęp do Bruno AI na adres", okBFirma: "Potem piszemy do Ciebie, żeby ustalić start Twojego zespołu, na adres", h1a: "Wypełnij formularz", h1b: "i odbierz darmowy dostęp", h1bFirma: "i zacznij z zespołem", imie: "Imię *", emailFirma: "Firmowy e-mail *", email: "E-mail *", warn: "Podaj e-mail w domenie firmy. Prywatne skrzynki nie przechodzą weryfikacji.", tel: "Telefon", opc: "(opcjonalnie)", rola: "Twoja rola *", ilu: "Ilu handlowców masz w zespole? *", np: "np. 12", co: "Co sprzedajesz? *", coNp: "np. usługi rekrutacyjne dla firm IT", zgoda: "Zgadzam się na kontakt mailowy i telefoniczny w sprawie testu. Administrator danych: Jakub Chodakowski, Polska, NIP 6711845485. Zgodę możesz wycofać w każdej chwili.", blad: "Coś poszło nie tak. Napisz na hello@jakubchodakowski.com", bladEmail: "Podaj firmowy e-mail (nie Gmail, Yahoo, Outlook.com itp.).", wysylam: "Wysyłam...", wyslij: "Wyślij →", wroc: "← Wróć do Bruno AI" },
} as const;

export default function Formularz({ onWstecz, wersja = "business", jezyk = "en" }: { onWstecz: () => void; wersja?: "business" | "reps"; jezyk?: "en" | "pl" }) {
  const x = T[jezyk];
  // 9.10: wersja dla handlowca (/brunoai): każdy e-mail, bez pytania o liczbę handlowców.
  const rep = wersja === "reps";
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

  const emailPrywatny = !rep && form.email.includes("@") && !firmowyEmail(form.email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    if (!rep && !firmowyEmail(form.email)) {
      setBlad(x.bladEmail);
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/aisaleskontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, handlowcy: rep ? 1 : Number(form.handlowcy), typ: rep ? "handlowiec" : "firma" }),
      });
      if (res.ok) {
        setStatus("ok");
        track("salesai_lead", { zawod: form.zawod, handlowcy: rep ? 1 : Number(form.handlowcy), wersja });
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
            <h1>{x.okH}</h1>
          </div>
          <p className={s.okText}>
            {x.okA} <b>{x.okA2}</b>.
          </p>
          <p className={s.okText}>
            {rep ? x.okB : x.okBFirma} <b>{form.email}</b>.
          </p>
        </div>
      ) : (
        <>
          <div className={s.formHead}>
            <div className={s.eyebrow}>Bruno AI</div>
            <h1>
              <span className={s.g}>{x.h1a}</span>
              <br />
              {rep ? x.h1b : x.h1bFirma}
            </h1>
          </div>
          <div className={s.formCard}>
            <form onSubmit={submit} className={s.form}>
              <div>
                <label className={s.fLabel} htmlFor="blp-imie">
                  {x.imie}
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
                  {rep ? x.email : x.emailFirma}
                </label>
                <input
                  id="blp-email"
                  required
                  type="email"
                  autoComplete="email"
                  aria-invalid={emailPrywatny}
                  className={`${s.input} ${emailPrywatny ? s.inputWarn : ""}`}
                  placeholder={rep ? "james@email.com" : "james@yourcompany.com"}
                  value={form.email}
                  onChange={set("email")}
                />
                {emailPrywatny && (
                  <p className={s.warn}>{x.warn}</p>
                )}
              </div>

              <div>
                <label className={s.fLabel} htmlFor="blp-telefon">
                  {x.tel} <em>{x.opc}</em>
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
                <legend className={s.fLabel}>{x.rola}</legend>
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
                        {jezyk === "pl" ? ZAWODY_PL[z] ?? z : z}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {!rep && (
              <div>
                <label className={s.fLabel} htmlFor="blp-handlowcy">
                  {x.ilu}
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
                  placeholder={x.np}
                  value={form.handlowcy}
                  onChange={set("handlowcy")}
                />
              </div>
              )}

              <div>
                <label className={s.fLabel} htmlFor="blp-produkt">
                  {x.co}
                </label>
                <input
                  id="blp-produkt"
                  required
                  maxLength={200}
                  className={s.input}
                  placeholder={x.coNp}
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
                <span>{x.zgoda}</span>
              </label>

              {(blad || status === "error") && (
                <p className={s.err}>{blad ?? x.blad}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !form.zawod || emailPrywatny}
                className={`${s.btnDark} ${s.btnBig} ${s.submit}`}
              >
                {status === "sending" ? x.wysylam : x.wyslij}
              </button>
            </form>
          </div>
          <button type="button" className={s.back} onClick={onWstecz}>
            {x.wroc}
          </button>
        </>
      )}
    </section>
  );
}
