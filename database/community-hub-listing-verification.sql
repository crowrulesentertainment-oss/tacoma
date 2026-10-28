-- CrowRules Tacoma Community Hub — listing reports and verification metadata.
-- Reference/setup script for the existing Supabase project.
-- Uses the publishable browser key only; no service-role secret belongs in site code.

alter table public.community_hub_content
  add column if not exists verification_status text not null default 'not_checked'
    check (verification_status in ('not_checked','checked','verified_by_source','needs_attention')),
  add column if not exists last_reviewed_at timestamptz;

create index if not exists community_hub_content_verification_status_idx
  on public.community_hub_content (verification_status, last_reviewed_at);

create table if not exists public.community_hub_listing_reports (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.community_hub_content(id) on delete set null,
  listing_title text not null check (char_length(trim(listing_title)) between 3 and 160),
  report_reason text not null check (report_reason in ('outdated_information','incorrect_contact','closed_or_unavailable','duplicate_listing','broken_link','other')),
  details text not null default '' check (char_length(details) <= 1200),
  status text not null default 'new' check (status in ('new','reviewing','resolved','dismissed')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_hub_listing_reports_status_created_idx
  on public.community_hub_listing_reports (status, created_at desc);
create index if not exists community_hub_listing_reports_content_id_idx
  on public.community_hub_listing_reports (content_id);

alter table public.community_hub_listing_reports enable row level security;
grant insert on public.community_hub_listing_reports to anon, authenticated;
grant select, update on public.community_hub_listing_reports to authenticated;

drop policy if exists "Public can submit bounded listing reports" on public.community_hub_listing_reports;
create policy "Public can submit bounded listing reports"
  on public.community_hub_listing_reports for insert to anon, authenticated
  with check (
    char_length(trim(listing_title)) between 3 and 160
    and report_reason in ('outdated_information','incorrect_contact','closed_or_unavailable','duplicate_listing','broken_link','other')
    and char_length(details) <= 1200 and status = 'new'
    and reviewed_at is null and reviewed_by is null
  );

drop policy if exists "Hub admins can review listing reports" on public.community_hub_listing_reports;
create policy "Hub admins can review listing reports"
  on public.community_hub_listing_reports for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Hub admins can update listing reports" on public.community_hub_listing_reports;
create policy "Hub admins can update listing reports"
  on public.community_hub_listing_reports for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.set_community_hub_listing_reports_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_hub_listing_reports_set_updated_at on public.community_hub_listing_reports;
create trigger community_hub_listing_reports_set_updated_at
before update on public.community_hub_listing_reports
for each row execute function public.set_community_hub_listing_reports_updated_at();

comment on table public.community_hub_listing_reports is
  'Public reports about outdated or incorrect published community listings. Reports are not publicly readable; Hub admins review them.';
comment on column public.community_hub_content.verification_status is
  'Editorial status describing how the listing information was checked; it is not a guarantee or endorsement.';
comment on column public.community_hub_content.last_reviewed_at is
  'Date a moderator last reviewed the listing information.';
