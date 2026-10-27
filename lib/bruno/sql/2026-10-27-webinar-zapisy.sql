-- 27.10 (USER_001): zapisy na webinar (śr 4.11 19:00) w bazie + stan sekwencji maili.
-- Do tej pory zapis = tylko mail do USER_001 (16.10). Teraz: wiersz tutaj, mail potwierdzenia z linkiem Zoom
-- do uczestnika, przypomnienia z crona (3.11 i 4.11 rano) i z Resend (scheduledAt: 18:00 i 18:55).
create table if not exists public.bruno_webinar_zapisy (
  id bigserial primary key,
  webinar text not null,                       -- klucz z lib/bruno/webinar.ts, np. '2026-11-04'
  imie text not null,
  email text not null,
  zrodlo text,                                 -- ?src= z linku (fb-1, fb-2, fb-3, linkedin, ...)
  zapisano timestamptz not null default now(),
  mail_potwierdzenie timestamptz,              -- M0 wysłane
  mail_jutro timestamptz,                      -- M1 (dzień przed, 8:00 PL)
  mail_dzis timestamptz,                       -- M2 (w dniu, 8:00 PL)
  resend_za_godzine text,                      -- id maila zaplanowanego w Resend na 18:00
  resend_start text,                           -- id maila zaplanowanego w Resend na 18:55
  obecnosc text,                               -- po webinarze: 'byli' | 'wyszli' | 'nieprzyszli' (z listy Zooma, ręcznie)
  mail_po timestamptz,                         -- M5 wysłane
  uwagi text,
  unique (webinar, email)
);
create index if not exists bruno_webinar_zapisy_webinar_idx on public.bruno_webinar_zapisy (webinar, zapisano desc);
alter table public.bruno_webinar_zapisy enable row level security;
