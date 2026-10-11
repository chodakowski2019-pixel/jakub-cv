import type { Jezyk } from "./domeny";
import { ETAPY, REJESTRY, type EtapId, type RejestrId } from "./etapy";
import { NAZWY } from "./kryteria";
import { CELE, POSTACIE, POZIOMY, TRYBY, type CelId, type PostacId, type PoziomId, type TrybId } from "./postacie";

// 11.10: etykiety widoczne w UI (typy klienta, poziomy, tryby, cele, etapy, forma zwracania się, kryteria)
// w języku konta. Obiekty w postacie.ts / etapy.ts / kryteria.ts zostają EN (to też źródło promptu EN);
// tu leży polska wersja tekstów do wyświetlenia. Plik bez zależności serwerowych.
// Polskie teksty = wersja sprzed tłumaczenia (git fd7de52), 1:1.

type Etykieta = { nazwa: string; krotko?: string; opis: string };

const PL = {
  POSTACIE: {
    czerwony: { nazwa: "Czerwony", krotko: "dominujący", opis: "Szybki, konkretny, chce wyniku i ceny. Przerywa ogólniki. Decyduje sam." },
    zolty: { nazwa: "Żółty", krotko: "towarzyski", opis: "Gadatliwy, ciepły, odbiega od tematu. Kupuje emocją, ale łatwo odkłada decyzję." },
    zielony: { nazwa: "Zielony", krotko: "stabilny", opis: "Ostrożny, spokojny, nie lubi zmian. „Muszę to przemyśleć”. Trzeba go otworzyć pytaniami." },
    niebieski: { nazwa: "Niebieski", krotko: "analityczny", opis: "Liczby, dowody, szczegóły. Sprawdza handlowca, łapie za słowa, nie ufa ogólnikom." },
  } as Record<PostacId, Etykieta>,
  POZIOMY: {
    latwy: { nazwa: "Łatwy", krotko: "życzliwy", opis: "Bruno chce rozmawiać. Obiekcję podnosi raz i odpuszcza po sensownej odpowiedzi." },
    sredni: { nazwa: "Średni", krotko: "normalny", opis: "Tak zachowuje się typowy klient. Wraca do obiekcji zbitej słabo." },
    trudny: { nazwa: "Trudny", krotko: "wymagający", opis: "Chce skończyć rozmowę, przerywa ogólniki, wraca do obiekcji dwa razy i dociska cenę." },
  } as Record<PoziomId, Etykieta>,
  TRYBY: {
    cold: { nazwa: "Cold calling", opis: "Bruno nie wie, kto dzwoni. Masz 3 minuty, żeby dojść do celu." },
    zywo: { nazwa: "Spotkanie 1:1 na żywo", opis: "Bruno zna ofertę i zaczyna od obiekcji. Twoim zadaniem jest je zbić." },
    online: { nazwa: "Spotkanie 1:1 online", opis: "Po Twojej prezentacji. Bruno podsumowuje i przechodzi do obiekcji." },
  } as Record<TrybId, Etykieta>,
  CELE: {
    spotkanie: { nazwa: "Umówić spotkanie na żywo", opis: "konkretna data i godzina" },
    prezentacja: { nazwa: "Umówić prezentację online", opis: "termin + kto będzie" },
    sprzedaz: { nazwa: "Domknąć sprzedaż", opis: "zgoda na zakup albo umowę" },
    decyzja: { nazwa: "Dostać decyzję tak albo nie", opis: "bez „odezwę się”" },
    decydent: { nazwa: "Dojść do decydenta", opis: "nazwisko, rola, kontakt, kiedy" },
    wlasny: { nazwa: "Własny cel", opis: "wpisz, co ma się wydarzyć" },
  } as Record<CelId, Etykieta>,
  ETAPY: {
    cold: { nazwa: "Nie zna mnie", opis: "pierwszy kontakt, nic nie wie o ofercie" },
    oferta: { nazwa: "Dostał ofertę", opis: "zna ofertę, jeszcze nie zdecydował" },
    umowa: { nazwa: "Podpisał, chce się wycofać", opis: "umowa jest, teraz ma wątpliwości" },
    klient: { nazwa: "Jest już klientem", opis: "kupił, rozmowa o dokupieniu / przedłużeniu" },
  } as Record<EtapId, Etykieta>,
  REJESTRY: {
    pan: { nazwa: "Pan / Pani", opis: "klient indywidualny, urząd, starsza firma" },
    ty: { nazwa: "Na ty", opis: "startup, agencja, branża, w której wszyscy są na ty" },
  } as Record<RejestrId, Etykieta>,
  NAZWY: { otwarcie: "Otwarcie", pytania: "Pytania", obiekcje: "Obiekcje", zamkniecie: "Zamknięcie", pewnosc: "Pewność siebie" } as Record<keyof typeof NAZWY, string>,
};

const EN = {
  POSTACIE: POSTACIE as Record<PostacId, Etykieta>,
  POZIOMY: POZIOMY as Record<PoziomId, Etykieta>,
  TRYBY: TRYBY as Record<TrybId, Etykieta>,
  CELE: CELE as Record<CelId, Etykieta>,
  ETAPY: ETAPY as Record<EtapId, Etykieta>,
  REJESTRY: REJESTRY as Record<RejestrId, Etykieta>,
  NAZWY: NAZWY as Record<keyof typeof NAZWY, string>,
};

/**
 * Etykiety UI w danym języku. Użycie: const E = etykiety(jezyk); E.POSTACIE[id].nazwa, E.NAZWY.zamkniecie.
 * Pola techniczne (kolor, glos, ikona, charakter, instrukcja) czytaj dalej z obiektów w postacie.ts.
 */
export function etykiety(jezyk: Jezyk | string | null | undefined): typeof EN {
  return jezyk === "pl" ? PL : EN;
}
