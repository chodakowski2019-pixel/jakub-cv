"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Fiszki „Trening" (USER_001 2.10): rozrywka, nie egzamin. Jedna karta na raz:
// przód = obiekcja, odpowiadasz głosem (rozpoznawanie mowy w przeglądarce,
// darmowe) albo tekstem, tył = werdykt 1-4 + komentarz + wzór. Seria dni
// i punkty. FSRS po stronie serwera decyduje, kiedy karta wraca.

export type FiszkaKarta = { id: string; tresc: string; due: string; naCzas: boolean; reps: number; lapses: number };

type Wynik = { werdykt: 1 | 2 | 3 | 4; komentarz: string; wzor: string; technika: string; due: string | null };

const WERDYKTY: Record<1 | 2 | 3 | 4, { nazwa: string; kolor: string; punkty: number; emoji: string }> = {
  1: { nazwa: "Poległeś", kolor: "#dc2626", punkty: 0, emoji: "💥" },
  2: { nazwa: "Słabo", kolor: "#f59e0b", punkty: 5, emoji: "🫤" },
  3: { nazwa: "Dobrze", kolor: "#0e7490", punkty: 10, emoji: "👊" },
  4: { nazwa: "Wzorowo", kolor: "#16a34a", punkty: 20, emoji: "🔥" },
};

type Rozpoznawanie = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function kiedyWraca(due: string | null): string {
  if (!due) return "";
  const dni = Math.round((new Date(due).getTime() - Date.now()) / 86_400_000);
  if (dni <= 0) return "wraca dziś";
  if (dni === 1) return "wraca jutro";
  if (dni < 5) return `wraca za ${dni} dni`;
  return `wraca za ${dni} dni`;
}

