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
// 29.10 v2 (USER_001: „naucz się copywritingu LP i popraw”): układ wg kursu LP Popiela (wezwanie → nagłówek → obietnica
// → otwarcie pytaniami TAK/NIE → problemy słowami klienta → pogłębienie (co tracisz) → historia + bio → agenda z „dzięki temu”
// → wyobraź sobie → dowody (3 liczby ze źródłem) → FAQ z obiekcjami → ostrzeżenie + P.S.), Haines (jeden CTA, 2 pola,
// mikro-tekst pod przyciskiem, zero ogólników), Negacz („zarządzasz czuciem czy liczbami”, zmęczenie zmianami),
// rozmowa z Mauricio 29.10 (kontrola, aktywność, 15-20 h/mies. szefa, „nikt nie będzie korzystał jak z CRM”).
const START = WEBINAR.start;
const KONIEC = START + 60 * 60 * 1000;
// 16.10 (USER_001): 2 osobne LP. handlowcy: salesbruno.com/webinar, właściciele: salesbruno.com/webinar-firmy.
// 21.10: Bruno = tylko B2B (17.10), zaproszenia idą na LinkedIn do dyrektorów sprzedaży → obie ścieżki pokazują wersję „firmy”.
export type WersjaWebinaru = "handlowcy" | "firmy";

type Para = [string, string];
type Teksty = {
  /** Wezwanie odbiorców nad nagłówkiem (Belcher). */
  wezwanie?: string;
  h1: string;
  h1Szary: string;
  lead: string;
  /** Otwarcie serią pytań TAK/NIE (Popiel M6 L02) + zdanie po nich. */
  otwarcie?: { wstep: string; pytania: string[]; po: string };
  plan: [string, string, string][];
  /** Problemy słowami klienta (Popiel M7 L01): [cytat, dopowiedzenie]. */
  bolaczki?: Para[];
  /** Pogłębienie: co tracisz (Popiel M7 L02): [tracisz X, bo…]. Ostatni = „a najgorsze”. */
  koszt?: Para[];
  /** Historia prowadzącego dająca nadzieję (Popiel M7 L03) + bio. */
  historia?: string[];
  /** Nowa rzeczywistość, future pacing (Popiel MSO L01 pkt 5). */
  wyobraz?: string[];
  dla: string[];
  /** Dowody z liczbą i źródłem (Popiel M9 L01 pkt 7): [liczba, opis, źródło]. */
  liczby: [string, string, string][];
  bonus: string;
  faq: Para[];
  /** Ostrzeżenie + P.S. (Popiel MSO L01 pkt 11-12). */
  ostrzezenie?: string;
  ps?: string;
  przycisk: string;
  /** Mikro-tekst pod przyciskiem: co się stanie po kliknięciu (presupozycja czasowa). */
  przyciskPod: string;
};

