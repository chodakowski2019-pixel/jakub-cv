"use client";

import { useState } from "react";

// „Prześlij promocję”: tylko adres strony z ofertą (bez konta, bez danych osobowych). Zgłoszenie trafia mailem do Jakuba,
// nic nie jest publikowane automatycznie: sprawdzam ofertę u producenta i dopiero wtedy wpisuję ją do listy.
export function Zglos() {
  const [url, setUrl] = useState("");
  const [www, setWww] = useState("");
  const [stan, setStan] = useState<"" | "wysylam" | "ok" | "blad">("");
  const [blad, setBlad] = useState("");

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setStan("wysylam");
    try {
      const r = await fetch("/api/ai/zglos-promocje", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, www }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setBlad(j.blad || "Nie udało się wysłać. Spróbuj za chwilę.");
        setStan("blad");
        return;
      }
      setStan("ok");
    } catch {
      setBlad("Brak połączenia. Spróbuj za chwilę.");
      setStan("blad");
    }
  }

  return (
    <section className="bai-zglos" id="zglos">
      <h2 className="bai-h2-maly">Znasz promocję, której tu nie ma?</h2>
      <p className="bai-zglos-opis">Wklej adres strony z ofertą. Sprawdzę ją u producenta i dopiszę, jeśli się zgadza. Nie podajesz imienia ani e-maila.</p>
      {stan === "ok" ? (
        <p className="bai-zapis-ok" role="status">
          Dziękuję. Sprawdzę i dopiszę.
        </p>
      ) : (
        <form onSubmit={wyslij} className="bai-zapis-rzad">
          <input className="bai-pole" type="url" required placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Adres strony z promocją" />
          <input type="text" name="www" tabIndex={-1} autoComplete="off" value={www} onChange={(e) => setWww(e.target.value)} className="bai-pulapka" aria-hidden />
          <button type="submit" className="bai-przycisk-obrys" disabled={stan === "wysylam"}>
            {stan === "wysylam" ? "Wysyłam..." : "Prześlij promocję"}
          </button>
        </form>
      )}
      {stan === "blad" && (
        <p className="bai-zapis-blad" role="alert">
          {blad}
        </p>
      )}
    </section>
  );
}
