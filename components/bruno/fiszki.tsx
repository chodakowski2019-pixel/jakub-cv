"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Fiszki „Trening" (USER_001 2.10): rozrywka, nie egzamin. Jedna karta na raz:
// przód = obiekcja, odpowiadasz głosem (rozpoznawanie mowy w przeglądarce,
// darmowe) albo tekstem, tył = werdykt 1-4 + komentarz + wzór. Seria dni
// i punkty. FSRS po stronie serwera decyduje, kiedy karta wraca.

export type FiszkaKarta = { id: string; typ: "obiekcja" | "poprawka" | "wiedza"; tresc: string; pytanie: string | null; kategoria: string | null; due: string; naCzas: boolean; reps: number; lapses: number };

const RODZAJ: Record<FiszkaKarta["typ"], { nazwa: string; kolor: string; naglowek: string }> = {
  obiekcja: { nazwa: "Objection", kolor: "#d4af5a", naglowek: "The customer says" },
  poprawka: { nazwa: "Fix from your call", kolor: "#d97706", naglowek: "Moment from the call" },
  wiedza: { nazwa: "Knowledge", kolor: "#7c3aed", naglowek: "Question" },
};

type Wynik = { werdykt: 1 | 2 | 3 | 4; komentarz: string; wzor: string; technika: string; due: string | null };

