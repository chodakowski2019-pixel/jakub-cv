"use client";

import { useState } from "react";
import { useT } from "@/components/bruno/jezyk-kontekst";

// Zmiana stałego kodu logowania z panelu (USER_001 30.09). 11.10: kod → hasło (min. 8 znaków; stary kod działa jak obecne hasło).
// Stary kod wymagany: porzucona sesja w cudzej przeglądarce nie może
// wystarczyć do przejęcia konta.

export default function KodForm() {
  const { t } = useT();
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
      setBlad((await res.json().catch(() => null))?.blad ?? t("Couldn't change the password.", "Nie udało się zmienić hasła."));
    }
  };

  const pole = (v: string, set: (s: string) => void, id: string, etykieta: string) => (
    <div>
      <label className="bruno-etykieta" htmlFor={id}>{etykieta}</label>
      <input
        id={id}
        type="password"
        minLength={id === "stary" ? 6 : 8}
        maxLength={72}
        required
        autoComplete={id === "stary" ? "current-password" : "new-password"}
        className="bruno-pole"
        value={v}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );

  return (
    <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
      <div>
        <h2 className="bruno-h2 text-lg">{t("Password", "Hasło")}</h2>
        <p className="text-sm text-slate-600 mt-1">{t("Change your login password. At least 8 characters.", "Zmień hasło do logowania. Co najmniej 8 znaków.")}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {pole(stary, setStary, "stary", t("Current password", "Obecne hasło"))}
        {pole(nowy, setNowy, "nowy", t("New password", "Nowe hasło"))}
      </div>
      {blad && <p className="text-sm text-red-700">{blad}</p>}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={stan === "zapis" || stary.length < 6 || nowy.length < 8} className="bruno-przycisk">
          {stan === "zapis" ? t("Changing...", "Zmieniam...") : t("Change password", "Zmień hasło")}
        </button>
        {stan === "ok" && <span className="text-sm text-teal-800">{t("Password changed.", "Hasło zmienione.")}</span>}
      </div>
    </form>
  );
}
