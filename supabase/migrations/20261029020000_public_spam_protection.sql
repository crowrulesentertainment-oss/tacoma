-- Server-side spam throttling and input normalization for public Hub writes.
-- Rate limits are keyed by a stable browser UUID. This is useful abuse friction,
-- not a substitute for CAPTCHA/IP-based controls in an Edge Function.
alter table public.hub_listings add column if not exists client_token uuid not null default gen_random_uuid();
alter table public.hub_chat_messages add column if not exists client_token uuid not null default gen_random_uuid();
alter table public.hub_reports add column if not exists client_token uuid not null default gen_random_uuid();

create table if not exists public.hub_public_rate_limits (
  client_token uuid not null,
  action text not null check (action in ('listing','chat','report')),
  last_at timestamptz not null default now(),
  primary key (client_token, action)
);
alter table public.hub_public_rate_limits enable row level security;
revoke all on public.hub_public_rate_limits from public, anon, authenticated;

create or replace function public.hub_guard_public_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token uuid;
  v_action text;
  v_interval interval;
  v_last timestamptz;
begin
  if tg_table_name = 'hub_listings' then
    v_action := 'listing';
    v_interval := interval '60 seconds';
    new.title := regexp_replace(btrim(coalesce(new.title,'')), '\s+', ' ', 'g');
    new.summary := btrim(coalesce(new.summary,''));
    new.category := coalesce(nullif(btrim(new.category),''),'General');
    new.neighborhood := nullif(btrim(coalesce(new.neighborhood,'')),'');
    new.address_or_area := nullif(btrim(coalesce(new.address_or_area,'')),'');
    new.cost := nullif(btrim(coalesce(new.cost,'')),'');
    new.website := nullif(btrim(coalesce(new.website,'')),'');
    new.contact := nullif(btrim(coalesce(new.contact,'')),'');
    new.submitter_name := nullif(btrim(coalesce(new.submitter_name,'')),'');
    new.submitter_email := nullif(lower(btrim(coalesce(new.submitter_email,''))),'');
    new.source_url := nullif(btrim(coalesce(new.source_url,'')),'');
    if new.website is not null and new.website !~* '^https?://[^[:space:]]+([.][^[:space:]]+|/[^[:space:]]*)?$' then
      raise exception 'Website must be a valid http or https URL.' using errcode = '22023';
    end if;
    if new.source_url is not null and new.source_url !~* '^https?://[^[:space:]]+([.][^[:space:]]+|/[^[:space:]]*)?$' then
      raise exception 'Source must be a valid http or https URL.' using errcode = '22023';
    end if;
    if new.start_at is not null and new.end_at is not null and new.end_at < new.start_at then
      raise exception 'End date must be after the start date.' using errcode = '22023';
    end if;
    -- Public submissions can never publish themselves or set trusted timestamps.
    new.status := 'pending';
    new.verified_at := null;
    new.created_at := now();
    new.updated_at := now();
    v_token := new.client_token;
  elsif tg_table_name = 'hub_chat_messages' then
    v_action := 'chat';
    v_interval := interval '15 seconds';
    new.nickname := regexp_replace(btrim(coalesce(new.nickname,'')), '\s+', ' ', 'g');
    new.body := btrim(coalesce(new.body,''));
    new.created_at := now();
    if char_length(new.nickname) < 2 or char_length(new.nickname) > 32 then
      raise exception 'Nickname must be 2–32 characters.' using errcode = '22023';
    end if;
    if char_length(new.body) < 1 or char_length(new.body) > 700 then
      raise exception 'Chat message must be 1–700 characters.' using errcode = '22023';
    end if;
    if new.body ~ '[[:cntrl:]]' then
      raise exception 'Message contains unsupported control characters.' using errcode = '22023';
    end if;
    if not exists (select 1 from public.hub_chat_channels c where c.slug = new.room and c.is_enabled = true) then
      raise exception 'This chat room is unavailable.' using errcode = '22023';
    end if;
    v_token := new.client_token;
  elsif tg_table_name = 'hub_reports' then
    v_action := 'report';
    v_interval := interval '30 seconds';
    new.reason := btrim(coalesce(new.reason,''));
    new.details := nullif(btrim(coalesce(new.details,'')),'');
    new.status := 'open';
    new.created_at := now();
    if char_length(new.reason) < 5 or char_length(new.reason) > 500 then
      raise exception 'Report reason must be 5–500 characters.' using errcode = '22023';
    end if;
    v_token := new.client_token;
  else
    raise exception 'Unsupported public write table.' using errcode = '22023';
  end if;

  if v_token is null then
    raise exception 'A submission token is required. Refresh the page and try again.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_action || ':' || v_token::text, 0));
  select last_at into v_last
    from public.hub_public_rate_limits
   where client_token = v_token and action = v_action
   for update;

  if v_last is not null and now() - v_last < v_interval then
    raise exception 'Please wait before submitting again.' using errcode = 'P0001';
  end if;

  insert into public.hub_public_rate_limits(client_token, action, last_at)
  values (v_token, v_action, now())
  on conflict (client_token, action) do update set last_at = excluded.last_at;

  return new;
end;
$$;

drop trigger if exists hub_guard_listing_public_write on public.hub_listings;
create trigger hub_guard_listing_public_write before insert on public.hub_listings
for each row execute function public.hub_guard_public_write();
drop trigger if exists hub_guard_chat_public_write on public.hub_chat_messages;
create trigger hub_guard_chat_public_write before insert on public.hub_chat_messages
for each row execute function public.hub_guard_public_write();
drop trigger if exists hub_guard_report_public_write on public.hub_reports;
create trigger hub_guard_report_public_write before insert on public.hub_reports
for each row execute function public.hub_guard_public_write();

revoke all on function public.hub_guard_public_write() from public, anon, authenticated;
