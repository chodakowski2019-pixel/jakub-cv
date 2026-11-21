-- Zapytania z formularza „Szkolenie AI dla firm” (app/api/szkolenia-ai/route.ts).
-- Projekt Supabase: jakubchodakowski-com. NIE uruchomione: do wykonania przed publikacją strony.
-- Zapis idzie kluczem serwisowym z serwera, więc RLS zostaje włączone bez polityk (brak dostępu z przeglądarki).

create table if not exists public.szkolenia_ai_leady (
  id          bigint generated always as identity primary key,
  utworzono   timestamptz not null default now(),
  imie        text not null,
  firma       text not null,
  email       text not null,
  telefon     text,
  osoby       text not null,
  forma       text,
  wiadomosc   text,
  zgoda       boolean not null default false
);

alter table public.szkolenia_ai_leady enable row level security;
