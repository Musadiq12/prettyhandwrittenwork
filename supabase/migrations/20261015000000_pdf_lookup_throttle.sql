-- Rate-limit public customer PDF lookups using a private table and service-role-only RPC.
-- The app's server function uses trusted proxy headers when available and HMACed
-- lookup keys; raw IPs, phone numbers, and order codes are not persisted.
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

-- Direct PostgREST calls must not bypass application-level throttling.
-- The server-only client uses service_role to call this function.
revoke all on function public.lookup_order_pdfs(text, text) from public, anon, authenticated;
grant execute on function public.lookup_order_pdfs(text, text) to service_role;

notify pgrst, 'reload schema';
