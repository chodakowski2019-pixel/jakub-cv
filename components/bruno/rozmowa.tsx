"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Feedback, Wypowiedz } from "@/lib/bruno/db";
import { POSTACIE, type PostacId } from "@/lib/bruno/postacie";
import FeedbackWidok from "./feedback";

// Rozmowa głosowa z Bruno przez OpenAI Realtime (WebRTC w przeglądarce).
//
// Przebieg: serwer sprawdza limit i wydaje klucz tymczasowy (/rozmowa/start),
// przeglądarka łączy się z OpenAI bezpośrednio (audio nie przechodzi przez
// Vercela), zbiera transkrypcję z kanału danych, nagrywa oba głosy do webm,
// po 5 minutach albo po „Zakończ" wgrywa nagranie do Supabase i wysyła
// transkrypcję do /rozmowa/koniec, skąd wraca feedback trenera.

type Stan = "wybor" | "laczenie" | "trwa" | "konczenie" | "feedback" | "blad";

type Props = {
  postacDomyslna: PostacId;
  karta: { id: string; typ: string; tresc: string } | null;
  rozmowyDzis: number;
  rozmowDziennie: number;
  minutZostalo: number;
};

function czas(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function Rozmowa({ postacDomyslna, karta, rozmowyDzis, rozmowDziennie, minutZostalo }: Props) {
  const [postac, setPostac] = useState<PostacId>(postacDomyslna);
  const [stan, setStan] = useState<Stan>("wybor");
  const [blad, setBlad] = useState<string | null>(null);
  const [sekundy, setSekundy] = useState(0);
  const [limit, setLimit] = useState(300);
  const [ostatnie, setOstatnie] = useState<Wypowiedz[]>([]);
  const [mowi, setMowi] = useState<"bruno" | "ty" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [rozmowaId, setRozmowaId] = useState<string | null>(null);
  const [etap, setEtap] = useState<string>("");

  const pc = useRef<RTCPeerConnection | null>(null);
  const dc = useRef<RTCDataChannel | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const kawalki = useRef<Blob[]>([]);
  const ctx = useRef<AudioContext | null>(null);
  const transkrypcja = useRef<Wypowiedz[]>([]);
  const start = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const konczenie = useRef(false);
  const zdalny = useRef<MediaStream | null>(null);

  const planZrobiony = rozmowyDzis >= rozmowDziennie;
  const brakMinut = minutZostalo < 1;

  const dodaj = (w: Wypowiedz) => {
    transkrypcja.current.push(w);
    setOstatnie((o) => [...o.slice(-3), w]);
  };

  const posprzataj = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
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
      if (zdalny.current) c.createMediaStreamSource(zdalny.current).connect(cel);
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
    const nagranie = await zatrzymajNagrywanie();
    posprzataj();

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
        body: JSON.stringify({ rozmowa_id: rozmowaId, transkrypcja: transkrypcja.current, sekundy: trwalo, nagranie_sciezka: sciezka }),
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

  const zacznij = async () => {
    setBlad(null);
    konczenie.current = false;
    transkrypcja.current = [];
    setOstatnie([]);
    setStan("laczenie");
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

    setEtap("Sprawdzam limit i budzę Bruno...");
    let dane: { rozmowa_id: string; klucz: string; model: string; sekundy: number };
    try {
      const res = await fetch("/api/bruno/rozmowa/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postac, karta_id: karta?.id ?? null }),
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
    setRozmowaId(dane.rozmowa_id);
    setLimit(dane.sekundy);

    setEtap("Łączę...");
    try {
      const p = new RTCPeerConnection();
      pc.current = p;
      p.ontrack = (e) => {
        zdalny.current = e.streams[0];
        if (audioEl.current) {
          audioEl.current.srcObject = e.streams[0];
          audioEl.current.play().catch(() => {});
        }
      };
      mic.current.getTracks().forEach((t) => p.addTrack(t, mic.current!));
      const kanal = p.createDataChannel("oai-events");
      dc.current = kanal;

      kanal.addEventListener("open", () => {
        // Bruno odbiera telefon pierwszy: jedno krótkie zdanie.
        kanal.send(JSON.stringify({ type: "response.create" }));
        start.current = Date.now();
        setSekundy(0);
        setStan("trwa");
        setEtap("");
        zacznijNagrywanie();
        timer.current = setInterval(() => {
          const s = Math.round((Date.now() - start.current) / 1000);
          setSekundy(s);
          if (s >= dane.sekundy) void zakoncz("limit");
        }, 500);
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
  const ostrzezenie = stan === "trwa" && zostalo <= 30;

  if (stan === "feedback" && feedback) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="bruno-h1 text-2xl sm:text-3xl text-center">Feedback od Bruno</h1>
        <FeedbackWidok feedback={feedback} dalej />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <audio ref={audioEl} autoPlay playsInline className="hidden" />

      {stan === "wybor" && (
        <>
          <div className="text-center">
            <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">Rozmowa z <span className="bruno-gradient-tekst">Bruno</span></h1>
            <p className="text-slate-600 mt-2">5 minut. Bruno odbiera telefon, Ty sprzedajesz. Mów jak do prawdziwego klienta.</p>
          </div>

          {karta && (
            <div className="bruno-szklo rounded-2xl p-4 text-sm text-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wide text-cyan-800 mr-2">Powtórka</span>
              {karta.typ === "obiekcja" ? <>Bruno na pewno powie: <b>„{karta.tresc}”</b></> : <>Nacisk na: <b>{karta.tresc}</b></>}
            </div>
          )}

          <fieldset className="grid sm:grid-cols-2 gap-3">
            <legend className="bruno-etykieta mb-2">Wybierz postać</legend>
            {(Object.keys(POSTACIE) as PostacId[]).map((id) => {
              const p = POSTACIE[id];
              const wybrany = postac === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={wybrany}
                  onClick={() => setPostac(id)}
                  className={`bruno-szklo rounded-2xl p-4 text-left transition-[transform,border-color] duration-100 active:scale-[0.98] ${wybrany ? "border-cyan-700/60 ring-2 ring-cyan-700/20" : ""}`}
                >
                  <div className="bruno-h2 text-base">{p.nazwa}</div>
                  <div className="text-sm text-slate-600 mt-1">{p.opis}</div>
                </button>
              );
            })}
          </fieldset>

          {planZrobiony ? (
            <p className="text-center text-slate-600">Plan na dziś zrobiony ({rozmowDziennie} rozmowy). Wróć jutro.</p>
          ) : brakMinut ? (
            <p className="text-center text-slate-600">Limit minut testu wyczerpany. <Link href="/bruno/odblokuj" className="underline">Odblokuj pełen dostęp</Link>.</p>
          ) : (
            <div className="text-center">
              <button type="button" onClick={zacznij} className="bruno-przycisk text-base px-10 py-4">Zadzwoń do Bruno</button>
              <p className="text-xs text-slate-400 mt-3">Rozmowa jest nagrywana i transkrybowana, żeby trener mógł ją ocenić. Dziś: {rozmowyDzis}/{rozmowDziennie}.</p>
            </div>
          )}
        </>
      )}

      {(stan === "laczenie" || stan === "trwa" || stan === "konczenie") && (
        <div className="bruno-szklo rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center gap-5">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <span className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-600/40 to-teal-600/40 ${mowi === "bruno" ? "bruno-puls" : ""}`} aria-hidden />
            <span className={`absolute inset-3 rounded-full bg-gradient-to-br from-cyan-700 to-teal-700 transition-transform duration-150 ${mowi === "ty" ? "scale-95" : ""}`} aria-hidden />
            <span className="relative text-white bruno-h2 text-3xl tabular-nums">{stan === "trwa" ? czas(zostalo) : "…"}</span>
          </div>
          <div>
            <div className="bruno-h2 text-xl">{POSTACIE[postac].nazwa}</div>
            <div className={`text-sm mt-1 ${ostrzezenie ? "text-amber-700 font-semibold" : "text-slate-600"}`}>
              {stan === "trwa" ? (ostrzezenie ? "Zostało pół minuty. Domykaj." : mowi === "bruno" ? "Bruno mówi" : mowi === "ty" ? "Słucha Cię" : "Rozmowa trwa") : etap}
            </div>
          </div>

          {ostatnie.length > 0 && (
            <ul className="w-full max-w-md text-left text-sm flex flex-col gap-1.5" aria-live="polite">
              {ostatnie.map((w, i) => (
                <li key={i} className={`${w.rola === "klient" ? "text-slate-800" : "text-cyan-900"}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mr-2">{w.rola === "klient" ? "Bruno" : "Ty"}</span>
                  {w.tekst}
                </li>
              ))}
            </ul>
          )}

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
