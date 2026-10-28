"use client";

import { useEffect, useRef, useState } from "react";
import { GLOSOWKA_MAX_SEKUND, type Firma, type Pytanie, type Rola } from "@/lib/bruno/formularz-firmy";

// 28.10 (USER_001): formularz CRM po demo, styl LP Bruno / webinaru (webinar-lp.module.css):
// tło #f6f6f5, czerń #0b0b0b, pomarańczowa kropka #f08a2b, białe karty 22 px z ramką #ebeae7, czarny przycisk-pigułka.
// Nagłówek „Formularz CRM” (USER_001 28.10). Pytanie z `glosowka` ma nagrywanie w przeglądarce (MediaRecorder, do 20 min),
// plik idzie przy wysyłce prosto do Supabase Storage przez podpisany URL (/api/bruno/formularz/nagranie).
type Props = { firma: Firma; rola: Rola; pytania: Pytanie[] };

const karta = "bg-white border border-[#ebeae7] rounded-[22px] p-6 sm:p-[30px] shadow-[0_20px_60px_rgba(0,0,0,.05)]";
const pole =
  "w-full bg-[#fafaf9] border border-[#e6e5e1] rounded-[12px] px-4 py-3 text-[15px] text-[#0b0b0b] placeholder-[#a4a4a4] focus:outline-none focus:border-[#0b0b0b] focus:bg-white transition-colors";
const etykieta = "block text-[13px] font-medium text-[#0b0b0b] mb-1.5";
const pigulka = (akt: boolean) =>
  `px-4 py-2 rounded-full text-[14px] font-medium border transition-colors ${akt ? "bg-[#0b0b0b] text-white border-[#0b0b0b]" : "bg-white border-[#e6e5e1] hover:border-[#0b0b0b]"}`;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function typNagrania() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) if (MediaRecorder.isTypeSupported(t)) return t;
  return "";
}

