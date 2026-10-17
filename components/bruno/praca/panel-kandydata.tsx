"use client";

import { useEffect, useRef, useState } from "react";
import type { KontoPraca } from "@/lib/bruno/praca/konta";
import type { OfertaLista } from "@/lib/bruno/praca/oferty";
import type { Zgloszenie } from "@/app/brunopraca/panel/page";
import Karta, { czytajZapisane } from "./karta";
import { czytajPrzegladane } from "./przegladane";
import { formatDaty } from "./panel-wspolne";
import s from "./praca.module.css";
import { SALESBRUNO } from "./wspolne";

// 18.10 (USER_001, wzór RocketJobs): panel kandydata. Menu z boku: Pulpit · Aplikacje · Ulubione · Ostatnio przeglądane ·
// Zapisane alerty | Profil · CV · Komunikacja | Wyloguj. Na telefonie menu = pasek u góry.
// Pominięte z RocketJobs: czaty, rekomendacje algorytmem, kreator CV (nie ma tych funkcji). „Oferty dla Ciebie” = proste dopasowanie do preferencji.
export type Alert = { id: string; opis: string | null; created_at: string };
type Z = "pulpit" | "aplikacje" | "ulubione" | "przegladane" | "alerty" | "profil" | "cv" | "komunikacja";

