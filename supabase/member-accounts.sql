-- Tacoma Community Hub optional member accounts.
-- Applied to project cevylpnoexugwgygvtgu.
-- Re-running is safe: tables and policies are created/replaced idempotently.

create table if not exists public.hub_member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  bio text not null default '' check (char_length(bio) <= 240),
  interests text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hub_member_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.hub_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);
alter table public.hub_member_profiles enable row level security;
alter table public.hub_member_favorites enable row level security;
revoke all on public.hub_member_profiles from anon;
revoke all on public.hub_member_favorites from anon;
grant select, insert, update on public.hub_member_profiles to authenticated;
grant select, insert, delete on public.hub_member_favorites to authenticated;
drop policy if exists "Members read own profile" on public.hub_member_profiles;
create policy "Members read own profile" on public.hub_member_profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Members create own profile" on public.hub_member_profiles;
create policy "Members create own profile" on public.hub_member_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Members update own profile" on public.hub_member_profiles;
create policy "Members update own profile" on public.hub_member_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Members read own favorites" on public.hub_member_favorites;
create policy "Members read own favorites" on public.hub_member_favorites for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Members add own favorites" on public.hub_member_favorites;
create policy "Members add own favorites" on public.hub_member_favorites for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Members remove own favorites" on public.hub_member_favorites;
create policy "Members remove own favorites" on public.hub_member_favorites for delete to authenticated using ((select auth.uid()) = user_id);
