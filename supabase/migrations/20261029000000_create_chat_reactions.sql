-- Tacoma Community Hub: chat reactions required by assets/js/app.js
-- Apply in Supabase SQL Editor if this migration has not already been applied.
create table if not exists public.hub_chat_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.hub_chat_messages(id) on delete cascade,
  room text not null check (room in (
    'general','neighborhoods','events','business','resources','arts-sports',
    'arts-culture','sports-outdoors','family','jobs-volunteer','lost-found',
    'community-groups','local-questions','creators-tech','tacoma-nights'
  )),
  visitor_id uuid not null,
  reaction text not null check (reaction in ('👍','❤️','😂','👏','🎉','👀')),
  created_at timestamptz not null default now(),
  unique (message_id, visitor_id, reaction)
);
create index if not exists hub_chat_reactions_room_idx
  on public.hub_chat_reactions(room, created_at desc);
create index if not exists hub_chat_reactions_message_idx
  on public.hub_chat_reactions(message_id);
alter table public.hub_chat_reactions enable row level security;
grant select, insert on public.hub_chat_reactions to anon, authenticated;
drop policy if exists "Public can read chat reactions" on public.hub_chat_reactions;
create policy "Public can read chat reactions" on public.hub_chat_reactions
  for select to anon, authenticated using (true);
drop policy if exists "Visitors can add one reaction per type" on public.hub_chat_reactions;
create policy "Visitors can add one reaction per type" on public.hub_chat_reactions
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.hub_chat_messages m
      where m.id = hub_chat_reactions.message_id
        and m.room = hub_chat_reactions.room
    )
  );
