-- 18.10 (USER_001): płatność Stripe za ogłoszenie (subskrypcja miesięczna 50 zł promocja / 200 zł).
alter table praca_oferty_firm add column if not exists stripe_sub text;
alter table praca_oferty_firm add column if not exists stripe_customer text;
alter table praca_oferty_firm add column if not exists cena_zl int;
alter table praca_oferty_firm add column if not exists oplacone_od timestamptz;
