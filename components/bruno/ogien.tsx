"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Cytat } from "@/lib/bruno/cytaty";
import { policzMetryki } from "@/lib/bruno/metryki";
import { useT } from "@/components/bruno/jezyk-kontekst";
import type { Jezyk } from "@/lib/bruno/i18n";

// „Ogień przed rozmową" (USER_001 9.10). Rytuał 5 minut przed PRAWDZIWYM telefonem:
// zapal (muzyka + Bruno nakręca + cytat) → oddech (instrukcja + ćwiczenie, 2 techniki) → głos 45 s → głowa →
// „Dzwonię" (zegar) → koniec. 14.10: bez kartki i sparingu. 21.10 USER: „tego już nie”, 3 pytania po rozmowie wypadły,
// zapisuje się tylko czas rozmowy. Nic na kartkach (USER_001).
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

// 14.10 (USER_001): kartka i sparing wypadły, oddech dostał instrukcję przed każdą techniką i grafikę.
type Krok = "zapal" | "oddech" | "glos" | "glowa" | "rozmowa" | "koniec";
const KROKI: { id: Krok; nazwa: string; nazwaPl: string }[] = [
  { id: "zapal", nazwa: "Light it", nazwaPl: "Zapal" },
  { id: "oddech", nazwa: "Breathe", nazwaPl: "Oddech" },
  { id: "glos", nazwa: "Voice", nazwaPl: "Głos" },
  { id: "glowa", nazwa: "Mindset", nazwaPl: "Głowa" },
  { id: "rozmowa", nazwa: "Calling", nazwaPl: "Dzwonię" },
];

const GLOS_S = 45;

// Technika 1: podwójny wdech (2 s + 1 s dobrania), długi wydech 6 s. Było 1+1+4 s i USER_001 14.10:
// „za szybko, nie wiadomo, o co chodzi”. Technika 2: kwadrat 4-4-4-4.
const SIGH = [2, 1, 6] as const;
const SIGH_CYKL = 9;
const SIGH_RAZY = 4;
const BOX_RAZY = 2;
type Technika = "sigh" | "box";
const TECHNIKA_S: Record<Technika, number> = { sigh: SIGH_CYKL * SIGH_RAZY, box: 16 * BOX_RAZY };

/** Faza w sekundzie t (ułamkowej) danej techniki: napis, skala kuli, postęp 0-1 w cyklu. */
function faza(tech: Technika, t: number, jezyk: Jezyk): { tekst: string; skala: number; postep: number } {
  const pl = jezyk === "pl";
  if (tech === "sigh") {
    const w = t % SIGH_CYKL;
    const postep = w / SIGH_CYKL;
    if (w < SIGH[0]) return { tekst: pl ? "Wdech nosem" : "Breathe in (nose)", skala: 1.15, postep };
    if (w < SIGH[0] + SIGH[1]) return { tekst: pl ? "Dobierz krótko" : "Top up, short", skala: 1.3, postep };
    return { tekst: pl ? "Długi wydech ustami" : "Long exhale (mouth)", skala: 0.85, postep };
  }
  const w = t % 16;
  const postep = w / 16;
  if (w < 4) return { tekst: pl ? "Wdech 4" : "In 4", skala: 1.3, postep };
  if (w < 8) return { tekst: pl ? "Trzymaj 4" : "Hold 4", skala: 1.3, postep };
  if (w < 12) return { tekst: pl ? "Wydech 4" : "Out 4", skala: 0.85, postep };
  return { tekst: pl ? "Pusto 4" : "Hold empty 4", skala: 0.85, postep };
}

