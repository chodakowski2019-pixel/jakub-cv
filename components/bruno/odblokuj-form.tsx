"use client";

import { useState } from "react";

export default function OdblokujForm() {
  const [wiadomosc, setWiadomosc] = useState("");
  const [stan, setStan] = useState<"idle" | "wysylanie" | "ok" | "blad">("idle");

  const wyslij = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("wysylanie");
    const res = await fetch("/api/bruno/zainteresowany", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wiadomosc }) });
    setStan(res.ok ? "ok" : "blad");
  };

  if (stan === "ok") {
    return (
      <div className="bruno-szklo rounded-3xl p-8 text-center">
        <div className="bruno-h2 text-xl mb-2">Mam to.</div>
        <p className="text-slate-600">Jakub odezwie się do Ciebie w ciągu 1 dnia roboczego, żeby ustalić zakres i cenę. Do tego czasu trenuj dalej.</p>
      </div>
    );
  }

  return (
    <form onSubmit={wyslij} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5 max-w-xl mx-auto w-full">
      <div className="text-center">
        <div className="bruno-h2 text-xl">Jestem zainteresowany</div>
        <p className="text-sm text-slate-600 mt-1">Cena zależy od liczby handlowców i zakresu wdrożenia. Ustalamy ją w rozmowie.</p>
      </div>
      <div>
        <label className="bruno-etykieta" htmlFor="wiadomosc">Ilu handlowców i od kiedy? <span className="font-normal text-slate-400">(opcjonalnie)</span></label>
        <textarea id="wiadomosc" rows={3} className="bruno-pole" placeholder="np. 8 handlowców, chcemy zacząć od listopada" value={wiadomosc} onChange={(e) => setWiadomosc(e.target.value)} maxLength={2000} />
      </div>
      {stan === "blad" && <p className="text-sm text-red-700 text-center">Nie udało się wysłać. Napisz na hello@jakubchodakowski.com</p>}
      <button type="submit" disabled={stan === "wysylanie"} className="bruno-przycisk w-full">{stan === "wysylanie" ? "Wysyłam..." : "Chcę pełen dostęp"}</button>
    </form>
  );
}
