"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tDla, type Jezyk } from "@/lib/bruno/i18n";

// 14.11 (USER_001): na karcie klienta, nad Historią: notatka, plik PDF / audio, nagranie głosówki z mikrofonu.
// Plik idzie prosto do kubełka (podpisany adres), serwer czyta go (PDF: Claude, audio: Whisper) i zapisuje wpis w historii.

const LIMIT = 24 * 1024 * 1024;

export default function KlientDodaj({ klientId, jezyk }: { klientId: number; jezyk: Jezyk }) {
  const t = tDla(jezyk);
  const router = useRouter();
  const [notatka, setNotatka] = useState("");
  const [praca, setPraca] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [nagrywam, setNagrywam] = useState(false);
  const [sekundy, setSekundy] = useState(0);
  const plikRef = useRef<HTMLInputElement>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const kawalki = useRef<Blob[]>([]);
  const api = `/api/bruno/klienci/${klientId}/plik`;

  useEffect(() => {
    if (!nagrywam) return;
    const id = setInterval(() => setSekundy((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [nagrywam]);

  const zapiszNotatke = async () => {
    if (!notatka.trim() || praca) return;
    setPraca(t("Saving…", "Zapisuję…"));
    setBlad(null);
    try {
      const r = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notatka }) });
      const j = (await r.json().catch(() => ({}))) as { blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      setNotatka("");
      router.refresh();
    } catch (e) {
      setBlad(String((e as Error)?.message ?? e));
    } finally {
      setPraca(null);
    }
  };

  const wyslijPlik = async (f: File) => {
    if (f.size > LIMIT) return setBlad(t("File over 24 MB.", "Plik ponad 24 MB."));
    setBlad(null);
    setPraca(`${t("Uploading", "Wgrywam")} ${f.name}…`);
    try {
      const q = new URLSearchParams({ nazwa: f.name, typ: f.type });
      const a = await fetch(`${api}?${q}`);
      const ja = (await a.json().catch(() => ({}))) as { url?: string; sciezka?: string; blad?: string };
      if (!a.ok || !ja.url || !ja.sciezka) throw new Error(ja.blad || `HTTP ${a.status}`);
      const up = await fetch(ja.url, { method: "PUT", body: f, headers: { "content-type": f.type || "application/octet-stream", "x-upsert": "true" } });
      if (!up.ok) throw new Error(`upload ${up.status}`);
      setPraca(t("Bruno is reading the file…", "Bruno czyta plik…"));
      const r = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sciezka: ja.sciezka, nazwa: f.name, typ: f.type }) });
      const j = (await r.json().catch(() => ({}))) as { blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      setBlad(`${f.name}: ${String((e as Error)?.message ?? e)}`);
    } finally {
      setPraca(null);
    }
  };

  const nagraj = async () => {
    if (nagrywam) return rec.current?.stop();
    setBlad(null);
    try {
      const strumien = await navigator.mediaDevices.getUserMedia({ audio: true });
      const typ = ["audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const r = new MediaRecorder(strumien, typ ? { mimeType: typ } : undefined);
      kawalki.current = [];
      r.ondataavailable = (e) => e.data.size && kawalki.current.push(e.data);
      r.onstop = () => {
        strumien.getTracks().forEach((s) => s.stop());
        setNagrywam(false);
        const mime = r.mimeType || typ || "audio/webm";
        const rozsz = mime.includes("mp4") ? "m4a" : "webm";
        const data = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Warsaw" }).slice(0, 16).replace(/[ :]/g, "-");
        void wyslijPlik(new File(kawalki.current, `glosowka-${data}.${rozsz}`, { type: mime.split(";")[0] }));
      };
      rec.current = r;
      r.start(1000);
      setSekundy(0);
      setNagrywam(true);
    } catch {
      setBlad(t("No microphone access.", "Brak dostępu do mikrofonu."));
    }
  };

  const czas = `${Math.floor(sekundy / 60)}:${String(sekundy % 60).padStart(2, "0")}`;

  return (
    <div className="pk-dodaj">
      <textarea
        value={notatka}
        onChange={(e) => setNotatka(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void zapiszNotatke();
        }}
        placeholder={t("Add a note…", "Dodaj notatkę…")}
        rows={2}
        maxLength={6000}
        disabled={Boolean(praca)}
      />
      <div className="pk-dodaj-pasek">
        <button type="button" className="p-btn p-btn-s" onClick={zapiszNotatke} disabled={!notatka.trim() || Boolean(praca)}>{t("Save note", "Zapisz notatkę")}</button>
        <button type="button" className="p-btn p-btn-2 p-btn-s" onClick={() => plikRef.current?.click()} disabled={Boolean(praca) || nagrywam}>📎 {t("File", "Plik")}</button>
        <button type="button" className={`p-btn p-btn-2 p-btn-s ${nagrywam ? "pk-nagrywam" : ""}`} onClick={nagraj} disabled={Boolean(praca)}>{nagrywam ? `■ ${t("Stop", "Zatrzymaj")} ${czas}` : `🎙️ ${t("Record", "Nagraj")}`}</button>
        <input
          ref={plikRef}
          type="file"
          accept="application/pdf,.pdf,audio/*,.mp3,.m4a,.wav,.webm,.ogg"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void wyslijPlik(f);
          }}
        />
        {praca && <span className="p-cichy pk-dodaj-stan">{praca}</span>}
      </div>
      {blad && <div className="p-zle-t pk-dodaj-stan">{blad}</div>}
    </div>
  );
}

