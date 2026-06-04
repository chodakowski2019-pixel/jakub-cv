-- Tabela jobów dla narzędzia /transkrypcje. Uruchom w projekcie Supabase tej strony.
create table if not exists public.transkrypcje_jobs (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  status text not null default 'pending', -- pending | processing | done | error
  email text,
  title text,
  amount integer,                          -- zapłacona kwota w groszach (497 lub 1500)
  stripe_session_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transkrypcje_jobs_created_at_idx on public.transkrypcje_jobs(created_at desc);
create index if not exists transkrypcje_jobs_session_idx on public.transkrypcje_jobs(stripe_session_id);

create or replace function public.set_transkrypcje_jobs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists transkrypcje_jobs_set_updated_at on public.transkrypcje_jobs;
create trigger transkrypcje_jobs_set_updated_at
  before update on public.transkrypcje_jobs
  for each row execute function public.set_transkrypcje_jobs_updated_at();
