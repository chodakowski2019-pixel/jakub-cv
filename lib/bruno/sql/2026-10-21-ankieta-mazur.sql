-- 21.10 (USER_001): ankieta psychologiczna handlowca wg Rafała Mazura. Przed pierwszym treningiem
-- i co 30 dni. Jeden wiersz = jedno wypełnienie (historia zostaje, żeby porównać miesiąc do miesiąca).
create table if not exists public.bruno_ankiety (
  id bigint generated always as identity primary key,
  utworzono timestamptz not null default now(),
  email text not null,
  jezyk text not null default 'pl',
  odpowiedzi jsonb not null,   -- { "s1": 4, "s6": "tekst", "p4": "cel", ... }
  wynik int not null,          -- 0-100, średnia z pytań na skali (odwrócone przeliczone)
  obszary jsonb not null       -- { "sprzedaz": 70, "pieniadze": 55, "glowa": 80 }
);
create index if not exists bruno_ankiety_email on public.bruno_ankiety (email, utworzono desc);
alter table public.bruno_ankiety enable row level security;
