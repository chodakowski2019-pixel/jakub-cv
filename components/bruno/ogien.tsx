"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Cytat } from "@/lib/bruno/cytaty";
import { policzMetryki } from "@/lib/bruno/metryki";

// „Ogień przed rozmową" (USER_001 9.10). Rytuał 5 minut przed PRAWDZIWYM telefonem:
// zapal (muzyka + Bruno nakręca + cytat) → oddech 60 s → głos 45 s → kartka W BRUNO
// (cel, pytanie, 2 obiekcje z reakcją, kwota, data) → głowa → sparing (opcja) →
// „Dzwonię" (zegar) → 3 pytania po rozmowie → zapis. Nic na kartkach (USER_001).
// Źródła: cykliczne wzdychanie (Balban, Stanford 2023), „jestem nakręcony" zamiast
// „uspokój się" (Brooks, Harvard 2014), energia zespołu (USER_001: „byliśmy na pełnej").

type Obiekcja = { nazwa: string; wyjasnienie: string | null; karta_id: string | null };
type Poprawka = { tresc: string; pytanie: string | null; wzor: string | null };
type Props = {
  imie: string | null;
  cytat: Cytat;
  produkt: string;
  obiekcje: Obiekcja[];
  pierwszeZdanie: string;
  poprawki: Poprawka[];
  ostatnia: { ocena: number; najslabsze: string; poprawka: string; wygrana: string } | null;
};

type Krok = "zapal" | "oddech" | "glos" | "kartka" | "glowa" | "sparing" | "rozmowa" | "po" | "koniec";
const KROKI: { id: Krok; nazwa: string }[] = [
  { id: "zapal", nazwa: "Light it" },
  { id: "oddech", nazwa: "Breathe" },
  { id: "glos", nazwa: "Voice" },
  { id: "kartka", nazwa: "Card" },
  { id: "glowa", nazwa: "Mindset" },
  { id: "sparing", nazwa: "Sparring" },
  { id: "rozmowa", nazwa: "Calling" },
];

const ODDECH_S = 60;
const GLOS_S = 45;

/** Faza oddechu w sekundzie t: 30 s „2 wdechy, 1 wydech" ×5, potem 4-4-4-4 ×2 (32 s). */
function fazaOddechu(t: number): { tekst: string; skala: number; cykl: string } {
  if (t < 30) {
    const w = t % 6;
    if (w < 1) return { tekst: "Breathe in through your nose", skala: 1.15, cykl: "double inhale, long exhale" };
    if (w < 2) return { tekst: "Once more, short", skala: 1.3, cykl: "double inhale, long exhale" };
    return { tekst: "Long exhale through your mouth", skala: 0.85, cykl: "double inhale, long exhale" };
  }
  const w = (t - 30) % 16;
  if (w < 4) return { tekst: "In 4", skala: 1.3, cykl: "box 4-4-4-4" };
  if (w < 8) return { tekst: "Hold 4", skala: 1.3, cykl: "box 4-4-4-4" };
  if (w < 12) return { tekst: "Out 4", skala: 0.85, cykl: "box 4-4-4-4" };
  return { tekst: "Hold empty 4", skala: 0.85, cykl: "box 4-4-4-4" };
}

