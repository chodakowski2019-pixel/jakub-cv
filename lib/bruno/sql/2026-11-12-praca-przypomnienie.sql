-- 12.11 (USER_001): przycisk „Przypomnij” w zakładce „Niedokończone” wysyła handlowcowi mail z prośbą o dokończenie profilu.
-- Kolumny: kiedy ostatnio i ile razy wysłany, żeby administrator widział, komu już przypomniał.
alter table praca_konta add column if not exists przypomnienie_at timestamptz;
alter table praca_konta add column if not exists przypomnienia smallint not null default 0;
