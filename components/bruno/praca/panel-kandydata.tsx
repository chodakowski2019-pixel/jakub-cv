"use client";

import { useEffect, useRef, useState } from "react";
import type { KontoPraca } from "@/lib/bruno/praca/konta";
import type { OfertaLista } from "@/lib/bruno/praca/oferty";
import type { Zgloszenie } from "@/app/brunopraca/panel/page";
import Karta, { czytajZapisane } from "./karta";
import { PanelGlowa, Wyloguj, formatDaty } from "./panel-wspolne";
import s from "./praca.module.css";
import { KartaBruno } from "./wspolne";

// 17.10 (USER_001): panel kandydata. Zakładki: Moje zgłoszenia · Zapisane oferty · Profil i CV.
// Zapisane z przeglądarki (serce bez konta) scalają się z kontem przy pierwszym wejściu.
const STATUS_Z: Record<string, [string, string]> = {
  nowe: ["Wysłane", s.statusCzeka],
  obejrzane: ["Pracodawca obejrzał", s.statusAktywna],
  zaproszone: ["Zaproszenie na rozmowę", s.statusAktywna],
  odrzucone: ["Odrzucone", s.statusWstrzymana],
};
type Zakladka = "zgloszenia" | "zapisane" | "profil";

export default function PanelKandydata({
  konto,
  zgloszenia,
  zapisane,
  teraz,
  zakladka,
}: {
  konto: KontoPraca;
  zgloszenia: (Zgloszenie & { oferta: OfertaLista | null })[];
  zapisane: OfertaLista[];
  teraz: number;
  zakladka?: string;
}) {
  const [z, setZ] = useState<Zakladka>(zakladka === "zapisane" ? "zapisane" : zakladka === "profil" ? "profil" : "zgloszenia");
  const scalone = useRef(false);
  // Serca zaznaczone przed założeniem konta → do konta (raz).
  useEffect(() => {
    if (scalone.current) return;
    scalone.current = true;
    const lokalne = czytajZapisane().filter((id) => !zapisane.some((o) => o.id === id));
    if (lokalne.length)
      fetch("/api/bruno/praca/zapisane", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: lokalne }) }).then(() => location.reload());
  }, [zapisane]);

  const zakladki: [Zakladka, string, number][] = [
    ["zgloszenia", "Moje zgłoszenia", zgloszenia.length],
    ["zapisane", "Zapisane oferty", zapisane.length],
    ["profil", "Profil i CV", 0],
  ];
  return (
    <main className={s.panel2}>
      <PanelGlowa etykieta="Panel kandydata" tytul={konto.imie ? `Cześć, ${konto.imie}` : "Twój panel"} opis={konto.email} />
      <div className={s.panelZakladki} role="tablist">
        {zakladki.map(([k, n, ile]) => (
          <button type="button" role="tab" aria-selected={z === k} key={k} className={z === k ? s.panelZakladkaOn : ""} onClick={() => setZ(k)}>
            {n}
            {ile ? <span className={s.panelIle}>{ile}</span> : null}
          </button>
        ))}
      </div>

      {z === "zgloszenia" &&
        (zgloszenia.length === 0 ? (
          <div className={s.pusto}>
            <h2>Nie masz jeszcze zgłoszeń</h2>
            <p>Znajdź ofertę i kliknij „Aplikuj”. Zgłoszenie pojawi się tutaj.</p>
            <a className={s.btn} href="/praca">
              Zobacz oferty
            </a>
          </div>
        ) : (
          <div className={s.panelLista}>
            {zgloszenia.map((x) => {
              const [nazwa, klasa] = STATUS_Z[x.status] ?? ["Wysłane", s.statusCzeka];
              return (
                <a className={`${s.panelWiersz} ${s.panelWierszLink}`} key={x.id} href={x.oferta ? `/praca/${x.oferta.id}` : "#"}>
                  <div className={s.panelWierszTresc}>
                    <span className={`${s.statusPig} ${klasa}`}>{nazwa}</span>
                    <h3>{x.oferta?.stanowisko ?? "Oferta już nieaktualna"}</h3>
                    <p>
                      {[x.oferta?.firma, x.oferta?.miasto, `wysłane ${formatDaty(x.created_at)}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className={s.panelAkcje}>{x.cv_nazwa ? <span className={s.panelBrak}>CV: {x.cv_nazwa}</span> : <span className={s.panelBrak}>bez CV</span>}</div>
                </a>
              );
            })}
          </div>
        ))}

      {z === "zapisane" &&
        (zapisane.length === 0 ? (
          <div className={s.pusto}>
            <h2>Nie masz zapisanych ofert</h2>
            <p>Kliknij serce przy ofercie, żeby ją tu mieć.</p>
            <a className={s.btn} href="/praca">
              Zobacz oferty
            </a>
          </div>
        ) : (
          <div className={s.lista}>
            {zapisane.map((o) => (
              <Karta key={o.id} o={o} href={`/praca/${o.id}`} teraz={teraz} />
            ))}
          </div>
        ))}

      {z === "profil" && <Profil konto={konto} />}

      <div className={s.panelBruno}>
        <KartaBruno />
      </div>
    </main>
  );
}

function Profil({ konto }: { konto: KontoPraca }) {
  const [stan, setStan] = useState("");
  const [blad, setBlad] = useState("");
  const [plik, setPlik] = useState<File | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <form
      className={s.panelForm}
      onSubmit={async (e) => {
        e.preventDefault();
        setBlad("");
        setStan("wysylam");
        const f = new FormData(e.currentTarget);
        if (plik) f.set("plik", plik);
        const odp = await fetch("/api/bruno/praca/konto/profil", { method: "POST", body: f }).catch(() => null);
        const j = await odp?.json().catch(() => null);
        if (!odp?.ok || !j?.ok) {
          setBlad(j?.blad ?? "Nie udało się zapisać.");
          setStan("");
          return;
        }
        setStan("zapisane");
        if (plik) location.reload();
      }}
    >
      <section className={s.panelSekcja}>
        <h3>Dane do zgłoszeń</h3>
        <p className={s.drobny}>Wypełnimy je za Ciebie w formularzu „Aplikuj”.</p>
        <div className={s.polaSiatka}>
          <label className={s.pole}>
            <span>Imię i nazwisko</span>
            <input name="imie" defaultValue={konto.imie ?? ""} />
          </label>
          <label className={s.pole}>
            <span>Telefon</span>
            <input name="telefon" type="tel" defaultValue={konto.telefon ?? ""} />
          </label>
        </div>
        <label className={s.pole}>
          <span>
            Link do LinkedIn <em className={s.opcjonalne}>nieobowiązkowe</em>
          </span>
          <input name="linkedin" defaultValue={konto.linkedin ?? ""} placeholder="linkedin.com/in/anna-kowalska" />
        </label>
      </section>
      <section className={s.panelSekcja}>
        <h3>Twoje CV</h3>
        {konto.cv_nazwa && !plik && (
          <div className={s.plikWybrany}>
            <span className={s.plikIkona} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M7 3h7l4 4v14H7ZM14 3v4h4" />
              </svg>
            </span>
            <span className={s.plikNazwa}>
              <b>{konto.cv_nazwa}</b>
              <small>
                <a href="/api/bruno/praca/cv?moje=1" target="_blank">
                  Otwórz
                </a>
              </small>
            </span>
          </div>
        )}
        {plik ? (
          <div className={s.plikWybrany}>
            <span className={s.plikNazwa}>
              <b>{plik.name}</b>
              <small>nowe CV, zapisze się po kliknięciu „Zapisz”</small>
            </span>
          </div>
        ) : (
          <button type="button" className={s.upuszczanie} onClick={() => ref.current?.click()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
            </svg>
            <span>
              <b>{konto.cv_nazwa ? "Zmień CV" : "Dodaj CV"}</b>
            </span>
            <small>PDF, DOC, DOCX, do 4 MB</small>
          </button>
        )}
        <input ref={ref} type="file" accept=".pdf,.doc,.docx,.odt,.rtf" hidden onChange={(e) => setPlik(e.target.files?.[0] ?? null)} />
      </section>
      {blad && <p className={s.blad}>{blad}</p>}
      <div className={s.panelFormStopka}>
        <Wyloguj />
        <button type="submit" className={`${s.btn} ${s.btnDuzy}`} disabled={stan === "wysylam"}>
          {stan === "wysylam" ? "Zapisuję…" : stan === "zapisane" ? "Zapisane ✓" : "Zapisz"}
        </button>
      </div>
    </form>
  );
}
