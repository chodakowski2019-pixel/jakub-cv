import type { Metadata } from "next";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import o from "@/app/brunooferta/oferta.module.css";
import e from "@/app/oferta/ewatex/ewatex.module.css";
import UmowaForm from "./umowa-form";
import { ANALIZA, KLIENT, USLUGODAWCA, zl } from "./dane";

// 5.11 (USER_001): salesbruno.pl/oferta/limalogic = oferta ANALIZY SPRZEDAŻY (bez Bruno) dla Łukasza Salawy + podpis
// na stronie (forma dokumentowa). Układ i style = oferta Ewatex (`app/oferta/ewatex`), jedna kolumna pod telefon.
// Umowa w PDF: `umowa/page.tsx` → `scripts/bruno-umowa-pdf.mjs limalogic` → `public/pdf/umowa-limalogic.pdf`.
// Po podpisie NIC nie idzie do klienta z automatu (decyzja 5.11), tylko mail do hello@. Bez indeksowania.
export const metadata: Metadata = {
  title: "Oferta dla Limalogic | Bruno AI",
  description: "Analiza sprzedaży dla Limalogic: zakres, cena, oś czasu i umowa do podpisu.",
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
          <span className={s.g}>Analiza sprzedaży dla Limalogic</span>
        </h1>
      </header>

      {/* ---------- 01 CO OTRZYMASZ ---------- */}
      <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="zakres">
        <h2 id="zakres" className={o.h2}>
          <span className={o.nr}>01</span> Co otrzymasz
        </h2>
        <article className={`${e.opcja} ${e.opcjaRek}`}>
          <span className={e.opcjaNr}>Analiza</span>
          <h3 className={e.opcjaTytul}>Twoje discovery, tylko dla sprzedaży</h3>
          <div className={e.opcjaCena}>
            {zl(ANALIZA.cena)}
            <small>jednorazowo</small>
          </div>
          <table className={`${e.tab} ${e.funkcje}`}>
            <tbody>
              <tr>
                <th>1. Grupa docelowa</th>
                <td>jakie firmy kupują u Ciebie (branża, wielkość, budżet, moment), kto w firmie decyduje i kto blokuje, co boli każdą z tych osób, co dostają od Ciebie</td>
              </tr>
              <tr>
                <th>Proces zakupu klienta</th>
                <td>5 etapów: problem → koncepcja → edukacja → wybór → zakup; co klient musi usłyszeć na każdym, żeby przejść dalej</td>
              </tr>
              <tr>
                <th>Kwalifikacja</th>
                <td>5 pytań, które w 10 min mówią, czy lead jest dla Ciebie; lista „nie dla nas”</td>
              </tr>
              <tr>
                <th>2. Lejek</th>
                <td>etapy od pierwszej rozmowy do podpisu opisane jako kamienie milowe klienta, kryterium przejścia każdego etapu, miejsce na płatne discovery</td>
              </tr>
              <tr>
                <th>Miary</th>
                <td>4 liczby do śledzenia: ile szans w lejku, skuteczność, czas sprzedaży, średnia wielkość; pola do Twojego Notiona lub arkusza; co przeglądać co poniedziałek</td>
              </tr>
              <tr>
                <th>Gdzie giną deale</th>
                <td>przegląd Twoich ostatnich szans: na którym etapie odpadają i dlaczego; 3 rzeczy do zmiany najpierw</td>
              </tr>
              <tr>
                <th>3. Rozmowy</th>
                <td>pierwsza rozmowa: cel i pytania; jak proponować płatne discovery (kiedy, za ile, jakimi słowami); jak ustalać kolejne kroki i datę decyzji</td>
              </tr>
              <tr>
                <th>Obiekcje</th>
                <td>Twoje 10 najczęstszych w 3 kategoriach (za wcześnie / do koncepcji / do firmy) z gotowymi odpowiedziami</td>
              </tr>
              <tr>
                <th>Oferta i follow-up</th>
                <td>szablon oferty jako podsumowania (stan obecny, cel, jak, kroki, cena wprost przed ofertą); co robić po wysłaniu i gdy cisza</td>
              </tr>
              <tr>
                <th>4. Sprawdzian mentalny</th>
                <td>Ty + 1 osoba: wynik w 3 obszarach (sprzedaż, pieniądze, głowa), co blokuje, plan 1:1; powtórka po 30 dniach</td>
              </tr>
              <tr>
                <th>5. Plan 30 dni</th>
                <td>co robić tydzień po tygodniu, 3 liczby do sprawdzania, lista kontrolna</td>
              </tr>
              <tr>
                <th>Twój czas</th>
                <td>formularz ok. {ANALIZA.formularzMin} min + spotkanie online {ANALIZA.spotkanieMin} min</td>
              </tr>
              <tr>
                <th>Gotowe</th>
                <td>do {ANALIZA.dniNaAnalize} dni od formularza i spotkania</td>
              </tr>
            </tbody>
          </table>
        </article>
      </section>

      {/* ---------- 02 KOSZTA ---------- */}
      <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="kwoty">
        <h2 id="kwoty" className={o.h2}>
          <span className={o.nr}>02</span> Koszta
        </h2>
        <p className={o.pod}>Bez VAT. To jest kwota końcowa.</p>
        <table className={e.tab}>
          <tbody>
            <tr className={e.razem}>
              <th>Dziś</th>
              <td>
                <b>{zl(ANALIZA.cena)}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ---------- 03 OŚ CZASU ---------- */}
      <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="harmonogram">
        <h2 id="harmonogram" className={o.h2}>
          <span className={o.nr}>03</span> Oś czasu
        </h2>
        <p className={o.pod}>Liczymy od dnia płatności. Start w grudniu, w Twoim terminie.</p>
        <table className={e.tab}>
          <tbody>
            <tr>
              <th>Dzień 0</th>
              <td>Płatność. Dostajesz link do formularza i do sprawdzianu mentalnego.</td>
            </tr>
            <tr>
              <th>Do 7 dni</th>
              <td>Wypełniasz formularz ({ANALIZA.formularzMin} min). Spotkanie online {ANALIZA.spotkanieMin} min: Twoi klienci, Twoje rozmowy, Twój lejek.</td>
            </tr>
            <tr>
              <th>Do {ANALIZA.dniNaAnalize} dni od spotkania i sprawdzianu</th>
              <td>Analiza w Markdown w Twojej skrzynce.</td>
            </tr>
            <tr>
              <th>Po analizie</th>
              <td>Omówienie online {ANALIZA.omowienieMin} min. Uwagi do {ANALIZA.dniNaUwagi} dni, poprawki w {ANALIZA.dniRoboczychNaPoprawki} dni roboczych.</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ---------- 04 UMOWA ---------- */}
      <section className={`${o.sekcja} ${e.sekcja}`} aria-labelledby="umowy">
        <h2 id="umowy" className={o.h2}>
          <span className={o.nr}>04</span> Umowa
        </h2>

        <a className={e.umowaPdf} href="/pdf/umowa-limalogic.pdf" target="_blank" rel="noreferrer" id="umowa">
          <span>
            <b>Umowa: analiza sprzedaży</b>
            <small>PDF · wszystkie warunki z tej strony</small>
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
        <span>
          {USLUGODAWCA.nazwa} · {KLIENT.nazwa.split(" ")[0]} · {USLUGODAWCA.email}
        </span>
      </footer>
    </div>
  );
}