const STATUS_Z: Record<string, [string, string]> = {
  nowe: ["Wysłane", s.statusCzeka],
  obejrzane: ["Pracodawca obejrzał", s.statusAktywna],
  zaproszone: ["Zaproszenie na rozmowę", s.statusAktywna],
  odrzucone: ["Odrzucone", s.statusWstrzymana],
};
const BRANZE = ["Ubezpieczenia", "Banki i finanse", "Energetyka i OZE", "Telekomunikacja", "Farmacja i medycyna", "Motoryzacja", "Budownictwo i wnętrza", "FMCG i spożywcze", "IT i technologie", "Nieruchomości", "Przemysł i produkcja", "Edukacja i szkolenia"];
const TRYBY = ["Praca stacjonarna", "Praca hybrydowa", "Praca zdalna", "Praca mobilna"];
const IK = {
  pulpit: "M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z",
  aplikacje: "M4 8h16v12H4ZM9 8V5h6v3",
  ulubione: "M12 20s-7.5-4.6-9.2-9.4C1.6 7.1 4 4 7.2 4c2 0 3.6 1.1 4.8 2.7C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7.1 21.2 10.6 19.5 15.4 12 20 12 20Z",
  przegladane: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  alerty: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4ZM10 21h4",
  profil: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1-4 4-6 8-6s7 2 8 6",
  cv: "M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5",
  komunikacja: "M4 5h16v11H8l-4 4Z",
};
const MENU: [Z, string][][] = [
  [
    ["pulpit", "Pulpit"],
    ["aplikacje", "Aplikacje"],
    ["ulubione", "Ulubione"],
    ["przegladane", "Ostatnio przeglądane"],
    ["alerty", "Zapisane alerty"],
  ],
  [
    ["profil", "Profil"],
    ["cv", "CV"],
    ["komunikacja", "Komunikacja"],
  ],
];
const Ikona = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default function PanelKandydata({
  konto,
  zgloszenia,
  zapisane,
  polecane,
  alerty,
  teraz,
  zakladka,
}: {
  konto: KontoPraca;
  zgloszenia: (Zgloszenie & { oferta: OfertaLista | null })[];
  zapisane: OfertaLista[];
  polecane: OfertaLista[];
  alerty: Alert[];
  teraz: number;
  zakladka?: string;
}) {
  const wszystkie = MENU.flat().map(([k]) => k);
  const start = (zakladka === "zgloszenia" ? "aplikacje" : zakladka === "zapisane" ? "ulubione" : wszystkie.find((k) => k === zakladka)) ?? "pulpit";
  const [z, setZ] = useState<Z>(start as Z);
  const idz = (k: Z) => {
    setZ(k);
    window.scrollTo({ top: 0 });
  };
  const scalone = useRef(false);
  // Serca zaznaczone przed założeniem konta → do konta (raz).
  useEffect(() => {
    if (scalone.current) return;
    scalone.current = true;
    const lokalne = czytajZapisane().filter((id) => !zapisane.some((o) => o.id === id));
    if (lokalne.length) fetch("/api/bruno/praca/zapisane", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: lokalne }) }).then(() => location.reload());
  }, [zapisane]);

  const imie = konto.imie || konto.email.split("@")[0];
  const licz = (st: string) => zgloszenia.filter((x) => x.status === st).length;

  return (
    <div className={s.panelUklad}>
      <aside className={s.panelBok}>
        <div className={s.kandKarta}>
          <span className={s.kandAvatar}>{imie[0]?.toUpperCase()}</span>
          <b>{konto.imie || "Twój profil"}</b>
          <small>{konto.email}</small>
        </div>
        <nav className={`${s.panelMenu} ${s.kandMenu}`}>
          {MENU.map((grupa, i) => (
            <div className={s.kandGrupa} key={i}>
              {grupa.map(([k, n]) => (
                <button type="button" key={k} className={z === k ? s.panelMenuOn : ""} onClick={() => idz(k)}>
                  <Ikona d={IK[k]} />
                  {n}
                </button>
              ))}
            </div>
          ))}
          <div className={s.kandGrupa}>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/bruno/praca/konto/wyloguj", { method: "POST" });
                location.href = "/praca";
              }}
            >
              <Ikona d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
              Wyloguj
            </button>
          </div>
        </nav>
      </aside>

      <main className={s.panelTresc}>
        {z === "pulpit" && (
          <div className={s.ustLista}>
            {!konto.o_mnie && (
              <div className={s.ustKarta}>
                <p className={s.aplikujEtykieta}>O mnie</p>
                <h2 className={s.pulpitH}>Uzupełnij swój profil</h2>
                <p className={s.kontoP}>Kilka słów o sobie i co sprzedajesz. Wypełnimy to za Ciebie przy „Aplikuj”.</p>
                <button type="button" className={s.btn} onClick={() => idz("profil")}>
                  Uzupełnij profil
                </button>
              </div>
            )}
            <div className={s.brunoGradient}>
              <h2>Ćwicz rozmowy sprzedażowe z AI</h2>
              <p>Zanim pójdziesz na rozmowę, przećwicz sprzedaż z Bruno. AI gra Twojego klienta, a potem mówi, co poprawić.</p>
              <a href={SALESBRUNO}>3 rozmowy bezpłatnie</a>
            </div>
            <div className={s.ustKarta}>
              <h2 className={s.pulpitSekcja}>
                <Ikona d={IK.aplikacje} /> Aplikacje
              </h2>
              <div className={s.licznikiSiatka}>
                {(
                  [
                    [zgloszenia.length, "Wysłane", "#e8f5ee", "#1c7a4f"],
                    [licz("obejrzane"), "Obejrzane", "#e8efff", "#3b6ef5"],
                    [licz("zaproszone"), "Rozmowy", "#efe8ff", "#7b4fe0"],
                    [licz("odrzucone"), "Odrzucone", "#fdecea", "#d9452b"],
                  ] as const
                ).map(([n, t, tlo, kolor]) => (
                  <button type="button" key={t} className={s.licznikKolo} onClick={() => idz("aplikacje")}>
                    <b style={{ background: tlo, color: kolor }}>{n}</b>
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={s.ustKarta}>
              <div className={s.pulpitWiersz}>
                <h2 className={s.pulpitSekcja}>
                  <Ikona d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-2 1-3 1-3s.5 2 2 2c0-3-1-5 1-7.5Z" /> Oferty dla Ciebie
                </h2>
                <a href="/praca" className={s.wyczysc}>
                  Zobacz wszystkie
                </a>
              </div>
              {polecane.length ? (
                <div className={s.lista}>
                  {polecane.slice(0, 4).map((o) => (
                    <Karta key={o.id} o={o} href={`/praca/${o.id}`} teraz={teraz} />
                  ))}
                </div>
              ) : (
                <PustoIkona d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-2 1-3 1-3s.5 2 2 2c0-3-1-5 1-7.5Z" tytul="Nie mamy jeszcze dopasowań" opis="Uzupełnij preferencje pracy (stanowisko, miasto, branża), a pokażemy tu pasujące oferty.">
                  <button type="button" className={s.btn} onClick={() => idz("profil")}>
                    Ustaw preferencje
                  </button>
                </PustoIkona>
              )}
            </div>
          </div>
        )}

        {z === "aplikacje" && <Aplikacje zgloszenia={zgloszenia} teraz={teraz} />}

        {z === "ulubione" && (
          <Sekcja tytul="Ulubione" opis={zapisane.length ? `${zapisane.length} zapisanych ofert` : "Brak zapisanych ofert"}>
            {zapisane.length ? (
              <div className={s.lista}>
                {zapisane.map((o) => (
                  <Karta key={o.id} o={o} href={`/praca/${o.id}`} teraz={teraz} />
                ))}
              </div>
            ) : (
              <PustoIkona d={IK.ulubione} tytul="Nie masz jeszcze ulubionych ofert" opis="Zapisuj oferty sercem, a łatwo do nich wrócisz i porównasz je ze sobą.">
                <a className={`${s.btn} ${s.btnPomarancz}`} href="/praca">
                  Wyszukaj oferty pracy
                </a>
              </PustoIkona>
            )}
          </Sekcja>
        )}

        {z === "przegladane" && <Przegladane teraz={teraz} />}

        {z === "alerty" && <Alerty alerty={alerty} />}

        {z === "profil" && <Profil konto={konto} />}

        {z === "cv" && <CV konto={konto} />}

        {z === "komunikacja" && <Komunikacja konto={konto} />}
      </main>
    </div>
  );
}

function Sekcja({ tytul, opis, children }: { tytul: string; opis?: string; children: React.ReactNode }) {
  return (
    <div className={s.ustLista}>
      <div>
        <h1 className={s.ofertaH}>{tytul}</h1>
        {opis && <p className={s.kontoP}>{opis}</p>}
      </div>
      {children}
    </div>
  );
}

function PustoIkona({ d, tytul, opis, children }: { d: string; tytul: string; opis: string; children?: React.ReactNode }) {
  return (
    <div className={s.pustoIkona}>
      <span>
        <Ikona d={d} />
      </span>
      <h2>{tytul}</h2>
      <p>{opis}</p>
      {children}
    </div>
  );
}

function Aplikacje({ zgloszenia, teraz }: { zgloszenia: (Zgloszenie & { oferta: OfertaLista | null })[]; teraz: number }) {
  const [filtr, setFiltr] = useState("");
  const widoczne = zgloszenia.filter((x) => !filtr || x.status === filtr);
  const zakladki: [string, string][] = [
    ["", "Wszystkie"],
    ["nowe", "Wysłane"],
    ["obejrzane", "Obejrzane"],
    ["zaproszone", "Rozmowy"],
    ["odrzucone", "Odrzucone"],
  ];
  return (
    <Sekcja tytul="Aplikacje" opis="Przegląd wszystkich Twoich zgłoszeń">
      <div className={s.chipy}>
        {zakladki.map(([k, n]) => (
          <button type="button" key={k} className={`${s.chip} ${filtr === k ? s.chipOn : ""}`} onClick={() => setFiltr(k)}>
            {n} <span className={s.chipIle}>{k ? zgloszenia.filter((x) => x.status === k).length : zgloszenia.length}</span>
          </button>
        ))}
      </div>
      {widoczne.length === 0 ? (
        <PustoIkona d={IK.aplikacje} tytul="Brak zgłoszeń" opis="Znajdź ofertę i kliknij „Aplikuj”. Zgłoszenie pojawi się tutaj ze statusem od pracodawcy.">
          <a className={s.btn} href="/praca">
            Zobacz oferty
          </a>
        </PustoIkona>
      ) : (
        <div className={s.lista}>
          {widoczne.map((x) => {
            const [nazwa, klasa] = STATUS_Z[x.status] ?? ["Wysłane", s.statusCzeka];
            return (
              <div className={s.aplikacjaWiersz} key={x.id}>
                {x.oferta ? <Karta o={x.oferta} href={`/praca/${x.oferta.id}`} teraz={teraz} /> : <div className={s.pusto}>Oferta już nieaktualna</div>}
                <div className={s.aplikacjaBok}>
                  <span className={`${s.statusPig} ${klasa}`}>{nazwa}</span>
                  <small>
                    Zaaplikowane
                    <br />
                    <b>{formatDaty(x.created_at)}</b>
                  </small>
                  {x.cv_nazwa && <small>CV: {x.cv_nazwa}</small>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Sekcja>
  );
}

function Przegladane({ teraz }: { teraz: number }) {
  const [oferty, setOferty] = useState<OfertaLista[] | null>(null);
  useEffect(() => {
    const ids = czytajPrzegladane();
    if (!ids.length) return setOferty([]);
    fetch(`/api/bruno/praca/lista?ids=${encodeURIComponent(ids.join(","))}`)
      .then((r) => r.json())
      .then((j) => setOferty(j.oferty ?? []))
      .catch(() => setOferty([]));
  }, []);
  return (
    <Sekcja tytul="Ostatnio przeglądane" opis={oferty ? `Ostatnio przeglądane oferty: ${oferty.length}` : "Wczytuję…"}>
      {oferty && oferty.length === 0 ? (
        <PustoIkona d={IK.przegladane} tytul="Nic tu jeszcze nie ma" opis="Oferty, które otworzysz, pojawią się tutaj." />
      ) : (
        <div className={s.lista}>
          {(oferty ?? []).map((o) => (
            <Karta key={o.id} o={o} href={`/praca/${o.id}`} teraz={teraz} />
          ))}
        </div>
      )}
    </Sekcja>
  );
}

function Alerty({ alerty }: { alerty: Alert[] }) {
  const [lista, setLista] = useState(alerty);
  return (
    <Sekcja tytul="Zapisane alerty" opis="Wyszukiwania, o których dostajesz powiadomienia mailem">
      {lista.length === 0 ? (
        <PustoIkona d={IK.alerty} tytul="Brak zapisanych alertów" opis="Na liście ofert ustaw filtry i kliknij „Powiadom mnie”.">
          <a className={s.btn} href="/praca">
            Przejdź do ofert
          </a>
        </PustoIkona>
      ) : (
        <div className={s.panelLista}>
          {lista.map((a) => (
            <div className={s.panelWiersz} key={a.id}>
              <div className={s.panelWierszTresc}>
                <h3>{a.opis ?? "Oferty dla handlowców"}</h3>
                <p>zapisany {formatDaty(a.created_at)}</p>
              </div>
              <div className={s.panelAkcje}>
                <button
                  type="button"
                  className={s.panelUsun}
                  onClick={async () => {
                    await fetch("/api/bruno/praca/alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ akcja: "usun", id: a.id }) });
                    setLista(lista.filter((x) => x.id !== a.id));
                  }}
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sekcja>
  );
}

/** Karta z formularzem zapisującym jedną sekcję profilu. */
function KartaForm({ sekcja, tytul, ikona, children }: { sekcja: string; tytul: string; ikona: string; children: React.ReactNode }) {
  const [stan, setStan] = useState<"" | "wysylam" | "ok">("");
  const [blad, setBlad] = useState("");
  return (
    <form
      className={s.ustKarta}
      onSubmit={async (e) => {
        e.preventDefault();
        setBlad("");
        setStan("wysylam");
        const f = new FormData(e.currentTarget);
        f.set("sekcja", sekcja);
        const odp = await fetch("/api/bruno/praca/konto/profil", { method: "POST", body: f }).catch(() => null);
        const j = await odp?.json().catch(() => null);
        if (!odp?.ok || !j?.ok) {
          setBlad(j?.blad ?? "Nie udało się zapisać.");
          setStan("");
          return;
        }
        setStan("ok");
        setTimeout(() => setStan(""), 2500);
      }}
    >
      <div className={s.ustGlowa}>
        <span className={s.ustIkona} style={{ background: "#f3f3f1" }}>
          <Ikona d={ikona} />
        </span>
        <div>
          <h2 className={s.wersaliki}>{tytul}</h2>
        </div>
      </div>
      {children}
      {blad && <p className={s.blad}>{blad}</p>}
      <div className={s.ustStopka}>
        <button type="submit" className={s.btn} disabled={stan === "wysylam"}>
          {stan === "wysylam" ? "Zapisuję…" : stan === "ok" ? "Zapisane ✓" : "Zapisz"}
        </button>
      </div>
    </form>
  );
}
const Pole = ({ etykieta, opcj, children }: { etykieta: string; opcj?: boolean; children: React.ReactNode }) => (
  <label className={s.pole}>
    <span>
      {etykieta} {opcj && <em className={s.opcjonalne}>nieobowiązkowe</em>}
    </span>
    {children}
  </label>
);

function Profil({ konto }: { konto: KontoPraca }) {
  const [tab, setTab] = useState<"przeglad" | "preferencje">("przeglad");
  return (
    <Sekcja tytul="Mój profil" opis="Uzupełnij dane, żeby szybciej aplikować i dostawać pasujące oferty">
      <div className={s.panelZakladki} role="tablist">
        {(
          [
            ["przeglad", "Przegląd"],
            ["preferencje", "Preferencje pracy"],
          ] as const
        ).map(([k, n]) => (
          <button type="button" role="tab" aria-selected={tab === k} key={k} className={tab === k ? s.panelZakladkaOn : ""} onClick={() => setTab(k)}>
            {n}
          </button>
        ))}
      </div>
      {tab === "przeglad" ? (
        <>
          <KartaForm sekcja="osobowe" tytul="Dane osobowe" ikona={IK.profil}>
            <div className={s.polaSiatka}>
              <Pole etykieta="Imię i nazwisko">
                <input name="imie" defaultValue={konto.imie ?? ""} autoComplete="name" />
              </Pole>
              <Pole etykieta="Telefon">
                <input name="telefon" type="tel" defaultValue={konto.telefon ?? ""} autoComplete="tel" />
              </Pole>
            </div>
            <div className={s.polaSiatka}>
              <Pole etykieta="Miasto">
                <input name="miasto" defaultValue={konto.miasto ?? ""} placeholder="np. Warszawa" />
              </Pole>
              <Pole etykieta="E-mail">
                <input value={konto.email} disabled readOnly />
              </Pole>
            </div>
          </KartaForm>
          <KartaForm sekcja="zawodowy" tytul="Profil zawodowy" ikona={IK.cv}>
            <Pole etykieta="Stanowisko">
              <input name="tytul" defaultValue={konto.tytul ?? ""} placeholder="np. Przedstawiciel handlowy B2B" />
            </Pole>
            <Pole etykieta="LinkedIn" opcj>
              <input name="linkedin" defaultValue={konto.linkedin ?? ""} placeholder="linkedin.com/in/anna-kowalska" />
            </Pole>
            <Pole etykieta="O mnie">
              <textarea name="o_mnie" rows={4} defaultValue={konto.o_mnie ?? ""} placeholder="Od 3 lat sprzedaję B2B, głównie przez telefon. Szukam pracy w OZE." />
            </Pole>
          </KartaForm>
        </>
      ) : (
        <KartaForm sekcja="preferencje" tytul="Preferencje pracy" ikona="M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3S7.5 5.8 7.5 7.5 9.5 10 12 10.5s4.5 1.3 4.5 3.2-2 3.3-4.5 3.3-4.5-1.3-4.5-3">
          <p className={s.drobny}>Na tej podstawie pokazujemy „Oferty dla Ciebie” na pulpicie.</p>
          <div className={s.polaSiatka}>
            <Pole etykieta="Szukane stanowisko">
              <input name="pref_stanowisko" defaultValue={konto.pref_stanowisko ?? ""} placeholder="np. przedstawiciel handlowy" />
            </Pole>
            <Pole etykieta="Miasto albo województwo">
              <input name="pref_miasto" defaultValue={konto.pref_miasto ?? ""} placeholder="np. Poznań" />
            </Pole>
          </div>
          <div className={s.polaSiatka3}>
            <Pole etykieta="Branża">
              <select name="pref_branza" defaultValue={konto.pref_branza ?? ""}>
                <option value="">Dowolna</option>
                {BRANZE.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Pole>
            <Pole etykieta="Tryb pracy">
              <select name="pref_tryb" defaultValue={konto.pref_tryb ?? ""}>
                <option value="">Dowolny</option>
                {TRYBY.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Pole>
            <Pole etykieta="Min. wynagrodzenie (zł)" opcj>
              <input name="pref_pensja" inputMode="numeric" defaultValue={konto.pref_pensja ?? ""} placeholder="7000" />
            </Pole>
          </div>
        </KartaForm>
      )}
    </Sekcja>
  );
}

function CV({ konto }: { konto: KontoPraca }) {
  const [plik, setPlik] = useState<File | null>(null);
  const [stan, setStan] = useState("");
  const [blad, setBlad] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  async function wyslij(f: File) {
    setBlad("");
    setStan("wysylam");
    const d = new FormData();
    d.set("sekcja", "cv");
    d.set("plik", f);
    const odp = await fetch("/api/bruno/praca/konto/profil", { method: "POST", body: d }).catch(() => null);
    const j = await odp?.json().catch(() => null);
    if (!odp?.ok || !j?.ok) {
      setBlad(j?.blad ?? "Nie udało się wgrać CV.");
      setStan("");
      return;
    }
    location.reload();
  }
  return (
    <Sekcja tytul="CV" opis="Twoje CV dołączymy do każdego zgłoszenia przez „Aplikuj”">
      {konto.cv_nazwa && !plik ? (
        <div className={s.ustKarta}>
          <div className={s.plikWybrany}>
            <span className={s.plikIkona} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M7 3h7l4 4v14H7ZM14 3v4h4" />
              </svg>
            </span>
            <span className={s.plikNazwa}>
              <b>{konto.cv_nazwa}</b>
              <small>
                <a href="/api/bruno/praca/cv?moje=1" target="_blank">
                  Otwórz
                </a>
              </small>
            </span>
            <button type="button" className={`${s.btn} ${s.btnJasny}`} onClick={() => ref.current?.click()}>
              Zmień
            </button>
          </div>
        </div>
      ) : (
        <PustoIkona d="M3 7h6l2 2h10v10H3Z" tytul={stan === "wysylam" ? "Wgrywam…" : "Brak dokumentów CV"} opis="Wgraj swoje CV (PDF, DOC albo DOCX, do 4 MB).">
          <button type="button" className={`${s.btn} ${s.btnJasny}`} onClick={() => ref.current?.click()} disabled={stan === "wysylam"}>
            Wgraj CV
          </button>
        </PustoIkona>
      )}
      {blad && <p className={s.blad}>{blad}</p>}
      <input
        ref={ref}
        type="file"
        accept=".pdf,.doc,.docx,.odt,.rtf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setPlik(f);
            wyslij(f);
          }
        }}
      />
    </Sekcja>
  );
}

function Komunikacja({ konto }: { konto: KontoPraca }) {
  const [oferty, setOferty] = useState(konto.zgoda_oferty);
  const [marketing, setMarketing] = useState(konto.zgoda_marketing);
  async function zapisz(o: boolean, m: boolean) {
    const f = new FormData();
    f.set("sekcja", "zgody");
    if (o) f.set("zgoda_oferty", "on");
    if (m) f.set("zgoda_marketing", "on");
    await fetch("/api/bruno/praca/konto/profil", { method: "POST", body: f });
  }
  const wiersze: [string, string, boolean, (v: boolean) => void][] = [
    ["Oferty dla Ciebie", "Chcę dostawać e-maile z ofertami dopasowanymi do moich preferencji i zapisanych alertów.", oferty, (v) => (setOferty(v), zapisz(v, marketing))],
    ["Porady i trening", "Chcę dostawać od SalesBruno.pl porady o sprzedaży i informacje o treningu z AI.", marketing, (v) => (setMarketing(v), zapisz(oferty, v))],
  ];
  return (
    <Sekcja tytul="Preferencje komunikacji" opis="Zmiany zapisują się od razu">
      <div className={s.zgodyLista}>
        {wiersze.map(([t, o, v, ustaw]) => (
          <label className={s.zgodaWiersz} key={t}>
            <span>
              <b>{t}</b>
              <small>{o}</small>
            </span>
            <span className={s.przelacznikRzad}>
              <input type="checkbox" checked={v} onChange={(e) => ustaw(e.target.checked)} />
              <span className={s.suwak} />
            </span>
          </label>
        ))}
      </div>
    </Sekcja>
  );
}
