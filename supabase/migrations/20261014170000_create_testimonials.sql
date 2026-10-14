-- Admin-managed customer testimonials.
-- Public visitors can only read published testimonials; admins can manage all rows.
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  education text not null default '' check (char_length(education) <= 120),
  quote text not null check (char_length(btrim(quote)) between 10 and 600),
  rating smallint not null default 5 check (rating between 1 and 5),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists testimonials_public_order_idx
  on public.testimonials (sort_order asc, created_at desc)
  where is_published = true;

alter table public.testimonials enable row level security;

drop policy if exists "Public can read published testimonials" on public.testimonials;
create policy "Public can read published testimonials"
  on public.testimonials for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Admins can read all testimonials" on public.testimonials;
create policy "Admins can read all testimonials"
  on public.testimonials for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can insert testimonials" on public.testimonials;
create policy "Admins can insert testimonials"
  on public.testimonials for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can update testimonials" on public.testimonials;
create policy "Admins can update testimonials"
  on public.testimonials for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can delete testimonials" on public.testimonials;
create policy "Admins can delete testimonials"
  on public.testimonials for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

grant select on public.testimonials to anon, authenticated;
grant insert, update, delete on public.testimonials to authenticated;

create or replace function public.set_testimonials_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_testimonials_updated_at();
