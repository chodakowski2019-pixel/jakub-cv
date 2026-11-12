import type { Metadata } from "next";
import Dokument, { type SekcjaDok } from "@/components/bruno/praca/dokument";

// 18.10 (USER_001: „czy mamy regulaminy?”): regulamin portalu ofert pracy salesbruno.com/praca.
// 11.11: dopisana baza handlowców (Profil handlowca, weryfikacja do 7 dni, pkt 7a).
// 12.11: dopisana sprzedaż kontaktów do handlowców firmom (pkt 5a), publiczna wyszukiwarka i skrócony profil (pkt 7a),
// nowe pola profilu, mail o weryfikacji. Ceny pakietów celowo bez kwot: są w wyszukiwarce (lib/bruno/praca/kontakty-cennik.ts).
// 12.11 wieczór: Wyszukiwarka przyjmuje link, PDF albo opis; paczka 3 Kontaktów, subskrypcja (pkt 5b), gwarancja (pkt 5c),
// zdjęcie w Profilu skróconym tylko jako zamazana plama barw.
// Wersja robocza przygotowana bez radcy prawnego. Przed skalowaniem sprzedaży do sprawdzenia przez prawnika.
export const metadata: Metadata = { title: "Regulamin | SalesBruno.pl Praca", robots: { index: false, follow: true }, alternates: { canonical: "/praca/regulamin" } };

const MAIL = <a href="mailto:jakub@salesbruno.com">jakub@salesbruno.com</a>;

