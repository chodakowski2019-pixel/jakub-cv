import type { Metadata } from "next";
import KontoForm from "@/components/bruno/praca/konto-form";
import BazaPasek from "@/components/bruno/praca/baza-pasek";
import KrokiAktywny from "@/components/bruno/praca/kroki-aktywny";
import d from "@/components/bruno/praca/dolacz.module.css";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { DNI_WERYFIKACJI, KROKI } from "@/lib/bruno/praca/profil-handlowca";

// 11.11 (USER_001): salesbruno.pl/praca = LP dla handlowców (proxy: /praca → /brunopraca/dolacz, oferty pracy przeniesione na /praca/oferty): dołącz do bazy sprawdzonych handlowców.
// Wygląd wg wzoru vision-ten-alpha.vercel.app (sam styl: tło w kropki, lekkie nagłówki, etykiety maszynowe).
// Ścieżka: konto → formularz (/praca/dolacz/profil) → komunikat o weryfikacji do 7 dni. Na razie poza indeksem.
export const dynamic = "force-dynamic";

const PROFIL = "/praca/dolacz/profil";
const tytul = "Tutaj to praca szuka Ciebie";
const opis = "Załóż profil handlowca. Firmy, które szukają ludzi do sprzedaży, same odzywają się do Ciebie. Bezpłatnie.";

// Obrazek podglądu leży w katalogu głównym, bo robots.txt zamyka /bruno/ i /praca/ (Facebook zgłaszał „Corrupted Image”).
export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.pl"),
  title: `${tytul} | SalesBruno.pl Praca`,
  description: opis,
  alternates: { canonical: "/praca" },
  openGraph: { title: tytul, description: opis, url: "/praca", siteName: "Bruno AI", locale: "pl_PL", type: "website", images: [{ url: "/og-praca-baza.png", width: 1200, height: 630, alt: "Bruno Sales: baza sprawdzonych handlowców" }] },
  robots: { index: false, follow: false },
};

// Zwykłe szukanie pracy obok bazy, krok po kroku.
const POROWNANIE: [string, string][] = [
  ["Szukasz ogłoszeń", "Zakładasz profil raz"],
  ["Wysyłasz CV do kolejnych firm", "Podajesz branżę i wyniki"],
  ["Czekasz na odpowiedź", "Sprawdzamy informacje"],
  ["Każdą rozmowę zaczynasz od zera", "Firma widzi Twój profil"],
  ["Zaczynasz od nowa", "Firma pisze do Ciebie"],
];

const ETAPY: [string, string][] = [
  ["Załóż konto", "Wpisz e-mail i hasło"],
  ["Wypełnij profil", `${KROKI.length} krótkich kroków. Zajmuje około 5 minut.`],
  ["Weryfikacja profilu", `Trwa do ${DNI_WERYFIKACJI} dni, wynik otrzymasz na e-mail`],
  ["Firmy piszą do Ciebie", "Pracodawca widzi profil i sam się z Tobą kontaktuje."],
];

// Karty profili na górze strony (układ wg kart Toptal). Imiona, stanowiska i wyniki na kartach są wymyślone.
// Zdjęcia (USER_001 11.11): Marta i Tomasz = specjaliści z lovemyself (zwiazki-lp/public/specjalisci: agnieszka-bloch, adam-radomski).
// Marcin = zdjęcie z banku Unsplash (unsplash.com/photos/pAtA8xe_iVM, licencja Unsplash: użytek komercyjny bez opłat).
// USER_001 oświadczył 11.11, że osoby z lovemyself dały mu pisemną zgodę. Znaczek „Przykład” zdjęty na jego polecenie.
const KARTY = [
  { foto: "/bruno/praca/baza/karta-marta-2.jpg", poz: "50% 20%", imie: "Marta Kaśmierz", rola: "Doradczyni klienta", mocne: ["Prezentacja oferty", "Opieka nad klientem"], plan: "90-100 %" },
  { foto: "/bruno/praca/baza/karta-marcin-6.jpg", poz: "50% 25%", imie: "Marcin Drożdzeń", rola: "Handlowiec B2B", mocne: ["Pozyskiwanie klientów", "Negocjacje"], plan: "100-120 %" },
  { foto: "/bruno/praca/baza/karta-tomasz-2.jpg", poz: "50% 20%", imie: "Tomasz Wojciechowski", rola: "Przedstawiciel handlowy", mocne: ["Umawianie spotkań", "Zamykanie sprzedaży"], plan: "Ponad 120 %" },
];

const PYTANIA: [string, string][] = [
  ["Ile to kosztuje?", "Nic. Profil handlowca jest bezpłatny."],
  ["Kto zobaczy mój profil?", "W wyszukiwarce widać profil skrócony: bez nazwiska, zdjęcia i danych kontaktowych. Pełny profil dostaje tylko firma, która odblokuje Twój kontakt. Dopiero po weryfikacji profilu i po Twojej zgodzie."],
  ["Co sprawdzacie?", "Informacje z formularza: doświadczenie, specjalizację i wyniki. Jeśli czegoś zabraknie, napiszemy na Twój e-mail."],
  ["Ile trwa weryfikacja?", `Do ${DNI_WERYFIKACJI} dni od wysłania formularza.`],
];

