"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OfertaLista as Oferta } from "@/lib/bruno/praca/oferty";
import Karta, { useZapisane } from "./karta";
import s from "./praca.module.css";
import { KartaBruno, KartaFirmy, krotkaFirma } from "./wspolne";

// 17.10 v3 (USER_001: „nowoczesny portal pracy dla handlowców”, wzór Pracuj.pl + RocketJobs):
// wyszukiwarka z podpowiedziami i liczbą ofert, branże z ikonami, filtry z boku (chipy z liczbami),
// sortowanie, „Powiadom mnie o nowych ofertach”, zapisane oferty (serce), na telefonie filtry w arkuszu.
const NA_STRONE = 30;
const DZIEN = 86_400_000;

type Pole = "poziom" | "umowa" | "wymiar" | "tryb";
const FILTRY: { pole: Pole; nazwa: string; kolejnosc: string[] }[] = [
  {
    pole: "poziom",
    nazwa: "Poziom stanowiska",
    kolejnosc: ["Praktykant / stażysta", "Asystent", "Młodszy specjalista (junior)", "Specjalista (mid / regular)", "Starszy specjalista (senior)", "Ekspert", "Kierownik / koordynator", "Menedżer", "Dyrektor"],
  },
  { pole: "tryb", nazwa: "Tryb pracy", kolejnosc: ["Praca stacjonarna", "Praca hybrydowa", "Praca zdalna", "Praca mobilna"] },
  { pole: "umowa", nazwa: "Rodzaj umowy", kolejnosc: ["Umowa o pracę", "Umowa zlecenie", "Kontrakt B2B", "Umowa agencyjna"] },
  { pole: "wymiar", nazwa: "Wymiar pracy", kolejnosc: ["Pełny etat", "Część etatu", "Dodatkowa / tymczasowa"] },
];
const DATY: [string, number][] = [
  ["Od wczoraj", 1],
  ["Ostatni tydzień", 7],
  ["Ostatnie 2 tygodnie", 14],
  ["Ostatni miesiąc", 31],
];
const SORTY = { nowe: "Najnowsze", wygasa: "Wygasają najszybciej", kwota: "Z wynagrodzeniem" } as const;
type Sort = keyof typeof SORTY;

// Ikony branż (kreska 1.8, jak reszta).
const IKONY_BRANZ: Record<string, string> = {
  Wszystkie: "M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z",
  Ubezpieczenia: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z",
  "Banki i finanse": "M3 10h18L12 4ZM5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20h18",
  "Energetyka i OZE": "M13 2 4 14h7l-1 8 9-12h-7Z",
  Telekomunikacja: "M5 12a10 10 0 0 1 14 0M8 15a5.5 5.5 0 0 1 8 0M12 19h.01",
  "Farmacja i medycyna": "M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7Z",
  Motoryzacja: "M5 16h14M6 16l1.5-5h9L18 16M7 19a1.5 1.5 0 1 0 0-3M17 19a1.5 1.5 0 1 0 0-3M3 16v3h18v-3",
  "Budownictwo i wnętrza": "M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6",
  "FMCG i spożywcze": "M6 6h15l-2 9H8L6 3H3M9 20a1 1 0 1 0 0-2M18 20a1 1 0 1 0 0-2",
  "IT i technologie": "M4 5h16v11H4ZM2 20h20M10 16v4M14 16v4",
  Nieruchomości: "M3 11 12 4l9 7M6 9v11h12V9M10 20v-5h4v5",
  "Przemysł i produkcja": "M3 21V10l6 4V10l6 4V5h6v16Z",
  "Edukacja i szkolenia": "M2 9l10-5 10 5-10 5ZM6 11v5c3 2 9 2 12 0v-5",
  Inne: "M5 12h.01M12 12h.01M19 12h.01",
};
const Ikona = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** Krótka nazwa stanowiska do podpowiedzi: bez form żeńskich i dopisków. */
function rdzen(t: string) {
  return t
    .split(/\s+\/\s+|\s+[–-]\s+/)[0]
    .replace(/\s*\((k\/m|m\/k|k\/m\/n|m,k,n|m\/k\/os\.?)\)/gi, "")
    .replace(/\s+k\/m$/i, "")
    .trim();
}

