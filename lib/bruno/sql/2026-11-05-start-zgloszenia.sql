-- 5.11 (USER_001): zgłoszenia po płatności z LP B2C salesbruno.pl/start (formularz /start/formularz).
-- Pisze tylko serwer (service role). USER_001 zakłada konto ręcznie w 24 h i wysyła dostęp mailem.
create table if not exists bruno_start_zgloszenia (
  id bigint generated always as identity primary key,
  utworzono timestamptz not null default now(),
  pakiet text not null check (pakiet in ('start', 'pro')),
  imie text not null,
  email text not null,
  telefon text,
  cel text not null,
  doswiadczenie text not null,
  co_sprzedaje text not null,
  trudnosc text,
  zrodlo text,
  ip text,
  stan text not null default 'nowe' -- nowe → konto założone → dostęp wysłany
);
alter table bruno_start_zgloszenia enable row level security;

-- 5.11 (USER_001 „bardziej rozbudowany”): pola jak w „Dostosuj Bruno” + sytuacja + cel na 30 dni.
alter table bruno_start_zgloszenia
  add column if not exists zwracanie text,
  add column if not exists praca text,
  add column if not exists rozmow_tyg text,
  add column if not exists kanaly text[],
  add column if not exists komu text,
  add column if not exists klient text,
  add column if not exists obiekcje text,
  add column if not exists strona text,
  add column if not exists skrypt text,
  add column if not exists cel_30 text,
  add column if not exists pewnosc int,
  add column if not exists pora text,
  add column if not exists minut int;
