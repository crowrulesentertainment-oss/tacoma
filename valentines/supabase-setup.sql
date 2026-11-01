-- Love Is Local / Tacoma Valentine's Day 2027
-- Apply to Supabase project cevylpnoexugwgygvtgu.
-- Browser uses the publishable key only. Never put service_role/secret keys in GitHub Pages.

create table if not exists public.valentines_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('business','event','love_message','story')),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  body text not null check (char_length(btrim(body)) between 10 and 5000),
  submitter_name text not null check (char_length(btrim(submitter_name)) between 2 and 100),
  organization text,
  category text,
  website_url text check (website_url is null or website_url ~* '^https?://'),
  address text,
  event_start timestamptz,
  event_end timestamptz,
  registration_url text check (registration_url is null or registration_url ~* '^https?://'),
  consent_to_publish boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valentines_event_dates_valid check (event_start is null or event_end is null or event_end >= event_start)
);
create index if not exists valentines_submissions_type_status_created_idx on public.valentines_submissions (submission_type,status,created_at desc);
create index if not exists valentines_submissions_created_idx on public.valentines_submissions (created_at desc);
create index if not exists valentines_submissions_reviewed_by_idx on public.valentines_submissions(reviewed_by);
alter table public.valentines_submissions enable row level security;

create table if not exists public.valentines_submission_contacts (
  submission_id uuid primary key references public.valentines_submissions(id) on delete cascade,
  submitter_email text not null check (char_length(btrim(submitter_email)) between 5 and 254 and position('@' in submitter_email)>1),
  created_at timestamptz not null default now()
);
alter table public.valentines_submission_contacts enable row level security;

create table if not exists public.valentines_featured_listings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  description text not null check (char_length(btrim(description)) between 10 and 1500),
  category text not null default 'local business',
  website_url text check (website_url is null or website_url ~* '^https?://'),
  address text,
  image_url text check (image_url is null or image_url ~* '^https?://'),
  display_label text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  source_submission_id uuid references public.valentines_submissions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists valentines_featured_published_order_idx on public.valentines_featured_listings (is_published,sort_order,created_at desc);
create index if not exists valentines_featured_source_submission_idx on public.valentines_featured_listings(source_submission_id);
alter table public.valentines_featured_listings enable row level security;

drop policy if exists "Valentines admins manage submissions" on public.valentines_submissions;
drop policy if exists "Valentines admins read all submissions" on public.valentines_submissions;
drop policy if exists "Anonymous can view approved valentines submissions" on public.valentines_submissions;
drop policy if exists "Members can view approved valentines submissions" on public.valentines_submissions;
drop policy if exists "Valentines admins update submissions" on public.valentines_submissions;
drop policy if exists "Valentines admins delete submissions" on public.valentines_submissions;
drop policy if exists "Public can submit pending valentines content" on public.valentines_submissions;
drop policy if exists "Read approved or admin valentines submissions" on public.valentines_submissions;
create policy "Valentines admins update submissions" on public.valentines_submissions for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "Valentines admins delete submissions" on public.valentines_submissions for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "Public can submit pending valentines content" on public.valentines_submissions for insert to anon,authenticated
with check (status='pending' and consent_to_publish=true and reviewed_at is null and reviewed_by is null and review_notes is null);
create policy "Read approved or admin valentines submissions" on public.valentines_submissions for select to anon,authenticated
using ((status='approved' and consent_to_publish=true) or (((select auth.jwt()) -> 'app_metadata' ->> 'role')='admin'));

drop policy if exists "Valentines admins manage private contacts" on public.valentines_submission_contacts;
drop policy if exists "Valentines admins read private contacts" on public.valentines_submission_contacts;
drop policy if exists "Valentines admins update private contacts" on public.valentines_submission_contacts;
drop policy if exists "Valentines admins delete private contacts" on public.valentines_submission_contacts;
drop policy if exists "Public can attach contact to submission" on public.valentines_submission_contacts;
create policy "Valentines admins read private contacts" on public.valentines_submission_contacts for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "Valentines admins update private contacts" on public.valentines_submission_contacts for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "Valentines admins delete private contacts" on public.valentines_submission_contacts for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "Public can attach contact to submission" on public.valentines_submission_contacts for insert to anon,authenticated
with check (true);

drop policy if exists "Public can view published valentines listings" on public.valentines_featured_listings;
drop policy if exists "Valentines admins manage featured listings" on public.valentines_featured_listings;
drop policy if exists "Anonymous can view published valentines listings" on public.valentines_featured_listings;
drop policy if exists "Members can view published valentines listings" on public.valentines_featured_listings;
drop policy if exists "Valentines admins read all featured listings" on public.valentines_featured_listings;
drop policy if exists "Read published or admin valentines listings" on public.valentines_featured_listings;
drop policy if exists "Valentines admins insert featured listings" on public.valentines_featured_listings;
drop policy if exists "Valentines admins update featured listings" on public.valentines_featured_listings;
drop policy if exists "Valentines admins delete featured listings" on public.valentines_featured_listings;
create policy "Read published or admin valentines listings" on public.valentines_featured_listings for select to anon,authenticated
using (is_published=true or (((select auth.jwt()) -> 'app_metadata' ->> 'role')='admin'));
create policy "Valentines admins insert featured listings" on public.valentines_featured_listings for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "Valentines admins update featured listings" on public.valentines_featured_listings for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "Valentines admins delete featured listings" on public.valentines_featured_listings for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create or replace view public.valentines_public_content with (security_invoker=true) as
select id,submission_type,title,body,submitter_name,organization,category,website_url,address,event_start,event_end,registration_url,created_at
from public.valentines_submissions where status='approved' and consent_to_publish=true;

