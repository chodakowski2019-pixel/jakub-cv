"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./webinar-lp.module.css";
import { WEBINAR, webinarLinkGoogle } from "@/lib/bruno/webinar";
import Test from "@/app/brunokursy/test/test";

// 29.10 (USER_001: „LP pod zapisy na webinar, nie LP sprzedażowe”): KRÓTKA strona zapisu. Wzór: Perspective, Sequel,
// eWebinar, Unbounce (nagłówek = wynik + odbiorca, 3-5 punktów, prowadzący jako dowód, bez nawigacji).
// 29.10 v2 (USER_001: „w Mailketingu masz przykład, jak ma dokładnie wyglądać LP”): układ wg Aniserowicza, lekcja 02.04
// „Elementy landingu do zbierania maili” + 02.06 „Dodatkowe landingi”:
//   KONIECZNE: nagłówek („o co chodzi, czy to dla mnie” w kilka sekund) · PRZYCISK duży, nad linią, powtórzony · PO CO
//   (za co płaci mailem) · KTO + ZDJĘCIE autora („zdjęcie działa lepiej niż logo”) · og:image.
//   FORMULARZ = POP-UP po kliknięciu przycisku (nie na stronie): nagłówek, zdjęcie, „sprawdź maila”, pola e-mail + imię,
//   wielki przycisk „Zapisuję się »”, KLAUZULA zamiast checkboxa.
//   PO ZAPISIE = osobna strona „Dzięki, to PRAWIE wszystko” (sprawdź spam / oferty, nadawca, kliknij link), pod piksel.
//   Strona może być krótka, nawet jeden ekran. „Nie zajmujemy się pierdołami” (kolor przycisku itp.).
// Podgląd: /podglad/webinar-zapis/blekit (USER_001 29.10: „przerób pod tę stronę”). Długa wersja (Popiel): webinar-lp.tsx.
const START = WEBINAR.start;
const KONIEC = START + 60 * 60 * 1000;
const GCAL = webinarLinkGoogle();
const ICS = "/api/bruno/webinar/ics";
/** Nadawca maila z linkiem Zoom (do strony „Dzięki” i okienka). */
export const NADAWCA_ADRES = "jakub@salesbruno.com";

