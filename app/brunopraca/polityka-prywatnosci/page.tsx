import type { Metadata } from "next";
import Dokument, { type SekcjaDok } from "@/components/bruno/praca/dokument";

// 18.10 (USER_001): polityka prywatności portalu ofert pracy salesbruno.com/praca.
// 11.11: dopisana baza handlowców (Profil handlowca: odpowiedzi z formularza, zdjęcie, CV, udostępnianie Pracodawcom).
// 12.11: dopisane nowe pola profilu (o sobie, linki, zmiana miasta), publiczny Profil skrócony w wyszukiwarce, przekazanie
// pełnego Profilu firmie po zakupie Kontaktu, zapis wyszukiwań, e-mail o weryfikacji, stopień dopasowania.
// Wersja robocza bez radcy prawnego. Przy zmianie technicznej (nowe dane, nowy dostawca) aktualizować.
export const metadata: Metadata = { title: "Polityka prywatności | SalesBruno.pl Praca", robots: { index: false, follow: true }, alternates: { canonical: "/praca/polityka-prywatnosci" } };

const MAIL = <a href="mailto:jakub@salesbruno.com">jakub@salesbruno.com</a>;

const SEKCJE: SekcjaDok[] = [
  {
    tytul: "1. Administrator",
    akapity: [<>Administratorem danych jest Jakub Chodakowski, ul. Koniecpolskiego 12, 78-100 Kołobrzeg, NIP 6711845485. Kontakt w sprawie danych: {MAIL}.</>],
  },
  {
    tytul: "2. Jakie dane zbieramy",
    punkty: [
      <><b>Kandydaci</b>: e-mail, hasło (zapisane w postaci skrótu), imię i nazwisko, telefon, miasto, profil zawodowy, preferencje pracy, link do LinkedIn, plik CV, treść Zgłoszeń, zapisane oferty i alerty.</>,
      <><b>Profil handlowca</b>: odpowiedzi z formularza (doświadczenie, stanowisko, kilka zdań o sobie, branże, sposób sprzedaży, mocne strony, realizacja planu, wartość sprzedaży, największy wynik, miasto, gotowość do zmiany miasta zamieszkania, tryb pracy, rodzaj umowy, oczekiwane wynagrodzenie, termin rozpoczęcia), imię i nazwisko, telefon oraz, jeśli je dodasz: linki (LinkedIn, strona albo portfolio, Facebook, Instagram), zdjęcie i plik CV.</>,
      <><b>Wyszukiwarka handlowców</b>: link do oferty, plik PDF z ofertą albo treść opisu, które podajesz w wyszukiwarce, krótki opis, który system z nich tworzy, liczba wyników i czas wyszukiwania. Jeśli jesteś zalogowany jako Pracodawca, wyszukiwanie jest przypisane do Twojego konta.</>,
      <><b>Zakup Kontaktów</b>: który Pracodawca i kiedy odblokował Kontakt do którego handlowca, wielkość Pakietu i liczba niewykorzystanych Kontaktów.</>,
      <><b>Subskrypcja i gwarancja</b>: e-mail, opis, z którym zostały kupione, kwota, termin gwarancji i Kontakty, które z nich wynikły.</>,
      <><b>Pracodawcy</b>: e-mail, hasło (skrót), imię, telefon, nazwa firmy, NIP, adres do faktury, logo, opis firmy, klauzule, treść Ogłoszeń.</>,
      <><b>Płatności</b>: obsługuje Stripe. Nie widzimy numeru karty, dostajemy potwierdzenie płatności, kwotę i dane do faktury.</>,
      <><b>Dane techniczne</b>: logi serwera (adres IP, przeglądarka) do bezpieczeństwa.</>,
    ],
  },
  {
    tytul: "3. Po co i na jakiej podstawie",
    punkty: [
      "prowadzenie konta i Portalu: umowa (art. 6 ust. 1 lit. b RODO),",
      "przekazanie Zgłoszenia Pracodawcy: zgoda Kandydata (art. 6 ust. 1 lit. a RODO),",
      "weryfikacja Profilu handlowca: umowa (art. 6 ust. 1 lit. b RODO),",
      "pokazanie Profilu skróconego (bez nazwiska, zdjęcia i danych kontaktowych) w publicznej wyszukiwarce oraz przekazanie pełnego Profilu Pracodawcy, który odblokował Kontakt: zgoda Kandydata (art. 6 ust. 1 lit. a RODO), do wycofania w każdej chwili,",
      "wiadomości o koncie i Profilu, np. o wyniku weryfikacji: umowa (art. 6 ust. 1 lit. b RODO),",
      "sprzedaż Pakietów Kontaktów, subskrypcji i gwarancji oraz rozliczenie odblokowań: umowa (art. 6 ust. 1 lit. b RODO),",
      "zapis wyszukiwań, żeby wiedzieć, jakich handlowców szukają firmy, i rozwijać bazę: prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO),",
      "powiadomienia e-mail o ofertach i porady: zgoda (art. 6 ust. 1 lit. a RODO), do wycofania w panelu,",
      "faktury i księgowość: obowiązek prawny (art. 6 ust. 1 lit. c RODO),",
      "bezpieczeństwo i obrona przed roszczeniami: prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).",
    ],
  },
  {
    tytul: "4. Komu przekazujemy dane",
    punkty: [
      "Pracodawcy, do którego Kandydat wysłał Zgłoszenie. Pracodawca staje się wtedy osobnym administratorem tych danych.",
      "Każdemu, kto korzysta z wyszukiwarki handlowców, także bez konta: Profil skrócony po weryfikacji, jeśli Kandydat się na to zgodził. Profil skrócony to imię i pierwsza litera nazwiska, stanowisko, miasto, staż w sprzedaży, branże, mocne strony, komu sprzedajesz i termin rozpoczęcia. Zdjęcie, jeśli je dodałeś, pokazujemy tam wyłącznie jako zamazaną plamę barw, z której nie da się rozpoznać osoby.",
      "Pracodawcy, który odblokował Kontakt: pełny Profil handlowca, czyli także nazwisko, telefon, e-mail, linki, zdjęcie, CV, opis wyników i oczekiwania. Pracodawca staje się wtedy osobnym administratorem tych danych i może ich używać wyłącznie do własnej rekrutacji.",
      "Kandydatowi: nazwę firmy, która odblokowała jego Kontakt, jej stronę i logo oraz datę odblokowania.",
      "dostawcom usług, z których korzystamy: Supabase (baza danych i pliki), Vercel (serwery strony), Stripe (płatności), Resend (wysyłka e-maili), Anthropic (automatyczne streszczenie oferty z linku albo pliku PDF podanego w wyszukiwarce; nie przekazujemy tam Profili handlowców), Google (logowanie, jeśli użytkownik je wybierze).",
    ],
    po: ["Część dostawców działa poza Europejskim Obszarem Gospodarczym. Przekazanie odbywa się na podstawie standardowych klauzul umownych Komisji Europejskiej albo decyzji o odpowiednim stopniu ochrony."],
  },
  {
    tytul: "5. Jak długo przechowujemy dane",
    punkty: [
      "dane konta: do usunięcia konta,",
      "Zgłoszenia i CV: do 12 miesięcy od wysłania albo do usunięcia konta,",
      "Profil handlowca ze zdjęciem i CV: do usunięcia Profilu, usunięcia konta albo wycofania zgody. Po usunięciu Profil znika z wyszukiwarki i z paneli Pracodawców, którzy odblokowali Kontakt,",
      "zapis wyszukiwań: do 24 miesięcy,",
      "historia zakupów i odblokowań Kontaktów: do usunięcia konta Pracodawcy, a dane do faktur jak niżej,",
      "dane do faktur: 5 lat od końca roku podatkowego,",
      "logi techniczne: do 30 dni.",
    ],
  },
  {
    tytul: "6. Twoje prawa",
    akapity: [
      <>Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz sprzeciwu. Zgodę możesz wycofać w każdej chwili, bez wpływu na wcześniejsze przetwarzanie. Napisz na {MAIL}. Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.</>,
    ],
  },
  {
    tytul: "7. Pliki cookies i pamięć przeglądarki",
    punkty: [
      "ciasteczko sesji: utrzymuje zalogowanie (niezbędne),",
      "pamięć przeglądarki: zapisane oferty bez konta i ostatnio przeglądane oferty (zostają na Twoim urządzeniu).",
    ],
    po: ["Nie używamy ciasteczek reklamowych."],
  },
  {
    tytul: "8. Profilowanie",
    akapity: [
      "„Oferty dla Ciebie” pokazujemy na podstawie preferencji, które sam wpisujesz.",
      "W wyszukiwarce handlowców system automatycznie porównuje opis wpisany przez firmę z Profilem handlowca (branża, miasto, staż, komu sprzedaje, tryb pracy) i pokazuje stopień dopasowania w procentach. Od niego zależy kolejność wyników i to, czy Profil pojawi się w danym wyszukiwaniu. O kontakcie i zatrudnieniu zawsze decyduje człowiek po stronie firmy.",
      "Nie podejmujemy wobec Ciebie decyzji wywołujących skutki prawne w oparciu wyłącznie o automatyczne przetwarzanie.",
    ],
  },
];

export default function Page() {
  return <Dokument tytul="Polityka prywatności" data="12 listopada 2026" wstep="Tu opisujemy, jakie dane zbieramy w portalu SalesBruno.pl Praca, po co i jakie masz prawa." sekcje={SEKCJE} />;
}
