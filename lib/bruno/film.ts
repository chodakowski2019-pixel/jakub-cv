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

/** Wersja PL (te same ekrany EN, lektor po polsku, 1 min 16 s). Jest tylko wersja z końcówką Bruno Pro. */
export const FILM_OPROWADZAJACY_PL = "/bruno/oprowadzanie-v10-pl.mp4";
export const FILM_OKLADKA_PL = "/bruno/oprowadzanie-v10-pl.jpg";
export const FILM_DLUGOSC_PL = "1 min 16 s";

/**
 * 11.10 (USER_001): który film dla którego konta. Free (B2C, 3 rozmowy) = wersja z końcówką
 * „Unlock → Bruno Pro”. Pełny dostęp (firma B2B, kupiony Bruno Pro) = wersja bez tej końcówki.
 */
export function filmDla(konto: { plan?: string | null; jezyk?: string | null } | null | undefined): { src: string; okladka: string; dlugosc: string } {
  // 11.10: konto PL = film z lektorem PL (jest tylko wersja z końcówką, więc także dla pełnego dostępu).
  if (konto?.jezyk === "pl") return { src: FILM_OPROWADZAJACY_PL, okladka: FILM_OKLADKA_PL, dlugosc: FILM_DLUGOSC_PL };
  return konto?.plan === "pelny"
    ? { src: FILM_OPROWADZAJACY_PELNY, okladka: FILM_OKLADKA_PELNY, dlugosc: FILM_DLUGOSC_PELNY }
    : { src: FILM_OPROWADZAJACY, okladka: FILM_OKLADKA, dlugosc: FILM_DLUGOSC };
}
