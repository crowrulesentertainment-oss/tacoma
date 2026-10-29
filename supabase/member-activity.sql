-- Tacoma Community Hub: private member activity center
create table if not exists public.hub_member_activity (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 activity_type text not null check (activity_type in ('event_reminder','interest_match','saved_listing_update')),
 listing_id uuid references public.hub_listings(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 180),
 message text not null default '' check (char_length(message) <= 500),
 created_at timestamptz not null default now(),
 read_at timestamptz,
 dismissed_at timestamptz,
 dedupe_key text not null,
 unique(user_id, dedupe_key)
);
alter table public.hub_member_activity enable row level security;
revoke all on public.hub_member_activity from anon;
grant select, insert, update on public.hub_member_activity to authenticated;
drop policy if exists "Members read own activity" on public.hub_member_activity;
create policy "Members read own activity" on public.hub_member_activity for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Members add own activity" on public.hub_member_activity;
create policy "Members add own activity" on public.hub_member_activity for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Members update own activity" on public.hub_member_activity;
create policy "Members update own activity" on public.hub_member_activity for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);