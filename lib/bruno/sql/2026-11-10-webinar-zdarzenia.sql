-- 10.11.2026 (USER_001: „stworzyć lejek i śledzić każdy etap”): zdarzenia strony zapisu na webinar.
-- wejscie = otwarcie /webinar (raz na sesję przeglądarki), klik = otwarcie okienka zapisu.
-- Dalsze etapy lejka są w bruno_webinar_zapisy (zapis, potwierdzenie, obecność) i bruno_demo (spotkanie).
create table if not exists bruno_webinar_zdarzenia (
  id bigint generated always as identity primary key,
  webinar text not null,
  zdarzenie text not null check (zdarzenie in ('wejscie', 'klik')),
  sesja text not null,
  zrodlo text,
  kiedy timestamptz not null default now(),
  unique (webinar, zdarzenie, sesja)
);
create index if not exists bruno_webinar_zdarzenia_webinar_idx on bruno_webinar_zdarzenia (webinar, zdarzenie);
alter table bruno_webinar_zdarzenia enable row level security;
