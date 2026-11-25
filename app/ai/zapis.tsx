"use client";

import { Fragment, useState } from "react";
import { zdarzenie } from "@/lib/analityka";
import { KLAUZULA } from "@/lib/newsletter-klauzula";

// 25.11.2026: zapis na newsletter „Promocje AI” w katalogu /ai (strona Black Week, lista, podstrony narzędzi).
// Ten sam endpoint co strona główna: /api/newsletter (double opt-in, tabela jc_newsletter, zrodlo „promocje-ai”).
// Jak na stronie głównej: bez okienka do zaznaczania, klik pod klauzulą = zgoda, a adres i tak trzeba potwierdzić w mailu.
// `ciemny` = czarny pas (strona Black Week); bez niego biała karta (lista i podstrony narzędzi, gdzie obok jest wezwanie do szkolenia).
export function Zapis({
  tytul = "Nowe promocje na narzędzia AI na e-mail",
  opis = "Raz w tygodniu: sprawdzone promocje i jedno narzędzie. Wypisanie jednym kliknięciem.",
  skad = "",
  ciemny = false,
}: {
  tytul?: string;
  opis?: string;
  skad?: string;
  ciemny?: boolean;
}) {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({
          email,
          zgoda: true,
          zrodlo: "promocje-ai",
          www,
        }),
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
    <aside
      className={`bai-zapis${ciemny ? " bai-zapis-ciemny" : ""}`}
      aria-label="Newsletter z promocjami"
    >
      <div className="bai-zapis-w">
        <div>
          <h2 className="bai-zapis-tytul">
            {/* „e-mail” nie może się łamać na łączniku. */}
            {tytul.split("e-mail").map((c, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="bai-nw">e-mail</span>}
                {c}
              </Fragment>
            ))}
          </h2>
          <p className="bai-zapis-opis">{opis}</p>
        </div>
        {stan === "ok" || stan === "juz" ? (
          <p className="bai-zapis-ok" role="status">
            {stan === "juz"
              ? "Ten adres jest już na liście."
              : "Jeszcze jeden krok: otwórz skrzynkę i kliknij „Potwierdzam zapis”."}
          </p>
        ) : (
          <form onSubmit={wyslij} className="bai-zapis-forma">
            <div className="bai-zapis-rzad">
              <input
                className="bai-pole"
                type="email"
                required
                autoComplete="email"
                placeholder="Adres e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Adres e-mail"
              />
              <button
                type="submit"
                className="bai-przycisk"
                disabled={stan === "wysylam"}
              >
                {stan === "wysylam" ? "Zapisuję..." : "Zapisz się"}
              </button>
            </div>
            <input
              type="text"
              name="www"
              tabIndex={-1}
              autoComplete="off"
              value={www}
              onChange={(e) => setWww(e.target.value)}
              className="bai-pulapka"
              aria-hidden
            />
            {stan === "blad" && (
              <p className="bai-zapis-blad" role="alert">
                {blad}
              </p>
            )}
            <p className="bai-zapis-klauzula">{KLAUZULA}</p>
          </form>
        )}
      </div>
    </aside>
  );
}