// Scenki przy krokach: kawałki prawdziwego interfejsu (pola konta, odpowiedzi z formularza, status, wiadomość od firmy).
function Scena({ nr }: { nr: number }) {
  if (nr === 0)
    return (
      <div className={d.scena}>
        <div className={d.sPole}>
          anna@gmail.com
          <i className={d.sKursor} />
        </div>
        <div className={`${d.sPole} ${d.sHaslo}`}>••••••••</div>
        <div className={d.sBtn}>Zarejestruj się</div>
      </div>
    );
  if (nr === 1)
    return (
      <div className={d.scena}>
        <div className={d.sChipy}>
          <span className={d.sWl}>Nieruchomości</span>
          <span>OZE</span>
          <span>Finanse</span>
          <span className={d.sWl}>Negocjacje</span>
          <span>IT</span>
        </div>
        <div className={d.sPostep}>
          <i />
        </div>
      </div>
    );
  if (nr === 2)
    return (
      <div className={d.scena}>
        <span className={d.sStan}>
          <i /> W weryfikacji
        </span>
        <div className={d.sDni}>
          {Array.from({ length: DNI_WERYFIKACJI }, (_, i) => (
            <i key={i} className={i < 3 ? d.sDzien : ""} />
          ))}
        </div>
        <span className={d.sMono}>Dzień 3 z {DNI_WERYFIKACJI}</span>
      </div>
    );
  return (
    <div className={d.scena}>
      <div className={d.sWiad}>
        <span className={d.sMono}>
          <i /> Nowa wiadomość · Pracodawca
        </span>
        Szukamy handlowca w Warszawie. Kiedy możemy porozmawiać?
      </div>
      <div className={d.sOdp}>Odpowiedz</div>
    </div>
  );
}

