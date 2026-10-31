"use client";

import { useEffect, useState } from "react";
import w from "./webinar-lp.module.css";
import s from "./kurs-lp.module.css";
import { CENA, GWARANCJA, PROMO, cenaKursu, kursPoSlugu, programKursu, type Plan } from "@/lib/bruno/kursy";

// 30.10 (USER_001: „bardziej profesjonalnie, tak jak LP od Popiela”): JEDNA strona sprzedażowa dla każdego kursu.
// Układ wg kursu LP Popiela jak LP webinaru (components/bruno/webinar-lp.tsx), motyw Elmatic:
// wezwanie → nagłówek z obietnicą → pytania TAK/NIE → karta ceny z zegarem → „Znasz to?” → co tracisz → historia
// → program z „dzięki temu” → Bruno → wyobraź sobie → gwarancja → dla kogo / nie dla kogo → cena z porównaniem → FAQ z CTA co 3
// → ostrzeżenie + finał + P.S. Treść kursu z lib/bruno/kursy.ts.
// 30.10 (USER_001): od razu płatność (Stripe, /api/bruno/kursy/platnosc) i zegar -50 %: 3 h 42 min 18 s od pierwszego wejścia.

/** Koniec zegara: cookie (czyta serwer przy płatności) + localStorage. Brak = start teraz. */
function useKoniecPromo(): number | null {
  const [koniec, setKoniec] = useState<number | null>(null);
  useEffect(() => {
    const zCookie = Number(document.cookie.split("; ").find((c) => c.startsWith(`${PROMO.cookie}=`))?.split("=")[1] ?? "");
    let zapisany = Number.isFinite(zCookie) && zCookie > 0 ? zCookie : 0;
    if (!zapisany) {
      try {
        zapisany = Number(localStorage.getItem(PROMO.cookie) ?? "") || 0;
      } catch {}
    }
    const k = zapisany || Date.now() + PROMO.sekund * 1000;
    document.cookie = `${PROMO.cookie}=${k}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    try {
      localStorage.setItem(PROMO.cookie, String(k));
    } catch {}
    setKoniec(k);
  }, []);
  return koniec;
}

function useTeraz(): number | null {
  const [t, setT] = useState<number | null>(null);
  useEffect(() => {
    setT(Date.now());
    const i = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  return t;
}

const dwa = (n: number) => String(n).padStart(2, "0");

function Zegar({ zostalo }: { zostalo: number | null }) {
  const pola: [string, string][] =
    zostalo === null
      ? [["--", "godz."], ["--", "min"], ["--", "sek."]]
      : [
          [dwa(Math.floor(zostalo / 3600)), "godz."],
          [dwa(Math.floor((zostalo % 3600) / 60)), "min"],
          [dwa(zostalo % 60), "sek."],
        ];
  return (
    <div className={s.zegar} aria-label="Czas do końca przeceny">
      {pola.map(([v, e]) => (
        <div className={s.zegarPole} key={e}>
          <b>{v}</b>
          <span>{e}</span>
        </div>
      ))}
    </div>
  );
}

type Wspolne = { promo: boolean; zostalo: number | null };

function KartaCeny({ slug, promo, zostalo, statyczna }: Wspolne & { slug: string; statyczna?: boolean }) {
  const [plan, setPlan] = useState<Plan>("z-gory");
  const [czeka, setCzeka] = useState(false);
  const [blad, setBlad] = useState("");

  async function kup() {
    setBlad("");
    setCzeka(true);
    const zrodlo = new URLSearchParams(window.location.search).get("src") ?? "";
    const r = await fetch("/api/bruno/kursy/platnosc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kurs: slug, plan, zrodlo }),
    }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (d?.ok && d.url) {
      window.location.href = d.url;
      return;
    }
    setBlad(d?.blad ?? "Nie udało się otworzyć płatności. Spróbuj ponownie.");
    setCzeka(false);
  }

  const opcje: { p: Plan; nazwa: string; pod: string; polecana?: boolean }[] = [
    { p: "z-gory", nazwa: "Cały kurs z góry", pod: `${CENA.miesiecy} miesiące w jednej płatności`, polecana: true },
    { p: "miesiac", nazwa: "Co miesiąc", pod: `${cenaKursu("miesiac", promo)} zł teraz, potem jeszcze 2 raty`, polecana: false },
  ];

  return (
    <div className={`${s.karta} ${statyczna ? s.kartaStatyczna : ""}`} id={statyczna ? undefined : "cena"}>
      {promo ? (
        <>
          <div className={s.promoPasek}>
            <span className={s.rabat}>-{PROMO.rabatProcent} %</span>
            <span className={s.promoNapis}>Przecena kończy się za</span>
          </div>
          <Zegar zostalo={zostalo} />
        </>
      ) : (
        <p className={s.promoNapis} style={{ textAlign: "left", marginBottom: 14 }}>
          Przecena się skończyła. Obowiązuje cena regularna.
        </p>
      )}
      {opcje.map((o) => (
        <button key={o.p} type="button" className={`${s.opcja} ${plan === o.p ? s.opcjaWl : ""}`} onClick={() => setPlan(o.p)} aria-pressed={plan === o.p}>
          <div className={s.opcjaGora}>
            <span className={s.opcjaNazwa}>
              {o.nazwa}
              {o.polecana && <span className={s.polecana}>Najtaniej</span>}
            </span>
            <span className={s.cena}>
              {promo && <span className={s.stara}>{cenaKursu(o.p, false)} zł</span>}
              {cenaKursu(o.p, promo)} zł
            </span>
          </div>
          <p className={s.opcjaPod}>
            {o.p === "miesiac" ? `${cenaKursu("miesiac", promo)} zł / mies. przez ${CENA.miesiecy} miesiące` : o.pod}
          </p>
        </button>
      ))}
      <button type="button" className={`${w.przycisk} ${s.kup}`} onClick={kup} disabled={czeka}>
        {czeka ? "Otwieram płatność…" : `Tak, zaczynam za ${cenaKursu(plan, promo)} zł`}
      </button>
      {blad && <p className={s.blad}>{blad}</p>}
      <p className={s.kupPod}>
        Bezpieczna płatność kartą, BLIK lub przelewem. W 24 h dzwonię i dostajesz dostęp. Brak oferty pracy w {GWARANCJA.dniNaOferte} dni od certyfikatu = zwrot 100 %.
      </p>
    </div>
  );
}

export default function KursLp({ slug }: { slug: string }) {
  const k = kursPoSlugu(slug)!;
  const program = programKursu(k);
  const start = k.poziom === "start";
  const koniec = useKoniecPromo();
  const teraz = useTeraz();
  const zostalo = koniec === null || teraz === null ? null : Math.max(0, Math.floor((koniec - teraz) / 1000));
  // Przed odczytem cookie pokazujemy cenę promocyjną (nowy gość zawsze ją dostaje), potem z zegara.
  const promo = zostalo === null || zostalo > 0;
  const cenaOd = cenaKursu("z-gory", promo);

  const cta = (tekst: string) => (
    <div className={s.ctaSrodek}>
      <a className={w.przycisk} href="#cena">
        {tekst}
      </a>
    </div>
  );

  const pytania = start
    ? ["Chcesz zarabiać więcej, niż zarabiasz dziś?", "Myślisz o sprzedaży, ale nie wiesz, od czego zacząć?", "Boisz się, że bez doświadczenia nikt Cię nie zatrudni?"]
    : ["Masz dużo rozmów, a za mało podpisanych umów?", "Klienci mówią „pomyślę” i znikają?", "Chcesz zarabiać więcej z tych samych klientów?"];

  const bolaczki: [string, string][] = start
    ? [
        ["Wysłałem 50 CV i nikt nie oddzwonił.", "Bez doświadczenia CV ląduje na końcu stosu."],
        ["Firma da tydzień szkolenia, a potem radź sobie sam.", "Uczysz się na prawdziwych klientach. Każdy błąd to stracona prowizja."],
        ["Boję się, że klient mnie zgasi.", `Słyszysz ${k.branzowe.obiekcje[0]} i nie wiesz, co powiedzieć.`],
        ["Kursy dają papier, ale nie pracę.", "Zaświadczenie za obecność nie przekonuje żadnego pracodawcy."],
      ]
    : [
        ["Klient mówi „pomyślę” i już nie odbiera.", "Rozmowa była dobra, a umowy nie ma."],
        ["Zbijają mi cenę na koniec.", "Oddajesz rabat, żeby w ogóle coś podpisać. Prowizja maleje."],
        ["Uczę się na własnych błędach od lat.", "Nikt nie pokazał Ci, w którym momencie rozmowy tracisz klienta."],
        ["Chcę awansu albo lepszej firmy.", "Bez wyników w liczbach trudno o lepsze warunki."],
      ];

  const dziekiTemu = [
    "Dzięki temu znasz produkt i nie gubisz się w rozmowie.",
    `Dzięki temu ${k.branzowe.obiekcje[0]} przestaje kończyć rozmowę.`,
    "Dzięki temu idziesz na rozmowę o pracę z wynikiem, nie z obietnicą.",
  ];

  const faq: [string, string][] = [
    ["Ile czasu dziennie potrzebuję?", "Około 30 minut: 5 rozmów z Bruno po kilka minut i powtórka technik. Możesz ćwiczyć wieczorem, po pracy, z telefonu."],
    [
      "Czy muszę mieć doświadczenie?",
      start ? "Nie. Ten kurs jest dla osób, które zaczynają. Zaczynamy od tego, jak wygląda dobra rozmowa." : "Tak. Ten kurs jest dla osób, które już sprzedają. Zaczynasz? Wybierz kurs Start w tej samej branży.",
    ],
    ["Czy płacę za znalezienie pracy?", "Nie. Płacisz tylko za kurs. Pomoc w znalezieniu pracy kosztuje Cię 0 zł."],
    ["Kiedy dostanę zwrot?", `Gdy masz certyfikat, a w ciągu ${GWARANCJA.dniNaOferte} dni nie dostaniesz od nas oferty pracy. Oddajemy całą kwotę, którą zapłaciłeś.`],
    ["Co, jeśli oferta mi nie pasuje?", `Odrzucasz ją, a my szukamy dalej przez kolejny miesiąc. Masz ${GWARANCJA.szans} szanse.`],
    ["Mogę zrezygnować?", "Tak. Masz 14 dni na odstąpienie od umowy bez podawania powodu."],
  ];

  return (
    <div className={`${w.root} ${w.mElm} bruno-lp-jasne`}>
      <nav className={w.nav}>
        <a className={w.logo} href="/kursy" style={{ textDecoration: "none" }}>
          Bruno AI · Kursy<i className={w.kropka} />
        </a>
        <a className={`${w.navCta} ${s.navCta}`} href="#cena">
          {promo ? `Zapisz się -${PROMO.rabatProcent} %` : "Zapisz się"}
        </a>
      </nav>

      <header className={s.heroKursu}>
        <div>
          <span className={w.znaczek}>{start ? `Dla osób, które chcą zacząć w sprzedaży · ${k.branza}` : `Dla handlowców z doświadczeniem · ${k.branza}`}</span>
          <h1 className={`${w.h1} ${s.h1}`}>
            {k.tytul} w {CENA.miesiecy} miesiące
            <br />
            <span className={w.g}>z gwarancją pracy. Albo oddajemy pieniądze.</span>
          </h1>
          <div className={s.otwarcie}>
            <ul>
              {pytania.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className={s.otwarciePo}>
              Jeśli choć raz odpowiedziałeś „tak”, przeczytaj do końca. {k.obietnica} Codziennie trenujesz z klientem AI, a po kursie łączymy Cię z pracodawcą.
            </p>
          </div>
          <ul className={s.fakty}>
            <li>
              <b>Czas</b>
              {CENA.miesiecy} miesiące, ok. 30 min dziennie
            </li>
            <li>
              <b>Forma</b>online, z telefonu albo komputera
            </li>
            <li>
              <b>Trening</b>5 rozmów dziennie z klientem AI
            </li>
            <li>
              <b>Gwarancja</b>oferta pracy w {GWARANCJA.dniNaOferte} dni albo zwrot
            </li>
          </ul>
        </div>
        <KartaCeny slug={k.slug} promo={promo} zostalo={zostalo} />
      </header>

      <section className={w.sekcja}>
        <span className={s.etykieta}>Problem</span>
        <h2 className={w.h2Duzy}>
          Znasz to? <span className={w.g}>{start ? "Tak mówią ludzie, którzy chcą wejść do sprzedaży." : "Tak mówią handlowcy, z którymi rozmawiam."}</span>
        </h2>
        <div className={`${s.siatka} ${s.siatka2}`}>
          {bolaczki.map(([h, o]) => (
            <div className={s.kafel} key={h}>
              <span className={s.cudzyslow}>„</span>
              <h3>{h}</h3>
              <p>{o}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={w.sekcja}>
        <div className={s.dwie}>
          <div>
            <span className={s.etykieta}>Co tracisz</span>
            <h2 className={w.h2Duzy}>
              Ile Cię kosztuje <span className={w.g}>czekanie</span>
            </h2>
          </div>
          <ul className={s.koszt}>
            <li>
              <b>Tracisz pieniądze.</b> {start ? "Każdy miesiąc w pracy, której nie lubisz, to miesiąc bez prowizji, którą mógłbyś już zarabiać." : "Każde „pomyślę”, które nie wraca, to prowizja, która przeszła Ci koło nosa."}
            </li>
            <li>
              <b>Tracisz czas.</b> Uczysz się na prawdziwych klientach. Jeden błąd w rozmowie i klient idzie do konkurencji.
            </li>
            <li>
              <b>Tracisz pewność siebie.</b> Po trzeciej trudnej rozmowie z rzędu zaczynasz unikać telefonu.
            </li>
            <li>
              <b>A najgorsze:</b> firmy szukają handlowców, a nikt nie chce ich szkolić. Wygrywa ten, kto przychodzi już przygotowany.
            </li>
          </ul>
        </div>
      </section>

      <section className={w.sekcja}>
        <div className={s.historia}>
          <img src="/jakub.jpg" alt="Jakub Chodakowski" width={120} height={120} />
          <div>
            <span className={s.etykieta}>Kto prowadzi</span>
            <h2 className={w.h2Duzy}>
              Byłem tam, gdzie Ty. <span className={w.g}>Jako handlowiec.</span>
            </h2>
            <p>
              Pierwszego dnia w sprzedaży dostałem jedno spotkanie, prezentację i wyjazd do klienta z szefem. Potem usłyszałem: „umiesz sprzedawać, to radź sobie sam”. Uczyłem się na
              prawdziwych klientach i traciłem ich przez błędy, których nikt mi nie pokazał.
            </p>
            <p>
              Dziś wiem, że gdyby ktoś codziennie grał ze mną trudnego klienta i mówił, co poprawić, zarabiałbym więcej już w pierwszym roku. Dlatego zbudowałem Bruno: klienta AI, który
              rozmawia z Tobą głosem i ocenia każdą rozmowę.
            </p>
            <span className={s.podpis}>Jakub Chodakowski, twórca Bruno AI</span>
          </div>
        </div>
        {cta("Chcę zacząć kurs")}
      </section>

      <section className={w.sekcja}>
        <span className={s.etykieta}>Program</span>
        <h2 className={w.h2Duzy}>
          Twoje {CENA.miesiecy} miesiące. <span className={w.g}>W czwartym zaczynasz pracę.</span>
        </h2>
        <div className={s.siatka}>
          {program.map((m, i) => (
            <div key={m.tytul} className={s.kafel}>
              <span className={s.nr}>Miesiąc {i + 1}</span>
              <h3>{m.tytul}</h3>
              <ul className={s.punkty}>
                {m.punkty.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className={s.dzieki}>{dziekiTemu[i]}</p>
            </div>
          ))}
          <div className={`${s.kafel} ${s.kafelAkcent}`}>
            <span className={s.nr}>Miesiąc 4</span>
            <h3>Zaczynasz pracę</h3>
            <ul className={s.punkty}>
              <li>Masz certyfikat z wynikiem z Bruno</li>
              <li>Pracodawca wie, jak sprzedajesz, zanim Cię zatrudni</li>
              <li>Łączymy Cię z firmami z Twojej branży</li>
            </ul>
            <p className={s.dzieki}>Nie dostaniesz oferty? Oddajemy pieniądze.</p>
          </div>
        </div>
      </section>

      <section className={w.sekcja}>
        <span className={s.etykieta}>Jak trenujesz</span>
        <h2 className={w.h2Duzy}>
          Klient AI, który mówi jak prawdziwy. <span className={w.g}>I ocenia każdą rozmowę.</span>
        </h2>
        <p className={s.opisSekcji}>Bruno rozmawia z Tobą głosem jak klient z Twojej branży. Po każdej rozmowie dostajesz ocenę i wiesz, co poprawić. Trenujesz z takimi klientami:</p>
        <div className={s.chipy}>
          {k.klienciBruno.map((c) => (
            <span key={c} className={s.chip}>
              {c}
            </span>
          ))}
        </div>
        <div className={s.porownanie}>
          <div className={s.kafel}>
            <span className={s.wielka}>450</span>
            <p>rozmów treningowych w {CENA.miesiecy} miesiące, zanim zaczniesz pierwszą prawdziwą.</p>
          </div>
          <div className={s.kafel}>
            <span className={s.wielka}>{GWARANCJA.progCertyfikatu} %</span>
            <p>tyle trzeba mieć na egzaminie z Bruno, żeby dostać certyfikat. Pracodawca widzi wynik, nie obecność.</p>
          </div>
          <div className={s.kafel}>
            <span className={s.wielka}>+34 %</span>
            <p>tyle więcej załatwiali najmniej doświadczeni pracownicy, którym pomagało AI.</p>
            <span className={s.zrodlo}>Brynjolfsson, Li, Raymond, Quarterly Journal of Economics, 2025, 5 179 osób</span>
          </div>
        </div>
      </section>

      <section className={w.sekcja}>
        <div className={s.wyobraz}>
          <span className={s.etykieta}>Wyobraź sobie</span>
          <h2 className={w.h2Duzy}>
            Miesiąc 4. <span className={w.g}>Pierwszy dzień w nowej pracy.</span>
          </h2>
          <p>
            Klient mówi: {k.branzowe.obiekcje[1] ?? k.branzowe.obiekcje[0]}. Nie stresujesz się. Słyszałeś to od Bruno kilkadziesiąt razy i wiesz, co odpowiedzieć.
          </p>
          <p>Wieczorem dzwonisz do kogoś bliskiego: „Podpisałem pierwszą umowę”. Pierwsza prowizja jest Twoja.</p>
        </div>
      </section>

      <section className={w.sekcja} id="gwarancja">
        <div className={s.gwarancja}>
          <span className={s.etykieta}>Gwarancja</span>
          <h2 className={w.h2Duzy}>
            Praca albo zwrot pieniędzy. <span className={w.g}>Całe ryzyko jest po naszej stronie.</span>
          </h2>
          <ol>
            <li>
              Kończysz cały kurs i zdajesz egzamin z Bruno na co najmniej <b>{GWARANCJA.progCertyfikatu} %</b>. Dostajesz certyfikat.
            </li>
            <li>
              W ciągu <b>{GWARANCJA.dniNaOferte} dni</b> od certyfikatu łączymy Cię z pracodawcą i dostajesz ofertę pracy. Nie dostaniesz: oddajemy <b>100 %</b> pieniędzy.
            </li>
            <li>
              Odrzucisz ofertę: szukamy dalej przez kolejny miesiąc. Masz <b>{GWARANCJA.szans} szanse</b>. Jeśli w którymś miesiącu nie dostaniesz oferty, oddajemy pieniądze.
            </li>
            <li>
              Za pomoc w znalezieniu pracy płacisz <b>0 zł</b>. Płacisz tylko za kurs.
            </li>
          </ol>
        </div>
        {cta("Tak, chcę kurs z gwarancją")}
      </section>

      <section className={w.sekcja}>
        <div className={`${s.siatka} ${s.siatka2}`} style={{ marginTop: 0 }}>
          <div className={s.kafel}>
            <span className={s.etykieta}>Dla Ciebie, jeśli</span>
            <ul className={s.punkty}>
              {k.dlaKogo.map((d) => (
                <li key={d}>{d}</li>
              ))}
              <li>Dasz radę ćwiczyć ok. 30 minut dziennie</li>
            </ul>
          </div>
          <div className={s.kafel}>
            <span className={s.etykieta}>Nie dla Ciebie, jeśli</span>
            <ul className={`${s.punkty} ${s.nie}`}>
              <li>Szukasz papieru, a nie umiejętności</li>
              <li>Nie chcesz rozmawiać z ludźmi</li>
              <li>Nie masz 30 minut dziennie przez {CENA.miesiecy} miesiące</li>
            </ul>
          </div>
        </div>
        <p className={s.opisSekcji} style={{ marginTop: 28 }}>
          Gdzie możesz pracować po kursie:
        </p>
        <div className={s.chipy} style={{ marginTop: 12 }}>
          {k.pracodawcy.map((p) => (
            <span key={p} className={s.chip}>
              {p}
            </span>
          ))}
        </div>
      </section>

      <section className={w.sekcja}>
        <span className={s.etykieta}>Cena</span>
        <h2 className={w.h2Duzy}>
          Ile kosztuje kurs <span className={w.g}>i kiedy się zwraca</span>
        </h2>
        <div className={s.porownanie}>
          <div className={s.kafel}>
            <span className={s.wielka}>do 9 870 zł</span>
            <p>tyle kosztują kursy pośrednika nieruchomości w Bazie Usług Rozwojowych. Bez gwarancji pracy.</p>
            <span className={s.zrodlo}>uslugirozwojowe.parp.gov.pl, październik 2026</span>
          </div>
          <div className={s.kafel}>
            <span className={s.wielka}>{cenaOd} zł</span>
            <p>
              tyle kosztuje ten kurs z góry{promo ? ` w przecenie -${PROMO.rabatProcent} %` : ""}. To {(cenaOd / 90).toFixed(2).replace(".", ",")} zł dziennie przez {CENA.miesiecy} miesiące, mniej niż kawa.
            </p>
          </div>
          <div className={s.kafel}>
            <span className={s.wielka}>1 umowa</span>
            <p>Zwykle tyle wystarczy, żeby prowizja zwróciła cały kurs. A jeśli nie dostaniesz oferty pracy, oddajemy pieniądze.</p>
          </div>
        </div>
        <KartaCeny slug={k.slug} promo={promo} zostalo={zostalo} statyczna />
      </section>

      <section className={w.sekcja}>
        <span className={s.etykieta}>Pytania</span>
        <h2 className={w.h2Duzy}>FAQ</h2>
        <div className={w.faq}>
          {faq.slice(0, 3).map(([p, o]) => (
            <details key={p}>
              <summary>{p}</summary>
              <p>{o}</p>
            </details>
          ))}
        </div>
        {cta("Zapisuję się")}
        <div className={w.faq} style={{ marginTop: 32 }}>
          {faq.slice(3).map(([p, o]) => (
            <details key={p}>
              <summary>{p}</summary>
              <p>{o}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={`${w.sekcja} ${s.koniec}`}>
        <p className={s.ostrzezenie}>
          Masz dwie drogi. Możesz dalej wysyłać CV i uczyć się na prawdziwych klientach. Albo w {CENA.miesiecy} miesiące przygotować się z Bruno i wejść do pracy z certyfikatem i
          gwarancją. Czekanie nie sprawi, że będzie łatwiej.
        </p>
        <h2 className={w.h2Duzy}>
          {promo ? (
            <>
              Przecena -{PROMO.rabatProcent} % kończy się <span className={w.g}>za chwilę.</span>
            </>
          ) : (
            <>
              Zacznij dziś. <span className={w.g}>Za {CENA.miesiecy} miesiące możesz być w nowej pracy.</span>
            </>
          )}
        </h2>
        {promo && (
          <div style={{ maxWidth: 420, margin: "24px auto 0" }}>
            <Zegar zostalo={zostalo} />
          </div>
        )}
        {cta(`Tak, zaczynam za ${cenaOd} zł`)}
        <p className={s.ps}>
          P.S. Ryzyko jest po naszej stronie: kończysz kurs z certyfikatem i nie dostajesz oferty pracy w {GWARANCJA.dniNaOferte} dni, więc oddajemy Ci pieniądze. Za pomoc w znalezieniu pracy
          nie płacisz nic.
        </p>
      </section>

      <a className={w.pasekTel} href="#cena">
        {promo ? `Zapisz się -${PROMO.rabatProcent} % · ${cenaOd} zł` : `Zapisz się · ${cenaOd} zł`}
      </a>

      <footer className={w.stopka}>
        <span>Bruno AI · Jakub Chodakowski</span>
        <a href="/polityka-prywatnosci">Polityka prywatności</a>
      </footer>
    </div>
  );
}
