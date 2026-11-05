import type { Metadata } from "next";
import u from "@/app/oferta/ewatex/umowa/umowa.module.css";
import { ANALIZA, KLIENT, KONTAKT_ZGLOSZENIA, USLUGODAWCA, WERSJA, zl } from "../dane";

// 5.11 (USER_001): umowa o dzieło „Analiza sprzedaży” dla Limalogic. Źródło PDF:
// node scripts/bruno-umowa-pdf.mjs limalogic → public/pdf/umowa-limalogic.pdf. Style = umowa Ewatex.
// Forma dokumentowa wystarcza: umowa o dzieło + licencja niewyłączna (art. 77² KC, art. 67 pr. aut.).
export const metadata: Metadata = {
  title: "Umowa: analiza sprzedaży Limalogic × Bruno AI",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className={u.root}>
      <h1 className={u.h1}>Umowa: analiza sprzedaży</h1>
      <p className={u.podtytul}>Limalogic × Bruno AI · wersja {WERSJA}</p>

      <p>
        <b>Zawarta w dniu akceptacji na stronie salesbruno.pl/oferta/limalogic, w formie dokumentowej, między:</b>
      </p>
      <div className={u.strony}>
        <div className={u.strona}>
          <b className={u.nazwa}>{USLUGODAWCA.nazwa}</b>
          {USLUGODAWCA.opis}, {USLUGODAWCA.adres}, NIP {USLUGODAWCA.nip}, zwany dalej <b>Wykonawcą</b>
        </div>
        <div className={u.strona}>
          <b className={u.nazwa}>{KLIENT.nazwa}</b>
          {KLIENT.adres}, NIP {KLIENT.nip}, KRS {KLIENT.krs}, reprezentowana przez <b>{KLIENT.reprezentant}</b>, {KLIENT.funkcja}, zwana dalej <b>Zamawiającym</b>
        </div>
      </div>

      <h2>§ 1. Przedmiot umowy</h2>
      <ol>
        <li>
          Wykonawca przygotuje dla Zamawiającego <b>analizę sprzedaży</b> (dalej: Analiza) w 5 częściach o zakresie z załącznika nr 1: grupa docelowa, lejek i miary, rozmowy, sprawdzian mentalny {ANALIZA.sprawdzianOsob} osób, plan 30 dni.
        </li>
        <li>Analiza jest dziełem jednorazowym. Umowa nie obejmuje abonamentu Bruno AI ani żadnych opłat cyklicznych.</li>
        <li>Analiza dotyczy sprzedaży usług programistycznych Zamawiającego (software house) i jest przygotowana na podstawie wsadu z § 2.</li>
      </ol>

      <h2>§ 2. Przebieg i terminy</h2>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>Dzień 0</th>
            <td>Zapłata wynagrodzenia (§ 3). Wykonawca wysyła link do formularza o firmie i klientach oraz dostęp do sprawdzianu mentalnego dla {ANALIZA.sprawdzianOsob} osób.</td>
          </tr>
          <tr>
            <th>Do 7 dni</th>
            <td>
              Zamawiający wypełnia formularz (ok. {ANALIZA.formularzMin} min) i sprawdzian mentalny. Spotkanie online {ANALIZA.spotkanieMin} min z {KLIENT.reprezentant} w terminie uzgodnionym mailem.
            </td>
          </tr>
          <tr>
            <th>Do {ANALIZA.dniNaAnalize} dni od kompletu wsadu</th>
            <td>Wykonawca przekazuje Analizę mailem (pliki Markdown). Komplet wsadu = formularz + spotkanie + sprawdzian.</td>
          </tr>
          <tr>
            <th>Po przekazaniu</th>
            <td>
              Omówienie online {ANALIZA.omowienieMin} min. Zamawiający zgłasza uwagi do {ANALIZA.dniNaUwagi} dni; Wykonawca wprowadza poprawki w zakresie załącznika nr 1 w {ANALIZA.dniRoboczychNaPoprawki} dni roboczych. Brak uwag w tym czasie = odbiór.
            </td>
          </tr>
        </tbody>
      </table>
      <ol>
        <li>Opóźnienie po stronie Zamawiającego (formularz, sprawdzian, termin spotkania, uwagi) przesuwa terminy Wykonawcy o tyle samo dni.</li>
        <li>Start prac w terminie wskazanym przez Zamawiającego, nie później niż 60 dni od zawarcia umowy; po tym terminie wsad z § 2 i terminy liczą się od dnia, w którym Zamawiający wyśle formularz.</li>
      </ol>

      <h2>§ 3. Wynagrodzenie</h2>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>Analiza sprzedaży</th>
            <td>
              <b>{zl(ANALIZA.cena)}</b> jednorazowo
            </td>
          </tr>
          <tr>
            <th>Płatność</th>
            <td>100 % w dniu zawarcia umowy, faktura + link do płatności, termin 7 dni. Prace ruszają po zapłacie.</td>
          </tr>
          <tr>
            <th>Opłaty cykliczne</th>
            <td>brak</td>
          </tr>
        </tbody>
      </table>
      <ol>
        <li>Wykonawca korzysta ze zwolnienia z VAT. Kwota jest końcowa.</li>
        <li>Prace poza zakresem załącznika nr 1 (np. kolejne osoby w sprawdzianie, dodatkowe warsztaty, wdrożenie w narzędziach Zamawiającego): tylko po wycenie i akceptacji mailem.</li>
      </ol>

      <h2>§ 4. Obowiązki stron</h2>
      <ol>
        <li>
          Wykonawca: przygotowuje Analizę zgodnie z załącznikiem nr 1, prowadzi spotkanie i omówienie, wprowadza poprawki z § 2, odpowiada na zgłoszenia na {KONTAKT_ZGLOSZENIA} do 5 dni roboczych.
        </li>
        <li>
          Zamawiający: wypełnia formularz zgodnie z prawdą, bierze udział w spotkaniu i omówieniu, zapewnia udział drugiej osoby w sprawdzianie mentalnym, wyznacza jedną osobę do uwag ({KLIENT.reprezentant}).
        </li>
      </ol>

      <h2>§ 5. Prawa do Analizy</h2>
      <ol>
        <li>
          Z chwilą zapłaty Wykonawca udziela Zamawiającemu licencji niewyłącznej, bezterminowej, bez ograniczeń terytorialnych, w cenie umowy, na korzystanie z Analizy w firmie, jej zmienianie, łączenie z innymi materiałami i wgrywanie do własnych narzędzi i systemów AI Zamawiającego.
        </li>
        <li>Na życzenie Zamawiającego, po zapłacie, strony podpiszą pisemną umowę przeniesienia majątkowych praw autorskich do Analizy (bez dodatkowej opłaty), bo przeniesienie praw wymaga formy pisemnej.</li>
        <li>Wykonawca zachowuje prawo do używania własnych, ogólnych metod, szablonów i narzędzi w innych projektach. Danych i treści Zamawiającego nigdy.</li>
      </ol>

      <h2>§ 6. Poufność i dane osobowe</h2>
      <ol>
        <li>Wszystko, co Zamawiający przekaże w formularzu, na spotkaniu i w sprawdzianie (klienci, ceny, procesy, wyniki osób), jest poufne. Wykonawca nie pokazuje tego nikomu i nie używa do trenowania modeli AI.</li>
        <li>Dla danych osób biorących udział w sprawdzianie mentalnym Zamawiający jest administratorem, Wykonawca podmiotem przetwarzającym. Powierzenie: umowa powierzenia (RODO art. 28) wysyłana mailem razem z potwierdzeniem, z listą podwykonawców przetwarzania.</li>
        <li>Gdzie leżą dane, kto je przetwarza i jak długo: salesbruno.pl/bezpieczenstwo. Spotkanie i omówienie mogą być nagrywane do celów Analizy po zgodzie uczestników na początku rozmowy.</li>
        <li>Wykonawca kasuje swoje kopie wsadu i nagrań w 30 dni od odbioru Analizy; zostaje sama Analiza u Zamawiającego.</li>
      </ol>

      <h2>§ 7. Odpowiedzialność</h2>
      <ol>
        <li>Odpowiedzialność Wykonawcy ogranicza się do szkody rzeczywistej, do wysokości wynagrodzenia z § 3.</li>
        <li>Analiza to rekomendacje. Wykonawca nie odpowiada za wyniki sprzedaży Zamawiającego ani za sposób wdrożenia Analizy.</li>
      </ol>

      <h2>§ 8. Postanowienia końcowe</h2>
      <ol>
        <li>Zmiany umowy wymagają formy pisemnej albo dokumentowej (e-mail) pod rygorem nieważności.</li>
        <li>Odstąpienie: do dnia wysłania formularza Zamawiający może odstąpić mailem; Wykonawca zwraca wynagrodzenie w 7 dni. Po wysłaniu formularza wynagrodzenie nie podlega zwrotowi.</li>
        <li>W sprawach nieuregulowanych: Kodeks cywilny i ustawa o prawie autorskim.</li>
        <li>Spory: sąd właściwy dla siedziby Wykonawcy.</li>
        <li>Umowa zawarta w formie dokumentowej: akceptacja na stronie salesbruno.pl/oferta/limalogic (imię i nazwisko, data, adres IP) + potwierdzenie e-mailem od Wykonawcy.</li>
      </ol>

      <h2>Załącznik nr 1. Zakres Analizy</h2>
      <p>Analiza składa się z 5 części. Każda część to osobny dokument.</p>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>Część 1. Grupa docelowa</th>
            <td>
              (a) segment: jakie firmy kupują usługi Zamawiającego (branża, wielkość, budżet, moment zakupu) i jakich nie obsługiwać; (b) osoby w decyzji: kto decyduje, kto wpływa, kto blokuje; (c) problemy i wyzwania każdej z tych osób; (d) wartości, które Zamawiający daje każdej z nich; (e) proces zakupu klienta w 5 etapach (problem, koncepcja, edukacja, wybór, zakup) i co klient musi usłyszeć na każdym; (f) kwalifikacja: 5 pytań do zadania w 10 minut i lista „nie dla nas”.
            </td>
          </tr>
          <tr>
            <th>Część 2. Lejek i miary</th>
            <td>
              (a) etapy procesu sprzedaży od pierwszej rozmowy do podpisu, opisane jako kamienie milowe z perspektywy klienta, z kryterium przejścia każdego etapu, z miejscem na płatne discovery; (b) 4 miary: liczba szans w lejku, skuteczność, czas sprzedaży, średnia wielkość szansy, z definicją każdej; (c) lista pól do prowadzenia lejka w narzędziu Zamawiającego (Notion, arkusz) oraz rytm tygodniowego przeglądu; (d) przegląd ostatnich szans Zamawiającego (z formularza i spotkania): na którym etapie odpadają i dlaczego, 3 zmiany do wprowadzenia najpierw.
            </td>
          </tr>
          <tr>
            <th>Część 3. Rozmowy</th>
            <td>
              (a) pierwsza rozmowa: cel, lista pytań, czego nie mówić; (b) sprzedaż płatnego discovery: kiedy proponować, jak uzasadnić cenę, gotowe sformułowania; (c) 10 najczęstszych obiekcji Zamawiającego w 3 kategoriach (za wcześnie, do koncepcji, do firmy) z odpowiedzią na każdą; (d) szablon oferty jako podsumowania ustaleń: stan obecny, stan docelowy, jak go osiągnąć, kolejne kroki, cena; zasada ceny wprost przed ofertą; (e) ustalanie kroków po ofercie i daty decyzji; (f) follow-up: co robić po wysłaniu oferty i gdy klient milczy.
            </td>
          </tr>
          <tr>
            <th>Część 4. Sprawdzian mentalny</th>
            <td>
              {ANALIZA.sprawdzianOsob} osoby ({KLIENT.reprezentant} + 1 wskazana): ankieta online, wynik każdej osoby w 3 obszarach (sprzedaż, pieniądze, głowa), opis tego, co blokuje, plan pracy 1:1 na 30 dni. Powtórka ankiety po 30 dniach z porównaniem wyników, w cenie.
            </td>
          </tr>
          <tr>
            <th>Część 5. Plan 30 dni</th>
            <td>co wdrażać tydzień po tygodniu, 3 liczby do sprawdzania co tydzień, lista kontrolna do odhaczania.</td>
          </tr>
          <tr>
            <th>Spotkania w cenie</th>
            <td>
              1 × {ANALIZA.spotkanieMin} min (wsad: klienci, rozmowy, lejek, ostatnie szanse) + 1 × {ANALIZA.omowienieMin} min (omówienie Analizy), online.
            </td>
          </tr>
        </tbody>
      </table>
      <p>Poza zakresem: konta i abonament Bruno AI, budowa CRM, analiza nagrań rozmów z klientami Zamawiającego, wdrożenie w narzędziach Zamawiającego, kolejne osoby w sprawdzianie (na zamówienie, § 3 pkt 2).</p>

      <div className={u.podpisy}>
        <div>
          <span>Wykonawca</span>
          {USLUGODAWCA.nazwa}
        </div>
        <div>
          <span>Zamawiający</span>
          {KLIENT.reprezentant}, {KLIENT.funkcja}
          <br />
          akceptacja na stronie: data, godzina, adres IP w potwierdzeniu e-mail
        </div>
      </div>
    </main>
  );
}
