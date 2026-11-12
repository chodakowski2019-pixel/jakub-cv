"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import KulaLimonka from "@/components/bruno/kula-limonka";
import g from "./gielda.module.css";

// 12.11 (USER_001: „tutaj powinny być 3 okienka: link do strony z ofertą, PDF, opis”): start publicznej wyszukiwarki.
// Firma używa jednego z trzech źródeł. Po wysłaniu ekran zmienia się w ładujące kółko („algorytm analizuje”),
// serwer zamienia źródło na krótki opis (POST /api/bruno/praca/szukaj) i strona przechodzi do wyniku /wyszukiwarka?q=.
const ADRES = "/wyszukiwarka?q=";
const PDF_MAKS_B = 4 * 1024 * 1024;
/** Kółko widać co najmniej tyle, także gdy odpowiedź przyjdzie od razu (sam opis). */
const MIN_MS = 2400;
const ETAPY = ["Czytamy, kogo szukasz…", "Porównujemy z profilami handlowców…", "Liczymy dopasowanie…"];

export default function SzukajTrzy({ nowych }: { /** Profile dodane w ostatnich 7 dniach; 0 = bez liczby. */ nowych: number }) {
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

  return (
    <div className={g.trzy}>
      <h1 className="bcz-hej">Znajdź handlowca.</h1>
      <p className={g.trzyLead}>Wystarczy jedno z trzech. Wynik w kilka sekund, bez konta.</p>
      {blad && <p className={g.trzyBlad} role="alert">{blad}</p>}
      <div className={g.trzySiatka}>
        <form
          className={`p-karta ${g.okienko}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (link.trim().length >= 4) szukaj({ link: link.trim() });
          }}
        >
          <span className={g.okienkoNr}>1</span>
          <h2>Dodaj link do oferty</h2>
          <p>Adres strony z ogłoszeniem o pracę.</p>
          <input className={g.okienkoPole} type="text" inputMode="url" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} maxLength={600} aria-label="Link do strony z ofertą" />
          <button type="submit" className="p-btn" disabled={link.trim().length < 4}>Szukaj</button>
        </form>

        <form
          className={`p-karta ${g.okienko}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (plik) szukaj({ plik });
          }}
        >
          <span className={g.okienkoNr}>2</span>
          <h2>Dodaj PDF</h2>
          <p>Plik z ofertą albo opisem stanowiska, do 4 MB.</p>
          <input ref={pole} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => setPlik(e.target.files?.[0] ?? null)} />
          <button type="button" className={`${g.okienkoPole} ${g.okienkoPlik}`} onClick={() => pole.current?.click()}>
            {plik ? plik.name : "Wybierz plik PDF"}
          </button>
          <button type="submit" className="p-btn" disabled={!plik}>Szukaj</button>
        </form>

        <form
          className={`p-karta ${g.okienko}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (opis.trim().length >= 2) szukaj({ opis: opis.trim() });
          }}
        >
          <span className={g.okienkoNr}>3</span>
          <h2>Opisz, jakiego handlowca szukasz</h2>
          <p>Branża, miasto, doświadczenie.</p>
          <textarea className={g.okienkoPole} rows={2} placeholder="np. Handlowiec OZE z Warszawy, min. 3 lata, B2B" value={opis} onChange={(e) => setOpis(e.target.value)} maxLength={600} aria-label="Opisz, jakiego handlowca szukasz" />
          <button type="submit" className="p-btn" disabled={opis.trim().length < 2}>Szukaj</button>
        </form>
      </div>
      <p className={g.trzyNowi}>
        <i aria-hidden />
        Codziennie dodajemy do bazy nowych handlowców.{nowych > 0 ? ` W ostatnich 7 dniach: ${nowych}.` : ""}
      </p>
    </div>
  );
}
