-- Keep only the two explicitly retained Tacoma Community Hub member profiles.
-- This removes rows from hub_member_profiles only; it does not delete Supabase Auth users
-- or their accounts in other CrowRules applications.
delete from public.hub_member_profiles
where display_name not in ('Jonathan Riehle', 'Jason Riehle');

-- Future Supabase Auth registrations are already handled by the existing
-- on_auth_user_created_community trigger and create_community_profile() function,
-- which inserts into hub_member_profiles with ON CONFLICT DO NOTHING.
