-- ============================================================
-- Scheduled Publishing — vault_drafts.scheduled_publish_at
--
-- Adds the ability to schedule a draft for future publish instead of
-- publishing immediately. See:
--   src/app/api/admin/content-automation/drafts/[id]/route.ts (schedule action)
--   src/app/api/cron/publish-scheduled-drafts/route.ts (hourly cron that
--     publishes any draft whose scheduled_publish_at has passed)
--
-- The status CHECK constraint is widened to include 'scheduled' — required
-- for the schedule action to be able to set status='scheduled' at all. Not
-- requested explicitly, but the feature cannot function without it.
-- ============================================================

ALTER TABLE vault_drafts
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

ALTER TABLE vault_drafts
  DROP CONSTRAINT IF EXISTS vault_drafts_status_check;

ALTER TABLE vault_drafts
  ADD CONSTRAINT vault_drafts_status_check
  CHECK (status IN ('pending', 'published', 'discarded', 'scheduled'));

-- Partial index — the cron route's only query shape is
-- WHERE status = 'scheduled' AND scheduled_publish_at <= now().
CREATE INDEX IF NOT EXISTS idx_vault_drafts_scheduled_publish_at
  ON vault_drafts (scheduled_publish_at)
  WHERE status = 'scheduled';
