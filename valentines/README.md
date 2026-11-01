# Love Is Local — Tacoma Valentine's Day

An annual Tacoma Community Hub and Tacoma Nights community celebration, presented by CrowRules Entertainment.

**Tagline:** Celebrating Tacoma. Connecting Neighbors. Sharing Love.

## Public experience

- Main page: https://crowrulesentertainment-oss.github.io/crowrulesentertainment/tacoma-nights/valentines/
- Submission Center: https://crowrulesentertainment-oss.github.io/crowrulesentertainment/tacoma-nights/valentines/submit.html
- Admin Control Room: https://crowrulesentertainment-oss.github.io/crowrulesentertainment/tacoma-nights/valentines/admin.html

## Annual tradition

Love Is Local is held every February 14. The website stays online year-round and automatically counts down to the next February 14 using Tacoma/Pacific time. Every season has its own year, status, theme and highlights. The public page shows the upcoming season, approved content for that season, a moderated local-partner photo gallery and the season archive.

The Supabase database contains:
- `valentines_seasons` — annual season records and archive highlights.
- `valentines_submissions` — business, event, Love Wall and story submissions.
- `valentines_submission_contacts` — private submitter contact emails.
- `valentines_featured_listings` — approved local partner directory and gallery images.

2027 is seeded as open for submissions; 2028 is seeded as planning. New submissions and featured listings receive the next upcoming February 14 season year by default, calculated in Pacific time.

## Live community features

- Supabase Realtime refreshes the public feed when submissions, featured listings or season records change.\n- The community calendar displays approved, dated event submissions with month navigation, category filtering, keyword search and day selection. Volunteer opportunities and family activities can be submitted as event categories; only approved listings appear.
- Only approved, consented submissions are shown publicly.
- Featured businesses appear only when published by an administrator.
- The gallery uses photographs added to published featured listings. Use only images the business or photographer has authorized CrowRules to publish.
- The annual archive displays each season's theme, status and highlights.
- The Admin Control Room includes submission moderation, featured listing management and Annual Seasons management.

## Admin and security

- Admin sign-in requires a trusted Supabase `app_metadata.role = admin`.
- Public visitors can submit content but cannot approve or edit it.
- Submitter emails are stored separately and are not readable by anonymous visitors.
- The public feed uses a security-invoker view over approved and consented submissions.
- The browser uses the Supabase publishable key only. Never put a service-role or secret key in GitHub Pages.

## Supabase setup

Project: `cevylpnoexugwgygvtgu`

The connected Supabase project already has the annual seasons table, season-year fields, seeded 2027/2028 records, public archive access and Realtime publication enabled for the three public content tables.

For a fresh setup, run `supabase-setup.sql` in the Supabase SQL Editor. It includes the base moderation schema and annual seasons extension.

## Annual operations

1. Before each February, create or update the next year's season in Admin Control Room → Annual Seasons.
2. Set the season to `open` when accepting submissions.
3. Review submissions and publish only approved content with permission.
4. Add authorized local business photographs to featured listings for the gallery.
5. During the event, set the season status to `live`.
6. After the celebration, enter the annual highlights and set the season status to `archived`.
7. Keep the site live and repeat for the next February 14.

## Related pages

- Tacoma Nights home: ../index.html
- Tacoma Nights Community Hub: ../community.html


## Personal Tacoma itinerary planner

Visitors can add the selected season's approved dated events and published featured local partners to a temporary personal itinerary, reorder or remove stops, copy it, or print it. The plan is not saved to Supabase or shared. No unverified events, prices, travel times, or offers are generated.
