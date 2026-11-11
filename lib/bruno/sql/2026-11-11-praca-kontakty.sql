-- 11.11 (USER_001): giełda handlowców, strona firm. Firma wpisuje, kogo szuka (/praca/handlowcy), widzi wynik
-- „mamy X handlowców”, płaci w Stripe za pakiet kontaktów (1 / 5 / 10), zakłada konto i w panelu ma odblokowane osoby.
-- Dostęp tylko z serwera (RLS bez polityk).

-- Kontakty do odblokowania na koncie pracodawcy (reszta z pakietu, np. kupione 5, wybrane 3 = zostają 2).
alter table praca_konta add column if not exists kontakty int not null default 0;

-- Zakup pakietu. sesja = id sesji Stripe Checkout (lokalnie bez klucza Stripe: „test_…”). konto_id puste, dopóki
-- firma nie założy konta albo się nie zaloguje po płatności.
create table if not exists praca_zakupy_kontaktow (
  id uuid primary key default gen_random_uuid(),
  sesja text not null unique,
  email text,
  konto_id uuid references praca_konta (id) on delete set null,
  pakiet int not null check (pakiet > 0),
  kwota_gr int not null default 0,
  wybrani uuid[] not null default '{}',
  test boolean not null default false,
  created_at timestamptz not null default now(),
  przypisany_at timestamptz
);
create index if not exists praca_zakupy_kontaktow_konto_idx on praca_zakupy_kontaktow (konto_id);

-- Kto komu odblokował kontakt: konto_id = pracodawca, handlowiec_id = konto kandydata z profilem.
create table if not exists praca_odblokowania (
  konto_id uuid not null references praca_konta (id) on delete cascade,
  handlowiec_id uuid not null references praca_konta (id) on delete cascade,
  zakup_id uuid references praca_zakupy_kontaktow (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (konto_id, handlowiec_id)
);
create index if not exists praca_odblokowania_handlowiec_idx on praca_odblokowania (handlowiec_id);

-- Każde wyszukiwanie firmy (do lejka: ile firm szukało, czego i ile wyników dostało).
create table if not exists praca_wyszukiwania (
  id uuid primary key default gen_random_uuid(),
  konto_id uuid references praca_konta (id) on delete set null,
  filtry jsonb not null default '{}',
  wynik int not null default 0,
  created_at timestamptz not null default now()
);

alter table praca_zakupy_kontaktow enable row level security;
alter table praca_odblokowania enable row level security;
alter table praca_wyszukiwania enable row level security;
