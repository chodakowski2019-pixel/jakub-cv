-- 29.10 (USER_001, wzór Aniserowicz / Mailketing 02.05-02.07): double opt-in na webinar.
-- Zapis → mail „Potwierdzam zapis »” (token) → klik = zgoda + własność skrzynki → dopiero wtedy mail z linkiem Zoom.
-- Przypomnienia (M1-M4) i mail po (M5) tylko do potwierdzonych.
alter table public.bruno_webinar_zapisy
  add column if not exists token text,                    -- losowy token w linku potwierdzającym
  add column if not exists mail_potwierdz timestamptz,    -- M0: mail „potwierdź zapis” wysłany
  add column if not exists potwierdzono timestamptz;      -- klik w link (zgoda); null = niepotwierdzony
create unique index if not exists bruno_webinar_zapisy_token_idx on public.bruno_webinar_zapisy (token) where token is not null;
