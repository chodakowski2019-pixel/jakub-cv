-- 13.11 (USER_001): rezygnacja z subskrypcji wyszukiwarki w panelu firmy. anulowano_at = firma zrezygnowała,
-- subskrypcja działa do końca opłaconego miesiąca (status zmienia webhook Stripe).
alter table praca_zlecenia add column if not exists anulowano_at timestamptz;
