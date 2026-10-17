"use client";

import { useState } from "react";
import type { KontoPraca } from "@/lib/bruno/praca/konta";
import type { OfertaFirmyWiersz } from "@/lib/bruno/praca/oferty-firm";
import type { Zgloszenie } from "@/app/brunopraca/panel/page";
import { PanelGlowa, Wyloguj, formatDaty } from "./panel-wspolne";
import s from "./praca.module.css";

// 17.10 (USER_001): panel pracodawcy. Zakładki: Ogłoszenia · Dodaj ogłoszenie · Kandydaci · Konto.
// Nowe ogłoszenie = „Czeka na aktywację” (50 zł/mc, link do płatności wysyła USER_001), potem „Aktywne”.
const POZIOMY = ["Młodszy specjalista (junior)", "Specjalista (mid / regular)", "Starszy specjalista (senior)", "Kierownik / koordynator", "Menedżer", "Dyrektor"];
const UMOWY = ["Umowa o pracę", "Umowa zlecenie", "Kontrakt B2B", "Umowa agencyjna"];
const WYMIARY = ["Pełny etat", "Część etatu", "Dodatkowa / tymczasowa"];
const TRYBY = ["Praca stacjonarna", "Praca hybrydowa", "Praca zdalna", "Praca mobilna"];
const BRANZE = ["Ubezpieczenia", "Banki i finanse", "Energetyka i OZE", "Telekomunikacja", "Farmacja i medycyna", "Motoryzacja", "Budownictwo i wnętrza", "FMCG i spożywcze", "IT i technologie", "Nieruchomości", "Przemysł i produkcja", "Edukacja i szkolenia", "Inne"];
const WOJ = ["dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie", "łódzkie", "małopolskie", "mazowieckie", "opolskie", "podkarpackie", "podlaskie", "pomorskie", "śląskie", "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie"];
const STATUS: Record<string, [string, string]> = {
  oczekuje: ["Czeka na aktywację", s.statusCzeka],
  aktywna: ["Aktywne", s.statusAktywna],
  wstrzymana: ["Wstrzymane", s.statusWstrzymana],
};
const STATUS_Z: Record<string, string> = { nowe: "Nowe", obejrzane: "Obejrzane", zaproszone: "Zaproszony na rozmowę", odrzucone: "Odrzucony" };

type Zakladka = "ogloszenia" | "dodaj" | "kandydaci" | "konto";