// 31.10 (USER_001): webinar B2B odwołany, strona = webinar dla grupy A (chcą ZOSTAĆ handlowcami). Teksty z badania
// SalesAI/sprzedaz/badanie-b2c/A-cytaty.md: „czy mnie wezmą bez doświadczenia” (33), prowizja na minusie (21),
// „wciskanie kitu” (19), strach przed telefonem (11), zarobki 4 500-8 000 zł (17).
const T = {
  badge: "Dla osób, które chcą zacząć pracę w sprzedaży",
  h1: "Jak zostać handlowcem\nw 3 miesiące?",
  h1Szary: "Bez wciskania kitu.", // 31.10 (USER_001)
  wstep: "W 60 minut, na żywo, dowiesz się:",
  punkty: [
    "czy nadajesz się do sprzedaży i w jakiej branży odnajdziesz się najlepiej",
    "ile zarabia początkujący handlowiec i jak wybrać firmę z dobrą pensją i prowizją",
    "jak przestać bać się telefonu do obcej osoby",
    "jak w 3 miesiące przejść od zera do pierwszej pracy w sprzedaży",
  ],
  przycisk: "Chcę zarezerwować miejsce »",
  plan: [
    ["19:00", "Czy nadajesz się do sprzedaży? 3 style handlowca"],
    ["19:15", "Ile naprawdę zarabia początkujący handlowiec"],
    ["19:30", "Plan na 3 miesiące: od zera do pierwszej pracy"],
    ["19:45", "Na żywo: pierwsza rozmowa z klientem AI"],
    ["20:00", "Pytania"],
  ] as [string, string][],
  // 31.10 (USER_001): bio = krótko doświadczenie, bez Bruno. Fakty z CV (components/about-me.tsx).
  prowadzacy: "Gdy miałem 16 lat, zaczynałem od sprzedaży waty cukrowej na końcu molo w Kołobrzegu. Później była fotowoltaika, startupy i sprzedaż do urzędów miast. Przeszedłem przez wszystkie rodzaje sprzedaży i wiem jedno: sprzedaży może nauczyć się każdy.",
  // 31.10 (USER_001): liczba o zarobkach handlowców, związana z tematem webinaru.
  // 31.10 (USER_001): konkretna liczba ofert zamiast %. 19 % z 762 827 ogłoszeń Pracuj.pl w 2025 = ok. 145 000.
  liczba: ["145 000", "Tyle ofert pracy w sprzedaży opublikowano w 2025 roku na samym Pracuj.pl. Sprzedaż to najczęściej rekrutowana specjalizacja w Polsce. Praca czeka.", "Pracuj.pl, rynek pracy w sprzedaży 2025: 19 % z 762 827 ogłoszeń"] as [string, string, string],
  faq: [
    ["Nie mam żadnego doświadczenia. Czy to dla mnie?", "Tak. Webinar jest właśnie dla osób, które zaczynają od zera: po szkole, z produkcji, ze sklepu, z call center."],
    ["Gdzie się odbywa?", "Online, na Zoomie. Link otrzymasz na e-mail zaraz po potwierdzeniu zapisu, a potem przypomnienie dzień przed i godzinę przed. Wystarczy telefon albo komputer, kamera jest zbędna."],
    ["Czy będzie nagranie?", "Webinar jest tylko na żywo, bez nagrania, dlatego zapisz go w kalendarzu."],
  ] as [string, string][],
  // Pop-up (Aniserowicz 02.04: nagłówek, zdjęcie, „sprawdź maila”, pola, wielki przycisk, klauzula).
  okno: {
    tytul: "Zarezerwuj miejsce",
    pod: `${WEBINAR.dzien}, ${WEBINAR.dataDluga}, ${WEBINAR.godzina}, Zoom`,
    przypomnienie: "Po zapisie kliknij „Potwierdzam zapis” w e-mailu. Wtedy otrzymasz link do spotkania.",
    przycisk: "Zapisuję się »",
    klauzula: "Zapisując się, wyrażasz zgodę na otrzymywanie od Jakuba Chodakowskiego wiadomości o tym webinarze i o szkoleniach sprzedaży z AI. Administratorem Twoich danych jest Jakub Chodakowski. Dane będą przetwarzane do celów związanych z webinarem i wysyłką wiadomości.",
  },
};

/** Stopka strony (Aniserowicz 07-04: dane administratora + regulamin + polityka na każdej stronie zapisu). */
function Stopka() {
  return (
    <footer className={s.stopka}>
      <span>Jakub Chodakowski · {NADAWCA_ADRES}</span>
      <a href="/polityka-prywatnosci">Polityka prywatności</a>
      <a href="/regulamin">Regulamin</a>
    </footer>
  );
}

