"use client";

import { useState } from "react";

// Kod rabatowy z kopiowaniem jednym kliknięciem. Jeden przycisk = jeden kod (Otter ma dwa: Pro i Business).
export function KodPrzycisk({ etykieta, kod }: { etykieta: string; kod: string }) {
  const [ok, setOk] = useState(false);
  async function kopiuj() {
    try {
      await navigator.clipboard.writeText(kod);
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch {
      /* brak dostępu do schowka: kod jest widoczny, można go zaznaczyć ręcznie */
    }
  }
  return (
    <button type="button" className="bai-kod" onClick={kopiuj} aria-label={`Kopiuj kod ${kod}`}>
      <span className="bai-kod-nad">
        <span>Kod{etykieta ? ` ${etykieta}` : ""}</span>
        <span>{ok ? "Skopiowano" : "Kopiuj"}</span>
      </span>
      <span className="bai-kod-tekst">{kod}</span>
    </button>
  );
}
