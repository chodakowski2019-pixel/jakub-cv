"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuroraShell from "./aurora-shell";
import s from "./aurora.module.css";
import { useEffect } from "react";
import { useJezyk } from "./jezyk";
import GooglePrzycisk from "./google-przycisk";

// 9.10 (USER_001): EN domyślnie, PL z ?pl.
const T = {
  en: {
    nieUdalo: "Wrong email or code.",
    tytul: "Training panel",
    podtytul: "Sell more.",
    panel: "Steps to log in to Bruno AI",
    kroki: ["Enter your email", "Enter your 6-digit code", "Open your panel"],
    h2: "Log in",
    lead: "Enter your email and 6-digit code.",
    email: "Email",
    emailPh: "you@company.com",
    kod: "Code",
    zaloguj: "Log in",
    loguje: "Logging in...",
    brak: "No account yet?",
    rejestracja: "Sign up",
    rejHref: "/brunorejestracja",
    bladGoogle: "Google sign-in failed. Try again or use your code.",
    wygasl: "Your free access has ended.",
  },
  pl: {
    nieUdalo: "Nie udało się zalogować.",
    tytul: "Panel treningowy",
    podtytul: "Sprzedawaj więcej.",
    panel: "Kroki logowania do Bruno AI",
    kroki: ["Podaj email", "Wpisz swój 6-cyfrowy kod", "Wejdź do panelu"],
    h2: "Zaloguj się",
    lead: "Podaj adres i 6-cyfrowy kod.",
    email: "Adres e-mail",
    emailPh: "ty@twojafirma.pl",
    kod: "Kod",
    zaloguj: "Zaloguj się",
    loguje: "Loguję...",
    brak: "Nie masz dostępu?",
    rejestracja: "Zarejestruj się",
    rejHref: "/brunorejestracja?pl",
    bladGoogle: "Logowanie przez Google nie wyszło. Spróbuj ponownie albo użyj kodu.",
    wygasl: "Twój bezpłatny dostęp się skończył.",
  },
} as const;

// Logowanie Bruno w wyglądzie Aurora. Logika 1:1 z components/bruno/login-form.tsx:
// adres + stały 6-cyfrowy kod konta, POST /api/bruno/login, sukces = /bruno/panel.

const wygladaJakEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

export default function LogowanieForm({ google = false }: { google?: boolean }) {
  const router = useRouter();
  const jezyk = useJezyk();
  const x = T[jezyk];
  // Błąd z powrotu z Google (?blad=google / ?blad=wygasl).
  useEffect(() => {
    const b = new URLSearchParams(window.location.search).get("blad");
    if (b === "google") setBlad(x.bladGoogle);
    if (b === "wygasl") setBlad(x.wygasl);
  }, [x]);
  const [email, setEmail] = useState("");
  const [kod, setKod] = useState("");
  const [stan, setStan] = useState<"idle" | "wysylanie" | "ok">("idle");
  const [blad, setBlad] = useState<string | null>(null);
  const [fokusKod, setFokusKod] = useState(false);
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
      body: JSON.stringify({ email, kod, src: new URLSearchParams(window.location.search).get("src") }),
    });
    if (res.ok) {
      setStan("ok");
      router.push("/bruno/panel");
      router.refresh();
    } else {
      setStan("idle");
      const komunikat: string = (await res.json().catch(() => null))?.blad ?? x.nieUdalo;
      // Serwer odpowiada po polsku, więc w wersji EN pokazujemy własny komunikat.
      setBlad(jezyk === "pl" ? komunikat : x.nieUdalo);
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
              inputMode="numeric"
              autoComplete="current-password"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              className={s.kod}
              placeholder="000000"
              value={kod}
              onFocus={() => setFokusKod(true)}
              onBlur={() => setFokusKod(false)}
              onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
        </div>

        {blad && (
          <p className={s.err} role="alert">
            {blad}
          </p>
        )}

        <button type="submit" disabled={stan !== "idle" || kod.length !== 6} className={s.btnW}>
          {stan === "idle" ? x.zaloguj : x.loguje}
        </button>

        <p className={s.login}>
          {x.brak} <Link href={x.rejHref}>{x.rejestracja}</Link>
        </p>
      </form>
    </AuroraShell>
  );
}
