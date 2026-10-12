-- 12.10 (USER_001): profil = imię, rola (z polem „Inne”), liczba handlowców. Bez telefonu i produktu.
alter table bruno_konta add column if not exists rola_inna text;
-- 12.10 (USER_001): w „Dostosuj Bruno” wybór, czy klient to firma (b2b) czy osoba (b2c). Domyślnie b2c.
alter table bruno_konfig add column if not exists segment text not null default 'b2c';
