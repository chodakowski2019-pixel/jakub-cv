"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Feedback, Wypowiedz } from "@/lib/bruno/db";
import { CELE, CELE_TRYBU, POSTACIE, TRYBY, type CelId, type PostacId, type TrybId } from "@/lib/bruno/postacie";
import FeedbackWidok from "./feedback";

// Rozmowa głosowa z Bruno przez OpenAI Realtime (WebRTC w przeglądarce).
//
// Przebieg (od 2.10, USER_001): kreator w 4 krokach na jednym ekranie
// (tryb → obiekcja → cel → typ klienta) → „Start" → odliczanie 3, 2, 1
// (w tym czasie łączymy się z OpenAI, więc odliczanie chowa opóźnienie)
// → rozmowa. Serwer sprawdza limit i wydaje klucz tymczasowy (/rozmowa/start),
// przeglądarka łączy się z OpenAI bezpośrednio (audio nie przechodzi przez
// Vercela), zbiera transkrypcję z kanału danych, nagrywa oba głosy do webm,
// po 3 minutach albo po „Zakończ" wgrywa nagranie do Supabase i wysyła
// transkrypcję do /rozmowa/koniec, skąd wraca feedback trenera.
// Transkrypcja NIE jest pokazywana w trakcie rozmowy (1.10).
// Gwar restauracji (tryb „na żywo") był syntezowany w WebAudio, ale wyłączony
// 2.10: z głośnika wracał do mikrofonu i przerywał Bruno (patrz niżej).

type Stan = "wybor" | "odliczanie" | "laczenie" | "trwa" | "konczenie" | "feedback" | "blad";

type Props = {
  postacDomyslna: PostacId;
  karta: { id: string; typ: string; tresc: string } | null;
  obiekcje: string[];
  rozmowyDzis: number;
  rozmowDziennie: number;
  minutZostalo: number;
  sekundRozmowy: number;
};

