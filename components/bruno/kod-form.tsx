"use client";

import { useState } from "react";

// Zmiana stałego kodu logowania z panelu (USER_001 30.09).
// Stary kod wymagany: porzucona sesja w cudzej przeglądarce nie może
// wystarczyć do przejęcia konta.

export default function KodForm() {
  const [stary, setStary] = useState("");
  const [nowy, setNowy] = useState("");
  const [stan, setStan] = useState<"idle" | "zapis" | "ok">("idle");
  const [blad, setBlad] = useState<string | null>(null);

  const zapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    setStan("zapis");
    const res = await fetch("/api/bruno/kod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stary, nowy }),
    });
    if (res.ok) {
      setStan("ok");
      setStary("");
      setNowy("");
    } else {
      setStan("idle");
      setBlad((await res.json().catch(() => null))?.blad ?? "Nie udało się zmienić kodu.");
    }
  };

  const pole = (v: string, set: (s: string) => void, id: string, etykieta: string) => (
    <div>
      <label className="bruno-etykieta" htmlFor={id}>{etykieta}</label>
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoComplete={id === "stary" ? "current-password" : "new-password"}
        className="bruno-pole text-center text-xl tracking-[0.25em] font-semibold"
        placeholder="000000"
        value={v}
        onChange={(e) => set(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />
    </div>
  );

  return (
    <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
      <div>
        <h2 className="bruno-h2 text-lg">Kod logowania</h2>
        <p className="text-sm text-slate-600 mt-1">Tym kodem wchodzisz do panelu. Możesz go zmienić na swój.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {pole(stary, setStary, "stary", "Obecny kod")}
        {pole(nowy, setNowy, "nowy", "Nowy kod")}
      </div>
      {blad && <p className="text-sm text-red-700">{blad}</p>}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={stan === "zapis" || stary.length !== 6 || nowy.length !== 6} className="bruno-przycisk">
          {stan === "zapis" ? "Zmieniam..." : "Zmień kod"}
        </button>
        {stan === "ok" && <span className="text-sm text-teal-800">Kod zmieniony. Następnym razem logujesz się nowym.</span>}
      </div>
    </form>
  );
}
