-- Zdarzenia (kliknięcia) dla lejka /youtube. Uruchom w tym samym projekcie Supabase.
create table if not exists public.transkrypcje_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,          -- page_view | generate_click | pay_click
  job_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists transkrypcje_events_type_idx on public.transkrypcje_events(type);
create index if not exists transkrypcje_events_created_at_idx on public.transkrypcje_events(created_at desc);
