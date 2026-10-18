-- 18.10 (USER_001): najpierw płatność (Stripe Payment Link), potem dodanie ogłoszenia. Kredyt = 1 ogłoszenie na 30 dni.
alter table praca_konta add column if not exists kredyty int not null default 0;
alter table praca_konta add column if not exists promo_uzyta boolean not null default false;