export default function Fiszki({ karty, dzis, dziennie, seria, razem, sredniWerdykt, naCzas }: { karty: FiszkaKarta[]; dzis: number; dziennie: number; seria: number; razem: number; sredniWerdykt: number | null; naCzas: number }) {
  const [i, setI] = useState(0);
  const [odp, setOdp] = useState("");
  const [stan, setStan] = useState<"pytanie" | "ocena" | "wynik" | "koniec">("pytanie");
  const [wynik, setWynik] = useState<Wynik | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [sesja, setSesja] = useState<{ punkty: number; karty: number; werdykty: number[] }>({ punkty: 0, karty: 0, werdykty: [] });
  const [zrobioneDzis, setZrobioneDzis] = useState(dzis);
  const [nagrywa, setNagrywa] = useState(false);
  const [mowaOk, setMowaOk] = useState(false);
  const rozp = useRef<Rozpoznawanie | null>(null);
  const bazaTekstu = useRef("");

  const karta = karty[i] ?? null;

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    setMowaOk(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => rozp.current?.stop();
  }, []);

  const mow = () => {
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    const K = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!K) return;
    if (nagrywa) {
      rozp.current?.stop();
      return;
    }
    const r = new K();
    r.lang = "pl-PL";
    r.interimResults = true;
    r.continuous = true;
    bazaTekstu.current = odp.trim() ? odp.trim() + " " : "";
    r.onresult = (e) => {
      let koncowe = "";
      let robocze = "";
      for (let k = 0; k < e.results.length; k++) {
        const t = e.results[k][0].transcript;
        if (e.results[k].isFinal) koncowe += t + " ";
        else robocze += t;
      }
      setOdp((bazaTekstu.current + koncowe + robocze).trim());
    };
    r.onend = () => setNagrywa(false);
    r.onerror = () => setNagrywa(false);
    rozp.current = r;
    r.start();
    setNagrywa(true);
  };

  const sprawdz = async () => {
    if (!karta) return;
    rozp.current?.stop();
    setBlad(null);
    setStan("ocena");
    try {
      const res = await fetch("/api/bruno/fiszka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ karta_id: karta.id, odpowiedz: odp }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.blad ?? "Nie udało się ocenić.");
      const w = d as Wynik;
      setWynik(w);
      setSesja((s) => ({ punkty: s.punkty + WERDYKTY[w.werdykt].punkty, karty: s.karty + 1, werdykty: [...s.werdykty, w.werdykt] }));
      setZrobioneDzis((n) => n + 1);
      setStan("wynik");
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się ocenić.");
      setStan("pytanie");
    }
  };

  const dalej = () => {
    setOdp("");
    setWynik(null);
    if (sesja.karty >= dziennie || i + 1 >= karty.length) {
      setStan("koniec");
      return;
    }
    setI(i + 1);
    setStan("pytanie");
  };

  const jeszcze = () => {
    setSesja({ punkty: 0, karty: 0, werdykty: [] });
    setI((i + 1) % karty.length);
    setOdp("");
    setWynik(null);
    setStan("pytanie");
  };

  const slow = odp.trim().split(/\s+/).filter(Boolean).length;
  const postep = Math.min(dziennie, sesja.karty + (stan === "wynik" ? 0 : 0));

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          <span className="bruno-gradient-tekst">Trening</span> obiekcji
        </h1>
        <p className="text-slate-600 mt-2">Klient mówi, Ty odpowiadasz. Krótko, pewnie, bez obrony.</p>
      </div>

      {/* Pasek gry: seria, dziś, punkty sesji */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bruno-szklo rounded-2xl p-3 text-center">
          <div className="bruno-h2 text-xl leading-none">{seria > 0 || zrobioneDzis > 0 ? (zrobioneDzis > 0 && seria === 0 ? 1 : seria) : 0} 🔥</div>
          <div className="text-[11px] text-slate-500 mt-1">{seria === 1 ? "dzień serii" : "dni serii"}</div>
        </div>
        <div className="bruno-szklo rounded-2xl p-3 text-center">
          <div className="bruno-h2 text-xl leading-none">{Math.min(zrobioneDzis, dziennie)}/{dziennie}</div>
          <div className="text-[11px] text-slate-500 mt-1">fiszek dziś</div>
          <div className="h-1 mt-2 rounded-full bg-cyan-900/10 overflow-hidden" aria-hidden>
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-teal-700 transition-[width] duration-500" style={{ width: `${Math.min(100, (zrobioneDzis / dziennie) * 100)}%` }} />
          </div>
        </div>
        <div className="bruno-szklo rounded-2xl p-3 text-center">
          <div className="bruno-h2 text-xl leading-none bruno-gradient-tekst">{sesja.punkty}</div>
          <div className="text-[11px] text-slate-500 mt-1">punktów w tej sesji</div>
        </div>
      </div>

      {stan === "koniec" ? (
        <div className="bruno-szklo rounded-3xl p-8 text-center flex flex-col items-center gap-4">
          <div className="text-5xl">{sesja.werdykty.every((w) => w >= 3) ? "🏆" : sesja.punkty >= 30 ? "💪" : "🧠"}</div>
          <h2 className="bruno-h2 text-2xl">Sesja zrobiona: {sesja.punkty} pkt</h2>
          <div className="flex gap-1.5" aria-label="Werdykty w sesji">
            {sesja.werdykty.map((w, k) => (
              <span key={k} className="size-3 rounded-full" style={{ background: WERDYKTY[w as 1 | 2 | 3 | 4].kolor }} title={WERDYKTY[w as 1 | 2 | 3 | 4].nazwa} />
            ))}
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            {razem + sesja.karty} fiszek łącznie{sredniWerdykt ? `, średni werdykt ${sredniWerdykt}/4` : ""}. Karty wracają wtedy, kiedy zaczynasz je zapominać. Najsłabsze szybciej.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <button type="button" onClick={jeszcze} className="bruno-przycisk">Jeszcze 5</button>
            <Link href="/bruno/rozmowa" className="bruno-przycisk-2">Sprawdź się w teście z Bruno</Link>
          </div>
        </div>
      ) : karta ? (
        <div className="bruno-fiszka-scena">
          <div key={`${karta.id}-${stan === "wynik" ? "tyl" : "przod"}`} className="bruno-szklo rounded-3xl p-6 sm:p-8 bruno-fiszka">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4">
              <span>Karta {postep + 1} z {dziennie}</span>
              <span>{karta.naCzas ? "do powtórki" : `jeszcze nie na czas · ${kiedyWraca(karta.due)}`}{karta.lapses > 0 ? ` · wpadek: ${karta.lapses}` : ""}</span>
            </div>

            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Klient mówi</div>
            <blockquote className="bruno-h2 text-2xl sm:text-3xl text-slate-900 leading-snug">„{karta.tresc}”</blockquote>

            {stan !== "wynik" ? (
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="odp" className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Twoja odpowiedź</label>
                  {mowaOk && (
                    <button type="button" onClick={mow} className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${nagrywa ? "bg-red-600 text-white border-red-600 bruno-zegar-alarm" : "bg-white/70 text-slate-700 border-slate-200 hover:border-cyan-700/50"}`}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                      {nagrywa ? "Słucham… kliknij, żeby skończyć" : "Powiedz głosem"}
                    </button>
                  )}
                </div>
                <textarea id="odp" className="bruno-pole text-[15px]" rows={4} placeholder="Powiedz to tak, jak powiedziałbyś klientowi. 1-3 zdania." value={odp} onChange={(e) => setOdp(e.target.value)} maxLength={1500} disabled={stan === "ocena"} />
                {blad && <p className="text-sm text-red-700">{blad}</p>}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{slow} {slow === 1 ? "słowo" : slow >= 2 && slow <= 4 ? "słowa" : "słów"}</span>
                  <button type="button" onClick={sprawdz} disabled={stan === "ocena" || slow < 3} className="bruno-przycisk px-8">
                    {stan === "ocena" ? "Trener czyta…" : "Sprawdź"}
                  </button>
                </div>
              </div>
            ) : wynik ? (
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>{WERDYKTY[wynik.werdykt].emoji}</span>
                  <div>
                    <div className="bruno-h2 text-xl" style={{ color: WERDYKTY[wynik.werdykt].kolor }}>{WERDYKTY[wynik.werdykt].nazwa}</div>
                    <div className="text-xs text-slate-500">+{WERDYKTY[wynik.werdykt].punkty} pkt{wynik.technika ? ` · technika: ${wynik.technika}` : ""} · {kiedyWraca(wynik.due)}</div>
                  </div>
                </div>
                <p className="text-[15px] text-slate-800">{wynik.komentarz}</p>
                <div className="rounded-2xl bg-cyan-700/5 border border-cyan-700/15 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-cyan-800 mb-1.5">Wzór</div>
                  <p className="text-[15px] text-slate-900 leading-relaxed">„{wynik.wzor}”</p>
                </div>
                <details className="text-sm text-slate-500">
                  <summary className="cursor-pointer">Twoja odpowiedź</summary>
                  <p className="mt-1 text-slate-700">„{odp}”</p>
                </details>
                <div className="text-right">
                  <button type="button" onClick={dalej} className="bruno-przycisk px-8">{sesja.karty >= dziennie || i + 1 >= karty.length ? "Podsumowanie" : "Następna"}</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="text-center text-xs text-slate-400">
        {naCzas} {naCzas === 1 ? "karta czeka" : naCzas >= 2 && naCzas <= 4 ? "karty czekają" : "kart czeka"} na powtórkę · {karty.length} obiekcji w talii · algorytm FSRS
      </p>
    </div>
  );
}
