"use client";

import { useState } from "react";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 14.10 (USER_001: „dymek czatu usuwamy, dodajmy to jako podzakładkę w ustawieniach”): sekcja „Napisz do nas”
// w Ustawieniach zamiast dymka w rogu (components/bruno/czat-dymek.tsx, już nieużywany). Ten sam kanał:
// /api/bruno/wiadomosc wysyła mail do USER_001 z reply-to = konto, odpowiedź wraca zwykłym mailem.

export default function WiadomoscForm() {
  const { t } = useT();
  const [tekst, setTekst] = useState("");
  const [stan, setStan] = useState<"idle" | "wysylanie" | "ok" | "blad">("idle");

  const wyslij = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tekst.trim().length < 2) return;
    setStan("wysylanie");
    const res = await fetch("/api/bruno/wiadomosc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tekst }),
    });
    if (res.ok) {
      setStan("ok");
      setTekst("");
    } else {
      setStan("blad");
    }
  };

  return (
    <section className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-4">
      <h2 className="bruno-h2 text-lg">{t("Message us", "Napisz do nas")}</h2>
      {stan === "ok" ? (
        <p className="text-sm text-teal-800">{t("Message sent. We'll reply by email.", "Wiadomość wysłana. Odpowiedź przyjdzie mailem.")}</p>
      ) : (
        <form onSubmit={wyslij} className="flex flex-col gap-3">
          <textarea className="bruno-pole" rows={4} placeholder={t("Question, problem, idea...", "Pytanie, problem, pomysł...")} value={tekst} onChange={(e) => setTekst(e.target.value)} maxLength={3000} />
          {stan === "blad" && <p className="text-xs text-red-700">{t("Couldn't send. Email us at hello@jakubchodakowski.com", "Nie udało się wysłać. Napisz na hello@jakubchodakowski.com")}</p>}
          <button type="submit" disabled={stan === "wysylanie" || tekst.trim().length < 2} className="bruno-przycisk self-start px-6 py-2.5 text-sm">
            {stan === "wysylanie" ? t("Sending...", "Wysyłam...") : t("Send", "Wyślij")}
          </button>
        </form>
      )}
    </section>
  );
}
