-- Member-controlled optional email notifications.
create table if not exists public.hub_member_email_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email_enabled boolean not null default false,
 event_reminders boolean not null default true,
 interest_matches boolean not null default true,
 saved_listing_updates boolean not null default true,
 unsubscribe_token uuid not null default gen_random_uuid() unique,
 consent_at timestamptz,
 unsubscribed_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.hub_member_email_preferences enable row level security;
revoke all on public.hub_member_email_preferences from anon;
grant select, insert, update on public.hub_member_email_preferences to authenticated;
drop policy if exists "Members read own email preferences" on public.hub_member_email_preferences;
create policy "Members read own email preferences" on public.hub_member_email_preferences for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Members insert own email preferences" on public.hub_member_email_preferences;
create policy "Members insert own email preferences" on public.hub_member_email_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Members update own email preferences" on public.hub_member_email_preferences;
create policy "Members update own email preferences" on public.hub_member_email_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter table public.hub_member_activity add column if not exists email_sent_at timestamptz;
alter table public.hub_member_activity add column if not exists email_error text;
create index if not exists hub_member_activity_pending_email_idx on public.hub_member_activity(created_at) where email_sent_at is null and dismissed_at is null;