export default function PanelFirmy({ konto, oferty, zgloszenia, cena, zakladka }: { konto: KontoPraca; oferty: OfertaFirmyWiersz[]; zgloszenia: Zgloszenie[]; cena: number; zakladka?: string }) {
  const [z, setZ] = useState<Zakladka>(zakladka === "dodaj" ? "dodaj" : zakladka === "kandydaci" ? "kandydaci" : zakladka === "konto" ? "konto" : oferty.length ? "ogloszenia" : "dodaj");
  const [edytowana, setEdytowana] = useState<OfertaFirmyWiersz | null>(null);
  const [filtr, setFiltr] = useState("");
  const liczbaZ = (id: string) => zgloszenia.filter((x) => x.oferta_id === id).length;
  const nowych = zgloszenia.filter((x) => x.status === "nowe").length;
  const tytul = (id: string) => oferty.find((o) => o.id === id)?.stanowisko ?? id;

  async function status(id: string, nowy: string) {
    if (nowy === "usunieta" && !confirm("Usunąć ogłoszenie? Zniknie z portalu i z panelu.")) return;
    await fetch("/api/bruno/praca/firma/oferta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ akcja: "status", id, status: nowy }) });
    location.reload();
  }

  const zakladki: [Zakladka, string, number?][] = [
    ["ogloszenia", "Ogłoszenia", oferty.length],
    ["dodaj", edytowana ? "Edytuj ogłoszenie" : "Dodaj ogłoszenie"],
    ["kandydaci", "Kandydaci", nowych || undefined],
    ["konto", "Konto"],
  ];

  return (
    <main className={s.panel2}>
      <PanelGlowa etykieta="Panel pracodawcy" tytul={konto.firma ?? "Twoja firma"} opis={konto.email} />
      <div className={s.panelZakladki} role="tablist">
        {zakladki.map(([k, n, ile]) => (
          <button
            type="button"
            role="tab"
            aria-selected={z === k}
            key={k}
            className={z === k ? s.panelZakladkaOn : ""}
            onClick={() => {
              if (k === "dodaj" && z !== "dodaj") setEdytowana(null);
              setZ(k);
            }}
          >
            {n}
            {ile ? <span className={s.panelIle}>{ile}</span> : null}
          </button>
        ))}
      </div>

      {z === "ogloszenia" &&
        (oferty.length === 0 ? (
          <Pusto tytul="Nie masz jeszcze ogłoszeń" opis="Dodaj pierwsze ogłoszenie. Zobaczą je handlowcy z całej Polski." akcja={["Dodaj ogłoszenie", () => setZ("dodaj")]} />
        ) : (
          <div className={s.panelLista}>
            {oferty.map((o) => {
              const [nazwa, klasa] = STATUS[o.status] ?? ["", ""];
              return (
                <div className={s.panelWiersz} key={o.id}>
                  <div className={s.panelWierszTresc}>
                    <span className={`${s.statusPig} ${klasa}`}>{nazwa}</span>
                    <h3>{o.stanowisko}</h3>
                    <p>
                      {[o.miasto, o.tryb, `dodano ${formatDaty(o.created_at)}`].filter(Boolean).join(" · ")}
                    </p>
                    {o.status === "oczekuje" && (
                      <p className={s.panelInfo}>
                        Aktywujemy je po płatności {cena} zł / mies. Link do płatności wyślemy na {konto.email}.
                      </p>
                    )}
                  </div>
                  <div className={s.panelWierszLiczba}>
                    <b>{liczbaZ(o.id)}</b>
                    <span>kandydatów</span>
                  </div>
                  <div className={s.panelAkcje}>
                    <a href={`/praca/${o.id}`} target="_blank">
                      Podgląd
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setEdytowana(o);
                        setZ("dodaj");
                      }}
                    >
                      Edytuj
                    </button>
                    {o.status === "wstrzymana" ? (
                      <button type="button" onClick={() => status(o.id, "oczekuje")}>
                        Wznów
                      </button>
                    ) : (
                      <button type="button" onClick={() => status(o.id, "wstrzymana")}>
                        Wstrzymaj
                      </button>
                    )}
                    <button type="button" className={s.panelUsun} onClick={() => status(o.id, "usunieta")}>
                      Usuń
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {z === "dodaj" && <FormularzOferty key={edytowana?.id ?? "nowa"} o={edytowana} cena={cena} email={konto.email} />}

      {z === "kandydaci" &&
        (zgloszenia.length === 0 ? (
          <Pusto tytul="Nie ma jeszcze kandydatów" opis="Zgłoszenia na Twoje ogłoszenia pojawią się tutaj i na Twoim mailu." />
        ) : (
          <>
            {oferty.length > 1 && (
              <select className={s.panelSelect} value={filtr} onChange={(e) => setFiltr(e.target.value)} aria-label="Ogłoszenie">
                <option value="">Wszystkie ogłoszenia</option>
                {oferty.map((o) => (
                  <option value={o.id} key={o.id}>
                    {o.stanowisko}
                  </option>
                ))}
              </select>
            )}
            <div className={s.panelLista}>
              {zgloszenia
                .filter((x) => !filtr || x.oferta_id === filtr)
                .map((x) => (
                  <Kandydat key={x.id} x={x} stanowisko={tytul(x.oferta_id)} />
                ))}
            </div>
          </>
        ))}

      {z === "konto" && <KontoFirmy konto={konto} />}
    </main>
  );
}

function Pusto({ tytul, opis, akcja }: { tytul: string; opis: string; akcja?: [string, () => void] }) {
  return (
    <div className={s.pusto}>
      <h2>{tytul}</h2>
      <p>{opis}</p>
      {akcja && (
        <button type="button" className={s.btn} onClick={akcja[1]}>
          {akcja[0]}
        </button>
      )}
    </div>
  );
}

function Kandydat({ x, stanowisko }: { x: Zgloszenie; stanowisko: string }) {
  const [st, setSt] = useState(x.status);
  async function zmien(nowy: string) {
    setSt(nowy);
    await fetch("/api/bruno/praca/firma/zgloszenie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: x.id, status: nowy }) });
  }
  return (
    <div className={s.panelWiersz}>
      <div className={s.panelWierszTresc}>
        <span className={`${s.statusPig} ${st === "nowe" ? s.statusAktywna : st === "odrzucone" ? s.statusWstrzymana : s.statusCzeka}`}>{STATUS_Z[st] ?? st}</span>
        <h3>{x.imie}</h3>
        <p>
          {stanowisko} · {formatDaty(x.created_at)}
        </p>
        <p className={s.panelKontakt}>
          <a href={`mailto:${x.email}`}>{x.email}</a>
          {x.telefon && <a href={`tel:${x.telefon.replace(/\s/g, "")}`}>{x.telefon}</a>}
          {x.linkedin && (
            <a href={x.linkedin.startsWith("http") ? x.linkedin : `https://${x.linkedin}`} target="_blank" rel="noopener nofollow">
              LinkedIn
            </a>
          )}
        </p>
        {x.wiadomosc && <p className={s.panelCytat}>„{x.wiadomosc}”</p>}
      </div>
      <div className={s.panelAkcje}>
        {x.cv_nazwa ? (
          <a className={s.panelCv} href={`/api/bruno/praca/cv?z=${x.id}`} target="_blank">
            Pobierz CV
          </a>
        ) : (
          <span className={s.panelBrak}>bez CV</span>
        )}
        <select value={st} onChange={(e) => zmien(e.target.value)} aria-label="Status kandydata">
          {Object.entries(STATUS_Z).map(([k, v]) => (
            <option value={k} key={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FormularzOferty({ o, cena, email }: { o: OfertaFirmyWiersz | null; cena: number; email: string }) {
  const [stan, setStan] = useState<"" | "wysylam" | "gotowe">("");
  const [blad, setBlad] = useState("");
  const pole = (n: string, etykieta: string, el: React.ReactNode, opcj?: boolean) => (
    <label className={s.pole} key={n}>
      <span>
        {etykieta} {opcj && <em className={s.opcjonalne}>nieobowiązkowe</em>}
      </span>
      {el}
    </label>
  );
  const wybor = (n: string, opcje: string[], v?: string | null) => (
    <select name={n} defaultValue={v ?? ""}>
      <option value="">Wybierz</option>
      {opcje.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </select>
  );
  if (stan === "gotowe")
    return (
      <div className={`${s.pusto} ${s.panelGotowe}`}>
        <span className={s.ptaszek} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2>{o ? "Zapisane!" : "Ogłoszenie dodane!"}</h2>
        {!o && (
          <p>
            Aktywujemy je po płatności {cena} zł / mies. Link do płatności wyślemy na {email}.
          </p>
        )}
        <button type="button" className={s.btn} onClick={() => (location.href = "/praca/panel")}>
          Przejdź do ogłoszeń
        </button>
      </div>
    );
  return (
    <form
      className={s.panelForm}
      onSubmit={async (e) => {
        e.preventDefault();
        setBlad("");
        setStan("wysylam");
        const dane = Object.fromEntries(new FormData(e.currentTarget));
        const odp = await fetch("/api/bruno/praca/firma/oferta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dane, id: o?.id }) }).catch(() => null);
        const j = await odp?.json().catch(() => null);
        if (!odp?.ok || !j?.ok) {
          setBlad(j?.blad ?? "Nie udało się zapisać.");
          setStan("");
          return;
        }
        setStan("gotowe");
      }}
    >
      <section className={s.panelSekcja}>
        <h3>Stanowisko</h3>
        {pole("stanowisko", "Nazwa stanowiska", <input name="stanowisko" required defaultValue={o?.stanowisko} placeholder="np. Przedstawiciel handlowy B2B" />)}
        <div className={s.polaSiatka}>
          {pole("miasto", "Miasto", <input name="miasto" defaultValue={o?.miasto ?? ""} placeholder="np. Warszawa" />)}
          {pole("wojewodztwo", "Województwo", wybor("wojewodztwo", WOJ, o?.wojewodztwo))}
        </div>
        <div className={s.polaSiatka}>
          {pole("poziom", "Poziom stanowiska", wybor("poziom", POZIOMY, o?.poziom))}
          {pole("branza", "Branża", wybor("branza", BRANZE, o?.branza))}
        </div>
      </section>
      <section className={s.panelSekcja}>
        <h3>Warunki</h3>
        <div className={s.polaSiatka3}>
          {pole("umowa", "Rodzaj umowy", wybor("umowa", UMOWY, o?.umowa))}
          {pole("wymiar", "Wymiar pracy", wybor("wymiar", WYMIARY, o?.wymiar))}
          {pole("tryb", "Tryb pracy", wybor("tryb", TRYBY, o?.tryb))}
        </div>
        <div className={s.polaSiatka}>
          {pole("pensjaMin", "Wynagrodzenie od (zł brutto / mies.)", <input name="pensjaMin" inputMode="numeric" defaultValue={o?.pensja_min ?? ""} placeholder="6000" />, true)}
          {pole("pensjaMax", "Wynagrodzenie do", <input name="pensjaMax" inputMode="numeric" defaultValue={o?.pensja_max ?? ""} placeholder="9000" />, true)}
        </div>
        <p className={s.drobny}>Oferty z widełkami dostają więcej zgłoszeń.</p>
      </section>
      <section className={s.panelSekcja}>
        <h3>Opis</h3>
        {pole("opis", "Kilka zdań o stanowisku", <textarea name="opis" rows={4} defaultValue={o?.opis ?? ""} placeholder="Czym zajmuje się handlowiec w Twojej firmie i co sprzedaje." />)}
        <div className={s.polaSiatka}>
          {pole("obowiazki", "Zakres obowiązków (każdy w nowej linii)", <textarea name="obowiazki" rows={5} defaultValue={o?.obowiazki?.join("\n")} placeholder={"Pozyskiwanie nowych klientów B2B\nSpotkania u klientów"} />)}
          {pole("wymagania", "Wymagania (każde w nowej linii)", <textarea name="wymagania" rows={5} defaultValue={o?.wymagania?.join("\n")} placeholder={"Doświadczenie w sprzedaży\nPrawo jazdy kat. B"} />)}
        </div>
        <div className={s.polaSiatka}>
          {pole("oferujemy", "Oferujemy (każde w nowej linii)", <textarea name="oferujemy" rows={4} defaultValue={o?.oferujemy?.join("\n")} placeholder={"Samochód służbowy\nPremia od sprzedaży"} />, true)}
          {pole("mileWidziane", "Mile widziane (każde w nowej linii)", <textarea name="mileWidziane" rows={4} defaultValue={o?.mile_widziane?.join("\n")} placeholder="Znajomość branży OZE" />, true)}
        </div>
      </section>
      {blad && <p className={s.blad}>{blad}</p>}
      <div className={s.panelFormStopka}>
        {!o && (
          <p className={s.drobny}>
            Po dodaniu ogłoszenie czeka na aktywację: {cena} zł / mies., bez umowy.
          </p>
        )}
        <button type="submit" className={`${s.btn} ${s.btnDuzy}`} disabled={stan === "wysylam"}>
          {stan === "wysylam" ? "Zapisuję…" : o ? "Zapisz zmiany" : "Dodaj ogłoszenie"}
        </button>
      </div>
    </form>
  );
}

function KontoFirmy({ konto }: { konto: KontoPraca }) {
  const [stan, setStan] = useState("");
  return (
    <form
      className={s.panelForm}
      onSubmit={async (e) => {
        e.preventDefault();
        setStan("wysylam");
        const odp = await fetch("/api/bruno/praca/konto/profil", { method: "POST", body: new FormData(e.currentTarget) }).catch(() => null);
        setStan(odp?.ok ? "zapisane" : "blad");
      }}
    >
      <section className={s.panelSekcja}>
        <h3>Dane firmy</h3>
        <div className={s.polaSiatka}>
          <label className={s.pole}>
            <span>Nazwa firmy</span>
            <input name="firma" defaultValue={konto.firma ?? ""} />
          </label>
          <label className={s.pole}>
            <span>NIP</span>
            <input name="nip" inputMode="numeric" defaultValue={konto.nip ?? ""} />
          </label>
        </div>
        <div className={s.polaSiatka}>
          <label className={s.pole}>
            <span>Imię osoby kontaktowej</span>
            <input name="imie" defaultValue={konto.imie ?? ""} />
          </label>
          <label className={s.pole}>
            <span>Telefon</span>
            <input name="telefon" type="tel" defaultValue={konto.telefon ?? ""} />
          </label>
        </div>
        <p className={s.drobny}>E-mail konta: {konto.email}</p>
      </section>
      <div className={s.panelFormStopka}>
        <Wyloguj />
        <button type="submit" className={`${s.btn} ${s.btnDuzy}`} disabled={stan === "wysylam"}>
          {stan === "wysylam" ? "Zapisuję…" : stan === "zapisane" ? "Zapisane ✓" : "Zapisz"}
        </button>
      </div>
    </form>
  );
}