/** Nagrywanie głosówki: Nagraj → licznik do 20:00 → Stop → odsłuch + Usuń. Plik trzymany w pamięci do wysyłki. */
function Glosowka({ onBlob }: { onBlob: (b: Blob | null) => void }) {
  const [stan, setStan] = useState<"brak" | "nagrywa" | "gotowe" | "blad">("brak");
  const [sek, setSek] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const kawalki = useRef<Blob[]>([]);
  const zegar = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
    if (zegar.current) clearInterval(zegar.current);
    zegar.current = null;
  };

  useEffect(() => () => { stop(); if (url) URL.revokeObjectURL(url); }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    try {
      const typ = typNagrania();
      const strumien = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(strumien, typ ? { mimeType: typ } : undefined);
      kawalki.current = [];
      r.ondataavailable = (e) => { if (e.data.size) kawalki.current.push(e.data); };
      r.onstop = () => {
        strumien.getTracks().forEach((t) => t.stop());
        const blob = new Blob(kawalki.current, { type: r.mimeType || typ || "audio/webm" });
        const u = URL.createObjectURL(blob);
        setUrl(u);
        onBlob(blob);
        setStan("gotowe");
      };
      rec.current = r;
      r.start(1000);
      setSek(0);
      setStan("nagrywa");
      zegar.current = setInterval(() => {
        setSek((s) => {
          if (s + 1 >= GLOSOWKA_MAX_SEKUND) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setStan("blad");
    }
  };

  const usun = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setSek(0);
    onBlob(null);
    setStan("brak");
  };

  return (
    <div className="mt-4 rounded-[14px] border border-dashed border-[#d9d7d2] p-4 flex flex-wrap items-center gap-3">
      {stan === "brak" && (
        <button type="button" onClick={start} className="inline-flex items-center gap-2 bg-white border border-[#0b0b0b] rounded-full px-4 py-2 text-[14px] font-medium hover:bg-[#0b0b0b] hover:text-white transition-colors">
          <span className="w-[8px] h-[8px] rounded-full bg-[#f08a2b]" /> Nagraj głosówkę
        </button>
      )}
      {stan === "nagrywa" && (
        <>
          <button type="button" onClick={stop} className="inline-flex items-center gap-2 bg-[#0b0b0b] text-white rounded-full px-4 py-2 text-[14px] font-medium">
            <span className="w-[10px] h-[10px] rounded-[2px] bg-white" /> Stop
          </button>
          <span className="text-[14px] tabular-nums"><span className="inline-block w-[8px] h-[8px] rounded-full bg-[#e0362f] mr-2 animate-pulse" />{mmss(sek)} / {mmss(GLOSOWKA_MAX_SEKUND)}</span>
        </>
      )}
      {stan === "gotowe" && url && (
        <>
          <audio controls src={url} className="h-10 max-w-full" />
          <span className="text-[13px] text-[#6b6b6b]">{mmss(sek)}, wyśle się razem z formularzem</span>
          <button type="button" onClick={usun} className="text-[13px] underline text-[#6b6b6b]">Usuń i nagraj jeszcze raz</button>
        </>
      )}
      {stan === "blad" && <span className="text-[13px] text-[#c0392b]">Brak dostępu do mikrofonu. Zezwól w przeglądarce albo wyślij głosówkę na jakub@salesbruno.com.</span>}
      {stan === "brak" && <span className="text-[13px] text-[#6b6b6b]">Max. 20 minut</span>}
    </div>
  );
}

export default function FormularzFirmy({ firma, rola, pytania }: Props) {
  // 28.10 (USER_001): pole E-mail USUNIĘTE, zostaje samo imię.
  const [imie, setImie] = useState("");
  const [odp, setOdp] = useState<Record<string, string>>({});
  const nagrania = useRef<Record<string, Blob | null>>({});
  const [stan, setStan] = useState<"edycja" | "wysylka" | "ok" | "blad">("edycja");
  const [blad, setBlad] = useState("");
  const [krok, setKrok] = useState("");

  const ustaw = (id: string, v: string) => setOdp((o) => ({ ...o, [id]: v }));

  const wgrajNagranie = async (blob: Blob) => {
    const r = await fetch("/api/bruno/formularz/nagranie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firma: firma.klucz, rozmiar: blob.size, typ: blob.type }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.signedUrl) throw new Error(j.blad ?? "Nie udało się przygotować wysyłki nagrania.");
    const put = await fetch(j.signedUrl, { method: "PUT", headers: { "Content-Type": blob.type || "audio/webm" }, body: blob });
    if (!put.ok) throw new Error("Nie udało się wysłać nagrania.");
    return String(j.sciezka);
  };

  const wyslij = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("wysylka");
    setBlad("");
    try {
      const odpowiedzi: Record<string, string> = { ...odp };
      for (const [id, blob] of Object.entries(nagrania.current)) {
        if (!blob) continue;
        setKrok("Wysyłam głosówkę…");
        odpowiedzi[`${id}_nagranie`] = await wgrajNagranie(blob);
      }
      setKrok("Wysyłam odpowiedzi…");
      const r = await fetch("/api/bruno/formularz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firma: firma.klucz, rola, imie, odpowiedzi }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) setStan("ok");
      else {
        setBlad(j.blad ?? "Nie udało się wysłać. Spróbuj ponownie.");
        setStan("blad");
      }
    } catch (err) {
      setBlad(err instanceof Error ? err.message : "Nie udało się wysłać. Spróbuj ponownie.");
      setStan("blad");
    } finally {
      setKrok("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f5] text-[#0b0b0b] font-[var(--font-blp-body)] antialiased">
      <nav className="max-w-[760px] mx-auto px-5 py-[22px] flex items-center justify-between">
        <span className="font-[var(--font-blp-head)] font-semibold text-[17px] tracking-[-0.02em] inline-flex items-center gap-1">
          Jakub Chodakowski <span className="w-[7px] h-[7px] rounded-full bg-[#f08a2b]" />
        </span>
        <span className="text-[13px] text-[#6b6b6b]">Bruno AI · {firma.nazwa}</span>
      </nav>

      <main className="max-w-[760px] mx-auto px-5 pb-20">
        {stan === "ok" ? (
          <div className={`${karta} text-center py-14`}>
            <div className="w-12 h-12 rounded-full bg-[#0b0b0b] mx-auto mb-6 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="font-[var(--font-blp-head)] text-[32px] font-medium tracking-[-0.02em] leading-tight mb-2">Dziękuję, {imie}.</h1>
            <p className="font-[var(--font-blp-head)] text-[22px] font-light text-[#a4a4a4]">Odpowiedzi dotarły. Odezwę się w ciągu 24 godzin.</p>
          </div>
        ) : (
          <form onSubmit={wyslij} className="flex flex-col gap-4">
            <header className="pt-4 pb-6">
              <h1 className="font-[var(--font-blp-head)] text-[40px] sm:text-[52px] font-medium tracking-[-0.03em] leading-[1.02]">Formularz CRM</h1>
            </header>

            <div className={karta}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={etykieta}>Imię i nazwisko</label>
                  <input required className={pole} value={imie} onChange={(e) => setImie(e.target.value)} placeholder="np. Anna Kowalska" />
                </div>
              </div>
            </div>

            {pytania.map((p, i) => (
              <div key={p.id} className={karta}>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#f08a2b] font-[var(--font-blp-head)] text-[14px] font-medium text-[#f08a2b] mb-3">{i + 1}</span>
                <label className="block font-[var(--font-blp-head)] text-[20px] font-medium tracking-[-0.01em] leading-snug">{p.tekst}</label>
                {p.pod && <p className="text-[14px] text-[#6b6b6b] mt-1.5">{p.pod}</p>}
                <div className="mt-4">
                  {p.typ === "wybor" || p.typ === "wielokrotny" ? (
                    <div className="flex flex-wrap gap-2">
                      {p.opcje!.map((o) => {
                        const wybrane = p.typ === "wielokrotny" ? (odp[p.id] ?? "").split(", ").filter(Boolean) : [odp[p.id] ?? ""];
                        const akt = wybrane.includes(o);
                        const klik = () => {
                          if (p.typ === "wybor") return ustaw(p.id, akt ? "" : o);
                          const nowe = akt ? wybrane.filter((x) => x !== o) : [...wybrane, o];
                          ustaw(p.id, nowe.join(", "));
                        };
                        return (
                          <button type="button" key={o} onClick={klik} className={pigulka(akt)}>
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  ) : p.typ === "dlugi" ? (
                    <textarea rows={p.glosowka ? 5 : 3} className={pole} value={odp[p.id] ?? ""} onChange={(e) => ustaw(p.id, e.target.value)} placeholder="Twoja odpowiedź" />
                  ) : (
                    <input className={pole} value={odp[p.id] ?? ""} onChange={(e) => ustaw(p.id, e.target.value)} placeholder="Twoja odpowiedź" />
                  )}
                </div>
                {p.glosowka && <Glosowka onBlob={(b) => { nagrania.current[p.id] = b; }} />}
              </div>
            ))}

            <div className={`${karta} flex justify-center`}>
              <button
                type="submit"
                disabled={stan === "wysylka"}
                className="bg-[#0b0b0b] hover:bg-[#262626] disabled:opacity-60 text-white font-medium text-[15px] rounded-full px-8 py-[14px] transition-colors"
              >
                {stan === "wysylka" ? krok || "Wysyłam…" : "Wyślij odpowiedzi"}
              </button>
            </div>
            {stan === "blad" && <p className="text-[14px] text-[#c0392b] px-2">{blad}</p>}
          </form>
        )}
      </main>
    </div>
  );
}
