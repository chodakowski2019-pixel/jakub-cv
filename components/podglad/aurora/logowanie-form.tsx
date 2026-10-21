"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuroraShell from "./aurora-shell";
import s from "./aurora.module.css";
import { useEffect } from "react";
import { adresStrony, useJezyk, useNaDomenie } from "./jezyk";
import type { Jezyk } from "@/lib/bruno/domeny";
import GooglePrzycisk from "./google-przycisk";

// 9.10 (USER_001): EN domyślnie, PL z ?pl. 11.10: PL też na salesbruno.pl.
const T = {
  en: {
    nieUdalo: "Wrong email or password.",
    tytul: "Training panel",
    podtytul: "Sell more.",
    panel: "Steps to log in to Bruno AI",
    kroki: ["Enter your email", "Enter your password", "Open your panel"],
    h2: "Log in",
    lead: "Enter your email and password.",
    email: "Email",
    emailPh: "you@company.com",
    kod: "Password",
    zapomnialem: "Forgot your password?",
    resetH: "We'll email you a new password.",
    resetWyslij: "Send new password",
    resetOk: "If this email has an account, a new password is on its way. Check your inbox.",
    resetWroc: "Back to log in",
    zaloguj: "Log in",
    loguje: "Logging in...",
    brak: "No access yet?",
    rejestracja: "Request access",
    bladBrak: "This email has no account yet. Request access below.",
    bladGoogle: "Google sign-in failed. Try again or use your password.",
    wygasl: "Your access has ended.",
  },
  pl: {
    nieUdalo: "Zły e-mail albo hasło.",
    tytul: "Panel treningowy",
    podtytul: "Sprzedawaj więcej.",
    panel: "Kroki logowania do Bruno AI",
    kroki: ["Podaj e-mail", "Wpisz hasło", "Wejdź do panelu"],
    h2: "Zaloguj się",
    lead: "Podaj e-mail i hasło.",
    email: "Adres e-mail",
    emailPh: "ty@twojafirma.pl",
    kod: "Hasło",
    zapomnialem: "Nie pamiętasz hasła?",
    resetH: "Wyślemy Ci nowe hasło mailem.",
    resetWyslij: "Wyślij nowe hasło",
    resetOk: "Jeśli ten e-mail ma konto, nowe hasło już leci. Sprawdź skrzynkę.",
    resetWroc: "Wróć do logowania",
    zaloguj: "Zaloguj się",
    loguje: "Loguję...",
    brak: "Nie masz jeszcze dostępu?",
    rejestracja: "Chcę otrzymać dostęp",
    bladBrak: "Ten e-mail nie ma jeszcze konta. Kliknij „Chcę otrzymać dostęp” poniżej.",
    bladGoogle: "Logowanie przez Google nie wyszło. Spróbuj ponownie albo użyj hasła.",
    wygasl: "Twój dostęp się skończył.",
  },
} as const;

// Logowanie Bruno w wyglądzie Aurora. Logika 1:1 z components/bruno/login-form.tsx:
// adres + stały 6-cyfrowy kod konta, POST /api/bruno/login, sukces = /bruno/panel.

const wygladaJakEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

