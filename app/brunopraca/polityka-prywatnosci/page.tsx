import type { Metadata } from "next";
import Dokument, { type SekcjaDok } from "@/components/bruno/praca/dokument";

// 18.10 (USER_001): polityka prywatności portalu ofert pracy salesbruno.com/praca.
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
      "powiadomienia e-mail o ofertach i porady: zgoda (art. 6 ust. 1 lit. a RODO), do wycofania w panelu,",
      "faktury i księgowość: obowiązek prawny (art. 6 ust. 1 lit. c RODO),",
      "bezpieczeństwo i obrona przed roszczeniami: prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).",
    ],
  },
  {
    tytul: "4. Komu przekazujemy dane",
    punkty: [
      "Pracodawcy, do którego Kandydat wysłał Zgłoszenie. Pracodawca staje się wtedy osobnym administratorem tych danych.",
      "dostawcom usług, z których korzystamy: Supabase (baza danych i pliki), Vercel (serwery strony), Stripe (płatności), Resend (wysyłka e-maili), Google (logowanie, jeśli użytkownik je wybierze).",
    ],
    po: ["Część dostawców działa poza Europejskim Obszarem Gospodarczym. Przekazanie odbywa się na podstawie standardowych klauzul umownych Komisji Europejskiej albo decyzji o odpowiednim stopniu ochrony."],
  },
  {
    tytul: "5. Jak długo przechowujemy dane",
    punkty: [
      "dane konta: do usunięcia konta,",
      "Zgłoszenia i CV: do 12 miesięcy od wysłania albo do usunięcia konta,",
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
    akapity: ["„Oferty dla Ciebie” pokazujemy na podstawie preferencji, które sam wpisujesz. Nie podejmujemy wobec Ciebie decyzji wywołujących skutki prawne w oparciu wyłącznie o automatyczne przetwarzanie."],
  },
];

export default function Page() {
  return <Dokument tytul="Polityka prywatności" data="18 października 2026" wstep="Tu opisujemy, jakie dane zbieramy w portalu SalesBruno.pl Praca, po co i jakie masz prawa." sekcje={SEKCJE} />;
}
