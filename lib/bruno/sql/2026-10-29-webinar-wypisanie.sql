-- 29.10 (Aniserowicz 01-05 / 10-03): link wypisania w każdym mailu, 1 klik, wypisuje ze wszystkiego.
alter table public.bruno_webinar_zapisy add column if not exists wypisano timestamptz;  -- klik w „Wypisz się”; cron i M5 pomijają
