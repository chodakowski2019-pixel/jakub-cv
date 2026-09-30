"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kod, setKod] = useState("");
  const [krok, setKrok] = useState<"email" | "kod">("email");
  const [stan, setStan] = useState<"idle" | "wysylanie">("idle");
  const [blad, setBlad] = useState<string | null>(null);

  const wyslijKod = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    setStan("wysylanie");
    const res = await fetch("/api/bruno/kod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setStan("idle");
    if (res.ok) setKrok("kod");
    else setBlad((await res.json().catch(() => null))?.blad ?? "Nie udało się wysłać kodu.");
  };

  const zaloguj = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    setStan("wysylanie");
    const res = await fetch("/api/bruno/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, kod }) });
    setStan("idle");
    if (res.ok) {
      router.push("/bruno/panel");
      router.refresh();
    } else setBlad((await res.json().catch(() => null))?.blad ?? "Nie udało się zalogować.");
  };

  return (
    <div className="bruno-szklo rounded-3xl p-6 sm:p-8">
      {krok === "email" ? (
        <form onSubmit={wyslijKod} className="flex flex-col gap-5">
          <div>
            <label className="bruno-etykieta" htmlFor="email">Adres e-mail</label>
            <input id="email" type="email" required autoComplete="email" className="bruno-pole" placeholder="ty@twojafirma.pl" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {blad && <p className="text-red-700 text-sm">{blad}</p>}
          <button type="submit" disabled={stan === "wysylanie"} className="bruno-przycisk w-full">
            {stan === "wysylanie" ? "Wysyłam..." : "Wyślij kod"}
          </button>
        </form>
      ) : (
        <form onSubmit={zaloguj} className="flex flex-col gap-5">
          <p className="text-sm text-slate-600">
            Kod poszedł na <b className="text-slate-900">{email}</b>. Jeśli masz dostęp testowy, dotrze w minutę. Sprawdź też spam.
          </p>
          <div>
            <label className="bruno-etykieta" htmlFor="kod">Kod z maila</label>
            <input
              id="kod"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              className="bruno-pole text-center text-2xl tracking-[0.3em] font-semibold"
              placeholder="000000"
              value={kod}
              onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
            />
          </div>
          {blad && <p className="text-red-700 text-sm">{blad}</p>}
          <button type="submit" disabled={stan === "wysylanie" || kod.length !== 6} className="bruno-przycisk w-full">
            {stan === "wysylanie" ? "Loguję..." : "Wejdź"}
          </button>
          <button type="button" onClick={() => setKrok("email")} className="text-sm text-slate-500 hover:text-slate-900">
            Inny adres
          </button>
        </form>
      )}
    </div>
  );
}
