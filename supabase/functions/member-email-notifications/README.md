# Member email notification worker

Deployed Supabase Edge Function: `member-email-notifications`.

Required Supabase Edge Function secrets:
- `BREVO_API_KEY`
- `HUB_EMAIL_FROM` (verified sender address in Brevo)
- `HUB_EMAIL_CRON_SECRET` (long random secret for the scheduler)

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Keep the service role key server-side only.

Invoke `POST https://cevylpnoexugwgygvtgu.supabase.co/functions/v1/member-email-notifications` on a schedule with header `x-hub-cron-secret: <HUB_EMAIL_CRON_SECRET>`. Use a scheduler/cron secret store, not browser JavaScript. The function only sends to members who opted in, filters notification categories by their preferences, and includes an unsubscribe link.

Email sending is not active until the required secrets are configured and a scheduler invokes the worker. No notification emails are sent merely by saving preferences.

## Finish setup (required before delivery)

1. In Supabase Dashboard → Edge Functions → Secrets, add:
   - `BREVO_API_KEY`: your Brevo transactional email API key.
   - `HUB_EMAIL_FROM`: the exact sender email address verified in Brevo.
   - `HUB_EMAIL_CRON_SECRET`: a long, random secret used only by the scheduler and this worker.
   Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Never put the service-role key in GitHub Pages or the repository.

2. In GitHub → repository Settings → Secrets and variables → Actions → New repository secret, create `HUB_EMAIL_CRON_SECRET` with the exact same value used in Supabase. Do not commit or paste the secret into source files.

3. In GitHub → Actions, enable workflows if prompted. The workflow `.github/workflows/member-email-notifications.yml` invokes the worker every 15 minutes and can also be run manually with **Run workflow**.

4. Verify the sender domain/address and send a controlled test to an account you own. Review the workflow run and Supabase Edge Function logs before relying on delivery.

## Important behavior

- The worker only sends notifications that already exist in `hub_member_activity`, whose owner has opted in, and whose selected category is enabled.
- The current activity generator runs when a member opens or refreshes the member dashboard. Therefore the scheduler sends pending items, but does not independently discover activity while a member is away. A future server-side activity-generation job is needed for fully proactive reminders and matches.
- Unsubscribe turns off all email categories for the token. A member can opt in again from their dashboard.
- A failed delivery is logged in `email_error`; successful sends set `email_sent_at`.
