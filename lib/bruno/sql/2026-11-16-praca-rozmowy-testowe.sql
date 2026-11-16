-- 16.11 (USER_001): zakładka „Nagraj rozmowę” w panelu handlowca giełdy. Handlowiec odbywa 3 rozmowy sprzedażowe
-- z Bruno po 3 minuty (te same 3 scenariusze dla każdego). Nagranie, transkrypcja i ocena trafiają do firm,
-- które odblokowały jego kontakt. Jeden wiersz = jedno podejście; zaliczona rozmowa = status „zakonczona”.
-- Dostęp tylko z serwera (RLS bez polityk).
create table if not exists praca_rozmowy_testowe (
  id uuid primary key default gen_random_uuid(),
  konto_id uuid not null references praca_konta (id) on delete cascade,
  nr int not null check (nr between 1 and 3),
  status text not null default 'trwa' check (status in ('trwa', 'zakonczona', 'przerwana')),
  start timestamptz not null default now(),
  koniec timestamptz,
  sekundy int,
  transkrypcja jsonb,
  feedback jsonb,
  ocena numeric,
  nagranie_sciezka text,
  el_conversation_id text,
  zgoda_udostepnienia boolean not null default false
);
create index if not exists praca_rozmowy_testowe_konto_idx on praca_rozmowy_testowe (konto_id);
alter table praca_rozmowy_testowe enable row level security;
