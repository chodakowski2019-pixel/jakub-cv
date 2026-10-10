-- 10.10: Bruno Pro (B2C) przez Stripe. Kolumny na koncie + log płatności.
alter table bruno_konta add column if not exists stripe_customer_id text;
alter table bruno_konta add column if not exists stripe_subscription_id text;
alter table bruno_konta add column if not exists pro_do timestamptz;

create table if not exists bruno_platnosci (
  id bigserial primary key,
  email text not null,
  zdarzenie text not null,
  stripe_session_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  kwota integer,
  waluta text,
  okres text,
  status text,
  utworzono timestamptz not null default now()
);
create index if not exists bruno_platnosci_email on bruno_platnosci (email);
