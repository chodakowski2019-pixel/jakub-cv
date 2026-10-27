"use client";

import { useEffect, useState } from "react";
import s from "./webinar-lp.module.css";
import { WEBINAR, webinarLinkGoogle } from "@/lib/bruno/webinar";

// 16.10 (USER_001): LP zapisu na webinar, styl salesbruno.com (jasne tło, Outfit + Inter, pomarańcz).
// Formularz → /api/bruno/webinar = tylko powiadomienie do USER_001. Link do webinaru USER_001 wysyła sam.
// 21.10 (USER_001): nowy termin ŚR 28.10 19:00 (po zmianie czasu 25.10: CET = UTC+1 → 18:00 UTC), koniec ok. 20:00.
// Data i godzina tylko w lib/bruno/webinar.ts.
// 21.10 (USER_001): h1 w 2 liniach bez kropki, bez prezentu pod formularzem.
// 21.10 (USER_001): formularz = imię + e-mail firmowy + akceptacja polityki prywatności, nic więcej. Webinar na Zoomie.
// 21.10 (USER_001): „nie piszemy o Bruno”: na stronie, w kalendarzu i OG zero nazwy Bruno, nadawca = Jakub Chodakowski.
const START = WEBINAR.start;
const KONIEC = START + 60 * 60 * 1000;
// 16.10 (USER_001): 2 osobne LP. handlowcy: salesbruno.com/webinar, właściciele: salesbruno.com/webinar-firmy.
// 21.10: Bruno = tylko B2B (17.10), zaproszenia idą na LinkedIn do dyrektorów sprzedaży → obie ścieżki pokazują wersję „firmy”.
export type WersjaWebinaru = "handlowcy" | "firmy";
const TEKSTY = {
  handlowcy: {
    h1: "Przestań w końcu przepalać leady!",
    h1Szary: "Naucz się zamykać sprzedaż w domu.",
    lead: "Trening, feedback i powtórki. Ale nie na prawdziwych klientach. Potem jedziesz podpisać umowę.",
    plan: [
      ["19:00", "Dlaczego tracisz sprzedaż na samym końcu", "„Za drogo” i „zastanowię się” to nie koniec rozmowy. Pokażę, co wtedy powiedzieć."],
      ["19:15", "Zamykanie sprzedaży z AI na żywo", "AI gra trudnego klienta. Zobaczysz, co działa, a co pali leada w 10 sekund."],
      ["19:35", "Powtórki, powtórki, powtórki", "Jak ćwiczyć 10 minut dziennie w domu, a potem jechać podpisać umowę."],
      ["19:50", "Twoje pytania", "Pytasz o swoją branżę i swoich klientów. Odpowiadam na żywo."],
    ],
    dla: ["Sprzedajesz przez telefon albo na spotkaniu", "Jesteś w sprzedaży od niedawna albo chcesz wygrywać więcej rozmów", "Chcesz robić plan co miesiąc, nie co kwartał"],
    liczba: "+34%",
    liczbaOpis: "Tyle więcej spraw na godzinę załatwiali najmniej doświadczeni pracownicy, którym pomagało AI. Badanie 5 179 osób.",
    zrodlo: "Brynjolfsson, Li, Raymond, Quarterly Journal of Economics, 2025",
    bonus: "🎁 Każdy uczestnik: bezpłatny trening rozmowy z AI",
    faq: [
      ["Ile to kosztuje?", "Nic. Webinar jest bezpłatny."],
      ["Gdzie się odbywa?", "Online, na Zoomie. Link wyślę na maila przed startem. Wystarczy telefon albo komputer, kamera nie jest potrzebna."],
      ["Czy będzie nagranie?", "Nie. Nie będzie dostępnego nagrania ze spotkania, dlatego zapisz je w kalendarzu."],
      ["Jestem w sprzedaży od tygodnia. Czy to dla mnie?", "Tak. Im krócej sprzedajesz, tym więcej zyskasz na ćwiczeniu przed prawdziwą rozmową."],
      ["Kto prowadzi?", "Jakub Chodakowski, CEO."],
    ],
  },
  firmy: {
    // 27.10 (USER_001): nowy temat dla właścicieli firm (decyzja 27.10). Tytuł i plan z lib/bruno/webinar.ts.
    h1: "Jak sprawić, żeby handlowcy\nrobili 100\u00a0% planu sprzedaży",
    h1Szary: WEBINAR.podtytul,
    lead: "Wyszkol tych, których masz, zamiast szukać nowych. W 60 minut: 3 powody, dla których zespół nie robi planu, 4 sposoby na trening i jeden pokazany na żywo.",
    plan: WEBINAR.plan,
    dla: ["Prowadzisz firmę z zespołem sprzedaży", "Jesteś dyrektorem albo kierownikiem sprzedaży", "Zespół robi 60-80 % planu, a Ty nie masz czasu go szkolić"],
    liczba: "4,7 mies.",
    liczbaOpis: "Tyle średnio trwa wdrożenie nowego handlowca, zanim zacznie sprzedawać na pełnych obrotach. Przez ten czas uczy się na Twoich klientach.",
    zrodlo: "The Bridge Group, badanie 2025, 351 firm",
    bonus: "",
    faq: [
      ["Ile to kosztuje?", "Nic. Webinar jest bezpłatny."],
      ["Gdzie się odbywa?", "Online, na Zoomie. Link dostaniesz na maila od razu po zapisie, a potem przypomnienie dzień przed i godzinę przed. Wystarczy telefon albo komputer, kamera nie jest potrzebna."],
      ["Czy będzie nagranie?", "Nie. Nie będzie dostępnego nagrania ze spotkania, dlatego zapisz je w kalendarzu."],
      ["Mogę przyjść z kierownikiem sprzedaży?", "Tak. Każdy niech zapisze się osobno, link przyjdzie na jego maila."],
      ["Czy to sprzedaż czegoś?", "Przez 50 minut nie. Na końcu powiem, jak umówić bezpłatną rozmowę o Twoim zespole, jeśli zechcesz."],
      ["Kto prowadzi?", "Jakub Chodakowski, CEO."],
    ],
  },
} satisfies Record<WersjaWebinaru, unknown>;
// 27.10: kalendarz z linkiem Zoom w opisie (Google) i plik .ics z naszej domeny (ten sam co w mailach).
const GCAL = webinarLinkGoogle();
const ICS = "/api/bruno/webinar/ics";

