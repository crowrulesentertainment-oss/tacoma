-- Tacoma OBS Bridge + producer command queue
create table if not exists public.tacoma_obs_bridge_devices (
  id uuid primary key default gen_random_uuid(),
  event_key text not null default 'nye_2026_2027',
  device_name text not null default 'OBS Production PC',
  token_hash text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  last_seen timestamptz,
  revoked_at timestamptz,
  obs_version text,
  websocket_version text,
  current_scene text,
  streaming boolean not null default false,
  recording boolean not null default false,
  active_fps numeric,
  cpu_usage numeric,
  memory_usage numeric,
  render_skipped_frames bigint,
  output_skipped_frames bigint,
  output_congestion numeric,
  last_error text,
  telemetry jsonb not null default '{}'::jsonb
);
create table if not exists public.tacoma_obs_commands (
  id uuid primary key default gen_random_uuid(),
  event_key text not null default 'nye_2026_2027',
  device_id uuid references public.tacoma_obs_bridge_devices(id),
  command_type text not null check (command_type in ('scene.switch','host.cue')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','claimed','succeeded','failed','expired')),
  requested_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 seconds'),
  claimed_at timestamptz,
  completed_at timestamptz,
  result jsonb not null default '{}'::jsonb
);
create index if not exists tacoma_obs_commands_queue_idx on public.tacoma_obs_commands(status,created_at) where status='pending';
create index if not exists tacoma_obs_commands_device_idx on public.tacoma_obs_commands(device_id,created_at desc);
alter table public.tacoma_obs_bridge_devices enable row level security;
alter table public.tacoma_obs_commands enable row level security;
revoke all on public.tacoma_obs_bridge_devices from anon,authenticated;
revoke all on public.tacoma_obs_commands from anon,authenticated;
grant all on public.tacoma_obs_bridge_devices to service_role;
grant all on public.tacoma_obs_commands to service_role;
create or replace function public.tacoma_claim_obs_command(p_device_id uuid)
returns setof public.tacoma_obs_commands language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 update public.tacoma_obs_commands set status='expired' where status='pending' and expires_at<=now();
 return query update public.tacoma_obs_commands c set status='claimed',device_id=p_device_id,claimed_at=now()
 where c.id=(select q.id from public.tacoma_obs_commands q where q.status='pending' and q.expires_at>now() and (q.device_id is null or q.device_id=p_device_id) order by q.created_at for update skip locked limit 1)
 returning c.*;
end; $$;
revoke all on function public.tacoma_claim_obs_command(uuid) from public,anon,authenticated;
grant execute on function public.tacoma_claim_obs_command(uuid) to service_role;
}
