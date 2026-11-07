import type { Metadata } from "next";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import o from "@/app/brunooferta/oferta.module.css";
import e from "./ewatex.module.css";
import UmowaForm from "./umowa-form";
import { BRUNO, CRM, HANDLOWCZYNIE, KLIENT, USLUGODAWCA, zl } from "./dane";

// 4.11 (USER_001): salesbruno.pl/oferta/ewatex = oferta dla Ewy Adamskiej (Ewatex) + podpis na stronie (forma
// dokumentowa: imię i nazwisko, zgoda, data, IP, mail do obu stron). Link idzie SMS-em, więc strona jest pod telefon:
// jedna kolumna, duże kwoty. Bez indeksowania. 5.11: jedna umowa (Bruno + CRM) w PDF: źródło `umowa/page.tsx`,
// plik `public/pdf/umowa-ewatex.pdf` ze skryptu `scripts/bruno-umowa-pdf.mjs ewatex`. Kwoty w `dane.ts`.
// Proxy: /oferta/ewatex nie jest przepisywane na /brunooferta.
export const metadata: Metadata = {
  title: "Oferta dla Ewatex | Bruno AI",
  description: "Wycena, oś czasu i umowa do podpisu dla Ewatex.",
  robots: { index: false, follow: false },
};

// 7.11 (USER_001): zakładki CRM Ewatex (ustalone w rozmowie 7.11), każda rzecz osobnym punktem.
const ZAKLADKI_CRM: [string, string[]][] = [
  ["Dziś", ["lista na dziś: telefony i spotkania z datą", "klienci bez kontaktu od 30 dni", "umowy do przedłużenia w tym miesiącu", "ile rozmów w tym tygodniu"]],
  ["Klienci", ["lista z szukajką i filtrami: spółka, etap, handlowczyni, koniec umowy", "karta klienta: firma, NIP, osoba, telefon, e-mail", "obecny sprzedawca energii", "data końca umowy", "cena, taryfa", "faktura (plik)", "która spółka ofertuje", "kto prowadzi", "historia wszystkich rozmów"]],
  ["Lejek", ["etapy: nowy → telefon → faktura zebrana → oferta wysłana → decyzja → podpisana / stracona", "na każdym etapie ilu klientów i za ile", "przeciąganie klienta między etapami"]],
  ["Rozmowy", ["po każdym telefonie 30 sekund: co ustalone (2 zdania)", "następny krok z datą", "czy jest faktura", "wpis trafia do historii klienta i na listę „Dziś”"]],
  ["Przedłużenia", ["wszystkie umowy klientów z datą końca", "automat: 12, 6 i 3 miesiące przed końcem mail do zarządzającej i handlowczyni", "widok na kwartał"]],
  ["Oferty", ["wybór spółki: Ewatex, Reenergia, Respect", "właściwy nadawca maila i dane spółki na dokumencie", "lista ofert: wysłana, podpisana, odrzucona"]],
  ["Panel zarządzającej", ["umowy do przedłużenia w kwartale", "rozmowy w tygodniu per handlowczyni", "oferty wysłane", "oferty podpisane", "faktury zebrane", "porównanie handlowczyń"]],
  ["Ustawienia", ["4 konta: zarządzająca + 3 handlowczynie", "spółki i nadawcy maili", "etapy lejka", "pola karty klienta"]],
];

// 7.11 (USER_001): funkcje Bruno, każda rzecz osobnym punktem (treść jak 5.11, rozbita na punkty).
const FUNKCJE_BRUNO: [string, string[]][] = [
  ["Rozmowy z klientem AI", ["dobrane do etapu nauki każdej handlowczyni", "do 5 dziennie", "klient AI mówi jak klienci Ewatex"]],
  ["Ocena", ["po każdej rozmowie 1-10", "1 rada, co poprawić"]],
  ["Fiszki", ["techniki do powtórek"]],
  ["Czat z Bruno", ["pytania jak do ChatGPT", "zna branżę energetyczną"]],
  ["Panel zarządzającej", ["kto ćwiczy", "kto robi postęp"]],
  ["Ustawiony pod Ewatex", ["produkt Ewatex", "klienci Ewatex", "obiekcje klientów Ewatex"]],
];