-- Restrict anonymous table privileges; only the curated public feed and published directory are readable.
revoke all privileges on table public.valentines_submissions from public,anon;
revoke all privileges on table public.valentines_submission_contacts from public,anon;
revoke all privileges on table public.valentines_featured_listings from public,anon;
revoke all privileges on table public.valentines_public_content from public,anon,authenticated;
grant usage on schema public to anon,authenticated;
grant select,insert on table public.valentines_submissions to anon,authenticated;
grant select,insert,update,delete on table public.valentines_submissions to authenticated;
grant insert on table public.valentines_submission_contacts to anon;
grant select,insert,update,delete on table public.valentines_submission_contacts to authenticated;
grant select on table public.valentines_featured_listings to anon,authenticated;
grant insert,update,delete on table public.valentines_featured_listings to authenticated;
grant select on table public.valentines_public_content to anon,authenticated;

comment on table public.valentines_submission_contacts is 'Private contact email for Love Is Local submissions. Only administrators can read it; public can insert it.';
comment on view public.valentines_public_content is 'SECURITY INVOKER public projection. RLS restricts it to approved submissions; private contact data is stored separately.';

-- Annual season and live update extension (applied to the connected CrowRules project).
create table if not exists public.valentines_seasons (
 season_year integer primary key check (season_year between 2027 and 2100),
 display_name text not null,event_date date not null,theme text,
 status text not null default 'planning' check(status in ('planning','open','live','archived')),
 highlights text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.valentines_seasons enable row level security;
drop policy if exists "Read valentines seasons" on public.valentines_seasons;
create policy "Read valentines seasons" on public.valentines_seasons for select to anon,authenticated using(true);
drop policy if exists "Admins manage valentines seasons" on public.valentines_seasons;
create policy "Admins manage valentines seasons" on public.valentines_seasons for all to authenticated
using (((select auth.jwt())->'app_metadata'->>'role')='admin')
with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
grant select on public.valentines_seasons to anon,authenticated;
grant insert,update,delete on public.valentines_seasons to authenticated;
alter table public.valentines_submissions add column if not exists season_year integer;
alter table public.valentines_featured_listings add column if not exists season_year integer;
update public.valentines_submissions set season_year=2027 where season_year is null;
update public.valentines_featured_listings set season_year=2027 where season_year is null;
alter table public.valentines_submissions alter column season_year set default (
case when (now() at time zone 'America/Los_Angeles')::date <= make_date(extract(year from now() at time zone 'America/Los_Angeles')::integer,2,14)
then extract(year from now() at time zone 'America/Los_Angeles')::integer else extract(year from now() at time zone 'America/Los_Angeles')::integer+1 end);
alter table public.valentines_featured_listings alter column season_year set default (
case when (now() at time zone 'America/Los_Angeles')::date <= make_date(extract(year from now() at time zone 'America/Los_Angeles')::integer,2,14)
then extract(year from now() at time zone 'America/Los_Angeles')::integer else extract(year from now() at time zone 'America/Los_Angeles')::integer+1 end);
alter table public.valentines_submissions alter column season_year set not null;
alter table public.valentines_featured_listings alter column season_year set not null;
create index if not exists valentines_submissions_season_idx on public.valentines_submissions(season_year,status,submission_type);
create index if not exists valentines_listings_season_idx on public.valentines_featured_listings(season_year,is_published,sort_order);
insert into public.valentines_seasons(season_year,display_name,event_date,theme,status)
values (2027,'Love Is Local 2027','2027-02-14','Celebrating Tacoma. Connecting Neighbors. Sharing Love.','open'),
(2028,'Love Is Local 2028','2028-02-14','Another year of local love.','planning') on conflict(season_year) do nothing;
create or replace view public.valentines_public_content with (security_invoker=true) as
select id,submission_type,title,body,submitter_name,organization,category,website_url,address,event_start,event_end,registration_url,created_at,season_year
from public.valentines_submissions where status='approved' and consent_to_publish=true;
do $$
begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='valentines_submissions') then alter publication supabase_realtime add table public.valentines_submissions; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='valentines_featured_listings') then alter publication supabase_realtime add table public.valentines_featured_listings; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='valentines_seasons') then alter publication supabase_realtime add table public.valentines_seasons; end if;
end $$;
