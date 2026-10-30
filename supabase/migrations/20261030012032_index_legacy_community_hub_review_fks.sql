-- Cover reviewer/author foreign keys in the legacy Tacoma Community Hub tables.
CREATE INDEX IF NOT EXISTS community_hub_edit_suggestions_reviewed_by_idx
  ON public.community_hub_edit_suggestions (reviewed_by);
CREATE INDEX IF NOT EXISTS community_hub_listing_history_created_by_idx
  ON public.community_hub_listing_history (created_by);
CREATE INDEX IF NOT EXISTS community_hub_listing_reports_reviewed_by_idx
  ON public.community_hub_listing_reports (reviewed_by);
CREATE INDEX IF NOT EXISTS community_hub_submissions_reviewed_by_idx
  ON public.community_hub_submissions (reviewed_by);
