-- 21.10 (USER_001): rejestracja w 2 krokach. Krok 1 = e-mail + hasło (każdy e-mail przechodzi, także gmail),
-- krok 2 = imię, telefon, firma, handlowcy, produkt, potem komunikat „dostęp do 24 h”.
-- Hasło trzymamy od razu jako skrót scrypt (jak bruno_konta.kod_hash); „Daj dostęp” w Adminie przepisuje je do konta.
-- Status 'krok1' = tylko e-mail + hasło, bez danych firmy (nie pokazuj przycisku „Daj dostęp”).
alter table public.bruno_prosby
  add column if not exists haslo_hash text,
  alter column imie set default '',
  alter column firma set default '',
  alter column handlowcy set default '',
  alter column produkt set default '';