/** Muzyka z WebAudio: 126 BPM, stopa + hi-hat + bas. Zero plików, zero praw. */
function startBeat(): { stop: () => void; cisza: (v: boolean) => void } {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const c = new AC();
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  master.gain.linearRampToValueAtTime(0.22, c.currentTime + 1.5);
  const BPM = 126;
  const krok = 60 / BPM / 2; // ósemki
  const bas = [55, 55, 65.4, 55, 82.4, 55, 73.4, 65.4]; // A1 A1 C2 A1 E2 A1 D2 C2
  let n = 0;
  let nastepny = c.currentTime + 0.1;
  let zywy = true;
  const kick = (t: number) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.3);
  };
  const hat = (t: number, glosno: number) => {
    const dl = Math.floor(c.sampleRate * 0.05);
    const buf = c.createBuffer(1, dl, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < dl; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / dl);
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const g = c.createGain();
    g.gain.value = glosno;
    s.connect(f).connect(g).connect(master);
    s.start(t);
  };
  const bass = (t: number, hz: number) => {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = hz;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(200, t + krok * 0.9);
    const g = c.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + krok * 0.95);
    o.connect(f).connect(g).connect(master);
    o.start(t);
    o.stop(t + krok);
  };
  const tick = () => {
    if (!zywy) return;
    while (nastepny < c.currentTime + 0.3) {
      if (n % 2 === 0) kick(nastepny);
      hat(nastepny, n % 2 === 1 ? 0.25 : 0.08);
      bass(nastepny, bas[n % bas.length]);
      nastepny += krok;
      n++;
    }
  };
  const id = setInterval(tick, 100);
  return {
    stop: () => {
      zywy = false;
      clearInterval(id);
      try {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
        setTimeout(() => void c.close(), 1000);
      } catch {}
    },
    cisza: (v: boolean) => {
      try {
        master.gain.linearRampToValueAtTime(v ? 0.06 : 0.22, c.currentTime + 0.4);
      } catch {}
    },
  };
}

type Rozpoznawanie = { start: () => void; stop: () => void; onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string };

