"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import s from "./praca.module.css";
import { Inicjaly } from "./wspolne";

// 17.10 (USER_001: „żadna oferta ma nie przekierowywać na strony zewnętrzne”): „Aplikuj” = nasz formularz.
// v2 (USER_001): ładniej, wgrywanie CV (PDF / DOC / DOCX, do 4 MB, limit Vercela 4,5 MB), zgoda = wymagana,
// po wysłaniu zielone kółko z ptaszkiem i samo „Wysłane!”. Zgłoszenie → /api/bruno/praca/aplikuj (mail z CV w załączniku).
const MAKS_MB = 4;
const TYPY = ".pdf,.doc,.docx,.odt,.rtf";

function rozmiar(b: number) {
  return b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export default function Aplikuj({ id, firma, stanowisko, logo, className }: { id: string; firma: string; stanowisko: string; logo?: string | null; className?: string }) {
  const [otwarte, setOtwarte] = useState(false);
  const [stan, setStan] = useState<"" | "wysylam" | "gotowe">("");
  const [blad, setBlad] = useState("");
  const [plik, setPlik] = useState<File | null>(null);
  const [nad, setNad] = useState(false);
  const plikRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = otwarte ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && zamknij();
    if (otwarte) document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", esc);
    };
  });

  function zamknij() {
    setOtwarte(false);
    if (stan === "gotowe") {
      setStan("");
      setPlik(null);
    }
  }
  function wybierz(f: File | null | undefined) {
    setBlad("");
    if (!f) return;
    if (!/\.(pdf|docx?|odt|rtf)$/i.test(f.name)) return setBlad("CV w formacie PDF, DOC albo DOCX.");
    if (f.size > MAKS_MB * 1024 * 1024) return setBlad(`Plik może mieć najwyżej ${MAKS_MB} MB.`);
    setPlik(f);
  }

  return (
    <>
      <button type="button" ref={btnRef} className={className} onClick={() => setOtwarte(true)}>
        Aplikuj
      </button>
      {otwarte &&
        createPortal(
          <div className={s.tlo} onClick={(e) => e.target === e.currentTarget && zamknij()} role="dialog" aria-modal="true" aria-label="Aplikuj">
            {stan === "gotowe" ? (
              <div className={`${s.okno} ${s.oknoGotowe}`}>
                <span className={s.ptaszek} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <h2 className={s.gotoweH}>Wysłane!</h2>
                <button type="button" className={`${s.btn} ${s.btnDuzy}`} onClick={zamknij}>
                  Wróć do oferty
                </button>
              </div>
            ) : (
              <form
                className={`${s.okno} ${s.oknoAplikuj}`}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBlad("");
                  const f = new FormData(e.currentTarget);
                  if (!f.get("zgoda")) return setBlad("Zaznacz zgodę na przekazanie danych pracodawcy.");
                  f.set("id", id);
                  if (plik) f.set("plik", plik);
                  setStan("wysylam");
                  const odp = await fetch("/api/bruno/praca/aplikuj", { method: "POST", body: f }).catch(() => null);
                  const j = await odp?.json().catch(() => null);
                  if (!odp?.ok || !j?.ok) {
                    setBlad(j?.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
                    setStan("");
                    return;
                  }
                  setStan("gotowe");
                }}
              >
                <button type="button" className={s.zamknijX} onClick={zamknij} aria-label="Zamknij">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                <div className={s.aplikujGlowa}>
                  <Inicjaly firma={firma} logo={logo} />
                  <div>
                    <p className={s.aplikujEtykieta}>Aplikujesz na stanowisko</p>
                    <h2 className={s.aplikujTytul}>{stanowisko}</h2>
                    <p className={s.aplikujFirma}>{firma}</p>
                  </div>
                </div>

                <input name="www" tabIndex={-1} autoComplete="off" className={s.pulapka} aria-hidden="true" />
                <div className={s.polaSiatka}>
                  <label className={s.pole}>
                    <span>Imię i nazwisko</span>
                    <input name="imie" required autoComplete="name" placeholder="Anna Kowalska" />
                  </label>
                  <label className={s.pole}>
                    <span>Telefon</span>
                    <input name="telefon" type="tel" required autoComplete="tel" placeholder="500 600 700" />
                  </label>
                </div>
                <label className={s.pole}>
                  <span>E-mail</span>
                  <input name="email" type="email" required autoComplete="email" placeholder="anna@gmail.com" />
                </label>

                <div className={s.pole}>
                  <span>CV</span>
                  {plik ? (
                    <div className={s.plikWybrany}>
                      <span className={s.plikIkona} aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M7 3h7l4 4v14H7ZM14 3v4h4" />
                        </svg>
                      </span>
                      <span className={s.plikNazwa}>
                        <b>{plik.name}</b>
                        <small>{rozmiar(plik.size)}</small>
                      </span>
                      <button type="button" className={s.plikUsun} onClick={() => setPlik(null)} aria-label="Usuń plik">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`${s.upuszczanie} ${nad ? s.upuszczanieNad : ""}`}
                      onClick={() => plikRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setNad(true);
                      }}
                      onDragLeave={() => setNad(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setNad(false);
                        wybierz(e.dataTransfer.files?.[0]);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
                      </svg>
                      <span>
                        <b>Dodaj CV</b> albo przeciągnij plik tutaj
                      </span>
                      <small>PDF, DOC, DOCX, do {MAKS_MB} MB</small>
                    </button>
                  )}
                  <input ref={plikRef} type="file" accept={TYPY} hidden onChange={(e) => wybierz(e.target.files?.[0])} />
                </div>

                <label className={s.pole}>
                  <span>
                    Link do LinkedIn <em className={s.opcjonalne}>nieobowiązkowe</em>
                  </span>
                  <input name="cv" placeholder="linkedin.com/in/anna-kowalska" />
                </label>
                <label className={s.pole}>
                  <span>
                    Kilka słów o sobie <em className={s.opcjonalne}>nieobowiązkowe</em>
                  </span>
                  <textarea name="wiadomosc" rows={3} placeholder="Od 3 lat sprzedaję B2B, głównie przez telefon." />
                </label>

                <label className={s.zgodaKarta}>
                  <input type="checkbox" name="zgoda" />
                  <span>
                    Zgadzam się na przekazanie moich danych pracodawcy w celu rekrutacji na to stanowisko. <b className={s.wymagane}>Wymagane</b>
                  </span>
                </label>
                {blad && <p className={s.blad}>{blad}</p>}
                <button type="submit" className={`${s.btn} ${s.btnDuzy} ${s.wyslijBtn}`} disabled={stan === "wysylam"}>
                  {stan === "wysylam" ? "Wysyłam…" : "Wyślij zgłoszenie"}
                </button>
              </form>
            )}
          </div>,
          // Do korzenia strony (czcionki Outfit / Inter z layoutu), nie do body.
          (btnRef.current?.closest(`.${s.root}`) as HTMLElement | null) ?? document.body,
        )}
    </>
  );
}
