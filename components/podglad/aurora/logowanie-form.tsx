"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuroraShell from "./aurora-shell";
import s from "./aurora.module.css";

// Logowanie Bruno w wyglądzie Aurora. Logika 1:1 z components/bruno/login-form.tsx:
// adres + stały 6-cyfrowy kod konta, POST /api/bruno/login, sukces = /bruno/panel.

const wygladaJakEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

export default function LogowanieForm() {
  const router = useRouter();
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
      body: JSON.stringify({ email, kod }),
    });
    if (res.ok) {
      setStan("ok");
      router.push("/bruno/panel");
      router.refresh();
    } else {
      setStan("idle");
      setBlad((await res.json().catch(() => null))?.blad ?? "Nie udało się zalogować.");
    }
  };

  // Krok w lewym panelu: 1 = adres, 2 = kod, 3 = wejście do panelu.
  const aktywny =
    stan !== "idle" ? 2 : fokusKod || kod.length > 0 || wygladaJakEmail(email) ? 1 : 0;

  return (
    <AuroraShell
      tytul="Panel treningowy"
      podtytul="Trening rozmów sprzedażowych z Bruno AI."
      etykietaPanelu="Kroki logowania do Bruno AI"
      aktywny={aktywny}
      kroki={[
        { etykieta: "Podaj email", onClick: () => emailRef.current?.focus() },
        { etykieta: "Wpisz swój 6-cyfrowy kod", onClick: () => kodRef.current?.focus() },
        { etykieta: "Wejdź do panelu" },
      ]}
    >
      <form onSubmit={zaloguj} className={`${s.pane} ${s.enter}`}>
        <h2>Zaloguj się</h2>
        <p className={s.lead}>Podaj adres i 6-cyfrowy kod.</p>

        <div className={s.f}>
          <label htmlFor="email">Adres e-mail</label>
          <div className={s.in}>
            <input
              ref={emailRef}
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ty@twojafirma.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className={s.f} style={{ marginBottom: 0 }}>
          <label htmlFor="kod">Kod</label>
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
          {stan === "idle" ? "Zaloguj się" : "Loguję..."}
        </button>

        <p className={s.login}>
          Nie masz dostępu? <Link href="/brunorejestracja">Zarejestruj się</Link>
        </p>
      </form>
    </AuroraShell>
  );
}
