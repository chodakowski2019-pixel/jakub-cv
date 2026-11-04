-- 4.11.2026 (USER_001): Bruno pod CRM, pkt 3 (raport miesięczny szefa) i pkt 6 (zamówienie pakietu z akceptacją regulaminu).

create table if not exists bruno_raporty (
  id bigserial primary key,
  utworzono timestamptz not null default now(),
  firma_id text not null,
  miesiac text not null,
  tresc jsonb not null,
  model text,
  autor_email text,
  wyslano_at timestamptz
);
create index if not exists bruno_raporty_firma_idx on bruno_raporty (firma_id, utworzono desc);

create table if not exists bruno_zamowienia (
  id bigserial primary key,
  utworzono timestamptz not null default now(),
  pakiet smallint not null check (pakiet in (1, 2, 3)),
  konta smallint not null check (konta >= 1),
  firma text not null,
  nip text,
  email text not null,
  telefon text,
  osoby jsonb not null default '[]'::jsonb,
  uwagi text,
  kwota_start integer not null default 0,
  kwota_miesiac integer not null default 0,
  wersja_oferty text not null,
  regulamin_at timestamptz,
  polityka_at timestamptz,
  ip text,
  agent text,
  stan text not null default 'nowe',
  stripe_invoice_id text,
  oplacono_at timestamptz
);
create index if not exists bruno_zamowienia_email_idx on bruno_zamowienia (email, utworzono desc);

alter table bruno_raporty enable row level security;
alter table bruno_zamowienia enable row level security;
