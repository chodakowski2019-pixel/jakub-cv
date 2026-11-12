-- 12.11 (USER_001): wyszukiwarka handlowców, subskrypcja (290 zł / mies.) i gwarancja (990 zł, 5 handlowców w 30 dni albo zwrot).
-- Zlecenie = zapisane wyszukiwanie firmy. Kontakty do dopasowanych handlowców odblokowują się na koncie firmy bez puli:
-- od razu po przypisaniu konta i potem przy każdym nowym zweryfikowanym profilu, który pasuje do opisu.
-- Dostęp tylko z serwera (RLS bez polityk).
create table if not exists praca_zlecenia (
  id uuid primary key default gen_random_uuid(),
  sesja text not null unique,
  rodzaj text not null check (rodzaj in ('subskrypcja', 'gwarancja')),
  email text,
  konto_id uuid references praca_konta (id) on delete set null,
  opis text not null default '',
  filtry jsonb not null default '{}',
  kwota_gr int not null default 0,
  stripe_sub text,
  status text not null default 'aktywne' check (status in ('aktywne', 'zakonczone')),
  -- gwarancja: do kiedy ma być komplet handlowców
  termin timestamptz,
  test boolean not null default false,
  created_at timestamptz not null default now(),
  przypisany_at timestamptz
);
create index if not exists praca_zlecenia_konto_idx on praca_zlecenia (konto_id);
create index if not exists praca_zlecenia_status_idx on praca_zlecenia (status);
alter table praca_zlecenia enable row level security;

alter table praca_odblokowania add column if not exists zlecenie_id uuid references praca_zlecenia (id) on delete set null;