/** Grafika techniki: krzywa oddechu (podwójny wdech) albo kwadrat (4-4-4-4) z kropką. postep = null: bez kropki. */
function GrafikaOddechu({ tech, postep, jezyk }: { tech: Technika; postep: number | null; jezyk: Jezyk }) {
  const pl = jezyk === "pl";
  if (tech === "sigh") {
    // Objętość płuc w czasie: 0-2 s w górę, 2-3 s jeszcze wyżej (stromo), 3-9 s powoli w dół.
    const W = 270, H = 110, x = (s: number) => 10 + (s / SIGH_CYKL) * (W - 20), y = (v: number) => H - 22 - v * (H - 42);
    const punkty: [number, number][] = [[0, 0], [2, 0.7], [3, 1], [9, 0]];
    const d = punkty.map(([s, v], i) => `${i ? "L" : "M"}${x(s).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    let kropka: [number, number] | null = null;
    if (postep !== null) {
      const s = postep * SIGH_CYKL;
      const i = Math.max(0, punkty.findIndex(([ps], j) => j > 0 && s <= ps) - 1);
      const [s0, v0] = punkty[i], [s1, v1] = punkty[i + 1] ?? punkty[i];
      const v = s1 === s0 ? v0 : v0 + ((v1 - v0) * (s - s0)) / (s1 - s0);
      kropka = [x(s), y(v)];
    }
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs" role="img" aria-label={pl ? "Wdech, dobranie, długi wydech" : "Inhale, top up, long exhale"}>
        <path d={d} fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <text x={x(1)} y={H - 4} textAnchor="middle" className="fill-slate-500" fontSize="11">{pl ? "wdech 2 s" : "in 2 s"}</text>
        <text x={x(2.6)} y={14} textAnchor="middle" className="fill-slate-500" fontSize="11">{pl ? "+1 s" : "+1 s"}</text>
        <text x={x(6)} y={H - 4} textAnchor="middle" className="fill-slate-500" fontSize="11">{pl ? "wydech 6 s" : "out 6 s"}</text>
        {kropka && <circle cx={kropka[0]} cy={kropka[1]} r="8" fill="#fff" stroke="#ea580c" strokeWidth="3" />}
      </svg>
    );
  }
  // Kwadrat: góra = wdech, prawy bok = trzymaj, dół = wydech, lewy bok = pusto.
  const A = 30, B = 150;
  let kropka: [number, number] | null = null;
  if (postep !== null) {
    const s = postep * 4, f = s % 1;
    const bok = Math.floor(s);
    kropka = bok === 0 ? [A + (B - A) * f, A] : bok === 1 ? [B, A + (B - A) * f] : bok === 2 ? [B - (B - A) * f, B] : [A, B - (B - A) * f];
  }
  const L = pl ? ["wdech 4", "trzymaj 4", "wydech 4", "pusto 4"] : ["in 4", "hold 4", "out 4", "empty 4"];
  return (
    <svg viewBox="0 0 180 180" className="w-40 sm:w-44" role="img" aria-label={L.join(", ")}>
      <rect x={A} y={A} width={B - A} height={B - A} rx="6" fill="none" stroke="#f97316" strokeWidth="4" opacity="0.9" />
      <text x="90" y="20" textAnchor="middle" className="fill-slate-500" fontSize="11">{L[0]} →</text>
      <text x="168" y="90" textAnchor="middle" className="fill-slate-500" fontSize="11" transform="rotate(90 168 90)">{L[1]} →</text>
      <text x="90" y="170" textAnchor="middle" className="fill-slate-500" fontSize="11">← {L[2]}</text>
      <text x="12" y="90" textAnchor="middle" className="fill-slate-500" fontSize="11" transform="rotate(-90 12 90)">{L[3]} →</text>
      {kropka && <circle cx={kropka[0]} cy={kropka[1]} r="9" fill="#fff" stroke="#ea580c" strokeWidth="3" />}
    </svg>
  );
}

// 14.10: obiekcje z konfiguracji bywają po angielsku (konto zakładane z przykładów EN).
// Na panelu PL pokazujemy polską nazwę, w danych zostaje oryginał.
const OBIEKCJE_PL: Record<string, string> = {
  "too expensive": "Za drogo",
  "it's too expensive": "Za drogo",
  "your competitor has the same thing": "Konkurencja ma to samo",
  "your competitor has the same thing cheaper": "Konkurencja ma to samo taniej",
  "i need to think about it": "Muszę to przemyśleć",
  "send me an email": "Proszę przesłać maila",
  "we already have a supplier": "Mamy już dostawcę",
  "we already have a lawyer": "Mamy już prawnika",
  "not now": "Nie teraz",
  "no budget": "Nie mamy budżetu",
  "i'm not interested": "Nie jestem zainteresowany",
  "i need to talk to my partner": "Muszę porozmawiać ze wspólnikiem",
  "there's no point, we won't win": "To nie ma sensu, nic nie wygramy",
};
const nazwaObiekcji = (nazwa: string, jezyk: Jezyk) =>
  jezyk === "pl" ? OBIEKCJE_PL[nazwa.trim().toLowerCase().replace(/[.!?]+$/, "").replace(/’/g, "'")] ?? nazwa : nazwa;

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

export default function Ogien({ imie, cytat, obiekcje, pierwszeZdanie, ostatnia }: Props) {
  const { t, jezyk } = useT();
  const cudzy = (s: string) => (jezyk === "pl" ? `„${s}”` : `“${s}”`);
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

  // Oddech: najpierw instrukcja techniki, potem ćwiczenie (14.10).
  const [tech, setTech] = useState<Technika>("sigh");
  const [cwiczy, setCwiczy] = useState(false);
  const [tOdd, setTOdd] = useState(0);
  const oddStart = useRef(0);

  // Kartka wypadła z ekranu (14.10), zostają domyślne obiekcje dla podglądu w trakcie rozmowy.
  const [k] = useState({
    cel: "",
    pytanie: "",
    ob1: obiekcje[0]?.nazwa ?? "",
    re1: "",
    ob2: obiekcje[1]?.nazwa ?? "",
    re2: "",
    kwota: "",
    data: "",
  });
  const [najgorszy, setNajgorszy] = useState(t("I'll hear “no.” One “no” = one flashcard. That's it.", "Usłyszę „nie”. Jedno „nie” = jedna fiszka. Tyle."));
  const [nakrecony, setNakrecony] = useState(false);


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
    if (do_ === "oddech") {
      setTech("sigh");
      setCwiczy(false);
    }
    if (do_ === "glos" || do_ === "rozmowa") startTimer();
    else stopTimer();
    if (do_ === "rozmowa") void zapiszKartke();
    if (do_ === "rozmowa") {
      beat.current?.stop();
      beat.current = null;
      setMuzyka(false);
      audio.current?.pause();
    }
    if (do_ === "glos") startRozpoznawanie();
  };

  useEffect(() => {
    if (krok === "glos" && sek >= GLOS_S) zakonczGlos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sek, krok]);

  // Ćwiczenie oddechu: zegar co 100 ms (płynna kropka), po czasie techniki następna instrukcja albo „Głos”.
  useEffect(() => {
    if (krok !== "oddech" || !cwiczy) return;
    oddStart.current = Date.now();
    setTOdd(0);
    const id = setInterval(() => {
      const t = (Date.now() - oddStart.current) / 1000;
      if (t >= TECHNIKA_S[tech]) {
        clearInterval(id);
        setCwiczy(false);
        if (tech === "sigh") setTech("box");
        else idz("glos");
        return;
      }
      setTOdd(t);
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [krok, cwiczy, tech]);

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
      r.lang = jezyk === "pl" ? "pl-PL" : "en-US";
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
      const m = policzMetryki([{ rola: "handlowiec", tekst, t: 0 }], s, [], jezyk);
      setGlosWynik({ slowa: m.slowa_handlowca, wypelniacze: m.wypelniacze, naMin: m.wypelniacze_na_min, tempo: Math.round((m.slowa_handlowca / s) * 60) });
    }
    setKrok("glowa");
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

  // Koniec rozmowy: zapis czasu trwania, bez pytań (21.10).
  const zakonczRozmowe = () => {
    stopTimer();
    setKrok("koniec");
    void fetch("/api/bruno/ogien", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: zapisId, po_rozmowie: { trwala_s: sek } }),
    }).catch(() => {});
  };

  const czas = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const nr = KROKI.findIndex((x) => x.id === krok);
  const ob = (nazwa: string) => nazwaObiekcji(nazwa, jezyk);
  const f = faza(tech, tOdd, jezyk);
  const INFO: Record<Technika, { nr: string; tytul: string; opis: string }> = {
    sigh: {
      nr: t("Technique 1 of 2", "Technika 1 z 2"),
      tytul: t("Double inhale", "Podwójny wdech"),
      opis: t(
        `Breathe in through your nose for 2 s, then top up with a short 1 s breath. Breathe out slowly through your mouth for 6 s. The fastest known way to slow your heart rate. ${SIGH_RAZY} rounds, ${TECHNIKA_S.sigh} s.`,
        `Wdech nosem 2 s, potem krótkie dobranie powietrza 1 s. Powolny wydech ustami 6 s. Najszybszy znany sposób na zbicie tętna. ${SIGH_RAZY} razy, ${TECHNIKA_S.sigh} s.`,
      ),
    },
    box: {
      nr: t("Technique 2 of 2", "Technika 2 z 2"),
      tytul: t("Box 4-4-4-4", "Kwadrat 4-4-4-4"),
      opis: t(
        `In 4 s, hold 4 s, out 4 s, hold empty 4 s. Follow the dot around the square. Steadies your head before the call. ${BOX_RAZY} rounds, ${TECHNIKA_S.box} s.`,
        `Wdech 4 s, trzymasz 4 s, wydech 4 s, trzymasz pusto 4 s. Idź za kropką po kwadracie. Uspokaja głowę przed rozmową. ${BOX_RAZY} razy, ${TECHNIKA_S.box} s.`,
      ),
    },
  };

  return (
    // 28.10 (USER_001: „czytelniej”): nagłówek z lewej, przyciski z prawej; kroki jako pionowa lista z lewej, treść kroku z prawej (CSS .brg-* w motyw-rinesk.css).
    <div className="flex flex-col gap-6 brg">
      <div className="brg-naglowek">
        <div>
          <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
            {jezyk === "pl" ? <>Strefa <span className="bruno-gradient-tekst">mentalna</span></> : <>Mental <span className="bruno-gradient-tekst">Zone</span></>}
          </h1>
          <p className="text-slate-600 mt-2">{t("Before a real sales call", "Przed prawdziwą rozmową sprzedażową")}</p>
        </div>

      {/* Muzyka + Bruno nakręca: widoczne od zapalenia do „Dzwonię" */}
      {krok !== "rozmowa" && krok !== "koniec" && (
        <div className="flex flex-wrap items-center justify-center gap-2 brg-akcje">
          <button type="button" onClick={przelaczMuzyke} className={`bruno-pastylka ${muzyka ? "bruno-pastylka-wybrana" : ""}`} aria-pressed={muzyka}>
            {muzyka ? t("■ Music on", "■ Muzyka gra") : t("▶ Music", "▶ Muzyka")}
          </button>
          <button type="button" onClick={nakrec} disabled={hypeStan === "laduje" || hypeStan === "gra"} className="bruno-pastylka">
            {hypeStan === "laduje" ? t("Bruno is taking a breath...", "Bruno bierze oddech...") : hypeStan === "gra" ? t("Bruno is talking...", "Bruno mówi...") : t("Bruno, hype me up", "Bruno, nakręć mnie")}
          </button>
          {hypeStan === "blad" && <span className="text-xs text-red-700">{t("That didn't work. Try again in a moment.", "Nie udało się. Spróbuj za chwilę.")}</span>}
        </div>
      )}
      </div>
      {hypeTekst && krok !== "koniec" && <p className="text-center text-slate-800 italic max-w-xl mx-auto brg-hype">{cudzy(hypeTekst)}</p>}

      <div className="brg-uklad">
      {/* Pasek kroków */}
      {krok !== "koniec" && (
        <ol className="brg-kroki" aria-label={t("Steps", "Kroki")}>
          {KROKI.map((x, i) => (
            <li key={x.id} className={i === nr ? "brg-on" : i < nr ? "brg-done" : ""} aria-current={i === nr ? "step" : undefined}>
              <i>{i < nr ? "✓" : i + 1}</i>
              <span>{t(x.nazwa, x.nazwaPl)}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="brg-tresc">

      {krok === "zapal" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-6">
          <blockquote className="max-w-xl">
            <p className="bruno-h2 text-xl sm:text-2xl text-slate-900 leading-snug">{cudzy(cytat.tekst)}</p>
          </blockquote>
          {ostatnia && (
            <div className="brg-ostatnia">
              <div className="brg-ost-hd"><span>{t("From your last call with Bruno", "Z ostatniej rozmowy z Bruno")}</span><b>{ostatnia.ocena}/10</b></div>
              <div className="brg-ost-rz"><i>✓</i><div><small>{t("What worked", "Zagrało")}</small>{ostatnia.wygrana}</div></div>
              <div className="brg-ost-rz"><i>→</i><div><small>{t("Do this differently today", "Dziś zrób inaczej")}</small>{ostatnia.poprawka}</div></div>
            </div>
          )}
          <p className="text-slate-600">{t(`${imie ? `${imie}, y` : "Y"}ou have a real call coming up. Turn on the music, get hyped, and let's go: breathe, voice, mindset.`, `${imie ? `${imie}, m` : "M"}asz za chwilę prawdziwą rozmowę. Włącz muzykę, daj się nakręcić i lecimy: oddech, głos, głowa.`)}</p>
          <button type="button" onClick={() => idz("oddech")} className="bruno-przycisk text-base px-12 py-4">{t("Light the fire", "Zapal ogień")}</button>
        </div>
      )}

      {krok === "oddech" && !cwiczy && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-5 min-h-[26rem] justify-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">{INFO[tech].nr}</div>
          <h2 className="bruno-h2 text-2xl">{INFO[tech].tytul}</h2>
          <GrafikaOddechu tech={tech} postep={null} jezyk={jezyk} />
          <p className="text-slate-700 max-w-md">{INFO[tech].opis}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button type="button" onClick={() => setCwiczy(true)} className="bruno-przycisk text-base px-10 py-4">{t(`Start (${TECHNIKA_S[tech]} s)`, `Start (${TECHNIKA_S[tech]} s)`)}</button>
            <button type="button" onClick={() => (tech === "sigh" ? setTech("box") : idz("glos"))} className="bruno-przycisk-2">{t("Skip", "Pomiń")}</button>
          </div>
        </div>
      )}

      {krok === "oddech" && cwiczy && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-5 min-h-[26rem] justify-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">{INFO[tech].tytul} · {czas(Math.ceil(TECHNIKA_S[tech] - tOdd))}</div>
          <div className="relative size-40 sm:size-48 grid place-items-center">
            <div
              className="absolute inset-0 rounded-full blur-2xl transition-transform duration-[900ms] ease-in-out"
              style={{ transform: `scale(${f.skala})`, background: "radial-gradient(circle at 45% 40%, #f97316cc 0%, #ea580c 48%, #ea580c00 74%)" }}
              aria-hidden
            />
            <span className="relative bruno-h2 text-2xl text-white drop-shadow-[0_2px_12px_rgba(234,88,12,0.7)]" aria-live="polite">{f.tekst}</span>
          </div>
          <GrafikaOddechu tech={tech} postep={f.postep} jezyk={jezyk} />
          <button type="button" onClick={() => { setCwiczy(false); if (tech === "sigh") setTech("box"); else idz("glos"); }} className="bruno-przycisk-2">{t("Skip", "Pomiń")}</button>
        </div>
      )}

      {krok === "glos" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t("Voice", "Głos")} · {czas(GLOS_S - sek)}</div>
          <p className="text-slate-800">{jezyk === "pl" ? <>Wstań. 10 s mrucz „mmm”. Potem przeczytaj swoje pierwsze zdanie <b>3 razy na głos</b>, coraz wolniej.</> : <>Stand up. Hum “mmm” for 10 s. Then read your first line <b>out loud 3 times</b>, slower each time.</>}</p>
          <input id="zdanie" className="bruno-pole text-center text-lg" placeholder={t("Your first line on the call", "Twoje pierwsze zdanie w rozmowie")} value={zdanie} onChange={(e) => setZdanie(e.target.value)} maxLength={300} />
          <div className="text-sm text-slate-600 min-h-[3rem] max-w-xl">
            {rozpoznawanieJest ? (transkrypt ? `${t("I hear:", "Słyszę:")} ${cudzy(transkrypt)}` : t("Listening... (mic, Chrome)", "Słucham... (mikrofon, Chrome)")) : t("Your browser can't recognize speech, so I'm only tracking time. Chrome can do it.", "Przeglądarka nie rozpoznaje mowy, liczę tylko czas. Chrome to umie.")}
          </div>
          <button type="button" onClick={zakonczGlos} className="bruno-przycisk">{t("Done, next", "Gotowe, dalej")}</button>
        </div>
      )}

      {krok === "glowa" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 text-center">
          <blockquote className="max-w-xl">
            <p className="bruno-h2 text-xl text-slate-900 leading-snug">{cudzy(cytat.tekst)}</p>
          </blockquote>
          <p className="text-slate-700 max-w-lg">{t("Not “calm down.” Fear and excitement are the same heartbeat. Only the label is different. Say it out loud:", "Nie „uspokój się”. Strach i ekscytacja to to samo tętno, różni je tylko etykieta. Powiedz na głos:")}</p>
          <button type="button" onClick={() => setNakrecony(true)} aria-pressed={nakrecony} className={`${nakrecony ? "bruno-przycisk" : "bruno-przycisk-2"} text-xl px-10 py-5`}>
            {nakrecony ? t("✓ I'm fired up", "✓ Jestem nakręcony") : t("I'm fired up", "Jestem nakręcony")}
          </button>
          <label className="w-full max-w-lg text-left text-sm text-slate-700" htmlFor="najgorszy">
            {t("The worst that can happen", "Najgorsze, co może się stać")}
            <input id="najgorszy" className="bruno-pole mt-1" value={najgorszy} onChange={(e) => setNajgorszy(e.target.value)} maxLength={200} />
          </label>
          <button type="button" onClick={() => idz("rozmowa")} className="bruno-przycisk text-base px-10 py-4">{t("Calling", "Dzwonię")}</button>
        </div>
      )}

      {krok === "rozmowa" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6 text-center min-h-[24rem] justify-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t("Call in progress", "Rozmowa trwa")}</div>
          <div className="bruno-h1 text-5xl tabular-nums">{czas(sek)}</div>
          <div className="text-left text-sm text-slate-800 bg-white/70 border border-slate-200 rounded-2xl p-4 max-w-md w-full flex flex-col gap-1">
            {k.cel && <div><b>{t("Goal:", "Cel:")}</b> {k.cel}</div>}
            {k.pytanie && <div><b>Start:</b> {k.pytanie}</div>}
            {k.ob1 && <div><b>{ob(k.ob1)}:</b> {k.re1 || t("a question, not an argument", "pytanie, nie argument")}</div>}
            {k.ob2 && <div><b>{ob(k.ob2)}:</b> {k.re2 || t("a question, not an argument", "pytanie, nie argument")}</div>}
            {k.kwota && <div><b>{t("Price:", "Kwota:")}</b> {k.kwota}{t(", then silence", ", potem cisza")}</div>}
            {k.data && <div><b>{t("Date:", "Data:")}</b> {k.data}</div>}
          </div>
          <button type="button" onClick={zakonczRozmowe} className="bruno-przycisk-2">{t("Call ended", "Rozmowa skończona")}</button>
        </div>
      )}

      {krok === "koniec" && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
          <h2 className="bruno-h2 text-2xl">{t("Done. That's how it's done.", "Jest. Tak to się robi.")}</h2>
          <p className="text-slate-700">{t(`The call lasted ${czas(sek)}.`, `Rozmowa trwała ${czas(sek)}.`)}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button type="button" onClick={() => { setZapisId(null); setKrok("zapal"); }} className="bruno-przycisk">{t("Next call", "Następna rozmowa")}</button>
            <Link href="/bruno/trening" className="bruno-przycisk-2">{t("Drills", "Trening")}</Link>
            <Link href="/bruno/panel" className="bruno-przycisk-2">{t("Home", "Panel")}</Link>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
