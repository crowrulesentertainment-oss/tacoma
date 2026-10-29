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


## Moderator chat removal migration (added 2026-10-29)

The moderator Control Room can remove chat messages. The live Supabase project has the matching moderator-only row-level security policy applied. For a fresh environment, run `supabase/migrations/20261029010000_moderator_chat_delete.sql` after the base Hub schema. The policy permits deletes only when the signed-in user has a row in `public.hub_admins`; anonymous visitors do not receive a delete policy.


## Public submission and chat spam controls (added 2026-10-29)

The migration `supabase/migrations/20261029020000_public_spam_protection.sql` is applied to the live Supabase project. It adds server-side insert triggers for listing submissions, chat messages and reports; normalizes user-entered text; forces public listing inserts to `pending`; forces reports to `open`; validates URL/date/chat-room fields; and applies per-browser-token cooldowns (60 seconds for listings, 15 seconds for chat, 30 seconds for reports). The private throttle table is not readable or writable by anonymous/authenticated clients and stale rows are cleaned up after seven days.

The public forms also use a honeypot and a short minimum interaction time, and the browser disables duplicate submissions while requests are in flight. These controls reduce casual spam but a browser UUID can be changed by a determined bot. For stronger abuse resistance, the next security step is an Edge Function with IP-based throttling and a CAPTCHA/Turnstile verification secret; do not put CAPTCHA secrets or service-role keys in GitHub Pages JavaScript.

### Workflow checks performed

A transaction-based Supabase test confirmed anonymous-role inserts for listings, chat messages and reports pass the intended policies; public listing inserts are forced to `pending`; public visitors cannot read pending listings; an approved listing is visible to the public; and repeated writes with the same token are throttled. Test records were rolled back or removed, so the checks did not publish test content.