const TEKSTY: Record<WersjaWebinaru, Teksty> = {
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
    liczby: [["+34%", "Tyle więcej spraw na godzinę załatwiali najmniej doświadczeni pracownicy, którym pomagało AI. Badanie 5 179 osób.", "Brynjolfsson, Li, Raymond, Quarterly Journal of Economics, 2025"]],
    bonus: "🎁 Każdy uczestnik: bezpłatny trening rozmowy z AI",
    faq: [
      ["Ile to kosztuje?", "Nic. Webinar jest bezpłatny."],
      ["Gdzie się odbywa?", "Online, na Zoomie. Link wyślę na maila przed startem. Wystarczy telefon albo komputer, kamera nie jest potrzebna."],
      ["Czy będzie nagranie?", "Nie. Nie będzie dostępnego nagrania ze spotkania, dlatego zapisz je w kalendarzu."],
      ["Jestem w sprzedaży od tygodnia. Czy to dla mnie?", "Tak. Im krócej sprzedajesz, tym więcej zyskasz na ćwiczeniu przed prawdziwą rozmową."],
      ["Kto prowadzi?", "Jakub Chodakowski, CEO."],
    ],
    przycisk: "Rezerwuję miejsce bezpłatnie",
    przyciskPod: "Po zapisie potwierdź adres w mailu, wtedy dostaniesz link do Zooma.",
  },
  firmy: {
    // 29.10 (USER_001): nowy tytuł (lib/bruno/webinar.ts), tu w 4 liniach bez łamania w środku linii.
    wezwanie: "Dla właścicieli firm i dyrektorów sprzedaży z zespołem 3-50 handlowców",
    // 29.10 (USER_001): h1 = pytanie w 2 liniach, „bez siedzenia…” schodzi do szarej linii.
    h1: "Jak sprawić, żeby handlowcy\nrobili 100\u00a0% planu?",
    h1Szary: WEBINAR.podtytul,
    lead: "",
    // 29.10 (USER_001): pytania tak, żeby ludzie odruchowo odpowiadali „tak”.
    otwarcie: {
      wstep: "Czy chcesz wiedzieć:",
      pytania: ["co Twoi handlowcy mówią klientom?", "który z nich ćwiczył w tym tygodniu?", "na którym etapie rozmowy tracą najwięcej?"],
      po: "Jeśli tak, ten webinar jest dla Ciebie. W 60 minut pokażę, jak poprawić pracę handlowców dzięki AI.",
    },
    plan: WEBINAR.plan,
    // Słowa właścicieli: Ewa (demo 28.10), Mauricio (29.10), Negacz („zarządzanie czuciem”).
    bolaczki: [
      ["Nie wiem, co moi handlowcy mówią klientom.", "Oferty idą, telefony idą. Ja widzę tylko wynik na koniec miesiąca."],
      ["Nie jestem w stanie ich skontrolować ani niczego wymóc.", "Mówię, co mają robić. Potem i tak robią po swojemu."],
      ["Powtarzam to samo tym samym ludziom.", "Godzina dziennie na szkolenie, a te same błędy wracają za tydzień."],
      ["Zrobiliśmy szkolenie. Tydzień później nikt nic nie pamięta.", "Wszyscy kiwali głowami. Trener wyszedł, zapał minął."],
      ["Nowy system? Nikt nie będzie z tego korzystał.", "Z CRM-u też nie korzystają. Nie mam jak tego wymusić."],
      ["Zarządzam na czucie, bo nie mam danych.", "Wiem, kto sprzedał. Nie wiem dlaczego. I nie wiem, czemu reszta nie."],
    ],
    koszt: [
      ["Tracisz klientów.", "Handlowiec uczy się na Twoich leadach. Nowy potrzebuje średnio 4,7 miesiąca, zanim zacznie sprzedawać na pełnych obrotach. Każda spalona rozmowa to zapłacona reklama i stracony czas."],
      ["Tracisz czas.", "15-20 godzin w miesiącu na pilnowanie i powtarzanie. To dwa pełne dni pracy szefa, co miesiąc, na to samo."],
      ["Tracisz ludzi.", "Zamiast naprawić, zwalniasz. Nowy handlowiec ma wady starego i jeszcze swoje, a wdrożenie zaczyna się od zera."],
      ["A najgorsze:", "nie wiesz, który z trzech problemów masz. Handlowiec nie umie, nie chce, czy system mu nie pozwala? Więc leczysz wszystko tym samym: szkoleniem raz na kwartał."],
    ],
    historia: [
      "Sam byłem handlowcem. Pierwszego dnia dostałem jedno spotkanie, prezentację i wyjazd do klienta z szefem. Potem: „umiesz sprzedawać, to radź sobie sam”. Szef nie miał czasu mnie szkolić, bo miał tysiąc innych spraw.",
      "Sprzedawałem, jak umiałem. Dziś wiem, że gdyby ktoś codziennie przez 10 minut grał ze mną trudnego klienta i mówił, co poprawić, miałbym dużo lepsze wyniki. Mój szef też, bo widziałby, gdzie tracę, zanim stracił klienta.",
    ],
    wyobraz: [
      "Poniedziałek, 8:00. Otwierasz panel. Czterech ćwiczyło w piątek, jeden nie ćwiczy od tygodnia. Średnia zespołu 6,8, trend w górę. Marta nie domyka. Tomek nie zadaje pytań.",
      "Na rozmowie 1:1 nie pytasz „jak idzie?”. Mówisz: „Tomek, trzy rozmowy z rzędu bez pytania o budżet. Dziś ćwiczysz to.” Dziesięć minut, nie godzina. I wiesz, o czym mówisz, bo widziałeś rozmowę.",
    ],
    dla: [
      "Prowadzisz firmę z zespołem 3-50 handlowców i sprzedajecie przez rozmowę: telefon albo spotkanie",
      "Jesteś dyrektorem albo kierownikiem sprzedaży i masz dość powtarzania tego samego",
      "Chcesz widzieć w liczbach, kto ćwiczy i kto rośnie, zamiast wierzyć na słowo",
    ],
    liczby: [
      ["4,7 mies.", "Tyle średnio trwa wdrożenie nowego handlowca, zanim zacznie sprzedawać na pełnych obrotach. Przez ten czas uczy się na Twoich klientach.", "The Bridge Group, badanie 2025, 351 firm"],
      ["47 %", "Tylko tylu handlowców korzysta z CRM regularnie. Narzędzie, którego szef nie pilnuje, umiera. Pokażę, jak zrobić, żeby trening nie podzielił jego losu.", "Oracle, badanie sprzedawców, 2020"],
      ["+34 %", "Tyle więcej spraw na godzinę załatwiali najmniej doświadczeni pracownicy, którym pomagało AI. Najwięcej zyskują ci, którzy sprzedają najsłabiej.", "Brynjolfsson, Li, Raymond, Quarterly Journal of Economics, 2025, 5 179 osób"],
    ],
    bonus: "",
    faq: [
      ["Moi handlowcy nie korzystają nawet z CRM. Z tego też nie będą.", "Z CRM-u nie korzystają, bo to dla nich dodatkowa robota bez korzyści dla nich samych. Tu jest odwrotnie: handlowiec dzwoni 10 minut dziennie do klienta AI i od razu dostaje ocenę, co poprawić, żeby sprzedawać więcej. A Ty widzisz w panelu, kto ćwiczył, a kto nie. Na webinarze pokażę, jak to uruchomić, żeby działało bez Twojego pilnowania."],
      ["Nie mam czasu szkolić ludzi. Czy to dla mnie?", "Właśnie dla Ciebie. Cały webinar jest o tym, jak przestać być trenerem na etacie i dalej wiedzieć, co zespół mówi klientom."],
      ["Czy to kolejne wdrożenie IT?", "Nie. Handlowiec dostaje link i hasło, dzwoni do klienta AI z przeglądarki. Zero integracji, zero szkolenia z obsługi."],
      ["Gdzie się odbywa?", "Online, na Zoomie. Link otrzymasz na e-mail od razu po zapisie, a potem przypomnienie dzień przed i godzinę przed. Wystarczy telefon albo komputer, kamera nie jest potrzebna."],
      ["Czy będzie nagranie?", "Nie. Nie będzie dostępnego nagrania ze spotkania, dlatego zapisz je w kalendarzu."],
    ],
    ostrzezenie: "Jeśli nic nie zmienisz, listopad będzie wyglądał jak październik. Ten sam plan na 70 %, te same rozmowy 1:1 o tym samym, ten sam handlowiec, który „na pewno się poprawi”. Problem nie znika, bo go nie widać.",
    ps: "P.S. Środa 4.11, 19:00, Zoom, 60 minut, bezpłatnie, bez nagrania. Jedno zdanie, które zostanie Ci po webinarze: nie da się poprawić tego, czego nie widać.",
    przycisk: "Rezerwuję miejsce na środę 19:00",
    przyciskPod: "Link do Zooma dostaniesz od razu na maila. Nagrania nie będzie, więc wpisz do kalendarza.",
  },
};
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

  const cta = (
    <a className={`${s.przycisk} ${s.przyciskDol}`} href="#zapis">
      {t.przycisk}
    </a>
  );

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
          {/* 29.10 (USER_001): wezwanie odbiorców jako badge, zamiast „Bezpłatny webinar na żywo · data”. */}
          <span className={s.znaczek}>
            <i className={s.live} />
            {t.wezwanie ?? `Bezpłatny webinar na żywo · ${WEBINAR.dzien} ${WEBINAR.data} · ${WEBINAR.godzina}`}
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
          {t.otwarcie ? (
            <div className={s.otwarcie}>
              <p className={s.otwarcieWstep}>{t.otwarcie.wstep}</p>
              <ul>
                {t.otwarcie.pytania.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className={s.lead}>{t.otwarcie.po}</p>
            </div>
          ) : (
            <p className={s.lead}>{t.lead}</p>
          )}
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
              <b>Nagranie</b>bez nagrania
            </li>
          </ul>
        </div>

        <div className={s.karta} id="zapis">
          {stan === "gotowe" ? (
            <div className={s.gotowe}>
              <div className={s.ptaszek}>✓</div>
              <h2 className={s.h2}>Jesteś zapisany!</h2>
              <p className={s.opis}>Wysłałem Ci maila z przyciskiem „Potwierdzam zapis”. Kliknij go, a od razu dostaniesz link do Zooma (sprawdź też „Oferty” albo spam). Do zobaczenia: {WEBINAR.dzien}, {WEBINAR.godzina}.</p>
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
                {stan === "wysylam" ? "Zapisuję…" : t.przycisk}
              </button>
              <p className={s.przyciskPod}>{t.przyciskPod}</p>
            </form>
          )}
        </div>
      </header>

      {t.bolaczki && t.bolaczki.length > 0 && (
        <section className={s.sekcja}>
          <h2 className={s.h2Duzy}>
            Znasz to? <span className={s.g}>Słyszę to od właścicieli firm co tydzień.</span>
          </h2>
          <div className={`${s.siatka} ${s.siatkaCytaty}`}>
            {t.bolaczki.map(([h, o]) => (
              <div className={`${s.kafel} ${s.cytat}`} key={h}>
                <span className={s.nr}>„</span>
                <h3>{h}</h3>
                <p>{o}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {t.koszt && t.koszt.length > 0 && (
        <section className={s.sekcja}>
          <div className={s.dwie}>
            <div>
              <h2 className={s.h2Duzy}>
                Ile to kosztuje <span className={s.g}>co miesiąc</span>
              </h2>
              <p className={s.opisSekcji}>Nie chodzi o to, że zespół robi 70 % planu. Chodzi o to, co dzieje się przez te brakujące 30 %.</p>
            </div>
            <ul className={s.koszt}>
              {t.koszt.map(([h, o]) => (
                <li key={h}>
                  <b>{h}</b> {o}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {t.historia && t.historia.length > 0 && (
        <section className={s.sekcja}>
          <div className={s.historia}>
            <img src="/jakub.jpg" alt="Jakub Chodakowski" width={120} height={120} />
            <div>
              <h2 className={s.h2Duzy}>
                Byłem po drugiej stronie. <span className={s.g}>Jako handlowiec.</span>
              </h2>
              {t.historia.map((p) => (
                <p key={p.slice(0, 30)}>{p}</p>
              ))}
              <span className={s.podpis}>Jakub Chodakowski, CEO</span>
            </div>
          </div>
          <div className={s.ctaSrodek}>{cta}</div>
        </section>
      )}

      <section className={s.sekcja}>
        <h2 className={s.h2Duzy}>
          Co otrzymasz w 60 minut <span className={s.g}>i co z tego będziesz miał</span>
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

      {t.wyobraz && t.wyobraz.length > 0 && (
        <section className={s.sekcja}>
          <div className={s.wyobraz}>
            <h2 className={s.h2Duzy}>
              Wyobraź sobie <span className={s.g}>pierwszy poniedziałek po wdrożeniu</span>
            </h2>
            {t.wyobraz.map((p) => (
              <p key={p.slice(0, 30)}>{p}</p>
            ))}
            <p className={s.wyobrazPod}>Tak wygląda panel szefa, który pokażę o 19:42.</p>
          </div>
        </section>
      )}

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
          <div className={s.liczby}>
            {t.liczby.map(([l, o, z]) => (
              <div className={s.liczba} key={l}>
                <span className={s.wielka}>{l}</span>
                <p>{o}</p>
                <small>Źródło: {z}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!t.historia && (
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
      )}

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
        {t.ostrzezenie && <p className={s.ostrzezenie}>{t.ostrzezenie}</p>}
        <h2 className={s.h2Duzy}>
          {WEBINAR.dzien[0].toUpperCase() + WEBINAR.dzien.slice(1)}, {WEBINAR.godzina}. <span className={s.g}>Do zobaczenia.</span>
        </h2>
        <Zegar />
        {cta}
        <p className={s.przyciskPod}>{t.przyciskPod}</p>
        {t.ps && <p className={s.ps}>{t.ps}</p>}
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