export default function LogowanieForm({ google = false, jezykStart, naDomenieStart }: { google?: boolean; jezykStart?: Jezyk; naDomenieStart?: boolean }) {
  const router = useRouter();
  const jezyk = useJezyk(jezykStart);
  const naDomenie = useNaDomenie(naDomenieStart);
  const x = T[jezyk];
  // Błąd z powrotu z Google (?blad=google / ?blad=wygasl).
  useEffect(() => {
    const b = new URLSearchParams(window.location.search).get("blad");
    if (b === "google") setBlad(x.bladGoogle);
    if (b === "wygasl") setBlad(x.wygasl);
    // 17.10: Google nie zakłada już kont (Bruno tylko B2B, dostęp daje USER_001).
    if (b === "brak") setBlad(x.bladBrak);
  }, [x]);
  const [email, setEmail] = useState("");
  const [kod, setKod] = useState("");
  const [stan, setStan] = useState<"idle" | "wysylanie" | "ok">("idle");
  const [blad, setBlad] = useState<string | null>(null);
  const [fokusKod, setFokusKod] = useState(false);
  // 11.10: „Nie pamiętasz hasła?” → nowe hasło tymczasowe mailem (POST /api/bruno/haslo).
  const [reset, setReset] = useState<"nie" | "formularz" | "wysylanie" | "wyslane">("nie");
  const wyslijReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setReset("wysylanie");
    await fetch("/api/bruno/haslo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    setReset("wyslane");
  };
  const emailRef = useRef<HTMLInputElement>(null);
  const kodRef = useRef<HTMLInputElement>(null);

  const zaloguj = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    setStan("wysylanie");
    const res = await fetch("/api/bruno/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // E18: źródło wejścia z linku w mailu (`/bruno?src=mail-dostep`) idzie do logu logowań.
      body: JSON.stringify({ email, haslo: kod, src: new URLSearchParams(window.location.search).get("src") }),
    });
    if (res.ok) {
      setStan("ok");
      router.push("/bruno/panel");
      router.refresh();
    } else {
      setStan("idle");
      const komunikat: string = (await res.json().catch(() => null))?.blad ?? x.nieUdalo;
      setBlad(komunikat);
    }
  };

  // Krok w lewym panelu: 1 = adres, 2 = kod, 3 = wejście do panelu.
  const aktywny =
    stan !== "idle" ? 2 : fokusKod || kod.length > 0 || wygladaJakEmail(email) ? 1 : 0;

  return (
    <AuroraShell
      tytul={x.tytul}
      podtytul={x.podtytul}
      etykietaPanelu={x.panel}
      aktywny={aktywny}
      kroki={[
        { etykieta: x.kroki[0], onClick: () => emailRef.current?.focus() },
        { etykieta: x.kroki[1], onClick: () => kodRef.current?.focus() },
        { etykieta: x.kroki[2] },
      ]}
    >
      {reset !== "nie" ? (
        <form onSubmit={wyslijReset} className={`${s.pane} ${s.enter}`}>
          <h2>{x.zapomnialem}</h2>
          <p className={s.lead}>{reset === "wyslane" ? x.resetOk : x.resetH}</p>
          {reset !== "wyslane" && (
            <>
              <div className={s.f}>
                <label htmlFor="email-reset">{x.email}</label>
                <div className={s.in}>
                  <input id="email-reset" type="email" required autoComplete="email" placeholder={x.emailPh} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={reset === "wysylanie" || !wygladaJakEmail(email)} className={s.btnW}>
                {x.resetWyslij}
              </button>
            </>
          )}
          <p className={s.login}>
            <a href="#" onClick={(e) => { e.preventDefault(); setReset("nie"); }}>{x.resetWroc}</a>
          </p>
        </form>
      ) : (
      <form onSubmit={zaloguj} className={`${s.pane} ${s.enter}`}>
        <h2>{x.h2}</h2>
        <p className={s.lead}>{x.lead}</p>
        {google && <GooglePrzycisk jezyk={jezyk} />}

        <div className={s.f}>
          <label htmlFor="email">{x.email}</label>
          <div className={s.in}>
            <input
              ref={emailRef}
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder={x.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className={s.f} style={{ marginBottom: 0 }}>
          <label htmlFor="kod">{x.kod}</label>
          <div className={s.in}>
            <input
              ref={kodRef}
              id="kod"
              type="password"
              autoComplete="current-password"
              minLength={6}
              maxLength={72}
              required
              value={kod}
              onFocus={() => setFokusKod(true)}
              onBlur={() => setFokusKod(false)}
              onChange={(e) => setKod(e.target.value)}
            />
          </div>
        </div>

        {blad && (
          <p className={s.err} role="alert">
            {blad}
          </p>
        )}

        <button type="submit" disabled={stan !== "idle" || kod.length < 6} className={s.btnW}>
          {stan === "idle" ? x.zaloguj : x.loguje}
        </button>

        <p className={s.login}>
          {x.brak} <Link href={adresStrony(jezyk, "rejestracja", naDomenie)}>{x.rejestracja}</Link>
        </p>
        <p className={s.login} style={{ marginTop: 6 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setReset("formularz"); }}>{x.zapomnialem}</a>
        </p>
      </form>
      )}
    </AuroraShell>
  );
}
