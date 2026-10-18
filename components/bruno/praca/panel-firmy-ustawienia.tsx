"use client";

import { useRef, useState } from "react";
import type { KontoPraca } from "@/lib/bruno/praca/konta";
import { WZOR_PRZYSZLE, wzorKlauzuli } from "@/lib/bruno/praca/klauzule";
import { Wyloguj } from "./panel-wspolne";
import s from "./praca.module.css";

// 17.10 (USER_001, wzór RocketJobs): Profil firmy (logo, nazwa w ogłoszeniach, opis, dane do faktury, klauzule RODO),
// Moje konto (dane osoby, hasło), Cennik, Kontakt. Każda karta zapisuje się osobno (/api/bruno/praca/konto/profil, „sekcja”).

async function zapisz(sekcja: string, f: FormData) {
  f.set("sekcja", sekcja);
  const odp = await fetch("/api/bruno/praca/konto/profil", { method: "POST", body: f }).catch(() => null);
  const j = await odp?.json().catch(() => null);
  return odp?.ok && j?.ok ? { ok: true as const, j } : { ok: false as const, blad: (j?.blad as string) ?? "Nie udało się zapisać." };
}

function Karta({ ikona, kolor, tytul, opis, sekcja, children, poZapisie }: { ikona: string; kolor: string; tytul: string; opis: string; sekcja: string; children: React.ReactNode; poZapisie?: () => void }) {
  const [stan, setStan] = useState<"" | "wysylam" | "ok">("");
  const [blad, setBlad] = useState("");
  return (
    <form
      className={s.ustKarta}
      onSubmit={async (e) => {
        e.preventDefault();
        setBlad("");
        setStan("wysylam");
        const w = await zapisz(sekcja, new FormData(e.currentTarget));
        if (!w.ok) {
          setBlad(w.blad);
          setStan("");
          return;
        }
        setStan("ok");
        poZapisie?.();
        setTimeout(() => setStan(""), 2500);
      }}
    >
      <div className={s.ustGlowa}>
        <span className={s.ustIkona} style={{ background: kolor }} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d={ikona} />
          </svg>
        </span>
        <div>
          <h2>{tytul}</h2>
          <p>{opis}</p>
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

export function ProfilFirmy({ konto }: { konto: KontoPraca }) {
  const [logo, setLogo] = useState(konto.logo_url);
  const [podglad, setPodglad] = useState<string | null>(null);
  const plikRef = useRef<HTMLInputElement>(null);
  const [przyszleOn, setPrzyszleOn] = useState(konto.klauzula_przyszle_domyslnie);
  return (
    <div className={s.ustLista}>
      <div>
        <h1 className={`${s.ofertaH} ${s.panelTytul}`}>Profil firmy</h1>
        <p className={s.kontoP}>Zarządzaj informacjami o swojej firmie, danymi do faktury oraz klauzulami.</p>
      </div>

      <Karta
        sekcja="firma"
        kolor="#fff1e4"
        ikona="M4 8h16v12H4ZM9 8V5h6v3"
        tytul="Informacje o firmie"
        opis="Dane widoczne w Twoich ogłoszeniach."
        poZapisie={() => {
          if (podglad) setLogo(podglad);
          location.reload();
        }}
      >
        <div className={s.logoWiersz}>
          <span className={s.logoPodglad}>
            {podglad || logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={podglad ?? logo ?? ""} alt="Logo firmy" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 21V4h10v17M15 9h4v12M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1" />
              </svg>
            )}
          </span>
          <span className={s.logoAkcje}>
            <button type="button" className={`${s.btn} ${s.btnJasny}`} onClick={() => plikRef.current?.click()}>
              {logo ? "Zmień logo" : "Wgraj logo"}
            </button>
            <small>PNG, JPG albo SVG, do 4 MB. Najlepiej kwadrat.</small>
          </span>
          <input
            ref={plikRef}
            name="logo"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPodglad(f ? URL.createObjectURL(f) : null);
            }}
          />
        </div>
        <Pole etykieta="Nazwa w ogłoszeniach">
          <input name="nazwa_wyswietlana" defaultValue={konto.nazwa_wyswietlana ?? ""} placeholder={konto.firma ?? "np. Solar Polska"} />
        </Pole>
        <p className={s.drobny}>Krótka nazwa widoczna dla kandydatów. Pełna nazwa zostaje na fakturach.</p>
        <Pole etykieta="O firmie" opcj>
          <textarea name="o_firmie" rows={4} defaultValue={konto.o_firmie ?? ""} placeholder="Czym się zajmujecie, ilu macie handlowców, co sprzedajecie." />
        </Pole>
        <Pole etykieta="Strona www" opcj>
          <input name="www" defaultValue={konto.www ?? ""} placeholder="www.firma.pl" />
        </Pole>
      </Karta>

      <Karta sekcja="faktura" kolor="#eceefe" ikona="M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5" tytul="Dane do faktury" opis="Dane widoczne na fakturach VAT.">
        <div className={s.polaSiatka}>
          <Pole etykieta="NIP">
            <input name="nip" inputMode="numeric" defaultValue={konto.nip ?? ""} placeholder="1234567890" />
          </Pole>
          <Pole etykieta="Pełna nazwa firmy">
            <input name="fv_nazwa" defaultValue={konto.fv_nazwa ?? konto.firma ?? ""} />
          </Pole>
        </div>
        <div className={s.polaSiatka}>
          <Pole etykieta="Adres">
            <input name="fv_adres" defaultValue={konto.fv_adres ?? ""} placeholder="ul. Przykładowa 1" />
          </Pole>
          <Pole etykieta="Kraj">
            <input name="fv_kraj" defaultValue={konto.fv_kraj ?? "Polska"} />
          </Pole>
        </div>
        <div className={s.polaSiatka}>
          <Pole etykieta="Miasto">
            <input name="fv_miasto" defaultValue={konto.fv_miasto ?? ""} />
          </Pole>
          <Pole etykieta="Kod pocztowy">
            <input name="fv_kod" defaultValue={konto.fv_kod ?? ""} placeholder="00-000" />
          </Pole>
        </div>
      </Karta>

      <Karta sekcja="klauzule" kolor="#fdeaf0" ikona="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7M8 4a2 2 0 0 0-2 2v12M10 9h6M10 13h6" tytul="Klauzule informacyjne" opis="Te informacje dołączymy do Twoich ogłoszeń i formularza „Aplikuj”.">
        <details className={s.ustSekcja} open={!konto.klauzula_rodo}>
          <summary>
            Klauzula informacyjna RODO <span className={s.wymagane}>Wymagana</span>
          </summary>
          <p className={s.drobny}>Uzupełniliśmy wzór Twoimi danymi z faktury. Sprawdź nazwę i adres firmy.</p>
          <textarea name="klauzula_rodo" rows={9} defaultValue={konto.klauzula_rodo ?? wzorKlauzuli(konto)} className={s.ustTextarea} />
        </details>
        <details className={s.ustSekcja} open={!!konto.klauzula_przyszle}>
          <summary>
            Zgoda na wykorzystanie danych w przyszłych rekrutacjach <em className={s.opcjonalne}>nieobowiązkowe</em>
          </summary>
          <label className={s.przelacznikRzad}>
            <input type="checkbox" name="klauzula_przyszle_domyslnie" checked={przyszleOn} onChange={(e) => setPrzyszleOn(e.target.checked)} />
            <span className={s.suwak} />
            Domyślnie zaznaczona w formularzu kandydata
          </label>
          <textarea name="klauzula_przyszle" rows={3} defaultValue={konto.klauzula_przyszle ?? WZOR_PRZYSZLE} className={s.ustTextarea} />
          <p className={s.drobny}>Pusta treść = kandydat nie zobaczy tej zgody.</p>
        </details>
      </Karta>

      <p className={s.ustLinkKonto}>
        Dane osoby i hasło zmienisz w <a href="/praca/panel?z=konto">Moje konto</a>.
      </p>
    </div>
  );
}