const WERDYKTY: Record<1 | 2 | 3 | 4, { nazwa: string; kolor: string; punkty: number; emoji: string }> = {
  1: { nazwa: "Missed", kolor: "#dc2626", punkty: 0, emoji: "💥" },
  2: { nazwa: "Weak", kolor: "#f59e0b", punkty: 5, emoji: "🫤" },
  3: { nazwa: "Good", kolor: "#d4af5a", punkty: 10, emoji: "👊" },
  4: { nazwa: "Textbook", kolor: "#16a34a", punkty: 20, emoji: "🔥" },
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
  if (dni <= 0) return "back today";
  if (dni === 1) return "back tomorrow";
  if (dni < 5) return `back in ${dni} days`;
  return `back in ${dni} days`;
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
  const [pokazOdp, setPokazOdp] = useState(false);
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
    r.lang = "en-US";
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
      if (!res.ok) throw new Error(d.blad ?? "Couldn't score your answer.");
      const w = d as Wynik;
      setWynik(w);
      setSesja((s) => ({ punkty: s.punkty + WERDYKTY[w.werdykt].punkty, karty: s.karty + 1, werdykty: [...s.werdykty, w.werdykt] }));
      setZrobioneDzis((n) => n + 1);
      setStan("wynik");
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Couldn't score your answer.");
      setStan("pytanie");
    }
  };

  const dalej = () => {
    setOdp("");
    setWynik(null);
    setPokazOdp(false);
    if (sesja.karty >= dziennie || zrobioneDzis >= dziennie || i + 1 >= karty.length) {
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
          <span className="bruno-gradient-tekst">Drills</span>
        </h1>
        <p className="text-slate-600 mt-2">Objections, moments from your calls, and customer know-how. You answer.</p>
      </div>

      {/* Pasek gry: seria, dziś, punkty sesji */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bruno-szklo rounded-2xl p-3 text-center">
          <div className="bruno-h2 text-xl leading-none">{seria > 0 || zrobioneDzis > 0 ? (zrobioneDzis > 0 && seria === 0 ? 1 : seria) : 0} 🔥</div>
          <div className="text-[11px] text-slate-500 mt-1">day streak</div>
        </div>
        <div className="bruno-szklo rounded-2xl p-3 text-center">
          <div className="bruno-h2 text-xl leading-none">{Math.min(zrobioneDzis, dziennie)}/{dziennie}</div>
          <div className="text-[11px] text-slate-500 mt-1">flashcards today</div>
        </div>
        <div className="bruno-szklo rounded-2xl p-3 text-center">
          <div className="bruno-h2 text-xl leading-none"><span className="bruno-gradient-tekst">{sesja.punkty}</span><span className="text-sm text-slate-400">/{dziennie * WERDYKTY[4].punkty}</span></div>
          <div className="text-[11px] text-slate-500 mt-1 leading-tight">points<span className="hidden min-[400px]:inline"> this session</span></div>
        </div>
      </div>

      {stan === "pytanie" && zrobioneDzis >= dziennie && sesja.karty === 0 ? (
        <div className="bruno-szklo rounded-3xl p-8 text-center flex flex-col items-center gap-3">
          <div className="text-4xl">✅</div>
          <h2 className="bruno-h2 text-2xl">Today's flashcards are done</h2>
          <p className="text-sm text-slate-600">Your trial gives you {dziennie} {dziennie === 1 ? "flashcard" : "flashcards"} a day. More tomorrow.</p>
          <Link href="/bruno/rozmowa" className="bruno-przycisk-2 mt-2">Test yourself in a Live Call with Bruno</Link>
        </div>
      ) : stan === "koniec" ? (
        <div className="bruno-szklo rounded-3xl p-8 text-center flex flex-col items-center gap-4">
          <div className="text-5xl">{sesja.werdykty.every((w) => w >= 3) ? "🏆" : sesja.punkty >= 30 ? "💪" : "🧠"}</div>
          <h2 className="bruno-h2 text-2xl">Session done: {sesja.punkty} pts</h2>
          <div className="flex gap-1.5" aria-label="Results this session">
            {sesja.werdykty.map((w, k) => (
              <span key={k} className="size-3 rounded-full" style={{ background: WERDYKTY[w as 1 | 2 | 3 | 4].kolor }} title={WERDYKTY[w as 1 | 2 | 3 | 4].nazwa} />
            ))}
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            {razem + sesja.karty} {razem + sesja.karty === 1 ? "flashcard" : "flashcards"} total{sredniWerdykt ? `, average result ${sredniWerdykt}/4` : ""}.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            {zrobioneDzis < dziennie ? (
              <button type="button" onClick={jeszcze} className="bruno-przycisk">{Math.min(dziennie, dziennie - zrobioneDzis)} more</button>
            ) : (
              <span className="text-sm text-slate-500 self-center">You've used today's flashcards. Come back tomorrow.</span>
            )}
            <Link href="/bruno/rozmowa" className="bruno-przycisk-2">Test yourself in a Live Call with Bruno</Link>
          </div>
        </div>
      ) : karta ? (
        <div className="bruno-fiszka-scena">
          <div key={`${karta.id}-${stan === "wynik" ? "tyl" : "przod"}`} className="bruno-szklo rounded-3xl p-6 sm:p-8 bruno-fiszka">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-full bg-cyan-700/10 text-cyan-800 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1">Flashcard {postep + 1} of {dziennie}</span>
                <span className="inline-flex items-center rounded-full text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1" style={{ background: `${RODZAJ[karta.typ].kolor}1a`, color: RODZAJ[karta.typ].kolor }}>
                  {RODZAJ[karta.typ].nazwa}{karta.typ === "wiedza" && karta.kategoria === "typy" ? ": customer types" : karta.typ === "wiedza" ? ": technique" : ""}
                </span>
              </div>
              {karta.lapses > 0 && <span className="text-[11px] text-slate-400">misses: {karta.lapses}</span>}
            </div>

            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{RODZAJ[karta.typ].naglowek}</div>
            {karta.typ === "obiekcja" ? (
              <blockquote className="bruno-h2 text-2xl sm:text-3xl text-slate-900 leading-snug">“{karta.tresc}”</blockquote>
            ) : (
              <>
                <div className="bruno-h2 text-xl sm:text-2xl text-slate-900 leading-snug">{karta.tresc}</div>
                <p className="mt-2 text-[15px] sm:text-base text-slate-800 leading-relaxed">{karta.pytanie}</p>
              </>
            )}

            {stan !== "wynik" ? (
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="odp" className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Your answer</label>
                  {mowaOk && (
                    <button type="button" onClick={mow} className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${nagrywa ? "bg-red-600 text-white border-red-600 bruno-zegar-alarm" : "bg-white/70 text-slate-700 border-slate-200 hover:border-cyan-700/50"}`}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                      {nagrywa ? "Listening… click to stop" : "Say it out loud"}
                    </button>
                  )}
                </div>
                <textarea id="odp" className="bruno-pole text-[15px]" rows={4} placeholder={karta.typ === "obiekcja" ? "Say it like you would to a customer. 1-3 sentences." : "Answer in your own words. 1-3 sentences."} value={odp} onChange={(e) => setOdp(e.target.value)} maxLength={1500} disabled={stan === "ocena"} />
                {blad && <p className="text-sm text-red-700">{blad}</p>}
                <div className="flex items-center justify-between gap-3">
                  <span />
                  <button type="button" onClick={sprawdz} disabled={stan === "ocena" || slow < 3} className="bruno-przycisk px-8 inline-flex items-center gap-2">
                    {stan === "ocena" && <span className="bruno-kolko-ladowania" aria-hidden />}
                    {stan === "ocena" ? "Coach is reading…" : "Check"}
                  </button>
                </div>
              </div>
            ) : wynik ? (
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>{WERDYKTY[wynik.werdykt].emoji}</span>
                  <div>
                    <div className="bruno-h2 text-xl" style={{ color: WERDYKTY[wynik.werdykt].kolor }}>{WERDYKTY[wynik.werdykt].nazwa}</div>
                    <div className="text-xs text-slate-500">+{WERDYKTY[wynik.werdykt].punkty} pts · {kiedyWraca(wynik.due)}</div>
                  </div>
                </div>
                {/* Odpowiedź trenera jako tabela (USER_001 2.10). */}
                <table className="w-full text-[15px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60">
                  <tbody>
                    <tr className="align-top">
                      <th scope="row" className="w-32 sm:w-40 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3 border-b border-slate-200/80 bg-slate-50/60">What you did</th>
                      <td className="px-4 py-3 border-b border-slate-200/80 text-slate-800">{wynik.komentarz}</td>
                    </tr>
                    {wynik.technika && (
                      <tr className="align-top">
                        <th scope="row" className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3 border-b border-slate-200/80 bg-slate-50/60">Technique</th>
                        <td className="px-4 py-3 border-b border-slate-200/80 text-slate-800">{wynik.technika}</td>
                      </tr>
                    )}
                    <tr className="align-top">
                      <th scope="row" className="text-left text-xs font-semibold uppercase tracking-wide text-cyan-800 px-4 py-3 bg-cyan-700/5">Model answer</th>
                      <td className="px-4 py-3 text-slate-900 font-medium leading-relaxed bg-cyan-700/5">“{wynik.wzor}”</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <button type="button" onClick={() => setPokazOdp((p) => !p)} aria-expanded={pokazOdp} className="bruno-przycisk-2 py-1.5 px-3 text-[13px] self-start">
                      {pokazOdp ? "Hide my answer" : "Your answer"}
                    </button>
                    {pokazOdp && <p className="text-sm text-slate-700 bg-white/60 border border-slate-200/80 rounded-xl px-4 py-3">“{odp}”</p>}
                  </div>
                  <button type="button" onClick={dalej} className="bruno-przycisk px-8">{sesja.karty >= dziennie || i + 1 >= karty.length ? "Summary" : "Next"}</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}


    </div>
  );
}