export default function Lista({ oferty, cena, teraz, podglad }: { oferty: Oferta[]; cena: number; teraz: number; podglad: boolean }) {
  const [q, setQ] = useState("");
  const [gdzie, setGdzie] = useState("");
  const [podpowiedzi, setPodpowiedzi] = useState<"q" | "gdzie" | null>(null);
  const [branza, setBranza] = useState("");
  const [b2b, setB2b] = useState(false);
  const [zKwota, setZKwota] = useState(false);
  const [minKwota, setMinKwota] = useState("");
  const [dni, setDni] = useState(0);
  const [wybrane, setWybrane] = useState<Record<Pole, string[]>>({ poziom: [], umowa: [], wymiar: [], tryb: [] });
  const [tylkoZapisane, setTylkoZapisane] = useState(false);
  const [sort, setSort] = useState<Sort>("nowe");
  const [pokazFiltry, setPokazFiltry] = useState(false);
  const [alert, setAlert] = useState(false);
  const [ile, setIle] = useState(NA_STRONE);
  const [zapisane] = useZapisane();
  const szukajRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!podpowiedzi) return;
    const zamknij = (e: MouseEvent) => !szukajRef.current?.contains(e.target as Node) && setPodpowiedzi(null);
    document.addEventListener("mousedown", zamknij);
    return () => document.removeEventListener("mousedown", zamknij);
  }, [podpowiedzi]);
  useEffect(() => {
    document.body.style.overflow = alert ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [alert]);

  type Bez = Pole | "branza" | "dni" | "kwota";
  const pasuje = useMemo(() => {
    const fraza = q.trim().toLowerCase();
    const miejsce = gdzie.trim().toLowerCase();
    const min = Number(minKwota.replace(/\D/g, "")) || 0;
    return (o: Oferta, bez?: Bez) =>
      (bez === "branza" || !branza || o.branza === branza) &&
      (!b2b || o.b2b) &&
      (!tylkoZapisane || zapisane.includes(o.id)) &&
      (bez === "kwota" || ((!zKwota || o.pensjaMin || o.pensjaMax) && (!min || (o.pensjaMax ?? o.pensjaMin ?? 0) >= min))) &&
      (bez === "dni" || !dni || teraz - Date.parse(o.dodano) <= dni * DZIEN) &&
      (!fraza || `${o.stanowisko} ${o.firma} ${krotkaFirma(o.firma)} ${o.umiejetnosci.join(" ")}`.toLowerCase().includes(fraza)) &&
      (!miejsce || `${o.miasto} ${o.wojewodztwo}`.toLowerCase().includes(miejsce)) &&
      FILTRY.every(({ pole }) => pole === bez || wybrane[pole].length === 0 || (o[pole] !== null && wybrane[pole].includes(o[pole] as string)));
  }, [q, gdzie, branza, b2b, zKwota, minKwota, dni, wybrane, tylkoZapisane, zapisane, teraz]);

  const widoczne = useMemo(() => {
    const l = oferty.filter((o) => pasuje(o));
    if (sort === "wygasa") l.sort((a, b) => a.wazneDo.localeCompare(b.wazneDo));
    else if (sort === "kwota") l.sort((a, b) => Number(!!(b.pensjaMax || b.pensjaMin)) - Number(!!(a.pensjaMax || a.pensjaMin)) || b.dodano.localeCompare(a.dodano));
    else l.sort((a, b) => b.dodano.localeCompare(a.dodano));
    return l;
  }, [oferty, pasuje, sort]);

  const policz = (bez: Bez, klucz: (o: Oferta) => string | null) => {
    const m = new Map<string, number>();
    for (const o of oferty) {
      const k = klucz(o);
      if (k && pasuje(o, bez)) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const branze = useMemo(() => {
    const m = policz("branza", (o) => o.branza);
    return [...m].sort((a, b) => (a[0] === "Inne" ? 1 : b[0] === "Inne" ? -1 : b[1] - a[1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oferty, pasuje]);
  const wszystkieWBranzach = branze.reduce((a, [, n]) => a + n, 0);

  // Podpowiedzi jak RocketJobs: stanowiska i firmy z liczbą ofert / miasta z liczbą ofert.
  const listaPodpowiedzi = useMemo(() => {
    const fraza = (podpowiedzi === "q" ? q : gdzie).trim().toLowerCase();
    // Bez rozróżniania wielkości liter: „Przedstawiciel handlowy” i „Przedstawiciel Handlowy” to jedno.
    const m = new Map<string, [string, number]>();
    const dodaj = (k: string) => {
      const kl = k.toLowerCase();
      const b = m.get(kl);
      m.set(kl, [b?.[0] ?? k, (b?.[1] ?? 0) + 1]);
    };
    for (const o of oferty) {
      if (podpowiedzi === "q") {
        for (const k of [rdzen(o.stanowisko), krotkaFirma(o.firma)]) if (!fraza || k.toLowerCase().includes(fraza)) dodaj(k);
      } else {
        for (const k of [o.miasto, o.wojewodztwo]) if (k && (!fraza || k.toLowerCase().includes(fraza))) dodaj(k);
      }
    }
    return [...m.values()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [oferty, podpowiedzi, q, gdzie]);

  const przelacz = (pole: Pole, v: string) => {
    setWybrane((w) => ({ ...w, [pole]: w[pole].includes(v) ? w[pole].filter((x) => x !== v) : [...w[pole], v] }));
    setIle(NA_STRONE);
  };
  const ileFiltrow = FILTRY.reduce((a, { pole }) => a + wybrane[pole].length, 0) + Number(b2b) + Number(zKwota) + Number(!!minKwota) + Number(!!dni);
  const wyczysc = () => {
    setWybrane({ poziom: [], umowa: [], wymiar: [], tryb: [] });
    setB2b(false);
    setZKwota(false);
    setMinKwota("");
    setDni(0);
  };
  const link = (id: string) => `/praca/${id}${podglad ? "?podglad=wszystkie" : ""}`;

  const panelFiltrow = (
    <>
      <div className={s.filtrySekcja}>
        <h3>Wynagrodzenie</h3>
        <label className={s.przelacznikRzad}>
          <input type="checkbox" checked={zKwota} onChange={(e) => setZKwota(e.target.checked)} />
          <span className={s.suwak} />
          Pokaż tylko z wynagrodzeniem
        </label>
        <label className={s.kwotaPole}>
          <input inputMode="numeric" placeholder="Minimalne miesięczne zarobki" value={minKwota} onChange={(e) => setMinKwota(e.target.value)} />
          <span>PLN</span>
        </label>
        <p className={s.drobny}>Brutto / mies. (UoP) lub netto + VAT (B2B)</p>
      </div>
      <div className={s.filtrySekcja}>
        <h3>Data publikacji</h3>
        <div className={s.chipy}>
          {DATY.map(([n, d]) => {
            const ileD = oferty.filter((o) => pasuje(o, "dni") && teraz - Date.parse(o.dodano) <= d * DZIEN).length;
            return (
              <button type="button" key={n} className={`${s.chip} ${dni === d ? s.chipOn : ""}`} onClick={() => setDni(dni === d ? 0 : d)}>
                {n} <span className={s.chipIle}>{ileD}</span>
              </button>
            );
          })}
        </div>
      </div>
      {FILTRY.map(({ pole, nazwa, kolejnosc }) => {
        const m = policz(pole, (o) => o[pole] as string | null);
        const opcje = kolejnosc.filter((v) => m.has(v) || wybrane[pole].includes(v));
        return (
          <div className={s.filtrySekcja} key={pole}>
            <h3>{nazwa}</h3>
            {opcje.length === 0 ? (
              <p className={s.drobny}>Firmy jeszcze tego nie podały</p>
            ) : (
              <div className={s.chipy}>
                {opcje.map((v) => (
                  <button type="button" key={v} className={`${s.chip} ${wybrane[pole].includes(v) ? s.chipOn : ""}`} onClick={() => przelacz(pole, v)}>
                    {v} <span className={s.chipIle}>{m.get(v) ?? 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className={s.filtrySekcja}>
        <h3>Rodzaj sprzedaży</h3>
        <div className={s.chipy}>
          <button type="button" className={`${s.chip} ${b2b ? s.chipOn : ""}`} onClick={() => setB2b(!b2b)}>
            Sprzedaż B2B <span className={s.chipIle}>{oferty.filter((o) => o.b2b).length}</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className={s.szukajBar} ref={szukajRef}>
        <label className={s.szukajPole}>
          <Ikona d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5" />
          <input
            type="search"
            placeholder="Stanowisko, firma, umiejętność"
            value={q}
            onFocus={() => setPodpowiedzi("q")}
            onChange={(e) => {
              setQ(e.target.value);
              setPodpowiedzi("q");
              setIle(NA_STRONE);
            }}
            aria-label="Stanowisko, firma, umiejętność"
          />
        </label>
        <label className={s.szukajPole}>
          <Ikona d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <input
            type="search"
            placeholder="Lokalizacja"
            value={gdzie}
            onFocus={() => setPodpowiedzi("gdzie")}
            onChange={(e) => {
              setGdzie(e.target.value);
              setPodpowiedzi("gdzie");
              setIle(NA_STRONE);
            }}
            aria-label="Lokalizacja"
          />
        </label>
        <button type="button" className={s.szukajBtn} onClick={() => setPodpowiedzi(null)}>
          <Ikona d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5" />
          <span>Szukaj</span>
        </button>
        {podpowiedzi && listaPodpowiedzi.length > 0 && (
          <div className={`${s.podpowiedzi} ${podpowiedzi === "gdzie" ? s.podpowiedziPrawo : ""}`}>
            <p className={s.podpowiedziH}>{podpowiedzi === "q" ? "Stanowisko i firma" : "Miasto i województwo"}</p>
            {listaPodpowiedzi.map(([k, n]) => (
              <button
                type="button"
                key={k}
                className={s.podpowiedz1}
                onClick={() => {
                  if (podpowiedzi === "q") setQ(k);
                  else setGdzie(k);
                  setPodpowiedzi(null);
                }}
              >
                <span>{k}</span>
                <span className={s.podpowiedzIle}>
                  {n} {n === 1 ? "oferta" : n < 5 ? "oferty" : "ofert"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 17.10 (USER_001): filtry nie z boku, tylko przycisk „Filtry” pod wyszukiwarką, panel rozwija się pod nią. */}
      <div className={s.pasekNarzedzi}>
        <button type="button" className={`${s.narzedzie} ${pokazFiltry || ileFiltrow ? s.narzedzieOn : ""}`} onClick={() => setPokazFiltry(!pokazFiltry)} aria-expanded={pokazFiltry}>
          <Ikona d="M4 6h16M7 12h10M10 18h4" />
          Filtry{ileFiltrow > 0 ? ` (${ileFiltrow})` : ""}
        </button>
        <button type="button" className={s.narzedzie} onClick={() => setAlert(true)}>
          <Ikona d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4ZM10 21h4" />
          Powiadom mnie
        </button>
        <button type="button" className={`${s.narzedzie} ${tylkoZapisane ? s.narzedzieOn : ""}`} onClick={() => setTylkoZapisane(!tylkoZapisane)} aria-pressed={tylkoZapisane}>
          <Ikona d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.1 4 4 7.2 4c2 0 3.6 1.1 4.8 2.7C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7.1 21.2 10.6 19.5 15.4 12 20 12 20Z" />
          Zapisane {zapisane.length > 0 && `(${zapisane.length})`}
        </button>
        <label className={s.sortuj}>
          <span>Sortuj:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {Object.entries(SORTY).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pokazFiltry && (
        <div className={s.panelFiltrow}>
          <div className={s.panelSiatka}>{panelFiltrow}</div>
          <div className={s.panelStopka}>
            {ileFiltrow > 0 && (
              <button type="button" className={s.wyczysc} onClick={wyczysc}>
                Wyczyść filtry ({ileFiltrow})
              </button>
            )}
            <button type="button" className={s.btn} onClick={() => setPokazFiltry(false)}>
              Pokaż {widoczne.length.toLocaleString("pl-PL")} ofert
            </button>
          </div>
        </div>
      )}

      <div className={s.branze} role="tablist" aria-label="Branża">
        {[["Wszystkie", wszystkieWBranzach] as [string, number], ...branze].map(([n, ileB]) => {
          const on = n === "Wszystkie" ? !branza : branza === n;
          return (
            <button type="button" role="tab" aria-selected={on} key={n} className={`${s.branza} ${on ? s.branzaOn : ""}`} onClick={() => setBranza(n === "Wszystkie" || branza === n ? "" : n)}>
              <Ikona d={IKONY_BRANZ[n] ?? IKONY_BRANZ.Inne} />
              <span className={s.branzaNazwa}>{n}</span>
              <span className={s.branzaIle}>{ileB}</span>
            </button>
          );
        })}
      </div>

      <div className={s.listaPelna}>
        <p className={s.licznik}>
          <b>{widoczne.length.toLocaleString("pl-PL")}</b> {widoczne.length === 1 ? "oferta" : "ofert"} pracy w sprzedaży
        </p>
        {oferty.length === 0 ? (
          <div className={s.pusto}>
            <h2>Pierwsze oferty już wkrótce</h2>
            <p>Zbieramy ogłoszenia firm, które szukają handlowców. W międzyczasie poćwicz rozmowy sprzedażowe z AI na SalesBruno.pl.</p>
          </div>
        ) : widoczne.length === 0 ? (
          <div className={s.pusto}>
            <h2>{tylkoZapisane ? "Nie masz jeszcze zapisanych ofert" : "Brak ofert dla tych filtrów"}</h2>
            <p>{tylkoZapisane ? "Kliknij serce przy ofercie, żeby ją tu mieć." : "Zmień lokalizację albo usuń część filtrów."}</p>
          </div>
        ) : null}
        {widoczne.slice(0, ile).map((o, i) => (
          <div key={o.id} style={{ display: "contents" }}>
            <Karta o={o} href={link(o.id)} teraz={teraz} />
            {i === 3 && <KartaBruno />}
          </div>
        ))}
        {widoczne.length > ile && (
          <button type="button" className={s.wiecej} onClick={() => setIle(ile + NA_STRONE)}>
            Pokaż więcej ofert
          </button>
        )}
      </div>

      {alert && <OknoAlertu zamknij={() => setAlert(false)} filtr={{ q, gdzie, branza, ...wybrane }} />}
    </>
  );
}

/** „Powiadom mnie o nowych ofertach” (RocketJobs: „Zapisz wyszukiwanie”). Na razie mail do USER_001. */
function OknoAlertu({ zamknij, filtr }: { zamknij: () => void; filtr: Record<string, unknown> }) {
  const [stan, setStan] = useState<"" | "wysylam" | "gotowe">("");
  const [blad, setBlad] = useState("");
  return (
    <div className={s.tlo} onClick={(e) => e.target === e.currentTarget && zamknij()}>
      {stan === "gotowe" ? (
        <div className={s.okno}>
          <h2 className={s.oknoH}>Gotowe!</h2>
          <p className={s.oknoP}>Nowe oferty dla handlowców wyślemy Ci na maila w każdy poniedziałek.</p>
          <div className={s.oknoAkcje}>
            <button type="button" className={s.btn} onClick={zamknij}>
              Wróć do ofert
            </button>
          </div>
        </div>
      ) : (
        <form
          className={s.okno}
          onSubmit={async (e) => {
            e.preventDefault();
            setBlad("");
            setStan("wysylam");
            const f = new FormData(e.currentTarget);
            const odp = await fetch("/api/bruno/praca/alert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: f.get("email"), zgoda: f.get("zgoda") === "on", filtr }),
            }).catch(() => null);
            const j = await odp?.json().catch(() => null);
            if (!odp?.ok || !j?.ok) {
              setBlad(j?.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
              setStan("");
              return;
            }
            setStan("gotowe");
          }}
        >
          <h2 className={s.oknoH}>Powiadom mnie o nowych ofertach</h2>
          <p className={s.oknoP}>Raz w tygodniu, tylko oferty dla handlowców pasujące do Twoich filtrów.</p>
          <label className={s.pole}>
            <span>E-mail</span>
            <input name="email" type="email" required autoComplete="email" placeholder="anna@gmail.com" />
          </label>
          <label className={s.zgoda}>
            <input type="checkbox" name="zgoda" required />
            <span>Chcę dostawać maile z ofertami pracy i poradami od Bruno AI. Wypiszę się jednym kliknięciem.</span>
          </label>
          {blad && <p className={s.blad}>{blad}</p>}
          <div className={s.oknoAkcje}>
            <button type="button" className={`${s.btn} ${s.btnJasny}`} onClick={zamknij}>
              Wróć
            </button>
            <button type="submit" className={s.btn} disabled={stan === "wysylam"}>
              {stan === "wysylam" ? "Zapisuję…" : "Powiadamiaj mnie"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
