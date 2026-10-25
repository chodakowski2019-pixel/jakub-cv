-- 25.10 (USER_001): zdjęcie handlowca w panelu szefa; w demo Bruno twarz szefa (Jakub) zamiast logo.
alter table public.bruno_konta add column if not exists zdjecie_url text;
update public.bruno_firmy set logo_url = '/bruno/demo/jakub.jpg' where id = 'bruno-demo';
