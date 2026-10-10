"use client";

import { useState } from "react";

// „Odblokuj pełen dostęp" (USER_001 1.10): sam przycisk, bez pola tekstowego
// i bez zdania o cenie. Klik = mail do USER_001, tester widzi potwierdzenie
// z terminem kontaktu do 3 dni roboczych.

export default function OdblokujForm() {
  const [stan, setStan] = useState<"idle" | "wysylanie" | "ok" | "blad">("idle");

  const wyslij = async () => {
    setStan("wysylanie");
    const res = await fetch("/api/bruno/zainteresowany", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setStan(res.ok ? "ok" : "blad");
  };

  if (stan === "ok") {
    return (
      <div className="bruno-szklo rounded-3xl p-8 text-center max-w-xl mx-auto w-full">
        <div className="bruno-h2 text-xl mb-2">Request sent.</div>
        <p className="text-slate-600">We'll get back to you within 3 business days.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button type="button" onClick={wyslij} disabled={stan === "wysylanie"} className="bruno-przycisk text-base px-10 py-4">
        {stan === "wysylanie" ? "Sending..." : "Get full access"}
      </button>
      {stan === "blad" && <p className="text-sm text-red-700 text-center">Couldn't send. Email us at hello@jakubchodakowski.com</p>}
    </div>
  );
}
