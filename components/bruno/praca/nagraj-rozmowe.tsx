"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import KulaLimonka from "@/components/bruno/kula-limonka";
import type { Wypowiedz } from "@/lib/bruno/db";
import type { RozmowaTestowa } from "@/lib/bruno/praca/rozmowy-testowe";
import g from "./gielda.module.css";

// 16.11 (USER_001): zakładka „Nagraj rozmowę” w panelu handlowca. 3 rozmowy sprzedażowe z Bruno po 3 minuty,
// każda nagrana i udostępniana firmom, które odblokują kontakt. Scenariusz, limit i czas pilnuje serwer
// (/api/bruno/praca/rozmowa-testowa/start i /koniec); tu tylko połączenie z ElevenLabs i zegar.

type Zadanie = { nr: number; tytul: string; zadanie: string };
type Stan = "lista" | "laczenie" | "trwa" | "konczenie";

const czas = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const data = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long" });

export default function NagrajRozmowe({ zadania, nagrane, nastepna, produkt, klient, sekund, zostaloStartow }: { zadania: Zadanie[]; nagrane: RozmowaTestowa[]; /** Numer rozmowy, którą można teraz nagrać, albo null (wszystkie nagrane / limit podejść). */ nastepna: number | null; produkt: string; klient: string; sekund: number; zostaloStartow: number }) {
  const router = useRouter();
  const [stan, setStan] = useState<Stan>("lista");
  const [zgoda, setZgoda] = useState(nagrane.length > 0);
  const [blad, setBlad] = useState("");
  const [info, setInfo] = useState("");
  const [sekundy, setSekundy] = useState(0);
  const [mowi, setMowi] = useState(false);
  const el = useRef<{ endSession: () => Promise<void>; getId: () => string } | null>(null);
  const transkrypcja = useRef<Wypowiedz[]>([]);
  const start = useRef(0);
  const rozmowaId = useRef("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const konczenie = useRef(false);

  const zakoncz = async (powod: "limit" | "recznie") => {
    if (konczenie.current) return;
    konczenie.current = true;
    if (timer.current) clearInterval(timer.current);
    setStan("konczenie");
    const elId = el.current?.getId() ?? null;
    await el.current?.endSession().catch(() => {});
    el.current = null;
    const odp = await fetch("/api/bruno/praca/rozmowa-testowa/koniec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rozmowa_id: rozmowaId.current, transkrypcja: transkrypcja.current, sekundy: Math.round((Date.now() - start.current) / 1000), el_conversation_id: elId, powod }),
    }).catch(() => null);
    const j = await odp?.json().catch(() => null);
    if (j?.przerwana) setInfo("Rozmowa była za krótka i nie została zapisana. Nagraj ją jeszcze raz.");
    else if (!j?.ok) setBlad("Nie udało się zapisać rozmowy. Odśwież stronę.");
    setStan("lista");
    router.refresh();
  };

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      el.current?.endSession().catch(() => {});
    },
    [],
  );

  const zacznij = async () => {
    setBlad("");
    setInfo("");
    konczenie.current = false;
    transkrypcja.current = [];
    setSekundy(0);
    setStan("laczenie");
    try {
      const odp = await fetch("/api/bruno/praca/rozmowa-testowa/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zgoda }) });
      const dane = await odp.json().catch(() => null);
      if (!odp.ok || !dane?.ok) throw new Error(dane?.blad ?? "Nie udało się zacząć rozmowy.");
      rozmowaId.current = dane.rozmowa_id;
      const { Conversation } = await import("@elevenlabs/client");
      const polaczenie = dane.polaczenie === "webrtc" ? ({ conversationToken: dane.token, connectionType: "webrtc" } as const) : ({ signedUrl: dane.token, connectionType: "websocket" } as const);
      el.current = await Conversation.startSession({
        ...polaczenie,
        overrides: {
          agent: { prompt: { prompt: dane.prompt }, firstMessage: dane.pierwsza_wypowiedz, language: "pl" },
          tts: { voiceId: dane.glos, ...(dane.glos_ustawienia ?? {}) },
        },
        onConnect: () => {
          start.current = Date.now();
          setStan("trwa");
          timer.current = setInterval(() => {
            const s = Math.round((Date.now() - start.current) / 1000);
            setSekundy(s);
            if (s >= dane.sekundy) void zakoncz("limit");
          }, 500);
        },
        onMessage: ({ message, role }) => {
          const teraz = Math.max(0, Math.round((Date.now() - start.current) / 1000));
          // Głos v3 dopisuje znaczniki emocji ([sighs]); w transkrypcji dla trenera ich nie ma.
          const tekst = (role === "agent" ? (message ?? "").replace(/\[[^\]]{1,40}\]/g, " ") : (message ?? "")).replace(/\s{2,}/g, " ").trim();
          if (!tekst) return;
          // ElevenLabs oddaje tekst handlowca PO jego wypowiedzi: początek szacujemy z liczby słów (ok. 2,3 słowa/s).
          const poprzednia = transkrypcja.current[transkrypcja.current.length - 1];
          const t = role === "agent" ? teraz : Math.max(poprzednia ? poprzednia.t + 1 : 0, teraz - Math.round(tekst.split(/\s+/).length / 2.3));
          transkrypcja.current.push({ rola: role === "agent" ? "klient" : "handlowiec", tekst, t });
        },
        onModeChange: ({ mode }) => setMowi(mode === "speaking"),
        onError: (msg) => console.error("elevenlabs", msg),
        onDisconnect: () => {
          if (!konczenie.current && start.current) void zakoncz("recznie");
        },
      });
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się połączyć z Bruno.");
      setStan("lista");
      router.refresh();
    }
  };

  if (stan !== "lista") {
    const z = zadania.find((x) => x.nr === nastepna);
    return (
      <div className="p-strona">
        <div className="p-karta p-karta-p" style={{ textAlign: "center", display: "grid", justifyItems: "center", gap: 14, padding: "36px 20px" }}>
          <span className="p-chip">Rozmowa {nastepna} z {zadania.length}: {z?.tytul}</span>
          <div style={{ width: 180, height: 180 }}>
            <KulaLimonka tempo={stan === "trwa" ? (mowi ? "mowi" : "slucha") : "czeka"} />
          </div>
          <h1 style={{ fontVariantNumeric: "tabular-nums" }}>{stan === "trwa" ? czas(Math.max(0, sekund - sekundy)) : stan === "laczenie" ? "Łączę z Bruno…" : "Zapisuję rozmowę…"}</h1>
          <p className={g.podtytul} style={{ maxWidth: 460 }}>{z?.zadanie}</p>
          {stan === "trwa" && (
            <button type="button" className="p-btn p-btn-2" onClick={() => zakoncz("recznie")}>
              Zakończ rozmowę
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-strona">
      <div className="p-naglowek">
        <div>
          <h1>Nagraj rozmowę</h1>
          <p className={g.podtytul}>3 rozmowy sprzedażowe z Bruno, każda po {sekund / 60} minuty. Nagrania i ocenę zobaczy firma, która odblokuje Twój kontakt.</p>
        </div>
        <div className="p-naglowek-prawo">
          <span className="p-chip">Nagrane: {nagrane.length} / {zadania.length}</span>
        </div>
      </div>

      <div className="p-karta">
        <div className="p-karta-hd"><h3>Co sprzedajesz</h3></div>
        <dl className={g.dane}>
          <dt>Produkt</dt>
          <dd>{produkt}</dd>
          <dt>Klient</dt>
          <dd>{klient}</dd>
        </dl>
      </div>

      {info && <p className="p-pusto">{info}</p>}
      {blad && <p className={g.bladPola}>{blad}</p>}

      {zadania.map((z) => {
        const r = nagrane.find((x) => x.nr === z.nr);
        return (
          <div className="p-karta" key={z.nr}>
            <div className="p-karta-hd">
              <h3>{z.nr}. {z.tytul}</h3>
              {r ? <span className="p-chip">{r.ocena != null ? `Ocena ${r.ocena} / 10` : "Nagrana"}</span> : null}
            </div>
            <div style={{ padding: "0 18px 18px", display: "grid", gap: 12 }}>
              <p className={g.tekst}>{z.zadanie}</p>
              {r ? (
                <>
                  {r.nagranie ? <audio controls preload="none" src={r.nagranie} style={{ width: "100%" }} /> : <p className={g.podtytul}>Nagranie pojawi się za chwilę. Odśwież stronę.</p>}
                  {r.wygrana && <p className={g.tekst}><b>Dobrze:</b> {r.wygrana}</p>}
                  {r.poprawka && <p className={g.tekst}><b>Do poprawy:</b> {r.poprawka}</p>}
                  <p className={g.podtytul}>Nagrana {data(r.kiedy)} · {czas(r.sekundy)}</p>
                </>
              ) : z.nr === nastepna ? (
                <>
                  <label className={g.zgoda}>
                    <input type="checkbox" checked={zgoda} onChange={(e) => setZgoda(e.target.checked)} />
                    <span>Zgadzam się na nagranie rozmowy oraz udostępnienie nagrania i oceny firmom, które odblokują mój kontakt.</span>
                  </label>
                  <div>
                    <button type="button" className="p-btn p-btn-3" disabled={!zgoda} onClick={zacznij}>
                      Zacznij rozmowę
                    </button>
                  </div>
                  <p className={g.podtytul}>Potrzebny mikrofon. Rozmowa kończy się sama po {sekund / 60} minutach. Pozostałe podejścia: {zostaloStartow}.</p>
                </>
              ) : (
                <p className={g.podtytul}>{nastepna ? `Dostępna po rozmowie ${nastepna}.` : "Wykorzystane wszystkie podejścia. Napisz do nas, odblokujemy kolejne."}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
