-- 15.11 (USER_001): newsletter dla handlowców liczy TYLKO kliknięcia w link (bez otwarć, UTM, zakupów).
-- Skrypt wysyłki zakłada jeden link na osobę i mail (salesbruno.pl/l/<kod>), każde wejście = wiersz w newsletter_klikniecia.
create table if not exists newsletter_linki (
  kod text primary key,
  email text not null,
  mail text not null,
  cel text not null,
  created_at timestamptz not null default now()
);
create table if not exists newsletter_klikniecia (
  id bigint generated always as identity primary key,
  kod text not null references newsletter_linki(kod) on delete cascade,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists newsletter_klikniecia_kod on newsletter_klikniecia(kod);
alter table newsletter_linki enable row level security;
alter table newsletter_klikniecia enable row level security;
