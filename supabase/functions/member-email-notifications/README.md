# Member email notification worker

Deployed Supabase Edge Function: `member-email-notifications`.

Required Supabase Edge Function secrets:
- `BREVO_API_KEY`
- `HUB_EMAIL_FROM` (verified sender address in Brevo)
- `HUB_EMAIL_CRON_SECRET` (long random secret for the scheduler)

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Keep the service role key server-side only.

Invoke `POST https://cevylpnoexugwgygvtgu.supabase.co/functions/v1/member-email-notifications` on a schedule with header `x-hub-cron-secret: <HUB_EMAIL_CRON_SECRET>`. Use a scheduler/cron secret store, not browser JavaScript. The function only sends to members who opted in, filters notification categories by their preferences, and includes an unsubscribe link.

Email sending is not active until the required secrets are configured and a scheduler invokes the worker. No notification emails are sent merely by saving preferences.