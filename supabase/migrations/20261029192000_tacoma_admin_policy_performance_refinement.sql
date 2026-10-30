-- Consolidate Hub administrator access into the existing members admin policies.
drop policy if exists "Hub admins can view all member records" on public.members;
drop policy if exists "Hub admins can update member records" on public.members;

drop policy if exists members_admin_select on public.members;
create policy members_admin_select on public.members for select to authenticated
using (
 coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = any(array['owner','super_admin','admin'])
 or exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin')
);

drop policy if exists members_admin_update on public.members;
create policy members_admin_update on public.members for update to authenticated
using (
 coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = any(array['owner','super_admin','admin'])
 or exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin')
)
with check (
 coalesce(((select auth.jwt())->'app_metadata'->>'role'),'') = any(array['owner','super_admin','admin'])
 or exists(select 1 from public.hub_admins a where a.user_id=(select auth.uid()) and lower(a.role)='admin')
);

create index if not exists hub_admin_activity_actor_idx on public.hub_admin_activity(actor_id);
create index if not exists hub_announcements_created_by_idx on public.hub_announcements(created_by);
create index if not exists hub_announcements_updated_by_idx on public.hub_announcements(updated_by);
create index if not exists members_suspended_by_idx on public.members(suspended_by);
