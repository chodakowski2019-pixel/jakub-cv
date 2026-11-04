"use client";

import { useEffect, useRef, useState } from "react";
import type { Jezyk } from "@/lib/bruno/i18n";
import { useT } from "@/components/bruno/jezyk-kontekst";
import { Ikona } from "@/components/podglad/panel/wspolne";

// 4.11 (USER_001): KOKPIT handlowca jak ChatGPT: pisze albo mówi, AI zapisuje w CRM (Pipedrive).
// Mowa: Web Speech API przeglądarki (0 zł; Chrome, Safari, Edge). Brak w przeglądarce = sam tekst.
// Historia rozmowy w sessionStorage (tylko ta karta), serwer dostaje całą historię za każdym razem.

export type Akcja = { opis: string; link?: string | null };
type Wiadomosc = { rola: "user" | "assistant"; tresc: string; akcje?: Akcja[]; blad?: boolean };

/** 4.11 (pkt 1 + 5): ekran powitalny Czatu, liczony na serwerze z CRM (zadania na dziś, deale bez ruchu, trening dobrany). */
export type Powitanie = {
  dzis: string;
  naDzis: { id: number; temat: string; data: string; godzina: string | null; zalegle: boolean; deal: string; dealId: number | null; kto: string | null }[];
  zaleglych: number;
  bezRuchu: { id: number; tytul: string; etap: string; wartosc: string; dni: number; kto: string | null }[];
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

const KLUCZ = "bruno-kokpit-historia";

export default function Kokpit({ jezyk, imie, szef, firma, domenaCrm, powitanie = null }: { jezyk: Jezyk; imie: string; szef: boolean; firma: string; domenaCrm: string | null; powitanie?: Powitanie | null }) {
  const { t } = useT();
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState("");
  const [wysylam, setWysylam] = useState(false);
  const [slucham, setSlucham] = useState(false);
  const [mowaJest, setMowaJest] = useState(false);
  const rozp = useRef<Rozpoznawanie | null>(null);
  const koniec = useRef<HTMLDivElement>(null);
  const pole = useRef<HTMLTextAreaElement>(null);
  const bazaTekstu = useRef("");

  useEffect(() => {
    try {
      const z = sessionStorage.getItem(KLUCZ);
      if (z) setWiadomosci(JSON.parse(z));
    } catch {}
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    setMowaJest(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    // 4.11 (pkt 2): z karty klienta „Zaktualizuj w czacie” → pole zaczyna się od nazwy deala.
    try {
      const deal = new URLSearchParams(window.location.search).get("deal");
      if (deal) {
        setTekst(`${deal.slice(0, 120)}: `);
        setTimeout(() => pole.current?.focus(), 50);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KLUCZ, JSON.stringify(wiadomosci.slice(-40)));
    } catch {}
    koniec.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [wiadomosci]);

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
      const res = await fetch("/api/bruno/kokpit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wiadomosci: nowe.slice(-20).map((w) => ({ rola: w.rola, tresc: w.tresc })) }),
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
      sessionStorage.removeItem(KLUCZ);
    } catch {}
  };

  const przyklady = szef
    ? [t("Which deals are stuck for more than 14 days?", "Które deale stoją dłużej niż 14 dni?"), t("Show Kasia's pipeline", "Pokaż lejek Kasi"), t("Who lost the most this month?", "Kto przegrał najwięcej w tym miesiącu?")]
    : [
        t("Met with Nowak today, he wants the offer by Friday. Add a note and a task.", "Byłem dziś u Nowaka, chce ofertę do piątku. Dodaj notatkę i zadanie."),
        t("Move the Kowalski deal to proposal sent.", "Przesuń deal Kowalskiego na etap oferta złożona."),
        t("New deal: Pol-Bud, Anna Lis, 12 000, first contact.", "Nowy deal: Pol-Bud, Anna Lis, 12 000, pierwszy kontakt."),
      ];

  return (
    <div className="bkk">
      <header className="bkk-naglowek">
        <div>
          <h1 className="bruno-h1 text-[1.6rem] sm:text-[2rem] leading-tight">
            {t("Chat", "Czat")} <span className="bruno-gradient-tekst">{firma}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("Say or type what happened. Bruno updates the CRM for you.", "Powiedz albo napisz, co się wydarzyło. Bruno sam zapisze to w CRM.")}</p>
        </div>
        {wiadomosci.length > 0 && (
          <button type="button" onClick={wyczysc} className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2">
            {t("Clear", "Wyczyść")}
          </button>
        )}
      </header>

      <div className="bkk-rozmowa" role="log" aria-live="polite">
        {wiadomosci.length === 0 && powitanie && (
          <div className="bkk-dymek bkk-bruno">
            <span className="bkk-avatar">B</span>
            <div className="bkk-tresc bkk-powitanie">
              <p className="font-semibold text-slate-900">
                {t(`Hi ${imie}.`, `Cześć ${imie}.`)}{" "}
                <span className="font-normal text-slate-600">
                  {szef
                    ? t(`Team has ${powitanie.otwarte} open deals worth ${powitanie.wartoscOtwarte}.`, `Zespół ma ${powitanie.otwarte} otwartych deali za ${powitanie.wartoscOtwarte}.`)
                    : t(`You have ${powitanie.otwarte} open deals worth ${powitanie.wartoscOtwarte}.`, `Masz ${powitanie.otwarte} otwartych deali za ${powitanie.wartoscOtwarte}.`)}
                </span>
              </p>

              <div className="bkk-blok">
                <div className="bkk-blok-tytul">
                  {t("Today in the CRM", "Dziś w CRM")}
                  {powitanie.zaleglych > 0 && <span className="bkk-alarm">{t(`${powitanie.zaleglych} overdue`, `${powitanie.zaleglych} zaległe`)}</span>}
                </div>
                {powitanie.naDzis.length === 0 ? (
                  <p className="text-sm text-slate-500">{t("No tasks due today.", "Brak zadań na dziś.")}</p>
                ) : (
                  <ul className="bkk-lista">
                    {powitanie.naDzis.map((z) => (
                      <li key={z.id}>
                        <span className={`bkk-data ${z.zalegle ? "bkk-zalegle" : ""}`}>{z.zalegle ? z.data.slice(5) : z.godzina?.slice(0, 5) || t("today", "dziś")}</span>
                        <span className="min-w-0 flex-1 truncate">
                          <b>{z.temat}</b> · {z.dealId ? <a href={`/bruno/klienci/${z.dealId}`} className="underline underline-offset-2">{z.deal}</a> : z.deal}
                          {z.kto ? <span className="text-slate-400"> · {z.kto}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bkk-blok">
                <div className="bkk-blok-tytul">{t("No movement for 7+ days", "Bez ruchu ponad 7 dni")}</div>
                {powitanie.bezRuchu.length === 0 ? (
                  <p className="text-sm text-slate-500">{t("Every open deal moved in the last week.", "Każdy otwarty deal ruszył w ostatnim tygodniu.")}</p>
                ) : (
                  <ul className="bkk-lista">
                    {powitanie.bezRuchu.map((d) => (
                      <li key={d.id}>
                        <span className="bkk-data bkk-zalegle">{d.dni} {t("d", "dni")}</span>
                        <span className="min-w-0 flex-1 truncate">
                          <a href={`/bruno/klienci/${d.id}`} className="underline underline-offset-2 font-semibold">{d.tytul}</a> · {d.etap} · {d.wartosc}
                          {d.kto ? <span className="text-slate-400"> · {d.kto}</span> : null}
                        </span>
                        <button type="button" className="bkk-mini" onClick={() => { setTekst(t(`Update on ${d.tytul}: `, `Co z ${d.tytul}: `)); pole.current?.focus(); }}>
                          {t("Update", "Zaktualizuj")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {powitanie.bezHandlowca > 0 && <p className="text-[11px] text-slate-400 mt-1">{t(`${powitanie.bezHandlowca} open deals without a rep assigned.`, `${powitanie.bezHandlowca} otwartych deali bez przypisanego handlowca.`)}</p>}
              </div>

              {powitanie.trening && (
                <div className="bkk-blok bkk-trening">
                  <div className="bkk-blok-tytul">{szef ? t("Who to train first", "Kogo trenować najpierw") : t("Today's training", "Trening na dziś")}</div>
                  <p className="text-sm text-slate-700">
                    {powitanie.trening.etap && <span className="bsz-pigulka mr-1.5">{powitanie.trening.etap}</span>}
                    {powitanie.trening.kryterium && <span className="bsz-pigulka mr-1.5">{powitanie.trening.kryterium}</span>}
                    {powitanie.trening.obiekcja && <span className="bsz-pigulka mr-1.5">{powitanie.trening.obiekcja}</span>}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{powitanie.trening.dlaczego}</p>
                  <div className="flex gap-3 flex-wrap items-center mt-3">
                    <a href={powitanie.trening.link} className="bruno-przycisk inline-flex px-5 py-2.5 text-sm">
                      {szef ? t(`Open ${powitanie.trening.deal ?? "profile"} →`, `Otwórz profil: ${powitanie.trening.deal ?? ""} →`) : t("Train what matters today →", "Trenuj to, co dziś najważniejsze →")}
                    </a>
                    {!szef && (
                      <a href="/bruno/rozmowa" className="text-sm text-slate-500 underline underline-offset-2">{t("Another scenario", "Inny scenariusz")}</a>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 mt-3">{t("Tell me what happened and I'll update the CRM. Try:", "Opowiedz, co się wydarzyło, a ja zapiszę to w CRM. Spróbuj:")}</p>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {przyklady.map((p) => (
                  <button key={p} type="button" className="bkk-przyklad" onClick={() => { setTekst(p); pole.current?.focus(); }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {wiadomosci.length === 0 && !powitanie && (
          <div className="bkk-pusty">
            <p className="text-slate-600 text-sm mb-3">{t(`Hi ${imie}. Try:`, `Cześć ${imie}. Spróbuj:`)}</p>
            <div className="flex flex-col gap-2">
              {przyklady.map((p) => (
                <button key={p} type="button" className="bkk-przyklad" onClick={() => { setTekst(p); pole.current?.focus(); }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {wiadomosci.map((w, i) => (
          <div key={i} className={`bkk-dymek ${w.rola === "user" ? "bkk-ja" : "bkk-bruno"} ${w.blad ? "bkk-blad" : ""}`}>
            {w.rola === "assistant" && <span className="bkk-avatar">B</span>}
            <div className="bkk-tresc">
              <p className="whitespace-pre-wrap">{w.tresc}</p>
              {w.akcje && w.akcje.length > 0 && (
                <ul className="bkk-akcje">
                  {w.akcje.map((a, j) => (
                    <li key={j}>
                      <span className="bkk-ok" aria-hidden>✓</span>
                      {a.link ? (
                        <a href={a.link} target="_blank" rel="noreferrer" className="underline underline-offset-2">{a.opis}</a>
                      ) : (
                        a.opis
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {wysylam && (
          <div className="bkk-dymek bkk-bruno">
            <span className="bkk-avatar">B</span>
            <div className="bkk-tresc bkk-pisze"><i /><i /><i /></div>
          </div>
        )}
        <div ref={koniec} />
      </div>

      <form onSubmit={wyslij} className="bkk-pole bruno-szklo">
        <textarea
          ref={pole}
          className="bkk-textarea"
          rows={2}
          placeholder={slucham ? t("Listening…", "Słucham…") : t("Type or press the mic…", "Napisz albo wciśnij mikrofon…")}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void wyslij();
            }
          }}
          maxLength={3000}
          disabled={wysylam}
        />
        <div className="bkk-przyciski">
          {mowaJest && (
            <button type="button" onClick={mow} className={`bkk-mik ${slucham ? "bkk-mik-on" : ""}`} aria-pressed={slucham} aria-label={slucham ? t("Stop", "Zatrzymaj") : t("Speak", "Mów")} title={slucham ? t("Stop", "Zatrzymaj") : t("Speak", "Mów")}>
              <Ikona nazwa="mikrofon" rozmiar={20} />
            </button>
          )}
          <button type="submit" disabled={wysylam || tekst.trim().length < 2} className="bruno-przycisk px-5 py-2.5 text-sm">
            {wysylam ? t("Saving…", "Zapisuję…") : t("Send", "Wyślij")}
          </button>
        </div>
      </form>
      {domenaCrm && (
        <p className="text-[11px] text-slate-400 mt-2 text-right">
          <a href={domenaCrm} target="_blank" rel="noreferrer" className="underline underline-offset-2">{t("Open Pipedrive", "Otwórz Pipedrive")}</a>
        </p>
      )}
    </div>
  );
}
