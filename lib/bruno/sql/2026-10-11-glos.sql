-- 11.10 (USER_001): głos Bruno w Ustawieniach: m = mężczyzna (domyślnie), k = kobieta.
alter table bruno_konfig add column if not exists glos text not null default 'm';
