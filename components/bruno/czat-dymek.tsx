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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex flex-col items-end gap-3">
      {otwarty && (
        <form onSubmit={wyslij} className="bruno-szklo rounded-3xl p-4 sm:p-5 w-[calc(100vw-2rem)] max-w-sm flex flex-col gap-3 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="bruno-h2 text-base">Napisz do nas</div>
              <p className="text-xs text-slate-500 mt-0.5">Odpowiemy mailem na adres Twojego konta.</p>
            </div>
            <button type="button" onClick={() => setOtwarty(false)} aria-label="Zamknij" className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1">×</button>
          </div>
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
      )}
      <button
        type="button"
        onClick={() => { setOtwarty((o) => !o); if (stan === "ok") setStan("idle"); }}
        aria-label={otwarty ? "Zamknij czat" : "Napisz do nas"}
        aria-expanded={otwarty}
        className="size-14 rounded-full bg-gradient-to-br from-cyan-700 to-teal-700 text-white shadow-[0_10px_30px_rgba(14,116,144,0.35)] flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        {otwarty ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12z" />
          </svg>
        )}
      </button>
    </div>
  );
}
