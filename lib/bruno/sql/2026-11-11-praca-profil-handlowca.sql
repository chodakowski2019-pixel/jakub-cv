-- 11.11 (USER_001): baza handlowców. Kandydat po założeniu konta wypełnia formularz (/praca/dolacz/profil),
-- profil czeka na weryfikację do 7 dni. Jedno konto = jeden profil. Dostęp tylko z serwera (RLS bez polityk).
create table if not exists praca_profile_handlowcow (
  konto_id uuid primary key references praca_konta (id) on delete cascade,
  odpowiedzi jsonb not null default '{}',
  status text not null default 'weryfikacja' check (status in ('weryfikacja', 'zatwierdzony', 'odrzucony')),
  zgoda_pracodawcy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists praca_profile_handlowcow_status_idx on praca_profile_handlowcow (status);
alter table praca_profile_handlowcow enable row level security;
