-- 17.10 (USER_001): Bruno tylko B2B. Rejestracja zamknięta: formularz = prośba o dostęp,
-- USER_001 akceptuje w Adminie (do 24 h), wtedy powstaje konto demo (1 rozmowa, 3 min) i idzie mail z kodem.
create table if not exists public.bruno_prosby (
  id bigint generated always as identity primary key,
  utworzono timestamptz not null default now(),
  email text not null,
  imie text not null,
  telefon text,
  firma text not null,
  handlowcy text not null,
  produkt text not null,
  jezyk text not null default 'pl',
  status text not null default 'nowa', -- nowa / przyznany / odrzucona
  decyzja_at timestamptz
);
create index if not exists bruno_prosby_email on public.bruno_prosby (email);
alter table public.bruno_prosby enable row level security;