export default function Ogien({ imie, cytat, produkt, obiekcje, pierwszeZdanie, poprawki, ostatnia }: Props) {
  const [krok, setKrok] = useState<Krok>("zapal");
  const [sek, setSek] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const beat = useRef<{ stop: () => void; cisza: (v: boolean) => void } | null>(null);
  const [muzyka, setMuzyka] = useState(false);
  const [hypeStan, setHypeStan] = useState<"idle" | "laduje" | "gra" | "blad">("idle");
  const [hypeTekst, setHypeTekst] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [zapisId, setZapisId] = useState<string | null>(null);

  // Głos
  const rozp = useRef<Rozpoznawanie | null>(null);
  const [transkrypt, setTranskrypt] = useState("");
  const [glosWynik, setGlosWynik] = useState<{ slowa: number; wypelniacze: number; naMin: number; tempo: number } | null>(null);
  const [zdanie, setZdanie] = useState(pierwszeZdanie);
  const [rozpoznawanieJest, setRozpoznawanieJest] = useState(true);

  // Kartka (w Bruno)
  const [k, setK] = useState({
    cel: "",
    pytanie: "",
    ob1: obiekcje[0]?.nazwa ?? "",
    re1: "",
    ob2: obiekcje[1]?.nazwa ?? "",
    re2: "",
    kwota: "",
    data: "",
  });
  const [najgorszy, setNajgorszy] = useState("I'll hear “no.” One “no” = one flashcard. That's it.");
  const [nakrecony, setNakrecony] = useState(false);

  // Po rozmowie
  const [po, setPo] = useState({ cel: "" as "" | "tak" | "nie" | "czesciowo", obiekcje: [] as string[], krok: "", kiedy: "" });
  const [zapisStan, setZapisStan] = useState<"idle" | "zapis" | "ok" | "blad">("idle");

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  const startTimer = () => {
    stopTimer();
    setSek(0);
    const od = Date.now();
    timer.current = setInterval(() => setSek(Math.round((Date.now() - od) / 1000)), 250);
  };
  useEffect(
    () => () => {
      stopTimer();
      beat.current?.stop();
      try {
        rozp.current?.stop();
      } catch {}
    },
    [],
  );

  const idz = (do_: Krok) => {
    try {
      rozp.current?.stop();
    } catch {}
    rozp.current = null;
    setKrok(do_);
    if (do_ === "oddech" || do_ === "glos" || do_ === "rozmowa") startTimer();
    else stopTimer();
    if (do_ === "rozmowa") {
      beat.current?.stop();
      beat.current = null;
      setMuzyka(false);
      audio.current?.pause();
    }
    if (do_ === "glos") startRozpoznawanie();
  };

  // Oddech: koniec po 60 s.
  useEffect(() => {
    if (krok === "oddech" && sek >= ODDECH_S) idz("glos");
    if (krok === "glos" && sek >= GLOS_S) zakonczGlos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sek, krok]);

  const przelaczMuzyke = () => {
    if (beat.current) {
      beat.current.stop();
      beat.current = null;
      setMuzyka(false);
    } else {
      try {
        beat.current = startBeat();
        setMuzyka(true);
      } catch {
        setMuzyka(false);
      }
    }
  };

  const nakrec = async () => {
    setHypeStan("laduje");
    setHypeTekst(null);
    try {
      const res = await fetch("/api/bruno/ogien/hype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cel: k.cel, najslabsze: ostatnia?.najslabsze ?? "", cytat: cytat.tekst }),
      });
      if (!res.ok) throw new Error("hype");
      const typ = res.headers.get("content-type") ?? "";
      if (typ.includes("audio")) {
        const tekst = res.headers.get("x-bruno-tekst");
        if (tekst) setHypeTekst(decodeURIComponent(tekst));
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (!audio.current) audio.current = new Audio();
        audio.current.src = url;
        beat.current?.cisza(true);
        audio.current.onended = () => {
          beat.current?.cisza(false);
          setHypeStan("idle");
        };
        await audio.current.play();
        setHypeStan("gra");
      } else {
        const d = await res.json();
        setHypeTekst(d.tekst ?? null);
        setHypeStan("idle");
      }
    } catch {
      setHypeStan("blad");
    }
  };

  const startRozpoznawanie = () => {
    const W = window as unknown as { webkitSpeechRecognition?: new () => Rozpoznawanie; SpeechRecognition?: new () => Rozpoznawanie };
    const K = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!K) {
      setRozpoznawanieJest(false);
      return;
    }
    setRozpoznawanieJest(true);
    setTranskrypt("");
    setGlosWynik(null);
    try {
      const r = new K();
      r.lang = "en-US";
      r.continuous = true;
      r.interimResults = true;
      let koncowe = "";
      r.onresult = (e) => {
        let tymczasowe = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const wynik = e.results[i] as ArrayLike<{ transcript: string }> & { isFinal?: boolean };
          const t = wynik[0]?.transcript ?? "";
          if (wynik.isFinal) koncowe += `${t} `;
          else tymczasowe += t;
        }
        setTranskrypt(`${koncowe}${tymczasowe}`.trim());
      };
      r.onerror = () => setRozpoznawanieJest(false);
      r.start();
      rozp.current = r;
    } catch {
      setRozpoznawanieJest(false);
    }
  };

  const zakonczGlos = () => {
    try {
      rozp.current?.stop();
    } catch {}
    rozp.current = null;
    stopTimer();
    const tekst = transkrypt.trim();
    if (tekst) {
      const s = Math.max(10, Math.min(GLOS_S, sek || GLOS_S));
      const m = policzMetryki([{ rola: "handlowiec", tekst, t: 0 }], s);
      setGlosWynik({ slowa: m.slowa_handlowca, wypelniacze: m.wypelniacze, naMin: m.wypelniacze_na_min, tempo: Math.round((m.slowa_handlowca / s) * 60) });
    }
    setKrok("kartka");
  };

  const zapiszKartke = async () => {
    try {
      const res = await fetch("/api/bruno/ogien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dane: { kartka: k, najgorszy, zdanie, glos: glosWynik, cytat, muzyka, hype: hypeTekst } }),
      });
      const d = await res.json();
      if (res.ok && d.id) setZapisId(d.id);
    } catch {}
  };

  const zapiszPo = async () => {
    setZapisStan("zapis");
    try {
      const res = await fetch("/api/bruno/ogien", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: zapisId, po_rozmowie: { ...po, trwala_s: sek } }),
      });
      setZapisStan(res.ok ? "ok" : "blad");
      if (res.ok) setKrok("koniec");
    } catch {
      setZapisStan("blad");
    }
  };

  const czas = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const nr = KROKI.findIndex((x) => x.id === krok);
  const pole = (n: keyof typeof k) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setK((x) => ({ ...x, [n]: e.target.value }));
  const wyj = (nazwa: string) => obiekcje.find((o) => o.nazwa === nazwa)?.wyjasnienie ?? null;
  const kartaSparingu = obiekcje.find((o) => o.nazwa === k.ob1)?.karta_id ?? obiekcje.find((o) => o.karta_id)?.karta_id ?? null;
  const faza = fazaOddechu(sek);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          <span className="bruno-gradient-tekst">Fire Up</span>
        </h1>
        <p className="text-slate-600 mt-2">5 minutes. Then you call.</p>
      </div>

      {/* Pasek kroków */}
      {krok !== "koniec" && (
        <ol className="flex flex-wrap justify-center gap-1.5 text-xs" aria-label="Steps">
          {KROKI.map((x, i) => (
            <li key={x.id} className={`px-2.5 py-1 rounded-full border ${i === nr ? "bg-slate-900 text-white border-slate-900" : i < nr ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-white/60 text-slate-500 border-slate-200"}`}>
              {i + 1}. {x.nazwa}
            </li>
          ))}
        </ol>
      )}

      {/* Muzyka + Bruno nakręca: widoczne od zapalenia do „Dzwonię" */}
      {krok !== "rozmowa" && krok !== "po" && krok !== "koniec" && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={przelaczMuzyke} className={`bruno-pastylka ${muzyka ? "bruno-pastylka-wybrana" : ""}`} aria-pressed={muzyka}>
            {muzyka ? "■ Music on" : "▶ Music"}
          </button>
          <button type="button" onClick={nakrec} disabled={hypeStan === "laduje" || hypeStan === "gra"} className="bruno-pastylka">
            {hypeStan === "laduje" ? "Bruno is taking a breath..." : hypeStan === "gra" ? "Bruno is talking..." : "Bruno, hype me up"}
          </button>
          {hypeStan === "blad" && <span className="text-xs text-red-700">That didn't work. Try again in a moment.</span>}
        </div>
      )}
      {hypeTekst && krok !== "koniec" && <p className="text-center text-slate-800 italic max-w-xl mx-auto">“{hypeTekst}”</p>}

      {krok === "zapal" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-6">
          <blockquote className="max-w-xl">
            <p className="bruno-h2 text-xl sm:text-2xl text-slate-900 leading-snug">“{cytat.tekst}”</p>
            <footer className="text-sm text-slate-500 mt-2">{cytat.autor}</footer>
          </blockquote>
          {ostatnia && (
            <div className="text-sm text-slate-700 bruno-szklo rounded-2xl p-4 max-w-xl">
              <div className="text-xs font-semibold uppercase tracking-wide text-cyan-800 mb-1">From your last call with Bruno ({ostatnia.ocena}/10)</div>
              <div><b>What worked:</b> {ostatnia.wygrana}</div>
              <div className="mt-1"><b>Do this differently today:</b> {ostatnia.poprawka}</div>
            </div>
          )}
          <p className="text-slate-600">{imie ? `${imie}, y` : "Y"}ou have a real call coming up. Turn on the music, get hyped, and let's go: breathe, voice, card, mindset.</p>
          <button type="button" onClick={() => idz("oddech")} className="bruno-przycisk text-base px-12 py-4">Light the fire</button>
        </div>
      )}

      {krok === "oddech" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-6 min-h-[26rem] justify-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">{faza.cykl} · {czas(ODDECH_S - sek)}</div>
          <div className="relative size-48 sm:size-60 grid place-items-center">
            <div
              className="absolute inset-0 rounded-full blur-2xl transition-transform duration-[900ms] ease-in-out"
              style={{ transform: `scale(${faza.skala})`, background: "radial-gradient(circle at 45% 40%, #f97316cc 0%, #ea580c 48%, #ea580c00 74%)" }}
              aria-hidden
            />
            <span className="relative bruno-h2 text-2xl text-white drop-shadow-[0_2px_12px_rgba(234,88,12,0.7)]" aria-live="polite">{faza.tekst}</span>
          </div>
          <p className="text-sm text-slate-600 max-w-md">First 30 s: two short breaths in through your nose, one long breath out through your mouth. The fastest known way to slow your heart rate. Then box breathing 4-4-4-4.</p>
          <button type="button" onClick={() => idz("glos")} className="bruno-przycisk-2">Skip</button>
        </div>
      )}

      {krok === "glos" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">Voice · {czas(GLOS_S - sek)}</div>
          <p className="text-slate-800">Stand up. Hum “mmm” for 10 s. Then read your first line <b>out loud 3 times</b>, slower each time.</p>
          <input id="zdanie" className="bruno-pole text-center text-lg" placeholder="Your first line on the call" value={zdanie} onChange={(e) => setZdanie(e.target.value)} maxLength={300} />
          <div className="text-sm text-slate-600 min-h-[3rem] max-w-xl">
            {rozpoznawanieJest ? (transkrypt ? `I hear: “${transkrypt}”` : "Listening... (mic, Chrome)") : "Your browser can't recognize speech, so I'm only tracking time. Chrome can do it."}
          </div>
          <button type="button" onClick={zakonczGlos} className="bruno-przycisk">Done, next</button>
        </div>
      )}

      {krok === "kartka" && (
        <div className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
          {glosWynik && (
            <div className="text-sm rounded-2xl bg-white/70 border border-slate-200 p-3 flex flex-wrap gap-x-5 gap-y-1">
              <span><b>{glosWynik.slowa}</b> {glosWynik.slowa === 1 ? "word" : "words"}</span>
              <span><b>{glosWynik.wypelniacze}</b> {glosWynik.wypelniacze === 1 ? "filler" : "fillers"} ({glosWynik.naMin}/min, {glosWynik.naMin <= 2 ? "clean" : glosWynik.naMin <= 5 ? "OK" : "too many “um”s"})</span>
              <span>pace <b>{glosWynik.tempo}</b> words/min ({glosWynik.tempo > 170 ? "too fast, slow down" : glosWynik.tempo < 90 ? "slow, good" : "normal"})</span>
            </div>
          )}
          <div>
            <h2 className="bruno-h2 text-lg">Call card</h2>
            <p className="text-sm text-slate-500">It stays in Bruno. Five things that decide how the call goes.</p>
          </div>
          <label className="text-sm text-slate-700" htmlFor="cel">
            1. Goal = dated next step
            <input id="cel" className="bruno-pole mt-1" placeholder="e.g. in-person meeting booked for next week, date and time" value={k.cel} onChange={pole("cel")} maxLength={200} />
          </label>
          <label className="text-sm text-slate-700" htmlFor="pytanie">
            2. Opening question (open: how, what, how much, when)
            <input id="pytanie" className="bruno-pole mt-1" placeholder="e.g. How do you handle grant paperwork today?" value={k.pytanie} onChange={pole("pytanie")} maxLength={200} />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            {([["ob1", "re1"], ["ob2", "re2"]] as const).map(([o, r], i) => (
              <div key={o} className="rounded-2xl bg-white/60 border border-slate-200 p-3 flex flex-col gap-2">
                <label className="text-sm text-slate-700" htmlFor={o}>
                  {i + 3}. Objection you'll hear
                  <select id={o} className="bruno-pole mt-1" value={k[o]} onChange={pole(o)}>
                    <option value="">choose</option>
                    {obiekcje.map((x) => (
                      <option key={x.nazwa} value={x.nazwa}>{x.nazwa}</option>
                    ))}
                  </select>
                </label>
                {wyj(k[o]) && <div className="text-xs text-slate-500">What the customer means: {wyj(k[o])}</div>}
                <label className="text-sm text-slate-700" htmlFor={r}>
                  Your FIRST response (a question or a label, not an argument)
                  <input id={r} className="bruno-pole mt-1" placeholder="e.g. “Compared to what?” / “It sounds like you're worried about paying it back.”" value={k[r]} onChange={pole(r)} maxLength={200} />
                </label>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm text-slate-700" htmlFor="kwota">
              5. Say the price straight (no “only,” no “just”)
              <input id="kwota" className="bruno-pole mt-1" placeholder="e.g. $6,050 total, then silence" value={k.kwota} onChange={pole("kwota")} maxLength={120} />
            </label>
            <label className="text-sm text-slate-700" htmlFor="data">
              Date you'll suggest
              <input id="data" className="bruno-pole mt-1" placeholder="e.g. Tuesday 10 AM or Thursday 2 PM" value={k.data} onChange={pole("data")} maxLength={120} />
            </label>
          </div>
          {poprawki.length > 0 && (
            <div className="text-sm rounded-2xl bg-cyan-50/70 border border-cyan-200 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-cyan-800 mb-1">Your open fixes from Bruno</div>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                {poprawki.map((p, i) => (
                  <li key={i}><b>{p.tresc}</b>{p.wzor ? `: ${p.wzor}` : ""}</li>
                ))}
              </ul>
            </div>
          )}
          {produkt && <div className="text-xs text-slate-500">You sell: {produkt.slice(0, 160)}</div>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                void zapiszKartke();
                setKrok("glowa");
              }}
              className="bruno-przycisk"
            >
              Got it, next
            </button>
          </div>
        </div>
      )}

      {krok === "glowa" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 text-center">
          <blockquote className="max-w-xl">
            <p className="bruno-h2 text-xl text-slate-900 leading-snug">“{cytat.tekst}”</p>
            <footer className="text-sm text-slate-500 mt-2">{cytat.autor}</footer>
          </blockquote>
          <p className="text-slate-700 max-w-lg">Not “calm down.” Fear and excitement are the same heartbeat. Only the label is different. Say it out loud:</p>
          <button type="button" onClick={() => setNakrecony(true)} aria-pressed={nakrecony} className={`${nakrecony ? "bruno-przycisk" : "bruno-przycisk-2"} text-xl px-10 py-5`}>
            {nakrecony ? "✓ I'm fired up" : "I'm fired up"}
          </button>
          <label className="w-full max-w-lg text-left text-sm text-slate-700" htmlFor="najgorszy">
            The worst that can happen
            <input id="najgorszy" className="bruno-pole mt-1" value={najgorszy} onChange={(e) => setNajgorszy(e.target.value)} maxLength={200} />
          </label>
          <button type="button" onClick={() => idz("sparing")} className="bruno-przycisk">Next</button>
        </div>
      )}

      {krok === "sparing" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
          <h2 className="bruno-h2 text-lg">Sparring (optional, 3 minutes)</h2>
          <p className="text-slate-700 max-w-lg">Bruno will throw {k.ob1 ? `“${k.ob1}”` : "your toughest objection"} at you. You answer once, get a score, come back here, and make the call.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {kartaSparingu ? (
              <Link href={`/bruno/rozmowa?karta=${encodeURIComponent(kartaSparingu)}`} className="bruno-przycisk-2">Spar with Bruno</Link>
            ) : (
              <Link href="/bruno/rozmowa" className="bruno-przycisk-2">Spar with Bruno</Link>
            )}
            <button type="button" onClick={() => idz("rozmowa")} className="bruno-przycisk text-base px-10 py-4">Calling</button>
          </div>
        </div>
      )}

      {krok === "rozmowa" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 text-center min-h-[24rem] justify-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">Call in progress</div>
          <div className="bruno-h1 text-5xl tabular-nums">{czas(sek)}</div>
          <div className="text-left text-sm text-slate-800 bg-white/70 border border-slate-200 rounded-2xl p-4 max-w-md w-full flex flex-col gap-1">
            {k.cel && <div><b>Goal:</b> {k.cel}</div>}
            {k.pytanie && <div><b>Start:</b> {k.pytanie}</div>}
            {k.ob1 && <div><b>{k.ob1}:</b> {k.re1 || "a question, not an argument"}</div>}
            {k.ob2 && <div><b>{k.ob2}:</b> {k.re2 || "a question, not an argument"}</div>}
            {k.kwota && <div><b>Price:</b> {k.kwota}, then silence</div>}
            {k.data && <div><b>Date:</b> {k.data}</div>}
          </div>
          <button type="button" onClick={() => { stopTimer(); setKrok("po"); }} className="bruno-przycisk-2">Call ended</button>
        </div>
      )}

      {krok === "po" && (
        <div className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
          <div>
            <h2 className="bruno-h2 text-lg">After the call: 3 questions</h2>
            <p className="text-sm text-slate-500">It lasted {czas(sek)}. 30 seconds and you're done.</p>
          </div>
          <fieldset>
            <legend className="text-sm text-slate-700 mb-2">1. Did you hit the goal “{k.cel || "dated next step"}”?</legend>
            <div className="flex gap-2 flex-wrap">
              {(["tak", "czesciowo", "nie"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={po.cel === v} onClick={() => setPo((x) => ({ ...x, cel: v }))} className={`bruno-pastylka ${po.cel === v ? "bruno-pastylka-wybrana" : ""}`}>
                  {v === "tak" ? "Yes" : v === "czesciowo" ? "Partly" : "No"}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm text-slate-700 mb-2">2. Which objections came up?</legend>
            <div className="flex gap-2 flex-wrap">
              {obiekcje.map((o) => {
                const w = po.obiekcje.includes(o.nazwa);
                return (
                  <button key={o.nazwa} type="button" aria-pressed={w} onClick={() => setPo((x) => ({ ...x, obiekcje: w ? x.obiekcje.filter((y) => y !== o.nazwa) : [...x.obiekcje, o.nazwa] }))} className={`bruno-pastylka ${w ? "bruno-pastylka-wybrana" : ""}`}>
                    {w && <span className="mr-1" aria-hidden>✓</span>}{o.nazwa}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm text-slate-700" htmlFor="po-krok">
              3. Next step
              <input id="po-krok" className="bruno-pole mt-1" placeholder="e.g. meeting at their office / sending a quote / none" value={po.krok} onChange={(e) => setPo((x) => ({ ...x, krok: e.target.value }))} maxLength={200} />
            </label>
            <label className="text-sm text-slate-700" htmlFor="po-kiedy">
              When
              <input id="po-kiedy" className="bruno-pole mt-1" placeholder="e.g. Tuesday 10 AM" value={po.kiedy} onChange={(e) => setPo((x) => ({ ...x, kiedy: e.target.value }))} maxLength={120} />
            </label>
          </div>
          <div className="flex items-center gap-4 justify-end">
            {zapisStan === "blad" && <span className="text-sm text-red-700">It didn't save. Try again.</span>}
            <button type="button" onClick={zapiszPo} disabled={zapisStan === "zapis" || !po.cel} className="bruno-przycisk">{zapisStan === "zapis" ? "Saving..." : "Save"}</button>
          </div>
        </div>
      )}

      {krok === "koniec" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
          <h2 className="bruno-h2 text-2xl">{po.cel === "tak" ? "Nailed it. That's how it's done." : po.cel === "czesciowo" ? "A step forward. The next one will be a full win." : "One “no.” One flashcard. Next call."}</h2>
          {po.krok && <p className="text-slate-700"><b>Next step:</b> {po.krok}{po.kiedy ? `, ${po.kiedy}` : ""}</p>}
          {po.obiekcje.length > 0 && <p className="text-sm text-slate-600">Came up: {po.obiekcje.join(", ")}. Bruno will bring them back in Drills.</p>}
          <div className="flex flex-wrap gap-3 justify-center">
            <button type="button" onClick={() => { setPo({ cel: "", obiekcje: [], krok: "", kiedy: "" }); setZapisStan("idle"); setZapisId(null); setKrok("zapal"); }} className="bruno-przycisk">Next call</button>
            <Link href="/bruno/trening" className="bruno-przycisk-2">Drills</Link>
            <Link href="/bruno/panel" className="bruno-przycisk-2">Home</Link>
          </div>
        </div>
      )}
    </div>
  );
}
