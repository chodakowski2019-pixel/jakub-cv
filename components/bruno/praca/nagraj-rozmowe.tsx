"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import KulaLimonka from "@/components/bruno/kula-limonka";
import type { Wypowiedz } from "@/lib/bruno/db";
import type { RozmowaTestowa } from "@/lib/bruno/praca/rozmowy-testowe";
import g from "./gielda.module.css";

// 16.11 (USER_001): zakładka „Nagraj rozmowę” w panelu handlowca. 3 rozmowy sprzedażowe z Bruno po 3 minuty,
// Bruno gra klienta z branży handlowca. Każda rozmowa nagrana i udostępniana firmom, które odblokują kontakt.
// Układ (USER_001): krótki opis rozmowy → 3 rozmowy → zgoda → kula Bruno → „Zacznij rozmowę”.
// Po kliknięciu zostaje sama kula, w niej odliczanie 3, 2, 1 (w tym czasie łączymy się z ElevenLabs).
// Scenariusz, limit i czas pilnuje serwer (/api/bruno/praca/rozmowa-testowa/start i /koniec).

type Zadanie = { nr: number; tytul: string; zadanie: string };
type Sytuacja = { branza: string; produkt: string; klient: string };
type Stan = "lista" | "odliczanie" | "laczenie" | "trwa" | "konczenie";

