-- 25.10 (USER_001: „Zespół Bruno Demo → Zespół Jakuba”): własny nagłówek panelu szefa (dopełniacz). Puste = nazwa firmy.
alter table public.bruno_firmy add column if not exists naglowek text;
update public.bruno_firmy set naglowek = 'Jakuba' where id = 'bruno-demo';
update public.bruno_konta set imie = 'Jakub' where email = 'szef.bruno-demo@demo.salesbruno.pl';