function Zegar({ maly }: { maly?: boolean }) {
  const [teraz, setTeraz] = useState<number | null>(null);
  useEffect(() => {
    setTeraz(Date.now());
    const t = setInterval(() => setTeraz(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (teraz !== null && teraz >= KONIEC) return <div className={s.zegarKoniec}>Webinar się zakończył</div>;
  if (teraz !== null && teraz >= START) return <div className={s.zegarKoniec}><i className={s.live} /> Trwa teraz, na żywo</div>;
  const r = teraz === null ? null : Math.max(0, Math.floor((START - teraz) / 1000));
  const pola: [number | null, string][] = [
    [r === null ? null : Math.floor(r / 86400), "dni"],
    [r === null ? null : Math.floor((r % 86400) / 3600), "godz."],
    [r === null ? null : Math.floor((r % 3600) / 60), "min"],
    [r === null ? null : r % 60, "sek."],
  ];
  return (
    <div className={`${s.zegar} ${maly ? s.zegarMaly : ""}`} aria-label="Czas do startu webinaru">
      {pola.map(([v, e]) => (
        <div className={s.zegarPole} key={e}>
          <b>{v === null ? "--" : String(v).padStart(2, "0")}</b>
          <span>{e}</span>
        </div>
      ))}
    </div>
  );
}

// 29.10 (USER_001: „zmienić kolorystycznie”): motywy do wyboru, ten sam układ i teksty. Podglądy /podglad/webinar-zapis/<motyw>.
// 29.10 (USER_001): motyw „elmatic” = kolorystyka i UX strony Local AI Day (elmatic.net): granat, cienkie ramki, błękit, Poppins.
export type MotywZapisu = "pomarancz" | "limonka" | "noc" | "blekit" | "elmatic";
const MOTYW_KLASA: Record<MotywZapisu, string> = { pomarancz: "", limonka: s.mLimonka, noc: s.mNoc, blekit: s.mBlekit, elmatic: s.mElm };

export default function WebinarLpZapis({ motyw = "pomarancz", dziekiUrl }: { motyw?: MotywZapisu; dziekiUrl?: string }) {
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [stan, setStan] = useState<"formularz" | "wysylam">("formularz");
  const [blad, setBlad] = useState("");

  // Okienko: Escape zamyka, strona pod spodem się nie przewija.
  useEffect(() => {
    if (!otwarte) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    document.addEventListener("keydown", esc);
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = poprzedni;
    };
  }, [otwarte]);

  async function wyslij(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBlad("");
    setStan("wysylam");
    const params = new URLSearchParams(window.location.search);
    const odp = await fetch("/api/bruno/webinar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imie: f.get("imie"),
        email: f.get("email"),
        grupa: "kursy",
        // Zgoda = kliknięcie przycisku pod klauzulą (Aniserowicz: klauzula zamiast checkboxa).
        zgoda: true,
        www: f.get("www"),
        zrodlo: params.get("src") ?? params.get("utm_source") ?? document.referrer ?? "",
      }),
    }).catch(() => null);
    const d = await odp?.json().catch(() => null);
    if (d?.ok) {
      router.push(dziekiUrl ?? "/webinar/dzieki");
      return;
    }
    setBlad(d?.blad ?? "Zapis się urwał. Spróbuj ponownie.");
    setStan("formularz");
  }

  const przycisk = (klasa = "") => (
    <button type="button" className={`${s.przycisk} ${s.przyciskDuzy} ${klasa}`} onClick={() => setOtwarte(true)}>
      {T.przycisk}
    </button>
  );

  return (
    <div className={`${s.root} ${s.zapis} ${s.zapisA} ${MOTYW_KLASA[motyw]} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <span className={s.logo}>
          Jakub Chodakowski<i className={s.kropka} />
        </span>
      </nav>

      {/* Aniserowicz: nagłówek + PO CO + PRZYCISK nad linią; zdjęcie autora jako element strony. */}
      <header className={`${s.hero} ${s.heroA}`}>
        <div className={s.bloby} aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className={`${s.heroTekst} ${s.heroGora}`}>
          <span className={s.znaczek}>
            <i className={s.live} />
            {T.badge}
          </span>
          <h1 className={`${s.h1} ${s.h1Dwie}`}>
            {T.h1.split("\n").map((w, i) => (
              <span key={i} className={s.h1Linia}>
                {i > 0 && <br />}
                {w}
              </span>
            ))}
            <br />
            <span className={s.g}>{T.h1Szary}</span>
          </h1>
          {/* 29.10 (USER_001): na telefonie zdjęcie od razu pod „Bez pilnowania ich.”. */}
          <div className={`${s.heroFoto} ${s.heroFotoTel}`}>
            <img src="/bruno/jakub-webinar.jpg?v=2" alt="Jakub Chodakowski" width={960} height={863} />
            <div className={s.heroFotoPodpis}>
              <b>Jakub Chodakowski, CEO</b>
              <span>prowadzi webinar</span>
            </div>
          </div>
          <p className={s.wstepZapis}>{T.wstep}</p>
          <ul className={s.punktyZapis}>
            {T.punkty.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className={s.ctaHero}>
            {przycisk()}
            <p className={s.ctaData}>
              <i className={s.live} />
              {WEBINAR.dzien}, {WEBINAR.dataDluga}, {WEBINAR.godzina} · Zoom · bezpłatnie
            </p>
          </div>
        </div>
        <div className={`${s.heroFoto} ${s.heroFotoKomp}`}>
          {/* 29.10 (USER_001): kadr ucięty nad zaokrągleniem koszuli, dół prosty (public/bruno/jakub-webinar.jpg = /jakub.jpg bez dolnych 110 px). */}
          <img src="/bruno/jakub-webinar.jpg?v=2" alt="Jakub Chodakowski" width={960} height={863} />
          <div className={s.heroFotoPodpis}>
            <b>Jakub Chodakowski, CEO</b>
            <span>prowadzi webinar</span>
          </div>
        </div>
      </header>

      {/* KTO: osobna sekcja (USER_001 29.10). */}
      <section className={`${s.sekcja} ${s.sekcjaZapis} ${s.sekcjaProwadzacy}`}>
        <div className={s.prowadzacyZapis}>
          <img src="/jakub.jpg" alt="Jakub Chodakowski" width={88} height={88} />
          <p>
            <b className={s.bioImie}>Jakub Chodakowski, CEO.</b> {T.prowadzacy}
          </p>
        </div>
      </section>

      <section className={`${s.sekcja} ${s.sekcjaZapis}`}>
        <div className={s.dwie}>
          <div>
            <h2 className={s.h2Duzy}>
              Plan <span className={s.g}>60 minut</span>
            </h2>
            <ol className={s.planZapis}>
              {T.plan.map(([g, h]) => (
                <li key={h}>
                  <span className={s.planGodz}>{g}</span>
                  <span>{h}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={s.liczba}>
            <span className={s.wielka}>{T.liczba[0]}</span>
            <p>{T.liczba[1]}</p>
            <small>Źródło: {T.liczba[2]}</small>
          </div>
        </div>
      </section>

      <section className={`${s.sekcja} ${s.sekcjaZapis}`}>
        <h2 className={s.h2Duzy}>Pytania</h2>
        <div className={s.faq}>
          {T.faq.map(([p, o]) => (
            <details key={p}>
              <summary>{p}</summary>
              <p>{o}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Przycisk powtórzony na dole (Aniserowicz: „warto go powtórzyć, jeśli strona jest długa”). */}
      <section className={`${s.sekcja} ${s.koniec}`}>
        <div className={s.koniecKarta}>
          <h2 className={s.h2Duzy}>
            {WEBINAR.dzien[0].toUpperCase() + WEBINAR.dzien.slice(1)}, {WEBINAR.godzina}.
            <br />
            <span className={s.g}>Do zobaczenia.</span>
          </h2>
          <Zegar />
          {przycisk(s.przyciskDol)}
        </div>
      </section>

      <a className={s.pasekTel} href="#" onClick={(e) => (e.preventDefault(), setOtwarte(true))}>
        {T.przycisk}
      </a>

      <Stopka />

      {/* POP-UP z formularzem (Aniserowicz 02.04: po kliknięciu decyzja jest podjęta, okienko tylko ją domyka). */}
      {otwarte && (
        <div className={s.tlo} onClick={(e) => e.target === e.currentTarget && setOtwarte(false)} role="dialog" aria-modal="true" aria-labelledby="okno-tytul">
          <div className={s.okno}>
            <button type="button" className={s.oknoZamknij} onClick={() => setOtwarte(false)} aria-label="Zamknij">
              ×
            </button>
            <div className={s.oknoGlowa}>
              <img src="/jakub.jpg" alt="" width={56} height={56} />
              <div>
                <h2 className={s.h2} id="okno-tytul">{T.okno.tytul}</h2>
                <p className={s.oknoPod}>{T.okno.pod}</p>
              </div>
            </div>
            <p className={s.oknoPrzypomnienie}>{T.okno.przypomnienie}</p>
            <form onSubmit={wyslij} className={s.form}>
              <label className={s.pole}>
                <span>Imię</span>
                <input name="imie" required autoComplete="given-name" placeholder="np. Jakub" autoFocus />
              </label>
              <label className={s.pole}>
                <span>E-mail</span>
                <input name="email" type="email" required autoComplete="email" placeholder="jakub@gmail.com" />
              </label>
              <input name="www" tabIndex={-1} autoComplete="off" className={s.pulapka} aria-hidden />
              {blad && <p className={s.blad}>{blad}</p>}
              <button className={`${s.przycisk} ${s.przyciskDuzy}`} disabled={stan === "wysylam"}>
                {stan === "wysylam" ? "Zapisuję…" : T.okno.przycisk}
              </button>
              <p className={s.klauzula}>
                {T.okno.klauzula}{" "}
                <a href="/polityka-prywatnosci" target="_blank">
                  Polityka prywatności
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Strona „Dzięki, to PRAWIE wszystko” po zapisie (Aniserowicz 02.06: sprawdź spam / oferty, nadawca, co kliknąć; tu piksel). */
export function WebinarDzieki({ motyw = "pomarancz" }: { motyw?: MotywZapisu }) {
  return (
    <div className={`${s.root} ${s.zapis} ${s.zapisA} ${MOTYW_KLASA[motyw]} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <span className={s.logo}>
          Jakub Chodakowski<i className={s.kropka} />
        </span>
      </nav>
      <main className={s.dzieki}>
        <div className={s.ptaszek}>✓</div>
        <h1 className={`${s.h1} ${s.h1Dwie}`}>
          Dzięki, to <span className={s.pom}>prawie</span> wszystko!
        </h1>
        <p className={s.dziekiLead}>
          Masz miejsce na webinarze:
          <br />
          {WEBINAR.dzien}, {WEBINAR.dataDluga}, {WEBINAR.godzina}.
          <span className={s.dziekiOdstep}>Zostały 2 rzeczy:</span>
        </p>
        {/* Aniserowicz 02.06: „dostaniesz maila, poszukaj go w spamie / ofertach, MUSISZ kliknąć”. Nadawca podany wprost. */}
        <ol className={s.dziekiKroki}>
          <li>
            <b>Znajdź e-mail z adresu <code>{NADAWCA_ADRES}</code>.</b> Właśnie wyszedł. Jeśli go nie widzisz, sprawdź „Oferty” i spam i przenieś go do głównej skrzynki, żeby link i przypomnienia też tam trafiły.
          </li>
          <li>
            <b>Kliknij w nim „Potwierdzam zapis »”.</b> Dopiero wtedy wyślę Ci link do spotkania i wpiszę na listę. Bez kliknięcia nie wyślę nic więcej.
          </li>
        </ol>
        <div className={s.dziekiZegar}>
          <span className={s.zegarNapis}>Start za</span>
          <Zegar />
        </div>
      </main>
      <Stopka />
    </div>
  );
}

/** Strona „Dzięki bardzo” po kliknięciu w link potwierdzający (Aniserowicz 02.06): link do spotkania, kalendarz, kontakty, Inbox. */
export function WebinarDziekiBardzo({ motyw = "pomarancz", token }: { motyw?: MotywZapisu; token?: string }) {
  return (
    <div className={`${s.root} ${s.zapis} ${s.zapisA} ${MOTYW_KLASA[motyw]} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <span className={s.logo}>
          Jakub Chodakowski<i className={s.kropka} />
        </span>
      </nav>
      <main className={s.dzieki}>
        <div className={s.ptaszek}>✓</div>
        <h1 className={`${s.h1} ${s.h1Dwie}`}>
          Gotowe. <span className={s.pom}>Masz miejsce.</span>
        </h1>
        <p className={s.dziekiLead}>
          {WEBINAR.dzien}, {WEBINAR.dataDluga}, {WEBINAR.godzina}, Zoom.
          <br />
          Link do spotkania wysłałem też mailem.
        </p>
        {/* 29.10 (USER_001): link podświetlony i podkreślony, nie przycisk; pełny adres pod spodem do skopiowania. */}
        <a className={s.dziekiLink} href={WEBINAR.zoom} target="_blank" rel="noopener">
          Link do spotkania »
        </a>
        <a className={s.dziekiLinkPelny} href={WEBINAR.zoom} target="_blank" rel="noopener">
          {WEBINAR.zoom}
        </a>
        {/* 31.10 (USER_001): test predyspozycji zaraz po potwierdzeniu, przed webinarem. O 19:00 omawiam wyniki. */}
        {token && (
          <section className={s.dziekiTest} id="test">
            {/* 31.10 (USER_001): w 2 liniach, bez „10 pytań, 2 minuty”. */}
            <h2 className={s.h2Duzy}>
              Zanim się spotkamy:
              <br />
              <span className={s.g}>Jakim jesteś handlowcem?</span>
            </h2>
            <p className={s.dziekiLead}>Na początku webinaru omawiam wyniki, więc zrób go teraz.</p>
            <Test token={token} />
          </section>
        )}
        <ol className={s.dziekiKroki}>
          <li>
            <b>Zapisz webinar w kalendarzu.</b> Nagrania nie będzie.
            <span className={s.kalendarz}>
              <a href={GCAL} target="_blank" rel="noopener">Kalendarz Google</a>
              <a href={ICS} download={`webinar-${WEBINAR.klucz}.ics`}>Apple / Outlook</a>
            </span>
          </li>
          <li>
            <b>Dodaj <code>{NADAWCA_ADRES}</code> do kontaktów.</b> Jeśli mail trafił do „Ofert” albo spamu, przenieś go do głównej skrzynki. Wtedy przypomnienia dzień przed i godzinę przed też tam trafią.
          </li>
        </ol>
        <div className={s.dziekiZegar}>
          <span className={s.zegarNapis}>Start za</span>
          <Zegar />
        </div>
      </main>
      <Stopka />
    </div>
  );
}

/** Strona po kliknięciu „Wypisz się” w mailu (Aniserowicz 01-05: jedno kliknięcie, bez pytań, potwierdzenie na stronie). */
export function WebinarWypisano({ motyw = "pomarancz" }: { motyw?: MotywZapisu }) {
  return (
    <div className={`${s.root} ${s.zapis} ${s.zapisA} ${MOTYW_KLASA[motyw]} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <span className={s.logo}>
          Jakub Chodakowski<i className={s.kropka} />
        </span>
      </nav>
      <main className={s.dzieki}>
        <div className={s.ptaszek}>✓</div>
        <h1 className={`${s.h1} ${s.h1Dwie}`}>Wypisano.</h1>
        <p className={s.dziekiLead}>
          Nie dostaniesz już ode mnie wiadomości o webinarze.
          <br />
          Jeśli to pomyłka, zapisz się jeszcze raz na stronie webinaru.
        </p>
        <a className={`${s.przycisk} ${s.przyciskDuzy} ${s.dziekiPrzycisk}`} href="/webinar">
          Strona webinaru »
        </a>
      </main>
      <Stopka />
    </div>
  );
}
