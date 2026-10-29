-- Permit only authorized Hub moderators to remove reported chat messages.
-- Public/anonymous users retain no DELETE policy.
drop policy if exists "Admins can delete chat messages" on public.hub_chat_messages;
drop policy if exists "hub moderators can delete chat messages" on public.hub_chat_messages;
create policy "hub moderators can delete chat messages"
on public.hub_chat_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.hub_admins a
    where a.user_id = (select auth.uid())
  )
);
