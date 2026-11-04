"use client";

import { useEffect, useRef, useState } from "react";
import type { Jezyk } from "@/lib/bruno/i18n";
import { useT } from "@/components/bruno/jezyk-kontekst";
import { Ikona } from "@/components/podglad/panel/wspolne";
import KulaLimonka from "@/components/bruno/kula-limonka";
import { zJako } from "@/lib/bruno/linki";

// 4.11 (USER_001): CZAT Z BRUNO = „tylko kulka na środku z ciekłym liquidem i UX/UI jak w ChatGPT”.
// Pusty ekran: kula (shader zorzy z rejestracji, kula-limonka.tsx) na środku, jedno zdanie, pigułki podpowiedzi,
// pole na dole. Po pierwszej wiadomości kula maleje do góry, rozmowa w środku, pole zostaje na dole.
// Mowa: Web Speech API (0 zł). Historia w sessionStorage. Dane z CRM (zadania, deale bez ruchu, trening) = pigułki,
// klik wkłada je do rozmowy jako wiadomość Bruno (bez wywołania API).

export type Akcja = { opis: string; link?: string | null };
type Pozycja = { tekst: string; pod?: string | null; link?: string | null; zdjecie?: string | null; znacznik?: string | null; alarm?: boolean };
type Wiadomosc = { rola: "user" | "assistant"; tresc: string; akcje?: Akcja[]; blad?: boolean; lista?: Pozycja[]; przycisk?: { tekst: string; link: string } | null; lokalna?: boolean };

export type Powitanie = {
  dzis: string;
  naDzis: { id: number; temat: string; data: string; godzina: string | null; zalegle: boolean; deal: string; dealId: number | null; osoba: string | null; zdjecie: string | null; kto: string | null }[];
  zaleglych: number;
  bezRuchu: { id: number; tytul: string; etap: string; wartosc: string; dni: number; osoba: string | null; zdjecie: string | null; kto: string | null }[];
  otwarte: number;
  wartoscOtwarte: string;
  trening: { etap: string | null; kryterium: string | null; obiekcja: string | null; dlaczego: string; link: string; deal: string | null } | null;
  domena: string | null;
  bezHandlowca: number;
};

type Rozpoznawanie = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

// 4.11: v2 = stara historia (długie tematy zadań) nie wraca z sessionStorage.
const KLUCZ = "bruno-kokpit-historia-v2";
/** Temat zadania jako nagłówek (część przed dwukropkiem, max 60 znaków), także dla starych wiadomości. */
const naglowek = (s: string) => { const k = s.split(/[:—–]/)[0].trim(); const n = k.length >= 6 ? k : s; return n.length > 60 ? `${n.slice(0, 57).trimEnd()}…` : n; };

