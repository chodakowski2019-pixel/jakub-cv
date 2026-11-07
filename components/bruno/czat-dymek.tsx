"use client";

import { useState } from "react";
import { useT } from "@/components/bruno/jezyk-kontekst";

// Dymek czatu w prawym dolnym rogu (USER_001 1.10). Tester pisze wiadomość,
// serwer wysyła ją mailem do USER_001 z reply-to = tester, więc USER_001
// odpisuje zwykłym „Odpowiedz" w Gmailu i odpowiedź trafia prosto do testera.
// Żadnej skrzynki w panelu: to kanał jednokierunkowy do maila.
// 6.11 (USER_001: „popraw czat”): nowy wygląd w systemie zakładek (panel-2.css, pcz-*): biała karta, awatar „B”
// z zieloną kropką, pierwsza wiadomość od Bruno jak w komunikatorze, pole, przycisk limonkowy, stan „wysłane” z ✓.

export default function CzatDymek() {
  const { t } = useT();
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
    <div className="pcz bruno-czat">
      {otwarty && (
        <div className="pcz-okno" role="dialog" aria-label={t("Message us", "Napisz do nas")}>
          <div className="pcz-hd">
            <span className="pcz-awatar" aria-hidden>B</span>
            <div className="min-w-0">
              <b>{t("Message us", "Napisz do nas")}</b>
              <small>{t("We reply by e-mail, usually the same day.", "Odpowiadamy mailem, zwykle tego samego dnia.")}</small>
            </div>
            <button type="button" className="pcz-x" onClick={() => setOtwarty(false)} aria-label={t("Close", "Zamknij")}>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </div>
          <form onSubmit={wyslij} className="pcz-tresc">
            <div className="pcz-bot">
              <span className="pcz-awatar" aria-hidden>B</span>
              <div className="pcz-dymek-bot">{t("Hi! Question, problem or an idea for Bruno? Write it here.", "Cześć! Pytanie, problem albo pomysł na Bruno? Napisz tutaj.")}</div>
            </div>
            {stan === "ok" ? (
              <div className="pcz-ok">
                <i aria-hidden><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3 3 7-7" /></svg></i>
                {t("Sent. We'll reply by e-mail.", "Wysłane. Odpowiedź przyjdzie mailem.")}
              </div>
            ) : (
              <>
                <textarea
                  className="pcz-pole"
                  rows={4}
                  placeholder={t("Write a message…", "Napisz wiadomość…")}
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value)}
                  maxLength={3000}
                  autoFocus
                />
                {stan === "blad" && <p className="pcz-blad">{t("Couldn't send. Email us at hello@jakubchodakowski.com", "Nie udało się wysłać. Napisz na hello@jakubchodakowski.com")}</p>}
                <div className="pcz-stopka">
                  <small>{tekst.length > 0 ? `${tekst.length} / 3000` : t("Enter = new line", "Enter = nowa linia")}</small>
                  <button type="submit" disabled={stan === "wysylanie" || tekst.trim().length < 2} className="p-btn p-btn-s" style={{ opacity: stan === "wysylanie" || tekst.trim().length < 2 ? 0.5 : 1 }}>
                    {stan === "wysylanie" ? t("Sending…", "Wysyłam…") : t("Send", "Wyślij")}
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 8h11M9 4l4 4-4 4" /></svg>
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => { setOtwarty((o) => !o); if (stan === "ok") setStan("idle"); }}
        aria-label={otwarty ? t("Close chat", "Zamknij czat") : t("Message us", "Napisz do nas")}
        aria-expanded={otwarty}
        className="pcz-btn"
      >
        {otwarty ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 4c-4.4 0-8 3-8 6.7 0 2 1 3.8 2.7 5L6 20l3.6-1.7c.8.2 1.6.3 2.4.3 4.4 0 8-3 8-6.7S16.4 4 12 4z" />
            <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth="2.6" />
          </svg>
        )}
      </button>
    </div>
  );
}
