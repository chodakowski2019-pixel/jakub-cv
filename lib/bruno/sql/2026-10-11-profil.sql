-- 11.10 (USER_001): rejestracja = e-mail + hasło, profil (imię, telefon, rola, handlowcy, produkt) uzupełniany po założeniu konta.
alter table bruno_konta add column if not exists rola text;
alter table bruno_konta add column if not exists telefon text;
alter table bruno_konta add column if not exists handlowcy integer;
alter table bruno_konta add column if not exists profil_at timestamptz;
-- Istniejące konta mają już dane (z formularza albo od USER_001): nie blokujemy ich ekranem profilu.
update bruno_konta set profil_at = coalesce(profil_at, utworzono, now()) where profil_at is null;
-- 11.10: odstęp między prośbami o nowe hasło (osobno od blokady logowania).
alter table bruno_konta add column if not exists haslo_reset_at timestamptz;
