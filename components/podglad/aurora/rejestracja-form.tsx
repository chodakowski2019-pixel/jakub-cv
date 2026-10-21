"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import AuroraShell from "./aurora-shell";
import s from "./aurora.module.css";
import { adresStrony, useJezyk, useNaDomenie } from "./jezyk";
import type { Jezyk } from "@/lib/bruno/domeny";

// 21.10 (USER_001): rejestracja w 2 krokach. Krok 1 = e-mail służbowy + hasło (każdy e-mail przechodzi,
// gmail też), krok 2 = imię, telefon, firma, ilu handlowców, co sprzedajecie, potem komunikat „dostęp do 24 h”.
// USER_001 akceptuje w Adminie do 24 h, konto demo (1 rozmowa) dostaje hasło z kroku 1.
// Było (17.10): jeden formularz z 6 polami bez hasła. Jeszcze wcześniej (11.10): e-mail + hasło albo Google, konto od razu.

const HANDLOWCY = ["1-4", "5-9", "10-50", "50+"] as const;

const T = {
  en: {
    tytul: "Get access",
    panel: "Steps to Bruno AI",
    kroki: ["Email and password", "Your company", "Access within 24 h"],
    h2: "Get access to Bruno",
    h2krok2: "A few details about your company",
    haslo: "Password",
    hasloPh: "At least 8 characters",
    dalej: "Next →",
    wstecz: "← Back",
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
    okTekst: "You'll get your login details by email within 24h.",
  },
  pl: {
    tytul: "Otrzymaj dostęp",
    panel: "Kroki do Bruno AI",
    kroki: ["E-mail i hasło", "Dane firmy", "Dostęp w 24 h"],
    h2: "Otrzymaj dostęp do Bruno",
    h2krok2: "Kilka słów o Twojej firmie",
    haslo: "Hasło",
    hasloPh: "Co najmniej 8 znaków",
    dalej: "Dalej →",
    wstecz: "← Wstecz",
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
    wyslij: "Chcę otrzymać dostęp →",
    maKonto: "Masz już konto?",
    zaloguj: "Zaloguj się",
    okH2: "Dziękuję!",
    okTekst: "Dane do logowania otrzymasz e-mailem do 24h.",
  },
} as const;

