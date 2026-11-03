-- 2026-11-03: 24 Hours of Tacoma community time capsule media intake
-- Applied to Supabase project cevylpnoexugwgygvtgu.
-- Incoming media remains private; anonymous visitors may only create new objects
-- below incoming/, while Hub administrators can read/manage objects.

alter table public.tacoma_nye_submissions
  add column if not exists memory_text text,
  add column if not exists wish_text text,
  add column if not exists resolution_text text,
  add column if not exists display_location text,
  add column if not exists media_files jsonb not null default '[]'::jsonb,
  add column if not exists consent_broadcast boolean not null default false,
  add column if not exists consent_archive boolean not null default false,
  add column if not exists consent_recording boolean not null default false,
  add column if not exists consent_public_wall boolean not null default false,
  add column if not exists preferred_broadcast_segment text;

alter table public.tacoma_nye_submissions
  drop constraint if exists tacoma_nye_submissions_submission_type_check;
alter table public.tacoma_nye_submissions
  add constraint tacoma_nye_submissions_submission_type_check
  check (submission_type = any (array[
    'community_message','video_greeting','creator_feature','business_feature',
    'organization_feature','time_capsule','guest_interest','volunteer_interest',
    'other','year_memory','new_year_wish','resolution','family_message',
    'photo_memory','audio_greeting'
  ]));

create index if not exists tacoma_nye_submissions_media_idx
  on public.tacoma_nye_submissions using gin (media_files);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'ny2027-community-media','ny2027-community-media',false,52428800,
  array[
    'video/mp4','video/webm','video/quicktime',
    'audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/wav','audio/x-m4a',
    'image/jpeg','image/png','image/webp','image/gif'
  ]
)
on conflict (id) do update set
  public=false,file_size_limit=52428800,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "NY2027 public incoming uploads" on storage.objects;
create policy "NY2027 public incoming uploads"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id='ny2027-community-media'
  and name like 'incoming/%'
  and (storage.foldername(name))[1]='incoming'
  and length(name)<=300
);

drop policy if exists "NY2027 administrators read media" on storage.objects;
create policy "NY2027 administrators read media"
on storage.objects for select to authenticated
using (bucket_id='ny2027-community-media' and public.crowrules_is_admin());

drop policy if exists "NY2027 administrators delete media" on storage.objects;
create policy "NY2027 administrators delete media"
on storage.objects for delete to authenticated
using (bucket_id='ny2027-community-media' and public.crowrules_is_admin());

drop policy if exists "NY2027 administrators update media" on storage.objects;
create policy "NY2027 administrators update media"
on storage.objects for update to authenticated
using (bucket_id='ny2027-community-media' and public.crowrules_is_admin())
with check (bucket_id='ny2027-community-media' and public.crowrules_is_admin());

drop policy if exists "NY2027 public approved archive read" on public.tacoma_nye_submissions;
create policy "NY2027 public approved archive read"
on public.tacoma_nye_submissions for select to anon
using (
  status in ('approved','scheduled','published','archived')
  and (consent_archive=true or consent_public_wall=true)
);

revoke select on public.tacoma_nye_submissions from anon;
grant select (id,submission_type,submitter_name,title,memory_text,wish_text,resolution_text,display_location,created_at)
on public.tacoma_nye_submissions to anon;
grant insert on public.tacoma_nye_submissions to anon,authenticated;
grant select,insert,update,delete on public.tacoma_nye_submissions to authenticated;
