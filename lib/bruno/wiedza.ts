// Stała talia WIEDZY do fiszek (USER_001 2.10): typy klientów DISC (rozpoznawanie
// i jak z nimi rozmawiać) + techniki z bazy wiedzy Sprzedaż (Voss, Rackham, Sandler,
// Belfort, Mazur). Każda karta: krótki tytuł (klucz), pytanie sytuacyjne, wzór.
// Dokładane każdemu kontu przy wejściu w Trening (zapewnijKarty), oceniane jak reszta.

export type KartaWiedzy = { tresc: string; kategoria: "typy" | "technika"; pytanie: string; wzor: string };

export const WIEDZA: KartaWiedzy[] = [
  // Rozpoznawanie typów
  {
    tresc: "Rozpoznaj: czerwony",
    kategoria: "typy",
    pytanie: "Klient przerywa po dwóch zdaniach, pyta „ile?” i „co z tego mam?”, nie chce gadać o pogodzie. Jaki to typ i jak z nim rozmawiasz?",
    wzor: "Czerwony, dominujący. Krótko, liczby, wynik, jasny następny krok. Zero wstępów i ogólników. Dajesz mu decyzję do podjęcia, nie opowieść.",
  },
  {
    tresc: "Rozpoznaj: żółty",
    kategoria: "typy",
    pytanie: "Klient jest ciepły, opowiada anegdoty, odbiega od tematu, mówi „super, pogadam z zespołem”. Jaki to typ i co jest Twoim głównym zadaniem?",
    wzor: "Żółty, towarzyski. Kupuje emocją i relacją, unika twardego „nie”. Twoje zadanie: sprowadzać do tematu i dopinać konkret: data, osoba, decyzja. Inaczej rozmowa jest miła i kończy się niczym.",
  },
  {
    tresc: "Rozpoznaj: zielony",
    kategoria: "typy",
    pytanie: "Klient odpowiada półsłówkami, nie zadaje pytań, mówi „muszę to przemyśleć”, „mamy już sprawdzone rozwiązanie”. Jaki to typ i czym go otwierasz?",
    wzor: "Zielony, stabilny. Boi się zmiany i ryzyka. Otwierasz go pytaniami otwartymi o jego sytuację, bezpieczeństwem (gwarancja, czas, brak presji) i przykładem kogoś podobnego do niego.",
  },
  {
    tresc: "Rozpoznaj: niebieski",
    kategoria: "typy",
    pytanie: "Klient dopytuje o szczegóły, źródła liczb, wyjątki w umowie, wytyka niespójność: „przed chwilą powiedział pan co innego”. Jaki to typ i co go przekonuje?",
    wzor: "Niebieski, analityczny. Przekonują go konkretne liczby, nazwy firm, porównanie i czas na analizę. Przyznaj ograniczenia wprost. Ogólnik u niego = koniec zaufania.",
  },
  // Techniki
  {
    tresc: "Etykieta (Voss)",
    kategoria: "technika",
    pytanie: "Klient mówi: „to dla mnie za drogo”. Jak brzmi etykieta, którą odpowiadasz, i czego po niej NIE robisz?",
    wzor: "„Wygląda na to, że cena jest tu dla pana kluczowa.” Potem cisza. Nie bronisz ceny, nie dajesz rabatu, nie argumentujesz. Czekasz, aż klient sam dopowie, o co naprawdę chodzi.",
  },
  {
    tresc: "Lustro (Voss)",
    kategoria: "technika",
    pytanie: "Klient: „Mam już swojego dostawcę i jestem zadowolony.” Zastosuj lustro.",
    wzor: "„Zadowolony?” (powtarzasz 1-3 ostatnie słowa, ton pytający, cisza). Klient rozwija temat i sam pokazuje, czego mu brakuje u obecnego dostawcy.",
  },
  {
    tresc: "Pytanie implikacyjne (SPIN)",
    kategoria: "technika",
    pytanie: "Klient przyznał: „czasem gubimy leady, bo nikt nie oddzwania na czas”. Zadaj pytanie implikacyjne.",
    wzor: "„Ile takich leadów miesięcznie i ile średnio wart jest jeden? Czyli ile pieniędzy zostaje co miesiąc na stole?” Pytanie o skutek i koszt problemu, nie o sam problem.",
  },
  {
    tresc: "Kontrakt wstępny (Sandler)",
    kategoria: "technika",
    pytanie: "Zaczynasz 20-minutową rozmowę online. Jak brzmi kontrakt wstępny w pierwszych 30 sekundach?",
    wzor: "„Mamy 20 minut. Proponuję: ja zadam kilka pytań o waszą sytuację, pan zada mi swoje, a na końcu ustalimy wprost, czy to ma sens i jaki jest następny krok. Pasuje?” Cel, czas, wynik, zgoda.",
  },
  {
    tresc: "Pętla po obiekcji (Belfort)",
    kategoria: "technika",
    pytanie: "Klient po Twojej odpowiedzi na obiekcję mówi „no dobrze, ale muszę pomyśleć”. Co robisz w pętli?",
    wzor: "Dokładasz JEDNĄ nową informację albo dowód (nazwa firmy + liczba) i ponownie prosisz o decyzję: „…dlatego zróbmy tak: zaczynamy od pilotażu w listopadzie. Pasuje?” Nie powtarzasz tego samego argumentu.",
  },
  {
    tresc: "Cisza po kwocie",
    kategoria: "technika",
    pytanie: "Podałeś cenę: „to kosztuje 4 000 zł miesięcznie”. Co robisz w następnych 5 sekundach?",
    wzor: "Nic. Milczysz. Klient odzywa się pierwszy. Każde dopowiedzenie („ale można negocjować”, „tylko”, „niestety”) to usprawiedliwianie ceny i zaproszenie do rabatu.",
  },
  {
    tresc: "Prośba o decyzję",
    kategoria: "technika",
    pytanie: "Zostały 2 minuty rozmowy, klient jest w zasadzie przekonany, ale sam nic nie proponuje. Co mówisz?",
    wzor: "Prosisz wprost o konkretny krok z datą i osobą: „Umówmy wdrożenie na wtorek 10:00, z panem i szefem sprzedaży. Pasuje?” Nie: „to odezwę się”, „prześlę ofertę”, „proszę pomyśleć”.",
  },
  {
    tresc: "Dowód z liczbą",
    kategoria: "technika",
    pytanie: "Klient: „a skąd mam wiedzieć, że to u nas zadziała?”. Jak brzmi dobry dowód, a jak zły?",
    wzor: "Dobry: nazwa firmy + liczba + czas: „Styrobud, 12 handlowców, po 6 tygodniach +18 % umówionych spotkań.” Zły: „wielu klientów jest zadowolonych”, „to się sprawdza”.",
  },
];
