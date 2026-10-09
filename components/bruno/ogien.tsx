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
  { id: "zapal", nazwa: "Zapal" },
  { id: "oddech", nazwa: "Oddech" },
  { id: "glos", nazwa: "Głos" },
  { id: "kartka", nazwa: "Kartka" },
  { id: "glowa", nazwa: "Głowa" },
  { id: "sparing", nazwa: "Sparing" },
  { id: "rozmowa", nazwa: "Dzwonię" },
];

const ODDECH_S = 60;
const GLOS_S = 45;

/** Faza oddechu w sekundzie t: 30 s „2 wdechy, 1 wydech" ×5, potem 4-4-4-4 ×2 (32 s). */
function fazaOddechu(t: number): { tekst: string; skala: number; cykl: string } {
  if (t < 30) {
    const w = t % 6;
    if (w < 1) return { tekst: "Wdech nosem", skala: 1.15, cykl: "podwójny wdech, długi wydech" };
    if (w < 2) return { tekst: "Jeszcze raz, krótko", skala: 1.3, cykl: "podwójny wdech, długi wydech" };
    return { tekst: "Długi wydech ustami", skala: 0.85, cykl: "podwójny wdech, długi wydech" };
  }
  const w = (t - 30) % 16;
  if (w < 4) return { tekst: "Wdech 4", skala: 1.3, cykl: "kwadrat 4-4-4-4" };
  if (w < 8) return { tekst: "Trzymaj 4", skala: 1.3, cykl: "kwadrat 4-4-4-4" };
  if (w < 12) return { tekst: "Wydech 4", skala: 0.85, cykl: "kwadrat 4-4-4-4" };
  return { tekst: "Pusto 4", skala: 0.85, cykl: "kwadrat 4-4-4-4" };
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
  const [najgorszy, setNajgorszy] = useState("Usłyszę „nie”. Jedno „nie” = jedna fiszka. Tyle.");
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
      r.lang = "pl-PL";
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
          Ogień <span className="bruno-gradient-tekst">przed rozmową</span>
        </h1>
        <p className="text-slate-600 mt-2">5 minut. Potem dzwonisz.</p>
      </div>

      {/* Pasek kroków */}
      {krok !== "koniec" && (
        <ol className="flex flex-wrap justify-center gap-1.5 text-xs" aria-label="Kroki">
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
            {muzyka ? "■ Muzyka gra" : "▶ Muzyka"}
          </button>
          <button type="button" onClick={nakrec} disabled={hypeStan === "laduje" || hypeStan === "gra"} className="bruno-pastylka">
            {hypeStan === "laduje" ? "Bruno bierze oddech..." : hypeStan === "gra" ? "Bruno mówi..." : "Bruno, nakręć mnie"}
          </button>
          {hypeStan === "blad" && <span className="text-xs text-red-700">Nie udało się. Spróbuj za chwilę.</span>}
        </div>
      )}
      {hypeTekst && krok !== "koniec" && <p className="text-center text-slate-800 italic max-w-xl mx-auto">„{hypeTekst}”</p>}

      {krok === "zapal" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-6">
          <blockquote className="max-w-xl">
            <p className="bruno-h2 text-xl sm:text-2xl text-slate-900 leading-snug">„{cytat.tekst}”</p>
            <footer className="text-sm text-slate-500 mt-2">{cytat.autor}</footer>
          </blockquote>
          {ostatnia && (
            <div className="text-sm text-slate-700 bruno-szklo rounded-2xl p-4 max-w-xl">
              <div className="text-xs font-semibold uppercase tracking-wide text-cyan-800 mb-1">Z ostatniej rozmowy z Bruno ({ostatnia.ocena}/10)</div>
              <div><b>Zagrało:</b> {ostatnia.wygrana}</div>
              <div className="mt-1"><b>Dziś zrób inaczej:</b> {ostatnia.poprawka}</div>
            </div>
          )}
          <p className="text-slate-600">{imie ? `${imie}, m` : "M"}asz za chwilę prawdziwą rozmowę. Włącz muzykę, daj się nakręcić i lecimy: oddech, głos, kartka, głowa.</p>
          <button type="button" onClick={() => idz("oddech")} className="bruno-przycisk text-base px-12 py-4">Zapal ogień</button>
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
          <p className="text-sm text-slate-600 max-w-md">Pierwsze 30 s: dwa krótkie wdechy nosem, jeden długi wydech ustami. Najszybszy znany sposób na zbicie tętna. Potem kwadrat 4-4-4-4.</p>
          <button type="button" onClick={() => idz("glos")} className="bruno-przycisk-2">Pomiń</button>
        </div>
      )}

      {krok === "glos" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">Głos · {czas(GLOS_S - sek)}</div>
          <p className="text-slate-800">Wstań. 10 s mrucz „mmm”. Potem przeczytaj swoje pierwsze zdanie <b>3 razy na głos</b>, coraz wolniej.</p>
          <input id="zdanie" className="bruno-pole text-center text-lg" placeholder="Twoje pierwsze zdanie w rozmowie" value={zdanie} onChange={(e) => setZdanie(e.target.value)} maxLength={300} />
          <div className="text-sm text-slate-600 min-h-[3rem] max-w-xl">
            {rozpoznawanieJest ? (transkrypt ? `Słyszę: „${transkrypt}”` : "Słucham... (mikrofon, Chrome)") : "Przeglądarka nie rozpoznaje mowy, liczę tylko czas. Chrome to umie."}
          </div>
          <button type="button" onClick={zakonczGlos} className="bruno-przycisk">Gotowe, dalej</button>
        </div>
      )}

      {krok === "kartka" && (
        <div className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
          {glosWynik && (
            <div className="text-sm rounded-2xl bg-white/70 border border-slate-200 p-3 flex flex-wrap gap-x-5 gap-y-1">
              <span><b>{glosWynik.slowa}</b> słów</span>
              <span><b>{glosWynik.wypelniacze}</b> wypełniaczy ({glosWynik.naMin}/min, {glosWynik.naMin <= 2 ? "czysto" : glosWynik.naMin <= 5 ? "średnio" : "za dużo „yy”"})</span>
              <span>tempo <b>{glosWynik.tempo}</b> słów/min ({glosWynik.tempo > 170 ? "za szybko, zwolnij" : glosWynik.tempo < 90 ? "wolno, dobrze" : "w normie"})</span>
            </div>
          )}
          <div>
            <h2 className="bruno-h2 text-lg">Kartka rozmowy</h2>
            <p className="text-sm text-slate-500">Zostaje w Bruno. Pięć rzeczy, które decydują o wyniku.</p>
          </div>
          <label className="text-sm text-slate-700" htmlFor="cel">
            1. Cel = następny krok z datą
            <input id="cel" className="bruno-pole mt-1" placeholder="np. umówione spotkanie na żywo w przyszłym tygodniu, data i godzina" value={k.cel} onChange={pole("cel")} maxLength={200} />
          </label>
          <label className="text-sm text-slate-700" htmlFor="pytanie">
            2. Pytanie otwierające (otwarte: jak, co, ile, kiedy)
            <input id="pytanie" className="bruno-pole mt-1" placeholder="np. Jak dziś wygląda u Pana rozliczanie dotacji?" value={k.pytanie} onChange={pole("pytanie")} maxLength={200} />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            {([["ob1", "re1"], ["ob2", "re2"]] as const).map(([o, r], i) => (
              <div key={o} className="rounded-2xl bg-white/60 border border-slate-200 p-3 flex flex-col gap-2">
                <label className="text-sm text-slate-700" htmlFor={o}>
                  {i + 3}. Obiekcja, która padnie
                  <select id={o} className="bruno-pole mt-1" value={k[o]} onChange={pole(o)}>
                    <option value="">wybierz</option>
                    {obiekcje.map((x) => (
                      <option key={x.nazwa} value={x.nazwa}>{x.nazwa}</option>
                    ))}
                  </select>
                </label>
                {wyj(k[o]) && <div className="text-xs text-slate-500">Co klient ma na myśli: {wyj(k[o])}</div>}
                <label className="text-sm text-slate-700" htmlFor={r}>
                  Twoja PIERWSZA reakcja (pytanie albo etykieta, nie argument)
                  <input id={r} className="bruno-pole mt-1" placeholder="np. „W porównaniu do czego?” / „Wygląda na to, że boi się Pan zwrotu.”" value={k[r]} onChange={pole(r)} maxLength={200} />
                </label>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm text-slate-700" htmlFor="kwota">
              5. Kwota wprost (bez „tylko”, „jedynie”)
              <input id="kwota" className="bruno-pole mt-1" placeholder="np. 6 050 zł brutto, potem cisza" value={k.kwota} onChange={pole("kwota")} maxLength={120} />
            </label>
            <label className="text-sm text-slate-700" htmlFor="data">
              Data, którą zaproponujesz
              <input id="data" className="bruno-pole mt-1" placeholder="np. wtorek 10:00 albo czwartek 14:00" value={k.data} onChange={pole("data")} maxLength={120} />
            </label>
          </div>
          {poprawki.length > 0 && (
            <div className="text-sm rounded-2xl bg-cyan-50/70 border border-cyan-200 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-cyan-800 mb-1">Twoje otwarte poprawki z Bruno</div>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                {poprawki.map((p, i) => (
                  <li key={i}><b>{p.tresc}</b>{p.wzor ? `: ${p.wzor}` : ""}</li>
                ))}
              </ul>
            </div>
          )}
          {produkt && <div className="text-xs text-slate-500">Sprzedajesz: {produkt.slice(0, 160)}</div>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                void zapiszKartke();
                setKrok("glowa");
              }}
              className="bruno-przycisk"
            >
              Mam to, dalej
            </button>
          </div>
        </div>
      )}

      {krok === "glowa" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 text-center">
          <blockquote className="max-w-xl">
            <p className="bruno-h2 text-xl text-slate-900 leading-snug">„{cytat.tekst}”</p>
            <footer className="text-sm text-slate-500 mt-2">{cytat.autor}</footer>
          </blockquote>
          <p className="text-slate-700 max-w-lg">Nie „uspokój się”. Strach i ekscytacja to to samo tętno, różni je tylko etykieta. Powiedz na głos:</p>
          <button type="button" onClick={() => setNakrecony(true)} aria-pressed={nakrecony} className={`${nakrecony ? "bruno-przycisk" : "bruno-przycisk-2"} text-xl px-10 py-5`}>
            {nakrecony ? "✓ Jestem nakręcony" : "Jestem nakręcony"}
          </button>
          <label className="w-full max-w-lg text-left text-sm text-slate-700" htmlFor="najgorszy">
            Najgorsze, co może się stać
            <input id="najgorszy" className="bruno-pole mt-1" value={najgorszy} onChange={(e) => setNajgorszy(e.target.value)} maxLength={200} />
          </label>
          <button type="button" onClick={() => idz("sparing")} className="bruno-przycisk">Dalej</button>
        </div>
      )}

      {krok === "sparing" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
          <h2 className="bruno-h2 text-lg">Sparing (opcja, 3 minuty)</h2>
          <p className="text-slate-700 max-w-lg">Bruno rzuci Ci {k.ob1 ? `„${k.ob1}”` : "najtrudniejszą obiekcję"}. Odpowiadasz raz, dostajesz ocenę, wracasz tu i dzwonisz.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {kartaSparingu ? (
              <Link href={`/bruno/rozmowa?karta=${encodeURIComponent(kartaSparingu)}`} className="bruno-przycisk-2">Sparing z Bruno</Link>
            ) : (
              <Link href="/bruno/rozmowa" className="bruno-przycisk-2">Sparing z Bruno</Link>
            )}
            <button type="button" onClick={() => idz("rozmowa")} className="bruno-przycisk text-base px-10 py-4">Dzwonię</button>
          </div>
        </div>
      )}

      {krok === "rozmowa" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 text-center min-h-[24rem] justify-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">Rozmowa trwa</div>
          <div className="bruno-h1 text-5xl tabular-nums">{czas(sek)}</div>
          <div className="text-left text-sm text-slate-800 bg-white/70 border border-slate-200 rounded-2xl p-4 max-w-md w-full flex flex-col gap-1">
            {k.cel && <div><b>Cel:</b> {k.cel}</div>}
            {k.pytanie && <div><b>Start:</b> {k.pytanie}</div>}
            {k.ob1 && <div><b>{k.ob1}:</b> {k.re1 || "pytanie, nie argument"}</div>}
            {k.ob2 && <div><b>{k.ob2}:</b> {k.re2 || "pytanie, nie argument"}</div>}
            {k.kwota && <div><b>Kwota:</b> {k.kwota}, potem cisza</div>}
            {k.data && <div><b>Data:</b> {k.data}</div>}
          </div>
          <button type="button" onClick={() => { stopTimer(); setKrok("po"); }} className="bruno-przycisk-2">Rozmowa skończona</button>
        </div>
      )}

      {krok === "po" && (
        <div className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
          <div>
            <h2 className="bruno-h2 text-lg">Po rozmowie: 3 pytania</h2>
            <p className="text-sm text-slate-500">Trwała {czas(sek)}. 30 sekund i masz to z głowy.</p>
          </div>
          <fieldset>
            <legend className="text-sm text-slate-700 mb-2">1. Cel „{k.cel || "następny krok z datą"}” osiągnięty?</legend>
            <div className="flex gap-2 flex-wrap">
              {(["tak", "czesciowo", "nie"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={po.cel === v} onClick={() => setPo((x) => ({ ...x, cel: v }))} className={`bruno-pastylka ${po.cel === v ? "bruno-pastylka-wybrana" : ""}`}>
                  {v === "tak" ? "Tak" : v === "czesciowo" ? "Częściowo" : "Nie"}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm text-slate-700 mb-2">2. Które obiekcje padły?</legend>
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
              3. Następny krok
              <input id="po-krok" className="bruno-pole mt-1" placeholder="np. spotkanie u klienta / wysyłam ofertę / nie" value={po.krok} onChange={(e) => setPo((x) => ({ ...x, krok: e.target.value }))} maxLength={200} />
            </label>
            <label className="text-sm text-slate-700" htmlFor="po-kiedy">
              Kiedy
              <input id="po-kiedy" className="bruno-pole mt-1" placeholder="np. wtorek 10:00" value={po.kiedy} onChange={(e) => setPo((x) => ({ ...x, kiedy: e.target.value }))} maxLength={120} />
            </label>
          </div>
          <div className="flex items-center gap-4 justify-end">
            {zapisStan === "blad" && <span className="text-sm text-red-700">Nie zapisało się, spróbuj jeszcze raz.</span>}
            <button type="button" onClick={zapiszPo} disabled={zapisStan === "zapis" || !po.cel} className="bruno-przycisk">{zapisStan === "zapis" ? "Zapisuję..." : "Zapisz"}</button>
          </div>
        </div>
      )}

      {krok === "koniec" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
          <h2 className="bruno-h2 text-2xl">{po.cel === "tak" ? "Jest. Tak to się robi." : po.cel === "czesciowo" ? "Krok do przodu. Następny będzie pełny." : "Jedno „nie”. Jedna fiszka. Następna rozmowa."}</h2>
          {po.krok && <p className="text-slate-700"><b>Następny krok:</b> {po.krok}{po.kiedy ? `, ${po.kiedy}` : ""}</p>}
          {po.obiekcje.length > 0 && <p className="text-sm text-slate-600">Padły: {po.obiekcje.join(", ")}. Bruno wróci do nich w Treningu.</p>}
          <div className="flex flex-wrap gap-3 justify-center">
            <button type="button" onClick={() => { setPo({ cel: "", obiekcje: [], krok: "", kiedy: "" }); setZapisStan("idle"); setZapisId(null); setKrok("zapal"); }} className="bruno-przycisk">Następna rozmowa</button>
            <Link href="/bruno/trening" className="bruno-przycisk-2">Trening</Link>
            <Link href="/bruno/panel" className="bruno-przycisk-2">Panel</Link>
          </div>
        </div>
      )}
    </div>
  );
}