export default function Kokpit({ jezyk, imie, szef, firma, domenaCrm, powitanie = null, jako = null }: { jezyk: Jezyk; imie: string; szef: boolean; firma: string; domenaCrm: string | null; powitanie?: Powitanie | null; jako?: string | null }) {
  const { t } = useT();
  const linkKlienta = (id: number) => zJako(`/bruno/klienci/${id}`, jako);
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState("");
  const [wysylam, setWysylam] = useState(false);
  const [slucham, setSlucham] = useState(false);
  const [mowaJest, setMowaJest] = useState(false);
  const rozp = useRef<Rozpoznawanie | null>(null);
  const koniec = useRef<HTMLDivElement>(null);
  const pole = useRef<HTMLTextAreaElement>(null);
  const bazaTekstu = useRef("");
  const klucz = `${KLUCZ}:${jako ?? (szef ? "szef" : "ja")}`;

  useEffect(() => {
    try {
      const z = sessionStorage.getItem(klucz);
      if (z) setWiadomosci(JSON.parse(z));
    } catch {}
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    setMowaJest(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    try {
      const deal = new URLSearchParams(window.location.search).get("deal");
      if (deal) {
        setTekst(`${deal.slice(0, 120)}: `);
        setTimeout(() => pole.current?.focus(), 50);
      }
    } catch {}
  }, [klucz]);
  useEffect(() => {
    try {
      sessionStorage.setItem(klucz, JSON.stringify(wiadomosci.slice(-40)));
    } catch {}
    if (wiadomosci.length) koniec.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [wiadomosci, klucz]);

  const mow = () => {
    if (slucham) {
      rozp.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    const K = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!K) return;
    const r = new K();
    r.lang = jezyk === "pl" ? "pl-PL" : "en-US";
    r.continuous = true;
    r.interimResults = true;
    bazaTekstu.current = tekst ? `${tekst.trim()} ` : "";
    r.onresult = (e) => {
      let koncowe = "";
      let robocze = "";
      for (let i = 0; i < e.results.length; i++) {
        const r0 = e.results[i];
        const s = r0[0]?.transcript ?? "";
        if (r0.isFinal) koncowe += s + " ";
        else robocze += s;
      }
      setTekst((bazaTekstu.current + koncowe + robocze).replace(/\s+/g, " "));
    };
    r.onend = () => setSlucham(false);
    r.onerror = () => setSlucham(false);
    rozp.current = r;
    setSlucham(true);
    r.start();
  };

  const wyslij = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const tresc = tekst.trim();
    if (tresc.length < 2 || wysylam) return;
    if (slucham) rozp.current?.stop();
    const nowe: Wiadomosc[] = [...wiadomosci, { rola: "user", tresc }];
    setWiadomosci(nowe);
    setTekst("");
    setWysylam(true);
    try {
      const res = await fetch(`/api/bruno/kokpit${jako ? `?jako=${encodeURIComponent(jako)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wiadomosci: nowe.filter((w) => !w.lokalna).slice(-20).map((w) => ({ rola: w.rola, tresc: w.tresc })) }),
      });
      const j = (await res.json().catch(() => ({}))) as { odpowiedz?: string; akcje?: Akcja[]; blad?: string };
      if (!res.ok) throw new Error(j.blad || `HTTP ${res.status}`);
      setWiadomosci((w) => [...w, { rola: "assistant", tresc: j.odpowiedz ?? "", akcje: j.akcje ?? [] }]);
    } catch (err) {
      setWiadomosci((w) => [...w, { rola: "assistant", tresc: t("Something went wrong. Try again.", "Coś poszło nie tak. Spróbuj jeszcze raz."), blad: true }]);
      console.error("[kokpit]", err);
    } finally {
      setWysylam(false);
      pole.current?.focus();
    }
  };

  const wyczysc = () => {
    setWiadomosci([]);
    try {
      sessionStorage.removeItem(klucz);
    } catch {}
  };

  // Pigułki z CRM: klik = pytanie użytkownika + gotowa odpowiedź Bruno (lokalnie, bez API).
  const lokalnie = (pytanie: string, odpowiedz: string, lista: Pozycja[], przycisk?: { tekst: string; link: string } | null) =>
    setWiadomosci((w) => [...w, { rola: "user", tresc: pytanie, lokalna: true }, { rola: "assistant", tresc: odpowiedz, lista, przycisk: przycisk ?? null, lokalna: true }]);

  const p = powitanie;
  const pigulkiCrm: { tekst: string; licznik?: string; alarm?: boolean; klik: () => void }[] = p
    ? [
        {
          tekst: t("Today in the CRM", "Dziś w CRM"),
          licznik: p.naDzis.length ? `${p.naDzis.length}${p.zaleglych ? ` · ${p.zaleglych} ${t("overdue", "zaległe")}` : ""}` : "0",
          alarm: p.zaleglych > 0,
          klik: () =>
            lokalnie(
              t("What's on today?", "Co mam dziś?"),
              p.naDzis.length ? t(`${p.naDzis.length} tasks, ${p.zaleglych} overdue:`, `${p.naDzis.length} zadań, ${p.zaleglych} zaległych:`) : t("No tasks due today.", "Brak zadań na dziś."),
              p.naDzis.map((z) => ({ tekst: z.temat, pod: [z.osoba ?? z.deal, z.kto].filter(Boolean).join(" · "), link: z.dealId ? linkKlienta(z.dealId) : null, zdjecie: z.zdjecie, znacznik: z.zalegle ? z.data.slice(5) : z.godzina?.slice(0, 5) || t("today", "dziś"), alarm: z.zalegle })),
            ),
        },
      ]
    : [];

  const przyklady = szef
    ? [t("Which deals are stuck for more than 14 days?", "Które deale stoją dłużej niż 14 dni?"), t("Show Kasia's pipeline", "Pokaż lejek Kasi"), t("Who lost the most this month?", "Kto przegrał najwięcej w tym miesiącu?")]
    : [
        t("Met with Nowak today, he wants the offer by Friday. Add a note and a task.", "Byłem dziś u Nowaka, chce ofertę do piątku. Dodaj notatkę i zadanie."),
        t("Move the Kowalski deal to proposal sent.", "Przesuń deal Kowalskiego na etap oferta złożona."),
        t("New deal: Pol-Bud, Anna Lis, 12 000, first contact.", "Nowy deal: Pol-Bud, Anna Lis, 12 000, pierwszy kontakt."),
      ];

  const pusto = wiadomosci.length === 0;
  const tempo = wysylam ? "mowi" : slucham ? "slucha" : "czeka";

  return (
    <div className={`bcz ${pusto ? "bcz-start" : "bcz-rozmowa-on"}`}>
      <div className="bcz-gora">
        <span className="bcz-firma">{t("Chat", "Czat")} · {firma}{szef ? "" : ` · ${imie}`}</span>
        {!pusto && (
          <button type="button" onClick={wyczysc} className="bcz-wyczysc">{t("New chat", "Nowa rozmowa")}</button>
        )}
      </div>

      <div className="bcz-kula-wrap" aria-hidden>
        <div className="bcz-kula"><KulaLimonka tempo={tempo} /></div>
      </div>

      {pusto ? (
        <div className="bcz-powitanie">
          <h1 className="bcz-hej">
            {t(`Hi ${imie}.`, `Cześć ${imie}.`)}{" "}
            <span className="bcz-hej-2">{p ? (szef ? t(`${p.otwarte} open deals, ${p.wartoscOtwarte}.`, `${p.otwarte} otwartych deali, ${p.wartoscOtwarte}.`) : t(`${p.otwarte} open deals, ${p.wartoscOtwarte}.`, `${p.otwarte} otwartych deali, ${p.wartoscOtwarte}.`)) : t("Tell me what happened.", "Opowiedz, co się wydarzyło.")}</span>
          </h1>
          {pigulkiCrm.length > 0 && (
            <div className="bcz-pigulki">
              {pigulkiCrm.map((x) => (
                <button key={x.tekst} type="button" className={`bcz-pigulka ${x.alarm ? "bcz-pigulka-alarm" : ""}`} onClick={x.klik}>
                  {x.tekst}
                  {x.licznik && <em>{x.licznik}</em>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bcz-lista" role="log" aria-live="polite">
          {wiadomosci.map((w, i) => (
            <div key={i} className={`bcz-wiad ${w.rola === "user" ? "bcz-ja" : "bcz-bruno"} ${w.blad ? "bcz-blad" : ""}`}>
              {w.rola === "assistant" && <span className="bcz-avatar" aria-hidden />}
              <div className="bcz-tresc">
                <p className="whitespace-pre-wrap">{w.tresc}</p>
                {w.lista && w.lista.length > 0 && (
                  <ul className="bcz-pozycje">
                    {w.lista.map((x, j) => (
                      <li key={j}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {x.zdjecie ? <img src={x.zdjecie} alt="" className="bcz-foto" /> : x.znacznik ? null : <span className="bcz-kropka" />}
                        <span className="min-w-0 flex-1">
                          {x.link ? <a href={x.link} className="font-semibold underline underline-offset-2" title={x.tekst}>{naglowek(x.tekst)}</a> : <b>{naglowek(x.tekst)}</b>}
                          {x.pod ? <span className="block text-xs text-slate-500 truncate">{x.pod}</span> : null}
                        </span>
                        {x.znacznik && <span className={`bcz-znacznik ${x.alarm ? "bcz-znacznik-alarm" : ""}`}>{x.znacznik}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {w.przycisk && (
                  <a href={w.przycisk.link} className="bruno-przycisk inline-flex mt-3 px-5 py-2.5 text-sm">{w.przycisk.tekst}</a>
                )}
                {w.akcje && w.akcje.length > 0 && (
                  <ul className="bcz-akcje">
                    {w.akcje.map((a, j) => (
                      <li key={j}>
                        <span className="bcz-ok" aria-hidden>✓</span>
                        {a.link ? <a href={a.link} target="_blank" rel="noreferrer" className="underline underline-offset-2">{a.opis}</a> : a.opis}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          {wysylam && (
            <div className="bcz-wiad bcz-bruno">
              <span className="bcz-avatar" aria-hidden />
              <div className="bcz-tresc bcz-pisze"><i /><i /><i /></div>
            </div>
          )}
          <div ref={koniec} />
        </div>
      )}

      <div className="bcz-dol">
        <form onSubmit={wyslij} className="bcz-pole">
          <textarea
            ref={pole}
            className="bcz-textarea"
            rows={1}
            placeholder={slucham ? t("Listening…", "Słucham…") : t("What happened?", "Co się wydarzyło?")}
            value={tekst}
            onChange={(e) => {
              setTekst(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(160, e.target.scrollHeight)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void wyslij();
              }
            }}
            maxLength={3000}
            disabled={wysylam}
          />
          {mowaJest && (
            <button type="button" onClick={mow} className={`bcz-mik ${slucham ? "bcz-mik-on" : ""}`} aria-pressed={slucham} aria-label={slucham ? t("Stop", "Zatrzymaj") : t("Speak", "Mów")} title={slucham ? t("Stop", "Zatrzymaj") : t("Speak", "Mów")}>
              <Ikona nazwa="mikrofon" rozmiar={18} />
            </button>
          )}
          <button type="submit" disabled={wysylam || tekst.trim().length < 2} className="bcz-wyslij" aria-label={t("Send", "Wyślij")} title={t("Send", "Wyślij")}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