const SEKCJE: SekcjaDok[] = [
  {
    tytul: "1. Kto prowadzi portal",
    akapity: [
      <>Portal SalesBruno.pl Praca (salesbruno.com/praca i salesbruno.pl/praca, dalej: „Portal”) prowadzi Jakub Chodakowski, prowadzący jednoosobową działalność gospodarczą, ul. Koniecpolskiego 12, 78-100 Kołobrzeg, NIP 6711845485 (dalej: „Usługodawca”). Kontakt: {MAIL}.</>,
    ],
  },
  {
    tytul: "2. Słowniczek",
    punkty: [
      <><b>Kandydat</b>: osoba, która szuka pracy, przegląda oferty, zakłada konto kandydata albo wysyła zgłoszenie.</>,
      <><b>Pracodawca</b>: przedsiębiorca, który zakłada konto pracodawcy i publikuje ogłoszenia o pracę.</>,
      <><b>Ogłoszenie</b>: oferta pracy opublikowana w Portalu.</>,
      <><b>Zgłoszenie</b>: dane i dokumenty, które Kandydat wysyła przez przycisk „Aplikuj”.</>,
      <><b>Profil handlowca</b>: dane o doświadczeniu, specjalizacji, wynikach i oczekiwaniach Kandydata, ze zdjęciem, CV i linkami, jeśli je doda, wysłane przez formularz na salesbruno.pl/praca albo w panelu.</>,
      <><b>Profil skrócony</b>: część Profilu handlowca pokazywana w wyszukiwarce: imię i pierwsza litera nazwiska, stanowisko, miasto, staż w sprzedaży, branże, mocne strony, komu sprzedaje, termin rozpoczęcia. Bez nazwiska, telefonu, e-maila, linków, CV i opisu wyników. Zdjęcie, jeśli Kandydat je dodał, jest pokazywane wyłącznie jako zamazana plama barw, z której nie da się rozpoznać osoby.</>,
      <><b>Wyszukiwarka</b>: strona salesbruno.pl/wyszukiwarka oraz wyszukiwarka w panelu Pracodawcy, w której podaje się link do oferty, plik PDF z ofertą albo opis, jakiego handlowca się szuka.</>,
      <><b>Kontakt</b>: prawo Pracodawcy do zobaczenia pełnego Profilu handlowca jednej osoby, z jej imieniem i nazwiskiem, telefonem, e-mailem, linkami, zdjęciem i CV.</>,
      <><b>Pakiet</b>: opłacona z góry liczba Kontaktów.</>,
    ],
  },
  {
    tytul: "3. Co oferuje Portal",
    punkty: [
      "przeglądanie ofert pracy w sprzedaży bez zakładania konta,",
      "konto Kandydata: zgłoszenia, zapisane oferty, alerty, profil i CV,",
      "baza handlowców: Profil handlowca, który po weryfikacji jest dostępny w Wyszukiwarce jako Profil skrócony, a w całości dla Pracodawcy, który odblokował Kontakt,",
      "Wyszukiwarka handlowców: dostępna bez konta, pokazuje Profile skrócone i stopień dopasowania do opisu,",
      "Pakiety Kontaktów dla Pracodawców,",
      "konto Pracodawcy: publikowanie Ogłoszeń, odbieranie Zgłoszeń i zmiana ich statusów,",
      "powiadomienia e-mail, jeśli użytkownik je włączy.",
    ],
    po: [
      "Część ofert pochodzi z publicznych agregatorów ofert pracy (np. Adzuna). Przy takich ofertach Usługodawca przekazuje Zgłoszenie firmie z ogłoszenia, ale nie odpowiada za przebieg jej rekrutacji. Firma może w każdej chwili poprosić o usunięcie swojej oferty z Portalu.",
    ],
  },
  {
    tytul: "4. Konto",
    punkty: [
      "Konto zakłada się podając e-mail i hasło. Dla Pracodawcy także nazwę firmy.",
      "Użytkownik podaje prawdziwe dane i nie udostępnia hasła innym osobom.",
      <>Konto można usunąć w każdej chwili, pisząc na {MAIL}.</>,
      "Korzystanie z konta Kandydata jest bezpłatne.",
    ],
  },
  {
    tytul: "5. Ogłoszenia i płatności (Pracodawca)",
    punkty: [
      "Ogłoszenie jest widoczne przez 30 dni od opublikowania.",
      "Najpierw Pracodawca opłaca Ogłoszenie, potem je dodaje. Jedna płatność = jedno Ogłoszenie na 30 dni albo przedłużenie istniejącego o 30 dni.",
      "Cena: 200 zł za Ogłoszenie. Pierwsze Ogłoszenie na koncie w promocji: 50 zł. Ceny podane są w cenniku w panelu.",
      "Płatność jest jednorazowa i nie odnawia się sama. Obsługuje ją Stripe (karta, BLIK, przelew). Fakturę wysyłamy e-mailem.",
      "Opłacone Ogłoszenie, którego Pracodawca nie dodał, można wykorzystać później.",
    ],
  },
  {
    tytul: "5a. Kontakty do handlowców (Pracodawca)",
    punkty: [
      "Wyszukiwarka jest bezpłatna. Treść oferty z linku albo pliku PDF system streszcza automatycznie do krótkiego opisu. Wyszukiwarka pokazuje liczbę handlowców pasujących do opisu, Profile skrócone najlepiej dopasowanych i stopień dopasowania w procentach. Stopień dopasowania jest wyliczany automatycznie z porównania opisu z Profilem i ma charakter pomocniczy.",
      "Żeby zobaczyć pełny Profil handlowca z danymi kontaktowymi, Pracodawca kupuje Pakiet (paczkę): 3 Kontakty za 149 zł brutto. Cena jest podana w Wyszukiwarce przed płatnością. Kontakty daje też subskrypcja (pkt 5b) i gwarancja (pkt 5c).",
      "Płatność jest jednorazowa i nie odnawia się sama. Obsługuje ją Stripe (karta, BLIK, przelew). Fakturę wysyłamy e-mailem.",
      "Po płatności Pracodawca zakłada konto albo loguje się na istniejące. Kontakty do osób wybranych przed płatnością odblokowują się od razu i są widoczne w panelu.",
      "Kontakty z Pakietu, których Pracodawca nie wykorzystał od razu, zostają na jego koncie przez 12 miesięcy od zakupu i można nimi odblokować kolejne osoby.",
      "Odblokowanie Kontaktu jest wykonaniem usługi w całości. Opłata za odblokowany Kontakt nie podlega zwrotowi, z wyjątkiem pkt 9.",
      "Pracodawca może używać danych z odblokowanego Profilu wyłącznie do własnej rekrutacji na stanowisko w sprzedaży. Nie może ich odsprzedawać, przekazywać innym podmiotom, publikować ani używać do marketingu.",
      "Od chwili odblokowania Kontaktu Pracodawca jest osobnym administratorem danych tej osoby i sam odpowiada za ich przetwarzanie, w tym za obowiązek informacyjny wobec niej.",
      "Kandydat może w każdej chwili usunąć Profil albo wycofać zgodę. Profil znika wtedy z Wyszukiwarki i z panelu Pracodawcy. Dane, które Pracodawca wcześniej pobrał, Pracodawca przetwarza już na własną odpowiedzialność.",
      "Usługodawca nie gwarantuje, że handlowiec odpowie Pracodawcy ani że przyjmie ofertę.",
    ],
  },
  {
    tytul: "5b. Subskrypcja Wyszukiwarki (Pracodawca)",
    punkty: [
      "Subskrypcja kosztuje 290 zł brutto miesięcznie. Odnawia się co miesiąc do rezygnacji. Płatność obsługuje Stripe (karta). Fakturę wysyłamy e-mailem.",
      "Subskrypcja dotyczy jednego opisu: tego, z którym Pracodawca ją kupił. Pracodawca nie dodaje oferty drugi raz.",
      "W czasie trwania subskrypcji Pracodawca dostaje na konto Kontakty do wszystkich handlowców dopasowanych do opisu: tych, którzy są w bazie w dniu zakupu, i tych, którzy dołączą później. O każdym nowym dopasowanym handlowcu Usługodawca informuje e-mailem.",
      "Dopasowany handlowiec to osoba, która pojawia się w wynikach Wyszukiwarki dla opisu Pracodawcy.",
      <>Pracodawca może zrezygnować w każdej chwili, pisząc na {MAIL}. Subskrypcja działa do końca opłaconego miesiąca. Opłata za rozpoczęty miesiąc nie podlega zwrotowi.</>,
      "Kontakty odblokowane w czasie subskrypcji zostają na koncie Pracodawcy po jej zakończeniu.",
      "Subskrypcja nie gwarantuje określonej liczby handlowców. Do Kontaktów z subskrypcji stosuje się zasady z pkt 5a o używaniu danych.",
    ],
  },
  {
    tytul: "5c. Gwarancja (Pracodawca)",
    punkty: [
      "Gwarancja kosztuje 990 zł brutto. Płatność jest jednorazowa i nie odnawia się sama. Obsługuje ją Stripe. Fakturę wysyłamy e-mailem.",
      "Gwarancja dotyczy jednego opisu: tego, z którym Pracodawca ją kupił. Opisu nie można zmienić po zakupie.",
      "W ciągu 30 dni od płatności Usługodawca odblokowuje na koncie Pracodawcy Kontakty do 5 handlowców dopasowanych do opisu. Dopasowany handlowiec to osoba, która pojawia się w wynikach Wyszukiwarki dla tego opisu. Kontakty, które Pracodawca miał wcześniej, nie liczą się do tych 5.",
      "Jeśli po 30 dniach Pracodawca ma z gwarancji mniej niż 5 Kontaktów, Usługodawca zwraca całą kwotę w ciągu 14 dni, tą samą metodą płatności. Odblokowane Kontakty zostają na koncie Pracodawcy.",
      "Żeby dostać Kontakty, Pracodawca zakłada konto po płatności. Bieg 30 dni liczy się od płatności.",
      "Gwarancja dotyczy liczby Kontaktów. Nie obejmuje odpowiedzi handlowca ani zatrudnienia. Do Kontaktów z gwarancji stosuje się zasady z pkt 5a o używaniu danych.",
    ],
  },
  {
    tytul: "6. Zasady treści Ogłoszeń",
    akapity: ["Pracodawca odpowiada za treść Ogłoszenia. Ogłoszenie nie może:"],
    punkty: [
      "dyskryminować kandydatów (np. ze względu na płeć, wiek, niepełnosprawność, pochodzenie, wyznanie, orientację),",
      "dotyczyć pracy nielegalnej, piramid finansowych ani wymagać od kandydata wpłat,",
      "naruszać praw osób trzecich ani wprowadzać w błąd co do warunków pracy.",
    ],
  },
  {
    tytul: "7. Zgłoszenia",
    akapity: [
      "Kandydat wysyła Zgłoszenie do konkretnego Pracodawcy i wyraża zgodę na przekazanie mu swoich danych. Od chwili otrzymania Zgłoszenia Pracodawca jest administratorem danych Kandydata i odpowiada za ich wykorzystanie w rekrutacji. Pracodawca może używać danych Kandydata wyłącznie do rekrutacji, w której Kandydat się zgłosił, chyba że Kandydat zgodził się na przyszłe rekrutacje.",
    ],
  },
  {
    tytul: "7a. Profil handlowca w bazie",
    punkty: [
      "Profil handlowca jest bezpłatny. Kandydat wypełnia go po założeniu konta.",
      "Usługodawca sprawdza informacje z Profilu w ciągu 7 dni od jego wysłania. Wynik wysyła na e-mail Kandydata. Usługodawca może odmówić dodania Profilu do bazy, gdy dane są niepełne albo nieprawdziwe.",
      "Po weryfikacji Profil skrócony jest widoczny w Wyszukiwarce dla każdego, kto z niej korzysta, także bez konta. Zdjęcie jest tam pokazywane wyłącznie jako zamazana plama barw. Pełny Profil, z nazwiskiem, wyraźnym zdjęciem, telefonem, e-mailem, linkami, CV i opisem wyników, widzi wyłącznie Pracodawca, który odblokował Kontakt. Podstawą jest zgoda Kandydata wyrażona w formularzu.",
      "Pracodawca, który odblokował Kontakt, może skontaktować się z Kandydatem w sprawie pracy. W panelu Kandydat widzi, które firmy odblokowały jego Kontakt.",
      "Kandydat nie płaci za Profil, za jego weryfikację ani za kontakt ze strony Pracodawcy.",
      "Kandydat podaje prawdziwe dane, a zdjęcie przedstawia jego samego.",
      "Kandydat może w każdej chwili poprawić Profil w panelu, w zakładce „Edycja profilu”. Po zapisaniu zmian Profil wraca do weryfikacji i do jej zakończenia nie jest widoczny w Wyszukiwarce.",
      <>Kandydat może w każdej chwili usunąć Profil i wycofać zgodę, pisząc na {MAIL}.</>,
      "Profil nie gwarantuje kontaktu Pracodawcy ani zatrudnienia.",
    ],
  },
  {
    tytul: "8. Usuwanie treści i blokada konta",
    akapity: [
      "Usługodawca może usunąć Ogłoszenie albo Profil handlowca albo zablokować konto, które łamie Regulamin lub prawo, w tym konto Pracodawcy, który używa danych handlowców niezgodnie z pkt 5a. Jeśli usunięte zostało opłacone Ogłoszenie bez naruszenia Regulaminu po stronie Pracodawcy, Usługodawca zwraca płatność.",
    ],
  },
  {
    tytul: "9. Reklamacje",
    akapity: [
      <>Reklamacje można zgłaszać na {MAIL}. Odpowiadamy w ciągu 14 dni.</>,
      "Jeśli dane kontaktowe z odblokowanego Profilu okażą się błędne (telefon i e-mail nie należą do tej osoby albo nie działają), Pracodawca zgłasza to w ciągu 14 dni od odblokowania, a Usługodawca po sprawdzeniu zwraca Kontakt na konto Pracodawcy.",
    ],
  },
  {
    tytul: "10. Odpowiedzialność",
    akapity: [
      "Usługodawca nie gwarantuje zatrudnienia Kandydatowi, określonej liczby Zgłoszeń Pracodawcy ani określonej liczby handlowców w wynikach Wyszukiwarki, z wyjątkiem gwarancji z pkt 5c. Usługodawca nie jest stroną umowy zawieranej między Kandydatem a Pracodawcą i nie prowadzi rekrutacji w imieniu Pracodawcy.",
      "Usługodawca sprawdza Profil na podstawie informacji podanych przez Kandydata. Nie potwierdza jego wyników sprzedaży u poprzednich pracodawców.",
    ],
  },
  {
    tytul: "11. Dane osobowe",
    akapity: [
      <>Zasady przetwarzania danych opisuje <a href="/praca/polityka-prywatnosci">Polityka prywatności</a>.</>,
    ],
  },
  {
    tytul: "12. Zmiany Regulaminu",
    akapity: [
      "O zmianach Regulaminu informujemy e-mailem co najmniej 7 dni wcześniej. Opłacone Ogłoszenia i Pakiety działają do końca okresu na dotychczasowych zasadach.",
    ],
  },
];

export default function Page() {
  return <Dokument tytul="Regulamin" data="12 listopada 2026" wstep="Ten regulamin opisuje zasady korzystania z portalu SalesBruno.pl Praca: ofert pracy dla handlowców, bazy handlowców i wyszukiwarki handlowców dla firm." sekcje={SEKCJE} />;
}
