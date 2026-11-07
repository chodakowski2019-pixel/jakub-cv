import type { Metadata } from "next";
import u from "./umowa.module.css";
import { BRUNO, CRM, CRM_GOTOWY_DNI, HANDLOWCZYNIE, KLIENT, KONTAKT_ZGLOSZENIA, USLUGODAWCA, WERSJA, ZAKLADKI_CRM, zl } from "../dane";

// 5.11 (USER_001): jedna umowa zamiast dwóch (Bruno AI + CRM), z poprawkami z oferty (14 500 zł, oś czasu, współpraca
// 3 mies. z możliwością przedłużenia, rozmowy dobrane do etapu nauki). Strona = źródło PDF:
// node scripts/bruno-umowa-pdf.mjs ewatex → public/pdf/umowa-ewatex.pdf (link na /oferta/ewatex i w mailu po podpisie).
export const metadata: Metadata = {
  title: "Umowa współpracy Ewatex × Bruno AI",
  robots: { index: false, follow: false },
};

export default function Page() {
  const zaliczka = CRM.budowaZBruno / 2;
  return (
    <main className={u.root}>
      <h1 className={u.h1}>Umowa współpracy</h1>
      <p className={u.podtytul}>Bruno AI i system CRM · wersja {WERSJA}</p>

      <p>
        <b>Zawarta w dniu akceptacji na stronie salesbruno.pl/oferta/ewatex, w formie dokumentowej, między:</b>
      </p>
      <div className={u.strony}>
        <div className={u.strona}>
          <b className={u.nazwa}>{USLUGODAWCA.nazwa}</b>
          {USLUGODAWCA.opis}, {USLUGODAWCA.adres}, NIP {USLUGODAWCA.nip}, zwany dalej <b>Usługodawcą</b>
        </div>
        <div className={u.strona}>
          <b className={u.nazwa}>{KLIENT.nazwa}</b>
          {KLIENT.adres}, NIP {KLIENT.nip}, KRS {KLIENT.krs}, reprezentowana przez <b>{KLIENT.reprezentant}</b>, {KLIENT.funkcja}, zwana dalej <b>Klientem</b>
        </div>
      </div>

      <h2>§ 1. Przedmiot umowy</h2>
      <ol>
        <li>
          Usługodawca daje handlowcom Klienta dostęp do <b>Bruno AI</b> (§ 2).
        </li>
        <li>
          Usługodawca buduje, wdraża i utrzymuje dla Klienta <b>system CRM</b> (dalej: System) o zakresie z załącznika nr 1 (§ 3).
        </li>
      </ol>

      <h2>§ 2. Bruno AI</h2>
      <ol>
        <li>
          Liczba kont handlowców: <b>{BRUNO.konta}</b>. Konto zarządzające ({KLIENT.reprezentant}) bez opłaty. Lista kont: załącznik nr 2.
        </li>
        <li>W cenie: Bruno prowadzi System CRM (handlowiec pisze albo nagrywa głosówkę, Bruno zamienia ją na tekst i zapisuje w Systemie notatkę, następny krok z datą i etap klienta; odpowiada na pytania o klientów z danych Systemu; działa od odbioru Systemu, § 4), rozmowy z klientem AI dobrane do etapu nauki każdej handlowczyni (do 5 dziennie na konto), ocena 1-10 z radą po każdej rozmowie, fiszki z technikami, czat z Bruno, panel zarządzającej (kto ćwiczy i kto robi postęp), wsparcie mailem.</li>
        <li>Usługodawca ustawia Bruno AI pod Klienta przed uruchomieniem kont: produkt (optymalizacja kosztów energii), klienci, obiekcje.</li>
        <li>Limity i szczegóły usługi opisuje regulamin Bruno AI (salesbruno.pl/regulamin) w wersji z dnia zawarcia umowy.</li>
      </ol>

      <h2>§ 3. System CRM</h2>
      <ol>
        <li>Usługodawca buduje System zgodnie z załącznikiem nr 1 i przenosi do niego dane Klienta z przekazanych plików i źródeł.</li>
        <li>System obejmuje spółki Klienta wskazane w załączniku nr 1 (oferty z właściwej spółki i od właściwego nadawcy).</li>
      </ol>

      <h2>§ 4. Oś czasu</h2>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>Dzień 0</th>
            <td>Pierwsza płatność: zaliczka {zl(zaliczka)}. Klient przekazuje dane (Excel, kalendarz, lista klientów) najpóźniej do 7 dni roboczych od niej.</td>
          </tr>
          <tr>
            <th>Dzień 1-14</th>
            <td>Spotkanie online 50 min z handlowczynią ws. CRM: pierwsza wersja Systemu, dostosowanie.</td>
          </tr>
          <tr>
            <th>Dzień 1-14</th>
            <td>Spotkanie online 50 min z zarządzającą ({KLIENT.reprezentant}) ws. CRM: przegląd pierwszej wersji, ustalenie poprawek.</td>
          </tr>
          <tr>
            <th>Dzień {CRM_GOTOWY_DNI}</th>
            <td>System gotowy, dane przeniesione, konta, odbiór.</td>
          </tr>
          <tr>
            <th>Do 3 miesięcy od odbioru</th>
            <td>2 spotkania × 30 min ws. zmian w Systemie, w cenie (§ 7 pkt 3).</td>
          </tr>
          <tr>
            <th>Po 3 miesiącach</th>
            <td>Decyzja o przedłużeniu Bruno AI (§ 5).</td>
          </tr>
        </tbody>
      </table>
      <ol>
        <li>
          Odbiór Systemu: Klient w 5 dni roboczych od dnia {CRM_GOTOWY_DNI} zgłasza uwagi z zakresu załącznika nr 1 albo potwierdza odbiór mailem. Brak uwag w tym czasie = odbiór. Uwagi spoza zakresu = zmiany na zamówienie (§ 7 pkt 3).
        </li>
        <li>Opóźnienie po stronie Klienta (dane, uwagi, dostępność) przesuwa terminy o tyle samo dni.</li>
      </ol>

      <h2>§ 5. Czas trwania</h2>
      <ol>
        <li>
          Bruno AI: konta ruszają w dniu odbioru Systemu (dzień {CRM_GOTOWY_DNI}, § 4). Współpraca na <b>{BRUNO.okresMiesiecy} miesiące</b> od uruchomienia kont (okres minimalny), z możliwością przedłużenia. Umowa w tej części nie przedłuża się sama: Klient decyduje mailem. Usługodawca przypomina o końcu okresu e-mailem 14 dni wcześniej.
        </li>
        <li>W okresie minimalnym Klient nie może wypowiedzieć umowy bez ważnej przyczyny (rażące naruszenie umowy przez Usługodawcę, nienaprawione w 14 dni od wezwania).</li>
        <li>Utrzymanie Systemu: 12 miesięcy od odbioru, potem na czas nieokreślony z 30-dniowym wypowiedzeniem na koniec miesiąca. Koniec Bruno AI nie kończy utrzymania Systemu. System zostaje u Klienta.</li>
      </ol>

      <h2>§ 6. Wynagrodzenie</h2>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>System CRM, budowa i wdrożenie</th>
            <td>
              <b>{zl(CRM.budowaZBruno)}</b> jednorazowo
            </td>
          </tr>
          <tr>
            <th>Bruno AI</th>
            <td>
              {zl(BRUNO.cenaKonto)} za konto / miesiąc × {BRUNO.konta} = <b>{zl(BRUNO.miesiac)} / miesiąc</b>, płatne co miesiąc z góry; okres minimalny {BRUNO.okresMiesiecy} miesiące
            </td>
          </tr>
          <tr>
            <th>Utrzymanie Systemu</th>
            <td>{zl(CRM.utrzymanie)} / miesiąc, od miesiąca po odbiorze</td>
          </tr>
          <tr>
            <th>1. płatność, dzień zawarcia</th>
            <td>
              <b>{zl(zaliczka)}</b>: 50 % za System, faktura + link do płatności
            </td>
          </tr>
          <tr>
            <th>2. płatność, po odbiorze</th>
            <td>
              <b>{zl(zaliczka + BRUNO.miesiac)}</b>: 50 % za System {zl(zaliczka)} + Bruno AI za 1. miesiąc {zl(BRUNO.miesiac)}, jedna faktura, termin 7 dni
            </td>
          </tr>
          <tr>
            <th>2. i 3. miesiąc oraz po przedłużeniu</th>
            <td>{zl(BRUNO.miesiac)} Bruno AI + {zl(CRM.utrzymanie)} utrzymanie Systemu = <b>{zl(BRUNO.miesiac + CRM.utrzymanie)} / miesiąc</b> z góry, do 7. dnia okresu</td>
          </tr>
        </tbody>
      </table>
      <ol>
        <li>Usługodawca korzysta ze zwolnienia z VAT. Kwoty są końcowe.</li>
        <li>Dodanie handlowca: od następnego miesiąca, {zl(BRUNO.cenaKonto)} za konto. Zmniejszenie liczby kont: dopiero po okresie minimalnym.</li>
        <li>Opłaty za rozpoczęty miesiąc nie podlegają zwrotowi. Rezygnacja Klienta z budowy Systemu przed odbiorem: zaliczka nie podlega zwrotowi, 2. płatność za System nie jest należna.</li>
        <li>Opóźnienie płatności powyżej 14 dni: Usługodawca może zawiesić konta Bruno AI i utrzymanie Systemu do zapłaty; dane Klienta zostają dostępne do pobrania.</li>
      </ol>

      <h2>§ 7. Utrzymanie i zmiany Systemu</h2>
      <ol>
        <li>Utrzymanie obejmuje: serwer i bazę danych, kopie zapasowe codziennie, poprawki błędów.</li>
        <li>Klient może zrezygnować z utrzymania i przejąć System sam (§ 9).</li>
        <li>Poprawka = doprowadzenie Systemu do zgodności z załącznikiem nr 1; wykonywana w cenie. Zmiana = wszystko poza tym. W cenie są 2 spotkania × 30 min ws. zmian (§ 4) i wdrożenie zmian ustalonych na tych spotkaniach do 2 godzin pracy łącznie. Po wykorzystaniu 2 spotkań każde kolejne spotkanie i każda dalsza praca nad zmianami: {zl(CRM.godzina)} za godzinę, zawsze z wyceną i akceptacją mailem przed pracą.</li>
      </ol>

      <h2>§ 8. Obowiązki stron</h2>
      <ol>
        <li>
          Usługodawca: utrzymuje działanie Bruno AI, uruchamia konta, buduje System, przenosi dane, szkoli, odpowiada na zgłoszenia na {KONTAKT_ZGLOSZENIA} do 5 dni roboczych.
        </li>
        <li>
          Klient: podaje listę handlowców i dane do Systemu (§ 4), wyznacza jedną osobę do uwag ({KLIENT.reprezentant}), odbiera System, informuje handlowców o nagrywaniu rozmów treningowych i pilnuje, żeby nie podawali w nich danych prawdziwych klientów.
        </li>
      </ol>

      <h2>§ 9. Własność i dostęp do Systemu</h2>
      <ol>
        <li>
          Z chwilą zapłaty 2. płatności Usługodawca udziela Klientowi licencji niewyłącznej, bezterminowej, bez ograniczeń terytorialnych, w cenie umowy, na korzystanie z Systemu w firmie, jego zmienianie i zlecanie zmian innym wykonawcom, na wszystkich polach eksploatacji potrzebnych do używania Systemu w firmie. Licencja nie wygasa z końcem utrzymania ani umowy.
        </li>
        <li>Na życzenie Klienta, po 2. płatności, strony podpiszą pisemną umowę przeniesienia majątkowych praw autorskich do Systemu (bez dodatkowej opłaty), bo przeniesienie praw wymaga formy pisemnej.</li>
        <li>Konta hostingu, bazy danych i repozytorium kodu są założone na Klienta albo przekazane mu na żądanie w 5 dni roboczych, z instrukcją uruchomienia.</li>
        <li>Usługodawca zachowuje prawo do używania własnych, ogólnych elementów (biblioteki, szablony, narzędzia) w innych projektach. Danych Klienta nigdy.</li>
        <li>Bruno AI pozostaje własnością Usługodawcy; Klient ma prawo korzystania w czasie trwania umowy.</li>
      </ol>

      <h2>§ 10. Dane osobowe i poufność</h2>
      <ol>
        <li>Dla danych handlowców oraz klientów Klienta w Systemie Klient jest administratorem, Usługodawca podmiotem przetwarzającym.</li>
        <li>Powierzenie danych: umowa powierzenia (RODO art. 28) z listą podwykonawców, akceptowana razem z tą umową (salesbruno.pl/pdf/powierzenie-ewatex.pdf).</li>
        <li>Gdzie leżą dane Bruno AI, kto je przetwarza i jak długo: salesbruno.pl/bezpieczenstwo. Dane Systemu: serwery w UE.</li>
        <li>Nagrania rozmów treningowych (audio i tekst) zostają, handlowiec i zarządzająca mogą je odsłuchać i przeczytać; są kasowane 14 dni po końcu Bruno AI. Klient może mailem przejść na tryb poufny (bez zapisu audio, tekst kasowany po ocenie).</li>
        <li>Oferta, ceny, rabaty i argumenty, które Klient wpisze do Bruno AI, służą tylko do treningów handlowców Klienta. Usługodawca nie pokazuje ich nikomu i nie używa do trenowania modeli AI.</li>
        <li>Usługodawca kasuje swoje kopie danych Klienta w 14 dni od końca umowy.</li>
      </ol>

      <h2>§ 11. Odpowiedzialność</h2>
      <ol>
        <li>Odpowiedzialność Usługodawcy ogranicza się do szkody rzeczywistej: za Bruno AI do wynagrodzenia za ostatnie 3 miesiące, za System do wynagrodzenia za jego budowę.</li>
        <li>Usługodawca nie odpowiada za wyniki sprzedaży Klienta ani za dane wprowadzone przez użytkowników.</li>
      </ol>

      <h2>§ 12. Postanowienia końcowe</h2>
      <ol>
        <li>Zmiany umowy wymagają formy pisemnej albo dokumentowej (e-mail) pod rygorem nieważności.</li>
        <li>W sprawach nieuregulowanych: regulamin Bruno AI, Kodeks cywilny i ustawa o prawie autorskim.</li>
        <li>Spory: sąd właściwy dla siedziby Usługodawcy.</li>
        <li>Umowa zawarta w formie dokumentowej: akceptacja na stronie salesbruno.pl/oferta/ewatex (imię i nazwisko, data, adres IP). Usługodawca wysyła Klientowi potwierdzenie e-mailem (umowa w PDF, umowa powierzenia, link do 1. płatności) w ciągu 24 godzin od akceptacji.</li>
      </ol>

      <h2>Załącznik nr 1. Zakres Systemu CRM (pierwsza wersja)</h2>
      {/* 7.11: zakres = te same zakładki co na stronie oferty (ZAKLADKI_CRM w dane.ts). */}
      <table className={u.tab}>
        <thead>
          <tr>
            <th>Zakładka</th>
            <td><b>Zawartość</b></td>
          </tr>
        </thead>
        <tbody>
          {ZAKLADKI_CRM.map(([nazwa, punkty]) => (
            <tr key={nazwa}>
              <th>{nazwa}</th>
              <td>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {punkty.map((pkt) => (
                    <li key={pkt}>{pkt}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
          <tr>
            <th>Przeniesienie danych</th>
            <td>klienci z Excela, kalendarza i maili przekazanych zgodnie z § 4</td>
          </tr>
          <tr>
            <th>Urządzenia</th>
            <td>przeglądarka na komputerze i telefonie</td>
          </tr>
        </tbody>
      </table>
      <p>Dokładna zawartość każdej zakładki zostanie ustalona na spotkaniu z handlowczynią (dzień 1-14) i po wypełnieniu ankiety przez zarządzającą ({KLIENT.reprezentant}). Lista spółek Klienta do potwierdzenia na tym spotkaniu. Poprawki (zgodność z tym załącznikiem) w cenie. W cenie też 2 spotkania × 30 min ws. zmian w ciągu 3 miesięcy od odbioru (§ 4, § 7).</p>
      <p>Poza zakresem pierwszej wersji (na zamówienie, § 7 pkt 3): fakturowanie, podpis elektroniczny, aplikacja mobilna w sklepie.</p>

      <h2>Załącznik nr 2. Lista kont Bruno AI</h2>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>{KLIENT.reprezentant}</th>
            <td>{KLIENT.email} · zarządzająca, bez opłaty</td>
          </tr>
          {HANDLOWCZYNIE.map((h) => (
            <tr key={h.email}>
              <th>{h.imie}</th>
              <td>{h.email} · handlowiec</td>
            </tr>
          ))}
          <tr>
            <th>trzecia handlowczyni</th>
            <td>e-mail dosłany mailem · handlowiec</td>
          </tr>
        </tbody>
      </table>

      <div className={u.podpisy}>
        <div>
          <span>Usługodawca</span>
          {USLUGODAWCA.nazwa}
        </div>
        <div>
          <span>Klient</span>
          {KLIENT.reprezentant}, {KLIENT.funkcja}
          <br />
          akceptacja na stronie: data, godzina, adres IP w potwierdzeniu e-mail
        </div>
      </div>
    </main>
  );
}
