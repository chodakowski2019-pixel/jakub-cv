-- 12.10 (K1): przypomnienia biegną co godzinę (cron-job.org), o godzinie z bruno_konfig.godzina_przypomnienia.
-- Zabezpieczenie „raz dziennie na konto” = istniejący zapis w bruno_maile (rodzaj + wyslano + wynik),
-- bez nowej kolumny. Indeks pod zapytanie crona „komu dziś już poszło” (rodzaj in (...), wyslano >= północ PL).
create index if not exists bruno_maile_rodzaj_wyslano_idx on bruno_maile (rodzaj, wyslano desc);
