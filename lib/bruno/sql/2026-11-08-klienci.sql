-- 8.11 (USER_001): domyślny CRM Bruno dla firm bez Pipedrive + zdjęcie i płeć klienta (także dla deali z Pipedrive).
create table if not exists bruno_klienci (
  id bigint generated always as identity primary key,
  firma_id text not null,
  handlowiec text,
  imie_nazwisko text not null,
  firma text,
  telefon text,
  email text,
  etap_id int not null default -1,
  status text not null default 'open',
  wartosc numeric not null default 0,
  waluta text not null default 'PLN',
  utworzono timestamptz not null default now(),
  aktualizacja timestamptz not null default now()
);
create index if not exists bruno_klienci_firma on bruno_klienci (firma_id);
alter table bruno_klienci enable row level security;

create table if not exists bruno_klient_profil (
  firma_id text not null,
  deal_id bigint not null,
  plec text check (plec in ('m','k')),
  zdjecie_sciezka text,
  zaktualizowano timestamptz not null default now(),
  primary key (firma_id, deal_id)
);
alter table bruno_klient_profil enable row level security;
