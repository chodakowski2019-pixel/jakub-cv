"use client";

import { useState } from "react";

// Dymek czatu w prawym dolnym rogu (USER_001 1.10). Tester pisze wiadomość,
// serwer wysyła ją mailem do USER_001 z reply-to = tester, więc USER_001
// odpisuje zwykłym „Odpowiedz" w Gmailu i odpowiedź trafia prosto do testera.
// Żadnej skrzynki w panelu: to kanał jednokierunkowy do maila.

export default function CzatDymek() {
  const [otwarty, setOtwarty] = useState(false);
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
    <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-20 flex flex-col items-end gap-3">
      {otwarty && (
        <div className="bruno-szklo rounded-3xl overflow-hidden w-[calc(100vw-2.5rem)] max-w-sm shadow-[0_24px_60px_rgba(212,175,90,0.22)]">
          <div className="px-5 py-4 bg-gradient-to-r from-cyan-700 to-teal-700 text-white flex items-center gap-3">
            <span className="size-9 rounded-full bg-white/15 grid place-items-center bruno-h2 text-sm">B</span>
            <div className="min-w-0 flex-1">
              <div className="bruno-h2 text-[15px] leading-tight">Napisz do nas</div>
              <div className="text-[12px] text-white/80">Odpowiemy mailem na adres Twojego konta.</div>
            </div>
            <button type="button" onClick={() => setOtwarty(false)} aria-label="Zamknij" className="text-white/80 hover:text-white text-2xl leading-none px-1">×</button>
          </div>
          <form onSubmit={wyslij} className="p-4 sm:p-5 flex flex-col gap-3">
            {stan === "ok" ? (
              <p className="text-sm text-teal-800 py-2">Wiadomość wysłana. Odpowiedź przyjdzie mailem.</p>
            ) : (
              <>
                <textarea
                  className="bruno-pole text-[14px]"
                  rows={4}
                  placeholder="Pytanie, problem, pomysł..."
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value)}
                  maxLength={3000}
                  autoFocus
                />
                {stan === "blad" && <p className="text-xs text-red-700">Nie udało się wysłać. Napisz na hello@jakubchodakowski.com</p>}
                <button type="submit" disabled={stan === "wysylanie" || tekst.trim().length < 2} className="bruno-przycisk w-full py-2.5 text-sm">
                  {stan === "wysylanie" ? "Wysyłam..." : "Wyślij"}
                </button>
              </>
            )}
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => { setOtwarty((o) => !o); if (stan === "ok") setStan("idle"); }}
        aria-label={otwarty ? "Zamknij czat" : "Napisz do nas"}
        aria-expanded={otwarty}
        className={`bruno-dymek ${otwarty ? "bruno-dymek-otwarty" : ""}`}
      >
        {otwarty ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
            <path d="M12 3C7 3 3 6.4 3 10.6c0 2.3 1.2 4.3 3.1 5.7L5.4 20l4-1.9c.8.2 1.7.3 2.6.3 5 0 9-3.4 9-7.6S17 3 12 3z" />
            <circle cx="8.5" cy="10.8" r="1.1" fill="#d4af5a" />
            <circle cx="12" cy="10.8" r="1.1" fill="#d4af5a" />
            <circle cx="15.5" cy="10.8" r="1.1" fill="#d4af5a" />
          </svg>
        )}
      </button>
    </div>
  );
}
