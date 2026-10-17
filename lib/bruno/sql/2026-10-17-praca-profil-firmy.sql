-- 17.10 (USER_001, wzór RocketJobs): profil firmy, dane do faktury, klauzule RODO pracodawcy.
alter table praca_konta add column if not exists logo_url text;
alter table praca_konta add column if not exists nazwa_wyswietlana text;
alter table praca_konta add column if not exists o_firmie text;
alter table praca_konta add column if not exists www text;
alter table praca_konta add column if not exists fv_nazwa text;
alter table praca_konta add column if not exists fv_kraj text default 'Polska';
alter table praca_konta add column if not exists fv_adres text;
alter table praca_konta add column if not exists fv_miasto text;
alter table praca_konta add column if not exists fv_kod text;
alter table praca_konta add column if not exists klauzula_rodo text;
alter table praca_konta add column if not exists klauzula_przyszle text;
alter table praca_konta add column if not exists klauzula_przyszle_domyslnie boolean not null default false;
-- Zgoda kandydata na przyszłe rekrutacje (gdy firma ma taką klauzulę).
alter table praca_zgloszenia add column if not exists zgoda_przyszle boolean not null default false;
-- Logo firm: publiczny magazyn (pokazujemy przy ogłoszeniach).
insert into storage.buckets (id, name, public) values ('praca-loga', 'praca-loga', true) on conflict (id) do nothing;
