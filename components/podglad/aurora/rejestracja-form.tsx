"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import AuroraShell from "./aurora-shell";
import s from "./aurora.module.css";
import { adresStrony, useJezyk, useNaDomenie } from "./jezyk";
import type { Jezyk } from "@/lib/bruno/domeny";

// 17.10 (USER_001): Bruno tylko B2B. Rejestracja zamknięta: ten formularz = PROŚBA O DOSTĘP
// (imię, e-mail, telefon, firma, ilu handlowców, co sprzedajecie). USER_001 akceptuje w Adminie
// do 24 h, wtedy przychodzi mail z kodem i konto demo (1 rozmowa). Bez Google: konto zakłada USER_001.
// Było (11.10): e-mail + hasło albo Google, konto od razu, 3 bezpłatne rozmowy.

const HANDLOWCY = ["1-4", "5-9", "10-50", "50+"] as const;

const T = {
  en: {
    tytul: "Get access",
    panel: "Steps to Bruno AI",
    kroki: ["Send the form", "Get access within 24 h", "Practice with Bruno"],
    h2: "Get access to Bruno",
    lead: "Tell us about your team. You'll get access by email within 24 hours.",
    imie: "First name",
    imiePh: "Adam",
    email: "Work email",
    emailPh: "adam@company.com",
    telefon: "Phone",
    telefonPh: "+44 20 1234 5678",
    firma: "Company",
    firmaPh: "Company name",
    handlowcy: "How many sales reps do you have?",
    produkt: "What do you sell?",
    produktPh: "E.g. solar panels for homeowners",
    zgoda: "I accept the",
    polityka: "Privacy Policy",
    blad: "Something went wrong. Email hello@jakubchodakowski.com",
    wysylam: "Sending...",
    wyslij: "Request access →",
    maKonto: "Already have an account?",
    zaloguj: "Log in",
    okH2: "Thank you!",
    okTekst: "You'll get your login details by email within 24 hours.",
  },
  pl: {
    tytul: "Otrzymaj dostęp",
    panel: "Kroki do Bruno AI",
    kroki: ["Wyślij formularz", "Dostęp w 24 h", "Trenuj z Bruno"],
    h2: "Otrzymaj dostęp do Bruno",
    lead: "Napisz parę słów o zespole. Dostęp dostaniesz mailem w ciągu 24 godzin.",
    imie: "Imię",
    imiePh: "Adam",
    email: "E-mail służbowy",
    emailPh: "adam@firma.pl",
    telefon: "Telefon",
    telefonPh: "+48 600 000 000",
    firma: "Firma",
    firmaPh: "Nazwa firmy",
    handlowcy: "Ilu masz handlowców?",
    produkt: "Co sprzedajecie?",
    produktPh: "Np. fotowoltaika dla domów jednorodzinnych",
    zgoda: "Akceptuję",
    polityka: "politykę prywatności",
    blad: "Coś poszło nie tak. Napisz na hello@jakubchodakowski.com",
    wysylam: "Wysyłam...",
    wyslij: "Poproś o dostęp →",
    maKonto: "Masz już konto?",
    zaloguj: "Zaloguj się",
    okH2: "Dziękuję!",
    okTekst: "Dane logowania dostaniesz mailem w ciągu 24 godzin.",
  },
} as const;

