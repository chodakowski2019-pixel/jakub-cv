"use client";

import { useEffect, useState } from "react";
import type { PelnyHandlowiec } from "@/lib/bruno/praca/handlowcy";
import { GWARANCJA, SUBSKRYPCJA_PROG, SUBSKRYPCJA_ZL, handlowcow, kontaktow, znaczkiRynku } from "@/lib/bruno/praca/kontakty-cennik";
import type { Zlecenie } from "@/lib/bruno/praca/zlecenia";
import { formatDaty } from "./panel-wspolne";
import h from "./handlowcy.module.css";
import s from "./praca.module.css";

// 11.11 (USER_001): panel firmy, zakładka „Handlowcy”: osoby z bazy handlowców, których kontakt firma odblokowała
// (zakup na /praca/handlowcy). Pełny profil: telefon, e-mail, LinkedIn, CV, zdjęcie, opis największego wyniku.
export default function PanelHandlowcy({ handlowcy, zlecenia = [], naKoncie }: { handlowcy: PelnyHandlowiec[]; /** 13.11: subskrypcje i gwarancje z wyszukiwarki. */ zlecenia?: Zlecenie[]; naKoncie: number }) {
  // 13.11 (USER_001): subskrypcję firma wyłącza tutaj. Działa do końca opłaconego miesiąca.
  const [wylaczone, setWylaczone] = useState<string[]>([]);
  const [bladZ, setBladZ] = useState("");
  async function wylacz(id: string) {
    if (!confirm("Wyłączyć subskrypcję? Będzie działać do końca opłaconego miesiąca.")) return;
    setBladZ("");
    const odp = await fetch("/api/bruno/praca/zlecenie/anuluj", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    const j = await odp?.json().catch(() => null);
    if (odp?.ok && j?.ok) setWylaczone((w) => [...w, id]);
    else setBladZ(j?.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
  }
  const aktywne = zlecenia.filter((z) => z.status === "aktywne");
  // Parametr adresu czytamy po zamontowaniu (jak w panel-firmy.tsx), żeby serwer i przeglądarka renderowały to samo.
  const [swieze, setSwieze] = useState<number | null>(null);
  useEffect(() => {
    const n = new URLSearchParams(location.search).get("odblokowane");
    if (n !== null) setSwieze(Number(n) || 0);
  }, []);

  return (
    <>
      {swieze !== null && (
        <div className={s.platnoscOk}>
          <span className={s.ptaszekMaly} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          {swieze > 0 ? `Gotowe. Odblokowane kontakty: ${swieze}.` : "Gotowe. Pakiet jest na koncie."}
          {naKoncie > 0 ? ` Do wykorzystania zostaje: ${kontaktow(naKoncie)}.` : ""}
        </div>
      )}
      <div className={h.pGlowa}>
        <div>
          <h1 className={s.ofertaH}>Handlowcy</h1>
          <span className={`${s.statusPig} ${naKoncie ? s.statusAktywna : s.statusWstrzymana}`}>Kontakty do odblokowania: {naKoncie}</span>
        </div>
        <a className={`${s.btn} ${s.btnPomarancz}`} href="/praca/handlowcy">
          Szukaj handlowców
        </a>
      </div>

      {aktywne.map((z) => {
        const konczySie = !!z.anulowano_at || wylaczone.includes(z.id);
        return (
          <div className={s.platnoscOk} key={z.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <b>{z.rodzaj === "subskrypcja" ? `Subskrypcja · ${SUBSKRYPCJA_ZL} zł / mies.` : `Gwarancja · ${GWARANCJA.ile} handlowców ponad ${GWARANCJA.prog} % do ${formatDaty(z.termin ?? z.created_at)}`}</b>
              <br />
              Szukamy: „{z.opis}”.{" "}
              {z.rodzaj === "subskrypcja"
                ? konczySie
                  ? "Wyłączona. Działa do końca opłaconego miesiąca."
                  : `Dosyłamy każdego nowego handlowca z dopasowaniem od ${SUBSKRYPCJA_PROG} %.`
                : `Brak kompletu do tego dnia = zwrot ${GWARANCJA.cena} zł.`}
            </div>
            {z.rodzaj === "subskrypcja" && !konczySie && (
              <button type="button" className={s.btn} onClick={() => wylacz(z.id)}>
                Wyłącz subskrypcję
              </button>
            )}
          </div>
        );
      })}
      {bladZ && <p className={s.firma} role="alert">{bladZ}</p>}
      {handlowcy.length === 0 ? (
        <div className={s.pustoDuze}>
          <span className={`${s.statusPig} ${s.statusWstrzymana}`}>● Brak odblokowanych kontaktów</span>
          <h2>Znajdź handlowca w bazie</h2>
          <p>Wpisz branżę i miasto. Zobaczysz, ilu handlowców pasuje, i odblokujesz kontakt do wybranych osób.</p>
          <div className={s.pustoCena}>
            <span>{naKoncie > 0 ? `Na koncie: ${kontaktow(naKoncie)}` : "Płacisz tylko za kontakty"}</span>
            <a className={s.btn} href="/praca/handlowcy">
              Szukaj handlowców
            </a>
          </div>
        </div>
      ) : (
        <>
          <p className={s.firma} style={{ marginBottom: 14 }}>
            Odblokowano: {handlowcow(handlowcy.length)}
          </p>
          <div className={h.pLista}>
            {handlowcy.map((x) => (
              <article className={h.pWiersz} key={x.id}>
                {x.zdjecie ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={h.pFoto} src={x.zdjecie} alt="" />
                ) : (
                  <span className={h.pFoto} aria-hidden="true">{x.imie[0]}</span>
                )}
                <div>
                  <h3>{x.imie}</h3>
                  <p className={h.pRola}>{[x.stanowisko, x.miasto, x.lata && `w sprzedaży: ${x.lata}`].filter(Boolean).join(" · ")}</p>
                  <ul className={h.pTagi}>
                    {[...x.branze, ...x.mocne].map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  {x.opis && <p className={h.pSukces}>{x.opis}</p>}
                  {x.sukces && <p className={h.pSukces}>{x.sukces}</p>}
                  <p className={h.pFakty}>
                    <span>Plan: <b>{x.plan}</b></span>
                    <span>Średnia sprzedaż: <b>{x.transakcja}</b></span>
                    <span>Sprzedaje: <b>{znaczkiRynku(x.rynek).join(" + ")}</b></span>
                    <span>Kanały: <b>{x.kanaly.join(", ")}</b></span>
                    <span>Tryb: <b>{x.tryb.join(", ")}</b></span>
                    <span>Umowa: <b>{x.umowa.join(", ")}</b></span>
                    {x.pensja && <span>Oczekiwana podstawa: <b>{x.pensja.toLocaleString("pl-PL")} zł netto</b></span>}
                    {x.przeprowadzka && <span>Zmiana miasta: <b>{x.przeprowadzka}</b></span>}
                    <span>Start: <b>{x.start}</b></span>
                    <span>Sytuacja: <b>{x.sytuacja}</b></span>
                  </p>
                </div>
                <div className={h.pKontakt}>
                  {x.telefon && (
                    <div>
                      <small>Telefon</small>
                      <a href={`tel:${x.telefon.replace(/[^\d+]/g, "")}`}>{x.telefon}</a>
                    </div>
                  )}
                  <div>
                    <small>E-mail</small>
                    <a href={`mailto:${x.email}`}>{x.email}</a>
                  </div>
                  {x.linkedin && (
                    <div>
                      <small>LinkedIn</small>
                      <a href={x.linkedin} target="_blank" rel="noreferrer">Profil</a>
                    </div>
                  )}
                  {x.linki.map(([nazwa, adres]) => (
                    <div key={nazwa}>
                      <small>{nazwa}</small>
                      <a href={adres} target="_blank" rel="noreferrer">Otwórz</a>
                    </div>
                  ))}
                  {x.cv && (
                    <div>
                      <small>CV</small>
                      <a href={x.cv} target="_blank" rel="noreferrer">Pobierz PDF</a>
                    </div>
                  )}
                  {x.odblokowano && <small>Odblokowano {formatDaty(x.odblokowano)}</small>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
