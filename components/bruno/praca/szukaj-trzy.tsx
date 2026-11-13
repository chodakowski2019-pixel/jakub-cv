"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import KulaLimonka from "@/components/bruno/kula-limonka";
import g from "./gielda.module.css";

// 12.11 (USER_001): start publicznej wyszukiwarki, 3 źródła: link do strony z ofertą, PDF, opis. 13.11: w jednym okienku.
// Firma używa jednego z trzech źródeł. Po wysłaniu ekran zmienia się w ładujące kółko („algorytm analizuje”),
// serwer zamienia źródło na krótki opis (POST /api/bruno/praca/szukaj) i strona przechodzi do wyniku /wyszukiwarka?q=.
const ADRES = "/wyszukiwarka?q=";
const PDF_MAKS_B = 4 * 1024 * 1024;
/** Kółko widać co najmniej tyle, także gdy odpowiedź przyjdzie od razu (sam opis). */
const MIN_MS = 2400;
const ETAPY = ["Czytamy, kogo szukasz…", "Porównujemy z profilami handlowców…", "Liczymy dopasowanie…"];

export default function SzukajTrzy() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [plik, setPlik] = useState<File | null>(null);
  const [opis, setOpis] = useState("");
  const [analiza, setAnaliza] = useState(false);
  const [etap, setEtap] = useState(0);
  const [blad, setBlad] = useState("");
  const pole = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!analiza) return;
    const t = setInterval(() => setEtap((e) => Math.min(e + 1, ETAPY.length - 1)), 1100);
    return () => clearInterval(t);
  }, [analiza]);

  async function szukaj(dane: { link?: string; plik?: File; opis?: string }) {
    setBlad("");
    if (dane.plik && dane.plik.size > PDF_MAKS_B) return setBlad("Plik jest za duży. Najwyżej 4 MB.");
    setEtap(0);
    setAnaliza(true);
    const start = Date.now();
    const f = new FormData();
    if (dane.link) f.set("link", dane.link);
    if (dane.plik) f.set("plik", dane.plik);
    if (dane.opis) f.set("opis", dane.opis);
    const odp = await fetch("/api/bruno/praca/szukaj", { method: "POST", body: f }).catch(() => null);
    const j = await odp?.json().catch(() => null);
    await new Promise((r) => setTimeout(r, Math.max(0, MIN_MS - (Date.now() - start))));
    if (!odp?.ok || !j?.ok || !j.q) {
      setBlad(j?.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      setAnaliza(false);
      return;
    }
    // Kółko zostaje do chwili, gdy załaduje się strona z wynikiem.
    router.push(`${ADRES}${encodeURIComponent(j.q)}`);
  }

  if (analiza)
    return (
      <div className={g.analiza} role="status" aria-live="polite">
        <div className={g.analizaKolo}>
          <div className={g.analizaKula}><KulaLimonka tempo="czeka" /></div>
          <span className={g.analizaPierscien} aria-hidden />
        </div>
        <p className={g.analizaTekst}>{ETAPY[etap]}</p>
      </div>
    );

  const gotowe = link.trim().length >= 4 || !!plik || opis.trim().length >= 2;
  return (
    <div className={g.trzy}>
      <h1 className="bcz-hej">Szukasz specjalisty ds. sprzedaży? 🔎</h1>
      {blad && <p className={g.trzyBlad} role="alert">{blad}</p>}
      {/* 13.11 (USER_001): jedno okienko z trzema pytaniami zamiast trzech kart. Liczy się pierwsze wypełnione: link, plik, opis. */}
      <form
        className={`p-karta ${g.okienko} ${g.okienkoJedno}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (link.trim().length >= 4) szukaj({ link: link.trim() });
          else if (plik) szukaj({ plik });
          else if (opis.trim().length >= 2) szukaj({ opis: opis.trim() });
        }}
      >
        <label className={g.okienkoWiersz}>
          <span>Masz już ofertę pracy? Dodaj link do niej</span>
          <input className={g.okienkoPole} type="text" inputMode="url" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} maxLength={600} />
        </label>
        <div className={g.okienkoWiersz}>
          <span>Masz opisane w pliku PDF, kogo szukasz? Dodaj plik</span>
          <input ref={pole} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => setPlik(e.target.files?.[0] ?? null)} />
          <button type="button" className={`${g.okienkoPole} ${g.okienkoPlik}`} onClick={() => pole.current?.click()}>
            {plik ? plik.name : "Wybierz plik PDF"}
          </button>
        </div>
        <label className={g.okienkoWiersz}>
          <span>Chcesz opisać, kogo szukasz? Wpisz tutaj</span>
          <textarea className={g.okienkoPole} rows={2} placeholder="np. Handlowiec OZE z Warszawy, min. 3 lata, B2B" value={opis} onChange={(e) => setOpis(e.target.value)} maxLength={600} />
        </label>
        <button type="submit" className="p-btn" disabled={!gotowe}>Szukaj</button>
      </form>
    </div>
  );
}
