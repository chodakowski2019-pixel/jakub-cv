"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Jezyk } from "@/lib/bruno/i18n";
import { useT } from "@/components/bruno/jezyk-kontekst";
import { Ikona } from "@/components/podglad/panel/wspolne";
import KulaLimonka from "@/components/bruno/kula-limonka";
import TekstMd from "@/components/bruno/tekst-md";
import { zJako } from "@/lib/bruno/linki";
import { LIMIT_WHISPER, naKawalkiAudio, trzebaPrzerobic } from "@/lib/bruno/audio-kawalki";

// 4.11 (USER_001): CZAT Z BRUNO = „tylko kulka na środku z ciekłym liquidem i UX/UI jak w ChatGPT”.
// 5.11 (USER_001): (1) przycisk „Trenuj rozmowy” + komenda w czacie → trening 1:1 (/bruno/rozmowa);
// (2) tekst Bruno renderowany (pogrubienia, listy; tekst-md.tsx) zamiast gwiazdek; (3) załączniki PDF i audio
// (spinacz → kubełek → /api/bruno/kokpit/plik → tekst doklejony do wiadomości); (5) mniej tekstu na ekranie.

export type Akcja = { opis: string; link?: string | null };
type Pozycja = { tekst: string; pod?: string | null; link?: string | null; zdjecie?: string | null; znacznik?: string | null; alarm?: boolean };
type Zalacznik = { nazwa: string; typ: "pdf" | "audio"; tekst: string };
type Wiadomosc = { rola: "user" | "assistant"; tresc: string; akcje?: Akcja[]; blad?: boolean; lista?: Pozycja[]; przycisk?: { tekst: string; link: string } | null; lokalna?: boolean; zalaczniki?: Zalacznik[] };

export type Powitanie = {
  dzis: string;
  naDzis: { id: number; temat: string; data: string; godzina: string | null; zalegle: boolean; deal: string; dealId: number | null; osoba: string | null; zdjecie: string | null; kto: string | null }[];
  zaleglych: number;
  bezRuchu: { id: number; tytul: string; etap: string; wartosc: string; dni: number; osoba: string | null; zdjecie: string | null; kto: string | null }[];
  otwarte: number;
  wartoscOtwarte: string;
  trening: { etap: string | null; kryterium: string | null; obiekcja: string | null; dlaczego: string; link: string; deal: string | null } | null;
  domena: string | null;
  bezHandlowca: number;
};

type Rozpoznawanie = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

// 4.11: v2 = stara historia (długie tematy zadań) nie wraca z sessionStorage.
const KLUCZ = "bruno-kokpit-historia-v2";
const TRENING = "/bruno/rozmowa";
/** Temat zadania jako nagłówek (część przed dwukropkiem, max 60 znaków), także dla starych wiadomości. */
const naglowek = (s: string) => { const k = s.split(/[:—–]/)[0].trim(); const n = k.length >= 6 ? k : s; return n.length > 60 ? `${n.slice(0, 57).trimEnd()}…` : n; };
/** 5.11 (pkt 1): krótka komenda „trenuj rozmowy” / „trening” / „train” = od razu trening, bez API. */
const komendaTreningu = (s: string) => /^(trenuj|trening|trenujmy|ćwicz|cwicz|przećwicz|train|practice)\b/i.test(s) && s.length < 40;

