/**
 * Film oprowadzający po panelu (USER_001 2.10). Jedna stała dla popupu przy
 * pierwszym logowaniu i dla zakładki „Instrukcja" w Ustawieniach.
 * Wersja w nazwie pliku = nowy adres przy każdej zmianie filmu (pewny cache).
 * v10 (10.10): panel czarno-złoty EN, lektor Chris (EN). Wersja PL (lektor Adam) na później.
 */
export const FILM_OPROWADZAJACY = "/bruno/oprowadzanie-v10.mp4";
export const FILM_DLUGOSC = "1 min 10 s";
/** Okładka = pierwsza plansza filmu (USER_001 2.10). Ta sama wersja co plik wideo. */
export const FILM_OKLADKA = "/bruno/oprowadzanie-v10.jpg";

/** Wersja B dla kont z pełnym dostępem (B2B): bez sceny 07 (darmowe rozmowy / Bruno Pro). */
export const FILM_OPROWADZAJACY_PELNY = "/bruno/oprowadzanie-v10-pelny.mp4";
export const FILM_OKLADKA_PELNY = "/bruno/oprowadzanie-v10-pelny.jpg";
export const FILM_DLUGOSC_PELNY = "1 min";

/**
 * Wersja PL: v12 (13.10) = v11 bez sceny „Poznajmy się” (film leci PO tym ekranie, USER_001) i z żywszym lektorem
 * (Adam, eleven_v3 stability 0 = Creative, wykrzykniki), 1 min 8 s. Sceny: panel, Dostosuj (komu sprzedajesz + zapis sam), Test, Start, Feedback, Trening, Kalendarz, Bruno Pro.
 * 14.10 (USER_001): v13 = v12 z lektorem z JEDNEGO nagrania (stability 0.5), bo v12 miał różne barwy głosu w scenach. 1 min 10 s.
 * Jest tylko wersja z końcówką Bruno Pro.
 */
export const FILM_OPROWADZAJACY_PL = "/bruno/oprowadzanie-v13-pl.mp4";
export const FILM_OKLADKA_PL = "/bruno/oprowadzanie-v13-pl.jpg";
export const FILM_DLUGOSC_PL = "1 min 10 s";

/**
 * 15.10 (USER_001): na telefonie film W PIONIE (9:16), nagrany z ekranów telefonu (dolny pasek, arkusz „Więcej”).
 * v14 = ten sam lektor co v13, źródła `SalesAI/wideo/oprowadzanie/v14-tel/`. Do 860 px (jak panel na telefonie).
 */
export const FILM_PION_PL = "/bruno/oprowadzanie-v14-pl-pion.mp4";
export const FILM_OKLADKA_PION_PL = "/bruno/oprowadzanie-v14-pl-pion.jpg";
export const FILM_PION_MEDIA = "(max-width: 860px)";

type Film = { src: string; okladka: string; dlugosc: string; pion?: { src: string; okladka: string } };

/**
 * 11.10 (USER_001): który film dla którego konta. Free (B2C, 3 rozmowy) = wersja z końcówką
 * „Unlock → Bruno Pro”. Pełny dostęp (firma B2B, kupiony Bruno Pro) = wersja bez tej końcówki.
 */
export function filmDla(konto: { plan?: string | null; jezyk?: string | null } | null | undefined): Film {
  // 11.10: konto PL = film z lektorem PL (jest tylko wersja z końcówką, więc także dla pełnego dostępu).
  if (konto?.jezyk === "pl") return { src: FILM_OPROWADZAJACY_PL, okladka: FILM_OKLADKA_PL, dlugosc: FILM_DLUGOSC_PL, pion: { src: FILM_PION_PL, okladka: FILM_OKLADKA_PION_PL } };
  return konto?.plan === "pelny"
    ? { src: FILM_OPROWADZAJACY_PELNY, okladka: FILM_OKLADKA_PELNY, dlugosc: FILM_DLUGOSC_PELNY }
    : { src: FILM_OPROWADZAJACY, okladka: FILM_OKLADKA, dlugosc: FILM_DLUGOSC };
}
