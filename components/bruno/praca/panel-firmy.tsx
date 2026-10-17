"use client";

import { useState } from "react";
import type { KontoPraca } from "@/lib/bruno/praca/konta";
import type { OfertaFirmyWiersz } from "@/lib/bruno/praca/oferty-firm";
import type { Zgloszenie } from "@/app/brunopraca/panel/page";
import { formatDaty } from "./panel-wspolne";
import { Cennik, Kontakt, MojeKonto, ProfilFirmy } from "./panel-firmy-ustawienia";
import s from "./praca.module.css";

const CENA_REGULARNA = 200;

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

// 17.10 v2 (wzór RocketJobs): menu z boku (na telefonie pasek na górze), „Dokończ konfigurację konta”, zakładki ogłoszeń.
type Zakladka = "ogloszenia" | "dodaj" | "kandydaci" | "firma" | "cennik" | "kontakt" | "konto";
const MENU: [Zakladka, string, string][] = [
  ["ogloszenia", "Moje ogłoszenia", "M4 8h16v12H4ZM9 8V5h6v3"],
  ["dodaj", "Dodaj ogłoszenie", "M12 5v14M5 12h14"],
  ["kandydaci", "Kandydaci", "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.8-3.4 3.3-5.5 6.5-5.5s5.7 2.1 6.5 5.5M16 4.5a3.3 3.3 0 0 1 0 6.3M18.5 14.8c1.6.8 2.7 2.6 3 5.2"],
  ["firma", "Profil firmy", "M4 5h16v14H4ZM8 10h3M8 14h8M15 9.5h1"],
  ["cennik", "Cennik", "M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3S7.5 5.8 7.5 7.5 9.5 10 12 10.5s4.5 1.3 4.5 3.2-2 3.3-4.5 3.3-4.5-1.3-4.5-3"],
  ["kontakt", "Kontakt", "M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 13v4a2 2 0 0 0 2 2h1v-6H4"],
];

