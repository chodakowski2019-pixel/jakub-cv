-- 11.11 (USER_001): formularz profilu handlowca zbiera zdjęcie (krok „Kontakt”). Plik leży w prywatnym magazynie praca-cv
-- (kandydaci/<id konta>/zdjecie-*.jpg), tu tylko ścieżka. CV zapisuje się jak dotąd w praca_konta.cv_sciezka.
alter table praca_profile_handlowcow add column if not exists zdjecie_sciezka text;
