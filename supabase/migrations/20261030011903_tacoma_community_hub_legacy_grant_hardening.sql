-- Close inherited browser-role DDL privileges on legacy Tacoma Community Hub tables.
-- These tables are not used by the current public client for TRUNCATE, REFERENCES or TRIGGER.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS table_ref
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND left(c.relname, 14) = 'community_hub_'
  LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE %s FROM anon, authenticated', r.table_ref);
  END LOOP;
END $$;
