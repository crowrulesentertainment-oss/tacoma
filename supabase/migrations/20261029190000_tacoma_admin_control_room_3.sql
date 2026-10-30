-- Tacoma Community Hub Admin Control Room 3.0
-- Adds administrator-only member oversight, announcements and activity records.
alter table public.members
  add column if not exists suspension_reason text,
  add column if not exists suspended_until timestamptz,
  add column if not exists suspended_by uuid references auth.users(id);

create table if not exists public.hub_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 140),
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  category text not null default 'community' check (category in ('community','events','safety','service','maintenance')),
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  audience text not null default 'everyone' check (audience in ('everyone','members')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hub_announcements_date_order check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index if not exists hub_announcements_public_idx on public.hub_announcements(status, starts_at desc, created_at desc);

create table if not exists public.hub_admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists hub_admin_activity_created_idx on public.hub_admin_activity(created_at desc);

alter table public.hub_announcements enable row level security;
alter table public.hub_admin_activity enable row level security;
grant select on public.hub_announcements to anon, authenticated;
grant insert, update, delete on public.hub_announcements to authenticated;
grant select, insert on public.hub_admin_activity to authenticated;

create policy "Public can read current published announcements"
on public.hub_announcements for select to anon, authenticated
using (status='published' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now())
and (audience='everyone' or (select auth.uid()) is not null));

create policy "Hub admins manage announcements"
on public.hub_announcements for all to authenticated
using (exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'))
with check (exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'));

create policy "Hub admins read admin activity"
on public.hub_admin_activity for select to authenticated
using (exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'));

create policy "Hub admins insert admin activity"
on public.hub_admin_activity for insert to authenticated
with check (actor_id=(select auth.uid()) and exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'));

create policy "Hub admins can view all member records"
on public.members for select to authenticated
using (exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'));

create policy "Hub admins can update member records"
on public.members for update to authenticated
using (exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'))
with check (exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'));
