-- 14.11 (USER_001): karta klienta = notatka, plik (PDF), głosówka. Plik zostaje w kubełku bruno-nagrania (crm/…),
-- w historii wpis typu „plik” z odczytaną treścią (PDF przez Claude, audio przez Whisper).
alter table bruno_crm_zdarzenia drop constraint if exists bruno_crm_zdarzenia_typ_check;
alter table bruno_crm_zdarzenia add constraint bruno_crm_zdarzenia_typ_check check (typ in ('notatka', 'zadanie', 'etap', 'status', 'wartosc', 'plik'));
alter table bruno_crm_zdarzenia add column if not exists plik_sciezka text;
alter table bruno_crm_zdarzenia add column if not exists plik_rodzaj text;
alter table bruno_crm_zdarzenia add column if not exists plik_nazwa text;
