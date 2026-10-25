-- 25.10 (USER_001): jedno konto do spotkań sprzedażowych. Po zalogowaniu ekran „Przygotuj spotkanie”
-- (imię rozmówcy + strona firmy), potem panel dopasowany do tej firmy.
alter table public.bruno_konta add column if not exists spotkania boolean not null default false;
update public.bruno_konta
  set spotkania = true, demo = true, rola = 'owner', plan = 'pelny', aktywne = true, dni = 365,
      rozmow_dziennie = 5, profil_at = coalesce(profil_at, now()), tour_obejrzany_at = coalesce(tour_obejrzany_at, now()),
      nieudane = 0, blokada_do = null, jezyk = 'pl'
  where email = 'chodakowski2019@gmail.com';
