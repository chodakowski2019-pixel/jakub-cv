import type { Metadata } from "next";
import Dokument, { type SekcjaDok } from "@/components/bruno/praca/dokument";

// 18.10 (USER_001: „czy mamy regulaminy?”): regulamin portalu ofert pracy salesbruno.com/praca.
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
    ],
  },
  {
    tytul: "3. Co oferuje Portal",
    punkty: [
      "przeglądanie ofert pracy w sprzedaży bez zakładania konta,",
      "konto Kandydata: zgłoszenia, zapisane oferty, alerty, profil i CV,",
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
    tytul: "8. Usuwanie treści i blokada konta",
    akapity: [
      "Usługodawca może usunąć Ogłoszenie albo zablokować konto, które łamie Regulamin lub prawo. Jeśli usunięte zostało opłacone Ogłoszenie bez naruszenia Regulaminu po stronie Pracodawcy, Usługodawca zwraca płatność.",
    ],
  },
  {
    tytul: "9. Reklamacje",
    akapity: [<>Reklamacje można zgłaszać na {MAIL}. Odpowiadamy w ciągu 14 dni.</>],
  },
  {
    tytul: "10. Odpowiedzialność",
    akapity: [
      "Usługodawca nie gwarantuje zatrudnienia Kandydatowi ani określonej liczby Zgłoszeń Pracodawcy. Usługodawca nie jest stroną umowy zawieranej między Kandydatem a Pracodawcą.",
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
      "O zmianach Regulaminu informujemy e-mailem co najmniej 7 dni wcześniej. Opłacone Ogłoszenia działają do końca okresu na dotychczasowych zasadach.",
    ],
  },
];

export default function Page() {
  return <Dokument tytul="Regulamin" data="18 października 2026" wstep="Ten regulamin opisuje zasady korzystania z portalu ofert pracy dla handlowców SalesBruno.pl Praca przez kandydatów i pracodawców." sekcje={SEKCJE} />;
}
