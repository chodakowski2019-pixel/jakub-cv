-- 12.10 (W3, /brunowiedza): fiszki wiedzy o obiekcjach mają segment B2B / B2C (karty w SalesAI/wiedza/techniki/).
-- Kolumna NIE jest jeszcze używana przez kod (zapewnijKarty wstawia bez niej): po wykonaniu tego SQL
-- dopisać `segment: w.segment` do insertu w lib/bruno/fsrs.ts zapewnijKarty i filtr po segmencie konta w Treningu.
-- NIE WYKONANE w bazie (czeka na decyzję USER_001).
alter table bruno_karty add column if not exists segment text;
create index if not exists bruno_karty_segment_idx on bruno_karty (email, segment);