function czas(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Wyciąga z getStats to, co mówi o jakości dźwięku przychodzącego: pakiety, straty, jitter, bufor, RTT. */
async function zbierzStatyRtc(p: RTCPeerConnection | null): Promise<Record<string, unknown> | null> {
  if (!p) return null;
  const wynik: Record<string, unknown> = {};
  const stats = await p.getStats();
  stats.forEach((s) => {
    const r = s as unknown as Record<string, unknown>;
    if (r.type === "inbound-rtp" && r.kind === "audio") {
      Object.assign(wynik, {
        pakiety_odebrane: r.packetsReceived,
        pakiety_utracone: r.packetsLost,
        jitter_s: r.jitter,
        bufor_jittera_s: r.jitterBufferDelay,
        bufor_jittera_emisje: r.jitterBufferEmittedCount,
        ukrycia_strat: r.concealedSamples,
        probki_odebrane: r.totalSamplesReceived,
        audio_poziom: r.audioLevel,
      });
    }
    if (r.type === "outbound-rtp" && r.kind === "audio") Object.assign(wynik, { pakiety_wyslane: r.packetsSent });
    if (r.type === "candidate-pair" && r.state === "succeeded") Object.assign(wynik, { rtt_s: r.currentRoundTripTime, bitrate_in: r.availableIncomingBitrate });
  });
  return wynik;
}

function IkonaTrybu({ nazwa }: { nazwa: string }) {
  const w = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (nazwa === "telefon") return <svg {...w}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
  if (nazwa === "stolik") return <svg {...w}><path d="M3 9h18M12 9v11M7 20h10M5 9l1-4h12l1 4" /></svg>;
  return <svg {...w}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></svg>;
}

/** Gwar restauracji z WebAudio: filtrowany szum + wolna fala głośności + rzadkie „brzęknięcia". Zero plików, zero praw. */
function startGwar(): { stop: () => void } {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const c = new AC();
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  master.gain.linearRampToValueAtTime(0.12, c.currentTime + 2);

  // szum brązowy (niskie, "sala pełna ludzi")
  const dl = 2 * c.sampleRate;
  const buf = c.createBuffer(1, dl, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < dl; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  const szum = c.createBufferSource();
  szum.buffer = buf;
  szum.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "bandpass";
  lp.frequency.value = 420;
  lp.Q.value = 0.6;
  const gSzum = c.createGain();
  gSzum.gain.value = 0.9;
  szum.connect(lp).connect(gSzum).connect(master);
  szum.start();

  // fala głośności (rozmowy falują)
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoG = c.createGain();
  lfoG.gain.value = 0.3;
  lfo.connect(lfoG).connect(gSzum.gain);
  lfo.start();

  // rzadkie brzęknięcia sztućców / szkła
  let zywy = true;
  const brzek = () => {
    if (!zywy) return;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = 1800 + Math.random() * 2600;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25 + Math.random() * 0.3);
    o.connect(g).connect(master);
    o.start();
    o.stop(c.currentTime + 0.7);
    setTimeout(brzek, 2500 + Math.random() * 7000);
  };
  setTimeout(brzek, 1500);

  return {
    stop: () => {
      zywy = false;
      try {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
        setTimeout(() => void c.close(), 800);
      } catch {}
    },
  };
}

export default function Rozmowa({ postacDomyslna, karta, obiekcje, rozmowyDzis, rozmowDziennie, minutZostalo, sekundRozmowy }: Props) {
  const [tryb, setTryb] = useState<TrybId>("cold");
  // Kilka obiekcji naraz (USER_001 2.10). "__losowa__" i pusta lista są wyłączne.
  const [wybraneObiekcje, setWybraneObiekcje] = useState<string[]>(karta?.typ === "obiekcja" ? [karta.tresc] : obiekcje.length ? ["__losowa__"] : []);
  const losowa = wybraneObiekcje.includes("__losowa__");
  const bezKonkretnej = wybraneObiekcje.length === 0;
  const przelaczObiekcje = (o: string) =>
    setWybraneObiekcje((w) => (w.includes(o) ? w.filter((x) => x !== o) : [...w.filter((x) => x !== "__losowa__"), o]));
  const [cel, setCel] = useState<CelId>("spotkanie");
  const [celWlasny, setCelWlasny] = useState("");
  const [postac, setPostac] = useState<PostacId>(postacDomyslna);

  const [stan, setStan] = useState<Stan>("wybor");
  const [odliczanie, setOdliczanie] = useState(3);
  const [blad, setBlad] = useState<string | null>(null);
  const [sekundy, setSekundy] = useState(0);
  const [limit, setLimit] = useState(sekundRozmowy);
  const [mowi, setMowi] = useState<"bruno" | "ty" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [etap, setEtap] = useState<string>("");

  // Id rozmowy w ref, nie tylko w stanie: timer odcięcia powstaje w zamknięciu
  // z pierwszego renderu (błąd „Brak id rozmowy" 1.10).
  const rozmowaIdRef = useRef<string | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const dc = useRef<RTCDataChannel | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const kawalki = useRef<Blob[]>([]);
  const ctx = useRef<AudioContext | null>(null);
  const gwar = useRef<{ stop: () => void } | null>(null);
  const transkrypcja = useRef<Wypowiedz[]>([]);
  const start = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const konczenie = useRef(false);
  const zdalny = useRef<MediaStream | null>(null);
  // Diagnostyka jakości (2.10): statystyki WebRTC z końca rozmowy + błędy z kanału danych, lecą do metryki.rtc.
  const bledyRealtime = useRef<string[]>([]);
  // Sesja ElevenLabs (2.10): SDK sam obsługuje mikrofon i odtwarzanie. Null = ścieżka OpenAI.
  const el = useRef<{ endSession: () => Promise<void>; getId: () => string; sendContextualUpdate: (t: string) => void } | null>(null);
  const statyRtc = useRef<Record<string, unknown> | null>(null);
  const limitRef = useRef(sekundRozmowy);
  // Start rozmowy = kanał otwarty I odliczanie skończone. Oba warunki w refach.
  const kanalOtwarty = useRef(false);
  const odliczono = useRef(false);
  const wystartowano = useRef(false);

  const planZrobiony = rozmowyDzis >= rozmowDziennie;
  const brakMinut = minutZostalo < 1;

  const dodaj = (w: Wypowiedz) => {
    transkrypcja.current.push(w);
  };

  const posprzataj = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (el.current) {
      const sesja = el.current;
      el.current = null;
      sesja.endSession().catch(() => {});
    }
    try {
      dc.current?.close();
    } catch {}
    try {
      pc.current?.close();
    } catch {}
    mic.current?.getTracks().forEach((t) => t.stop());
    try {
      ctx.current?.close();
    } catch {}
    gwar.current?.stop();
    gwar.current = null;
    dc.current = null;
    pc.current = null;
    mic.current = null;
    ctx.current = null;
  };

  useEffect(() => () => posprzataj(), []);

  useEffect(() => {
    if (stan !== "trwa") return;
    const ostrzez = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", ostrzez);
    return () => window.removeEventListener("beforeunload", ostrzez);
  }, [stan]);

  const zacznijNagrywanie = () => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const c = new AC();
      ctx.current = c;
      const cel = c.createMediaStreamDestination();
      if (mic.current) c.createMediaStreamSource(mic.current).connect(cel);
      // Klon ścieżki: ta sama ścieżka w <audio> i w WebAudio potrafi w Chrome
      // dawać porwany dźwięk (2.10: „Bruno się zacina"). Nagrywamy z klonu.
      if (zdalny.current) c.createMediaStreamSource(new MediaStream(zdalny.current.getAudioTracks().map((t) => t.clone()))).connect(cel);
      const typ = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const r = new MediaRecorder(cel.stream, { mimeType: typ, audioBitsPerSecond: 48_000 });
      kawalki.current = [];
      r.ondataavailable = (e) => {
        if (e.data.size > 0) kawalki.current.push(e.data);
      };
      r.start(2000);
      rec.current = r;
    } catch (e) {
      console.warn("nagrywanie niedostępne", e);
    }
  };

  const zatrzymajNagrywanie = () =>
    new Promise<Blob | null>((resolve) => {
      const r = rec.current;
      if (!r || r.state === "inactive") return resolve(kawalki.current.length ? new Blob(kawalki.current, { type: "audio/webm" }) : null);
      r.onstop = () => resolve(kawalki.current.length ? new Blob(kawalki.current, { type: "audio/webm" }) : null);
      r.stop();
    });

  const zakoncz = async (powod: "recznie" | "limit") => {
    if (konczenie.current) return;
    konczenie.current = true;
    setStan("konczenie");
    setEtap(powod === "limit" ? "Czas minął. Kończę rozmowę..." : "Kończę rozmowę...");
    const trwalo = Math.round((Date.now() - start.current) / 1000);
    try {
      statyRtc.current = await zbierzStatyRtc(pc.current);
    } catch {}
    const elId = el.current ? el.current.getId() : null;
    const nagranie = el.current ? null : await zatrzymajNagrywanie();
    posprzataj();

    const rozmowaId = rozmowaIdRef.current;
    let sciezka: string | null = null;
    if (nagranie && rozmowaId && nagranie.size > 1000) {
      try {
        setEtap("Zapisuję nagranie...");
        const res = await fetch("/api/bruno/rozmowa/nagranie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rozmowa_id: rozmowaId, rozmiar: nagranie.size }),
        });
        const odp = await res.json();
        if (res.ok && odp.signedUrl) {
          const put = await fetch(odp.signedUrl, { method: "PUT", headers: { "Content-Type": "audio/webm" }, body: nagranie });
          if (put.ok) sciezka = odp.sciezka;
        }
      } catch (e) {
        console.warn("upload nagrania", e);
      }
    }

    setEtap("Bruno-trener ocenia rozmowę (do 30 s)...");
    try {
      const res = await fetch("/api/bruno/rozmowa/koniec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rozmowa_id: rozmowaId,
          transkrypcja: transkrypcja.current,
          sekundy: trwalo,
          nagranie_sciezka: sciezka,
          el_conversation_id: elId,
          rtc: { ...(statyRtc.current ?? {}), bledy: bledyRealtime.current.slice(0, 20), sluchawki: null, przegladarka: navigator.userAgent.slice(0, 120) },
        }),
      });
      const odp = await res.json();
      if (!res.ok) throw new Error(odp.blad ?? "błąd");
      if (odp.przerwana) {
        setBlad("Rozmowa była za krótka, żeby ją ocenić (poniżej 20 s albo prawie nic nie powiedziałeś). Nie liczy się do planu dnia.");
        setStan("blad");
        return;
      }
      if (!odp.feedback) {
        setBlad(odp.blad ?? "Trener nie odpowiedział. Rozmowa jest w historii.");
        setStan("blad");
        return;
      }
      setFeedback(odp.feedback);
      setStan("feedback");
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się zapisać rozmowy.");
      setStan("blad");
    }
  };

  /** Rusza, gdy kanał danych jest otwarty I odliczanie dobiegło końca. */
  const sprobujWystartowac = () => {
    if (wystartowano.current || !kanalOtwarty.current || !odliczono.current || !dc.current) return;
    wystartowano.current = true;
    dc.current.send(JSON.stringify({ type: "response.create" }));
    start.current = Date.now();
    setSekundy(0);
    setStan("trwa");
    setEtap("");
    zacznijNagrywanie();
    // Gwar restauracji WYŁĄCZONY (USER_001 2.10): leciał z głośnika, mikrofon go
    // łapał, a Bruno ma interrupt_response, więc urywał się co 2 s. Funkcja
    // startGwar zostaje w kodzie na wersję ze słuchawkami / wykrywaniem słuchawek.
    let ostrzezonoBruno = false;
    timer.current = setInterval(() => {
      const s = Math.round((Date.now() - start.current) / 1000);
      setSekundy(s);
      // 30 s przed końcem Bruno dostaje cichą instrukcję, żeby zmierzał do końca (2.10: odcięcie w pół zdania).
      if (!ostrzezonoBruno && limitRef.current - s <= 30 && dc.current?.readyState === "open") {
        ostrzezonoBruno = true;
        try {
          dc.current.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: { type: "message", role: "system", content: [{ type: "input_text", text: "[Zostało 30 sekund rozmowy. Odpowiadaj już bardzo krótko i zmierzaj do zakończenia: decyzja albo pożegnanie.]" }] },
            }),
          );
        } catch {}
      }
      if (s >= limitRef.current) void zakoncz("limit");
    }, 500);
  };

  const odliczaj = () => {
    setStan("odliczanie");
    setOdliczanie(3);
    odliczono.current = false;
    let n = 3;
    const t = setInterval(() => {
      n -= 1;
      setOdliczanie(n);
      if (n <= 0) {
        clearInterval(t);
        odliczono.current = true;
        sprobujWystartowac();
      }
    }, 1000);
  };

  /** Ścieżka ElevenLabs Agents (2.10): polskie głosy, SDK obsługuje mikrofon, odtwarzanie i przerywanie. */
  const startElevenlabs = async (dane: { token: string; prompt: string; pierwsza_wypowiedz: string; glos: string }) => {
    setEtap("Łączę z Bruno...");
    // SDK bierze własny mikrofon: zwalniamy nasz, żeby nie było podwójnego nagrywania.
    mic.current?.getTracks().forEach((t) => t.stop());
    mic.current = null;
    // Pierwsza wypowiedź Bruno gra od razu po połączeniu, więc czekamy na koniec odliczania.
    while (!odliczono.current) await new Promise((r) => setTimeout(r, 100));
    if (konczenie.current) return;
    try {
      const { Conversation } = await import("@elevenlabs/client");
      const sesja = await Conversation.startSession({
        conversationToken: dane.token,
        connectionType: "webrtc",
        overrides: {
          agent: { prompt: { prompt: dane.prompt }, firstMessage: dane.pierwsza_wypowiedz, language: "pl" },
          tts: { voiceId: dane.glos },
        },
        onConnect: () => {
          if (wystartowano.current) return;
          wystartowano.current = true;
          start.current = Date.now();
          setSekundy(0);
          setStan("trwa");
          setEtap("");
          let ostrzezonoBruno = false;
          timer.current = setInterval(() => {
            const s = Math.round((Date.now() - start.current) / 1000);
            setSekundy(s);
            if (!ostrzezonoBruno && limitRef.current - s <= 30 && el.current) {
              ostrzezonoBruno = true;
              try {
                el.current.sendContextualUpdate("Zostało 30 sekund rozmowy. Odpowiadaj już bardzo krótko i zmierzaj do zakończenia: decyzja albo pożegnanie.");
              } catch {}
            }
            if (s >= limitRef.current) void zakoncz("limit");
          }, 500);
        },
        onMessage: ({ message, role }) => {
          const t = Math.max(0, Math.round((Date.now() - start.current) / 1000));
          if (message?.trim()) dodaj({ rola: role === "agent" ? "klient" : "handlowiec", tekst: message.trim(), t });
        },
        onModeChange: ({ mode }) => setMowi(mode === "speaking" ? "bruno" : null),
        onError: (msg) => {
          console.error("elevenlabs", msg);
          bledyRealtime.current.push(String(msg).slice(0, 300));
        },
        onDisconnect: (d) => {
          bledyRealtime.current.push(`disconnect: ${JSON.stringify(d).slice(0, 200)}`);
          // Rozłączenie z zewnątrz (limit agenta, sieć): kończymy jak „Zakończ", żeby nie stracić transkrypcji.
          if (!konczenie.current && wystartowano.current) void zakoncz("recznie");
        },
      });
      el.current = sesja;
    } catch (e) {
      posprzataj();
      setBlad(e instanceof Error ? e.message : "Nie udało się połączyć z ElevenLabs.");
      setStan("blad");
    }
  };

  const zacznij = async () => {
    setBlad(null);
    konczenie.current = false;
    rozmowaIdRef.current = null;
    kanalOtwarty.current = false;
    odliczono.current = false;
    wystartowano.current = false;
    transkrypcja.current = [];
    setEtap("Proszę o mikrofon...");
    try {
      mic.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      setBlad("Bez mikrofonu nie da się rozmawiać. Zezwól na mikrofon w przeglądarce i spróbuj ponownie.");
      setStan("blad");
      return;
    }

    // Mikrofon jest, więc odliczamy, a równolegle łączymy.
    odliczaj();

    setEtap("Sprawdzam limit i budzę Bruno...");
    let dane: { dostawca?: "openai" | "elevenlabs"; rozmowa_id: string; klucz: string; model: string; sekundy: number; token?: string; prompt?: string; pierwsza_wypowiedz?: string; glos?: string };
    try {
      const res = await fetch("/api/bruno/rozmowa/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postac, tryb, cel, cel_wlasny: celWlasny, obiekcje: wybraneObiekcje, karta_id: karta?.typ === "kryterium" ? karta.id : null }),
      });
      const odp = await res.json();
      if (!res.ok) throw new Error(odp.blad ?? "Nie udało się zacząć.");
      dane = odp;
    } catch (e) {
      posprzataj();
      setBlad(e instanceof Error ? e.message : "Nie udało się zacząć.");
      setStan("blad");
      return;
    }
    rozmowaIdRef.current = dane.rozmowa_id;
    limitRef.current = dane.sekundy;
    setLimit(dane.sekundy);

    if (dane.dostawca === "elevenlabs") {
      await startElevenlabs(dane as { token: string; prompt: string; pierwsza_wypowiedz: string; glos: string });
      return;
    }

    setEtap("Łączę...");
    try {
      const p = new RTCPeerConnection();
      pc.current = p;
      p.ontrack = (e) => {
        zdalny.current = e.streams[0];
        // Większy bufor jittera (250 ms) wygładza porwany dźwięk na słabszym łączu.
        try {
          (e.receiver as RTCRtpReceiver & { jitterBufferTarget?: number }).jitterBufferTarget = 250;
        } catch {}
        if (audioEl.current) {
          audioEl.current.srcObject = e.streams[0];
          audioEl.current.play().catch(() => {});
        }
      };
      mic.current.getTracks().forEach((t) => p.addTrack(t, mic.current!));
      const kanal = p.createDataChannel("oai-events");
      dc.current = kanal;

      kanal.addEventListener("open", () => {
        kanalOtwarty.current = true;
        sprobujWystartowac();
      });

      kanal.addEventListener("message", (e) => {
        let ev: { type: string; transcript?: string; delta?: string };
        try {
          ev = JSON.parse(e.data);
        } catch {
          return;
        }
        const t = Math.max(0, Math.round((Date.now() - start.current) / 1000));
        switch (ev.type) {
          case "input_audio_buffer.speech_started":
            setMowi("ty");
            break;
          case "input_audio_buffer.speech_stopped":
            setMowi(null);
            break;
          case "response.output_audio.delta":
          case "response.audio.delta":
            setMowi("bruno");
            break;
          case "response.done":
            setMowi(null);
            break;
          case "conversation.item.input_audio_transcription.completed":
            if (ev.transcript?.trim()) dodaj({ rola: "handlowiec", tekst: ev.transcript.trim(), t: Math.max(0, t - 3) });
            break;
          case "response.output_audio_transcript.done":
          case "response.audio_transcript.done":
            if (ev.transcript?.trim()) dodaj({ rola: "klient", tekst: ev.transcript.trim(), t });
            break;
          case "error":
            console.error("realtime error", ev);
            bledyRealtime.current.push(JSON.stringify(ev).slice(0, 300));
            break;
        }
      });

      const oferta = await p.createOffer();
      await p.setLocalDescription(oferta);
      const odp = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(dane.model)}`, {
        method: "POST",
        body: oferta.sdp,
        headers: { Authorization: `Bearer ${dane.klucz}`, "Content-Type": "application/sdp" },
      });
      if (!odp.ok) throw new Error(`OpenAI odrzuciło połączenie (${odp.status}).`);
      const sdp = await odp.text();
      await p.setRemoteDescription({ type: "answer", sdp });
    } catch (e) {
      posprzataj();
      setBlad(e instanceof Error ? e.message : "Nie udało się połączyć.");
      setStan("blad");
    }
  };

  const zostalo = Math.max(0, limit - sekundy);
  const ostrzezenie = stan === "trwa" && zostalo <= 15;
  const gotowy = Boolean(tryb && postac && cel && (cel !== "wlasny" || celWlasny.trim().length >= 3));
  const p = POSTACIE[postac];

  if (stan === "feedback" && feedback) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="bruno-h1 text-2xl sm:text-3xl text-center">Feedback od Bruno</h1>
        <FeedbackWidok feedback={feedback} dalej />
      </div>
    );
  }

  // Bez active:scale i bez zmian rozmiaru: wybór nie może przesuwać reszty kreatora (USER_001 2.10).
  const kafelek = (wybrany: boolean, extra = "") =>
    `bruno-szklo rounded-2xl p-4 text-left h-full transition-[border-color,box-shadow] duration-100 ${wybrany ? "bruno-wybrany" : "hover:border-slate-300"} ${extra}`;

  return (
    <div className={`flex flex-col ${stan === "wybor" ? "gap-9 sm:gap-11" : "gap-6"}`}>
      <audio ref={audioEl} autoPlay playsInline className="hidden" />

      {stan === "wybor" && (
        <>
          <div className="text-center">
            <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">Rozmowa z <span className="bruno-gradient-tekst">Bruno</span></h1>
            <p className="text-slate-600 mt-2">{sekundRozmowy / 60} minuty. Ustaw rozmowę i naciśnij Start.</p>
          </div>

          {karta?.typ === "kryterium" && (
            <div className="bruno-szklo rounded-2xl p-4 text-sm text-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wide text-cyan-800 mr-2">Powtórka umiejętności</span>
              Nacisk na: <b>{karta.tresc}</b>
            </div>
          )}

          {/* 1. Tryb */}
          <fieldset>
            <legend className="bruno-h2 text-base mb-2"><span className="bruno-gradient-tekst mr-1.5">1.</span>Rodzaj rozmowy</legend>
            <div className="grid sm:grid-cols-3 gap-3 auto-rows-fr">
              {(Object.keys(TRYBY) as TrybId[]).map((id) => {
                const t = TRYBY[id];
                const wybrany = tryb === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={wybrany}
                    onClick={() => {
                      setTryb(id);
                      if (!CELE_TRYBU[id].includes(cel)) setCel(CELE_TRYBU[id][0]);
                    }}
                    className={kafelek(wybrany, "min-h-[9.5rem]")}
                  >
                    <div className={`mb-2 ${wybrany ? "text-cyan-800" : "text-slate-500"}`}><IkonaTrybu nazwa={t.ikona} /></div>
                    <div className="bruno-h2 text-base">{t.nazwa}</div>
                    <div className="text-sm text-slate-600 mt-1">{t.opis}</div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 2. Obiekcja */}
          <fieldset>
            <legend className="bruno-h2 text-base mb-2"><span className="bruno-gradient-tekst mr-1.5">2.</span>Jakie obiekcje chcesz przetrenować <span className="text-xs font-normal text-slate-400">(możesz zaznaczyć kilka)</span></legend>
            {obiekcje.length === 0 ? (
              <p className="text-sm text-slate-600 bruno-szklo rounded-2xl p-4">
                Nie masz jeszcze listy obiekcji. <Link href="/bruno/dostosuj" className="underline">Dodaj je w „Dostosuj Bruno”</Link>, a Bruno użyje typowych dla Twojego klienta.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={losowa} onClick={() => setWybraneObiekcje(["__losowa__"])} className={`bruno-pastylka ${losowa ? "bruno-pastylka-wybrana" : ""}`}>Losowa</button>
                <button type="button" aria-pressed={bezKonkretnej} onClick={() => setWybraneObiekcje([])} className={`bruno-pastylka ${bezKonkretnej ? "bruno-pastylka-wybrana" : ""}`}>Bez konkretnej</button>
                {obiekcje.map((o) => {
                  const w = wybraneObiekcje.includes(o);
                  return (
                    <button key={o} type="button" aria-pressed={w} onClick={() => przelaczObiekcje(o)} className={`bruno-pastylka ${w ? "bruno-pastylka-wybrana" : ""}`}>
                      {w && <span className="mr-1" aria-hidden>✓</span>}„{o}”
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {/* 3. Cel */}
          <fieldset>
            <legend className="bruno-h2 text-base mb-2"><span className="bruno-gradient-tekst mr-1.5">3.</span>Cel rozmowy</legend>
            {/* Lista celów zależy od trybu; stała wysokość siatki, żeby zmiana trybu nie przesuwała kroku 4. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 auto-rows-fr min-h-[11rem] sm:min-h-[8.5rem]">
              {CELE_TRYBU[tryb].map((id) => {
                const c = CELE[id];
                const wybrany = cel === id;
                return (
                  <button key={id} type="button" aria-pressed={wybrany} onClick={() => setCel(id)} className={kafelek(wybrany, "p-3")}>
                    <div className="font-semibold text-sm text-slate-900">{c.nazwa}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.opis}</div>
                  </button>
                );
              })}
            </div>
            {cel === "wlasny" && (
              <input className="bruno-pole mt-3" placeholder="np. klient zgadza się na audyt w przyszłym tygodniu" value={celWlasny} onChange={(e) => setCelWlasny(e.target.value)} maxLength={300} autoFocus />
            )}
          </fieldset>

          {/* 4. Typ klienta */}
          <fieldset>
            <legend className="bruno-h2 text-base mb-2"><span className="bruno-gradient-tekst mr-1.5">4.</span>Typ klienta</legend>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
              {(Object.keys(POSTACIE) as PostacId[]).map((id) => {
                const k = POSTACIE[id];
                const wybrany = postac === id;
                return (
                  <button key={id} type="button" aria-pressed={wybrany} onClick={() => setPostac(id)} className={kafelek(wybrany)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="size-3.5 rounded-full shrink-0" style={{ background: k.kolor }} aria-hidden />
                      <div className="bruno-h2 text-base">{k.nazwa}</div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: `${k.kolor}1a`, color: k.kolor }}>{k.krotko}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{k.opis}</div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {planZrobiony ? (
            <p className="text-center text-slate-600">Plan na dziś zrobiony ({rozmowDziennie} rozmowy). Wróć jutro.</p>
          ) : brakMinut ? (
            <p className="text-center text-slate-600">Limit minut testu wyczerpany. <Link href="/bruno/odblokuj" className="underline">Odblokuj pełen dostęp</Link>.</p>
          ) : (
            <div className="text-center">
              <button type="button" onClick={zacznij} disabled={!gotowy} className="bruno-przycisk text-base px-12 py-4">Start</button>
            </div>
          )}
        </>
      )}

      {(stan === "odliczanie" || stan === "laczenie" || stan === "trwa" || stan === "konczenie") && (
        <div className="bruno-szklo relative rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-6 min-h-[28rem] justify-center">
          {stan === "trwa" && (
            <div
              className={`absolute top-4 right-4 sm:top-5 sm:right-5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors ${
                ostrzezenie ? "bg-red-600 text-white bruno-zegar-alarm" : "bg-white/70 text-slate-700 border border-slate-200/80"
              }`}
              aria-live={ostrzezenie ? "assertive" : "off"}
            >
              {czas(zostalo)}
            </div>
          )}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex items-center gap-2 text-xs text-slate-500">
            <span className="size-2.5 rounded-full" style={{ background: p.kolor }} aria-hidden />
            {TRYBY[tryb].nazwa}
          </div>

          <div className="relative size-44 sm:size-56 grid place-items-center" aria-hidden={stan !== "odliczanie"}>
            <div
              className={`bruno-kula absolute inset-0 rounded-full blur-2xl transition-transform duration-200 ${
                stan !== "trwa" ? "bruno-kula-czeka" : mowi === "bruno" ? "bruno-kula-mowi" : mowi === "ty" ? "scale-90" : ""
              }`}
              style={{ background: "radial-gradient(circle at 45% 40%, #67e8f9 0%, #0e7490 48%, rgba(14,116,144,0) 74%)" }}
            />
            {stan === "odliczanie" && (
              <span key={odliczanie} className="relative bruno-h2 text-7xl text-white drop-shadow-[0_2px_12px_rgba(14,116,144,0.7)] bruno-odliczanie" aria-live="assertive">
                {odliczanie > 0 ? odliczanie : "Start"}
              </span>
            )}
          </div>

          <div>
            <div className="bruno-h2 text-xl">Klient {p.nazwa.toLowerCase()}{!losowa && wybraneObiekcje.length > 0 ? <span className="block text-sm font-normal text-slate-500 mt-1">{wybraneObiekcje.length === 1 ? "obiekcja" : "obiekcje"}: {wybraneObiekcje.map((o) => `„${o}”`).join(", ")}</span> : null}</div>
            <div className="text-sm mt-1 text-slate-600">
              {stan === "trwa" ? (mowi === "bruno" ? "Bruno mówi" : mowi === "ty" ? "Słucha Cię" : "Rozmowa trwa") : stan === "odliczanie" ? (tryb === "cold" ? "Za chwilę Bruno odbierze telefon." : "Za chwilę Bruno zacznie rozmowę.") : etap}
            </div>
          </div>

          {stan === "trwa" && (
            <button type="button" onClick={() => zakoncz("recznie")} className="bruno-przycisk-2">Zakończ rozmowę</button>
          )}
        </div>
      )}

      {stan === "blad" && (
        <div className="bruno-szklo rounded-3xl p-8 text-center flex flex-col gap-4 items-center">
          <p className="text-slate-800">{blad}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setStan("wybor"); setBlad(null); }} className="bruno-przycisk">Spróbuj ponownie</button>
            <Link href="/bruno/panel" className="bruno-przycisk-2">Panel</Link>
          </div>
        </div>
      )}
    </div>
  );
}
