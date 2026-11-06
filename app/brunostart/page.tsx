import type { Metadata } from "next";
import s from "./start.module.css";
import PasekTel from "./pasek-tel";
import Pokaz from "./pokaz";
import { DNI, GWARANCJA, LICZBY, PAKIETY, linkKup, zl } from "./dane";

// 5.11 (USER_001): LP B2C „Każdy może nauczyć się sprzedaży” = salesbruno.pl/start (docelowo strona główna salesbruno.pl).
// 2. wersja tego dnia („UX/UI o niebo lepszy, mniej tekstu, lepszy mockup”): połowa tekstu, każda sekcja = nagłówek + 1 zdanie
// + element wizualny; telefon = ekran rozmowy głosowej z Bruno. Kolejność Popiela zostaje: wezwanie → obietnica → liczby
// → jak to działa (jak nauka języka) → znasz to? → kto → program → gwarancja → dla kogo → 2 pakiety → FAQ → finał + P.S.
// Przycisk „Kupuję” = link Stripe z dane.ts; po płatności Stripe wraca na /formularzbruno?pakiet=<id>.
export const metadata: Metadata = {
  title: "Naucz się sprzedaży w 30 dni z Bruno AI | 200 zł albo zwrot pieniędzy",
  description: "Każdy może nauczyć się sprzedaży. Bruno, Twój nauczyciel AI, codziennie ćwiczy z Tobą rozmowę z klientem i mówi, co poprawić. 30 dni, 15 minut dziennie, gwarancja zwrotu.",
  openGraph: {
    title: "Naucz się sprzedaży w 30 dni z Bruno AI",
    description: "Codziennie jedna rozmowa z klientem AI, ocena i jedna rzecz do poprawy. Jak nauka języka. 200 zł albo zwrot.",
    type: "website",
  },
};

const start = PAKIETY[0];
const pro = PAKIETY[1];
const proc = (n: number) => `${((n / LICZBY.top10Handlowiec.kwota) * 100).toFixed(0)}%`;

const faq: [string, string][] = [
  ["Nie mam doświadczenia. Dam radę?", "Tak. Zaczynasz od poziomu 1 i łatwego klienta. Trudniejszy pojawia się dopiero, gdy zaliczysz poprzedni poziom."],
  ["Ile czasu dziennie?", "Około 15 minut: lekcja (5 min), rozmowa z Bruno (5 min), ocena (2 min). W pakiecie Pro możesz zrobić do 5 rozmów dziennie."],
  ["Jak działa gwarancja?", `Trenujesz co najmniej ${GWARANCJA.dniTreninguMin} z ${DNI} dni. Nie sprzedajesz lepiej? Piszesz jednego maila i oddajemy całe pieniądze.`],
  ["Kiedy dostanę dostęp?", "Po płatności wypełniasz formularz: co sprzedajesz i komu. Ustawiamy Bruno i w 24 godziny dostajesz dostęp na e-mail."],
  ["Czy to działa w mojej branży?", "Tak, jeśli sprzedajesz przez rozmowę: telefon, spotkanie, wideo. Bruno udaje klienta z Twojej branży i mówi to, co Twoi klienci."],
];

