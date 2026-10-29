-- Tacoma Community Hub: live chat moderation and channel management
-- Applied to Supabase project cevylpnoexugwgygvtgu.
-- Safe to rerun: table/policies are idempotently created and seeded channels are preserved.
create table if not exists public.hub_chat_channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40),
  title text not null check (char_length(trim(title)) between 2 and 70),
  description text not null default '' check (char_length(description) <= 180),
  icon text not null default '◉' check (char_length(icon) <= 8),
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hub_chat_channels enable row level security;
grant select on public.hub_chat_channels to anon, authenticated;
grant insert, update, delete on public.hub_chat_channels to authenticated;
drop policy if exists "Public can view enabled chat channels" on public.hub_chat_channels;
create policy "Public can view enabled chat channels" on public.hub_chat_channels
  for select to anon, authenticated using (is_enabled = true);
drop policy if exists "Admins can manage chat channels" on public.hub_chat_channels;
create policy "Admins can manage chat channels" on public.hub_chat_channels
  for all to authenticated
  using (exists (select 1 from public.hub_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.hub_admins a where a.user_id = (select auth.uid())));
grant select, delete on public.hub_chat_messages to authenticated;
drop policy if exists "hub visitors can post chat" on public.hub_chat_messages;
create policy "hub visitors can post chat" on public.hub_chat_messages
  for insert to anon, authenticated
  with check (
    char_length(nickname) between 2 and 32
    and char_length(body) between 1 and 700
    and exists (
      select 1 from public.hub_chat_channels c
      where c.slug = hub_chat_messages.room and c.is_enabled = true
    )
  );
drop policy if exists "Admins can read all chat messages" on public.hub_chat_messages;
create policy "Admins can read all chat messages" on public.hub_chat_messages
  for select to authenticated
  using (exists (select 1 from public.hub_admins a where a.user_id = (select auth.uid())));
drop policy if exists "Admins can delete chat messages" on public.hub_chat_messages;
create policy "Admins can delete chat messages" on public.hub_chat_messages
  for delete to authenticated
  using (exists (select 1 from public.hub_admins a where a.user_id = (select auth.uid())));
insert into public.hub_chat_channels (slug,title,description,icon,sort_order,is_enabled)
values
('general','Tacoma General','The main room for Tacoma-area conversation','◉',1,true),
('neighborhoods','Neighborhood Connections','Meet neighbors and talk about your part of town','⌖',2,true),
('events','Events & Meetups','Share public events, markets, classes and gatherings','◷',3,true),
('business','Local Business Talk','Discover independent businesses and local services','▦',4,true),
('resources','Help & Resources','Ask about community services and practical support','♡',5,true),
('arts-sports','Arts, Sports & Entertainment','A broad room for local culture and recreation','✦',6,true),
('arts-culture','Arts & Culture','Music, visual art, theater, books and local creativity','♫',7,true),
('sports-outdoors','Sports & Outdoors','Teams, trails, parks, recreation and local sports','⚽',8,true),
('family','Youth & Family','Family activities and youth programs; protect minors’ privacy','⌂',9,true),
('jobs-volunteer','Jobs & Volunteering','Work opportunities, volunteering and sharing skills','✳',10,true),
('lost-found','Lost & Found','Public notices for lost items or found belongings','⌕',11,true),
('community-groups','Community Groups','Clubs, civic groups, meetups and shared interests','◎',12,true),
('local-questions','Ask Tacoma','Questions about getting around, places and local life','?',13,true),
('creators-tech','Creators & Tech','Digital projects, makers, media and creative technology','⌘',14,true),
('tacoma-nights','Tacoma Nights','Talk about community stories and local conversation','☾',15,true)
on conflict (slug) do nothing;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.hub_chat_channels;
  end if;
exception when duplicate_object then null;
end $$;