/** Zegar do startu. Do zamontowania w przeglądarce pokazuje kreski (bez różnicy serwer/przeglądarka). */
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
const DLA = [
  "Sprzedajesz przez telefon albo na spotkaniu",
  "Jesteś w sprzedaży od niedawna albo chcesz wygrywać więcej rozmów",
  "Prowadzisz zespół i wdrażasz nowych handlowców",
];

export default function WebinarLp({ wersja = "handlowcy" }: { wersja?: WersjaWebinaru }) {
  const t = TEKSTY[wersja];
  const [stan, setStan] = useState<"formularz" | "wysylam" | "gotowe">("formularz");
  const [blad, setBlad] = useState("");

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
        grupa: wersja,
        zgoda: f.get("zgoda") === "on",
        www: f.get("www"),
        zrodlo: params.get("src") ?? params.get("utm_source") ?? document.referrer ?? "",
      }),
    }).catch(() => null);
    const d = await odp?.json().catch(() => null);
    if (d?.ok) return setStan("gotowe");
    setBlad(d?.blad ?? "Nie udało się zapisać. Spróbuj ponownie.");
    setStan("formularz");
  }

  return (
    <div className={`${s.root} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <span className={s.logo}>
          Jakub Chodakowski<i className={s.kropka} />
        </span>
        <a className={s.navCta} href="#zapis">
          Rezerwuję miejsce
        </a>
      </nav>

      <header className={s.hero}>
        <div className={s.heroTekst}>
          <span className={s.znaczek}>
            <i className={s.live} />
            Bezpłatny webinar na żywo · {WEBINAR.dzien} {WEBINAR.data} · {WEBINAR.godzina}
          </span>
          <h1 className={`${s.h1} ${t.h1.includes("\n") ? s.h1Dwie : ""}`}>
            {t.h1.split("\n").map((w, i) => (
              <span key={i} className={s.h1Linia}>
                {i > 0 && <br />}
                {w}
              </span>
            ))}
            {t.h1Szary && (
              <>
                <br />
                <span className={s.g}>{t.h1Szary}</span>
              </>
            )}
          </h1>
          <p className={s.lead}>{t.lead}</p>
          <div className={s.zegarBlok}>
            <span className={s.zegarNapis}>Start za</span>
            <Zegar />
          </div>
          <ul className={s.fakty}>
            <li>
              <b>Kiedy</b>{WEBINAR.dzien}, {WEBINAR.dataDluga}, {WEBINAR.godzina}
            </li>
            <li>
              <b>Gdzie</b>online, Zoom
            </li>
            <li>
              <b>Ile trwa</b>ok. 60 minut
            </li>
            <li>
              <b>Cena</b>bezpłatnie
            </li>
            <li>
              <b>Nagranie</b>nie będzie
            </li>
          </ul>
        </div>

        <div className={s.karta} id="zapis">
          {stan === "gotowe" ? (
            <div className={s.gotowe}>
              <div className={s.ptaszek}>✓</div>
              <h2 className={s.h2}>Jesteś zapisany!</h2>
              <p className={s.opis}>Link do Zooma właśnie poszedł na Twojego maila (sprawdź też „Oferty” albo spam). Do zobaczenia: {WEBINAR.dzien}, {WEBINAR.godzina}.</p>
              <p className={s.opis}>Webinar jest bez nagrania. Zapisz go w kalendarzu:</p>
              <div className={s.kalendarz}>
                <a href={GCAL} target="_blank" rel="noopener">Kalendarz Google</a>
                <a href={ICS} download={`webinar-${WEBINAR.klucz}.ics`}>Apple / Outlook</a>
              </div>
            </div>
          ) : (
            <form onSubmit={wyslij} className={s.form}>
              <h2 className={s.h2}>Zarezerwuj miejsce</h2>
              <label className={s.pole}>
                <span>Imię</span>
                <input name="imie" required autoComplete="given-name" placeholder="np. Anna" />
              </label>
              <label className={s.pole}>
                <span>E-mail firmowy</span>
                <input name="email" type="email" required autoComplete="email" placeholder="anna@twojafirma.pl" />
              </label>
              <input name="www" tabIndex={-1} autoComplete="off" className={s.pulapka} aria-hidden />
              <label className={s.zgoda}>
                <input type="checkbox" name="zgoda" required />
                <span>
                  Akceptuję{" "}
                  <a href="/polityka-prywatnosci" target="_blank">
                    politykę prywatności
                  </a>
                </span>
              </label>
              {blad && <p className={s.blad}>{blad}</p>}
              <button className={s.przycisk} disabled={stan === "wysylam"}>
                {stan === "wysylam" ? "Zapisuję…" : "Rezerwuję miejsce bezpłatnie"}
              </button>
            </form>
          )}
        </div>
      </header>

      <section className={s.sekcja}>
        <h2 className={s.h2Duzy}>
          Plan webinaru <span className={s.g}>60 minut</span>
        </h2>
        <div className={s.siatka}>
          {t.plan.map(([g, h, o]) => (
            <div className={s.kafel} key={h}>
              <span className={s.nr}>{g}</span>
              <h3>{h}</h3>
              <p>{o}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.sekcja}>
        <div className={s.dwie}>
          <div>
            <h2 className={s.h2Duzy}>Dla kogo</h2>
            <ul className={s.lista}>
              {t.dla.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div className={s.liczba}>
            <span className={s.wielka}>{t.liczba}</span>
            <p>{t.liczbaOpis}</p>
            <small>Źródło: {t.zrodlo}</small>
          </div>
        </div>
      </section>

      <section className={s.sekcja}>
        <div className={s.prowadzacy}>
          <img src="/jakub.jpg" alt="Jakub Chodakowski" width={96} height={96} />
          <div>
            <h3>Jakub Chodakowski</h3>
            <p>CEO</p>
            <p>Do momentu, gdy powstał ChatGPT, zajmowałem się sprzedażą B2B i B2C. Kilka lat temu wszystko się zmieniło. Postanowiłem połączyć 2 dziedziny, które mnie najbardziej w życiu interesują: technologię i sprzedaż.</p>
          </div>
        </div>
      </section>

      <section className={s.sekcja}>
        <h2 className={s.h2Duzy}>Pytania</h2>
        <div className={s.faq}>
          {t.faq.map(([p, o]) => (
            <details key={p}>
              <summary>{p}</summary>
              <p>{o}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={`${s.sekcja} ${s.koniec}`}>
        <h2 className={s.h2Duzy}>
          {WEBINAR.dzien[0].toUpperCase() + WEBINAR.dzien.slice(1)}, {WEBINAR.godzina}. <span className={s.g}>Do zobaczenia.</span>
        </h2>
        <Zegar />
        <a className={`${s.przycisk} ${s.przyciskDol}`} href="#zapis">
          Rezerwuję miejsce bezpłatnie
        </a>
      </section>

      {stan !== "gotowe" && (
        <a className={s.pasekTel} href="#zapis">
          Rezerwuję miejsce · {WEBINAR.dzienKrotko} {WEBINAR.godzina}
        </a>
      )}

      <footer className={s.stopka}>
        <span>Jakub Chodakowski</span>
        <a href="/polityka-prywatnosci">Polityka prywatności</a>
        <a href="/regulamin">Regulamin</a>
      </footer>
    </div>
  );
}