export default function RejestracjaForm({ jezykStart, naDomenieStart }: { google?: boolean; jezykStart?: Jezyk; naDomenieStart?: boolean }) {
  const jezyk = useJezyk(jezykStart);
  const naDomenie = useNaDomenie(naDomenieStart);
  const x = T[jezyk];
  const [form, setForm] = useState({ imie: "", email: "", telefon: "", firma: "", handlowcy: "", produkt: "", zgoda: false, www: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "ok">("idle");
  const [blad, setBlad] = useState<string | null>(null);
  const pole = (k: "imie" | "email" | "telefon" | "firma" | "produkt") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const gotowe = form.imie && form.email && form.telefon && form.firma && form.handlowcy && form.produkt.trim() && form.zgoda;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/bruno/rejestracja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, jezyk }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; blad?: string } | null;
      if (res.ok && body?.ok) {
        track("salesai_lead", { krok: "prosba", handlowcy: form.handlowcy });
        setStatus("ok");
        return;
      }
      setBlad(body?.blad ?? null);
      setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <AuroraShell tytul={x.tytul} etykietaPanelu={x.panel} aktywny={status === "ok" ? 1 : 0} kroki={x.kroki.map((etykieta) => ({ etykieta }))}>
      {status === "ok" ? (
        <div key="ok" className={`${s.pane} ${s.enter}`}>
          <h2>{x.okH2}</h2>
          <p className={s.lead}>{x.okTekst}</p>
          <p className={s.login}>
            <Link href={adresStrony(jezyk, "firmy", naDomenie)}>← salesbruno.com</Link>
          </p>
        </div>
      ) : (
        <form key="form" onSubmit={submit} className={`${s.pane} ${s.enter}`}>
          <h2>{x.h2}</h2>
          <p className={`${s.lead} ${s.leadBezTelefonu}`}>{x.lead}</p>

          <div className={s.dwa}>
            <div className={s.f}>
              <label htmlFor="imie">{x.imie} *</label>
              <div className={s.in}>
                <input id="imie" required autoComplete="given-name" maxLength={80} placeholder={x.imiePh} value={form.imie} onChange={pole("imie")} />
              </div>
            </div>
            <div className={s.f}>
              <label htmlFor="telefon">{x.telefon} *</label>
              <div className={s.in}>
                <input id="telefon" required type="tel" autoComplete="tel" maxLength={40} placeholder={x.telefonPh} value={form.telefon} onChange={pole("telefon")} />
              </div>
            </div>
          </div>

          <div className={s.f}>
            <label htmlFor="email">{x.email} *</label>
            <div className={s.in}>
              <input id="email" required type="email" autoComplete="email" placeholder={x.emailPh} value={form.email} onChange={pole("email")} />
            </div>
          </div>

          <div className={s.f}>
            <label htmlFor="firma">{x.firma} *</label>
            <div className={s.in}>
              <input id="firma" required autoComplete="organization" maxLength={120} placeholder={x.firmaPh} value={form.firma} onChange={pole("firma")} />
            </div>
          </div>

          <fieldset className={s.f}>
            <legend>{x.handlowcy} *</legend>
            <div className={s.chips}>
              {HANDLOWCY.map((h) => (
                <button key={h} type="button" className={s.chip} aria-pressed={form.handlowcy === h} onClick={() => setForm((f) => ({ ...f, handlowcy: h }))}>
                  {h}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={s.f}>
            <label htmlFor="produkt">{x.produkt} *</label>
            <div className={s.in}>
              <textarea id="produkt" required maxLength={1000} rows={3} placeholder={x.produktPh} value={form.produkt} onChange={pole("produkt")} />
            </div>
          </div>

          {/* Pułapka na boty: pole niewidoczne dla ludzi. */}
          <input type="text" name="www" tabIndex={-1} autoComplete="off" value={form.www} onChange={(e) => setForm((f) => ({ ...f, www: e.target.value }))} style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} aria-hidden />

          <label className={s.zgoda}>
            <input type="checkbox" required checked={form.zgoda} onChange={(e) => setForm((f) => ({ ...f, zgoda: e.target.checked }))} />
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

          <button type="submit" disabled={status === "sending" || !gotowe} className={`${s.btnW} ${status === "sending" ? s.btnCzeka : ""}`} aria-busy={status === "sending"}>
            {status === "sending" && <span className={s.kolko} aria-hidden />}
            {status === "sending" ? x.wysylam : x.wyslij}
          </button>

          <p className={s.login}>
            {x.maKonto} <Link href={adresStrony(jezyk, "logowanie", naDomenie)}>{x.zaloguj}</Link>
          </p>
        </form>
      )}
    </AuroraShell>
  );
}
