"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import g from "./gielda.module.css";

// 11.11 (USER_001): układ panelu giełdy handlowców w stylu panelu Bruno AI: lewy pasek (klasy brl-* z motyw-rinesk.css)
// z sekcjami i licznikami, treść w br-tresc. Jeden układ, dwa menu: handlowiec i firma, która szuka handlowców.
// Zakładki to adres /praca/panel?z=…; brak ?z= = ekran startowy. Na telefonie pasek chowa CSS, zostaje belka u góry.

export type Liczniki = Partial<Record<string, number | string>>;
type Pozycja = { z?: string; href?: string; nazwa: string; ikona: string; nowaKarta?: boolean };
type Sekcja = { tytul: string; linki: Pozycja[] };

const IK = {
  start: "M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 9h8M8 12.5h5",
  profil: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1-4 4-6 8-6s7 2 8 6",
  firmy: "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 10h4a1 1 0 0 1 1 1v10M3 21h18M8 8h3M8 12h3M8 16h3",
  oferty: "M4 8h16v12H4ZM9 8V5h6v3",
  aplikacje: "M4 5h16v14H4ZM4 7l8 6 8-6",
  serce: "M12 20s-7.5-4.6-9.2-9.4C1.6 7.1 4 4 7.2 4c2 0 3.6 1.1 4.8 2.7C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7.1 21.2 10.6 19.5 15.4 12 20 12 20Z",
  szukaj: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-3.5-3.5",
  ludzie: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M17 11.5a2.5 2.5 0 1 0 0-5M15.5 20a5 5 0 0 1 6-4.6",
  plus: "M12 5v14M5 12h14",
  cennik: "M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3S7.5 5.8 7.5 7.5 9.5 10 12 10.5s4.5 1.3 4.5 3.2-2 3.3-4.5 3.3-4.5-1.3-4.5-3",
  kontakt: "M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 13v4a2 2 0 0 0 2 2h1v-6H4",
  trening: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3",
  ustawienia: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 7.5 4 7l-1 3 2 1v2l-2 1 1 3 2-.5L7.5 18 7 20l3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z",
  wyjscie: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
};

const MENU: Record<"kandydat" | "pracodawca" | "admin", Sekcja[]> = {
  // 11.11 (USER_001): administrator giełdy: wszystkie profile handlowców (z odhaczeniem weryfikacji) i firmy.
  admin: [
    {
      tytul: "Giełda",
      linki: [
        { nazwa: "Handlowcy", ikona: IK.ludzie },
        // 12.11 (USER_001): konta bez wysłanego profilu i etap, na którym przerwali formularz.
        { z: "niedokonczone", nazwa: "Niedokończone", ikona: IK.profil },
        { z: "firmy", nazwa: "Firmy", ikona: IK.firmy },
      ],
    },
  ],
  // 11.11 (USER_001): handlowiec ma 3 zakładki: „Mój profil” (strona główna panelu, widok jak u pracodawcy),
  // „Edycja profilu” (wszystkie pola, zdjęcie, CV, linki) i „Firmy” (kto dostał kontakt). „Wyloguj” na samym dole.
  // Start z kulą, „Oferty pracy”, „Trening z Bruno” i „Ustawienia” zdjęte z menu (stare zakładki działają pod ?z=…).
  kandydat: [
    {
      tytul: "Handlowiec",
      linki: [
        { nazwa: "Mój profil", ikona: IK.profil },
        { z: "edycja", nazwa: "Edycja profilu", ikona: IK.ustawienia },
        { z: "firmy", nazwa: "Firmy", ikona: IK.firmy },
      ],
    },
  ],
  pracodawca: [
    {
      tytul: "Firma",
      linki: [
        { nazwa: "Szukaj handlowców", ikona: IK.szukaj },
        { z: "handlowcy", nazwa: "Moi handlowcy", ikona: IK.ludzie },
      ],
    },
    {
      tytul: "Ogłoszenia",
      linki: [
        { z: "ogloszenia", nazwa: "Moje ogłoszenia", ikona: IK.oferty },
        { z: "dodaj", nazwa: "Dodaj ogłoszenie", ikona: IK.plus },
        { z: "kandydaci", nazwa: "Kandydaci", ikona: IK.aplikacje },
      ],
    },
    {
      tytul: "Inne",
      linki: [
        { z: "firma", nazwa: "Profil firmy", ikona: IK.ustawienia },
        { z: "cennik", nazwa: "Cennik", ikona: IK.cennik },
        { z: "kontakt", nazwa: "Kontakt", ikona: IK.kontakt },
      ],
    },
  ],
};