/** 14.11 (USER_001): klik w etap = przeniesienie leada na ten etap; przycisk „Następny etap”. Wygrany / przegrany bez klikania. */
export function EtapyKlienta({ klientId, etapy, idx, status, jezyk }: { klientId: number; etapy: { id: number; nazwa: string }[]; idx: number; status: string; jezyk: Jezyk }) {
  const t = tDla(jezyk);
  const router = useRouter();
  const [cel, setCel] = useState<number | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const otwarty = status !== "won" && status !== "lost";
  const teraz = cel ?? idx;
  const przenies = async (i: number) => {
    if (!otwarty || cel !== null || i === idx) return;
    setCel(i);
    setBlad(null);
    try {
      const r = await fetch(`/api/bruno/klienci/${klientId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ akcja: "etap", etap_id: etapy[i].id }) });
      const j = (await r.json().catch(() => ({}))) as { blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      setBlad(String((e as Error)?.message ?? e));
    } finally {
      setCel(null);
    }
  };
  const nast = etapy[idx + 1];
  return (
    <>
      <ol className={`pk-stepper ${otwarty ? "klik" : ""}`} aria-label={t("Pipeline stage", "Etap lejka")}>
        {etapy.map((e, i) => (
          <li
            key={e.id}
            className={status === "won" ? "won" : status === "lost" && i <= idx ? "lost" : i < teraz ? "byl" : i === teraz ? "jest" : ""}
            title={otwarty && i !== idx ? `${t("Move to", "Przenieś na")}: ${e.nazwa}` : e.nazwa}
            onClick={() => przenies(i)}
            role={otwarty ? "button" : undefined}
            tabIndex={otwarty ? 0 : undefined}
            onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && przenies(i)}
          >
            <i />
            <span>{i + 1}. {e.nazwa}</span>
          </li>
        ))}
      </ol>
      {otwarty && nast && (
        <button type="button" className="p-btn p-btn-2 p-btn-s pk-nastepny" onClick={() => przenies(idx + 1)} disabled={cel !== null}>
          {cel !== null ? t("Moving…", "Przenoszę…") : `${t("Next stage", "Następny etap")}: ${nast.nazwa} →`}
        </button>
      )}
      {blad && <div className="p-zle-t pk-dodaj-stan">{blad}</div>}
    </>
  );
}

/** 14.11 (USER_001): ✎ edycja notatki w miejscu, ✕ usunięcie notatki albo pliku. */
export function WpisEdycja({ klientId, zdarzenieId, tekst, edytowalny, jezyk, children }: { klientId: number; zdarzenieId: number; tekst: string; edytowalny: boolean; jezyk: Jezyk; children: React.ReactNode }) {
  const t = tDla(jezyk);
  const router = useRouter();
  const [edycja, setEdycja] = useState(false);
  const [wartosc, setWartosc] = useState(tekst);
  const [praca, setPraca] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const api = `/api/bruno/klienci/${klientId}/plik`;
  const wyslij = async (metoda: "PATCH" | "DELETE") => {
    if (metoda === "DELETE" && !confirm(t("Delete this entry?", "Usunąć ten wpis?"))) return;
    setPraca(true);
    setBlad(null);
    try {
      const r = metoda === "DELETE" ? await fetch(`${api}?z=${zdarzenieId}`, { method: "DELETE" }) : await fetch(api, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ z: zdarzenieId, notatka: wartosc }) });
      const j = (await r.json().catch(() => ({}))) as { blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      setEdycja(false);
      router.refresh();
    } catch (e) {
      setBlad(String((e as Error)?.message ?? e));
    } finally {
      setPraca(false);
    }
  };
  if (edycja)
    return (
      <div className="pk-dodaj pk-edycja">
        <textarea value={wartosc} onChange={(e) => setWartosc(e.target.value)} rows={3} maxLength={6000} autoFocus disabled={praca} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void wyslij("PATCH"); if (e.key === "Escape") setEdycja(false); }} />
        <div className="pk-dodaj-pasek">
          <button type="button" className="p-btn p-btn-s" onClick={() => wyslij("PATCH")} disabled={praca || !wartosc.trim()}>{praca ? t("Saving…", "Zapisuję…") : t("Save", "Zapisz")}</button>
          <button type="button" className="p-btn p-btn-2 p-btn-s" onClick={() => { setEdycja(false); setWartosc(tekst); }} disabled={praca}>{t("Cancel", "Anuluj")}</button>
        </div>
        {blad && <div className="p-zle-t pk-dodaj-stan">{blad}</div>}
      </div>
    );
  return (
    <>
      {children}
      <span className="pk-wpis-akcje">
        {edytowalny && <button type="button" onClick={() => setEdycja(true)} title={t("Edit", "Edytuj")} aria-label={t("Edit", "Edytuj")}>✎</button>}
        <button type="button" onClick={() => wyslij("DELETE")} disabled={praca} title={t("Delete", "Usuń")} aria-label={t("Delete", "Usuń")}>✕</button>
      </span>
      {blad && <div className="p-zle-t pk-dodaj-stan">{blad}</div>}
    </>
  );
}
