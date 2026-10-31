-- Tacoma Community Hub navigation visibility controls.
create table if not exists public.hub_menu_items (
  id uuid primary key default gen_random_uuid(),
  href text not null unique check (href ~ '^[a-zA-Z0-9_./-]+$'),
  label text not null check (char_length(trim(label)) between 1 and 80),
  menu_group text not null default 'main' check (menu_group in ('main','get-involved','community','footer-discover','footer-participate','footer-community','footer-operations')),
  enabled boolean not null default true,
  display_order integer not null default 100,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.hub_menu_items enable row level security;
drop policy if exists "Public can read enabled Hub menu items" on public.hub_menu_items;
create policy "Public can read enabled Hub menu items" on public.hub_menu_items for select to anon,authenticated using (true);
drop policy if exists "Hub admins manage menu items" on public.hub_menu_items;
create policy "Hub admins manage menu items" on public.hub_menu_items for all to authenticated
using (exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'))
with check (exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin'));
grant select on public.hub_menu_items to anon,authenticated;
grant insert,update,delete on public.hub_menu_items to authenticated;
insert into public.hub_menu_items(href,label,menu_group,display_order) values
('directory.html','Explore','main',10),('businesses.html','Businesses','main',20),('resources.html','Resources','main',30),('events.html','Events','main',40),('thanksgiving/','Thanksgiving','main',50),('christmas/','Christmas Together','main',60),
('opportunities.html','Volunteer & Opportunities','get-involved',10),('lost-found.html','Lost & Found','community',10),('emergency-resources.html','Emergency Information','community',20),('community-alerts.html','Community Alerts','community',30),('chat.html','Live Chat','community',40),('submit.html','Share a Listing','main',90),('member.html','Member Area','main',100),
('businesses.html','Businesses','footer-discover',10),('resources.html','Resources','footer-discover',20),('events.html','Events','footer-discover',30),
('submit.html','Submit information','footer-participate',10),('opportunities.html','Volunteer','footer-participate',20),('chat.html','Community chat','footer-participate',30),('member.html','Member area','footer-participate',40),
('tacoma-nights','Tacoma Nights','footer-community',10),('back-deck-live','Back Deck Live','footer-community',20),('emergency-resources.html','Emergency information','footer-community',30),('moderation.html','Report or correct','footer-community',40),
('email-operations.html','Email operations','footer-operations',10),('moderation.html','Reports & corrections','footer-operations',20),('privacy.html','Privacy & guidelines','footer-operations',30)
on conflict(href) do nothing;