const czas = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function NagrajRozmowe({ zadania, nagrane, nastepna, sytuacje, sekund, zostaloStartow }: { zadania: Zadanie[]; nagrane: RozmowaTestowa[]; /** Numer rozmowy, którą można teraz nagrać, albo null (wszystkie nagrane / limit podejść). */ nastepna: number | null; /** Jedna sytuacja z profilu handlowca; konto bez profilu dostaje wszystkie branże do wyboru. */ sytuacje: Sytuacja[]; sekund: number; zostaloStartow: number }) {
  const router = useRouter();
  const [stan, setStan] = useState<Stan>("lista");
  const [branza, setBranza] = useState(sytuacje[0]?.branza ?? "");
  const [zgoda, setZgoda] = useState(false);
  const [blad, setBlad] = useState("");
  const [info, setInfo] = useState("");
  const [odliczanie, setOdliczanie] = useState(3);
  const [sekundy, setSekundy] = useState(0);
  const [mowi, setMowi] = useState(false);
  const el = useRef<{ endSession: () => Promise<void>; getId: () => string } | null>(null);
  const transkrypcja = useRef<Wypowiedz[]>([]);
  const start = useRef(0);
  const rozmowaId = useRef("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const konczenie = useRef(false);
  const syt = sytuacje.find((x) => x.branza === branza) ?? sytuacje[0];
  const minut = sekund / 60;

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
    start.current = 0;
    setSekundy(0);
    setOdliczanie(3);
    setStan("odliczanie");
    window.scrollTo({ top: 0 });
    // Odliczanie 3, 2, 1 chowa czas łączenia: serwer i odliczanie idą równolegle.
    const odliczono = new Promise<void>((gotowe) => {
      let n = 3;
      const t = setInterval(() => {
        n -= 1;
        if (n > 0) return setOdliczanie(n);
        clearInterval(t);
        gotowe();
      }, 1000);
    });
    try {
      const [odp] = await Promise.all([fetch("/api/bruno/praca/rozmowa-testowa/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zgoda, branza }) }), odliczono]);
      const dane = await odp.json().catch(() => null);
      if (!odp.ok || !dane?.ok) throw new Error(dane?.blad ?? "Nie udało się zacząć rozmowy.");
      rozmowaId.current = dane.rozmowa_id;
      setStan("laczenie");
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

  const kula = (srodek?: React.ReactNode) => (
    <div style={{ position: "relative", width: 200, height: 200, display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <KulaLimonka tempo={stan === "trwa" ? (mowi ? "mowi" : "slucha") : "czeka"} />
      </div>
      {srodek}
    </div>
  );

  // Po „Zacznij rozmowę” zostaje sam Bruno: kula, w niej odliczanie, potem zegar i „Zakończ rozmowę”.
  if (stan !== "lista") {
    return (
      <div className="p-strona" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <div style={{ display: "grid", justifyItems: "center", gap: 22, textAlign: "center" }}>
          {kula(
            stan === "odliczanie" ? (
              <span key={odliczanie} aria-live="assertive" style={{ position: "relative", fontSize: 76, fontWeight: 600, lineHeight: 1, color: "#16181d" }}>
                {odliczanie}
              </span>
            ) : null,
          )}
          <div>
            <h2 style={{ fontVariantNumeric: "tabular-nums", fontSize: 26, fontWeight: 600 }}>{stan === "trwa" ? czas(Math.max(0, sekund - sekundy)) : "Bruno"}</h2>
            <p className={g.podtytul}>{stan === "trwa" ? (mowi ? "Bruno mówi" : "Bruno słucha") : stan === "konczenie" ? "Zapisuję rozmowę…" : stan === "laczenie" ? "Łączę z Bruno…" : "Za chwilę zaczynasz rozmowę"}</p>
          </div>
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
        </div>
        <div className="p-naglowek-prawo">
          <span className="p-chip">Nagrane: {nagrane.length} / {zadania.length}</span>
        </div>
      </div>

      <div className="p-karta p-karta-p" style={{ display: "grid", gap: 18, padding: 24 }}>
        {/* 1. Jak będzie wyglądać rozmowa: kim jest klient i co mu sprzedajesz. */}
        <div style={{ display: "grid", gap: 8 }}>
          <h3>Jak wygląda rozmowa</h3>
          <p className={g.tekst}>
            Rozmawiasz głosem z Bruno. Bruno gra klienta z branży, w której masz doświadczenie{sytuacje.length === 1 ? <>: <b>{syt.branza}</b></> : ""}. Ty sprzedajesz, on odpowiada jak prawdziwy klient.
          </p>
          {sytuacje.length > 1 && (
            <label className={g.tekst}>
              Branża:{" "}
              <select className={g.wpis} style={{ width: "auto", display: "inline-block" }} value={branza} onChange={(e) => setBranza(e.target.value)}>
                {sytuacje.map((x) => (
                  <option key={x.branza}>{x.branza}</option>
                ))}
              </select>
            </label>
          )}
          <p className={g.tekst}><b>Sprzedajesz:</b> {syt.produkt}</p>
          <p className={g.tekst}><b>Klient:</b> {syt.klient}</p>
        </div>

        {/* 2. Trzy rozmowy po 3 minuty. */}
        <div style={{ display: "grid", gap: 10 }}>
          <h3>{zadania.length} rozmowy po {minut} minuty każda</h3>
          {zadania.map((z) => {
            const r = nagrane.find((x) => x.nr === z.nr);
            return (
              <div key={z.nr} style={{ display: "grid", gap: 6 }}>
                <p className={g.tekst}>
                  <b>{z.nr}. {z.tytul}.</b> {z.zadanie}{" "}
                  {r ? <span className="p-chip">{r.ocena != null ? `Nagrana · ocena ${r.ocena} / 10` : "Nagrana"}</span> : z.nr === nastepna ? <span className="p-chip">Teraz</span> : null}
                </p>
                {r?.nagranie && <audio controls preload="none" src={r.nagranie} style={{ width: "100%", maxWidth: 520 }} />}
              </div>
            );
          })}
          <p className={g.podtytul}>Nagrania i ocenę zobaczy firma, która odblokuje Twój kontakt.</p>
        </div>

        {info && <p className={g.tekst}>{info}</p>}
        {blad && <p className={g.bladPola}>{blad}</p>}

        {nastepna ? (
          <>
            {/* 3. Zgoda, obowiązkowa. */}
            <label className={g.zgoda}>
              <input type="checkbox" checked={zgoda} onChange={(e) => setZgoda(e.target.checked)} />
              <span>Zgadzam się na nagranie rozmowy oraz udostępnienie nagrania i oceny firmom, które odblokują mój kontakt.</span>
            </label>
            <div style={{ display: "grid", justifyItems: "center", gap: 18, padding: "10px 0 6px" }}>
              {kula()}
              <button type="button" className="p-btn p-btn-3" disabled={!zgoda} onClick={zacznij} style={{ height: 48, padding: "0 30px", fontSize: 16, opacity: zgoda ? 1 : 0.45 }}>
                Zacznij rozmowę {nastepna} z {zadania.length}
              </button>
              <p className={g.podtytul}>Potrzebny mikrofon. Rozmowa kończy się sama po {minut} minutach. Pozostałe podejścia: {zostaloStartow}.</p>
            </div>
          </>
        ) : (
          <p className={g.podtytul}>{nagrane.length >= zadania.length ? "Masz nagrane wszystkie rozmowy." : "Wykorzystane wszystkie podejścia. Napisz do nas, odblokujemy kolejne."}</p>
        )}
      </div>
    </div>
  );
}
