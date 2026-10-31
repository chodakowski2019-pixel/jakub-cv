-- 30.10 (USER_001): zapisy na kursy B2C (salesbruno.pl/kursy/<slug>). Pisze tylko serwer (service role).
create table if not exists bruno_kursy_zapisy (
  id bigint generated always as identity primary key,
  utworzono timestamptz not null default now(),
  kurs text not null,
  imie text not null,
  email text not null,
  telefon text, -- 31.10: puste, gdy Stripe nie zebrał telefonu
  plan text not null check (plan in ('miesiac', 'z-gory')),
  zrodlo text,
  etap text not null default 'zapisany'
);
alter table bruno_kursy_zapisy enable row level security;

-- 30.10 (USER_001): wyniki testu predyspozycji (salesbruno.pl/kursy/test) = leady B2C.
create table if not exists bruno_kursy_testy (
  id bigint generated always as identity primary key,
  utworzono timestamptz not null default now(),
  imie text not null,
  email text not null,
  odpowiedzi int[] not null,
  styl text not null,
  kurs text not null,
  zrodlo text
);
alter table bruno_kursy_testy enable row level security;
