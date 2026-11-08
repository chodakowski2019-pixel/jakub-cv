-- 8.11 (USER_001): ALGORYTM TRENINGU. Bruno sam układa 5 treningów dziennie z CRM i ocen (lib/bruno/plan-treningu.ts).
alter table bruno_rozmowy
  add column if not exists klient_id bigint,
  add column if not exists plan_pozycja text;

create table if not exists bruno_plan_treningu (
  email text not null,
  dzien date not null,
  pozycje jsonb not null,
  utworzono timestamptz not null default now(),
  primary key (email, dzien)
);
alter table bruno_plan_treningu enable row level security;

-- prawdziwe rozmowy z klientami (nagranie wrzucone do czatu) ocenione tą samą rubryką co trening
create table if not exists bruno_oceny_nagran (
  id bigint generated always as identity primary key,
  email text not null,
  firma_id text,
  klient_id bigint,
  nazwa_pliku text,
  ocena numeric,
  kryteria jsonb not null,
  obiekcje text[] not null default '{}',
  streszczenie text,
  utworzono timestamptz not null default now()
);
create index if not exists bruno_oceny_nagran_email on bruno_oceny_nagran (email, utworzono desc);
alter table bruno_oceny_nagran enable row level security;
