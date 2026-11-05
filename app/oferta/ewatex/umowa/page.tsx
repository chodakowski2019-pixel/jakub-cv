import type { Metadata } from "next";
import u from "./umowa.module.css";
import { BRUNO, CRM, HANDLOWCZYNIE, KLIENT, KONTAKT_ZGLOSZENIA, USLUGODAWCA, WERSJA, zl } from "../dane";

// 5.11 (USER_001): jedna umowa zamiast dwóch (Bruno AI + CRM), z poprawkami z oferty (14 500 zł, oś czasu, współpraca
// 3 mies. z możliwością przedłużenia, rozmowy dobrane do etapu nauki). Strona = źródło PDF:
// node scripts/bruno-ewatex-umowa-pdf.mjs → public/pdf/umowa-ewatex.pdf (link na /oferta/ewatex i w mailu po podpisie).
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
        <li>W cenie: rozmowy z klientem AI dobrane do etapu nauki każdej handlowczyni (do 5 dziennie na konto), ocena 1-10 z radą po każdej rozmowie, fiszki z technikami, czat z Bruno, panel zarządzającej (kto ćwiczy i kto robi postęp), wsparcie mailem.</li>
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
            <th>Dzień 7</th>
            <td>Spotkanie online 30 min z handlowczynią ws. CRM: pierwsza wersja Systemu, dostosowanie.</td>
          </tr>
          <tr>
            <th>Dzień 14</th>
            <td>Spotkanie online 30 min z {KLIENT.reprezentant} ws. CRM: System gotowy, dane przeniesione, konta, odbiór.</td>
          </tr>
          <tr>
            <th>Do 3 miesięcy od odbioru</th>
            <td>Możliwość 2 spotkań × 30 min na poprawki w CRM, w zakresie załącznika nr 1.</td>
          </tr>
          <tr>
            <th>Po 3 miesiącach</th>
            <td>Decyzja o przedłużeniu Bruno AI (§ 5).</td>
          </tr>
        </tbody>
      </table>
      <ol>
        <li>
          Odbiór Systemu: Klient w 5 dni roboczych od dnia 14 zgłasza uwagi z zakresu załącznika nr 1 albo potwierdza odbiór mailem. Brak uwag w tym czasie = odbiór. Uwagi spoza zakresu = zmiany na zamówienie (§ 7 pkt 3).
        </li>
        <li>Opóźnienie po stronie Klienta (dane, uwagi, dostępność) przesuwa terminy o tyle samo dni.</li>
      </ol>

      <h2>§ 5. Czas trwania</h2>
      <ol>
        <li>
          Bruno AI: współpraca na <b>{BRUNO.okresMiesiecy} miesiące</b> od uruchomienia kont (okres minimalny), z możliwością przedłużenia. Umowa w tej części nie przedłuża się sama: Klient decyduje mailem. Usługodawca przypomina o końcu okresu e-mailem 14 dni wcześniej.
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
              {zl(BRUNO.cenaKonto)} za konto / miesiąc × {BRUNO.konta} = {zl(BRUNO.miesiac)} / miesiąc; za {BRUNO.okresMiesiecy} miesiące <b>{zl(BRUNO.trzyMiesiace)}</b>
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
              <b>{zl(zaliczka + BRUNO.trzyMiesiace)}</b>: 50 % za System {zl(zaliczka)} + Bruno AI za {BRUNO.okresMiesiecy} miesiące {zl(BRUNO.trzyMiesiace)}, jedna faktura, termin 7 dni
            </td>
          </tr>
          <tr>
            <th>Po przedłużeniu Bruno AI</th>
            <td>{zl(BRUNO.miesiac)} / miesiąc z góry, do 7. dnia okresu</td>
          </tr>
        </tbody>
      </table>
      <ol>
        <li>Usługodawca korzysta ze zwolnienia z VAT. Kwoty są końcowe.</li>
        <li>Dodanie handlowca: od następnego miesiąca, {zl(BRUNO.cenaKonto)} za konto. Zmniejszenie liczby kont: dopiero po okresie minimalnym.</li>
        <li>Opłaty za rozpoczęty miesiąc nie podlegają zwrotowi.</li>
        <li>Opóźnienie płatności powyżej 14 dni: Usługodawca może zawiesić konta Bruno AI i utrzymanie Systemu do zapłaty; dane Klienta zostają dostępne do pobrania.</li>
      </ol>

      <h2>§ 7. Utrzymanie i zmiany Systemu</h2>
      <ol>
        <li>Utrzymanie obejmuje: serwer i bazę danych, kopie zapasowe codziennie, poprawki błędów, drobne zmiany do 2 godzin w miesiącu (niewykorzystane nie przechodzą).</li>
        <li>Klient może zrezygnować z utrzymania i przejąć System sam (§ 9).</li>
        <li>Zmiany na zamówienie poza zakresem: {zl(CRM.godzina)} za godzinę, zawsze z wyceną i akceptacją mailem przed pracą.</li>
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
          Z chwilą zapłaty 2. płatności Klient nabywa majątkowe prawa autorskie do Systemu w zakresie korzystania, zmieniania i przekazywania innym wykonawcom, na wszystkich polach eksploatacji potrzebnych do używania Systemu w firmie, bez ograniczeń czasu i terytorium.
        </li>
        <li>Konta hostingu, bazy danych i repozytorium kodu są założone na Klienta albo przekazane mu na żądanie w 5 dni roboczych, z instrukcją uruchomienia.</li>
        <li>Usługodawca zachowuje prawo do używania własnych, ogólnych elementów (biblioteki, szablony, narzędzia) w innych projektach. Danych Klienta nigdy.</li>
        <li>Bruno AI pozostaje własnością Usługodawcy; Klient ma prawo korzystania w czasie trwania umowy.</li>
      </ol>

      <h2>§ 10. Dane osobowe i poufność</h2>
      <ol>
        <li>Dla danych handlowców oraz klientów Klienta w Systemie Klient jest administratorem, Usługodawca podmiotem przetwarzającym.</li>
        <li>Powierzenie danych: umowa powierzenia (RODO art. 28), wysyłana mailem razem z potwierdzeniem zawarcia umowy, z listą podwykonawców przetwarzania.</li>
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
        <li>Umowa zawarta w formie dokumentowej: akceptacja na stronie salesbruno.pl/oferta/ewatex (imię i nazwisko, data, adres IP) + potwierdzenie e-mailem do obu stron.</li>
      </ol>

      <h2>Załącznik nr 1. Zakres Systemu CRM (pierwsza wersja)</h2>
      <table className={u.tab}>
        <tbody>
          <tr>
            <th>Karta klienta</th>
            <td>firma, spółka Klienta, z której ofertujemy, osoba kontaktowa, telefon, e-mail, obecny sprzedawca energii, data końca umowy, cena, faktura (plik), kto prowadzi, historia rozmów</td>
          </tr>
          <tr>
            <th>Etapy sprzedaży</th>
            <td>ustalone z Klientem na spotkaniu w dniu 7; widok, na którym etapie ilu klientów</td>
          </tr>
          <tr>
            <th>Notatka po rozmowie</th>
            <td>data, treść, następny krok z datą, czy jest faktura</td>
          </tr>
          <tr>
            <th>Przypomnienia</th>
            <td>koniec umowy klienta: 12, 6 i 3 miesiące przed, e-mail do zarządzającej i do handlowca prowadzącego</td>
          </tr>
          <tr>
            <th>Panel zarządzającej</th>
            <td>umowy do przedłużenia w kwartale, rozmowy w tygodniu per handlowiec, oferty wysłane i podpisane, faktury zebrane</td>
          </tr>
          <tr>
            <th>Oferta ze spółki</th>
            <td>wybór spółki przy ofercie, właściwy nadawca e-mail, dane spółki na dokumencie</td>
          </tr>
          <tr>
            <th>Przeniesienie danych</th>
            <td>klienci z Excela, kalendarza i maili przekazanych zgodnie z § 4</td>
          </tr>
          <tr>
            <th>Konta</th>
            <td>4 ({KLIENT.reprezentant} + 3 handlowczynie), role: zarządzająca / handlowiec</td>
          </tr>
          <tr>
            <th>Telefon</th>
            <td>działa w przeglądarce na telefonie</td>
          </tr>
          <tr>
            <th>Spółki</th>
            <td>Ewatex, Reenergia, Respect (lista do potwierdzenia w dniu 7)</td>
          </tr>
        </tbody>
      </table>
      <p>Poza zakresem pierwszej wersji (na zamówienie, § 7 pkt 3): integracja Systemu z Bruno AI, fakturowanie, podpis elektroniczny, aplikacja mobilna w sklepie.</p>

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
            <td>e-mail podany przy akceptacji albo dosłany mailem · handlowiec</td>
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