export function MojeKonto({ konto }: { konto: KontoPraca }) {
  return (
    <div className={s.ustLista}>
      <h1 className={`${s.ofertaH} ${s.panelTytul}`}>Moje konto</h1>
      <Karta sekcja="konto" kolor="#eef6f0" ikona="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1-4 4-6 8-6s7 2 8 6" tytul="Dane osoby" opis={konto.email}>
        <div className={s.polaSiatka}>
          <Pole etykieta="Imię i nazwisko">
            <input name="imie" defaultValue={konto.imie ?? ""} />
          </Pole>
          <Pole etykieta="Telefon">
            <input name="telefon" type="tel" defaultValue={konto.telefon ?? ""} />
          </Pole>
        </div>
      </Karta>
      <Karta sekcja="haslo" kolor="#f3f3f1" ikona="M6 11h12v10H6ZM8 11V7a4 4 0 0 1 8 0v4" tytul="Hasło" opis="Co najmniej 8 znaków.">
        <div className={s.polaSiatka}>
          <Pole etykieta="Obecne hasło">
            <input name="stare" type="password" required autoComplete="current-password" />
          </Pole>
          <Pole etykieta="Nowe hasło">
            <input name="nowe" type="password" required minLength={8} autoComplete="new-password" />
          </Pole>
        </div>
      </Karta>
      <div className={s.ustLinkKonto}>
        <Wyloguj />
      </div>
    </div>
  );
}

