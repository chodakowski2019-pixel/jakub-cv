// Oferta STRATEGII marketingowo-sprzedażowej dla klinik (USER_001 2026-09-24).
//
// To NIE jest linia SEO (1 000 zł/mc) ani SEO+ (2 500 zł/mc). To jednorazowy
// projekt: audyt, strategia, szkolenie zespołu klienta, opcjonalnie 60 dni
// wdrożenia i miesięczny nadzór. Pierwszy adresat: Perfect Hair Clinic,
// Katowice (Marcin Piwecki), decyzja USER_001 z 21.09, że dostaje INNĄ
// ofertę niż standardowy cennik klinik.
//
// Adres wysyłamy imiennie: /strategiaoferta?k=<klucz>. Strona ma noindex
// i wpis w robots.ts, wejście melduje się mailem (/api/oferta/wejscie).
//
// Bez Stripe. Kwoty 15-29 tys. zł i 50% zaliczki rozliczamy fakturą po
// rozmowie, nie Payment Linkiem.
//
// ⛔ Ten plik jest importowany przez komponent kliencki, więc KAŻDY string
// z obiektu trafia do paczki JS odbiorcy. Rachunki, wątpliwości i źródła
// trzymamy w KOMENTARZACH (patrz ta sama zasada w kliniki-oferty.ts).

export type OfertaStrategii = {
  /** Nazwa placówki, dokładnie tak, jak się przedstawiają. */
  nazwa: string;
  miasto: string;
  /** Do kogo mówimy (wołacz). */
  osoba: string;
  /** Zabieg, na którym klinika zarabia najwięcej i pod który budujemy lejek. */
  zabieg: string;
  /** Cena tego zabiegu z ICH cennika, w zł. Podstawa rachunku zwrotu. */
  cenaZabiegu: number;
  /** Nazwa pakietu z ich cennika, żeby klient poznał własną liczbę. */
  pakietZabiegu: string;
  /** Kanał wejścia do lejka, o którym sami mówili. */
  wejscie: string;
  /** Jak nazywamy osobę z ich zespołu, którą szkolimy. */
  zespol: string;
  /** Pakiet A, strategia + szkolenie, jednorazowo. */
  cenaA: number;
  /** Pakiet B, A + 60 dni wdrożenia, jednorazowo. */
  cenaB: number;
  /** Nadzór miesięczny po oddaniu, min. 6 miesięcy. */
  cenaNadzor: number;
  /** Nadzór z prowadzeniem kampanii przez nas. */
  cenaNadzorPlus: number;
};

export const STRATEGIA_OFERTY: Record<string, OfertaStrategii> = {
  // Perfect Hair Clinic, Katowice, ul. Fabryczna 15b. Kontakt: Marcin
  // Piwecki, m.piwecki@perfecthairclinic.pl, 883 92 82 82 (rozmowa 17.09
  // 22:40, sam poprosił o telefon). Prowadzi też Fundację Alopecia.
  // ⚠️ Na stronie prezes zarządu i dyrektor medyczny = Ola Urban. Kto
  // podpisuje, do ustalenia w rozmowie przed wysyłką.
  //
  // Cennik perfecthairclinic.pl/cennik (sprawdzony 24.09.2026):
  //   SILVER 19 000 zł (FUE, min. 2 500 graftów), GOLD 22 000, PLATINUM 26 000.
  // Do rachunku bierzemy SILVER, czyli najniższą kwotę, żeby próg zwrotu
  // był policzony ostrożnie.
  //
  // Skąd ceny pakietów (rynek PL 2026, sprawdzone 24.09):
  //   strategia rozbudowana 10-25 tys., agencje od 20 tys.;
  //   szkolenie zamknięte 7-10 tys. za dzień;
  //   obsługa marketingowa średniej kliniki 5-8 tys./mc;
  //   retainer doradczy od 1 200, medyczny od 3 000/mc;
  //   kierownik marketingu na etacie: mediana 11 250 brutto.
  perfecthair: {
    nazwa: "Perfect Hair Clinic",
    miasto: "Katowice",
    osoba: "Panie Marcinie",
    zabieg: "przeszczep włosów",
    cenaZabiegu: 19000,
    pakietZabiegu: "SILVER",
    wejscie: "webinary o trychologii",
    zespol: "Wasz specjalista od strony",
    cenaA: 15000,
    cenaB: 29000,
    cenaNadzor: 3500,
    cenaNadzorPlus: 5000,
  },
};
