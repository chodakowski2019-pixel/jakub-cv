-- 22.11.2026 (USER_001: „newsletter nie jest podłączony, a powinien być; schemat weź z salesbruno, tam mamy zapisy na webinar”).
-- Zapisy na newsletter marki Jakub Chodakowski (strona główna jakubchodakowski.com). Wzór: bruno_webinar_zapisy
-- (double opt-in z tokenem, potwierdzenie klikiem, wypisanie jednym kliknięciem). Projekt Supabase: jakubchodakowski-com.
-- Zapis idzie kluczem serwisowym z serwera (app/api/newsletter), więc RLS włączone bez polityk.
create table if not exists public.jc_newsletter (
  id             bigserial primary key,
  email          text not null unique,
  zrodlo         text,                                -- skąd zapis: 'newsletter' (sekcja na dole), 'webinar' (AI dla każdego), 'pasek'
  chce_webinar   boolean not null default false,      -- prosił o informację o najbliższym webinarze
  token          text unique,                         -- losowy token w linkach „potwierdź” i „wypisz się”
  zapisano       timestamptz not null default now(),
  mail_potwierdz timestamptz,                         -- wysłany mail „Potwierdź zapis”
  potwierdzono   timestamptz,                         -- klik w link (zgoda + dowód, że adres należy do klikającego)
  wypisano       timestamptz                          -- klik w „Wypisz się”; wysyłki pomijają
);
create index if not exists jc_newsletter_aktywni_idx on public.jc_newsletter (potwierdzono) where wypisano is null;
alter table public.jc_newsletter enable row level security;
