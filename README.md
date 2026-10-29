# Tacoma Community Hub

Responsive multi-page community directory for Tacoma and Pierce County. Hosted on GitHub Pages; shared listings, review, anonymous chat, reports and live visitor presence use Supabase.

## Supabase
Project ref: `cevylpnoexugwgygvtgu` (existing CrowRules project). The publishable key is configured in `assets/js/config.js`; it is intended for public browser use. Never put a service-role/secret key in frontend files. The schema uses isolated `hub_` tables and was applied through Supabase migrations.

## Create the first moderator
1. Create/invite the moderator under Supabase Dashboard → Authentication → Users.
2. Copy the user's UUID.
3. Run in SQL Editor: `insert into public.hub_admins(user_id,role) values ('REPLACE-WITH-AUTH-USER-UUID','admin') on conflict(user_id) do update set role=excluded.role;`
4. Sign in at `/admin.html`. Only explicitly assigned user IDs can moderate. Do not enable public self-service admin assignment.

## GitHub Pages
Repository: https://github.com/crowrulesentertainment-oss/tacoma. Settings → Pages → Deploy from a branch → `main` → `/(root)`. Expected URL: https://crowrulesentertainment-oss.github.io/tacoma/.

## Features
- Responsive shared navigation and cinematic Commencement Bay photo, Pacific clock, Open-Meteo weather with fallback, approximate live active visitor counter.
- Free business, resource, event, volunteer, job, arts/culture, youth/family, sports, neighborhood, group, lost/found and alert submissions.
- Submissions remain private until approved. Anonymous nickname chat has six rooms and Supabase Realtime.
- Report/correction form, privacy and community guidelines, emergency resource links, moderator control room.
- Links to Tacoma Nights and Back Deck Live.

## Safety notes
Basic listings are free. Hub is an independent project, not an official City of Tacoma service. Confirm details with providers. Community alerts are not official emergency alerts; call 911 for immediate danger. Anonymous chat can attract spam; add server-side rate limiting/CAPTCHA and staffed moderation before broad promotion. Visitor count is approximate active browser sessions. If REST requests fail, check Supabase Data API table exposure, grants, and RLS policies.

## Image attribution
Hero: Joe Mabel, “Commencement Bay, Tacoma, WA - 2017-04-09 - 11.jpg”, Wikimedia Commons, CC BY-SA 4.0. Source/license link appears in footer.


## Chat reactions migration (added 2026-10-29)

The chat UI uses `public.hub_chat_reactions` for emoji reactions. GitHub Pages does not execute database migrations automatically. If chat reactions currently show a database error, open Supabase Dashboard → SQL Editor for project `cevylpnoexugwgygvtgu`, then run the contents of `supabase/migrations/20261029000000_create_chat_reactions.sql`. This migration creates the table, indexes, row-level security policies, and public read/insert grants. Never place a service-role key in browser configuration.
