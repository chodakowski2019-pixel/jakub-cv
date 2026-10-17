-- 17.10 (USER_001): portal salesbruno.com/praca, konta i panele: KANDYDAT i PRACODAWCA.
-- Dostęp tylko z serwera (klucz serwisowy). RLS włączone bez polityk = nic z przeglądarki.

create table if not exists praca_konta (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  typ text not null check (typ in ('kandydat', 'pracodawca')),
  haslo_hash text not null,
  imie text,
  telefon text,
  -- pracodawca
  firma text,
  nip text,
  -- kandydat
  linkedin text,
  cv_sciezka text,
  cv_nazwa text,
  nieudane int not null default 0,
  blokada_do timestamptz,
  created_at timestamptz not null default now(),
  unique (email, typ)
);

-- Ogłoszenia dodane przez pracodawców w panelu (oferty z Adzuna zostają w lib/bruno/praca/oferty.json).
create table if not exists praca_oferty_firm (
  id text primary key,
  konto_id uuid not null references praca_konta (id) on delete cascade,
  firma text not null,
  stanowisko text not null,
  miasto text,
  wojewodztwo text,
  poziom text,
  umowa text,
  wymiar text,
  tryb text,
  branza text,
  pensja_min int,
  pensja_max int,
  opis text,
  obowiazki text[] not null default '{}',
  wymagania text[] not null default '{}',
  mile_widziane text[] not null default '{}',
  oferujemy text[] not null default '{}',
  status text not null default 'oczekuje' check (status in ('oczekuje', 'aktywna', 'wstrzymana', 'usunieta')),
  created_at timestamptz not null default now(),
  wazne_do timestamptz not null default (now() + interval '30 days')
);
create index if not exists praca_oferty_firm_konto_idx on praca_oferty_firm (konto_id);

-- Zgłoszenia kandydatów (na oferty z Adzuna i z panelu). oferta_id = id z oferty.json albo praca_oferty_firm.
create table if not exists praca_zgloszenia (
  id uuid primary key default gen_random_uuid(),
  oferta_id text not null,
  kandydat_id uuid references praca_konta (id) on delete set null,
  imie text not null,
  email text not null,
  telefon text,
  linkedin text,
  wiadomosc text,
  cv_sciezka text,
  cv_nazwa text,
  status text not null default 'nowe' check (status in ('nowe', 'obejrzane', 'zaproszone', 'odrzucone')),
  created_at timestamptz not null default now()
);
create index if not exists praca_zgloszenia_oferta_idx on praca_zgloszenia (oferta_id);
create index if not exists praca_zgloszenia_kandydat_idx on praca_zgloszenia (kandydat_id);

create table if not exists praca_zapisane (
  konto_id uuid not null references praca_konta (id) on delete cascade,
  oferta_id text not null,
  created_at timestamptz not null default now(),
  primary key (konto_id, oferta_id)
);

alter table praca_konta enable row level security;
alter table praca_oferty_firm enable row level security;
alter table praca_zgloszenia enable row level security;
alter table praca_zapisane enable row level security;

-- Prywatny magazyn na pliki CV (pobieranie tylko podpisanym linkiem z serwera).
insert into storage.buckets (id, name, public) values ('praca-cv', 'praca-cv', false) on conflict (id) do nothing;
