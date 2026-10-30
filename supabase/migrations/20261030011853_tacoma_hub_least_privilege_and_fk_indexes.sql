-- Least-privilege browser grants for Tacoma Community Hub.
-- RLS remains enabled; these grants only permit operations used by the public site.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS table_ref
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND (left(c.relname, 4) = 'hub_' OR left(c.relname, 13) = 'community_hub_')
  LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE %s FROM anon, authenticated', r.table_ref);
  END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON TABLE public.hub_admins FROM anon, authenticated;
GRANT SELECT ON TABLE public.hub_admins TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_chat_channels FROM anon, authenticated;
GRANT SELECT ON TABLE public.hub_chat_channels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.hub_chat_channels TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_chat_messages FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.hub_chat_messages TO anon, authenticated;
GRANT DELETE ON TABLE public.hub_chat_messages TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_chat_reactions FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.hub_chat_reactions TO anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_listings FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.hub_listings TO anon, authenticated;
GRANT UPDATE ON TABLE public.hub_listings TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_reports FROM anon, authenticated;
GRANT INSERT ON TABLE public.hub_reports TO anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.hub_reports TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_member_activity FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.hub_member_activity TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_member_email_preferences FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.hub_member_email_preferences TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_member_favorites FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.hub_member_favorites TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_member_profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.hub_member_profiles TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_moderation_audit FROM anon, authenticated;
GRANT SELECT ON TABLE public.hub_moderation_audit TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_site_settings FROM anon, authenticated;
GRANT SELECT ON TABLE public.hub_site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.hub_site_settings TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.hub_visitor_presence FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.hub_public_rate_limits FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.hub_member_email_delivery_ledger FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.hub_member_email_reconciliation_audit FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS hub_chat_messages_sender_id_idx ON public.hub_chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS hub_moderation_audit_moderator_id_idx ON public.hub_moderation_audit (moderator_id);
CREATE INDEX IF NOT EXISTS hub_site_settings_updated_by_idx ON public.hub_site_settings (updated_by);
CREATE INDEX IF NOT EXISTS hub_visitor_presence_user_id_idx ON public.hub_visitor_presence (user_id);
