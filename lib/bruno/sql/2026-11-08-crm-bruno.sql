-- 8.11 (USER_001): CRM BRUNO = główna baza KAŻDEJ firmy. Pipedrive, Excel i inne = integracje (import do tych tabel).
alter table bruno_klienci
  add column if not exists powod_przegranej text,
  add column if not exists zrodlo text not null default 'bruno',
  add column if not exists zewn_id text;
create unique index if not exists bruno_klienci_zewn on bruno_klienci (firma_id, zrodlo, zewn_id);

create table if not exists bruno_crm_etapy (
  id bigint generated always as identity primary key,
  firma_id text not null,
  nazwa text not null,
  kolejnosc int not null,
  zrodlo text not null default 'bruno',
  zewn_id text
);
create index if not exists bruno_crm_etapy_firma on bruno_crm_etapy (firma_id, kolejnosc);
create unique index if not exists bruno_crm_etapy_zewn on bruno_crm_etapy (firma_id, zrodlo, zewn_id);
alter table bruno_crm_etapy enable row level security;

-- notatki, zadania (telefon / spotkanie / mail / zadanie / trening), zmiany etapu, statusu i wartości
create table if not exists bruno_crm_zdarzenia (
  id bigint generated always as identity primary key,
  firma_id text not null,
  klient_id bigint references bruno_klienci (id) on delete cascade,
  typ text not null check (typ in ('notatka', 'zadanie', 'etap', 'status', 'wartosc')),
  tekst text not null,
  pod text,
  typ_zadania text,
  data date,
  godzina time,
  zrobione boolean,
  zrobione_at timestamptz,
  autor text,
  bruno boolean not null default false,
  utworzono timestamptz not null default now(),
  zrodlo text not null default 'bruno',
  zewn_id text
);
create index if not exists bruno_crm_zdarzenia_klient on bruno_crm_zdarzenia (firma_id, klient_id, utworzono desc);
create index if not exists bruno_crm_zdarzenia_zadania on bruno_crm_zdarzenia (firma_id, typ, zrobione, data);
create unique index if not exists bruno_crm_zdarzenia_zewn on bruno_crm_zdarzenia (firma_id, zrodlo, zewn_id);
alter table bruno_crm_zdarzenia enable row level security;
