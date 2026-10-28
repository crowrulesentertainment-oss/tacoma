-- CrowRules Tacoma Community Hub — edit suggestions and public correction history.
-- Apply through the Supabase migration workflow. Never put service-role keys in browser code.

create table if not exists public.community_hub_edit_suggestions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.community_hub_content(id) on delete set null,
  listing_title text not null check (char_length(trim(listing_title)) between 3 and 160),
  suggested_title text not null default '' check (char_length(suggested_title) <= 160),
  suggested_description text not null default '' check (char_length(suggested_description) <= 2000),
  suggested_organization text not null default '' check (char_length(suggested_organization) <= 160),
  suggested_website_url text not null default '' check (char_length(suggested_website_url) <= 500),
  suggested_location text not null default '' check (char_length(suggested_location) <= 240),
  details text not null default '' check (char_length(details) <= 1200),
  status text not null default 'new' check (status in ('new','reviewing','accepted','declined')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_hub_edit_suggestions_has_change check (
    char_length(trim(suggested_title || suggested_description || suggested_organization || suggested_website_url || suggested_location || details)) > 0
  )
);
create index if not exists community_hub_edit_suggestions_status_created_idx on public.community_hub_edit_suggestions(status, created_at desc);
create index if not exists community_hub_edit_suggestions_content_id_idx on public.community_hub_edit_suggestions(content_id);
alter table public.community_hub_edit_suggestions enable row level security;
revoke all privileges on table public.community_hub_edit_suggestions from public;
revoke all privileges on table public.community_hub_edit_suggestions from anon;
grant insert on public.community_hub_edit_suggestions to anon;
grant insert, select, update on public.community_hub_edit_suggestions to authenticated;
drop policy if exists "Public can submit listing edit suggestions" on public.community_hub_edit_suggestions;
create policy "Public can submit listing edit suggestions" on public.community_hub_edit_suggestions for insert to anon, authenticated
with check (
  char_length(trim(listing_title)) between 3 and 160
  and char_length(suggested_title) <= 160 and char_length(suggested_description) <= 2000
  and char_length(suggested_organization) <= 160 and char_length(suggested_website_url) <= 500
  and char_length(suggested_location) <= 240 and char_length(details) <= 1200
  and status = 'new' and reviewed_at is null and reviewed_by is null
);
drop policy if exists "Hub admins can read edit suggestions" on public.community_hub_edit_suggestions;
create policy "Hub admins can read edit suggestions" on public.community_hub_edit_suggestions for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Hub admins can update edit suggestions" on public.community_hub_edit_suggestions;
create policy "Hub admins can update edit suggestions" on public.community_hub_edit_suggestions for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.community_hub_listing_history (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.community_hub_content(id) on delete set null,
  listing_title text not null check (char_length(trim(listing_title)) between 3 and 160),
  change_summary text not null check (char_length(trim(change_summary)) between 5 and 500),
  changed_at timestamptz not null default now(),
  is_public boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists community_hub_listing_history_public_idx on public.community_hub_listing_history(content_id, changed_at desc) where is_public = true;
alter table public.community_hub_listing_history enable row level security;
revoke all privileges on table public.community_hub_listing_history from public;
revoke all privileges on table public.community_hub_listing_history from anon;
grant select on public.community_hub_listing_history to anon;
grant select, insert, update on public.community_hub_listing_history to authenticated;
drop policy if exists "Public can read published correction history" on public.community_hub_listing_history;
create policy "Public can read published correction history" on public.community_hub_listing_history for select to anon, authenticated using (is_public = true);
drop policy if exists "Hub admins can manage correction history" on public.community_hub_listing_history;
create policy "Hub admins can manage correction history" on public.community_hub_listing_history for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.set_community_hub_edit_suggestions_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists community_hub_edit_suggestions_updated_at on public.community_hub_edit_suggestions;
create trigger community_hub_edit_suggestions_updated_at before update on public.community_hub_edit_suggestions
for each row execute function public.set_community_hub_edit_suggestions_updated_at();