export default async function Page() {
  const konto = await zalogowanePraca();
  const profil = konto?.typ === "kandydat" ? (await supabaseAdmin.from("praca_profile_handlowcow").select("status").eq("konto_id", konto.id).maybeSingle()).data : null;
  const doProfilu = konto?.typ === "kandydat";
  const cta = { href: doProfilu ? PROFIL : "#konto", tekst: doProfilu ? "Mój profil" : "Załóż profil" };
  return (
    <div className={d.v} lang="pl">
      <BazaPasek cta={cta} />
      <main>
        <header className={d.gora}>
          <div className={`${d.szer} ${d.szerGora} ${d.goraSiatka}`}>
            <div>
              <h1 className={d.h1} style={{ marginTop: 0 }}>
                <span>Zakładasz profil raz.</span>
                <span>Firmy kontaktują się z Tobą.</span>
              </h1>
              <div className={d.lead}>
                <p>Pracodawca widzi Twoją:</p>
                <ul className={d.leadLista}>
                  <li>branżę,</li>
                  <li>doświadczenie,</li>
                  <li>wyniki,</li>
                </ul>
                <p>
                  <span className={d.leadKoniec}>a potem sam pisze do Ciebie.</span>
                </p>
              </div>
              <div className={d.przyciski}>
                <a className={d.cta} href={cta.href}>
                  {doProfilu ? "Przejdź do profilu" : "Załóż profil bezpłatnie"}
                </a>
                <a className={`${d.cta} ${d.ctaJasny}`} href="#jak">
                  Jak to działa
                </a>
              </div>
            </div>
            <div className={d.pkScena}>
              {/* Falująca linia za kartami: widać ją nad kartami, pod środkową i w przerwach. */}
              <svg className={d.fala} viewBox="0 0 722 580" preserveAspectRatio="none" aria-hidden="true">
                <path d="M-40 96C10 96 60 24 115 24C180 24 215 110 238 230C262 360 300 540 361 540C425 540 462 400 484 270C505 150 545 52 607 52C660 52 700 20 764 28" />
              </svg>
              <ul className={d.pkRzad}>
              {KARTY.map((k) => (
                <li key={k.imie} className={d.pk}>
                  <div className={d.pkFoto}>
                    <img src={k.foto} alt="" width={640} height={640} style={{ objectPosition: k.poz }} />
                    <i className={d.pkZnak} />
                  </div>
                  <div className={d.pkTresc}>
                    <h3 className={d.pkImie}>{k.imie}</h3>
                    <p className={d.pkOk}>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M10 1.5l2.3 1.6 2.8-.2 1 2.6 2.3 1.6-.8 2.7.8 2.7-2.3 1.6-1 2.6-2.8-.2L10 18.5l-2.3-1.6-2.8.2-1-2.6-2.3-1.6.8-2.7-.8-2.7 2.3-1.6 1-2.6 2.8.2z" fill="#2f7a4b" />
                        <path d="M6.6 10.2l2.3 2.3 4.5-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <b>Sprawdzony profil</b>
                    </p>
                    <p className={d.pkRola}>
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                        <rect x="2.5" y="6" width="15" height="10.5" rx="2" />
                        <path d="M7 6V4.5a1 1 0 011-1h4a1 1 0 011 1V6M2.5 11h15" />
                      </svg>
                      {k.rola}
                    </p>
                    <span className={`${d.mono} ${d.pkEtykieta}`}>Mocne strony</span>
                    <ul className={d.pkChipy}>
                      {k.mocne.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                    <span className={`${d.mono} ${d.pkEtykieta}`}>Plan w ostatnim roku</span>
                    <p className={d.pkWynik}>{k.plan}</p>
                  </div>
                </li>
              ))}
              </ul>
            </div>
          </div>
        </header>

        <section className={`${d.sekcja} ${d.srodek}`}>
          <div className={d.szer}>
            <h2 className={d.h2} style={{ marginTop: 0 }}>
              <span>Przestań szukać 🔍</span>
              <span>Daj się znaleźć.</span>
            </h2>
            <div className={d.tabele}>
              {[0, 1].map((kol) => (
                <div key={kol} className={kol ? `${d.tab} ${d.tabTak}` : d.tab}>
                  <div className={d.tabGlowka}>
                    <span className={d.mono}>{kol ? "Z Bruno Sales" : "Zwykłe szukanie pracy"}</span>
                    <h3>{kol ? "Firmy szukają Ciebie" : "Ty szukasz firm"}</h3>
                  </div>
                  <ol>
                    {POROWNANIE.map((w, i) => (
                      <li key={w[kol]}>
                        <i>{i + 1}</i>
                        {w[kol]}
                      </li>
                    ))}
                  </ol>
                  <div className={d.tabWynik}>
                    <b>{kol ? "Szukają Ciebie" : "Szukasz Ty"}</b>
                    <p>{kol ? "Jeden profil pracuje cały czas." : "Każde zgłoszenie to praca od początku."}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${d.sekcja} ${d.srodek}`} id="jak">
          <div className={d.szer}>
            <h2 className={d.h2} style={{ marginTop: 0 }}>
              4 kroki
            </h2>
            <ol className={d.kroki} id="kroki-lista">
              {ETAPY.map(([h, p], i) => (
                <li key={h}>
                  <Scena nr={i} />
                  <div className={d.krokTytul}>
                    <span className={d.numer}>{i + 1}</span>
                    <h3>{h}</h3>
                  </div>
                  <p>{p}</p>
                </li>
              ))}
            </ol>
            <KrokiAktywny selektor="#kroki-lista > li, #konto-karta" />
          </div>
        </section>

        <section className={d.sekcja} style={{ paddingTop: 0 }} id="konto">
          <div className={`${d.szer} ${d.kontoSiatka}`}>
            <div>
              <span className={d.mono}>Start</span>
              <h2 className={d.h2}>Załóż profil.</h2>
              <p className={d.podH2}>Najpierw konto. Zaraz potem formularz profilu. Bezpłatnie.</p>
            </div>
            <div className={d.karta} id="konto-karta">
              {/* 11.11: bez konta albo zalogowany jako pracodawca = formularz rejestracji kandydata (konta są osobne dla każdego typu). */}
              {konto?.typ !== "kandydat" ? (
                <KontoForm typ="kandydat" jedenTyp bezDanych dalej={PROFIL} naglowek="Zarejestruj się" opis="" przycisk="Zarejestruj się" />
              ) : profil ? (
                <>
                  <h3 className={d.kartaH}>Twój profil jest u nas</h3>
                  <p className={d.kartaP}>
                    Weryfikacja trwa do {DNI_WERYFIKACJI} dni. Wynik wyślemy na {konto.email}.
                  </p>
                  <a className={d.cta} href={PROFIL} style={{ marginTop: 22 }}>
                    Zobacz status
                  </a>
                </>
              ) : (
                <>
                  <h3 className={d.kartaH}>Masz już konto</h3>
                  <p className={d.kartaP}>Został formularz profilu. Zajmie około 5 minut.</p>
                  <a className={d.cta} href={PROFIL} style={{ marginTop: 22 }}>
                    Wypełnij profil
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        <section className={d.sekcja} style={{ paddingTop: 0 }}>
          <div className={d.szer}>
            <span className={d.mono}>Pytania</span>
            <div className={d.faq}>
              {PYTANIA.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={d.stopka}>
        <div className={d.szer}>
          <div className={d.stopkaGora}>
            <div>
              <p>
                <span>Zakładasz profil raz.</span>
                <span>Firmy kontaktują się z Tobą.</span>
              </p>
              <a className={d.cta} href={cta.href}>
                {doProfilu ? "Przejdź do profilu" : "Załóż profil bezpłatnie"}
              </a>
            </div>
            <nav className={d.stopkaLinki} aria-label="Stopka">
              <a href="/praca/oferty">Oferty pracy</a>
              <a href="/praca/regulamin">Regulamin</a>
              <a href="/praca/polityka-prywatnosci">Polityka prywatności</a>
              <a href="/praca/konto?typ=kandydat&tryb=logowanie&dalej=/praca/dolacz/profil">Zaloguj się</a>
            </nav>
          </div>
          <div className={d.stopkaDol}>
            <span className={d.mono}>SalesBruno.pl · Praca</span>
            <span className={d.mono}>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
