-- 18.10 (USER_001): przejęcie oferty z Adzuna = kopia w panelu firmy (zrodlo_id = id oferty z oferty.json).
-- Aktywna kopia ukrywa oryginał na liście.
alter table praca_oferty_firm add column if not exists zrodlo_id text;
create index if not exists praca_oferty_firm_zrodlo_idx on praca_oferty_firm (zrodlo_id);