export default function PanelFirmy({ konto, oferty, zgloszenia, cena, zakladka }: { konto: KontoPraca; oferty: OfertaFirmyWiersz[]; zgloszenia: Zgloszenie[]; cena: number; zakladka?: string }) {
  // 17.10 (USER_001): pierwsze (najstarsze) ogłoszenie firmy w promocji {cena} zł, kolejne 200 zł / mies.
  const pierwsza = [...oferty].sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.id;
  const cenaOferty = (id: string) => (id === pierwsza ? cena : CENA_REGULARNA);
  const startowa = (["dodaj", "kandydaci", "firma", "cennik", "kontakt", "konto"] as Zakladka[]).find((x) => x === zakladka) ?? "ogloszenia";
  const [z, setZ] = useState<Zakladka>(startowa);
  const [edytowana, setEdytowana] = useState<OfertaFirmyWiersz | null>(null);
  const [filtr, setFiltr] = useState("");
  const [stanListy, setStanListy] = useState<"aktywna" | "oczekuje" | "wstrzymana">(oferty.some((o) => o.status === "aktywna") ? "aktywna" : "oczekuje");
  const [szukaj, setSzukaj] = useState("");
  const [platnoscOk] = useState(() => typeof window !== "undefined" && new URLSearchParams(location.search).get("platnosc") === "ok");
  const liczbaZ = (id: string) => zgloszenia.filter((x) => x.oferta_id === id).length;
  const nowych = zgloszenia.filter((x) => x.status === "nowe").length;
  const tytul = (id: string) => oferty.find((o) => o.id === id)?.stanowisko ?? id;
  const nazwa = konto.nazwa_wyswietlana || konto.firma || "Twoja firma";
  const idz = (k: Zakladka) => {
    if (k === "dodaj") setEdytowana(null);
    setZ(k);
    window.scrollTo({ top: 0 });
  };

  async function status(id: string, nowy: string) {
    if (nowy === "usunieta" && !confirm("Usunąć ogłoszenie? Zniknie z portalu i z panelu.")) return;
    await fetch("/api/bruno/praca/firma/oferta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ akcja: "status", id, status: nowy }) });
    location.reload();
  }
  const wLiscie = oferty.filter((o) => o.status === stanListy && (!szukaj || o.stanowisko.toLowerCase().includes(szukaj.toLowerCase())));
  const ileStan = (st: string) => oferty.filter((o) => o.status === st).length;

  return (
    <div className={s.panelUklad}>
      <aside className={s.panelBok}>
        <div className={s.panelFirmaKarta}>
          {konto.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={konto.logo_url} alt="" className={s.panelFirmaLogo} />
          ) : (
            <span className={s.panelFirmaInicjaly}>{nazwa.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>
          )}
          <span>
            <small>Firma</small>
            <b>{nazwa}</b>
          </span>
        </div>
        <nav className={s.panelMenu}>
          {MENU.map(([k, n, d]) => (
            <button type="button" key={k} className={z === k || (k === "firma" && z === "konto") ? s.panelMenuOn : ""} onClick={() => idz(k)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={d} />
              </svg>
              {k === "dodaj" && edytowana ? "Edytuj ogłoszenie" : n}
              {k === "kandydaci" && nowych > 0 && <span className={s.panelIle}>{nowych}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className={s.panelTresc}>
        {z === "ogloszenia" && (
          <>
            {platnoscOk && (
              <div className={s.platnoscOk}>
                <span className={s.ptaszekMaly} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                Płatność przyjęta. Ogłoszenie będzie aktywne w ciągu minuty (odśwież stronę).
              </div>
            )}
            <div className={s.panelNaglowek}>
              <h1 className={s.ofertaH}>Zarządzaj rekrutacjami</h1>
              <button type="button" className={`${s.btn} ${s.btnPomarancz}`} onClick={() => idz("dodaj")}>
                + Dodaj ogłoszenie o pracę
              </button>
            </div>
            <div className={s.panelPasek}>
              <div className={s.panelZakladki} role="tablist">
                {(
                  [
                    ["aktywna", "Aktywne"],
                    ["oczekuje", "Czekające"],
                    ["wstrzymana", "Wstrzymane"],
                  ] as const
                ).map(([k, n]) => (
                  <button type="button" role="tab" aria-selected={stanListy === k} key={k} className={stanListy === k ? s.panelZakladkaOn : ""} onClick={() => setStanListy(k)}>
                    {n} <span className={s.panelIleSzary}>{ileStan(k)}</span>
                  </button>
                ))}
              </div>
              <input className={s.panelSzukaj} type="search" placeholder="Wyszukaj ogłoszenie" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} aria-label="Wyszukaj ogłoszenie" />
            </div>
            {oferty.length === 0 ? (
              <div className={s.pustoDuze}>
                <span className={`${s.statusPig} ${s.statusWstrzymana}`}>● Brak ogłoszeń</span>
                <h2>Zacznij rekrutować już dziś</h2>
                <p>Pierwsze ogłoszenie dodasz w kilka minut. Zobaczą je handlowcy z całej Polski.</p>
                <div className={s.pustoCena}>
                  <span>
                    Pierwsze ogłoszenie: <s>200 zł</s> <b>{cena} zł</b> / mies.
                  </span>
                  <button type="button" className={s.btn} onClick={() => idz("dodaj")}>
                    Dodaj ogłoszenie
                  </button>
                </div>
              </div>
            ) : wLiscie.length === 0 ? (
              <div className={s.pusto}>
                <h2>Brak ogłoszeń w tej zakładce</h2>
              </div>
            ) : (
              <div className={s.panelLista}>
                {wLiscie.map((o) => {
                  const [nazwaS, klasa] = STATUS[o.status] ?? ["", ""];
                  return (
                    <div className={s.panelWiersz} key={o.id}>
                      <div className={s.panelWierszTresc}>
                        <span className={`${s.statusPig} ${klasa}`}>{nazwaS}</span>
                        <h3>{o.stanowisko}</h3>
                        <p>{[o.miasto, o.tryb, `dodano ${formatDaty(o.created_at)}`].filter(Boolean).join(" · ")}</p>
                        {o.status === "oczekuje" && (
                          <p className={s.panelInfo}>
                            Czeka na płatność: {cenaOferty(o.id)} zł / mies.{o.id === pierwsza ? " (promocja zamiast 200 zł)" : ""}
                          </p>
                        )}
                      </div>
                      <button type="button" className={s.panelWierszLiczba} onClick={() => { setFiltr(o.id); idz("kandydaci"); }}>
                        <b>{liczbaZ(o.id)}</b>
                        <span>kandydatów</span>
                      </button>
                      <div className={s.panelAkcje}>
                        {o.status !== "aktywna" && <ZaplacBtn id={o.id} cena={cenaOferty(o.id)} />}
                        <a href={`/praca/${o.id}`} target="_blank">
                          Podgląd
                        </a>
                        <button type="button" onClick={() => { setEdytowana(o); setZ("dodaj"); }}>
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
            )}
          </>
        )}

        {z === "dodaj" && (
          <>
            <h1 className={`${s.ofertaH} ${s.panelTytul}`}>{edytowana ? "Edytuj ogłoszenie" : "Dodaj ogłoszenie o pracę"}</h1>
            <FormularzOferty key={edytowana?.id ?? "nowa"} o={edytowana} cena={oferty.length ? CENA_REGULARNA : cena} promo={!oferty.length} email={konto.email} />
          </>
        )}

        {z === "kandydaci" && (
          <>
            <h1 className={`${s.ofertaH} ${s.panelTytul}`}>Kandydaci</h1>
            {zgloszenia.length === 0 ? (
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
            )}
          </>
        )}

        {z === "firma" && <ProfilFirmy konto={konto} />}
        {z === "konto" && <MojeKonto konto={konto} />}
        {z === "cennik" && <Cennik cena={cena} pierwszaWykorzystana={oferty.length > 0} onDodaj={() => idz("dodaj")} />}
        {z === "kontakt" && <Kontakt />}
      </main>
    </div>
  );
}

/** 18.10: płatność Stripe (subskrypcja miesięczna) za ogłoszenie z panelu. */
function ZaplacBtn({ id, cena, duzy, promo }: { id: string; cena: number; duzy?: boolean; promo?: boolean }) {
  const [stan, setStan] = useState("");
  return (
    <>
      <button
        type="button"
        className={duzy ? `${s.btn} ${s.btnDuzy} ${s.btnPomarancz}` : s.zaplacMaly}
        disabled={stan === "wysylam"}
        onClick={async () => {
          setStan("wysylam");
          const odp = await fetch("/api/bruno/praca/platnosc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
          const j = await odp?.json().catch(() => null);
          if (j?.url) location.href = j.url;
          else {
            setStan("");
            alert(j?.blad ?? "Nie udało się otworzyć płatności.");
          }
        }}
      >
        {stan === "wysylam" ? "Otwieram płatność…" : duzy ? <>Zapłać {promo && <s className={s.cenaStaraJasna}>200 zł</s>} {cena} zł / mies. i aktywuj</> : `Zapłać ${cena} zł`}
      </button>
    </>
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

function FormularzOferty({ o, cena, promo, email }: { o: OfertaFirmyWiersz | null; cena: number; promo: boolean; email: string }) {
  const [stan, setStan] = useState<"" | "wysylam" | "gotowe">("");
  const [blad, setBlad] = useState("");
  const [noweId, setNoweId] = useState<string | null>(null);
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
        {!o && noweId ? (
          <>
            <p>Opłać je, a od razu zobaczą je handlowcy z całej Polski.</p>
            <ZaplacBtn id={noweId} cena={cena} duzy promo={promo} />
            <button type="button" className={s.wyczysc} onClick={() => (location.href = "/praca/panel")}>
              Zapłacę później
            </button>
          </>
        ) : (
          <button type="button" className={s.btn} onClick={() => (location.href = "/praca/panel")}>
            Przejdź do ogłoszeń
          </button>
        )}
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
        setNoweId(j.id);
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
            Po dodaniu ogłoszenie czeka na aktywację: {promo ? <><s>200 zł</s> {cena} zł / mies. (promocja na pierwsze ogłoszenie)</> : <>{cena} zł / mies.</>}.
          </p>
        )}
        <button type="submit" className={`${s.btn} ${s.btnDuzy}`} disabled={stan === "wysylam"}>
          {stan === "wysylam" ? "Zapisuję…" : o ? "Zapisz zmiany" : "Dodaj ogłoszenie"}
        </button>
      </div>
    </form>
  );
}

