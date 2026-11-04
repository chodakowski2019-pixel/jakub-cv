-- 2.11.2026: podpięcie Bruno do CRM klienta (pierwszy: Pipedrive).
-- Token API firmy (z ustawień Pipedrive klienta, Prywatne preferencje → API). Pusty = firma bez podpięcia.
alter table bruno_firmy add column if not exists pipedrive_token text;
-- Id typu aktywności „Trening Bruno” w Pipedrive klienta (tworzony raz przy pierwszym wysłaniu).
alter table bruno_firmy add column if not exists pipedrive_typ text;
