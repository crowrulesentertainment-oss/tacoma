-- Restrict member-only announcements to active Hub members.
drop policy if exists "Public can read current published announcements" on public.hub_announcements;
create policy "Public can read current published announcements"
on public.hub_announcements for select to anon, authenticated
using (
 status='published'
 and (starts_at is null or starts_at<=now())
 and (ends_at is null or ends_at>now())
 and (
   audience='everyone'
   or exists(select 1 from public.members m where m.user_id=(select auth.uid()) and m.status='Active')
 )
);

-- A suspended member account cannot post authenticated live-chat messages.
create policy "Active Hub members only can post authenticated chat"
on public.hub_chat_messages as restrictive
for insert to authenticated
with check (
 exists(select 1 from public.members m
        where m.user_id=(select auth.uid()) and m.status='Active')
);