const Ikona = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default function UkladGieldy({ typ, nazwa, zdjecie = null, liczniki = {}, children }: { typ: "kandydat" | "pracodawca" | "admin"; /** Napis u góry paska: imię handlowca albo nazwa firmy. */ nazwa: string; /** 11.11 (USER_001): zdjęcie handlowca albo logo firmy w kółku zamiast gwiazdki; brak = inicjał. */ zdjecie?: string | null; liczniki?: Liczniki; children: React.ReactNode }) {
  const z = useSearchParams()?.get("z") ?? "";
  const sekcje = MENU[typ];
  const adres = (p: Pozycja) => p.href ?? (p.z ? `/praca/panel?z=${p.z}` : "/praca/panel");
  // „konto” (moje konto firmy) otwiera się z zakładki „Profil firmy”, więc świeci ten sam link.
  // U handlowca stroną główną jest profil, więc stary adres ?z=baza świeci tę samą pozycję.
  const aktywny = (p: Pozycja) => !p.href && (p.z ?? "") === (z === "konto" ? "firma" : typ === "kandydat" && z === "baza" ? "" : typ === "admin" && z === "handlowiec" ? "" : z);
  const wyloguj = async () => {
    await fetch("/api/bruno/praca/konto/wyloguj", { method: "POST" });
    location.href = "/praca";
  };
  const link = (p: Pozycja, klasa?: string) => {
    const tresc = (
      <>
        <i><Ikona d={p.ikona} /></i>
        <span>{p.nazwa}</span>
        {p.z && liczniki[p.z] != null && liczniki[p.z] !== 0 && <em>{liczniki[p.z]}</em>}
      </>
    );
    const wl = aktywny(p);
    return p.nowaKarta ? (
      <a key={p.nazwa} href={adres(p)} target="_blank" rel="noreferrer" className={klasa}>{tresc}</a>
    ) : (
      <Link key={p.nazwa} href={adres(p)} className={`${klasa ?? ""} ${wl ? "brl-on" : ""}`} aria-current={wl ? "page" : undefined}>{tresc}</Link>
    );
  };

  return (
    <div className="br-uklad">
      {/* Telefon: belka z zakładkami w jednym, przewijanym rzędzie. */}
      <nav className={g.tel} aria-label="Panel">
        {sekcje.flatMap((s) => s.linki).map((p) => {
          const wl = aktywny(p);
          return (
            <Link key={p.nazwa} href={adres(p)} className={wl ? g.telOn : ""} aria-current={wl ? "page" : undefined}>
              {p.nazwa}
            </Link>
          );
        })}
        <button type="button" onClick={wyloguj}>Wyloguj</button>
      </nav>

      <aside className="brl" aria-label="Panel">
        <Link href="/praca/panel" className="brl-logo" aria-label="Bruno Sales">
          {zdjecie ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={g.twarz} src={zdjecie} alt="" />
          ) : (
            <span className={g.twarz} aria-hidden="true">{nazwa[0]?.toUpperCase()}</span>
          )}
          <b>{nazwa}</b>
        </Link>
        {sekcje.map((s) => (
          <div key={s.tytul}>
            <div className="brl-sekcja">{s.tytul}</div>
            <nav>
              {s.linki.map((p) => link(p))}
            </nav>
          </div>
        ))}
        <div className="brl-rosnie" />
        {/* 11.11 (USER_001): bez karty „Mój profil” na dole; „Wyloguj” na samym dole paska. */}
        <nav>
          <button type="button" onClick={wyloguj}>
            <i><Ikona d={IK.wyjscie} /></i>
            <span>Wyloguj</span>
          </button>
        </nav>
      </aside>

      <main className="br-tresc">{children}</main>
    </div>
  );
}
