-- 12.11 (USER_001): zakładka „Niedokończone” w panelu administratora giełdy = konta handlowców bez wysłanego profilu
-- i etap, na którym przerwali formularz. Formularz zapisuje postęp przy otwarciu i przy każdym „Dalej”.
alter table praca_konta add column if not exists formularz_krok smallint;          -- krok, na którym jest (0 = pierwszy, KROKI.length - 1 = ostatni)
alter table praca_konta add column if not exists formularz_szkic jsonb;            -- odpowiedzi wpisane do tej pory
alter table praca_konta add column if not exists formularz_at timestamptz;         -- ostatni zapis postępu