export default function Page() {
  return (
    <div className={`${s.root} ${o.root} ${e.root} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <div className={s.navL}>
          <a className={s.logo} href="/">
            Bruno AI
          </a>
        </div>
      </nav>

      <header className={`${o.hero} ${e.hero}`}>
        <h1 className={o.h1}>
          <span className={s.g}>Bruno + CRM dla Ewatex</span>
        </h1>
      </header>

      {/* ---------- 01 CO OTRZYMASZ ---------- */}
      <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="opcje">
        <h2 id="opcje" className={o.h2}>
          <span className={o.nr}>01</span> Oferta
        </h2>
        <div className={e.opcje}>
          <article className={`${e.opcja} ${e.opcjaRek}`}>
            <h3 className={`${e.opcjaTytul} ${e.tytulPomar}`}>Własny CRM</h3>
            {/* 7.11 (USER_001): zakładki CRM, każda rzecz od kropki, jedno pod drugim; gwiazdka = zakres po spotkaniu i ankiecie. */}
            <table className={`${e.tab} ${e.funkcje} ${e.zakladki}`}>
              <colgroup><col style={{ width: "34%" }} /><col /></colgroup>
              <thead>
                <tr>
                  <th className={e.naglowekKol}>Zakładki</th>
                  <th className={e.naglowekKol}>Zawartość</th>
                </tr>
              </thead>
              <tbody>
                {ZAKLADKI_CRM.map(([nazwa, punkty]) => (
                  <tr key={nazwa}>
                    <th>{nazwa}</th>
                    <td>
                      <ul className={e.punkty}>
                        {punkty.map((pkt) => (
                          <li key={pkt}>{pkt}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className={`${e.tab} ${e.funkcje} ${e.warunki}`}>
              <colgroup><col style={{ width: "34%" }} /><col /></colgroup>
              <tbody>
                <tr>
                  <th>Dane na start</th>
                  <td>przeniesienie klientów z Excela, kalendarza i maili</td>
                </tr>
                <tr>
                  <th>Urządzenia</th>
                  <td>przeglądarka na komputerze i telefonie</td>
                </tr>
                <tr>
                  <th>Gotowy</th>
                  <td>21 dni od płatności</td>
                </tr>
              </tbody>
            </table>
            <p className={e.gwiazdka}>
              <b>*</b>Dokładna zawartość każdej zakładki zostanie ustalona po spotkaniu z handlowczynią (dzień 1-14) i po wypełnieniu ankiety przez zarządzającą. W cenie są 2 spotkania × 30 min na poprawki w CRM w ciągu 3 miesięcy.
            </p>
            {/* 7.11 (USER_001): cena CRM pod tabelą z zawartością, bez plakietki „CRM”. */}
            <div className={e.opcjaCena}>
              {zl(CRM.budowaZBruno)}
              <small>płatność jednorazowa</small>
            </div>
            <p className={e.opcjaPod}>+ {zl(CRM.utrzymanie)} miesięcznie</p>
          </article>

          <div className={e.plus} aria-hidden="true">
            +
          </div>

          <article className={e.opcja}>
            {/* 7.11 (USER_001 „to też popraw”): karta Bruno w tym samym układzie co CRM: tytuł pomarańczowy, bez plakietki,
                tabela Funkcje / Zawartość z punktami jedno pod drugim, szare linie, cena pod tabelą. */}
            <h3 className={`${e.opcjaTytul} ${e.tytulPomar}`}>Trening rozmów dla 3 handlowczyń</h3>
            <table className={`${e.tab} ${e.funkcje} ${e.zakladki}`}>
              <colgroup><col style={{ width: "34%" }} /><col /></colgroup>
              <thead>
                <tr>
                  <th className={e.naglowekKol}>Funkcje</th>
                  <th className={e.naglowekKol}>Zawartość</th>
                </tr>
              </thead>
              <tbody>
                {FUNKCJE_BRUNO.map(([nazwa, punkty]) => (
                  <tr key={nazwa}>
                    <th>{nazwa}</th>
                    <td>
                      <ul className={e.punkty}>
                        {punkty.map((pkt) => (
                          <li key={pkt}>{pkt}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`${e.gwiazdka} ${e.bezGwiazdki}`}>Współpraca na {BRUNO.okresMiesiecy} miesiące z możliwością przedłużenia.</p>
            <div className={e.opcjaCena}>
              {zl(BRUNO.cenaKonto)}
              <small>od konta / mies.</small>
            </div>
          </article>
        </div>

        <ol className={e.os} aria-label="Spotkania w cenie i decyzja">
          <li>
            <span className={e.osKiedy}>Dzień 1-14</span>
            <b>Spotkanie 50 min</b> z handlowczynią ws. CRM
          </li>
          <li>
            <span className={e.osKiedy}>Dzień 1-14</span>
            <b>Spotkanie 50 min</b> z zarządzającą ws. CRM
          </li>
          <li>
            <span className={e.osKiedy}>Do 3 miesięcy</span>
            Możliwość <b>2 spotkań × 30 min</b> na poprawki w CRM
          </li>
          <li className={e.osKoniec}>
            <span className={e.osKiedy}>Po 3 miesiącach</span>
            <b>Decyzja o przedłużeniu Bruno</b>
          </li>
        </ol>
      </section>

      {/* ---------- 02 KOSZTA ---------- */}
      <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="kwoty">
        <h2 id="kwoty" className={o.h2}>
          <span className={o.nr}>02</span> Koszta
        </h2>
        <p className={o.pod}>Bez VAT. To są kwoty końcowe.</p>
        <table className={e.tab}>
          <tbody>
            <tr className={e.razem}>
              <th>Dziś</th>
              <td>
                <b>{zl(CRM.budowaZBruno / 2)}</b>
                <br />
                50% za CRM
              </td>
            </tr>
            <tr className={e.razem}>
              <th>Dzień 14, CRM gotowy</th>
              <td>
                <b>{zl(CRM.budowaZBruno / 2 + BRUNO.trzyMiesiace)}</b>
                <br />
                druga połowa za CRM {zl(CRM.budowaZBruno / 2)} + Bruno za 3 mies. {zl(BRUNO.trzyMiesiace)}
              </td>
            </tr>
            <tr>
              <th>Od 2. miesiąca</th>
              <td>
                <b>{zl(CRM.utrzymanie)}/mies.</b>
                <br />
                serwer CRM
              </td>
            </tr>
            <tr>
              <th>Po 3 miesiącach, jeśli Bruno zostaje</th>
              <td>
                <b>{zl(BRUNO.miesiac)}/mies.</b>
                <br />3 konta × {zl(BRUNO.cenaKonto)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ---------- 03 KIEDY ---------- */}
      <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="harmonogram">
        <h2 id="harmonogram" className={o.h2}>
          <span className={o.nr}>03</span> Oś czasu
        </h2>
        <p className={o.pod}>Liczymy od dnia pierwszej płatności.</p>
        <table className={e.tab}>
          <tbody>
            <tr>
              <th>Dzień 0</th>
              <td>Pierwsza płatność</td>
            </tr>
            <tr>
              <th>Dzień 1-14</th>
              <td>Spotkanie 50 min z handlowczynią ws. CRM: pierwsza wersja, dostosowujemy.</td>
            </tr>
            <tr>
              <th>Dzień 1-14</th>
              <td>Spotkanie 50 min z zarządzającą ws. CRM: gotowy, klienci w środku. Druga płatność {zl(CRM.budowaZBruno / 2 + BRUNO.trzyMiesiace)}.</td>
            </tr>
            <tr>
              <th>Do 3 miesięcy</th>
              <td>Możliwość 2 spotkań × 30 min na poprawki w CRM.</td>
            </tr>
            <tr>
              <th>Po 3 miesiącach</th>
              <td>Decyzja o przedłużeniu Bruno.</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ---------- 04 UMOWY ---------- */}
      <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="umowy">
        <h2 id="umowy" className={o.h2}>
          <span className={o.nr}>04</span> Umowy
        </h2>

        <a className={e.umowaPdf} href="/pdf/umowa-ewatex.pdf" target="_blank" rel="noreferrer" id="umowa">
          <span>
            <b>Umowa współpracy: Bruno AI + CRM</b>
            <small>PDF · 1 umowa, wszystkie warunki z tej strony</small>
          </span>
          <span className={e.umowaPdfBtn}>Otwórz PDF</span>
        </a>
      </section>

      {/* ---------- 05 PODPIS ---------- */}
      <UmowaForm />

      <div className={e.odstepDol} />
      <div className={e.pasek}>
        <a className={`${s.btnDark} ${s.btnBig}`} href="#podpis">
          Przejdź do podpisu
        </a>
      </div>

      <footer className={s.footer}>
        <span>Bruno AI</span>
        <nav className={s.footerLinki} aria-label="Dokumenty">
          <a href="/regulamin">Regulamin</a>
          <a href="/polityka-prywatnosci">Polityka prywatności</a>
          <a href="/bezpieczenstwo">Bezpieczeństwo i dane</a>
        </nav>
        <span>Jakub Chodakowski · {USLUGODAWCA.email}</span>
      </footer>
    </div>
  );
}