export function Cennik({ cena, pierwszaWykorzystana, linkPromo, linkRegularny }: { cena: number; pierwszaWykorzystana: boolean; linkPromo: string; linkRegularny: string }) {
  // 18.10 (USER_001): cennik w tabelce, nazwy planów w badge.
  const cechy = ["Widoczne na SalesBruno.pl, portalu tylko dla handlowców", "Logo, opis firmy i widełki w ogłoszeniu", "Zgłoszenia z CV na Twój mail i w panelu", "Statusy kandydatów w panelu", "30 dni publikacji, płatność jednorazowa"];
  return (
    <div className={s.ustLista}>
      <div className={s.cennikGlowa}>
        <h1 className={s.ofertaH}>Jedna cena. Bez pakietów.</h1>
        <p className={s.kontoP}>Płacisz raz za 30 dni publikacji. Karta, BLIK albo przelew.</p>
      </div>
      <div className={s.cennikTabelaRamka}>
        <table className={s.cennikTabela}>
          <thead>
            <tr>
              <th />
              <th className={s.cennikKolPromo}>
                <span className={`${s.cennikBadge} ${s.cennikBadgePromo}`}>Pierwsze ogłoszenie</span>
              </th>
              <th>
                <span className={s.cennikBadge}>Każde kolejne ogłoszenie</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className={s.cennikWierszCena}>
              <td>Cena</td>
              <td className={s.cennikKolPromo}>
                <s>200 zł</s> <b>{cena} zł</b> <small>/ 30 dni</small>
                <span className={s.cennikOszcz}>Oszczędzasz {200 - cena} zł</span>
              </td>
              <td>
                <b>200 zł</b> <small>/ 30 dni</small>
              </td>
            </tr>
            {cechy.map((c) => (
              <tr key={c}>
                <td>{c}</td>
                <td className={s.cennikKolPromo}>✓</td>
                <td>✓</td>
              </tr>
            ))}
            <tr className={s.cennikWierszAkcja}>
              <td />
              <td className={s.cennikKolPromo}>
                {pierwszaWykorzystana ? (
                  <button type="button" className={s.btn} disabled>
                    Promocja wykorzystana
                  </button>
                ) : (
                  <a className={s.btn} href={linkPromo}>
                    Zapłać {cena} zł
                  </a>
                )}
              </td>
              <td>
                <a className={`${s.btn} ${s.btnJasny}`} href={linkRegularny}>
                  Zapłać 200 zł
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Kontakt() {
  return (
    <div className={s.ustLista}>
      <div className={s.kontaktBaner}>
        <h1>Jesteśmy tu dla Ciebie</h1>
        <p>Pytania o ogłoszenia, płatności albo panel? Napisz, odpowiadamy osobiście.</p>
      </div>
      <a className={s.ustKarta} href="mailto:jakub@salesbruno.com?subject=Panel%20pracodawcy%20SalesBruno.pl">
        <div className={s.ustGlowa}>
          <span className={s.ustIkona} style={{ background: "#fdeaf0" }} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 6h16v12H4ZM4 7l8 6 8-6" />
            </svg>
          </span>
          <div>
            <h2>E-mail</h2>
            <p>Opisz sprawę, odpiszemy najszybciej, jak się da.</p>
          </div>
        </div>
        <span className={s.kontaktMail}>jakub@salesbruno.com →</span>
      </a>
    </div>
  );
}
