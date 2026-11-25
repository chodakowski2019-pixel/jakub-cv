"use client";

import { useState } from "react";
import { zdarzenie } from "@/lib/analityka";
import { KLAUZULA } from "@/lib/newsletter-klauzula";

// 25.11.2026: zapis na newsletter „Promocje AI” w katalogu /ai (strona Black Week, lista, podstrony narzędzi).
// Ten sam endpoint co strona główna: /api/newsletter (double opt-in, tabela jc_newsletter, zrodlo „promocje-ai”).
export function Zapis({ tytul = "Promocje na narzędzia AI na e-mail", opis = "Raz w tygodniu: nowe promocje i jedno sprawdzone narzędzie. Bez spamu.", skad = "" }: { tytul?: string; opis?: string; skad?: string }) {
  const [email, setEmail] = useState("");
  const [zgoda, setZgoda] = useState(false);
  const [www, setWww] = useState("");
  const [stan, setStan] = useState<"" | "wysylam" | "ok" | "juz" | "blad">("");
  const [blad, setBlad] = useState("");

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setStan("wysylam");
    setBlad("");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, zgoda, zrodlo: "promocje-ai", www }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setBlad(j.blad || "Zapis się nie udał. Spróbuj za chwilę.");
        setStan("blad");
        return;
      }
      zdarzenie("zapis_newsletter", { zrodlo: "promocje-ai", skad });
      setStan(j.stan === "juz" ? "juz" : "ok");
    } catch {
      setBlad("Brak połączenia. Spróbuj za chwilę.");
      setStan("blad");
    }
  }

  return (
    <aside className="bai-zapis" aria-label="Newsletter z promocjami">
      <p className="bai-mono bai-zapis-nad">Newsletter</p>
      <h2 className="bai-zapis-tytul">{tytul}</h2>
      <p className="bai-zapis-opis">{opis}</p>
      {stan === "ok" || stan === "juz" ? (
        <p className="bai-zapis-ok" role="status">
          {stan === "juz" ? "Ten adres jest już na liście." : "Sprawdź skrzynkę i kliknij „Potwierdzam zapis”. Bez kliknięcia nic nie wyślę."}
        </p>
      ) : (
        <form onSubmit={wyslij} className="bai-zapis-forma">
          <div className="bai-zapis-rzad">
            <input className="bai-pole" type="email" required autoComplete="email" placeholder="Twój adres e-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Adres e-mail" />
            <button type="submit" className="bai-przycisk" disabled={stan === "wysylam" || !zgoda}>
              {stan === "wysylam" ? "Zapisuję..." : "Zapisz się"}
            </button>
          </div>
          <input type="text" name="www" tabIndex={-1} autoComplete="off" value={www} onChange={(e) => setWww(e.target.value)} className="bai-pulapka" aria-hidden />
          <label className="bai-zapis-zgoda">
            <input type="checkbox" checked={zgoda} onChange={(e) => setZgoda(e.target.checked)} />
            <span>{KLAUZULA}</span>
          </label>
          {stan === "blad" && (
            <p className="bai-zapis-blad" role="alert">
              {blad}
            </p>
          )}
        </form>
      )}
    </aside>
  );
}
