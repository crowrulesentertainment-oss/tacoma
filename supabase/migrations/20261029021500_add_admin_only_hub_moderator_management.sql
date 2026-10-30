create or replace function public.hub_add_moderator(p_email text)
returns table(user_id uuid, moderator_email text, assigned_role text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_target_id uuid;
  v_target_email text;
begin
  if v_actor is null then
    raise exception 'Sign in with an authorized Hub administrator account.';
  end if;

  if not exists (
    select 1 from public.hub_admins h
    where h.user_id = v_actor and lower(h.role) = 'admin'
  ) then
    raise exception 'Only Hub administrators can add moderators.';
  end if;

  if p_email is null or length(trim(p_email)) < 5 or position('@' in p_email) < 2 then
    raise exception 'Enter a valid email address.';
  end if;

  select u.id, u.email
    into v_target_id, v_target_email
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
    and u.email_confirmed_at is not null
  limit 1;

  if v_target_id is null then
    raise exception 'No confirmed Hub account was found for that email. Ask the person to create an account and verify their email first.';
  end if;

  insert into public.hub_admins(user_id, role)
  values (v_target_id, 'moderator')
  on conflict (user_id) do nothing;

  return query
  select v_target_id, v_target_email,
         (select h.role from public.hub_admins h where h.user_id = v_target_id);
end;
$function$;

revoke all on function public.hub_add_moderator(text) from public, anon;
grant execute on function public.hub_add_moderator(text) to authenticated;
