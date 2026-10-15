-- Add a durable, database-enforced request throttle for anonymous PDF lookups.
-- This table is service-role-only; clients cannot read or mutate counters directly.
create table if not exists public.pdf_lookup_attempts (
  id bigint generated always as identity primary key,
  client_key_hash text not null,
  attempted_at timestamptz not null default now()
);

alter table public.pdf_lookup_attempts enable row level security;
revoke all on public.pdf_lookup_attempts from anon, authenticated, public;
grant all on public.pdf_lookup_attempts to service_role;

create index if not exists pdf_lookup_attempts_key_time_idx
  on public.pdf_lookup_attempts (client_key_hash, attempted_at desc);

-- This migration deliberately leaves lookup_order_pdfs permissions unchanged:
-- the existing public client does not pass trusted IP information to Postgres,
-- so only a server endpoint or edge function can apply a reliable per-IP throttle.
-- Remove expired throttle rows via a scheduled database cleanup when enabling the
-- server-side limiter; do not try to trust a caller-supplied IP header in SQL.
