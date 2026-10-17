-- 18.10 (USER_001, wzór RocketJobs): panel kandydata. Profil, preferencje pracy, zgody na maile, zapisane alerty.
alter table praca_konta add column if not exists miasto text;
alter table praca_konta add column if not exists tytul text;
alter table praca_konta add column if not exists o_mnie text;
alter table praca_konta add column if not exists pref_stanowisko text;
alter table praca_konta add column if not exists pref_miasto text;
alter table praca_konta add column if not exists pref_branza text;
alter table praca_konta add column if not exists pref_tryb text;
alter table praca_konta add column if not exists pref_pensja int;
alter table praca_konta add column if not exists zgoda_oferty boolean not null default true;
alter table praca_konta add column if not exists zgoda_marketing boolean not null default false;

create table if not exists praca_alerty (
  id uuid primary key default gen_random_uuid(),
  konto_id uuid references praca_konta (id) on delete cascade,
  email text not null,
  filtr jsonb not null default '{}',
  opis text,
  created_at timestamptz not null default now()
);
create index if not exists praca_alerty_konto_idx on praca_alerty (konto_id);
alter table praca_alerty enable row level security;