const Ikona = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default function Page() {
  return (
    <Pokaz>
      <div className={`${s.root} bruno-lp-jasne`}>
        <nav className={s.nav}>
          <div className={s.navIn}>
            <a className={s.logo} href="/start">
              Bruno AI<i />
            </a>
            <a className={s.navCta} href="#pakiety">
              Zacznij za {zl(start.cena)}
            </a>
          </div>
        </nav>

        {/* ---------- HERO ---------- */}
        <header className={s.hero}>
          <div>
            <span className={s.wezwanie}>
              <i />
              Dla początkujących i dla tych, którzy już sprzedają
            </span>
            <h1 className={s.h1}>
              Każdy może nauczyć się sprzedaży.
              <br />
              <span className={s.g}>Ty też. W {DNI} dni.</span>
            </h1>
            <p className={s.lead}>
              Bruno to Twój nauczyciel. Codziennie ćwiczy z Tobą rozmowę z klientem: przez telefon, na spotkaniu albo w wiadomościach. Potem mówi, co zrobić lepiej. Efekt: <b>więcej klientów i więcej pieniędzy. W {DNI} dni albo zwrot pieniędzy.</b>
            </p>
            <div className={s.heroCta}>
              <a className={s.btn} href="#pakiety">
                Chcę nauczyć się sprzedawać
              </a>
              <a className={s.linkCichy} href="#jak">
                Jak to działa
              </a>
            </div>
            <ul className={s.fakty}>
              <li>
                <b>15 min</b> dziennie
              </li>
              <li>
                <b>{DNI} dni</b> z nauczycielem
              </li>
              <li>
                <b>od {zl(start.cena)}</b>, płacisz raz
              </li>
              <li>
                <b>zwrot</b>, jeśli nie zadziała
              </li>
            </ul>
          </div>

          <div className={s.scena}>
            <div className={`${s.plakietka} ${s.plakietkaA}`}>
              <span className={s.plakietkaIkona} style={{ background: "var(--orangeBg)", color: "var(--orange)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 23c-3.9 0-7-2.9-7-6.6 0-2.6 1.4-4.8 2.8-6.4.4 1.3 1.3 2.3 2.5 2.7-.4-3 1-6 3.6-7.7 0 2.2.9 3.6 2.5 5 1.5 1.5 2.6 3.3 2.6 5.6 0 4.1-3.2 7.4-7 7.4z" />
                </svg>
              </span>
              <span>
                7 dni z rzędu<small>Twoja seria</small>
              </span>
            </div>
            <div className={`${s.plakietka} ${s.plakietkaB}`}>
              <span className={s.plakietkaIkona} style={{ background: "var(--greenBg)", color: "var(--green)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </span>
              <span>
                +9 punktów od wczoraj<small>Poziom 3 z 6</small>
              </span>
            </div>
            <div className={s.telefon} aria-label="Tak wygląda trening z Bruno">
              <div className={s.ekran}>
                <div className={s.statusBar}>
                  <span>9:41</span>
                  <span className={s.wyspa} />
                  <span className={s.statusIkony}>
                    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden="true">
                      <rect x="0" y="7" width="3" height="4" rx="0.8" />
                      <rect x="4.3" y="5" width="3" height="6" rx="0.8" />
                      <rect x="8.6" y="2.5" width="3" height="8.5" rx="0.8" />
                      <rect x="13" y="0" width="3" height="11" rx="0.8" />
                    </svg>
                    <svg width="24" height="11" viewBox="0 0 24 11" fill="none" aria-hidden="true">
                      <rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke="currentColor" />
                      <rect x="2" y="2" width="16" height="7" rx="1.8" fill="currentColor" />
                      <rect x="22" y="3.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" />
                    </svg>
                  </span>
                </div>
                <div className={s.ekranNav}>
                  <span className={s.wstecz}>
                    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10 2L2 10l8 8" />
                    </svg>
                  </span>
                  <b>Dzień 7 z {DNI}</b>
                  <div className={s.pierscien}>
                    <i>23%</i>
                  </div>
                </div>
                <div className={s.lekcjaChip}>
                  <span>Lekcja 7</span>Klient mówi „pomyślę”
                </div>
                <div className={s.rozmowca}>
                  <div className={s.awatar}>
                    <div className={s.awatarIn}>
                      <span>B</span>
                    </div>
                  </div>
                  <b>Bruno</b>
                  <span className={s.rola}>właściciel sklepu · klient</span>
                  <span className={s.czas}>
                    <i />
                    02:14
                  </span>
                </div>
                <div className={s.transkrypcja}>
                  <small>Transkrypcja na żywo</small>
                  <div className={s.dymki}>
                    <div className={`${s.dymek} ${s.dymekBruno}`}>Brzmi ciekawie, ale muszę się jeszcze zastanowić.</div>
                    <div className={`${s.dymek} ${s.dymekTy}`}>Jasne. Co dokładnie chcesz przemyśleć?</div>
                    <div className={`${s.dymek} ${s.dymekBruno} ${s.pisze}`} aria-label="Bruno mówi">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
                <div className={s.sterowanie} aria-hidden="true">
                  <div>
                    <span>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
                      </svg>
                    </span>
                    wycisz
                  </div>
                  <div>
                    <span className={s.rozlacz}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.7 15.2l-3.5-1.4a1.5 1.5 0 0 0-1.6.4l-1.3 1.5a14 14 0 0 1-6.9-6.9l1.5-1.3a1.5 1.5 0 0 0 .4-1.6L8.9 2.4A1.5 1.5 0 0 0 7.2 1.5L3.6 2.3A1.5 1.5 0 0 0 2.4 3.8C2.4 13.6 10.4 21.6 20.2 21.6a1.5 1.5 0 0 0 1.5-1.2l.8-3.6a1.5 1.5 0 0 0-.8-1.6z" transform="rotate(135 12 12)" />
                      </svg>
                    </span>
                    zakończ
                  </div>
                  <div>
                    <span>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    </span>
                    głośnik
                  </div>
                </div>
                <div className={s.homeBar} />
              </div>
            </div>
          </div>
        </header>

        {/* ---------- LICZBY ---------- */}
        <section className={s.sekcja} data-pokaz>
          <span className={s.etykieta}>Liczby</span>
          <h2 className={s.h2}>
            Kto umie sprzedawać, <span className={s.g}>ten zarabia więcej.</span>
          </h2>
          <div className={s.liczby}>
            <figure className={s.wykres} role="img" aria-label="Pensja miesięczna przed podatkiem: typowa w Polsce 7 695 zł, typowy handlowiec 8 428 zł, najlepsi handlowcy ponad 22 260 zł">
              <h3>Pensja na miesiąc (przed podatkiem)</h3>
              <div className={s.slupek}>
                <span>
                  <b>Typowa pensja w Polsce</b>
                  {zl(LICZBY.medianaPL.kwota)}
                </span>
                <div className={s.slupekPasek}>
                  <i style={{ width: proc(LICZBY.medianaPL.kwota) }} />
                </div>
              </div>
              <div className={s.slupek}>
                <span>
                  <b>Typowy handlowiec</b>
                  {zl(LICZBY.medianaHandlowiec.kwota)}
                </span>
                <div className={s.slupekPasek}>
                  <i style={{ width: proc(LICZBY.medianaHandlowiec.kwota) }} />
                </div>
              </div>
              <div className={`${s.slupek} ${s.slupekOr}`}>
                <span>
                  <b>Najlepsi handlowcy (10 %)</b>
                  <u>ponad {zl(LICZBY.top10Handlowiec.kwota)}</u>
                </span>
                <div className={s.slupekPasek}>
                  <i style={{ width: "100%" }} />
                </div>
              </div>
              <figcaption className={s.wykresPod}>
                {LICZBY.medianaPL.zrodlo} · {LICZBY.medianaHandlowiec.zrodlo}
              </figcaption>
            </figure>
            <div className={s.stat}>
              <div className={s.statKafel}>
                <span className={s.wielka}>
                  {LICZBY.wygrane.top} % <span className={s.g}>vs {LICZBY.wygrane.reszta} %</span>
                </span>
                <p>tyle rozmów kończy się sprzedażą u najlepszych, a tyle u reszty. Ten sam produkt, inna rozmowa.</p>
                <span className={s.zrodlo}>{LICZBY.wygrane.zrodlo}</span>
              </div>
              <div className={s.statKafel}>
                <span className={s.wielka}>+{LICZBY.ai.procent} %</span>
                <p>o tyle lepiej szło nowym pracownikom, gdy w rozmowie pomagało im AI.</p>
                <span className={s.zrodlo}>{LICZBY.ai.zrodlo}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- JAK TO DZIAŁA ---------- */}
        <section className={`${s.sekcja} ${s.srodek}`} id="jak" data-pokaz>
          <span className={s.etykieta}>Jak to działa</span>
          <h2 className={s.h2}>
            Jak nauka języka. <span className={s.g}>Codziennie krótko. Poziom po poziomie.</span>
          </h2>
          <div className={s.kroki}>
            <div className={s.krok}>
              <div className={s.krokIkona}>
                <Ikona d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
              </div>
              <h3>Lekcja dnia</h3>
              <em>5 minut</em>
              <p>Jeden sposób na rozmowę. Prosto, z przykładem.</p>
            </div>
            <div className={s.krok}>
              <div className={s.krokIkona}>
                <Ikona d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </div>
              <h3>Rozmowa z Bruno</h3>
              <em>5 minut, głosem</em>
              <p>Bruno udaje Twojego klienta. Mówi „za drogo” albo „pomyślę”. Ty odpowiadasz, jak przez telefon.</p>
            </div>
            <div className={s.krok}>
              <div className={s.krokIkona}>
                <Ikona d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
              </div>
              <h3>Ocena i jedna rada</h3>
              <em>2 minuty</em>
              <p>Dostajesz wynik od 0 do 100 i jedną rzecz do poprawy na jutro.</p>
            </div>
          </div>
          <div className={s.sciezka}>
            {[
              ["1", "Twój klient", "kto i gdzie", "ok"],
              ["2", "Pierwsza rozmowa", "jak zacząć", "ok"],
              ["3", "Pytania", "klient sam mówi, czego chce", "teraz"],
              ["4", "Klient mówi „nie”", "„za drogo”, „pomyślę”", ""],
              ["5", "Prośba o decyzję", "„to bierzemy?”", ""],
              ["★", "Egzamin", "trudny klient i dyplom", ""],
            ].map(([nr, t, o, st]) => (
              <div className={s.poziom} key={t}>
                <div className={`${s.kropka} ${st === "ok" ? s.kropkaOk : st === "teraz" ? s.kropkaTeraz : ""}`}>{st === "ok" ? "✓" : nr}</div>
                <div>
                  <b>{t}</b>
                  <span>{o}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- PLATFORMA ---------- */}
        <section className={`${s.sekcja} ${s.sekcjaCiasna} ${s.srodek}`} id="platforma" data-pokaz>
          <span className={s.etykieta}>Cała platforma</span>
          <h2 className={s.h2}>
            Każdy element sprzedaży.
            <br />
            <span className={s.g}>W jednym miejscu.</span>
          </h2>
          <p className={s.opis}>Od tego, kto jest Twoim klientem, po prośbę o decyzję. Telefon, spotkanie na żywo, social media. Ty wybierasz, co dziś ćwiczysz.</p>
          <div className={s.moduly}>
            {[
              ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", "Twój klient", "Kto kupi to, co sprzedajesz, i gdzie go znaleźć. Od tego zaczynasz."],
              ["M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z", "Rozmowy telefoniczne", "Bruno dzwoni jak klient. Ty odpowiadasz na głos."],
              ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "Spotkania na żywo", "Rozmowa przy stole. Dłuższa, spokojniejsza, z prośbą o decyzję na końcu."],
              ["M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z", "Sprzedaż w social mediach", "Messenger, Instagram, WhatsApp. Piszesz do klienta, Bruno odpisuje jak on."],
              ["M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10", "Klient mówi „nie”", "„Za drogo”, „pomyślę”, „mam już kogoś”. Ćwiczysz jedno, aż wejdzie w krew."],
              ["M20 6L9 17l-5-5", "Prośba o decyzję", "Jak zapytać „to bierzemy?” bez wciskania. I co zrobić po „nie”."],
              ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z", "Lekcje i powtórki", "Krótkie lekcje i fiszki, które wracają, aż zapamiętasz."],
              ["M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3", "Ocena po każdej rozmowie", "Wynik od 0 do 100. Co było dobrze i jedna rzecz do poprawy."],
              ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", "Postępy i dyplom", "Seria dni, wykres wyników, egzamin na koniec i dyplom z oceną."],
            ].map(([d, h, o]) => (
              <div className={s.krok} key={h} style={{ textAlign: "left" }}>
                <div className={s.krokIkona}>
                  <Ikona d={d} />
                </div>
                <h3>{h}</h3>
                <p style={{ marginTop: 8 }}>{o}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- ZNASZ TO ---------- */}
        <section className={s.sekcja} data-pokaz>
          <span className={s.etykieta}>Znasz to?</span>
          <h2 className={s.h2}>
            To nie Twoja wina.
            <br />
            <span className={s.g}>Nikt Cię tego nie uczył.</span>
          </h2>
          <div className={s.cytaty}>
            {[
              ["Nie mam gadanego.”", "Rozmowa z klientem to umiejętność, jak język obcy. Nikt nie rodzi się z angielskim."],
              ["Boję się, że klient mnie zgasi.”", "Bo każda rozmowa jest na serio. Nie masz gdzie poćwiczyć."],
              ["Klient mówi »pomyślę« i znika.”", "Słyszysz to co drugi raz. I zawsze odpowiadasz tak samo."],
            ].map(([h, o]) => (
              <div className={s.cytat} key={h}>
                <h3>{h}</h3>
                <p>{o}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- KTO ---------- */}
        <section className={`${s.sekcja} ${s.sekcjaCiasna}`} data-pokaz>
          <div className={s.historia}>
            <img src="/jakub.jpg" alt="Jakub Chodakowski" width={120} height={120} />
            <div>
              <h3>Też nie miałem „gadanego”. Nauczyłem się. Tak jak języka.</h3>
              <p>
                W pierwszej pracy w sprzedaży dostałem prezentację i „radź sobie sam”. Uczyłem się na prawdziwych klientach i traciłem ich. Trwało to lata. Gdyby ktoś codziennie przez 15 minut udawał
                trudnego klienta, zajęłoby to miesiąc. Dlatego zbudowałem Bruno.
              </p>
              <span className={s.podpis}>Jakub Chodakowski, twórca Bruno AI</span>
            </div>
          </div>
        </section>

        {/* ---------- PROGRAM ---------- */}
        <section className={s.sekcja} data-pokaz>
          <span className={s.etykieta}>Program</span>
          <h2 className={s.h2}>
            {DNI} dni. <span className={s.g}>Tydzień po tygodniu.</span>
          </h2>
          <div className={s.tygodnie}>
            {[
              ["Tydzień 1", "Klient i pierwsza rozmowa", "Kto jest Twoim klientem i gdzie go znaleźć. Jak zacząć, żeby chciał słuchać."],
              ["Tydzień 2", "Pytania i cena", "5 pytań, po których klient sam mówi, czego potrzebuje. Jak powiedzieć cenę i nie przepraszać za nią."],
              ["Tydzień 3", "Klient mówi „nie”", "„Pomyślę”, „mam już kogoś”, „nie teraz”. 10 najczęstszych i co wtedy powiedzieć."],
              ["Tydzień 4", "Prośba o decyzję", "Jak zapytać „to bierzemy?” bez wciskania. Egzamin z trudnym klientem. Wynik na dyplom."],
            ].map(([nr, t, o]) => (
              <div className={s.tydzien} key={nr}>
                <small>{nr}</small>
                <h3>{t}</h3>
                <p>{o}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- GWARANCJA ---------- */}
        <section className={`${s.sekcja} ${s.sekcjaCiasna}`} id="gwarancja" data-pokaz>
          <div className={s.gwarancja}>
            <span className={s.wielka}>100 %</span>
            <div>
              <h3>Nauczysz się w {DNI} dni albo zwrot pieniędzy.</h3>
              <p>
                Trenujesz co najmniej {GWARANCJA.dniTreninguMin} z {DNI} dni. Nie sprzedajesz lepiej? Piszesz jednego maila i oddajemy całe pieniądze. Masz też 14 dni, żeby zrezygnować bez podawania
                powodu.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- DLA KOGO ---------- */}
        <section className={`${s.sekcja} ${s.sekcjaCiasna}`} data-pokaz>
          <span className={s.etykieta}>Dla kogo</span>
          <h2 className={s.h2}>
            Zaczynasz albo już sprzedajesz.
            <br />
            <span className={s.g}>Efekt ten sam: więcej klientów, więcej pieniędzy.</span>
          </h2>
          <div className={s.dlaKogo}>
            <div className={s.grupa}>
              <h3>Zaczynasz</h3>
              <ul className={s.lista}>
                <li>Chcesz dorobić i sprzedawać coś swojego albo czyjegoś</li>
                <li>Myślisz o pracy w sprzedaży, ale „nie masz gadanego”</li>
                <li>Masz własną firmę i sam rozmawiasz z klientami</li>
              </ul>
              <p>Po {DNI} dniach: pierwsi klienci i spokój w rozmowie.</p>
            </div>
            <div className={s.grupa}>
              <h3>Już sprzedajesz</h3>
              <ul className={s.lista}>
                <li>Masz rozmowy, ale za mało z nich kończy się sprzedażą</li>
                <li>Klienci mówią „pomyślę” i znikają</li>
                <li>Chcesz wyższej prowizji albo lepszej firmy</li>
              </ul>
              <p>Po {DNI} dniach: z 3 rozmów na 10 robisz 5. To Twoja podwyżka.</p>
            </div>
          </div>
        </section>

        {/* ---------- PAKIETY ---------- */}
        <section className={`${s.sekcja} ${s.srodek}`} id="pakiety" data-pokaz>
          <span className={s.etykieta}>Cena</span>
          <h2 className={s.h2}>
            Wybierz pakiet.
            <br />
            <span className={s.g}>Oba z gwarancją {DNI} dni.</span>
          </h2>
          <p className={s.opis}>Godzina z trenerem sprzedaży kosztuje 300-500 zł. Bruno masz codziennie. Wychodzi od {(start.cena / DNI).toFixed(2).replace(".", ",")} zł za dzień.</p>
          <div className={s.pakiety}>
            {PAKIETY.map((p) => (
              <article className={`${s.pakiet} ${p.polecany ? s.pakietRek : ""}`} key={p.id} style={{ textAlign: "left" }}>
                {p.polecany && <span className={s.polecany}>Najszybsze efekty</span>}
                <h3>{p.nazwa}</h3>
                <p className={s.pakietPod}>{p.podpis}</p>
                <div className={s.pakietCena}>
                  {zl(p.cena)}
                  <small>płacisz raz · {p.dni} dni</small>
                </div>
                <p className={s.pakietDzien}>
                  {(p.cena / p.dni).toFixed(2).replace(".", ",")} zł za dzień · {p.rozmowDziennie === 1 ? "1 rozmowa" : `do ${p.rozmowDziennie} rozmów`} dziennie
                </p>
                <ul className={s.punkty}>
                  {p.punkty.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <a className={s.btn} href={linkKup(p)}>
                  Kupuję za {zl(p.cena)}
                </a>
                <p className={s.pakietGw}>Karta, BLIK, Apple Pay · dostęp w 24 h · zwrot {DNI} dni</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className={`${s.sekcja} ${s.sekcjaCiasna} ${s.srodek}`} data-pokaz>
          <span className={s.etykieta}>Pytania</span>
          <h2 className={s.h2}>Najczęstsze pytania</h2>
          <div className={s.faq} style={{ textAlign: "left" }}>
            {faq.map(([p, o]) => (
              <details key={p}>
                <summary>{p}</summary>
                <p>{o}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------- FINAŁ ---------- */}
        <section className={`${s.sekcja} ${s.sekcjaCiasna}`} data-pokaz>
          <div className={s.koniec}>
            <h2 className={s.h2}>
              Dzień 31. <span className={s.g}>Więcej klientów. Więcej pieniędzy.</span>
            </h2>
            <p className={s.opis} style={{ margin: "16px auto 0" }}>
              Klient mówi „pomyślę”. Ty wiesz, co powiedzieć. Możesz dalej uczyć się na prawdziwych klientach i ich tracić. Albo przez {DNI} dni, po 15 minut, poćwiczyć z Bruno.
            </p>
            <div className={s.ctaSrodek}>
              <a className={s.btn} href="#pakiety">
                Zaczynam za {zl(start.cena)}
              </a>
              <span className={s.btnPod}>
                albo {pro.nazwa} za {zl(pro.cena)} z Jakubem na żywo
              </span>
            </div>
          </div>
          <p className={s.ps}>P.S. Nic nie ryzykujesz: {DNI} dni treningu, brak efektu, jeden mail i masz zwrot.</p>
        </section>

        <PasekTel tekst={`Zacznij za ${zl(start.cena)} · zwrot w ${DNI} dni`} />

        <footer className={s.stopka}>
          <span>Bruno AI · Jakub Chodakowski</span>
          <span>
            <a href="/regulamin">Regulamin</a> · <a href="/polityka-prywatnosci">Polityka prywatności</a>
          </span>
        </footer>
      </div>
    </Pokaz>
  );
}