export default function Kokpit({ jezyk, imie, szef, firma, domenaCrm, powitanie = null, jako = null }: { jezyk: Jezyk; imie: string; szef: boolean; firma: string; domenaCrm: string | null; powitanie?: Powitanie | null; jako?: string | null }) {
  const { t } = useT();
  const router = useRouter();
  const linkKlienta = (id: number) => zJako(`/bruno/klienci/${id}`, jako);
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [tekst, setTekst] = useState("");
  const [wysylam, setWysylam] = useState(false);
  const [slucham, setSlucham] = useState(false);
  const [mowaJest, setMowaJest] = useState(false);
  const [zalaczniki, setZalaczniki] = useState<Zalacznik[]>([]);
  const [wgrywam, setWgrywam] = useState<string | null>(null);
  const rozp = useRef<Rozpoznawanie | null>(null);
  const koniec = useRef<HTMLDivElement>(null);
  const pole = useRef<HTMLTextAreaElement>(null);
  const plik = useRef<HTMLInputElement>(null);
  const bazaTekstu = useRef("");
  const klucz = `${KLUCZ}:${jako ?? (szef ? "szef" : "ja")}`;
  void firma; void domenaCrm;

  useEffect(() => {
    try {
      const z = sessionStorage.getItem(klucz);
      if (z) setWiadomosci(JSON.parse(z));
    } catch {}
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    setMowaJest(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    try {
      const deal = new URLSearchParams(window.location.search).get("deal");
      if (deal) {
        setTekst(`${deal.slice(0, 120)}: `);
        setTimeout(() => pole.current?.focus(), 50);
      }
    } catch {}
  }, [klucz]);
  useEffect(() => {
    try {
      // Załączniki w historii bez treści (sessionStorage ma limit); API i tak dostaje je tylko z bieżącej wiadomości.
      sessionStorage.setItem(klucz, JSON.stringify(wiadomosci.slice(-40).map((w) => (w.zalaczniki ? { ...w, zalaczniki: w.zalaczniki.map((z) => ({ ...z, tekst: z.tekst.slice(0, 1500) })) } : w))));
    } catch {}
    if (wiadomosci.length) koniec.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [wiadomosci, klucz]);

  const mow = () => {
    if (slucham) {
      rozp.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => Rozpoznawanie; webkitSpeechRecognition?: new () => Rozpoznawanie };
    const K = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!K) return;
    const r = new K();
    r.lang = jezyk === "pl" ? "pl-PL" : "en-US";
    r.continuous = true;
    r.interimResults = true;
    bazaTekstu.current = tekst ? `${tekst.trim()} ` : "";
    r.onresult = (e) => {
      let koncowe = "";
      let robocze = "";
      for (let i = 0; i < e.results.length; i++) {
        const r0 = e.results[i];
        const s = r0[0]?.transcript ?? "";
        if (r0.isFinal) koncowe += s + " ";
        else robocze += s;
      }
      setTekst((bazaTekstu.current + koncowe + robocze).replace(/\s+/g, " "));
    };
    r.onend = () => setSlucham(false);
    r.onerror = () => setSlucham(false);
    rozp.current = r;
    setSlucham(true);
    r.start();
  };

  // 5.11 (pkt 3): plik → podpisany adres → kubełek → serwer robi z niego tekst (PDF: Claude, audio: Whisper).
  const odczytaj = async (f: File) => {
    const q = new URLSearchParams({ nazwa: f.name, typ: f.type });
    const a = await fetch(`/api/bruno/kokpit/plik?${q}`);
    const ja = (await a.json().catch(() => ({}))) as { url?: string; sciezka?: string; blad?: string };
    if (!a.ok || !ja.url || !ja.sciezka) throw new Error(ja.blad || `HTTP ${a.status}`);
    const up = await fetch(ja.url, { method: "PUT", body: f, headers: { "content-type": f.type || "application/octet-stream", "x-upsert": "true" } });
    if (!up.ok) throw new Error(`upload ${up.status}`);
    const r = await fetch("/api/bruno/kokpit/plik", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sciezka: ja.sciezka, nazwa: f.name, typ: f.type }) });
    const j = (await r.json().catch(() => ({}))) as { nazwa?: string; typ?: "pdf" | "audio"; tekst?: string; blad?: string };
    if (!r.ok || !j.tekst) throw new Error(j.blad || `HTTP ${r.status}`);
    return { typ: j.typ ?? "pdf", tekst: j.tekst };
  };

  const dodajPlik = async (f: File) => {
    setWgrywam(f.name);
    try {
      // 8.11: film albo audio > 24 MB → dźwięk wyciągnięty w przeglądarce, kawałki po 10 min, każdy osobno do Whispera.
      if (trzebaPrzerobic(f)) {
        setWgrywam(`${f.name} (${t("extracting audio", "wyciągam dźwięk")})`);
        const kawalki = await naKawalkiAudio(f);
        const teksty: string[] = [];
        for (let i = 0; i < kawalki.length; i++) {
          setWgrywam(kawalki.length > 1 ? `${f.name} (${i + 1}/${kawalki.length})` : f.name);
          teksty.push((await odczytaj(kawalki[i])).tekst);
        }
        setZalaczniki((z) => [...z, { nazwa: f.name, typ: "audio", tekst: teksty.join("\n") }]);
      } else {
        if (f.size > LIMIT_WHISPER) throw new Error(t("File over 24 MB.", "Plik ponad 24 MB."));
        const j = await odczytaj(f);
        setZalaczniki((z) => [...z, { nazwa: f.name, typ: j.typ, tekst: j.tekst }]);
      }
    } catch (err) {
      setWiadomosci((w) => [...w, { rola: "assistant", tresc: `${t("Couldn't read the file", "Nie udało się odczytać pliku")} ${f.name}: ${String((err as Error)?.message ?? err)}`, blad: true, lokalna: true }]);
    } finally {
      setWgrywam(null);
      if (plik.current) plik.current.value = "";
    }
  };

  const wyslij = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const tresc = tekst.trim();
    if ((tresc.length < 2 && !zalaczniki.length) || wysylam || wgrywam) return;
    if (slucham) rozp.current?.stop();
    if (komendaTreningu(tresc) && !zalaczniki.length) {
      router.push(TRENING);
      return;
    }
    const zal = zalaczniki;
    const nowe: Wiadomosc[] = [...wiadomosci, { rola: "user", tresc: tresc || t("Read the file", "Odczytaj plik"), zalaczniki: zal.length ? zal : undefined }];
    setWiadomosci(nowe);
    setTekst("");
    setZalaczniki([]);
    if (pole.current) pole.current.style.height = "auto";
    setWysylam(true);
    try {
      const res = await fetch(`/api/bruno/kokpit${jako ? `?jako=${encodeURIComponent(jako)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wiadomosci: nowe.filter((w) => !w.lokalna).slice(-20).map((w, i, arr) => ({ rola: w.rola, tresc: w.tresc, zalaczniki: i === arr.length - 1 ? w.zalaczniki : w.zalaczniki?.map((z) => ({ ...z, tekst: z.tekst.slice(0, 1500) })) })) }),
      });
      const j = (await res.json().catch(() => ({}))) as { odpowiedz?: string; akcje?: Akcja[]; przekieruj?: string | null; blad?: string };
      if (!res.ok) throw new Error(j.blad || `HTTP ${res.status}`);
      const p = j.przekieruj && j.przekieruj.startsWith("/bruno/") ? j.przekieruj : null;
      setWiadomosci((w) => [...w, { rola: "assistant", tresc: j.odpowiedz ?? "", akcje: j.akcje ?? [], przycisk: p ? { tekst: t("Start training →", "Zacznij trening →"), link: p } : null }]);
      if (p) setTimeout(() => router.push(p), 700);
    } catch (err) {
      setWiadomosci((w) => [...w, { rola: "assistant", tresc: t("Something went wrong. Try again.", "Coś poszło nie tak. Spróbuj jeszcze raz."), blad: true }]);
      console.error("[kokpit]", err);
    } finally {
      setWysylam(false);
      pole.current?.focus();
    }
  };

  const wyczysc = () => {
    setWiadomosci([]);
    setZalaczniki([]);
    try {
      sessionStorage.removeItem(klucz);
    } catch {}
  };

  // Pigułki z CRM: klik = pytanie użytkownika + gotowa odpowiedź Bruno (lokalnie, bez API).
  const lokalnie = (pytanie: string, odpowiedz: string, lista: Pozycja[], przycisk?: { tekst: string; link: string } | null) =>
    setWiadomosci((w) => [...w, { rola: "user", tresc: pytanie, lokalna: true }, { rola: "assistant", tresc: odpowiedz, lista, przycisk: przycisk ?? null, lokalna: true }]);

  const p = powitanie;
  const pigulkiCrm: { tekst: string; licznik?: string; alarm?: boolean; klik: () => void }[] = p
    ? [
        {
          tekst: t("Today", "Dziś"),
          licznik: p.naDzis.length ? `${p.naDzis.length}${p.zaleglych ? ` · ${p.zaleglych} ${t("overdue", "zaległe")}` : ""}` : "0",
          alarm: p.zaleglych > 0,
          klik: () =>
            lokalnie(
              t("What's on today?", "Co mam dziś?"),
              p.naDzis.length ? t(`${p.naDzis.length} tasks, ${p.zaleglych} overdue:`, `${p.naDzis.length} zadań, ${p.zaleglych} zaległych:`) : t("No tasks due today.", "Brak zadań na dziś."),
              p.naDzis.map((z) => ({ tekst: z.temat, pod: [z.osoba ?? z.deal, z.kto].filter(Boolean).join(" · "), link: z.dealId ? linkKlienta(z.dealId) : null, zdjecie: z.zdjecie, znacznik: z.zalegle ? z.data.slice(5) : z.godzina?.slice(0, 5) || t("today", "dziś"), alarm: z.zalegle })),
            ),
        },
      ]
    : [];

  const pusto = wiadomosci.length === 0;
  const tempo = wysylam || wgrywam ? "mowi" : slucham ? "slucha" : "czeka";
  const Zal = ({ z }: { z: Zalacznik[] }) => (
    <div className="bcz-zal">
      {z.map((x, i) => (
        <span key={i} className="bcz-zal-chip" title={x.nazwa}>
          <i>{x.typ === "audio" ? "♪" : "PDF"}</i>
          {x.nazwa}
        </span>
      ))}
    </div>
  );

  return (
    <div className={`bcz ${pusto ? "bcz-start" : "bcz-rozmowa-on"}`}>
      <div className="bcz-gora">
        <span className="bcz-firma" />

        <span className="bcz-gora-p">
          <a href={TRENING} className="bcz-trenuj">
            <Ikona nazwa="mikrofon" rozmiar={13} grubosc={2.2} />
            {t("Train calls", "Trenuj rozmowy")}
          </a>
          {!pusto && (
            <button type="button" onClick={wyczysc} className="bcz-wyczysc">{t("New chat", "Nowa rozmowa")}</button>
          )}
        </span>
      </div>

      <div className="bcz-kula-wrap" aria-hidden>
        <div className="bcz-kula"><KulaLimonka tempo={tempo} /></div>
      </div>

      {pusto ? (
        <div className="bcz-powitanie">
          <h1 className="bcz-hej">
            {t(`Hi ${imie}!`, `Cześć ${imie}!`)}{" "}
            <span className="bcz-hej-2">{t("How can I help you today?", "W czym mogę Ci dzisiaj pomóc?")}</span>
          </h1>
          <div className="bcz-pigulki">
            {pigulkiCrm.map((x) => (
              <button key={x.tekst} type="button" className={`bcz-pigulka ${x.alarm ? "bcz-pigulka-alarm" : ""}`} onClick={x.klik}>
                {x.tekst}
                {x.licznik && <em>{x.licznik}</em>}
              </button>
            ))}
            <a href={TRENING} className="bcz-pigulka bcz-pigulka-trening">
              <Ikona nazwa="mikrofon" rozmiar={14} grubosc={2.2} />
              {t("Train calls", "Trenuj rozmowy")}
            </a>
          </div>
        </div>
      ) : (
        <div className="bcz-lista" role="log" aria-live="polite">
          {wiadomosci.map((w, i) => (
            <div key={i} className={`bcz-wiad ${w.rola === "user" ? "bcz-ja" : "bcz-bruno"} ${w.blad ? "bcz-blad" : ""}`}>
              {w.rola === "assistant" && <span className="bcz-avatar" aria-hidden />}
              <div className="bcz-tresc">
                {w.rola === "user" ? <p className="whitespace-pre-wrap">{w.tresc}</p> : <TekstMd tekst={w.tresc} />}
                {w.zalaczniki && w.zalaczniki.length > 0 && <Zal z={w.zalaczniki} />}
                {w.lista && w.lista.length > 0 && (
                  <ul className="bcz-pozycje">
                    {w.lista.map((x, j) => (
                      <li key={j}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {x.zdjecie ? <img src={x.zdjecie} alt="" className="bcz-foto" /> : x.znacznik ? null : <span className="bcz-kropka" />}
                        <span className="min-w-0 flex-1">
                          {x.link ? <a href={x.link} className="font-semibold underline underline-offset-2" title={x.tekst}>{naglowek(x.tekst)}</a> : <b>{naglowek(x.tekst)}</b>}
                          {x.pod ? <span className="block text-xs text-slate-500 truncate">{x.pod}</span> : null}
                        </span>
                        {x.znacznik && <span className={`bcz-znacznik ${x.alarm ? "bcz-znacznik-alarm" : ""}`}>{x.znacznik}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {w.przycisk && (
                  <a href={w.przycisk.link} className="bruno-przycisk inline-flex mt-3 px-5 py-2.5 text-sm">{w.przycisk.tekst}</a>
                )}
                {w.akcje && w.akcje.length > 0 && (
                  <ul className="bcz-akcje">
                    {w.akcje.map((a, j) => (
                      <li key={j}>
                        <span className="bcz-ok" aria-hidden>✓</span>
                        {a.link ? <a href={a.link} target="_blank" rel="noreferrer" className="underline underline-offset-2">{a.opis}</a> : a.opis}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          {wysylam && (
            <div className="bcz-wiad bcz-bruno">
              <span className="bcz-avatar" aria-hidden />
              <div className="bcz-tresc bcz-pisze"><i /><i /><i /></div>
            </div>
          )}
          <div ref={koniec} />
        </div>
      )}

      <div className="bcz-dol">
        {(zalaczniki.length > 0 || wgrywam) && (
          <div className="bcz-zal bcz-zal-pole">
            {zalaczniki.map((x, i) => (
              <span key={i} className="bcz-zal-chip" title={x.nazwa}>
                <i>{x.typ === "audio" ? "♪" : "PDF"}</i>
                {x.nazwa}
                <button type="button" aria-label={t("Remove", "Usuń")} onClick={() => setZalaczniki((z) => z.filter((_, j) => j !== i))}>×</button>
              </span>
            ))}
            {wgrywam && <span className="bcz-zal-chip bcz-zal-czeka"><i className="bcz-zal-kropka" />{t("Reading", "Czytam")} {wgrywam}…</span>}
          </div>
        )}
        <form onSubmit={wyslij} className="bcz-pole">
          <input ref={plik} type="file" accept=".pdf,application/pdf,audio/*,video/*,.mp3,.m4a,.wav,.mp4,.mov" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void dodajPlik(f); }} />
          <button type="button" onClick={() => plik.current?.click()} className="bcz-klip" disabled={Boolean(wgrywam)} aria-label={t("Attach PDF or audio", "Dodaj PDF albo nagranie")} title={t("PDF or audio", "PDF albo nagranie")}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 11.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.5 3.5 0 0 1 5 5l-9 9a1.5 1.5 0 0 1-2.1-2.1L16 7" /></svg>
          </button>
          <textarea
            ref={pole}
            className="bcz-textarea"
            rows={1}
            placeholder={slucham ? t("Listening…", "Słucham…") : t("Type here...", "Napisz tutaj...")}
            value={tekst}
            onChange={(e) => {
              setTekst(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(160, e.target.scrollHeight)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void wyslij();
              }
            }}
            maxLength={3000}
            disabled={wysylam}
          />
          {mowaJest && (
            <button type="button" onClick={mow} className={`bcz-mik ${slucham ? "bcz-mik-on" : ""}`} aria-pressed={slucham} aria-label={slucham ? t("Stop", "Zatrzymaj") : t("Speak", "Mów")} title={slucham ? t("Stop", "Zatrzymaj") : t("Speak", "Mów")}>
              <Ikona nazwa="mikrofon" rozmiar={18} />
            </button>
          )}
          <button type="submit" disabled={wysylam || Boolean(wgrywam) || (tekst.trim().length < 2 && !zalaczniki.length)} className="bcz-wyslij" aria-label={t("Send", "Wyślij")} title={t("Send", "Wyślij")}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
