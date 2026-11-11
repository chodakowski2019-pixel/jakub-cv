-- 11.11 (USER_001): po odhaczeniu „Zweryfikowany” handlowiec dostaje mail „Twój profil został zweryfikowany”.
-- Kolumna pilnuje, żeby mail poszedł raz, także gdy administrator odznaczy i zaznaczy ponownie.
alter table praca_profile_handlowcow add column if not exists mail_weryfikacji_at timestamptz;
