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
          <span className={o.nr}>01</span> Co otrzymasz
        </h2>
        <div className={e.opcje}>
          <article className={`${e.opcja} ${e.opcjaRek}`}>
            <span className={e.opcjaNr}>CRM</span>
            <h3 className={e.opcjaTytul}>Własny CRM</h3>
            <div className={e.opcjaCena}>
              {zl(CRM.budowaZBruno)}
              <small>płatność jednorazowa</small>
            </div>
            <p className={e.opcjaPod}>+ {zl(CRM.utrzymanie)} miesięcznie</p>
            <table className={`${e.tab} ${e.funkcje}`}>
              <tbody>
                <tr>
                  <th>Karta klienta</th>
                  <td>firma, osoba, telefon, umowa, cena, faktura, kto prowadzi, historia rozmów</td>
                </tr>
                <tr>
                  <th>Etapy sprzedaży</th>
                  <td>widok, na którym etapie ilu klientów</td>
                </tr>
                <tr>
                  <th>Notatka po rozmowie</th>
                  <td>co ustalone + następny krok z datą</td>
                </tr>
                <tr>
                  <th>Przypomnienia</th>
                  <td>koniec umowy klienta: 12, 6 i 3 mies. przed, mail do zarządzającej i handlowczyni</td>
                </tr>
                <tr>
                  <th>Panel zarządzającej</th>
                  <td>umowy do przedłużenia w kwartale, rozmowy w tygodniu, oferty wysłane i podpisane</td>
                </tr>
                <tr>
                  <th>Oferta ze spółki</th>
                  <td>Ewatex, Reenergia, Respect: zawsze właściwa spółka i właściwy nadawca maila</td>
                </tr>
                <tr>
                  <th>Przeniesienie danych</th>
                  <td>klienci z Excela, kalendarza i maili</td>
                </tr>
                <tr>
                  <th>Konta</th>
                  <td>4: zarządzająca + 3 handlowczynie</td>
                </tr>
                <tr>
                  <th>Telefon</th>
                  <td>działa w przeglądarce na telefonie</td>
                </tr>
                <tr>
                  <th>Gotowy</th>
                  <td>14 dni od płatności</td>
                </tr>
              </tbody>
            </table>
          </article>

          <div className={e.plus} aria-hidden="true">
            +
          </div>

          <article className={e.opcja}>
            <span className={e.opcjaNr}>Bruno</span>
            <h3 className={e.opcjaTytul}>Trening rozmów dla 3 handlowczyń</h3>
            <div className={e.opcjaCena}>
              {zl(BRUNO.cenaKonto)}
              <small>od konta / mies.</small>
            </div>
            <p className={e.opcjaPod}>Współpraca na {BRUNO.okresMiesiecy} miesiące z możliwością przedłużenia.</p>
            <table className={`${e.tab} ${e.funkcje}`}>
              <tbody>
                <tr>
                  <th>Rozmowy z klientem AI</th>
                  <td>dobrane do etapu nauki każdej handlowczyni, do 5 dziennie; klient AI mówi jak klienci Ewatex</td>
                </tr>
                <tr>
                  <th>Ocena</th>
                  <td>po każdej rozmowie 1-10 + 1 rada</td>
                </tr>
                <tr>
                  <th>Fiszki</th>
                  <td>techniki do powtórek</td>
                </tr>
                <tr>
                  <th>Czat z Bruno</th>
                  <td>pytania jak do ChatGPT, zna branżę energetyczną</td>
                </tr>
                <tr>
                  <th>Panel zarządzającej</th>
                  <td>kto ćwiczy i kto robi postęp</td>
                </tr>
                <tr>
                  <th>Ustawiony pod Ewatex</th>
                  <td>produkt, klienci i obiekcje Ewatex</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>

        <ol className={e.os} aria-label="Spotkania w cenie i decyzja">
          <li>
            <span className={e.osKiedy}>Dzień 7</span>
            <b>Spotkanie 30 min</b> z handlowczynią ws. CRM
          </li>
          <li>
            <span className={e.osKiedy}>Dzień 14</span>
            <b>Spotkanie 30 min</b> z zarządzającą ws. CRM
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
              <th>Dzień 7</th>
              <td>Spotkanie 30 min z handlowczynią ws. CRM: pierwsza wersja, dostosowujemy.</td>
            </tr>
            <tr>
              <th>Dzień 14</th>
              <td>Spotkanie 30 min z zarządzającą ws. CRM: gotowy, klienci w środku. Druga płatność {zl(CRM.budowaZBruno / 2 + BRUNO.trzyMiesiace)}.</td>
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
