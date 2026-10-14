"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { track } from "@vercel/analytics";
import AuroraShell from "./aurora-shell";
import s from "./aurora.module.css";
import { adresStrony, useJezyk, useNaDomenie } from "./jezyk";
import type { Jezyk } from "@/lib/bruno/domeny";
import GooglePrzycisk from "./google-przycisk";

// 11.10 (USER_001): rejestracja = TYLKO e-mail + hasło (+ zgoda) albo Google. Konto od razu
// zalogowane, dalej /bruno/start (imię, telefon, rola, handlowcy, produkt), potem panel i 3 rozmowy.

const T = {
  en: {
    tytul: "Get access",
    panel: "Steps to join Bruno AI",
    kroki: ["Create your account", "Tell Bruno about you", "Practice with Bruno"],
    h2: "Sign up",
    lead: "3 free calls. No card.",
    email: "Email",
    emailPh: "adam@gmail.com",
    haslo: "Password",
    hasloPh: "At least 8 characters",
    zgoda: "I accept the",
    polityka: "Privacy Policy",
    blad: "Something went wrong. Email hello@jakubchodakowski.com",
    wysylam: "Creating your account...",
    wyslij: "Create account →",
    maKonto: "Already have an account?",
    zaloguj: "Log in",
  },
  pl: {
    tytul: "Otrzymaj dostęp",
    panel: "Kroki do Bruno AI",
    kroki: ["Załóż konto", "Powiedz Bruno o sobie", "Trenuj z Bruno"],
    h2: "Zarejestruj się",
    lead: "3 bezpłatne rozmowy. Bez karty.",
    email: "Adres e-mail",
    emailPh: "adam@gmail.com",
    haslo: "Hasło",
    hasloPh: "Co najmniej 8 znaków",
    zgoda: "Akceptuję",
    polityka: "politykę prywatności",
    blad: "Coś poszło nie tak. Napisz na hello@jakubchodakowski.com",
    wysylam: "Zakładam konto...",
    wyslij: "Załóż konto →",
    maKonto: "Masz już konto?",
    zaloguj: "Zaloguj się",
  },
} as const;

export default function RejestracjaForm({ google = false, jezykStart, naDomenieStart }: { google?: boolean; jezykStart?: Jezyk; naDomenieStart?: boolean }) {
  const jezyk = useJezyk(jezykStart);
  const naDomenie = useNaDomenie(naDomenieStart);
  const router = useRouter();
  const x = T[jezyk];
  const [form, setForm] = useState({ email: "", haslo: "", zgoda: false, www: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [blad, setBlad] = useState<string | null>(null);

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
      const body = (await res.json().catch(() => null)) as { ok?: boolean; blad?: string; dalej?: string } | null;
      if (res.ok && body?.ok) {
        track("salesai_lead", { krok: "konto" });
        router.push(body.dalej ?? "/bruno/start");
        router.refresh();
        return;
      }
      setBlad(body?.blad ?? null);
      setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <AuroraShell tytul={x.tytul} etykietaPanelu={x.panel} aktywny={0} kroki={x.kroki.map((etykieta) => ({ etykieta }))}>
      <form key="form" onSubmit={submit} className={`${s.pane} ${s.enter}`}>
        <h2>{x.h2}</h2>
        {/* 14.10 (USER_001): na telefonie bez „3 bezpłatne rozmowy. Bez karty.” */}
        <p className={`${s.lead} ${s.leadBezTelefonu}`}>{x.lead}</p>
        {google && <GooglePrzycisk jezyk={jezyk} />}

        <div className={s.f}>
          <label htmlFor="email">{x.email} *</label>
          <div className={s.in}>
            <input id="email" required type="email" autoComplete="email" placeholder={x.emailPh} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
        </div>

        <div className={s.f}>
          <label htmlFor="haslo">{x.haslo} *</label>
          <div className={s.in}>
            <input id="haslo" required type="password" minLength={8} maxLength={72} autoComplete="new-password" placeholder={x.hasloPh} value={form.haslo} onChange={(e) => setForm((f) => ({ ...f, haslo: e.target.value }))} />
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

        <button type="submit" disabled={status === "sending" || form.haslo.length < 8 || !form.zgoda} className={s.btnW}>
          {status === "sending" ? x.wysylam : x.wyslij}
        </button>

        <p className={s.login}>
          {x.maKonto} <Link href={adresStrony(jezyk, "logowanie", naDomenie)}>{x.zaloguj}</Link>
        </p>
      </form>
    </AuroraShell>
  );
}
