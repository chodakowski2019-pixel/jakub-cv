-- 25.10 (USER_001): DEMO = produkt sprzedażowy. Firma (nazwa, strona, logo) + konta szefa i przykładowych
-- handlowców w jednej firmie. Szef (rola owner / sales_director / team_lead z firma_id) widzi /bruno/szef.
create table if not exists public.bruno_firmy (
  id text primary key,
  nazwa text not null,
  www text,
  logo_url text,
  jezyk text not null default 'pl',
  demo boolean not null default true,
  -- Wersje rozmów (transkrypcje, plusy, minusy) wygenerowane raz przez model; reset seeda ich nie generuje od nowa.
  demo_dane jsonb,
  utworzono timestamptz not null default now()
);
alter table bruno_konta add column if not exists firma_id text references public.bruno_firmy(id) on delete set null;
-- Konto demo: bez limitu 7 dni, bez ankiety Mazura, bez filmu. Handlowcy demo nie mają kodu (kod_hash null = nie logują się).
alter table bruno_konta add column if not exists demo boolean not null default false;
create index if not exists bruno_konta_firma_idx on bruno_konta(firma_id);
