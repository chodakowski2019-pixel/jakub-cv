-- 28.10 (USER_001): odpowiedzi z formularza potrzeb po demo (Ewatex). Strony /formularz/<firma> i /formularz/<firma>/handlowiec,
-- API /api/bruno/formularz. Jedna osoba może wysłać kilka razy (każdy wiersz osobno, bez upsertu).
create table if not exists public.bruno_formularze (
  id bigserial primary key,
  firma text not null,                        -- klucz z lib/bruno/formularz-firmy.ts, np. 'ewatex'
  rola text not null,                         -- 'szef' | 'handlowiec'
  imie text not null,
  email text,                                 -- 28.10: pole e-mail usunięte z formularza (USER_001), zwykle puste
  odpowiedzi jsonb not null default '{}'::jsonb,  -- { id_pytania: odpowiedź }
  wyslano timestamptz not null default now()
);
create index if not exists bruno_formularze_firma_idx on public.bruno_formularze (firma, wyslano desc);
alter table public.bruno_formularze enable row level security;