export default function RejestracjaForm({ jezykStart, naDomenieStart }: { google?: boolean; jezykStart?: Jezyk; naDomenieStart?: boolean }) {
  const jezyk = useJezyk(jezykStart);
  const naDomenie = useNaDomenie(naDomenieStart);
  const x = T[jezyk];
  const [form, setForm] = useState({ imie: "", email: "", haslo: "", telefon: "", firma: "", handlowcy: "", produkt: "", zgoda: false, www: "" });
  const [krok, setKrok] = useState<1 | 2>(1);
  const [prosba, setProsba] = useState<{ id: number; token: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "ok">("idle");
  const [blad, setBlad] = useState<string | null>(null);
  const pole = (k: "imie" | "email" | "haslo" | "telefon" | "firma" | "produkt") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const gotowe1 = form.email && form.haslo.length >= 8 && form.zgoda;
  const gotowe2 = form.imie && form.telefon && form.firma && form.handlowcy && form.produkt.trim();

  const wyslij = async (dane: Record<string, unknown>) => {
    const res = await fetch("/api/bruno/rejestracja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dane, jezyk, www: form.www }) });
    const body = (await res.json().catch(() => null)) as { ok?: boolean; blad?: string; id?: number; token?: string } | null;
    return { ok: Boolean(res.ok && body?.ok), body };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    setStatus("sending");
    try {
      if (krok === 1) {
        const { ok, body } = await wyslij({ krok: 1, email: form.email, haslo: form.haslo, zgoda: form.zgoda });
        if (ok && body?.id) {
          track("salesai_lead", { krok: "email_haslo" });
          setProsba({ id: body.id, token: body.token ?? "" });
          setKrok(2);
          setStatus("idle");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        setBlad(body?.blad ?? null);
        setStatus("error");
        return;
      }
      const { ok, body } = await wyslij({ krok: 2, ...prosba, email: form.email, imie: form.imie, telefon: form.telefon, firma: form.firma, handlowcy: form.handlowcy, produkt: form.produkt });
      if (ok) {
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
    <AuroraShell tytul={x.tytul} etykietaPanelu={x.panel} aktywny={status === "ok" ? 2 : krok - 1} kroki={x.kroki.map((etykieta) => ({ etykieta }))}>
      {status === "ok" ? (
        <div key="ok" className={`${s.pane} ${s.enter}`}>
          <h2>{x.okH2}</h2>
          <p className={s.lead}>{x.okTekst}</p>
          <p className={s.login}>
            <Link href={adresStrony(jezyk, "firmy", naDomenie)}>← salesbruno.com</Link>
          </p>
        </div>
      ) : (
        <form key={`krok-${krok}`} onSubmit={submit} className={`${s.pane} ${s.enter}`}>
          {/* 18.10 (USER_001): bez podtytułu pod nagłówkiem. */}
          <h2 style={{ marginBottom: 28 }}>{krok === 1 ? x.h2 : x.h2krok2}</h2>

          {krok === 1 && (
            <>
              <div className={s.f}>
                <label htmlFor="email">{x.email} *</label>
                <div className={s.in}>
                  <input id="email" required type="email" autoComplete="email" autoFocus placeholder={x.emailPh} value={form.email} onChange={pole("email")} />
                </div>
              </div>
              <div className={s.f}>
                <label htmlFor="haslo">{x.haslo} *</label>
                <div className={s.in}>
                  <input id="haslo" required type="password" autoComplete="new-password" minLength={8} maxLength={72} placeholder={x.hasloPh} value={form.haslo} onChange={pole("haslo")} />
                </div>
              </div>
            </>
          )}

          {krok === 2 && (
            <>
              <div className={s.dwa}>
                <div className={s.f}>
                  <label htmlFor="imie">{x.imie} *</label>
                  <div className={s.in}>
                    <input id="imie" required autoComplete="given-name" autoFocus maxLength={80} placeholder={x.imiePh} value={form.imie} onChange={pole("imie")} />
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
            </>
          )}

          {/* Pułapka na boty: pole niewidoczne dla ludzi. */}
          <input type="text" name="www" tabIndex={-1} autoComplete="off" value={form.www} onChange={(e) => setForm((f) => ({ ...f, www: e.target.value }))} style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} aria-hidden />

          {krok === 1 && (
            <label className={s.zgoda}>
              <input type="checkbox" required checked={form.zgoda} onChange={(e) => setForm((f) => ({ ...f, zgoda: e.target.checked }))} />
              <span>
                {x.zgoda}{" "}
                <a href="/polityka-prywatnosci" target="_blank" rel="noopener">
                  {x.polityka}
                </a>
              </span>
            </label>
          )}

          {(blad || status === "error") && (
            <p className={s.err} role="alert">
              {blad ?? x.blad}
            </p>
          )}

          <button type="submit" disabled={status === "sending" || !(krok === 1 ? gotowe1 : gotowe2)} className={`${s.btnW} ${status === "sending" ? s.btnCzeka : ""}`} aria-busy={status === "sending"}>
            {status === "sending" && <span className={s.kolko} aria-hidden />}
            {status === "sending" ? x.wysylam : krok === 1 ? x.dalej : x.wyslij}
          </button>

          <p className={s.login}>
            {krok === 2 ? (
              <button type="button" onClick={() => { setKrok(1); setBlad(null); setStatus("idle"); }} style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", textDecoration: "underline", cursor: "pointer" }}>
                {x.wstecz}
              </button>
            ) : (
              <>
                {x.maKonto} <Link href={adresStrony(jezyk, "logowanie", naDomenie)}>{x.zaloguj}</Link>
              </>
            )}
          </p>
        </form>
      )}
    </AuroraShell>
  );
}
